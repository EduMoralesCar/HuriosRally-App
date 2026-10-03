import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Repuesto } from '../types';

interface Props {
  repuesto: Repuesto;
  onPress: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const CardRepuesto: React.FC<Props> = ({
  repuesto,
  onPress,
  isFavorite = false,
  onToggleFavorite,
}) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      {/* Miniatura del Repuesto */}
      <View style={styles.imageWrapper}>
        <Image source={{ uri: repuesto.imagenUri }} style={styles.image} resizeMode="contain" />
      </View>

      {/* Información Central y Precios */}
      <View style={styles.detailsContainer}>
        <View style={styles.topRow}>
          <Text style={styles.nombre} numberOfLines={1}>
            {repuesto.nombre}
          </Text>
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
        </View>

        <Text style={styles.oem}>OEM: {repuesto.codigoOEM}</Text>
        <Text style={styles.metaInfo}>Toyota | {repuesto.categoria}</Text>

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

        {/* Badge En Stock y Precio */}
        <View style={styles.bottomRow}>
          <View style={styles.stockBadge}>
            <Ionicons name="checkmark-circle" size={13} color="#10B981" />
            <Text style={styles.stockText}>En stock</Text>
          </View>

          <Text style={styles.precio}>S/ {repuesto.precio.toFixed(2)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

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
    width: 90,
    height: 90,
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
    alignItems: 'flex-end',
    marginTop: 6,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  stockText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  precio: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
});
