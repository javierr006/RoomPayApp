// ============================================================================
// SERVICIO DE API - Comunicación con el backend
// ============================================================================
// Este archivo contiene todas las funciones para comunicarse con el servidor.
// Usamos axios para hacer las peticiones HTTP.
// ============================================================================

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL base del backend (viene de las variables de entorno)
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

// Creamos una instancia de axios con la configuración base
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token a todas las peticiones
// Se ejecuta automáticamente antes de cada request
api.interceptors.request.use(
  async (config) => {
    // Obtenemos el token guardado
    const token = await AsyncStorage.getItem('token');
    if (token) {
      // Agregamos el token al header de autorización
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================================================

// Registrar un nuevo usuario
export const register = async (nombre: string, email: string, password: string) => {
  const response = await api.post('/auth/register', { nombre, email, password });
  return response.data;
};

// Iniciar sesión
export const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

// Obtener perfil del usuario actual
export const getProfile = async () => {
  const response = await api.get('/users/me');
  return response.data;
};

// Actualizar perfil del usuario
export const updateProfile = async (data: { nombre?: string; foto_perfil?: string }) => {
  const response = await api.put('/users/me', data);
  return response.data;
};

// ============================================================================
// FUNCIONES DE GRUPOS
// ============================================================================

// Crear un nuevo grupo
export const createGroup = async (nombre: string, descripcion?: string) => {
  const response = await api.post('/groups', { nombre, descripcion });
  return response.data;
};

// Obtener todos los grupos del usuario
export const getGroups = async () => {
  const response = await api.get('/groups');
  return response.data;
};

// Obtener detalles de un grupo específico
export const getGroup = async (groupId: string) => {
  const response = await api.get(`/groups/${groupId}`);
  return response.data;
};

// Unirse a un grupo con código de invitación
export const joinGroup = async (codigo: string) => {
  const response = await api.post('/groups/join', { codigo });
  return response.data;
};

// ============================================================================
// FUNCIONES DE GASTOS
// ============================================================================

// Crear un nuevo gasto
export const createExpense = async (data: {
  grupo_id: string;
  descripcion: string;
  monto: number;
  categoria?: string;
  dividir_entre?: string[];
  division_manual?: Record<string, number>;
}) => {
  const response = await api.post('/expenses', data);
  return response.data;
};

// Obtener gastos de un grupo
export const getGroupExpenses = async (groupId: string) => {
  const response = await api.get(`/expenses/group/${groupId}`);
  return response.data;
};

// Registrar un pago
export const payExpense = async (expenseId: string, monto: number) => {
  const response = await api.post(`/expenses/${expenseId}/pay`, { gasto_id: expenseId, monto });
  return response.data;
};

// ============================================================================
// FUNCIONES DE BALANCES
// ============================================================================

// Obtener balances de un grupo
export const getGroupBalances = async (groupId: string) => {
  const response = await api.get(`/balances/group/${groupId}`);
  return response.data;
};

// ============================================================================
// FUNCIONES DE NOTIFICACIONES
// ============================================================================

// Obtener notificaciones del usuario
export const getNotifications = async () => {
  const response = await api.get('/notifications');
  return response.data;
};

// Marcar notificación como leída
export const markNotificationRead = async (notificationId: string) => {
  const response = await api.put(`/notifications/${notificationId}/read`);
  return response.data;
};

// Marcar todas las notificaciones como leídas
export const markAllNotificationsRead = async () => {
  const response = await api.put('/notifications/read-all');
  return response.data;
};

// ============================================================================
// FUNCIONES DE RECORDATORIOS
// ============================================================================

// Enviar un recordatorio de pago
export const sendReminder = async (grupoId: string, usuarioDestinoId: string, mensaje?: string) => {
  const response = await api.post('/reminders', {
    grupo_id: grupoId,
    usuario_destino_id: usuarioDestinoId,
    mensaje,
  });
  return response.data;
};

// ============================================================================
// FUNCIONES DE ROOMMATES
// ============================================================================

// Obtener listado de roommates disponibles
export const getRoommates = async () => {
  const response = await api.get('/roommates');
  return response.data;
};

// Verificar estado del servidor
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
