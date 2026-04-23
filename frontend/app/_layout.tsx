// ============================================================================
// LAYOUT PRINCIPAL - Configuración de navegación de la app
// ============================================================================
// Este archivo configura cómo se organizan las pantallas de la aplicación.
// Usamos expo-router para manejar la navegación entre pantallas.
// ============================================================================

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../src/store/authStore';
import { LoadingScreen } from '../src/components/LoadingScreen';
import { Colors } from '../src/constants/colors';

export default function RootLayout() {
  // Obtenemos el estado de autenticación
  const { isLoading, loadStoredAuth } = useAuthStore();

  // Al iniciar la app, verificamos si hay sesión guardada
  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Mientras carga, mostramos pantalla de carga
  if (isLoading) {
    return <LoadingScreen message="Cargando RoomPay..." />;
  }

  return (
    <>
      {/* Barra de estado del teléfono */}
      <StatusBar style="dark" />
      
      {/* Configuración del navegador de pantallas */}
      <Stack
        screenOptions={{
          // Ocultamos el header por defecto
          headerShown: false,
          // Color de fondo de las pantallas
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        {/* Pantalla de inicio/welcome */}
        <Stack.Screen name="index" />
        
        {/* Pantallas de autenticación */}
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/register" />
        
        {/* Pantallas principales con tabs */}
        <Stack.Screen name="(tabs)" />
        
        {/* Pantallas de grupo */}
        <Stack.Screen 
          name="group/[id]" 
          options={{ 
            headerShown: true,
            headerTitle: 'Grupo',
            headerTintColor: Colors.primary,
            headerBackTitle: 'Volver',
          }} 
        />
        
        {/* Pantallas de gastos */}
        <Stack.Screen 
          name="expense/add" 
          options={{ 
            presentation: 'modal',
            headerShown: true,
            headerTitle: 'Nuevo Gasto',
            headerTintColor: Colors.primary,
          }} 
        />
        <Stack.Screen 
          name="expense/balances" 
          options={{ 
            headerShown: true,
            headerTitle: 'Balances',
            headerTintColor: Colors.primary,
            headerBackTitle: 'Volver',
          }} 
        />
        
        {/* Pantalla premium */}
        <Stack.Screen 
          name="premium" 
          options={{ 
            presentation: 'modal',
            headerShown: true,
            headerTitle: 'RoomPay Premium',
            headerTintColor: Colors.primary,
          }} 
        />
      </Stack>
    </>
  );
}
