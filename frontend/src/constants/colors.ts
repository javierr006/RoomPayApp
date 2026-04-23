// ============================================================================
// COLORES DE LA APP - Paleta de colores de RoomPay
// ============================================================================
// Estos son los colores principales que usamos en toda la aplicación.
// Naranja para acciones principales, amarillo para alertas, y tonos neutros.
// ============================================================================

export const Colors = {
  // --- Colores Principales ---
  primary: '#FF6B35',      // Naranja - Botones principales y acciones
  secondary: '#FFB800',    // Amarillo - Alertas y destacados
  
  // --- Colores de Fondo ---
  background: '#F8F9FA',   // Gris muy claro - Fondo general
  card: '#FFFFFF',         // Blanco - Tarjetas y contenedores
  
  // --- Colores de Texto ---
  text: '#1A1A2E',         // Casi negro - Texto principal
  textSecondary: '#666666', // Gris - Texto secundario
  textLight: '#999999',    // Gris claro - Texto menos importante
  
  // --- Colores de Estado ---
  success: '#4CAF50',      // Verde - Solvente/Pagado
  warning: '#FFB800',      // Amarillo - Pendiente
  danger: '#F44336',       // Rojo - Atrasado
  info: '#2196F3',         // Azul - Información
  partial: '#FF9800',      // Naranja claro - Pago parcial
  
  // --- Colores de Borde ---
  border: '#E0E0E0',       // Gris claro - Bordes
  borderLight: '#F0F0F0',  // Gris muy claro - Bordes sutiles
  
  // --- Colores Adicionales ---
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)', // Para modales y overlays
};

// Función auxiliar para obtener el color según el estado de pago
export const getStatusColor = (estado: string): string => {
  switch (estado) {
    case 'solvente':
      return Colors.success;
    case 'pendiente':
      return Colors.warning;
    case 'parcial':
      return Colors.partial;
    case 'atrasado':
      return Colors.danger;
    default:
      return Colors.textSecondary;
  }
};

// Función para obtener el texto del estado en español
export const getStatusText = (estado: string): string => {
  switch (estado) {
    case 'solvente':
      return 'Solvente';
    case 'pendiente':
      return 'Pendiente';
    case 'parcial':
      return 'Pago Parcial';
    case 'atrasado':
      return 'Atrasado';
    default:
      return estado;
  }
};
