// ============================================================================
// PANTALLA DE NOTIFICACIONES - Avisos y recordatorios
// ============================================================================
// Muestra las notificaciones del usuario: gastos nuevos, pagos, recordatorios.
// Permite marcar notificaciones como leídas.
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../src/services/api';
import { Card } from '../../src/components/Card';
import { Colors } from '../../src/constants/colors';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';

// Tipo para las notificaciones
interface Notification {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  fecha: string;
  leido: boolean;
  datos?: any;
}

export default function NotificationsScreen() {
  // Estados
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Función para cargar notificaciones
  const loadNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Cargar al entrar a la pantalla
  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  // Refrescar
  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  // Marcar una notificación como leída
  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, leido: true } : n)
      );
    } catch (error) {
      console.error('Error marcando notificación:', error);
    }
  };

  // Marcar todas como leídas
  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, leido: true })));
    } catch (error) {
      console.error('Error marcando notificaciones:', error);
    }
  };

  // Obtener icono según tipo de notificación
  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case 'gasto_nuevo':
        return { name: 'receipt-outline', color: Colors.primary };
      case 'pago_recibido':
        return { name: 'checkmark-circle-outline', color: Colors.success };
      case 'recordatorio':
        return { name: 'alarm-outline', color: Colors.warning };
      case 'nuevo_miembro':
        return { name: 'person-add-outline', color: Colors.info };
      default:
        return { name: 'notifications-outline', color: Colors.textSecondary };
    }
  };

  // Formatear fecha
  const formatDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) {
      return 'Hoy ' + format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Ayer ' + format(date, 'HH:mm');
    } else {
      return format(date, "d 'de' MMMM", { locale: es });
    }
  };

  // Contar notificaciones no leídas
  const unreadCount = notifications.filter(n => !n.leido).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Encabezado */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notificaciones</Text>
          <Text style={styles.subtitle}>
            {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}
          </Text>
        </View>
        
        {/* Botón marcar todas como leídas */}
        {unreadCount > 0 && (
          <TouchableOpacity 
            style={styles.markAllButton}
            onPress={handleMarkAllRead}
          >
            <Ionicons name="checkmark-done-outline" size={20} color={Colors.primary} />
            <Text style={styles.markAllText}>Leer todas</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Lista de notificaciones */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Cargando...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>Sin notificaciones</Text>
            <Text style={styles.emptyText}>Cuando tengas avisos, aparecerán aquí</Text>
          </View>
        ) : (
          notifications.map((notification) => {
            const icon = getNotificationIcon(notification.tipo);
            
            return (
              <TouchableOpacity
                key={notification.id}
                onPress={() => !notification.leido && handleMarkRead(notification.id)}
              >
                <Card 
                  style={[
                    styles.notificationCard,
                    !notification.leido && styles.unreadCard
                  ]}
                >
                  <View style={styles.notificationContent}>
                    {/* Icono */}
                    <View style={[styles.iconContainer, { backgroundColor: icon.color + '20' }]}>
                      <Ionicons name={icon.name as any} size={22} color={icon.color} />
                    </View>
                    
                    {/* Contenido */}
                    <View style={styles.textContent}>
                      <View style={styles.titleRow}>
                        <Text style={styles.notificationTitle}>{notification.titulo}</Text>
                        {!notification.leido && <View style={styles.unreadDot} />}
                      </View>
                      <Text style={styles.notificationMessage} numberOfLines={2}>
                        {notification.mensaje}
                      </Text>
                      <Text style={styles.notificationTime}>
                        {formatDate(notification.fecha)}
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
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
  
  // Encabezado
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  markAllText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  
  // Contenido
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    textAlign: 'center',
  },
  
  // Tarjeta de notificación
  notificationCard: {
    marginBottom: 12,
    padding: 14,
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  notificationContent: {
    flexDirection: 'row',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 6,
  },
});
