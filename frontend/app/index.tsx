// ============================================================================
// PANTALLA DE BIENVENIDA - Primera pantalla que ve el usuario
// ============================================================================
// Si el usuario ya está logueado, lo redirige a la pantalla principal.
// Si no, muestra opciones para iniciar sesión o registrarse.
// ============================================================================

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/store/authStore';
import { Button } from '../src/components/Button';
import { Colors } from '../src/constants/colors';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen() {
  // Verificamos si el usuario ya está autenticado
  const { isAuthenticated } = useAuthStore();

  // Si ya está logueado, lo mandamos a la pantalla principal
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Sección superior con logo y nombre */}
      <View style={styles.header}>
        {/* Icono de la app */}
        <View style={styles.logoContainer}>
          <Ionicons name="home" size={60} color={Colors.primary} />
        </View>
        
        {/* Nombre de la app */}
        <Text style={styles.title}>RoomPay</Text>
        <Text style={styles.subtitle}>Comparte gastos con tus roomies</Text>
      </View>

      {/* Sección de características */}
      <View style={styles.features}>
        <FeatureItem 
          icon="wallet-outline" 
          text="Divide gastos fácilmente" 
        />
        <FeatureItem 
          icon="people-outline" 
          text="Encuentra roommates" 
        />
        <FeatureItem 
          icon="notifications-outline" 
          text="Recibe recordatorios de pago" 
        />
        <FeatureItem 
          icon="checkmark-circle-outline" 
          text="Controla quién está al día" 
        />
      </View>

      {/* Botones de acción */}
      <View style={styles.buttons}>
        {/* Botón principal - Iniciar sesión */}
        <Button
          title="Iniciar Sesión"
          onPress={() => router.push('/(auth)/login')}
          variant="primary"
          fullWidth
        />
        
        {/* Botón secundario - Registrarse */}
        <Button
          title="Crear Cuenta"
          onPress={() => router.push('/(auth)/register')}
          variant="outline"
          fullWidth
          style={styles.registerButton}
        />
      </View>
    </SafeAreaView>
  );
}

// Componente auxiliar para mostrar cada característica
interface FeatureItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, text }) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIcon}>
      <Ionicons name={icon} size={24} color={Colors.primary} />
    </View>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  // Contenedor principal
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
  },
  
  // --- Sección del encabezado ---
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  
  // --- Sección de características ---
  features: {
    marginTop: 48,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  
  // --- Sección de botones ---
  buttons: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 32,
  },
  registerButton: {
    marginTop: 12,
  },
});
