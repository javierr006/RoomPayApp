// ============================================================================
// PANTALLA DE BALANCES - Ver quién debe a quién
// ============================================================================
// Muestra el balance de cada miembro del grupo:
// - Quién debe dinero
// - Quién tiene dinero a favor
// - Estado de cada persona (solvente, pendiente, etc.)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getGroupBalances } from '../../src/services/api';
import { Card } from '../../src/components/Card';
import { StatusBadge } from '../../src/components/StatusBadge';
import { Colors, getStatusColor } from '../../src/constants/colors';

// Tipo para los balances
interface Balance {
  usuario: {
    id: string;
    nombre: string;
    foto_perfil?: string;
  };
  total_debe: number;
  total_le_deben: number;
  balance_neto: number;
  estado: string;
  detalles: Array<{
    tipo: 'debe' | 'le_deben';
    usuario: { id: string; nombre: string };
    monto: number;
  }>;
}

export default function BalancesScreen() {
  // Obtenemos el ID del grupo de la URL
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  
  // Estados
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Cargar balances
  const loadBalances = async () => {
    try {
      const data = await getGroupBalances(groupId!);
      setBalances(data);
    } catch (error) {
      console.error('Error cargando balances:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Cargar al montar
  useEffect(() => {
    if (groupId) {
      loadBalances();
    }
  }, [groupId]);

  // Refrescar
  const onRefresh = () => {
    setRefreshing(true);
    loadBalances();
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

  // Formatear monto con signo
  const formatBalance = (amount: number) => {
    if (amount > 0) {
      return `+$${amount.toFixed(2)}`;
    } else if (amount < 0) {
      return `-$${Math.abs(amount).toFixed(2)}`;
    }
    return '$0.00';
  };

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
        {/* Resumen general */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="bar-chart" size={24} color={Colors.primary} />
            <Text style={styles.summaryTitle}>Resumen del Grupo</Text>
          </View>
          <Text style={styles.summaryDesc}>
            Aquí puedes ver quién debe dinero y quién tiene saldo a favor.
          </Text>
          
          {/* Leyenda de estados */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
              <Text style={styles.legendText}>Solvente</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
              <Text style={styles.legendText}>Pendiente</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.partial }]} />
              <Text style={styles.legendText}>Parcial</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.danger }]} />
              <Text style={styles.legendText}>Atrasado</Text>
            </View>
          </View>
        </Card>

        {/* Lista de balances */}
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Cargando balances...</Text>
          </View>
        ) : balances.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={64} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>Sin balances</Text>
            <Text style={styles.emptyText}>Aún no hay gastos en este grupo</Text>
          </View>
        ) : (
          balances.map((balance) => (
            <Card key={balance.usuario.id} style={styles.balanceCard}>
              {/* Header del usuario */}
              <View style={styles.userHeader}>
                <View style={[
                  styles.avatar,
                  { backgroundColor: getStatusColor(balance.estado) }
                ]}>
                  <Text style={styles.avatarText}>
                    {getInitials(balance.usuario.nombre)}
                  </Text>
                </View>
                
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{balance.usuario.nombre}</Text>
                  <StatusBadge estado={balance.estado} size="small" />
                </View>
                
                {/* Balance neto */}
                <Text style={[
                  styles.balanceNeto,
                  { color: balance.balance_neto >= 0 ? Colors.success : Colors.danger }
                ]}>
                  {formatBalance(balance.balance_neto)}
                </Text>
              </View>
              
              {/* Detalles de deudas */}
              {balance.detalles.length > 0 && (
                <View style={styles.details}>
                  {balance.detalles.map((detalle, index) => (
                    <View key={index} style={styles.detailItem}>
                      <View style={styles.detailLeft}>
                        <Ionicons 
                          name={detalle.tipo === 'debe' ? 'arrow-up-outline' : 'arrow-down-outline'}
                          size={16}
                          color={detalle.tipo === 'debe' ? Colors.danger : Colors.success}
                        />
                        <Text style={styles.detailText}>
                          {detalle.tipo === 'debe' 
                            ? `Debe a ${detalle.usuario.nombre}` 
                            : `${detalle.usuario.nombre} le debe`
                          }
                        </Text>
                      </View>
                      <Text style={[
                        styles.detailAmount,
                        { color: detalle.tipo === 'debe' ? Colors.danger : Colors.success }
                      ]}>
                        ${detalle.monto.toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              
              {/* Resumen rápido */}
              <View style={styles.quickSummary}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Debe</Text>
                  <Text style={[styles.summaryValue, { color: Colors.danger }]}>
                    ${balance.total_debe.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Le deben</Text>
                  <Text style={[styles.summaryValue, { color: Colors.success }]}>
                    ${balance.total_le_deben.toFixed(2)}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}
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
    padding: 20,
  },
  
  // Resumen
  summaryCard: {
    marginBottom: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 10,
  },
  summaryDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  
  // Leyenda
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textSecondary,
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
  
  // Tarjeta de balance
  balanceCard: {
    marginBottom: 16,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  balanceNeto: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  // Detalles
  details: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 8,
  },
  detailAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Resumen rápido
  quickSummary: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
