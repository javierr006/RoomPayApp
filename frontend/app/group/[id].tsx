// ============================================================================
// PANTALLA DE DETALLE DE GRUPO - Dashboard del grupo
// ============================================================================
// Muestra los gastos del grupo, balances de miembros y permite agregar gastos.
// Es la pantalla central para gestionar los gastos compartidos.
// ============================================================================

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, Share } from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getGroup, getGroupExpenses, payExpense, sendReminder } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { StatusBadge } from '../../src/components/StatusBadge';
import { Colors, getStatusColor } from '../../src/constants/colors';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Tipos de datos
interface Group {
  id: string;
  nombre: string;
  descripcion?: string;
  miembros: Array<{ id: string; nombre: string; foto_perfil?: string }>;
  codigo_invitacion: string;
  fecha_creacion: string;
}

interface Expense {
  id: string;
  grupo_id: string;
  descripcion: string;
  monto: number;
  categoria: string;
  pagado_por: { id: string; nombre: string; foto_perfil?: string };
  dividido_entre: Array<{
    usuario: { id: string; nombre: string };
    monto: number;
    monto_pagado: number;
    estado: string;
  }>;
  fecha: string;
  estado: string;
}

export default function GroupDetailScreen() {
  // Obtenemos el ID del grupo de la URL
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  
  // Estados
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Cargar datos del grupo
  const loadGroupData = async () => {
    try {
      const [groupData, expensesData] = await Promise.all([
        getGroup(id!),
        getGroupExpenses(id!)
      ]);
      setGroup(groupData);
      setExpenses(expensesData);
    } catch (error) {
      console.error('Error cargando grupo:', error);
      Alert.alert('Error', 'No se pudo cargar el grupo');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Cargar al entrar a la pantalla
  useFocusEffect(
    useCallback(() => {
      if (id) {
        loadGroupData();
      }
    }, [id])
  );

  // Refrescar
  const onRefresh = () => {
    setRefreshing(true);
    loadGroupData();
  };

  // Compartir código de invitación
  const handleShareCode = async () => {
    if (!group) return;
    
    try {
      await Share.share({
        message: `Únete a mi grupo "${group.nombre}" en RoomPay con el código: ${group.codigo_invitacion}`,
      });
    } catch (error) {
      Alert.alert('Código de Invitación', group.codigo_invitacion);
    }
  };

  // Pagar un gasto
  const handlePayExpense = async (expense: Expense) => {
    // Buscar mi deuda en este gasto
    const myDebt = expense.dividido_entre.find(d => d.usuario.id === user?.id);
    if (!myDebt) return;

    const remaining = myDebt.monto - myDebt.monto_pagado;
    if (remaining <= 0) {
      Alert.alert('Info', 'Ya pagaste este gasto');
      return;
    }

    Alert.alert(
      'Registrar Pago',
      `¿Deseas marcar como pagado $${remaining.toFixed(2)} de "${expense.descripcion}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Pagar Todo',
          onPress: async () => {
            try {
              await payExpense(expense.id, remaining);
              Alert.alert('Éxito', 'Pago registrado correctamente');
              loadGroupData();
            } catch (error) {
              Alert.alert('Error', 'No se pudo registrar el pago');
            }
          }
        }
      ]
    );
  };

  // Enviar recordatorio
  const handleSendReminder = async (userId: string, userName: string) => {
    if (!group) return;

    Alert.alert(
      'Enviar Recordatorio',
      `¿Deseas enviar un recordatorio a ${userName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async () => {
            try {
              await sendReminder(group.id, userId);
              Alert.alert('Éxito', 'Recordatorio enviado');
            } catch (error) {
              Alert.alert('Error', 'No se pudo enviar el recordatorio');
            }
          }
        }
      ]
    );
  };

  // Formatear fecha
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "d 'de' MMM", { locale: es });
    } catch {
      return dateStr;
    }
  };

  // Obtener icono de categoría
  const getCategoryIcon = (categoria: string) => {
    switch (categoria.toLowerCase()) {
      case 'comida': return 'restaurant-outline';
      case 'servicios': return 'flash-outline';
      case 'renta': return 'home-outline';
      case 'transporte': return 'car-outline';
      case 'entretenimiento': return 'game-controller-outline';
      default: return 'receipt-outline';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Grupo no encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header del grupo */}
        <Card style={styles.headerCard}>
          <Text style={styles.groupName}>{group.nombre}</Text>
          {group.descripcion && (
            <Text style={styles.groupDesc}>{group.descripcion}</Text>
          )}
          
          {/* Miembros */}
          <View style={styles.membersSection}>
            <Text style={styles.sectionLabel}>Miembros ({group.miembros.length})</Text>
            <View style={styles.membersList}>
              {group.miembros.map((member) => (
                <View key={member.id} style={styles.memberChip}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {member.nombre.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.memberName} numberOfLines={1}>
                    {member.nombre.split(' ')[0]}
                    {member.id === user?.id && ' (Tú)'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          
          {/* Código de invitación */}
          <TouchableOpacity style={styles.inviteButton} onPress={handleShareCode}>
            <Ionicons name="share-outline" size={18} color={Colors.primary} />
            <Text style={styles.inviteCode}>{group.codigo_invitacion}</Text>
            <Text style={styles.inviteText}>Compartir código</Text>
          </TouchableOpacity>
        </Card>

        {/* Acciones rápidas */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => router.push({ pathname: '/expense/add', params: { groupId: group.id, groupName: group.nombre } })}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.primary + '20' }]}>
              <Ionicons name="add" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.actionText}>Agregar Gasto</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => router.push({ pathname: '/expense/balances', params: { groupId: group.id } })}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.secondary + '20' }]}>
              <Ionicons name="bar-chart-outline" size={24} color={Colors.secondary} />
            </View>
            <Text style={styles.actionText}>Ver Balances</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de gastos */}
        <View style={styles.expensesSection}>
          <Text style={styles.sectionTitle}>Gastos del Grupo</Text>
          
          {expenses.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={48} color={Colors.textLight} />
              <Text style={styles.emptyTitle}>Sin gastos aún</Text>
              <Text style={styles.emptyText}>Agrega el primer gasto del grupo</Text>
            </Card>
          ) : (
            expenses.map((expense) => {
              // Verificar si tengo deuda en este gasto
              const myDebt = expense.dividido_entre.find(d => d.usuario.id === user?.id);
              const isPayer = expense.pagado_por.id === user?.id;
              
              return (
                <Card key={expense.id} style={styles.expenseCard}>
                  {/* Header del gasto */}
                  <View style={styles.expenseHeader}>
                    <View style={styles.expenseIcon}>
                      <Ionicons 
                        name={getCategoryIcon(expense.categoria) as any} 
                        size={20} 
                        color={Colors.primary} 
                      />
                    </View>
                    <View style={styles.expenseInfo}>
                      <Text style={styles.expenseDesc}>{expense.descripcion}</Text>
                      <Text style={styles.expenseMeta}>
                        {expense.pagado_por.nombre} • {formatDate(expense.fecha)}
                      </Text>
                    </View>
                    <Text style={styles.expenseAmount}>${expense.monto.toFixed(2)}</Text>
                  </View>
                  
                  {/* Divisiones */}
                  <View style={styles.divisions}>
                    {expense.dividido_entre.map((div, index) => (
                      <View key={index} style={styles.divisionItem}>
                        <Text style={styles.divisionName}>
                          {div.usuario.nombre}
                          {div.usuario.id === user?.id && ' (Tú)'}
                        </Text>
                        <View style={styles.divisionRight}>
                          <Text style={styles.divisionAmount}>${div.monto.toFixed(2)}</Text>
                          <StatusBadge estado={div.estado} size="small" />
                          
                          {/* Botón de recordatorio (solo si soy el pagador y el otro debe) */}
                          {isPayer && div.estado !== 'solvente' && div.usuario.id !== user?.id && (
                            <TouchableOpacity 
                              style={styles.reminderBtn}
                              onPress={() => handleSendReminder(div.usuario.id, div.usuario.nombre)}
                            >
                              <Ionicons name="alarm-outline" size={16} color={Colors.warning} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                  
                  {/* Botón de pagar (si tengo deuda pendiente) */}
                  {myDebt && myDebt.estado !== 'solvente' && (
                    <TouchableOpacity 
                      style={styles.payButton}
                      onPress={() => handlePayExpense(expense)}
                    >
                      <Ionicons name="card-outline" size={18} color={Colors.white} />
                      <Text style={styles.payButtonText}>
                        Pagar ${(myDebt.monto - myDebt.monto_pagado).toFixed(2)}
                      </Text>
                    </TouchableOpacity>
                  )}
                </Card>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Header del grupo
  headerCard: {
    marginTop: 16,
  },
  groupName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
  },
  groupDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  
  // Miembros
  membersSection: {
    marginTop: 20,
  },
  sectionLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 10,
    fontWeight: '500',
  },
  membersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  memberAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  memberAvatarText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  memberName: {
    fontSize: 13,
    color: Colors.text,
    maxWidth: 80,
  },
  
  // Invitación
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  inviteCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginLeft: 8,
    letterSpacing: 2,
  },
  inviteText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 'auto',
  },
  
  // Acciones rápidas
  quickActions: {
    flexDirection: 'row',
    marginTop: 20,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  
  // Sección de gastos
  expensesSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  
  // Estado vacío
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  
  // Tarjeta de gasto
  expenseCard: {
    marginBottom: 14,
  },
  expenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDesc: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  expenseMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  
  // Divisiones
  divisions: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  divisionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  divisionName: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  divisionRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divisionAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginRight: 10,
  },
  reminderBtn: {
    marginLeft: 10,
    padding: 4,
  },
  
  // Botón de pagar
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 14,
  },
  payButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});
