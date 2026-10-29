import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Linking,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SearchBar } from '../components/SearchBar';
import { CategoryPills } from '../components/CategoryPills';
import { CardRepuesto } from '../components/CardRepuesto';
import { REPUESTOS_MOCK } from '../data/repuestos.mock';
import { CategoriaRepuesto, Repuesto, PedidoLocal, Usuario } from '../types';
import { StorageService } from '../services/StorageService';
import { useCart } from '../context/CartContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { normalizarTexto } from '../utils/catalog';
import { filtrarPedidosPorUsuario } from '../utils/orders';

interface Props {
  navigation: any;
  onLogout?: () => void;
}

type OrdenCatalogo = 'relevancia' | 'precio_asc' | 'precio_desc' | 'rating';

const OPCIONES_ORDEN: { id: OrdenCatalogo; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'relevancia', label: 'Destacados', icon: 'sparkles-outline' },
  { id: 'precio_asc', label: 'Menor precio', icon: 'arrow-down-outline' },
  { id: 'precio_desc', label: 'Mayor precio', icon: 'arrow-up-outline' },
  { id: 'rating', label: 'Mejor valorados', icon: 'star-outline' },
];

export const CatalogScreen: React.FC<Props> = ({ navigation, onLogout }) => {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 180);
  const [category, setCategory] = useState<CategoriaRepuesto>('Todos');
  const [orden, setOrden] = useState<OrdenCatalogo>('relevancia');
  const [favoritosIds, setFavoritosIds] = useState<string[]>([]);
  const [stockOverrides, setStockOverrides] = useState<Record<string, number>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [showMenuModal, setShowMenuModal] = useState<boolean>(false);
  const [showContactModal, setShowContactModal] = useState<boolean>(false);
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [showHistorialModal, setShowHistorialModal] = useState<boolean>(false);
  const [historialPedidos, setHistorialPedidos] = useState<PedidoLocal[]>([]);

  const { totalCount, addToCart } = useCart();

  const sincronizarDatos = useCallback(async () => {
    const [sesion, favs, pedidos, overrides] = await Promise.all([
      StorageService.getSesion(),
      StorageService.getFavoritos(),
      StorageService.getHistorialPedidos(),
      StorageService.getStockOverrides(),
    ]);
    if (sesion) setCurrentUser(sesion);
    setFavoritosIds(favs.map((f) => f.id));
    setHistorialPedidos(pedidos);
    setStockOverrides(overrides);
  }, []);

  useEffect(() => {
    sincronizarDatos();
    const unsubscribe = navigation.addListener('focus', () => {
      sincronizarDatos();
    });
    return unsubscribe;
  }, [navigation, sincronizarDatos]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await sincronizarDatos();
    setRefreshing(false);
  }, [sincronizarDatos]);

  const mostrarToast = useCallback((texto: string) => {
    setToastMsg(texto);
    setTimeout(() => {
      setToastMsg(null);
    }, 2200);
  }, []);

  const handleToggleFavorite = useCallback(
    async (repuesto: Repuesto) => {
      let favs = await StorageService.getFavoritos();
      const yaExiste = favs.some((f) => f.id === repuesto.id);

      if (yaExiste) {
        favs = favs.filter((f) => f.id !== repuesto.id);
        mostrarToast('Eliminado de guardados');
      } else {
        favs.push(repuesto);
        mostrarToast(`${repuesto.nombre} guardado en favoritos`);
      }

      await StorageService.saveFavoritos(favs);
      setFavoritosIds(favs.map((f) => f.id));
    },
    [mostrarToast]
  );

  const handleQuickAdd = useCallback(
    async (repuesto: Repuesto) => {
      await addToCart(repuesto, 1);
      mostrarToast(`${repuesto.nombre} agregado a la pre-orden`);
    },
    [addToCart, mostrarToast]
  );

  const repuestosFiltrados = useMemo(() => {
    const query = normalizarTexto(debouncedSearch);
    const filtrados = REPUESTOS_MOCK.filter((rep) => {
      const matchesCategory = category === 'Todos' || rep.categoria === category;
      if (!matchesCategory) return false;
      if (!query) return true;
      return (
        normalizarTexto(rep.nombre).includes(query) ||
        normalizarTexto(rep.codigoOEM).includes(query) ||
        normalizarTexto(rep.compatibilidad).includes(query) ||
        normalizarTexto(rep.categoria).includes(query)
      );
    });

    if (orden === 'precio_asc') {
      return [...filtrados].sort((a, b) => a.precio - b.precio);
    }
    if (orden === 'precio_desc') {
      return [...filtrados].sort((a, b) => b.precio - a.precio);
    }
    if (orden === 'rating') {
      return [...filtrados].sort((a, b) => (b.rating || 4.8) - (a.rating || 4.8));
    }
    return filtrados;
  }, [category, debouncedSearch, orden]);

  const pedidosVisibles = useMemo(
    () => filtrarPedidosPorUsuario(historialPedidos, currentUser),
    [historialPedidos, currentUser]
  );

  const renderItem = useCallback(
    ({ item }: { item: Repuesto }) => {
      const stockActual = stockOverrides[item.id] !== undefined ? stockOverrides[item.id] : item.stock;
      return (
        <CardRepuesto
          repuesto={item}
          stock={stockActual}
          onPress={() => navigation.navigate('Detail', { repuesto: { ...item, stock: stockActual } })}
          isFavorite={favoritosIds.includes(item.id)}
          onToggleFavorite={() => handleToggleFavorite(item)}
          onAddToCart={() => handleQuickAdd(item)}
        />
      );
    },
    [favoritosIds, handleQuickAdd, handleToggleFavorite, navigation, stockOverrides]
  );

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

      {/* Header Principal */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowMenuModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="menu-outline" size={26} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.logoCenter}>
          <View style={styles.logoTopRow}>
            <View style={styles.miniFlag}>
              <View style={styles.flagRow}>
                <View style={[styles.tile, { backgroundColor: '#EF4444' }]} />
                <View style={[styles.tile, { backgroundColor: '#EF4444' }]} />
                <View style={[styles.tile, { backgroundColor: '#FFFFFF' }]} />
              </View>
              <View style={styles.flagRow}>
                <View style={[styles.tile, { backgroundColor: '#EF4444' }]} />
                <View style={[styles.tile, { backgroundColor: '#FFFFFF' }]} />
                <View style={[styles.tile, { backgroundColor: '#1E293B' }]} />
              </View>
            </View>

            <Text style={styles.brandTitle}>
              HURIOS <Text style={styles.brandRally}>RALLY</Text>
            </Text>
          </View>
          <Text style={styles.brandSub}>REPUESTOS AUTOMOTRICES</Text>
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate('PreOrdenTab')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={currentUser?.rol === 'Asesor' ? 'calculator-outline' : 'cart-outline'}
            size={26}
            color="#FFFFFF"
          />
          {totalCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {currentUser?.rol === 'Asesor' && (
        <View style={styles.asesorModeBanner}>
          <Ionicons name="briefcase" size={14} color="#0066FF" />
          <Text style={styles.asesorModeBannerText}>
            Modo Mostrador • Asesor: <Text style={{ fontWeight: '800' }}>{currentUser.nombreCompleto}</Text>
          </Text>
        </View>
      )}

      <SearchBar
        value={search}
        onChangeText={setSearch}
        onFilterPress={() => navigation.navigate('CategoriasTab')}
      />

      <CategoryPills selected={category} onSelect={setCategory} count={repuestosFiltrados.length} />

      <View style={styles.sortBarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortContainer}
        >
          {OPCIONES_ORDEN.map((opt) => {
            const active = orden === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.sortChip, active && styles.sortChipActive]}
                onPress={() => setOrden(opt.id)}
                activeOpacity={0.75}
              >
                <Ionicons name={opt.icon} size={12} color={active ? '#0066FF' : '#64748B'} />
                <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={repuestosFiltrados}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#EF4444']} />
        }
        contentContainerStyle={
          repuestosFiltrados.length === 0
            ? [styles.listContent, { flexGrow: 1, justifyContent: 'center' }]
            : styles.listContent
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="search" size={36} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>Sin resultados de búsqueda</Text>
            <Text style={styles.emptySub}>
              No se encontraron repuestos con "{search}". Intenta buscando por código OEM o selecciona otra categoría.
            </Text>
            <TouchableOpacity
              style={styles.emptyResetBtn}
              onPress={() => {
                setSearch('');
                setCategory('Todos');
                setOrden('relevancia');
              }}
            >
              <Ionicons name="refresh" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.emptyResetBtnText}>Restablecer Filtros</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Menú Lateral */}
      <Modal visible={showMenuModal} animationType="slide" transparent>
        <View style={styles.drawerOverlay}>
          <View style={styles.drawerContainer}>
            <View style={styles.drawerHeader}>
              <View>
                <Text style={styles.drawerBrand}>HURIOS RALLY E.I.R.L.</Text>
                <Text style={styles.drawerRuc}>RUC: 20608542191</Text>
                <Text style={styles.drawerSede}>Sede San Martín de Porres</Text>
              </View>
              <TouchableOpacity onPress={() => setShowMenuModal(false)} style={styles.drawerClose}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.drawerBody}>
              <Text style={styles.drawerSectionTitle}>
                {currentUser?.rol === 'Asesor'
                  ? 'OPERACIONES DE MOSTRADOR'
                  : currentUser?.rol === 'Almacenero'
                  ? 'SERVICIOS DE ALMACÉN'
                  : 'SERVICIOS AL CLIENTE'}
              </Text>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setShowMenuModal(false);
                  navigation.navigate('CategoriasTab');
                }}
              >
                <Ionicons name="grid-outline" size={20} color="#0066FF" />
                <Text style={styles.drawerItemText}>
                  {currentUser?.rol === 'Asesor' ? 'Familias de Repuestos' : 'Catálogo por Familias'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setShowMenuModal(false);
                  navigation.navigate('FavoritosTab');
                }}
              >
                <Ionicons
                  name={currentUser?.rol === 'Asesor' ? 'star-outline' : 'heart-outline'}
                  size={20}
                  color="#EF4444"
                />
                <Text style={styles.drawerItemText}>
                  {currentUser?.rol === 'Asesor' ? 'Repuestos de Alta Rotación' : 'Mis Repuestos Guardados'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={async () => {
                  setShowMenuModal(false);
                  await sincronizarDatos();
                  setShowHistorialModal(true);
                }}
              >
                <Ionicons name="receipt-outline" size={20} color="#10B981" />
                <Text style={styles.drawerItemText}>
                  {currentUser?.rol === 'Asesor'
                    ? 'Historial de Cotizaciones y Ventas'
                    : 'Mis Pedidos y Compras'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.drawerSectionTitle}>ATENCIÓN Y CONTACTO</Text>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setShowMenuModal(false);
                  setShowContactModal(true);
                }}
              >
                <Ionicons name="call-outline" size={20} color="#0066FF" />
                <Text style={styles.drawerItemText}>Atención en Mostrador</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setShowMenuModal(false);
                  setShowLocationModal(true);
                }}
              >
                <Ionicons name="location-outline" size={20} color="#EF4444" />
                <Text style={styles.drawerItemText}>Ubicación y Horarios</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setShowMenuModal(false);
                  navigation.navigate('PerfilTab');
                }}
              >
                <Ionicons name="person-circle-outline" size={20} color="#64748B" />
                <Text style={styles.drawerItemText}>
                  {currentUser?.rol === 'Asesor'
                    ? 'Mi Perfil de Asesor'
                    : currentUser?.rol === 'Almacenero'
                    ? 'Mi Perfil de Almacenero'
                    : 'Mi Perfil de Cliente'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.drawerSectionTitle}>SESIÓN DE USUARIO</Text>

              <TouchableOpacity
                style={[styles.drawerItem, { borderBottomWidth: 0 }]}
                onPress={() => {
                  setShowMenuModal(false);
                  setShowLogoutModal(true);
                }}
              >
                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                <Text style={[styles.drawerItemText, { color: '#EF4444', fontWeight: '700' }]}>
                  Cerrar Sesión
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.drawerFooter}>
              <Text style={styles.footerNote}>Sistema Móvil de Repuestos e Inventario</Text>
              <Text style={styles.footerVersion}>Hurios Rally E.I.R.L. • v2.0.0</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Confirmación de Cierre de Sesión */}
      <Modal visible={showLogoutModal} animationType="fade" transparent>
        <View style={styles.popupBg}>
          <View style={styles.logoutCard}>
            <View style={styles.logoutIconCircle}>
              <Ionicons name="log-out" size={32} color="#EF4444" />
            </View>

            <Text style={styles.logoutTitle}>¿Cerrar Sesión?</Text>
            <Text style={styles.logoutDesc}>
              Se cerrará la sesión actual en este dispositivo. Podrás volver a ingresar en cualquier momento con tus credenciales.
            </Text>

            <View style={styles.logoutButtonsRow}>
              <TouchableOpacity
                style={styles.logoutCancelBtn}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.logoutCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutConfirmBtn}
                onPress={async () => {
                  setShowLogoutModal(false);
                  if (onLogout) {
                    onLogout();
                  } else {
                    await StorageService.clearSesion();
                    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                  }
                }}
              >
                <Text style={styles.logoutConfirmText}>Sí, Salir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Atención y Contacto */}
      <Modal visible={showContactModal} animationType="fade" transparent>
        <View style={styles.popupBg}>
          <View style={styles.popupCard}>
            <View style={styles.popupHeader}>
              <View style={[styles.popupIconCircle, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="headset" size={24} color="#0066FF" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.popupTitle}>Atención y Soporte</Text>
                <Text style={styles.popupSubtitle}>Hurios Rally E.I.R.L.</Text>
              </View>
              <TouchableOpacity onPress={() => setShowContactModal(false)}>
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.popupContent}>
              <TouchableOpacity
                style={styles.contactItemBox}
                onPress={() => Linking.openURL('tel:015348920')}
              >
                <View style={[styles.contactItemIcon, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="call" size={18} color="#16A34A" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.contactItemLabel}>Central Telefónica</Text>
                  <Text style={styles.contactItemVal}>(01) 534-8920</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.contactItemBox}
                onPress={() => Linking.openURL('https://wa.me/51987654321')}
              >
                <View style={[styles.contactItemIcon, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="logo-whatsapp" size={18} color="#059669" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.contactItemLabel}>WhatsApp Ventas</Text>
                  <Text style={styles.contactItemVal}>+51 987 654 321</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.contactItemBox}
                onPress={() => Linking.openURL('mailto:ventas@huriosrally.com')}
              >
                <View style={[styles.contactItemIcon, { backgroundColor: '#F1F5F9' }]}>
                  <Ionicons name="mail" size={18} color="#0284C7" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.contactItemLabel}>Correo Electrónico</Text>
                  <Text style={styles.contactItemVal}>ventas@huriosrally.com</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.popupButtonClose}
              onPress={() => setShowContactModal(false)}
            >
              <Text style={styles.popupButtonCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Ubicación y Horarios */}
      <Modal visible={showLocationModal} animationType="fade" transparent>
        <View style={styles.popupBg}>
          <View style={styles.popupCard}>
            <View style={styles.popupHeader}>
              <View style={[styles.popupIconCircle, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="location" size={24} color="#EF4444" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.popupTitle}>Almacén y Despacho</Text>
                <Text style={styles.popupSubtitle}>Sede Lima Norte</Text>
              </View>
              <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.popupContent}>
              <View style={styles.infoRowBox}>
                <Ionicons name="business" size={20} color="#0066FF" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.infoRowTitle}>Dirección Principal:</Text>
                  <Text style={styles.infoRowDesc}>
                    Av. Perú 2450, San Martín de Porres, Lima Norte (Cerca al óvalo Habich).
                  </Text>
                </View>
              </View>

              <View style={styles.infoRowBox}>
                <Ionicons name="time" size={20} color="#10B981" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.infoRowTitle}>Horario de Despacho:</Text>
                  <Text style={styles.infoRowDesc}>
                    Lunes a Viernes: 8:00 AM - 6:30 PM{'\n'}Sábados: 8:00 AM - 2:00 PM
                  </Text>
                </View>
              </View>

              <View style={styles.infoRowBox}>
                <Ionicons name="shield-checkmark" size={20} color="#F59E0B" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.infoRowTitle}>Seguridad y Entrega:</Text>
                  <Text style={styles.infoRowDesc}>
                    Retiro en mostrador con código de cotización o envío coordinado a taller.
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.popupButtonClose, { backgroundColor: '#EF4444' }]}
              onPress={() => setShowLocationModal(false)}
            >
              <Text style={styles.popupButtonCloseText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Historial de Pedidos y Compras */}
      <Modal visible={showHistorialModal} animationType="slide" transparent>
        <View style={styles.popupBg}>
          <View style={[styles.popupCard, { maxHeight: '88%' }]}>
            <View style={styles.popupHeader}>
              <View style={[styles.popupIconCircle, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="receipt" size={24} color="#10B981" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.popupTitle}>
                  {currentUser?.rol === 'Asesor' ? 'Cotizaciones Emitidas' : 'Mis Pedidos y Compras'}
                </Text>
                <Text style={styles.popupSubtitle}>
                  {pedidosVisibles.length} registro(s) asociado(s) a tu cuenta
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowHistorialModal(false)}>
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {pedidosVisibles.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Ionicons name="receipt-outline" size={48} color="#CBD5E1" />
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#64748B', marginTop: 10 }}>
                  Aún no has registrado pedidos
                </Text>
                <Text style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 4 }}>
                  Agrega repuestos a tu Pre-orden y procede al pago para verlos aquí.
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ marginVertical: 10 }}>
                {pedidosVisibles.map((ped, index) => (
                  <View key={ped.id || index} style={styles.orderHistoryCard}>
                    <View style={styles.orderHistoryHeader}>
                      <View>
                        <Text style={styles.orderCode}>{ped.id}</Text>
                        <Text style={styles.orderDate}>
                          {ped.fechaCreacion}
                          {ped.clienteNombre ? ` • ${ped.clienteNombre}` : ''}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.orderBadge,
                          ped.estado === 'Entregado' || ped.estado === 'Pagado'
                            ? styles.orderBadgePaid
                            : styles.orderBadgePending,
                        ]}
                      >
                        <Text
                          style={[
                            styles.orderBadgeText,
                            ped.estado === 'Entregado' || ped.estado === 'Pagado'
                              ? styles.orderBadgePaidText
                              : styles.orderBadgePendingText,
                          ]}
                        >
                          {ped.estado || 'Confirmado'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.orderProductsList}>
                      {ped.items.map((it, idx) => (
                        <Text key={idx} style={styles.orderProductItem} numberOfLines={1}>
                          • {it.cantidad}x {it.repuesto.nombre}
                        </Text>
                      ))}
                    </View>

                    <View style={styles.orderHistoryFooter}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Ionicons name="card-outline" size={13} color="#64748B" />
                        <Text style={styles.orderPayMethod}>
                          {ped.metodoPago || 'Contraentrega SMP'}
                        </Text>
                      </View>
                      <Text style={styles.orderTotal}>
                        Total:{' '}
                        <Text style={{ color: '#0066FF', fontWeight: '900' }}>
                          S/ {ped.totalCotizado.toFixed(2)}
                        </Text>
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.popupButtonClose}
              onPress={() => setShowHistorialModal(false)}
            >
              <Text style={styles.popupButtonCloseText}>Cerrar</Text>
            </TouchableOpacity>
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
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    padding: 6,
    position: 'relative',
  },
  logoCenter: {
    alignItems: 'center',
  },
  logoTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniFlag: {
    marginRight: 6,
    transform: [{ skewX: '-15deg' }],
  },
  flagRow: {
    flexDirection: 'row',
  },
  tile: {
    width: 6,
    height: 4,
    margin: 0.4,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  brandRally: {
    color: '#EF4444',
    fontStyle: 'italic',
  },
  brandSub: {
    color: '#94A3B8',
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 1,
  },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 17,
    height: 17,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  sortBarWrapper: {
    paddingVertical: 4,
  },
  sortContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sortChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  sortChipText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  sortChipTextActive: {
    color: '#0066FF',
    fontWeight: '700',
  },
  listContent: {
    paddingTop: 2,
    paddingBottom: 20,
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
  },
  drawerContainer: {
    width: '82%',
    backgroundColor: '#FFFFFF',
    height: '100%',
  },
  drawerHeader: {
    backgroundColor: '#0F172A',
    padding: 20,
    paddingTop: 45,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  drawerBrand: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  drawerRuc: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  drawerSede: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 4,
  },
  drawerClose: {
    padding: 4,
  },
  drawerBody: {
    padding: 20,
  },
  drawerSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
    marginTop: 14,
    marginBottom: 8,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  drawerItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  drawerFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  footerNote: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  footerVersion: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  popupBg: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popupCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  popupIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  popupSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  popupContent: {
    marginBottom: 20,
    gap: 12,
  },
  contactItemBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactItemIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactItemLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  contactItemVal: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '700',
    marginTop: 2,
  },
  infoRowBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoRowTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  infoRowDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 18,
  },
  popupButtonClose: {
    backgroundColor: '#0066FF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  popupButtonCloseText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  logoutCard: {
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
  logoutIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoutTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  logoutDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  logoutButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  logoutCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  logoutConfirmBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 50,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  emptyResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyResetBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  orderHistoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  orderHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
    marginBottom: 8,
  },
  orderCode: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  orderDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  orderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  orderBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  orderBadgePaid: {
    backgroundColor: '#DCFCE7',
  },
  orderBadgePaidText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '800',
  },
  orderBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  orderBadgePendingText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '800',
  },
  orderProductsList: {
    gap: 4,
    marginBottom: 8,
  },
  orderProductItem: {
    fontSize: 12,
    color: '#475569',
  },
  orderHistoryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 8,
  },
  orderPayMethod: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  orderTotal: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
  },
  asesorModeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 5,
    paddingHorizontal: 16,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  asesorModeBannerText: {
    fontSize: 11.5,
    color: '#1E40AF',
    fontWeight: '600',
  },
});
