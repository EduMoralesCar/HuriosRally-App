import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { REPUESTOS_MOCK } from '../data/repuestos.mock';
import { StorageService } from '../services/StorageService';
import { Repuesto, CategoriaRepuesto } from '../types';

interface Props {
  navigation: any;
}

export const WarehouseStockScreen: React.FC<Props> = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoriaRepuesto>('Todos');
  const [stockOverrides, setStockOverrides] = useState<Record<string, number>>({});

  useEffect(() => {
    cargarStockOverrides();
    const unsubscribe = navigation.addListener('focus', () => {
      cargarStockOverrides();
    });
    return unsubscribe;
  }, [navigation]);

  const cargarStockOverrides = async () => {
    const overrides = await StorageService.getStockOverrides();
    setStockOverrides(overrides);
  };

  const getStockActual = (repuesto: Repuesto): number => {
    if (stockOverrides[repuesto.id] !== undefined) {
      return stockOverrides[repuesto.id];
    }
    return repuesto.stock;
  };

  const handleAjustarStock = async (repuesto: Repuesto, delta: number) => {
    const actual = getStockActual(repuesto);
    const nuevo = Math.max(0, actual + delta);
    await StorageService.setStockItem(repuesto.id, nuevo);
    setStockOverrides((prev) => ({ ...prev, [repuesto.id]: nuevo }));
  };

  const handleIngresoManual = (repuesto: Repuesto) => {
    Alert.prompt
      ? Alert.prompt(
          'Ingreso de Mercadería',
          `Ingresa la cantidad física recibida para: ${repuesto.nombre}`,
          async (text) => {
            const num = parseInt(text, 10);
            if (!isNaN(num) && num >= 0) {
              await StorageService.setStockItem(repuesto.id, num);
              setStockOverrides((prev) => ({ ...prev, [repuesto.id]: num }));
            }
          },
          'plain-text',
          getStockActual(repuesto).toString(),
          'numeric'
        )
      : handleAjustarStock(repuesto, 1);
  };

  const repuestosFiltrados = REPUESTOS_MOCK.filter((rep) => {
    const matchesCategory = selectedCategory === 'Todos' || rep.categoria === selectedCategory;
    const matchesSearch =
      rep.nombre.toLowerCase().includes(search.toLowerCase()) ||
      rep.codigoOEM.toLowerCase().includes(search.toLowerCase()) ||
      rep.compatibilidad.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header Almacén */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Inventario & Kardex</Text>
          <Text style={styles.headerSub}>Control físico de anaqueles • Sede SMP</Text>
        </View>
        <View style={styles.kardexBadge}>
          <Ionicons name="shield-checkmark" size={14} color="#10B981" />
          <Text style={styles.kardexBadgeText}>Kardex Activo</Text>
        </View>
      </View>

      {/* Buscador de repuestos en bodega */}
      <View style={styles.searchBarBox}>
        <Ionicons name="search" size={18} color="#64748B" style={{ marginLeft: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar repuesto por código OEM o nombre..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={{ padding: 6 }}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Selector de categorías */}
      <View style={styles.categoryPillsRow}>
        {(['Todos', 'Frenos', 'Suspensión', 'Motor', 'Filtros', 'Accesorios'] as CategoriaRepuesto[]).map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.pill, selectedCategory === cat && styles.pillActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.pillText, selectedCategory === cat && styles.pillTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista de Repuestos con Control de Stock (+ / -) */}
      <FlatList
        data={repuestosFiltrados}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          const stock = getStockActual(item);
          const pocoStock = stock <= 3;
          const anaquel = `Anaquel ${String.fromCharCode(65 + (index % 4))}-${(index % 8) + 1}`;

          return (
            <View style={styles.stockCard}>
              <Image source={{ uri: item.imagenUri }} style={styles.itemImg} resizeMode="contain" />

              <View style={styles.itemInfo}>
                <Text style={styles.itemNombre} numberOfLines={1}>{item.nombre}</Text>
                <Text style={styles.itemOEM}>OEM: {item.codigoOEM}</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={12} color="#0066FF" />
                  <Text style={styles.locationText}>{anaquel}</Text>
                  <Text style={styles.dot}>•</Text>
                  <Text style={styles.compatText} numberOfLines={1}>{item.compatibilidad}</Text>
                </View>
              </View>

              {/* Controles de Entrada y Salida de Stock */}
              <View style={styles.stockControlBox}>
                <View style={[styles.stockPill, pocoStock ? styles.stockPillAlert : styles.stockPillOk]}>
                  <Text style={[styles.stockPillText, pocoStock ? styles.stockTextAlert : styles.stockTextOk]}>
                    {stock} unid.
                  </Text>
                </View>

                <View style={styles.btnQtyRow}>
                  <TouchableOpacity
                    style={styles.qtyBtnMinus}
                    onPress={() => handleAjustarStock(item, -1)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.qtyBtnMinusText}>-</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.qtyBtnPlus}
                    onPress={() => handleAjustarStock(item, 1)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.qtyBtnPlusText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  headerSub: {
    color: '#94A3B8',
    fontSize: 11.5,
    marginTop: 2,
  },
  kardexBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  kardexBadgeText: {
    color: '#A7F3D0',
    fontSize: 11,
    fontWeight: '700',
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 42,
    paddingRight: 6,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  categoryPillsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    gap: 6,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  pillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  stockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  itemImg: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  itemInfo: {
    flex: 1,
  },
  itemNombre: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemOEM: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0066FF',
  },
  dot: {
    fontSize: 11,
    color: '#94A3B8',
  },
  compatText: {
    flex: 1,
    fontSize: 10.5,
    color: '#64748B',
  },
  stockControlBox: {
    alignItems: 'center',
    gap: 6,
  },
  stockPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    minWidth: 54,
    alignItems: 'center',
  },
  stockPillOk: {
    backgroundColor: '#DCFCE7',
  },
  stockPillAlert: {
    backgroundColor: '#FEE2E2',
  },
  stockPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  stockTextOk: {
    color: '#16A34A',
  },
  stockTextAlert: {
    color: '#DC2626',
  },
  btnQtyRow: {
    flexDirection: 'row',
    gap: 4,
  },
  qtyBtnMinus: {
    width: 28,
    height: 28,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qtyBtnMinusText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#475569',
  },
  qtyBtnPlus: {
    width: 28,
    height: 28,
    backgroundColor: '#0066FF',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnPlusText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
