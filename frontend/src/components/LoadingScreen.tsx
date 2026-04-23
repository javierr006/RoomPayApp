// ============================================================================
// COMPONENTE: LoadingScreen - Pantalla de carga
// ============================================================================
// Muestra un indicador de carga centrado en la pantalla.
// Se usa mientras se cargan datos o se verifica la autenticación.
// ============================================================================

import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Colors } from '../constants/colors';

// Props del componente
interface LoadingScreenProps {
  message?: string;  // Mensaje opcional debajo del indicador
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
  return (
    <View style={styles.container}>
      {/* Indicador de carga giratorio */}
      <ActivityIndicator size="large" color={Colors.primary} />
      
      {/* Mensaje opcional */}
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  // Contenedor centrado
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  // Mensaje de carga
  message: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
