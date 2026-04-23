// ============================================================================
// PANTALLA DE INICIO - Dashboard de grupos
// ============================================================================
// Muestra los grupos del usuario y permite crear nuevos o unirse con código.
// Es la pantalla principal después de iniciar sesión.
// ============================================================================

// ============================================================================
// PANTALLA DE INICIO - Dashboard de grupos
// ============================================================================
// Muestra los grupos del usuario y permite crear nuevos o unirse con código.
// Es la pantalla principal después de iniciar sesión.
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { getGroups, createGroup, joinGroup } from '../../src/services/api';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Colors } from '../../src/constants/colors';

// Tipo para los datos de un grupo
interface Group {
  id: string;
  nombre: string;
  descripcion?: string;
  miembros: Array<{ id: string; nombre: string; foto_perfil?: string }>;
  codigo_invitacion: string;
  fecha_creacion: string;
}

export default function HomeScreen() {
  // Estado del usuario
  const { user } = useAuthStore();
  
  // Estados de la pantalla
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados para modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // Función para cargar los grupos
  const loadGroups = async () => {
    try {
      const data = await getGroups();
      setGroups(data);
    } catch (error) {
      console.error('Error cargando grupos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Cargar grupos al entrar a la pantalla
  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, [])
  );

  // Función para refrescar (pull-to-refresh)
  const onRefresh = () => {
    setRefreshing(true);
    loadGroups();
  };

  // Función para crear un nuevo grupo
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      Alert.alert('Error', 'El nombre del grupo es requerido');
      return;
    }

    setModalLoading(true);
    try {
      await createGroup(newGroupName.trim(), newGroupDesc.trim() || undefined);
      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDesc('');
      loadGroups();
      Alert.alert('Éxito', 'Grupo creado correctamente');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo crear el grupo');
    } finally {
      setModalLoading(false);
    }
  };

  // Función para unirse a un grupo
  const handleJoinGroup = async () => {
    if (!joinCode.trim()) {
      Alert.alert('Error', 'Ingresa el código de invitación');
      return;
    }

    setModalLoading(true);
    try {
      await joinGroup(joinCode.trim().toUpperCase());
      setShowJoinModal(false);
      setJoinCode('');
      loadGroups();
      Alert.alert('Éxito', 'Te has unido al grupo');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Código inválido');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Encabezado */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {user?.nombre?.split(' ')[0]} 👋</Text>
          <Text style={styles.subtitle}>Tus grupos de gastos</Text>
        </View>
        
        {/* Botón Premium */}
        <TouchableOpacity 
          style={styles.premiumButton}
          onPress={() => router.push('/premium')}
        >
          <Ionicons name="star" size={20} color={Colors.secondary} />
        </TouchableOpacity>
      </View>

      {/* Lista de grupos */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Botones de acción */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowCreateModal(true)}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.primary + '20' }]}>
              <Ionicons name="add" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.actionText}>Crear Grupo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowJoinModal(true)}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.secondary + '20' }]}>
              <Ionicons name="enter-outline" size={24} color={Colors.secondary} />
            </View>
            <Text style={styles.actionText}>Unirme con Código</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de grupos */}
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Cargando...</Text>
          </View>
        ) : groups.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>Sin grupos aún</Text>
            <Text style={styles.emptyText}>Crea un grupo o únete con un código</Text>
          </View>
        ) : (
          groups.map((group) => (
            <TouchableOpacity
              key={group.id}
              onPress={() => router.push(`/group/${group.id}`)}
            >
              <Card style={styles.groupCard}>
                <View style={styles.groupHeader}>
                  <View style={styles.groupIcon}>
                    <Ionicons name="home" size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{group.nombre}</Text>
                    <Text style={styles.groupMembers}>
                      {group.miembros.length} {group.miembros.length === 1 ? 'miembro' : 'miembros'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
                </View>
                
                {group.descripcion && (
                  <Text style={styles.groupDesc} numberOfLines={2}>
                    {group.descripcion}
                  </Text>
                )}
                
                {/* Avatares de miembros */}
                <View style={styles.memberAvatars}>
                  {group.miembros.slice(0, 4).map((member, index) => (
                    <View 
                      key={member.id} 
                      style={[styles.avatar, { marginLeft: index > 0 ? -8 : 0 }]}
                    >
                      <Text style={styles.avatarText}>
                        {member.nombre.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  ))}
                  {group.miembros.length > 4 && (
                    <View style={[styles.avatar, styles.avatarMore, { marginLeft: -8 }]}>
                      <Text style={styles.avatarMoreText}>+{group.miembros.length - 4}</Text>
                    </View>
                  )}
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Modal para crear grupo */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Crear Nuevo Grupo</Text>
                
                <TextInput
                  style={styles.modalInput}
                  placeholder="Nombre del grupo"
                  value={newGroupName}
                  onChangeText={setNewGroupName}
                  placeholderTextColor={Colors.textLight}
                  returnKeyType="next"
                />
                
                <TextInput
                  style={[styles.modalInput, styles.modalInputMultiline]}
                  placeholder="Descripción (opcional)"
                  value={newGroupDesc}
                  onChangeText={setNewGroupDesc}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={Colors.textLight}
                  textAlignVertical="top"
                />
                
                <View style={styles.modalButtons}>
                  <Button
                    title="Cancelar"
                    onPress={() => setShowCreateModal(false)}
                    variant="outline"
                    style={{ flex: 1, marginRight: 8 }}
                  />
                  <Button
                    title="Crear"
                    onPress={handleCreateGroup}
                    loading={modalLoading}
                    style={{ flex: 1, marginLeft: 8 }}
                  />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal para unirse con código */}
      <Modal
        visible={showJoinModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowJoinModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Unirse a un Grupo</Text>
                <Text style={styles.modalSubtitle}>Ingresa el código de invitación</Text>
                
                <TextInput
                  style={[styles.modalInput, styles.codeInput]}
                  placeholder="CÓDIGO"
                  value={joinCode}
                  onChangeText={(text) => setJoinCode(text.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={6}
                  placeholderTextColor={Colors.textLight}
                />
                
                <View style={styles.modalButtons}>
                  <Button
                    title="Cancelar"
                    onPress={() => setShowJoinModal(false)}
                    variant="outline"
                    style={{ flex: 1, marginRight: 8 }}
                  />
                  <Button
                    title="Unirme"
                    onPress={handleJoinGroup}
                    loading={modalLoading}
                    style={{ flex: 1, marginLeft: 8 }}
                  />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  // Encabezado
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  premiumButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  // Contenido
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  
  // Acciones
  actions: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  
  // Estado vacío
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  
  // Tarjeta de grupo
  groupCard: {
    marginBottom: 16,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  groupMembers: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  groupDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  
  // Avatares de miembros
  memberAvatars: {
    flexDirection: 'row',
    marginTop: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.card,
  },
  avatarText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  avatarMore: {
    backgroundColor: Colors.textLight,
  },
  avatarMoreText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  
  // Modal
  keyboardContainer: {
    flex: 1,
  },
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
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
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
  modalInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
});