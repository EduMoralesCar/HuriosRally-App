import React, { useState, useEffect } from 'react';
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

interface Props {
  navigation: any;
}

export const SavedFavoritesScreen: React.FC<Props> = ({ navigation }) => {
  const [favoritos, setFavoritos] = useState<Repuesto[]>([]);

  useEffect(() => {
    cargarFavoritos();
    const unsubscribe = navigation.addListener('focus', () => {
      cargarFavoritos();
    });
    return unsubscribe;
  }, [navigation]);

  const cargarFavoritos = async () => {
    const list = await StorageService.getFavoritos();
    // Sincronizar automáticamente con las URLs e información más reciente de repuestos.mock.ts
    const sincronizados = list.map((item) => {
      const fresco = REPUESTOS_MOCK.find(
        (r) => r.codigoOEM === item.codigoOEM || r.id === item.id
      );
      return fresco ? { ...item, ...fresco } : item;
    });
    setFavoritos(sincronizados);
    await StorageService.saveFavoritos(sincronizados);
  };

  const [showClearModal, setShowClearModal] = useState(false);

  const handleRemover = async (id: string) => {
    const updated = favoritos.filter((f) => f.id !== id);
    setFavoritos(updated);
    await StorageService.saveFavoritos(updated);
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
      {/* Header */}
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

      {/* Lista de Favoritos Guardados */}
      <FlatList
        data={favoritos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CardRepuesto
            repuesto={item}
            onPress={() => navigation.navigate('Detail', { repuesto: item })}
            isFavorite={true}
            onToggleFavorite={() => handleRemover(item.id)}
          />
        )}
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

      {/* Modal Confirmación de Vaciar Favoritos */}
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
