# ============================================================================
# RoomPay Backend - API para gestión de gastos compartidos entre roomies
# ============================================================================
# Este archivo contiene toda la lógica del servidor backend.
# Usamos FastAPI para crear la API REST y MongoDB para la base de datos.
# ============================================================================

from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import bcrypt
import jwt

# ----------------------------------------------------------------------------
# Configuración inicial - Cargamos variables de entorno
# ----------------------------------------------------------------------------
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Conexión a MongoDB - La base de datos donde guardamos todo
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'roompay_db')]

# Clave secreta para crear tokens JWT (autenticación)
SECRET_KEY = os.environ.get('JWT_SECRET', 'roompay_secret_key_2024')
ALGORITHM = "HS256"

# Creamos la aplicación FastAPI
app = FastAPI(title="RoomPay API", description="API para gestión de gastos compartidos")

# Router con prefijo /api para todas las rutas
api_router = APIRouter(prefix="/api")

# Sistema de seguridad para verificar tokens
security = HTTPBearer()

# Configuración de logs para ver errores
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================================
# MODELOS DE DATOS - Definen la estructura de la información
# ============================================================================

# --- Modelos de Usuario ---
class UserCreate(BaseModel):
    """Datos necesarios para registrar un nuevo usuario"""
    nombre: str  # Nombre completo del usuario
    email: EmailStr  # Email válido
    password: str  # Contraseña (se encriptará)

class UserLogin(BaseModel):
    """Datos para iniciar sesión"""
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    """Información del usuario que devolvemos (sin contraseña)"""
    id: str
    nombre: str
    email: str
    foto_perfil: Optional[str] = None  # Foto en base64
    fecha_registro: datetime

class UserUpdate(BaseModel):
    """Datos que el usuario puede actualizar"""
    nombre: Optional[str] = None
    foto_perfil: Optional[str] = None

# --- Modelos de Grupo ---
class GroupCreate(BaseModel):
    """Datos para crear un nuevo grupo de roomies"""
    nombre: str  # Nombre del grupo (ej: "Departamento Centro")
    descripcion: Optional[str] = None  # Descripción opcional

class GroupResponse(BaseModel):
    """Información completa de un grupo"""
    id: str
    nombre: str
    descripcion: Optional[str] = None
    miembros: List[dict]  # Lista de miembros con su info
    codigo_invitacion: str  # Código para unirse al grupo
    creado_por: str  # ID del creador
    fecha_creacion: datetime

class GroupJoin(BaseModel):
    """Para unirse a un grupo con código"""
    codigo: str

# --- Modelos de Gasto ---
class ExpenseCreate(BaseModel):
    """Datos para crear un nuevo gasto"""
    grupo_id: str  # A qué grupo pertenece
    descripcion: str  # Qué se compró (ej: "Supermercado")
    monto: float  # Cuánto costó
    categoria: str = "general"  # Categoría del gasto
    dividir_entre: Optional[List[str]] = None  # IDs de usuarios (si es None, todos)
    division_manual: Optional[dict] = None  # División personalizada {user_id: monto}

class ExpenseResponse(BaseModel):
    """Información completa de un gasto"""
    id: str
    grupo_id: str
    descripcion: str
    monto: float
    categoria: str
    pagado_por: dict  # Info del usuario que pagó
    dividido_entre: List[dict]  # Lista de deudores con montos
    fecha: datetime
    estado: str  # Estado general del gasto

# --- Modelos de Pago ---
class PaymentCreate(BaseModel):
    """Para registrar un pago"""
    gasto_id: str
    monto: float  # Monto que se paga

class PaymentResponse(BaseModel):
    """Información de un pago"""
    id: str
    gasto_id: str
    usuario_id: str
    monto_pagado: float
    monto_total: float
    estado: str  # solvente, pendiente, parcial, atrasado
    fecha_pago: Optional[datetime] = None

# --- Modelos de Balance ---
class BalanceResponse(BaseModel):
    """Balance de un usuario en el grupo"""
    usuario: dict
    total_debe: float  # Lo que debe a otros
    total_le_deben: float  # Lo que otros le deben
    balance_neto: float  # Diferencia (positivo = le deben, negativo = debe)
    estado: str  # solvente, pendiente, parcial, atrasado
    detalles: List[dict]  # Detalle de cada deuda

