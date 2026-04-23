// ============================================================================
// COMPONENTE: StatusBadge - Muestra el estado de pago con color
// ============================================================================
// Este componente muestra una etiqueta colorida según el estado de pago:
// - Solvente (verde), Pendiente (amarillo), Parcial (naranja), Atrasado (rojo)
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getStatusColor, getStatusText } from '../constants/colors';

// Props del componente
interface StatusBadgeProps {
  estado: string;  // Estado del pago: solvente, pendiente, parcial, atrasado
  size?: 'small' | 'medium' | 'large';  // Tamaño del badge
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ estado, size = 'medium' }) => {
  // Obtenemos el color según el estado
  const backgroundColor = getStatusColor(estado);
  const text = getStatusText(estado);
  
  // Determinamos el tamaño del texto y padding
  const sizeStyles = {
    small: { fontSize: 10, paddingHorizontal: 6, paddingVertical: 2 },
    medium: { fontSize: 12, paddingHorizontal: 10, paddingVertical: 4 },
    large: { fontSize: 14, paddingHorizontal: 14, paddingVertical: 6 },
  };

  return (
    <View style={[styles.badge, { backgroundColor }, sizeStyles[size]]}>
      <Text style={[styles.text, { fontSize: sizeStyles[size].fontSize }]}>
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  // Contenedor del badge
  badge: {
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  // Texto del badge
  text: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
