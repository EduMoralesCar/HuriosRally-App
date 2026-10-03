import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoriaRepuesto } from '../types';

interface CategoriaItem {
  nombre: CategoriaRepuesto;
  icono: keyof typeof Ionicons.glyphMap;
}

const CATEGORIAS: CategoriaItem[] = [
  { nombre: 'Todos', icono: 'car-sport' },
  { nombre: 'Frenos', icono: 'disc-outline' },
  { nombre: 'Suspensión', icono: 'git-commit-outline' },
  { nombre: 'Filtros', icono: 'layers-outline' },
  { nombre: 'Motor', icono: 'hardware-chip-outline' },
];

interface Props {
  selected: CategoriaRepuesto;
  onSelect: (cat: CategoriaRepuesto) => void;
  count?: number;
}

export const CategoryPills: React.FC<Props> = ({ selected, onSelect, count }) => {
  return (
    <View style={styles.outerWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {CATEGORIAS.map((cat) => {
          const isSelected = selected === cat.nombre;
          return (
            <TouchableOpacity
              key={cat.nombre}
              style={[styles.pill, isSelected ? styles.pillActive : styles.pillInactive]}
              onPress={() => onSelect(cat.nombre)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={cat.icono}
                size={15}
                color={isSelected ? '#FFFFFF' : '#64748B'}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.text, isSelected ? styles.textActive : styles.textInactive]}>
                {cat.nombre}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {count !== undefined && (
        <View style={styles.badgeWrapper}>
          <Text style={styles.badgeText}>
            <Text style={{ fontWeight: '800', color: '#0F172A' }}>{count}</Text> resp.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 2,
    gap: 8,
    alignItems: 'center',
  },
  badgeWrapper: {
    paddingRight: 16,
    paddingLeft: 4,
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    height: 36,
  },
  pillActive: {
    backgroundColor: '#EF4444', // Rojo activo del prototipo
  },
  pillInactive: {
    backgroundColor: '#F1F5F9',
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
  textActive: {
    color: '#FFFFFF',
  },
  textInactive: {
    color: '#475569',
  },
});
