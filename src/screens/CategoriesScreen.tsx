import React, { useState, useEffect, useCallback } from 'react';
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
import { CategoriaRepuesto, Repuesto } from '../types';
import { StorageService } from '../services/StorageService';
import { useCart } from '../context/CartContext';

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
    descripcion: 'Pastillas semimetálicas, discos ventilados, zapatas, bombas y cálipers.',
    color: '#EF4444',
  },
  {
    id: 'Suspensión',
    nombre: 'Suspensión y Dirección',
    icono: 'git-commit-outline',
    descripcion: 'Amortiguadores presurizados a gas, trapecios, rótulas y bieletas.',
    color: '#3B82F6',
  },
  {
    id: 'Filtros',
    nombre: 'Filtros y Mantenimiento',
    icono: 'layers-outline',
    descripcion: 'Filtros de aceite blindados, aire diésel, trampa de agua y cabina.',
    color: '#10B981',
  },
  {
    id: 'Motor',
    nombre: 'Componentes de Motor',
    icono: 'hardware-chip-outline',
    descripcion: 'Bujías de iridio, fajas de distribución, bombas de agua e inyectores.',
    color: '#F59E0B',
  },
  {
    id: 'Accesorios',
    nombre: 'Accesorios y Equipamiento 4x4',
    icono: 'construct-outline',
    descripcion: 'Snorkels, barras LED IP68, protectores de cárter, eslingas y compresores.',
    color: '#8B5CF6',
  },
];

export const CategoriesScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedCat, setSelectedCat] = useState<CategoriaRepuesto | null>(null);
  const [favoritosIds, setFavoritosIds] = useState<string[]>([]);
  const [stockOverrides, setStockOverrides] = useState<Record<string, number>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const { addToCart } = useCart();

  const cargarEstado = useCallback(async () => {
    const [favs, overrides] = await Promise.all([
      StorageService.getFavoritos(),
      StorageService.getStockOverrides(),
    ]);
    setFavoritosIds(favs.map((f) => f.id));
    setStockOverrides(overrides);
  }, []);

  useEffect(() => {
    cargarEstado();
    const unsubscribe = navigation.addListener('focus', () => {
      cargarEstado();
    });
    return unsubscribe;
  }, [navigation, cargarEstado]);

  const mostrarToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2200);
  };

  const handleToggleFavorite = async (repuesto: Repuesto) => {
    let favs = await StorageService.getFavoritos();
    const existe = favs.some((f) => f.id === repuesto.id);
    if (existe) {
      favs = favs.filter((f) => f.id !== repuesto.id);
      mostrarToast('Eliminado de guardados');
    } else {
      favs.push(repuesto);
      mostrarToast(`${repuesto.nombre} guardado en favoritos`);
    }
    await StorageService.saveFavoritos(favs);
    setFavoritosIds(favs.map((f) => f.id));
  };

  const handleQuickAdd = async (repuesto: Repuesto) => {
    await addToCart(repuesto, 1);
    mostrarToast(`${repuesto.nombre} agregado a la pre-orden`);
  };

  const repuestosCategoria = selectedCat
    ? REPUESTOS_MOCK.filter((r) => r.categoria === selectedCat)
    : [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {toastMsg && (
        <View style={styles.floatingToast}>
          <Ionicons name="checkmark-circle" size={18} color="#10B981" />
          <Text style={styles.floatingToastText} numberOfLines={1}>
            {toastMsg}
          </Text>
        </View>
      )}

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
              : `${REPUESTOS_MOCK.length} repuestos en 5 líneas técnicas`}
          </Text>
        </View>
      </View>

      {!selectedCat ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.introText}>
            Explora nuestro catálogo técnico especializado para vehículos de trabajo, flotas y competición rally.
          </Text>

          <View style={styles.grid}>
            {CATEGORIAS_INFO.map((cat) => {
              const itemsCat = REPUESTOS_MOCK.filter((r) => r.categoria === cat.id);
              const cantidad = itemsCat.length;
              const unidadesTotales = itemsCat.reduce(
                (acc, r) => acc + (stockOverrides[r.id] !== undefined ? stockOverrides[r.id] : r.stock),
                0
              );
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.card}
                  onPress={() => setSelectedCat(cat.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.iconBox, { backgroundColor: `${cat.color}15` }]}>
                      <Ionicons name={cat.icono} size={28} color={cat.color} />
                    </View>
                    <View style={styles.stockSumPill}>
                      <Ionicons name="cube-outline" size={13} color="#475569" />
                      <Text style={styles.stockSumText}>{unidadesTotales} unid. en stock</Text>
                    </View>
                  </View>

                  <Text style={styles.cardTitle}>{cat.nombre}</Text>
                  <Text style={styles.cardDesc}>{cat.descripcion}</Text>

                  <View style={styles.cardFooter}>
                    <Text style={[styles.cardCount, { color: cat.color }]}>
                      Ver {cantidad} repuestos
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
          renderItem={({ item }) => {
            const stockActual =
              stockOverrides[item.id] !== undefined ? stockOverrides[item.id] : item.stock;
            return (
              <CardRepuesto
                repuesto={item}
                stock={stockActual}
                onPress={() =>
                  navigation.navigate('Detail', { repuesto: { ...item, stock: stockActual } })
                }
                isFavorite={favoritosIds.includes(item.id)}
                onToggleFavorite={() => handleToggleFavorite(item)}
                onAddToCart={() => handleQuickAdd(item)}
              />
            );
          }}
          contentContainerStyle={{ paddingVertical: 12 }}
          showsVerticalScrollIndicator={false}
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
  floatingToast: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 999,
    elevation: 6,
  },
  floatingToastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
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
    paddingBottom: 28,
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
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockSumPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  stockSumText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
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
