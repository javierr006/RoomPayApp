// ============================================================================
// COMPONENTE: Card - Tarjeta con estilo moderno
// ============================================================================
// Componente reutilizable para mostrar contenido en una tarjeta blanca
// con sombra sutil y bordes redondeados.
// ============================================================================

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../constants/colors';

// Props del componente
interface CardProps {
  children: React.ReactNode;  // Contenido de la tarjeta
  style?: ViewStyle;          // Estilos adicionales
  padding?: number;           // Padding personalizado
}

export const Card: React.FC<CardProps> = ({ children, style, padding = 16 }) => {
  return (
    <View style={[styles.card, { padding }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  // Estilos de la tarjeta
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    // Sombra para iOS
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    // Sombra para Android
    elevation: 3,
  },
});
