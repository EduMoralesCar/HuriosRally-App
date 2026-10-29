import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { REPUESTOS_MOCK } from '../data/repuestos.mock';
import { StorageService } from '../services/StorageService';
import { Repuesto, CategoriaRepuesto } from '../types';
import { ProductImage } from '../components/ProductImage';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { normalizarTexto, UMBRAL_STOCK_CRITICO } from '../utils/catalog';
import { soloDigitos } from '../utils/validators';

interface Props {
  navigation: any;
}

type FiltroKardex = CategoriaRepuesto | 'Críticos';

export const WarehouseStockScreen: React.FC<Props> = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 180);
  const [selectedCategory, setSelectedCategory] = useState<FiltroKardex>('Todos');
  const [stockOverrides, setStockOverrides] = useState<Record<string, number>>({});
  const [itemEditando, setItemEditando] = useState<Repuesto | null>(null);
  const [cantidadManual, setCantidadManual] = useState('');

  const cargarStockOverrides = useCallback(async () => {
    const overrides = await StorageService.getStockOverrides();
    setStockOverrides(overrides);
  }, []);

  useEffect(() => {
    cargarStockOverrides();
    const unsubscribe = navigation.addListener('focus', () => {
      cargarStockOverrides();
    });
    return unsubscribe;
  }, [navigation, cargarStockOverrides]);

  const getStockActual = useCallback(
    (repuesto: Repuesto): number => {
      if (stockOverrides[repuesto.id] !== undefined) {
        return stockOverrides[repuesto.id];
      }
      return repuesto.stock;
    },
    [stockOverrides]
  );

  const handleAjustarStock = async (repuesto: Repuesto, delta: number) => {
    const actual = getStockActual(repuesto);
    const nuevo = Math.max(0, actual + delta);
    await StorageService.setStockItem(repuesto.id, nuevo);
    setStockOverrides((prev) => ({ ...prev, [repuesto.id]: nuevo }));
  };

  const abrirModalIngresoManual = (repuesto: Repuesto) => {
    setItemEditando(repuesto);
    setCantidadManual(getStockActual(repuesto).toString());
  };

  const guardarIngresoManual = async () => {
    if (!itemEditando) return;
    const num = parseInt(cantidadManual, 10);
    if (!isNaN(num) && num >= 0) {
      await StorageService.setStockItem(itemEditando.id, num);
      setStockOverrides((prev) => ({ ...prev, [itemEditando.id]: num }));
    }
    setItemEditando(null);
  };

  const repuestosFiltrados = useMemo(() => {
    const q = normalizarTexto(debouncedSearch);
    return REPUESTOS_MOCK.filter((rep) => {
      const stock = getStockActual(rep);
      const matchesCategory =
        selectedCategory === 'Todos'
          ? true
          : selectedCategory === 'Críticos'
            ? stock <= UMBRAL_STOCK_CRITICO
            : rep.categoria === selectedCategory;

      if (!matchesCategory) return false;
      if (!q) return true;

      return (
        normalizarTexto(rep.nombre).includes(q) ||
        normalizarTexto(rep.codigoOEM).includes(q) ||
        normalizarTexto(rep.compatibilidad).includes(q)
      );
    });
  }, [debouncedSearch, getStockActual, selectedCategory]);

  const totalCriticos = useMemo(
    () => REPUESTOS_MOCK.filter((r) => getStockActual(r) <= UMBRAL_STOCK_CRITICO).length,
    [getStockActual]
  );

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

      {/* Selector de categorías + filtro de Stock Crítico */}
      <View style={{ paddingVertical: 8 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryPillsRow}
        >
          {(
            ['Todos', 'Críticos', 'Frenos', 'Suspensión', 'Motor', 'Filtros', 'Accesorios'] as FiltroKardex[]
          ).map((cat) => {
            const active = selectedCategory === cat;
            const esCritico = cat === 'Críticos';
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.pill,
                  active && (esCritico ? styles.pillCriticoActive : styles.pillActive),
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                {esCritico && (
                  <Ionicons
                    name="alert-circle-outline"
                    size={13}
                    color={active ? '#FFFFFF' : '#DC2626'}
                    style={{ marginRight: 4 }}
                  />
                )}
                <Text
                  style={[
                    styles.pillText,
                    active && styles.pillTextActive,
                    !active && esCritico && { color: '#DC2626' },
                  ]}
                >
                  {esCritico ? `Críticos (${totalCriticos})` : cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Lista de Repuestos con Control de Stock */}
      <FlatList
        data={repuestosFiltrados}
        keyExtractor={(item) => item.id}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        renderItem={({ item, index }) => {
          const stock = getStockActual(item);
          const pocoStock = stock <= UMBRAL_STOCK_CRITICO;
          const anaquel = `Anaquel ${String.fromCharCode(65 + (index % 4))}-${(index % 8) + 1}`;

          return (
            <View style={styles.stockCard}>
              <ProductImage uri={item.imagenUri} style={styles.itemImg} resizeMode="contain" />

              <View style={styles.itemInfo}>
                <Text style={styles.itemNombre} numberOfLines={1}>
                  {item.nombre}
                </Text>
                <Text style={styles.itemOEM}>OEM: {item.codigoOEM}</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={12} color="#0066FF" />
                  <Text style={styles.locationText}>{anaquel}</Text>
                  <Text style={styles.dot}>•</Text>
                  <Text style={styles.compatText} numberOfLines={1}>
                    {item.compatibilidad}
                  </Text>
                </View>
              </View>

              <View style={styles.stockControlBox}>
                <TouchableOpacity
                  style={[styles.stockPill, pocoStock ? styles.stockPillAlert : styles.stockPillOk]}
                  onPress={() => abrirModalIngresoManual(item)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.stockPillText,
                      pocoStock ? styles.stockTextAlert : styles.stockTextOk,
                    ]}
                  >
                    {stock} unid.
                  </Text>
                  <Ionicons
                    name="create-outline"
                    size={11}
                    color={pocoStock ? '#DC2626' : '#16A34A'}
                  />
                </TouchableOpacity>

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
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Modal de Ajuste Físico de Kardex */}
      <Modal visible={!!itemEditando} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Ajuste Físico de Kardex</Text>
            <Text style={styles.modalSub}>{itemEditando?.nombre}</Text>
            <Text style={styles.modalOem}>OEM: {itemEditando?.codigoOEM}</Text>

            <Text style={styles.modalLabel}>Nueva cantidad física en anaquel:</Text>
            <TextInput
              style={styles.modalInput}
              value={cantidadManual}
              onChangeText={(t) => setCantidadManual(soloDigitos(t).slice(0, 4))}
              keyboardType="numeric"
              maxLength={4}
              placeholder="Ej. 25"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setItemEditando(null)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={guardarIngresoManual}
              >
                <Text style={styles.modalSaveText}>Actualizar Stock</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    gap: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
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
  pillCriticoActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    minWidth: 66,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#334155',
    marginTop: 4,
  },
  modalOem: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    height: 46,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#475569',
  },
  modalSaveBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
