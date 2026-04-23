// ============================================================================
// PANTALLA DE ROOMMATES - Buscar compañeros de piso
// ============================================================================
// Muestra un listado de personas buscando roommates.
// Por ahora usa datos de ejemplo para el MVP.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getRoommates } from '../../src/services/api';
import { Card } from '../../src/components/Card';
import { Colors } from '../../src/constants/colors';

// Tipo para los datos de un roommate
interface Roommate {
  id: string;
  nombre: string;
  edad: number;
  descripcion: string;
  ubicacion: string;
  presupuesto_min: number;
  presupuesto_max: number;
  ocupacion: string;
  intereses: string[];
  foto?: string;
  contacto: string;
  disponible: boolean;
}

export default function RoommatesScreen() {
  // Estados de la pantalla
  const [roommates, setRoommates] = useState<Roommate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Función para cargar los roommates
  const loadRoommates = async () => {
    try {
      const data = await getRoommates();
      setRoommates(data);
    } catch (error) {
      console.error('Error cargando roommates:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Cargar al montar el componente
  useEffect(() => {
    loadRoommates();
  }, []);

  // Función para refrescar
  const onRefresh = () => {
    setRefreshing(true);
    loadRoommates();
  };

  // Formatea el presupuesto como moneda
  const formatBudget = (min: number, max: number) => {
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Encabezado */}
      <View style={styles.header}>
        <Text style={styles.title}>Buscar Roommates</Text>
        <Text style={styles.subtitle}>Encuentra tu compañero ideal</Text>
      </View>

      {/* Lista de roommates */}
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
        ) : roommates.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>No hay roommates disponibles</Text>
            <Text style={styles.emptyText}>Vuelve más tarde</Text>
          </View>
        ) : (
          roommates.map((roommate) => (
            <Card key={roommate.id} style={styles.roommateCard}>
              {/* Encabezado del roommate */}
              <View style={styles.roommateHeader}>
                {/* Avatar */}
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {roommate.nombre.charAt(0).toUpperCase()}
                  </Text>
                </View>
                
                {/* Info principal */}
                <View style={styles.roommateInfo}>
                  <Text style={styles.roommateName}>{roommate.nombre}</Text>
                  <Text style={styles.roommateOccupation}>
                    {roommate.ocupacion} • {roommate.edad} años
                  </Text>
                </View>
                
                {/* Badge de disponible */}
                {roommate.disponible && (
                  <View style={styles.availableBadge}>
                    <Text style={styles.availableText}>Disponible</Text>
                  </View>
                )}
              </View>
              
              {/* Descripción */}
              <Text style={styles.description} numberOfLines={3}>
                {roommate.descripcion}
              </Text>
              
              {/* Información adicional */}
              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
                  <Text style={styles.detailText}>{roommate.ubicacion}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="wallet-outline" size={16} color={Colors.textSecondary} />
                  <Text style={styles.detailText}>
                    {formatBudget(roommate.presupuesto_min, roommate.presupuesto_max)}
                  </Text>
                </View>
              </View>
              
              {/* Intereses */}
              <View style={styles.interests}>
                {roommate.intereses.map((interes, index) => (
                  <View key={index} style={styles.interestTag}>
                    <Text style={styles.interestText}>{interes}</Text>
                  </View>
                ))}
              </View>
              
              {/* Botón de contacto */}
              <TouchableOpacity style={styles.contactButton}>
                <Ionicons name="mail-outline" size={18} color={Colors.white} />
                <Text style={styles.contactButtonText}>Contactar</Text>
              </TouchableOpacity>
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
  
  // Encabezado
  header: {
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
  },
  
  // Tarjeta de roommate
  roommateCard: {
    marginBottom: 16,
  },
  roommateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  roommateInfo: {
    flex: 1,
  },
  roommateName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  roommateOccupation: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  availableBadge: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  availableText: {
    color: Colors.success,
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Descripción
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  
  // Detalles
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  
  // Intereses
  interests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  interestTag: {
    backgroundColor: Colors.secondary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  interestText: {
    fontSize: 12,
    color: Colors.secondary,
    fontWeight: '500',
  },
  
  // Botón de contacto
  contactButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  contactButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});
