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
import { StorageService } from '../services/StorageService';
import { PedidoLocal } from '../types';

interface Props {
  navigation: any;
}

export const WarehouseDispatchScreen: React.FC<Props> = ({ navigation }) => {
  const [pedidos, setPedidos] = useState<PedidoLocal[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<'Todos' | 'Pendientes' | 'Entregados'>('Pendientes');
  const [pedidoPorDespachar, setPedidoPorDespachar] = useState<PedidoLocal | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const cargarPedidos = useCallback(async () => {
    const list = await StorageService.getHistorialPedidos();
    setPedidos(list);
  }, []);

  useEffect(() => {
    cargarPedidos();
    const unsubscribe = navigation.addListener('focus', () => {
      cargarPedidos();
    });
    return unsubscribe;
  }, [navigation, cargarPedidos]);

  const confirmarDespacho = async () => {
    if (!pedidoPorDespachar?.id) return;
    const id = pedidoPorDespachar.id;
    await StorageService.updatePedidoEstado(id, 'Entregado');
    setPedidoPorDespachar(null);
    await cargarPedidos();
    setToastMsg(`Orden ${id} marcada como Entregada`);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const pedidosFiltrados = pedidos.filter((p) => {
    if (filtroEstado === 'Pendientes') {
      return p.estado !== 'Entregado';
    }
    if (filtroEstado === 'Entregados') {
      return p.estado === 'Entregado';
    }
    return true;
  });

  const totalPendientes = pedidos.filter((p) => p.estado !== 'Entregado').length;
  const totalEntregados = pedidos.filter((p) => p.estado === 'Entregado').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {toastMsg && (
        <View style={styles.floatingToast}>
          <Ionicons name="checkmark-circle" size={18} color="#10B981" />
          <Text style={styles.floatingToastText}>{toastMsg}</Text>
        </View>
      )}

      {/* Header Almacén */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Control de Despachos</Text>
          <Text style={styles.headerSub}>Almacén Central • Sede San Martín de Porres</Text>
        </View>
        <TouchableOpacity style={styles.reloadBtn} onPress={cargarPedidos}>
          <Ionicons name="reload" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Resumen Operativo */}
      <View style={styles.statsBanner}>
        <View style={styles.statItem}>
          <Text style={styles.statValOrange}>{totalPendientes}</Text>
          <Text style={styles.statLbl}>Por Entregar</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValGreen}>{totalEntregados}</Text>
          <Text style={styles.statLbl}>Despachados</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValBlue}>{pedidos.length}</Text>
          <Text style={styles.statLbl}>Total Órdenes</Text>
        </View>
      </View>

      {/* Filtros de Estado */}
      <View style={styles.filterTabsRow}>
        <TouchableOpacity
          style={[styles.filterTab, filtroEstado === 'Pendientes' && styles.filterTabActiveOrange]}
          onPress={() => setFiltroEstado('Pendientes')}
        >
          <Ionicons
            name="time-outline"
            size={16}
            color={filtroEstado === 'Pendientes' ? '#FFFFFF' : '#D97706'}
          />
          <Text
            style={[
              styles.filterTabText,
              filtroEstado === 'Pendientes' && styles.filterTabTextActive,
            ]}
          >
            Pendientes ({totalPendientes})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filtroEstado === 'Entregados' && styles.filterTabActiveGreen]}
          onPress={() => setFiltroEstado('Entregados')}
        >
          <Ionicons
            name="checkmark-done"
            size={16}
            color={filtroEstado === 'Entregados' ? '#FFFFFF' : '#16A34A'}
          />
          <Text
            style={[
              styles.filterTabText,
              filtroEstado === 'Entregados' && styles.filterTabTextActive,
            ]}
          >
            Despachados ({totalEntregados})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filtroEstado === 'Todos' && styles.filterTabActiveBlue]}
          onPress={() => setFiltroEstado('Todos')}
        >
          <Text
            style={[styles.filterTabText, filtroEstado === 'Todos' && styles.filterTabTextActive]}
          >
            Todos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Órdenes */}
      <FlatList
        data={pedidosFiltrados}
        keyExtractor={(item, index) => item.id || `ped-${index}`}
        renderItem={({ item }) => {
          const esEntregado = item.estado === 'Entregado';

          return (
            <View style={styles.orderCard}>
              <View style={styles.orderCardHeader}>
                <View>
                  <Text style={styles.orderId}>{item.id || 'PED-S/N'}</Text>
                  <Text style={styles.orderDate}>
                    Fecha: {item.fechaCreacion}
                    {item.creadoPorNombre ? ` • Emitido por: ${item.creadoPorNombre}` : ''}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    esEntregado ? styles.statusBadgeEntregado : styles.statusBadgePendiente,
                  ]}
                >
                  <Ionicons
                    name={esEntregado ? 'checkmark-circle' : 'hourglass-outline'}
                    size={14}
                    color={esEntregado ? '#16A34A' : '#D97706'}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.statusBadgeText,
                      esEntregado ? styles.statusTextEntregado : styles.statusTextPendiente,
                    ]}
                  >
                    {item.estado || 'Confirmado'}
                  </Text>
                </View>
              </View>

              <View style={styles.clientDetailRow}>
                <Ionicons name="person-outline" size={15} color="#475569" />
                <Text style={styles.clientNameText}>
                  Cliente:{' '}
                  <Text style={{ fontWeight: '700', color: '#0F172A' }}>
                    {item.clienteNombre || 'Cliente'}
                  </Text>
                  {item.clienteTelefono ? ` (${item.clienteTelefono})` : ''}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="document-text-outline" size={13} color="#64748B" />
                  <Text style={styles.metaText}>
                    {item.comprobanteTipo || 'Boleta'}{' '}
                    {item.documentoNumero ? `(${item.documentoNumero})` : ''}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="card-outline" size={13} color="#64748B" />
                  <Text style={styles.metaText}>
                    {item.metodoPago || 'Efectivo'}
                    {item.numOperacion ? ` #${item.numOperacion}` : ''}
                  </Text>
                </View>
              </View>

              <View style={styles.itemsBox}>
                <Text style={styles.itemsBoxTitle}>
                  REPUESTOS A DESPACHAR ({item.items.length}):
                </Text>
                {item.items.map((it, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <View style={styles.qtyBadge}>
                      <Text style={styles.qtyBadgeText}>{it.cantidad}x</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemNombre} numberOfLines={1}>
                        {it.repuesto.nombre}
                      </Text>
                      <Text style={styles.itemOEM}>OEM: {it.repuesto.codigoOEM}</Text>
                    </View>
                    <Text style={styles.itemPrice}>
                      S/ {(it.repuesto.precio * it.cantidad).toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.actionsFooter}>
                <View>
                  <Text style={styles.totalLbl}>Total del Pedido</Text>
                  <Text style={styles.totalVal}>S/ {item.totalCotizado.toFixed(2)}</Text>
                </View>

                {!esEntregado ? (
                  <TouchableOpacity
                    style={styles.btnDespachar}
                    onPress={() => setPedidoPorDespachar(item)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={18}
                      color="#FFFFFF"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.btnDespacharText}>Marcar Entregado</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.entregadoTag}>
                    <Ionicons
                      name="checkmark-done"
                      size={16}
                      color="#16A34A"
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.entregadoTagText}>Despachado</Text>
                  </View>
                )}
              </View>
            </View>
          );
        }}
        contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="cube-outline" size={54} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No hay pedidos {filtroEstado.toLowerCase()}</Text>
            <Text style={styles.emptySub}>
              Cuando los clientes o asesores generen una orden, aparecerá aquí para ser despachada.
            </Text>
          </View>
        }
      />

      {/* Modal de Confirmación de Despacho */}
      <Modal visible={!!pedidoPorDespachar} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalCard}>
            <View style={styles.confirmIconCircle}>
              <Ionicons name="cube" size={30} color="#059669" />
            </View>
            <Text style={styles.confirmTitle}>Confirmar Despacho</Text>
            <Text style={styles.confirmDesc}>
              ¿Confirmas que los repuestos de la orden{' '}
              <Text style={{ fontWeight: '800', color: '#0F172A' }}>
                {pedidoPorDespachar?.id}
              </Text>{' '}
              para{' '}
              <Text style={{ fontWeight: '800', color: '#0F172A' }}>
                {pedidoPorDespachar?.clienteNombre}
              </Text>{' '}
              fueron entregados en mostrador?
            </Text>

            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setPedidoPorDespachar(null)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={confirmarDespacho}>
                <Text style={styles.confirmBtnText}>Sí, Despachar</Text>
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
  reloadBtn: {
    backgroundColor: '#1E293B',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statsBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValOrange: {
    fontSize: 18,
    fontWeight: '900',
    color: '#D97706',
  },
  statValGreen: {
    fontSize: 18,
    fontWeight: '900',
    color: '#16A34A',
  },
  statValBlue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0066FF',
  },
  statLbl: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },
  filterTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  filterTabActiveOrange: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  filterTabActiveGreen: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  filterTabActiveBlue: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterTabText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 5,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
    marginBottom: 8,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  orderDate: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusBadgePendiente: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeEntregado: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  statusTextPendiente: {
    color: '#D97706',
  },
  statusTextEntregado: {
    color: '#16A34A',
  },
  clientDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  clientNameText: {
    fontSize: 13,
    color: '#334155',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  itemsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  itemsBoxTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },
  qtyBadge: {
    backgroundColor: '#0F172A',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 26,
    alignItems: 'center',
  },
  qtyBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  itemNombre: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  itemOEM: {
    fontSize: 10.5,
    color: '#64748B',
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  actionsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
  },
  totalLbl: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
  },
  totalVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0066FF',
  },
  btnDespachar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnDespacharText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  entregadoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  entregadoTagText: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12.5,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: 22,
  },
  confirmModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
  },
  confirmIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
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
    gap: 10,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  confirmBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
