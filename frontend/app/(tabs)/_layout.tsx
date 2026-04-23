// ============================================================================
// LAYOUT DE TABS - Barra de navegación inferior
// ============================================================================
// Configura la barra de navegación con las pestañas principales:
// - Inicio (grupos)
// - Roommates
// - Notificaciones
// - Perfil
// ============================================================================

import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { useAuthStore } from '../../src/store/authStore';

export default function TabLayout() {
  // Verificamos si el usuario está autenticado
  const { isAuthenticated } = useAuthStore();

  // Si no está autenticado, lo redirigimos al inicio
  if (!isAuthenticated) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        // Colores de la barra de tabs
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        
        // Estilo de la barra
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        
        // Estilo de las etiquetas
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        
        // Ocultamos el header por defecto
        headerShown: false,
      }}
    >
      {/* Pestaña de Inicio - Muestra los grupos */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Pestaña de Roommates - Buscar compañeros */}
      <Tabs.Screen
        name="roommates"
        options={{
          title: 'Roommates',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Pestaña de Notificaciones */}
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Avisos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Pestaña de Perfil */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
