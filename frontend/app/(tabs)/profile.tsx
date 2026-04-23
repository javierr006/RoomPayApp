// ============================================================================
// PANTALLA DE PERFIL - Información del usuario
// ============================================================================
// Muestra el perfil del usuario con opción de editar y cerrar sesión.
// También incluye acceso rápido a la suscripción premium.
// ============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { updateProfile } from '../../src/services/api';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Colors } from '../../src/constants/colors';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ProfileScreen() {
  // Estado del usuario
  const { user, logout, updateUser } = useAuthStore();
  
  // Estados locales
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.nombre || '');
  const [loading, setLoading] = useState(false);

  // Formatear fecha de registro
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "d 'de' MMMM 'de' yyyy", { locale: es });
    } catch {
      return dateStr;
    }
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que quieres salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Salir', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          }
        },
      ]
    );
  };

  // Función para guardar cambios del perfil
  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }

    setLoading(true);
    try {
      await updateProfile({ nombre: editName.trim() });
      updateUser({ nombre: editName.trim() });
      setShowEditModal(false);
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  // Obtener iniciales del nombre
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Sección del perfil */}
        <View style={styles.profileSection}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.nombre ? getInitials(user.nombre) : 'U'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.editAvatarButton}
              onPress={() => setShowEditModal(true)}
            >
              <Ionicons name="pencil" size={14} color={Colors.white} />
            </TouchableOpacity>
          </View>
          
          {/* Nombre y email */}
          <Text style={styles.userName}>{user?.nombre}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <Text style={styles.memberSince}>
            Miembro desde {user?.fecha_registro ? formatDate(user.fecha_registro) : ''}
          </Text>
        </View>

        {/* Tarjeta Premium */}
        <TouchableOpacity onPress={() => router.push('/premium')}>
          <Card style={styles.premiumCard}>
            <View style={styles.premiumContent}>
              <View style={styles.premiumIcon}>
                <Ionicons name="star" size={28} color={Colors.secondary} />
              </View>
              <View style={styles.premiumText}>
                <Text style={styles.premiumTitle}>RoomPay Premium</Text>
                <Text style={styles.premiumDesc}>Desbloquea todas las funciones</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
            </View>
          </Card>
        </TouchableOpacity>

        {/* Opciones del menú */}
        <Card style={styles.menuCard}>
          <MenuItem 
            icon="person-outline" 
            title="Editar Perfil" 
            onPress={() => {
              setEditName(user?.nombre || '');
              setShowEditModal(true);
            }}
          />
          <MenuItem 
            icon="notifications-outline" 
            title="Preferencias de Notificaciones" 
            onPress={() => Alert.alert('Próximamente', 'Esta función estará disponible pronto')}
          />
          <MenuItem 
            icon="help-circle-outline" 
            title="Ayuda y Soporte" 
            onPress={() => Alert.alert('Ayuda', 'Contacta a soporte@roompay.app')}
          />
          <MenuItem 
            icon="document-text-outline" 
            title="Términos y Condiciones" 
            onPress={() => Alert.alert('Términos', 'Lee nuestros términos en roompay.app/terms')}
          />
        </Card>

        {/* Botón cerrar sesión */}
        <Button
          title="Cerrar Sesión"
          onPress={handleLogout}
          variant="outline"
          fullWidth
          style={styles.logoutButton}
        />

        {/* Versión de la app */}
        <Text style={styles.version}>RoomPay v1.0.0</Text>
      </ScrollView>

      {/* Modal de editar perfil */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Perfil</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Tu nombre"
              value={editName}
              onChangeText={setEditName}
              placeholderTextColor={Colors.textLight}
              autoCapitalize="words"
            />
            
            <View style={styles.modalButtons}>
              <Button
                title="Cancelar"
                onPress={() => setShowEditModal(false)}
                variant="outline"
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Guardar"
                onPress={handleSaveProfile}
                loading={loading}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Componente auxiliar para items del menú
interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, title, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Ionicons name={icon} size={22} color={Colors.text} style={styles.menuIcon} />
    <Text style={styles.menuTitle}>{title}</Text>
    <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  
  // Sección del perfil
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontSize: 36,
    fontWeight: 'bold',
  },
  editAvatarButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.background,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  memberSince: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 8,
  },
  
  // Tarjeta Premium
  premiumCard: {
    marginBottom: 16,
    backgroundColor: Colors.secondary + '15',
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.secondary + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  premiumText: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  premiumDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  
  // Menú
  menuCard: {
    marginBottom: 24,
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuIcon: {
    marginRight: 14,
  },
  menuTitle: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  
  // Botón logout
  logoutButton: {
    borderColor: Colors.danger,
  },
  
  // Versión
  version: {
    textAlign: 'center',
    color: Colors.textLight,
    fontSize: 12,
    marginTop: 24,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 24,
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
});
