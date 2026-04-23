// ============================================================================
// COMPONENTE: Input - Campo de entrada de texto
// ============================================================================
// Campo de texto reutilizable con etiqueta, icono opcional y manejo de errores.
// ============================================================================

import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

// Props del componente
interface InputProps extends TextInputProps {
  label?: string;           // Etiqueta sobre el campo
  error?: string;           // Mensaje de error
  icon?: keyof typeof Ionicons.glyphMap;  // Icono a la izquierda
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  style,
  ...props
}) => {
  return (
    <View style={styles.container}>
      {/* Etiqueta del campo */}
      {label && <Text style={styles.label}>{label}</Text>}
      
      {/* Contenedor del input con icono */}
      <View style={[styles.inputContainer, error && styles.inputError]}>
        {/* Icono opcional */}
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={Colors.textSecondary}
            style={styles.icon}
          />
        )}
        
        {/* Campo de texto */}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.textLight}
          {...props}
        />
      </View>
      
      {/* Mensaje de error */}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  // Contenedor principal
  container: {
    marginBottom: 16,
  },
  // Etiqueta
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  // Contenedor del input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
  },
  // Estado de error
  inputError: {
    borderColor: Colors.danger,
  },
  // Icono
  icon: {
    marginRight: 10,
  },
  // Campo de texto
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 14,
  },
  // Texto de error
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    marginTop: 4,
  },
});
