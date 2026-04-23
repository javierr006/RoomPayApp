// ============================================================================
// COMPONENTE: Button - Botón personalizado de RoomPay
// ============================================================================
// Botón reutilizable con diferentes variantes:
// - primary: Naranja (acciones principales)
// - secondary: Amarillo (acciones secundarias)
// - outline: Solo borde (acciones terciarias)
// ============================================================================

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../constants/colors';

// Props del componente
interface ButtonProps {
  title: string;                          // Texto del botón
  onPress: () => void;                    // Función al presionar
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';  // Variante visual
  disabled?: boolean;                     // Deshabilitado
  loading?: boolean;                      // Muestra indicador de carga
  style?: ViewStyle;                      // Estilos adicionales del contenedor
  textStyle?: TextStyle;                  // Estilos adicionales del texto
  fullWidth?: boolean;                    // Ocupa todo el ancho
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  // Determinamos los estilos según la variante
  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primaryButton;
      case 'secondary':
        return styles.secondaryButton;
      case 'outline':
        return styles.outlineButton;
      case 'danger':
        return styles.dangerButton;
      default:
        return styles.primaryButton;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return styles.outlineText;
      default:
        return styles.buttonText;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        // Mostramos indicador de carga si está cargando
        <ActivityIndicator color={variant === 'outline' ? Colors.primary : Colors.white} />
      ) : (
        // Mostramos el texto del botón
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // --- Estilos base del botón ---
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48, // Altura mínima para touch targets
  },
  
  // --- Variantes ---
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: Colors.secondary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  dangerButton: {
    backgroundColor: Colors.danger,
  },
  
  // --- Estilos de texto ---
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  outlineText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // --- Estados ---
  disabled: {
    opacity: 0.5,
  },
  fullWidth: {
    width: '100%',
  },
});
