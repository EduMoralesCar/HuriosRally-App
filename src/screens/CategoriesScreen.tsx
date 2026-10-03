import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { REPUESTOS_MOCK } from '../data/repuestos.mock';
import { CardRepuesto } from '../components/CardRepuesto';
import { CategoriaRepuesto } from '../types';

interface Props {
  navigation: any;
}

interface CategoriaCard {
  id: CategoriaRepuesto;
  nombre: string;
  icono: keyof typeof Ionicons.glyphMap;
  descripcion: string;
  color: string;
}

const CATEGORIAS_INFO: CategoriaCard[] = [
  {
    id: 'Frenos',
    nombre: 'Sistema de Frenos',
    icono: 'disc-outline',
    descripcion: 'Pastillas, discos ventilados, zapatas, bombas y calipers.',
    color: '#EF4444',
  },
  {
    id: 'Suspensión',
    nombre: 'Suspensión y Dirección',
    icono: 'git-commit-outline',
    descripcion: 'Amortiguadores a gas, trapecios, rótulas y bieletas.',
    color: '#3B82F6',
  },
  {
    id: 'Filtros',
    nombre: 'Filtros y Mantenimiento',
    icono: 'layers-outline',
    descripcion: 'Filtros de aceite blindados, aire, petróleo y cabina.',
    color: '#10B981',
  },
  {
    id: 'Motor',
    nombre: 'Componentes de Motor',
    icono: 'hardware-chip-outline',
    descripcion: 'Bujías de iridio, fajas de distribución, bombas e inyectores.',
    color: '#F59E0B',
  },
];

export const CategoriesScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedCat, setSelectedCat] = React.useState<CategoriaRepuesto | null>(null);

  const repuestosCategoria = selectedCat
    ? REPUESTOS_MOCK.filter((r) => r.categoria === selectedCat)
    : [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        {selectedCat ? (
          <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedCat(null)}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconCircle}>
            <Ionicons name="grid" size={20} color="#EF4444" />
          </View>
        )}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>
            {selectedCat ? `Categoría: ${selectedCat}` : 'Categorías de Repuestos'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {selectedCat
              ? `${repuestosCategoria.length} repuestos disponibles`
              : 'Selecciona una categoría técnica'}
          </Text>
        </View>
      </View>

      {!selectedCat ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.introText}>
            Explora nuestro catálogo técnico especializado para vehículos de trabajo y competición.
          </Text>

          <View style={styles.grid}>
            {CATEGORIAS_INFO.map((cat) => {
              const cantidad = REPUESTOS_MOCK.filter((r) => r.categoria === cat.id).length;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.card}
                  onPress={() => setSelectedCat(cat.id)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.iconBox, { backgroundColor: `${cat.color}15` }]}>
                    <Ionicons name={cat.icono} size={28} color={cat.color} />
                  </View>
                  <Text style={styles.cardTitle}>{cat.nombre}</Text>
                  <Text style={styles.cardDesc}>{cat.descripcion}</Text>

                  <View style={styles.cardFooter}>
                    <Text style={[styles.cardCount, { color: cat.color }]}>
                      {cantidad} repuestos
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color={cat.color} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={repuestosCategoria}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CardRepuesto
              repuesto={item}
              onPress={() => navigation.navigate('Detail', { repuesto: item })}
            />
          )}
          contentContainerStyle={{ paddingVertical: 12 }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  backBtn: {
    padding: 4,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 1,
  },
  content: {
    padding: 16,
  },
  introText: {
    fontSize: 13.5,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 20,
  },
  grid: {
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  cardCount: {
    fontSize: 13,
    fontWeight: '700',
  },
});
