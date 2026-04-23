// ============================================================================
// PANTALLA AGREGAR GASTO - Crear un nuevo gasto
// ============================================================================
// Permite crear un gasto con descripción, monto y elegir cómo dividirlo.
// Puede ser división equitativa o manual.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getGroup, createExpense } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';
import { Button } from '../../src/components/Button';
import { Colors } from '../../src/constants/colors';

// Categorías disponibles
const CATEGORIES = [
  { id: 'general', name: 'General', icon: 'receipt-outline' },
  { id: 'comida', name: 'Comida', icon: 'restaurant-outline' },
  { id: 'servicios', name: 'Servicios', icon: 'flash-outline' },
  { id: 'renta', name: 'Renta', icon: 'home-outline' },
  { id: 'transporte', name: 'Transporte', icon: 'car-outline' },
  { id: 'entretenimiento', name: 'Entretenimiento', icon: 'game-controller-outline' },
];

// Tipo para miembro del grupo
interface Member {
  id: string;
  nombre: string;
  foto_perfil?: string;
}

export default function AddExpenseScreen() {
  // Parámetros de la URL
  const { groupId, groupName } = useLocalSearchParams<{ groupId: string; groupName: string }>();
  const { user } = useAuthStore();
  
  // Estados del formulario
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState('general');
  const [divisionType, setDivisionType] = useState<'equal' | 'manual'>('equal');
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [manualAmounts, setManualAmounts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Cargar miembros del grupo
  useEffect(() => {
    const loadMembers = async () => {
      try {
        const group = await getGroup(groupId!);
        setMembers(group.miembros);
        // Seleccionar todos los miembros por defecto (excepto el usuario actual)
        setSelectedMembers(group.miembros.filter((m: Member) => m.id !== user?.id).map((m: Member) => m.id));
      } catch (error) {
        console.error('Error cargando miembros:', error);
      } finally {
        setLoadingMembers(false);
      }
    };
    
    if (groupId) {
      loadMembers();
    }
  }, [groupId]);

  // Toggle selección de miembro
  const toggleMember = (memberId: string) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(prev => prev.filter(id => id !== memberId));
    } else {
      setSelectedMembers(prev => [...prev, memberId]);
    }
  };

  // Calcular monto por persona (división equitativa)
  const getAmountPerPerson = () => {
    const total = parseFloat(monto) || 0;
    const numPeople = selectedMembers.length;
    if (numPeople === 0) return 0;
    return total / numPeople;
  };

  // Validar división manual
  const validateManualDivision = () => {
    const total = parseFloat(monto) || 0;
    let sum = 0;
    for (const memberId of selectedMembers) {
      sum += parseFloat(manualAmounts[memberId] || '0');
    }
    return Math.abs(sum - total) < 0.01; // Tolerancia de 1 centavo
  };

  // Crear el gasto
  const handleCreateExpense = async () => {
    // Validaciones
    if (!descripcion.trim()) {
      Alert.alert('Error', 'Ingresa una descripción para el gasto');
      return;
    }
    
    const montoNum = parseFloat(monto);
    if (!monto || isNaN(montoNum) || montoNum <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }
    
    if (selectedMembers.length === 0) {
      Alert.alert('Error', 'Selecciona al menos un miembro para dividir');
      return;
    }
    
    if (divisionType === 'manual' && !validateManualDivision()) {
      Alert.alert('Error', 'La suma de los montos manuales debe ser igual al total');
      return;
    }

    setLoading(true);
    try {
      // Preparar datos del gasto
      const expenseData: any = {
        grupo_id: groupId,
        descripcion: descripcion.trim(),
        monto: montoNum,
        categoria,
        dividir_entre: selectedMembers,
      };
      
      // Si es división manual, agregar los montos
      if (divisionType === 'manual') {
        const division: Record<string, number> = {};
        for (const memberId of selectedMembers) {
          division[memberId] = parseFloat(manualAmounts[memberId] || '0');
        }
        expenseData.division_manual = division;
      }
      
      await createExpense(expenseData);
      Alert.alert('Éxito', 'Gasto creado correctamente', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo crear el gasto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Info del grupo */}
          <View style={styles.groupInfo}>
            <Ionicons name="people" size={18} color={Colors.primary} />
            <Text style={styles.groupName}>{groupName}</Text>
          </View>
          
          {/* Campo de descripción */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Supermercado, Luz, Internet..."
              value={descripcion}
              onChangeText={setDescripcion}
              placeholderTextColor={Colors.textLight}
            />
          </View>
          
          {/* Campo de monto */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Monto Total</Text>
            <View style={styles.montoContainer}>
              <Text style={styles.montoPrefix}>$</Text>
              <TextInput
                style={styles.montoInput}
                placeholder="0.00"
                value={monto}
                onChangeText={setMonto}
                keyboardType="decimal-pad"
                placeholderTextColor={Colors.textLight}
              />
            </View>
          </View>
          
          {/* Categoría */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Categoría</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoriesRow}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      categoria === cat.id && styles.categoryChipActive
                    ]}
                    onPress={() => setCategoria(cat.id)}
                  >
                    <Ionicons 
                      name={cat.icon as any} 
                      size={18} 
                      color={categoria === cat.id ? Colors.white : Colors.text} 
                    />
                    <Text style={[
                      styles.categoryText,
                      categoria === cat.id && styles.categoryTextActive
                    ]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
          
          {/* Tipo de división */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>¿Cómo dividir?</Text>
            <View style={styles.divisionToggle}>
              <TouchableOpacity
                style={[
                  styles.divisionOption,
                  divisionType === 'equal' && styles.divisionOptionActive
                ]}
                onPress={() => setDivisionType('equal')}
              >
                <Text style={[
                  styles.divisionText,
                  divisionType === 'equal' && styles.divisionTextActive
                ]}>
                  Equitativa
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.divisionOption,
                  divisionType === 'manual' && styles.divisionOptionActive
                ]}
                onPress={() => setDivisionType('manual')}
              >
                <Text style={[
                  styles.divisionText,
                  divisionType === 'manual' && styles.divisionTextActive
                ]}>
                  Manual
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Selección de miembros */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dividir entre</Text>
            {loadingMembers ? (
              <Text style={styles.loadingText}>Cargando miembros...</Text>
            ) : (
              <View style={styles.membersList}>
                {members.filter(m => m.id !== user?.id).map((member) => {
                  const isSelected = selectedMembers.includes(member.id);
                  const amountPerPerson = getAmountPerPerson();
                  
                  return (
                    <TouchableOpacity
                      key={member.id}
                      style={[
                        styles.memberItem,
                        isSelected && styles.memberItemActive
                      ]}
                      onPress={() => toggleMember(member.id)}
                    >
                      <View style={styles.memberLeft}>
                        <View style={[
                          styles.checkbox,
                          isSelected && styles.checkboxActive
                        ]}>
                          {isSelected && (
                            <Ionicons name="checkmark" size={14} color={Colors.white} />
                          )}
                        </View>
                        <Text style={styles.memberName}>{member.nombre}</Text>
                      </View>
                      
                      {/* Monto (equitativo o manual) */}
                      {isSelected && (
                        divisionType === 'equal' ? (
                          <Text style={styles.memberAmount}>
                            ${amountPerPerson.toFixed(2)}
                          </Text>
                        ) : (
                          <TextInput
                            style={styles.manualAmountInput}
                            placeholder="0.00"
                            value={manualAmounts[member.id] || ''}
                            onChangeText={(text) => setManualAmounts(prev => ({
                              ...prev,
                              [member.id]: text
                            }))}
                            keyboardType="decimal-pad"
                            placeholderTextColor={Colors.textLight}
                          />
                        )
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
        
        {/* Botón de crear */}
        <View style={styles.footer}>
          <Button
            title="Crear Gasto"
            onPress={handleCreateExpense}
            loading={loading}
            fullWidth
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  
  // Info del grupo
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    padding: 12,
    borderRadius: 10,
    marginBottom: 24,
  },
  groupName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  
  // Campos del formulario
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 10,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  
  // Campo de monto
  montoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
  },
  montoPrefix: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
  },
  montoInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    paddingVertical: 14,
    marginLeft: 4,
  },
  
  // Categorías
  categoriesRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 6,
  },
  categoryTextActive: {
    color: Colors.white,
  },
  
  // Tipo de división
  divisionToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 4,
  },
  divisionOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  divisionOptionActive: {
    backgroundColor: Colors.primary,
  },
  divisionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  divisionTextActive: {
    color: Colors.white,
  },
  
  // Lista de miembros
  loadingText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    padding: 20,
  },
  membersList: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  memberItemActive: {
    backgroundColor: Colors.primary + '08',
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  memberName: {
    fontSize: 15,
    color: Colors.text,
  },
  memberAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  manualAmountInput: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    width: 80,
    textAlign: 'right',
  },
  
  // Footer
  footer: {
    padding: 20,
    paddingBottom: 10,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
