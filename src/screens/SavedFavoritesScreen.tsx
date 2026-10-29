import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Repuesto } from '../types';
import { StorageService } from '../services/StorageService';
import { CardRepuesto } from '../components/CardRepuesto';
import { REPUESTOS_MOCK } from '../data/repuestos.mock';
import { useCart } from '../context/CartContext';

interface Props {
  navigation: any;
}

export const SavedFavoritesScreen: React.FC<Props> = ({ navigation }) => {
  const [favoritos, setFavoritos] = useState<Repuesto[]>([]);
  const [stockOverrides, setStockOverrides] = useState<Record<string, number>>({});
  const [showClearModal, setShowClearModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const { addToCart } = useCart();

  const cargarFavoritos = useCallback(async () => {
    const [list, overrides] = await Promise.all([
      StorageService.getFavoritos(),
      StorageService.getStockOverrides(),
    ]);
    const sincronizados = list.map((item) => {
      const fresco = REPUESTOS_MOCK.find(
        (r) => r.codigoOEM === item.codigoOEM || r.id === item.id
      );
      return fresco ? { ...item, ...fresco } : item;
    });
    setFavoritos(sincronizados);
    setStockOverrides(overrides);
    await StorageService.saveFavoritos(sincronizados);
  }, []);

  useEffect(() => {
    cargarFavoritos();
    const unsubscribe = navigation.addListener('focus', () => {
      cargarFavoritos();
    });
    return unsubscribe;
  }, [navigation, cargarFavoritos]);

  const mostrarToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2200);
  };

  const handleRemover = async (id: string) => {
    const updated = favoritos.filter((f) => f.id !== id);
    setFavoritos(updated);
    await StorageService.saveFavoritos(updated);
    mostrarToast('Repuesto eliminado de favoritos');
  };

  const handleQuickAdd = async (repuesto: Repuesto) => {
    await addToCart(repuesto, 1);
    mostrarToast(`${repuesto.nombre} agregado a la pre-orden`);
  };

  const handleVaciar = () => {
    if (favoritos.length === 0) return;
    setShowClearModal(true);
  };

  const confirmarVaciar = async () => {
    setFavoritos([]);
    await StorageService.saveFavoritos([]);
    setShowClearModal(false);
  };

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
        <View style={styles.iconCircle}>
          <Ionicons name="heart" size={20} color="#EF4444" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Repuestos Favoritos</Text>
          <Text style={styles.headerSubtitle}>
            {favoritos.length} pieza(s) guardada(s) para seguimiento
          </Text>
        </View>
        {favoritos.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={handleVaciar}>
            <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={favoritos}
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
              isFavorite={true}
              onToggleFavorite={() => handleRemover(item.id)}
              onAddToCart={() => handleQuickAdd(item)}
            />
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="heart-outline" size={48} color="#CBD5E1" />
            </View>
            <Text style={styles.emptyTitle}>No tienes favoritos guardados</Text>
            <Text style={styles.emptySubtitle}>
              Toca el icono de corazón en cualquier repuesto del catálogo para agregarlo aquí y acceder rápidamente a sus cotizaciones.
            </Text>
            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={() => navigation.navigate('InicioTab')}
            >
              <Text style={styles.exploreBtnText}>Ir al Catálogo</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={{ paddingVertical: 12 }}
      />

      <Modal visible={showClearModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmBox}>
            <View style={styles.confirmIconCircle}>
              <Ionicons name="heart-dislike" size={28} color="#EF4444" />
            </View>
            <Text style={styles.confirmTitle}>¿Vaciar Favoritos?</Text>
            <Text style={styles.confirmDesc}>
              Se removerán todos los repuestos de tu lista de favoritos.
            </Text>
            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={styles.confirmBtnCancel}
                onPress={() => setShowClearModal(false)}
              >
                <Text style={styles.confirmBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtnDanger}
                onPress={confirmarVaciar}
              >
                <Text style={styles.confirmBtnDangerText}>Sí, Vaciar</Text>
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
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
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
  clearBtn: {
    padding: 6,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginTop: 80,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
  },
  exploreBtn: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 22,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 15,
  },
  confirmIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmBtnCancel: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  confirmBtnDanger: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnDangerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
