// ============================================================================
// PANTALLA PREMIUM - Suscripción Premium (Mockup)
// ============================================================================
// Muestra las ventajas de la suscripción premium.
// Es una pantalla de muestra sin funcionalidad de pago real.
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../src/components/Card';
import { Button } from '../src/components/Button';
import { Colors } from '../src/constants/colors';

// Lista de beneficios premium
const PREMIUM_FEATURES = [
  {
    icon: 'infinite-outline',
    title: 'Grupos ilimitados',
    description: 'Crea todos los grupos que necesites sin restricciones',
  },
  {
    icon: 'analytics-outline',
    title: 'Estadísticas avanzadas',
    description: 'Visualiza gráficos y reportes detallados de tus gastos',
  },
  {
    icon: 'cloud-download-outline',
    title: 'Exportar datos',
    description: 'Descarga tus gastos en Excel o PDF',
  },
  {
    icon: 'notifications-outline',
    title: 'Recordatorios automáticos',
    description: 'Envía recordatorios de pago automáticamente',
  },
  {
    icon: 'color-palette-outline',
    title: 'Temas personalizados',
    description: 'Personaliza los colores y apariencia de la app',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Sin anuncios',
    description: 'Disfruta una experiencia sin interrupciones',
  },
];

// Planes disponibles
const PLANS = [
  {
    id: 'monthly',
    name: 'Mensual',
    price: '$49',
    period: '/mes',
    popular: false,
  },
  {
    id: 'annual',
    name: 'Anual',
    price: '$399',
    period: '/año',
    savings: 'Ahorra 33%',
    popular: true,
  },
];

export default function PremiumScreen() {
  // Función para manejar la suscripción (mockup)
  const handleSubscribe = (planId: string) => {
    // En un caso real, aquí iría la integración con Stripe u otro servicio de pagos
    alert(`Funcionalidad de pago próximamente.\n\nPlan seleccionado: ${planId}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header con icono */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="star" size={48} color={Colors.secondary} />
          </View>
          <Text style={styles.title}>RoomPay Premium</Text>
          <Text style={styles.subtitle}>
            Desbloquea todas las funciones y lleva el control de tus gastos al siguiente nivel
          </Text>
        </View>

        {/* Lista de beneficios */}
        <View style={styles.features}>
          {PREMIUM_FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon as any} size={24} color={Colors.primary} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Planes de suscripción */}
        <Text style={styles.sectionTitle}>Elige tu plan</Text>
        
        <View style={styles.plans}>
          {PLANS.map((plan) => (
            <TouchableOpacity 
              key={plan.id}
              style={[
                styles.planCard,
                plan.popular && styles.planCardPopular
              ]}
              onPress={() => handleSubscribe(plan.id)}
            >
              {/* Badge de popular */}
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>Más Popular</Text>
                </View>
              )}
              
              <Text style={styles.planName}>{plan.name}</Text>
              
              <View style={styles.priceRow}>
                <Text style={styles.planPrice}>{plan.price}</Text>
                <Text style={styles.planPeriod}>{plan.period}</Text>
              </View>
              
              {plan.savings && (
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>{plan.savings}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Botón de suscripción */}
        <Button
          title="Comenzar Prueba Gratis"
          onPress={() => handleSubscribe('trial')}
          variant="primary"
          fullWidth
          style={styles.subscribeButton}
        />
        
        <Text style={styles.trialText}>
          7 días de prueba gratis. Cancela cuando quieras.
        </Text>

        {/* Términos */}
        <Text style={styles.terms}>
          Al suscribirte, aceptas nuestros Términos de Servicio y Política de Privacidad.
          La suscripción se renueva automáticamente.
        </Text>
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
  
  // Header
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  
  // Features
  features: {
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  
  // Plans
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  plans: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  planCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  planCardPopular: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  popularText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 8,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  planPeriod: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 2,
  },
  savingsBadge: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  savingsText: {
    color: Colors.success,
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Subscribe button
  subscribeButton: {
    marginBottom: 12,
  },
  trialText: {
    textAlign: 'center',
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  
  // Terms
  terms: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textLight,
    lineHeight: 18,
  },
});