# --- Modelos de Notificación ---
class NotificationResponse(BaseModel):
    """Una notificación para el usuario"""
    id: str
    tipo: str  # gasto_nuevo, recordatorio, pago_recibido
    titulo: str
    mensaje: str
    fecha: datetime
    leido: bool
    datos: Optional[dict] = None

# --- Modelos de Recordatorio ---
class ReminderCreate(BaseModel):
    """Para crear un recordatorio de pago"""
    grupo_id: str
    usuario_destino_id: str  # A quién le recordamos
    mensaje: Optional[str] = None

# --- Modelos de Roommate (Listados) ---
class RoommateResponse(BaseModel):
    """Información de un roommate disponible"""
    id: str
    nombre: str
    edad: int
    descripcion: str
    ubicacion: str
    presupuesto_min: float
    presupuesto_max: float
    ocupacion: str
    intereses: List[str]
    foto: Optional[str] = None
    contacto: str
    disponible: bool

# ============================================================================
# FUNCIONES AUXILIARES - Helpers para tareas comunes
# ============================================================================

def hash_password(password: str) -> str:
    """Encripta una contraseña para guardarla segura"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verifica si una contraseña coincide con su versión encriptada"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    """Crea un token JWT para autenticar al usuario"""
    # El token expira en 7 días
    expiration = datetime.utcnow() + timedelta(days=7)
    payload = {
        "user_id": user_id,
        "exp": expiration
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Obtiene el usuario actual a partir del token JWT"""
    try:
        # Decodificamos el token
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        
        # Buscamos el usuario en la base de datos
        user = await db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

def generate_invite_code() -> str:
    """Genera un código único de 6 caracteres para invitar al grupo"""
    import random
    import string
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

def get_payment_status(monto_pagado: float, monto_total: float, fecha_gasto: datetime) -> str:
    """Determina el estado de un pago"""
    if monto_pagado >= monto_total:
        return "solvente"  # Pagó todo
    elif monto_pagado > 0:
        return "parcial"  # Pagó algo
    elif datetime.utcnow() > fecha_gasto + timedelta(days=7):
        return "atrasado"  # Pasó una semana sin pagar
    else:
        return "pendiente"  # Aún no paga pero está a tiempo

# ============================================================================
# ENDPOINTS DE AUTENTICACIÓN
# ============================================================================

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    """
    Registra un nuevo usuario en el sistema.
    Encripta la contraseña y guarda los datos en MongoDB.
    """
    # Verificamos si el email ya existe
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Este email ya está registrado")
    
    # Creamos el nuevo usuario
    user_id = str(uuid.uuid4())
    new_user = {
        "id": user_id,
        "nombre": user_data.nombre,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "foto_perfil": None,
        "fecha_registro": datetime.utcnow()
    }
    
    # Guardamos en la base de datos
    await db.users.insert_one(new_user)
    
    # Creamos el token de acceso
    token = create_token(user_id)
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "nombre": new_user["nombre"],
            "email": new_user["email"],
            "foto_perfil": None,
            "fecha_registro": new_user["fecha_registro"].isoformat()
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    """
    Inicia sesión con email y contraseña.
    Devuelve un token JWT si las credenciales son correctas.
    """
    # Buscamos el usuario por email
    user = await db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    # Verificamos la contraseña
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    # Creamos el token
    token = create_token(user["id"])
    
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "nombre": user["nombre"],
            "email": user["email"],
            "foto_perfil": user.get("foto_perfil"),
            "fecha_registro": user["fecha_registro"].isoformat()
        }
    }

# ============================================================================
# ENDPOINTS DE USUARIO
# ============================================================================

