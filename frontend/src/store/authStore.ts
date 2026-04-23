// ============================================================================
// STORE DE AUTENTICACIÓN - Manejo del estado del usuario
// ============================================================================
// Usamos Zustand para manejar el estado global de la autenticación.
// Aquí guardamos la información del usuario logueado y el token.
// ============================================================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as api from '../services/api';

// Definimos el tipo de datos del usuario
interface User {
  id: string;
  nombre: string;
  email: string;
  foto_perfil?: string | null;
  fecha_registro: string;
}

// Definimos el estado y las acciones del store
interface AuthState {
  // Estado
  user: User | null;           // Usuario actual (null si no está logueado)
  token: string | null;        // Token de autenticación
  isLoading: boolean;          // Indica si está cargando
  isAuthenticated: boolean;    // Indica si está autenticado
  
  // Acciones
  login: (email: string, password: string) => Promise<void>;
  register: (nombre: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

// Creamos el store con Zustand
export const useAuthStore = create<AuthState>((set, get) => ({
  // --- Estado inicial ---
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  // --- Acción: Iniciar sesión ---
  login: async (email: string, password: string) => {
    try {
      // Llamamos a la API para iniciar sesión
      const response = await api.login(email, password);
      
      // Guardamos el token en AsyncStorage (memoria persistente)
      await AsyncStorage.setItem('token', response.token);
      
      // Actualizamos el estado
      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      // Si hay error, lo lanzamos para manejarlo en la UI
      throw new Error(error.response?.data?.detail || 'Error al iniciar sesión');
    }
  },

  // --- Acción: Registrar nuevo usuario ---
  register: async (nombre: string, email: string, password: string) => {
    try {
      // Llamamos a la API para registrar
      const response = await api.register(nombre, email, password);
      
      // Guardamos el token
      await AsyncStorage.setItem('token', response.token);
      
      // Actualizamos el estado (el usuario queda logueado automáticamente)
      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Error al registrarse');
    }
  },

  // --- Acción: Cerrar sesión ---
  logout: async () => {
    // Eliminamos el token guardado
    await AsyncStorage.removeItem('token');
    
    // Limpiamos el estado
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  // --- Acción: Cargar autenticación guardada ---
  // Esta función se llama al iniciar la app para verificar si hay sesión guardada
  loadStoredAuth: async () => {
    try {
      // Buscamos el token guardado
      const token = await AsyncStorage.getItem('token');
      
      if (token) {
        // Si hay token, intentamos obtener el perfil del usuario
        const user = await api.getProfile();
        
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        // No hay sesión guardada
        set({ isLoading: false });
      }
    } catch (error) {
      // Si hay error (token inválido), limpiamos todo
      await AsyncStorage.removeItem('token');
      set({ isLoading: false });
    }
  },

  // --- Acción: Actualizar datos del usuario ---
  updateUser: (data: Partial<User>) => {
    const currentUser = get().user;
    if (currentUser) {
      set({ user: { ...currentUser, ...data } });
    }
  },
}));
