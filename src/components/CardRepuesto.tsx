import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Repuesto } from '../types';
import { ProductImage } from './ProductImage';
import { getInfoStock, getMarca, formatearSoles } from '../utils/catalog';

interface Props {
  repuesto: Repuesto;
  onPress: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  stock?: number;
  onAddToCart?: () => void;
}

const CardRepuestoComponent: React.FC<Props> = ({
  repuesto,
  onPress,
  isFavorite = false,
  onToggleFavorite,
  stock,
  onAddToCart,
}) => {
  const stockEfectivo = stock !== undefined ? stock : repuesto.stock;
  const infoStock = getInfoStock(stockEfectivo);
  const marca = getMarca(repuesto);
  const agotado = infoStock.estado === 'agotado';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      {/* Miniatura del Repuesto con fallback y loader */}
      <View style={styles.imageWrapper}>
        <ProductImage uri={repuesto.imagenUri} style={styles.image} resizeMode="contain" />
      </View>

      {/* Información Central y Precios */}
      <View style={styles.detailsContainer}>
        <View style={styles.topRow}>
          <Text style={styles.nombre} numberOfLines={1}>
            {repuesto.nombre}
          </Text>
          {onToggleFavorite && (
            <TouchableOpacity
              onPress={onToggleFavorite}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.heartButton}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={20}
                color={isFavorite ? '#EF4444' : '#64748B'}
              />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.oem}>OEM: {repuesto.codigoOEM}</Text>
        <Text style={styles.metaInfo} numberOfLines={1}>
          {marca} • {repuesto.categoria}
        </Text>

        {/* Calificación con estrellas */}
        <View style={styles.ratingRow}>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons key={star} name="star" size={12} color="#F59E0B" />
            ))}
          </View>
          <Text style={styles.ratingText}>
            {repuesto.rating || 4.8} ({repuesto.numReviews || 80})
          </Text>
        </View>

        {/* Badge de Stock Real, Precio y Botón rápido de carrito */}
        <View style={styles.bottomRow}>
          <View style={[styles.stockBadge, { backgroundColor: infoStock.fondo }]}>
            <Ionicons name={infoStock.icono} size={13} color={infoStock.color} />
            <Text style={[styles.stockText, { color: infoStock.color }]}>{infoStock.etiqueta}</Text>
          </View>

          <View style={styles.priceActionRow}>
            <Text style={styles.precio}>{formatearSoles(repuesto.precio)}</Text>
            {onAddToCart && (
              <TouchableOpacity
                style={[styles.quickCartBtn, agotado && styles.quickCartBtnDisabled]}
                onPress={onAddToCart}
                disabled={agotado}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                activeOpacity={0.8}
              >
                <Ionicons name={agotado ? 'ban-outline' : 'cart-outline'} size={15} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const CardRepuesto = memo(CardRepuestoComponent);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  imageWrapper: {
    width: 92,
    height: 92,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '90%',
    height: '90%',
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nombre: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  heartButton: {
    padding: 2,
    marginLeft: 6,
  },
  oem: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  metaInfo: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 4,
  },
  ratingText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  stockText: {
    fontSize: 11,
    fontWeight: '700',
  },
  priceActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  precio: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  quickCartBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickCartBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
});