@api_router.get("/users/me")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Obtiene el perfil del usuario actual"""
    return {
        "id": current_user["id"],
        "nombre": current_user["nombre"],
        "email": current_user["email"],
        "foto_perfil": current_user.get("foto_perfil"),
        "fecha_registro": current_user["fecha_registro"].isoformat()
    }

@api_router.put("/users/me")
async def update_profile(update_data: UserUpdate, current_user: dict = Depends(get_current_user)):
    """Actualiza el perfil del usuario actual"""
    # Preparamos los datos a actualizar
    update_fields = {}
    if update_data.nombre:
        update_fields["nombre"] = update_data.nombre
    if update_data.foto_perfil is not None:
        update_fields["foto_perfil"] = update_data.foto_perfil
    
    if update_fields:
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": update_fields}
        )
    
    # Devolvemos el usuario actualizado
    updated_user = await db.users.find_one({"id": current_user["id"]})
    return {
        "id": updated_user["id"],
        "nombre": updated_user["nombre"],
        "email": updated_user["email"],
        "foto_perfil": updated_user.get("foto_perfil"),
        "fecha_registro": updated_user["fecha_registro"].isoformat()
    }

# ============================================================================
# ENDPOINTS DE GRUPOS
# ============================================================================

@api_router.post("/groups")
async def create_group(group_data: GroupCreate, current_user: dict = Depends(get_current_user)):
    """
    Crea un nuevo grupo de roomies.
    El creador es automáticamente el primer miembro.
    """
    group_id = str(uuid.uuid4())
    
    # Creamos el grupo
    new_group = {
        "id": group_id,
        "nombre": group_data.nombre,
        "descripcion": group_data.descripcion,
        "miembros": [current_user["id"]],  # El creador es el primer miembro
        "codigo_invitacion": generate_invite_code(),
        "creado_por": current_user["id"],
        "fecha_creacion": datetime.utcnow()
    }
    
    await db.groups.insert_one(new_group)
    
    # Preparamos la respuesta con info de miembros
    return await get_group_with_members(new_group)

@api_router.get("/groups")
async def list_groups(current_user: dict = Depends(get_current_user)):
    """Lista todos los grupos donde el usuario es miembro"""
    # Buscamos grupos donde el usuario es miembro
    groups = await db.groups.find({"miembros": current_user["id"]}).to_list(100)
    
    result = []
    for group in groups:
        group_data = await get_group_with_members(group)
        result.append(group_data)
    
    return result

@api_router.get("/groups/{group_id}")
async def get_group(group_id: str, current_user: dict = Depends(get_current_user)):
    """Obtiene los detalles de un grupo específico"""
    group = await db.groups.find_one({"id": group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")
    
    # Verificamos que el usuario sea miembro
    if current_user["id"] not in group["miembros"]:
        raise HTTPException(status_code=403, detail="No eres miembro de este grupo")
    
    return await get_group_with_members(group)

@api_router.post("/groups/join")
async def join_group(join_data: GroupJoin, current_user: dict = Depends(get_current_user)):
    """Únete a un grupo usando el código de invitación"""
    # Buscamos el grupo por código
    group = await db.groups.find_one({"codigo_invitacion": join_data.codigo.upper()})
    if not group:
        raise HTTPException(status_code=404, detail="Código de invitación inválido")
    
    # Verificamos si ya es miembro
    if current_user["id"] in group["miembros"]:
        raise HTTPException(status_code=400, detail="Ya eres miembro de este grupo")
    
    # Agregamos al usuario como miembro
    await db.groups.update_one(
        {"id": group["id"]},
        {"$push": {"miembros": current_user["id"]}}
    )
    
    # Creamos notificación para los demás miembros
    for member_id in group["miembros"]:
        await create_notification(
            member_id,
            "nuevo_miembro",
            "Nuevo roomie",
            f"{current_user['nombre']} se unió al grupo {group['nombre']}",
            {"grupo_id": group["id"]}
        )
    
    # Devolvemos el grupo actualizado
    updated_group = await db.groups.find_one({"id": group["id"]})
    return await get_group_with_members(updated_group)

async def get_group_with_members(group: dict) -> dict:
    """Función auxiliar que obtiene un grupo con la info de sus miembros"""
    members_info = []
    for member_id in group["miembros"]:
        user = await db.users.find_one({"id": member_id})
        if user:
            members_info.append({
                "id": user["id"],
                "nombre": user["nombre"],
                "foto_perfil": user.get("foto_perfil")
            })
    
    return {
        "id": group["id"],
        "nombre": group["nombre"],
        "descripcion": group.get("descripcion"),
        "miembros": members_info,
        "codigo_invitacion": group["codigo_invitacion"],
        "creado_por": group["creado_por"],
        "fecha_creacion": group["fecha_creacion"].isoformat()
    }

# ============================================================================
# ENDPOINTS DE GASTOS
# ============================================================================

@api_router.post("/expenses")
async def create_expense(expense_data: ExpenseCreate, current_user: dict = Depends(get_current_user)):
    """
    Crea un nuevo gasto y lo divide entre los miembros.
    Puede dividirse equitativamente o de forma manual.
    """
    # Verificamos que el grupo existe y el usuario es miembro
    group = await db.groups.find_one({"id": expense_data.grupo_id})
    if not group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")
    if current_user["id"] not in group["miembros"]:
        raise HTTPException(status_code=403, detail="No eres miembro de este grupo")
    
    expense_id = str(uuid.uuid4())
    
    # Determinamos entre quiénes se divide
    if expense_data.dividir_entre:
        divisores = expense_data.dividir_entre
    else:
        divisores = group["miembros"]  # Todos los miembros
    
    # Calculamos la división
    divisiones = []
    if expense_data.division_manual:
        # División manual
        for user_id, monto in expense_data.division_manual.items():
            if user_id != current_user["id"]:  # El que paga no se debe a sí mismo
                divisiones.append({
                    "usuario_id": user_id,
                    "monto": monto,
                    "monto_pagado": 0,
                    "estado": "pendiente"
                })
    else:
        # División equitativa
        monto_por_persona = expense_data.monto / len(divisores)
        for user_id in divisores:
            if user_id != current_user["id"]:  # El que paga no se debe a sí mismo
                divisiones.append({
                    "usuario_id": user_id,
                    "monto": round(monto_por_persona, 2),
                    "monto_pagado": 0,
                    "estado": "pendiente"
                })
    
    # Creamos el gasto
    new_expense = {
        "id": expense_id,
        "grupo_id": expense_data.grupo_id,
        "descripcion": expense_data.descripcion,
        "monto": expense_data.monto,
        "categoria": expense_data.categoria,
        "pagado_por": current_user["id"],
        "divisiones": divisiones,
        "fecha": datetime.utcnow()
    }
    
    await db.expenses.insert_one(new_expense)
    
    # Notificamos a los deudores
    for division in divisiones:
        await create_notification(
            division["usuario_id"],
            "gasto_nuevo",
            "Nuevo gasto",
            f"{current_user['nombre']} agregó un gasto: {expense_data.descripcion} (${division['monto']:.2f})",
            {"gasto_id": expense_id, "grupo_id": expense_data.grupo_id}
        )
    
    return await get_expense_with_details(new_expense)

@api_router.get("/expenses/group/{group_id}")
async def list_group_expenses(group_id: str, current_user: dict = Depends(get_current_user)):
    """Lista todos los gastos de un grupo"""
    # Verificamos acceso al grupo
    group = await db.groups.find_one({"id": group_id})
    if not group or current_user["id"] not in group["miembros"]:
        raise HTTPException(status_code=403, detail="No tienes acceso a este grupo")
    
    # Obtenemos los gastos ordenados por fecha (más recientes primero)
    expenses = await db.expenses.find({"grupo_id": group_id}).sort("fecha", -1).to_list(100)
    
    result = []
    for expense in expenses:
        result.append(await get_expense_with_details(expense))
    
    return result

@api_router.post("/expenses/{expense_id}/pay")
async def pay_expense(expense_id: str, payment: PaymentCreate, current_user: dict = Depends(get_current_user)):
    """
    Registra un pago parcial o total de un gasto.
    Actualiza el estado según el monto pagado.
    """
    # Buscamos el gasto
    expense = await db.expenses.find_one({"id": expense_id})
    if not expense:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    
    # Buscamos la división correspondiente al usuario
    division_index = None
    for i, div in enumerate(expense["divisiones"]):
        if div["usuario_id"] == current_user["id"]:
            division_index = i
            break
    
    if division_index is None:
        raise HTTPException(status_code=400, detail="No tienes deuda en este gasto")
    
    # Actualizamos el pago
    division = expense["divisiones"][division_index]
    nuevo_monto_pagado = division["monto_pagado"] + payment.monto
    nuevo_estado = get_payment_status(nuevo_monto_pagado, division["monto"], expense["fecha"])
    
    # Actualizamos en la base de datos
    await db.expenses.update_one(
        {"id": expense_id, f"divisiones.{division_index}.usuario_id": current_user["id"]},
        {"$set": {
            f"divisiones.{division_index}.monto_pagado": nuevo_monto_pagado,
            f"divisiones.{division_index}.estado": nuevo_estado,
            f"divisiones.{division_index}.fecha_pago": datetime.utcnow() if nuevo_estado == "solvente" else None
        }}
    )
    
    # Notificamos al acreedor
    await create_notification(
        expense["pagado_por"],
        "pago_recibido",
        "Pago recibido",
        f"{current_user['nombre']} pagó ${payment.monto:.2f} del gasto: {expense['descripcion']}",
        {"gasto_id": expense_id}
    )
    
    return {
        "mensaje": "Pago registrado exitosamente",
        "nuevo_estado": nuevo_estado,
        "monto_pagado": nuevo_monto_pagado,
        "monto_restante": max(0, division["monto"] - nuevo_monto_pagado)
    }

async def get_expense_with_details(expense: dict) -> dict:
    """Obtiene un gasto con toda la información de usuarios"""
    # Info del pagador
    payer = await db.users.find_one({"id": expense["pagado_por"]})
    payer_info = {
        "id": payer["id"],
        "nombre": payer["nombre"],
        "foto_perfil": payer.get("foto_perfil")
    } if payer else {"id": expense["pagado_por"], "nombre": "Usuario desconocido"}
    
    # Info de los deudores
    divisiones_info = []
    all_paid = True
    for div in expense.get("divisiones", []):
        user = await db.users.find_one({"id": div["usuario_id"]})
        # Recalculamos el estado
        estado = get_payment_status(div["monto_pagado"], div["monto"], expense["fecha"])
        if estado != "solvente":
            all_paid = False
        divisiones_info.append({
            "usuario": {
                "id": user["id"] if user else div["usuario_id"],
                "nombre": user["nombre"] if user else "Usuario desconocido",
                "foto_perfil": user.get("foto_perfil") if user else None
            },
            "monto": div["monto"],
            "monto_pagado": div["monto_pagado"],
            "estado": estado
        })
    
    return {
        "id": expense["id"],
        "grupo_id": expense["grupo_id"],
        "descripcion": expense["descripcion"],
        "monto": expense["monto"],
        "categoria": expense["categoria"],
        "pagado_por": payer_info,
        "dividido_entre": divisiones_info,
        "fecha": expense["fecha"].isoformat(),
        "estado": "solvente" if all_paid else "pendiente"
    }

# ============================================================================
# ENDPOINTS DE BALANCES
# ============================================================================

@api_router.get("/balances/group/{group_id}")
async def get_group_balances(group_id: str, current_user: dict = Depends(get_current_user)):
    """
    Calcula los balances de todos los miembros del grupo.
    Muestra quién debe a quién y cuánto.
    """
    # Verificamos acceso
    group = await db.groups.find_one({"id": group_id})
    if not group or current_user["id"] not in group["miembros"]:
        raise HTTPException(status_code=403, detail="No tienes acceso a este grupo")
    
    # Obtenemos todos los gastos del grupo
    expenses = await db.expenses.find({"grupo_id": group_id}).to_list(1000)
    
    # Calculamos balances para cada miembro
    balances = {}
    for member_id in group["miembros"]:
        balances[member_id] = {
            "debe": {},  # A quién debe y cuánto
            "le_deben": {}  # Quién le debe y cuánto
        }
    
    # Procesamos cada gasto
    for expense in expenses:
        payer_id = expense["pagado_por"]
        for division in expense.get("divisiones", []):
            debtor_id = division["usuario_id"]
            monto_pendiente = division["monto"] - division["monto_pagado"]
            
            if monto_pendiente > 0:
                # El deudor debe al pagador
                if payer_id not in balances[debtor_id]["debe"]:
                    balances[debtor_id]["debe"][payer_id] = 0
                balances[debtor_id]["debe"][payer_id] += monto_pendiente
                
                # Al pagador le debe el deudor
                if debtor_id not in balances[payer_id]["le_deben"]:
                    balances[payer_id]["le_deben"][debtor_id] = 0
                balances[payer_id]["le_deben"][debtor_id] += monto_pendiente
    
    # Preparamos la respuesta
    result = []
    for member_id in group["miembros"]:
        user = await db.users.find_one({"id": member_id})
        
        total_debe = sum(balances[member_id]["debe"].values())
        total_le_deben = sum(balances[member_id]["le_deben"].values())
        balance_neto = total_le_deben - total_debe
        
        # Determinamos el estado
        if total_debe == 0 and total_le_deben == 0:
            estado = "solvente"
        elif total_debe == 0:
            estado = "solvente"
        elif total_le_deben > total_debe:
            estado = "parcial"
        else:
            estado = "pendiente"
        
        # Detalles de deudas
        detalles = []
        for creditor_id, monto in balances[member_id]["debe"].items():
            creditor = await db.users.find_one({"id": creditor_id})
            detalles.append({
                "tipo": "debe",
                "usuario": {
                    "id": creditor_id,
                    "nombre": creditor["nombre"] if creditor else "Desconocido"
                },
                "monto": round(monto, 2)
            })
        
        for debtor_id, monto in balances[member_id]["le_deben"].items():
            debtor = await db.users.find_one({"id": debtor_id})
            detalles.append({
                "tipo": "le_deben",
                "usuario": {
                    "id": debtor_id,
                    "nombre": debtor["nombre"] if debtor else "Desconocido"
                },
                "monto": round(monto, 2)
            })
        
        result.append({
            "usuario": {
                "id": member_id,
                "nombre": user["nombre"] if user else "Desconocido",
                "foto_perfil": user.get("foto_perfil") if user else None
            },
            "total_debe": round(total_debe, 2),
            "total_le_deben": round(total_le_deben, 2),
            "balance_neto": round(balance_neto, 2),
            "estado": estado,
            "detalles": detalles
        })
    
    return result

# ============================================================================
# ENDPOINTS DE NOTIFICACIONES
# ============================================================================

@api_router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    """Obtiene todas las notificaciones del usuario"""
    notifications = await db.notifications.find(
        {"usuario_id": current_user["id"]}
    ).sort("fecha", -1).to_list(50)
    
    return [{
        "id": n["id"],
        "tipo": n["tipo"],
        "titulo": n["titulo"],
        "mensaje": n["mensaje"],
        "fecha": n["fecha"].isoformat(),
        "leido": n.get("leido", False),
        "datos": n.get("datos")
    } for n in notifications]

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    """Marca una notificación como leída"""
    await db.notifications.update_one(
        {"id": notification_id, "usuario_id": current_user["id"]},
        {"$set": {"leido": True}}
    )
    return {"mensaje": "Notificación marcada como leída"}

@api_router.put("/notifications/read-all")
async def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    """Marca todas las notificaciones como leídas"""
    await db.notifications.update_many(
        {"usuario_id": current_user["id"]},
        {"$set": {"leido": True}}
    )
    return {"mensaje": "Todas las notificaciones marcadas como leídas"}

async def create_notification(user_id: str, tipo: str, titulo: str, mensaje: str, datos: dict = None):
    """Función auxiliar para crear notificaciones"""
    notification = {
        "id": str(uuid.uuid4()),
        "usuario_id": user_id,
        "tipo": tipo,
        "titulo": titulo,
        "mensaje": mensaje,
        "fecha": datetime.utcnow(),
        "leido": False,
        "datos": datos
    }
    await db.notifications.insert_one(notification)

# ============================================================================
# ENDPOINTS DE RECORDATORIOS
# ============================================================================

@api_router.post("/reminders")
async def create_reminder(reminder_data: ReminderCreate, current_user: dict = Depends(get_current_user)):
    """Envía un recordatorio de pago a otro usuario"""
    # Verificamos que ambos usuarios están en el grupo
    group = await db.groups.find_one({"id": reminder_data.grupo_id})
    if not group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")
    if current_user["id"] not in group["miembros"]:
        raise HTTPException(status_code=403, detail="No eres miembro de este grupo")
    if reminder_data.usuario_destino_id not in group["miembros"]:
        raise HTTPException(status_code=400, detail="El usuario destino no es miembro del grupo")
    
    # Creamos la notificación de recordatorio
    mensaje = reminder_data.mensaje or f"{current_user['nombre']} te recuerda que tienes pagos pendientes"
    
    await create_notification(
        reminder_data.usuario_destino_id,
        "recordatorio",
        "Recordatorio de pago",
        mensaje,
        {"grupo_id": reminder_data.grupo_id, "de": current_user["id"]}
    )
    
    return {"mensaje": "Recordatorio enviado exitosamente"}

# ============================================================================
# ENDPOINTS DE ROOMMATES (Listados de ejemplo)
# ============================================================================

@api_router.get("/roommates")
async def list_roommates():
    """
    Lista roommates disponibles.
    Por ahora devuelve datos de ejemplo para el MVP.
    """
    # Datos de ejemplo para el MVP
    roommates_ejemplo = [
        {
            "id": "rm1",
            "nombre": "María García",
            "edad": 23,
            "descripcion": "Estudiante de medicina, ordenada y tranquila. Busco departamento cerca del centro.",
            "ubicacion": "Centro, CDMX",
            "presupuesto_min": 4000,
            "presupuesto_max": 6000,
            "ocupacion": "Estudiante",
            "intereses": ["Lectura", "Yoga", "Cocina"],
            "foto": None,
            "contacto": "maria.g@email.com",
            "disponible": True
        },
        {
            "id": "rm2",
            "nombre": "Carlos Rodríguez",
            "edad": 25,
            "descripcion": "Ingeniero de software, trabajo remoto. Busco lugar tranquilo con buena conexión a internet.",
            "ubicacion": "Condesa, CDMX",
            "presupuesto_min": 5000,
            "presupuesto_max": 8000,
            "ocupacion": "Ingeniero",
            "intereses": ["Videojuegos", "Ciclismo", "Tecnología"],
            "foto": None,
            "contacto": "carlos.r@email.com",
            "disponible": True
        },
        {
            "id": "rm3",
            "nombre": "Ana Martínez",
            "edad": 22,
            "descripcion": "Diseñadora gráfica, creativa y sociable. Busco roomies que disfruten convivir.",
            "ubicacion": "Roma Norte, CDMX",
            "presupuesto_min": 4500,
            "presupuesto_max": 7000,
            "ocupacion": "Diseñadora",
            "intereses": ["Arte", "Música", "Fiestas"],
            "foto": None,
            "contacto": "ana.m@email.com",
            "disponible": True
        },
        {
            "id": "rm4",
            "nombre": "Luis Hernández",
            "edad": 24,
            "descripcion": "Estudiante de posgrado en economía. Responsable con los gastos y muy organizado.",
            "ubicacion": "Coyoacán, CDMX",
            "presupuesto_min": 3500,
            "presupuesto_max": 5500,
            "ocupacion": "Estudiante de posgrado",
            "intereses": ["Cine", "Futbol", "Finanzas"],
            "foto": None,
            "contacto": "luis.h@email.com",
            "disponible": True
        },
        {
            "id": "rm5",
            "nombre": "Sofía López",
            "edad": 26,
            "descripcion": "Abogada junior, busco departamento compartido cerca del metro. Soy muy limpia y organizada.",
            "ubicacion": "Del Valle, CDMX",
            "presupuesto_min": 5500,
            "presupuesto_max": 8500,
            "ocupacion": "Abogada",
            "intereses": ["Running", "Vino", "Viajes"],
            "foto": None,
            "contacto": "sofia.l@email.com",
            "disponible": True
        }
    ]
    
    return roommates_ejemplo

# ============================================================================
# ENDPOINT DE SALUD
# ============================================================================

@api_router.get("/")
async def root():
    """Endpoint de prueba para verificar que la API funciona"""
    return {"message": "RoomPay API funcionando correctamente", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    """Verifica el estado de la API y la conexión a la base de datos"""
    try:
        # Verificamos conexión a MongoDB
        await db.command("ping")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": str(e)}

# ============================================================================
# CONFIGURACIÓN FINAL
# ============================================================================

# Incluimos el router en la app
app.include_router(api_router)

# Configuramos CORS para permitir requests desde cualquier origen
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Evento de cierre - cerramos la conexión a MongoDB
@app.on_event("shutdown")
async def shutdown_db_client():
    """Cierra la conexión a la base de datos cuando se apaga el servidor"""
    client.close()
