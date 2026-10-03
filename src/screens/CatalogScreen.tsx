import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Linking,
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

interface Props {
  navigation: any;
  onLogout?: () => void;
}

export const CatalogScreen: React.FC<Props> = ({ navigation, onLogout }) => {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoriaRepuesto>('Todos');
  const [favoritosIds, setFavoritosIds] = useState<string[]>([]);
  const [showMenuModal, setShowMenuModal] = useState<boolean>(false);
  const [showContactModal, setShowContactModal] = useState<boolean>(false);
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [showHistorialModal, setShowHistorialModal] = useState<boolean>(false);
  const [historialPedidos, setHistorialPedidos] = useState<PedidoLocal[]>([]);
  const { totalCount } = useCart();

  useEffect(() => {
    cargarSesion();
    cargarFavoritos();
    cargarHistorial();
    const unsubscribe = navigation.addListener('focus', () => {
      cargarSesion();
      cargarFavoritos();
      cargarHistorial();
    });
    return unsubscribe;
  }, [navigation]);

  const cargarSesion = async () => {
    const sesion = await StorageService.getSesion();
    if (sesion) {
      setCurrentUser(sesion);
    }
  };

  const cargarHistorial = async () => {
    const pedidos = await StorageService.getHistorialPedidos();
    setHistorialPedidos(pedidos);
  };

  const cargarFavoritos = async () => {
    const favs = await StorageService.getFavoritos();
    setFavoritosIds(favs.map((f) => f.id));
  };

  const handleToggleFavorite = async (repuesto: Repuesto) => {
    let favs = await StorageService.getFavoritos();
    const yaExiste = favs.some((f) => f.id === repuesto.id);

    if (yaExiste) {
      favs = favs.filter((f) => f.id !== repuesto.id);
    } else {
      favs.push(repuesto);
    }

    await StorageService.saveFavoritos(favs);
    setFavoritosIds(favs.map((f) => f.id));
  };

  const repuestosFiltrados = REPUESTOS_MOCK.filter((rep) => {
    const matchesCategory = category === 'Todos' || rep.categoria === category;
    const matchesSearch =
      rep.nombre.toLowerCase().includes(search.toLowerCase()) ||
      rep.codigoOEM.toLowerCase().includes(search.toLowerCase()) ||
      rep.compatibilidad.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header Oficial Hurios Rally (Figura A2) */}
      <View style={styles.header}>
        {/* Menú Hamburguesa Funcional */}
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowMenuModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="menu-outline" size={26} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Logo Central Hurios Rally con Bandera */}
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

        {/* Carrito / Cotizador con Contador Badge Rojo */}
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate('PreOrdenTab')}
          activeOpacity={0.7}
        >
          <Ionicons name={currentUser?.rol === 'Asesor' ? 'calculator-outline' : 'cart-outline'} size={26} color="#FFFFFF" />
          {totalCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Barra de Modo Asesor de Ventas */}
      {currentUser?.rol === 'Asesor' && (
        <View style={styles.asesorModeBanner}>
          <Ionicons name="briefcase" size={14} color="#0066FF" />
          <Text style={styles.asesorModeBannerText}>
            Modo Mostrador • Asesor: <Text style={{ fontWeight: '800' }}>{currentUser.nombreCompleto}</Text>
          </Text>
        </View>
      )}

      {/* Buscador de repuestos */}
      <SearchBar
        value={search}
        onChangeText={setSearch}
        onFilterPress={() => navigation.navigate('CategoriasTab')}
      />

      {/* Selector Horizontal de Categorías con Contador Integrado */}
      <CategoryPills
        selected={category}
        onSelect={setCategory}
        count={repuestosFiltrados.length}
      />

      {/* Lista Dinámica de Repuestos */}
      <FlatList
        data={repuestosFiltrados}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CardRepuesto
            repuesto={item}
            onPress={() => navigation.navigate('Detail', { repuesto: item })}
            isFavorite={favoritosIds.includes(item.id)}
            onToggleFavorite={() => handleToggleFavorite(item)}
          />
        )}
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
              }}
            >
              <Ionicons name="refresh" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.emptyResetBtnText}>Restablecer Filtros</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Modal / Menú Lateral Hamburguesa Completo y Funcional */}
      <Modal visible={showMenuModal} animationType="slide" transparent>
        <View style={styles.drawerOverlay}>
          <View style={styles.drawerContainer}>
            {/* Cabecera del Cajón */}
            <View style={styles.drawerHeader}>
              <View>
                <Text style={styles.drawerBrand}>HURIOS RALLY E.I.R.L.</Text>
                <Text style={styles.drawerRuc}>RUC: 20608542191</Text>
                <Text style={styles.drawerSede}>📍 Sede San Martín de Porres</Text>
              </View>
              <TouchableOpacity onPress={() => setShowMenuModal(false)} style={styles.drawerClose}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.drawerBody}>
              <Text style={styles.drawerSectionTitle}>
                {currentUser?.rol === 'Asesor' ? 'OPERACIONES DE MOSTRADOR' : 'SERVICIOS DE ALMACÉN'}
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
                <Ionicons name={currentUser?.rol === 'Asesor' ? 'star-outline' : 'heart-outline'} size={20} color="#EF4444" />
                <Text style={styles.drawerItemText}>
                  {currentUser?.rol === 'Asesor' ? 'Repuestos de Alta Rotación' : 'Mis Repuestos Guardados'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setShowMenuModal(false);
                  cargarHistorial();
                  setShowHistorialModal(true);
                }}
              >
                <Ionicons name="receipt-outline" size={20} color="#10B981" />
                <Text style={styles.drawerItemText}>
                  {currentUser?.rol === 'Asesor' ? 'Historial de Cotizaciones y Ventas' : 'Mis Pedidos y Compras'}
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
                <Text style={styles.drawerItemText}>Mi Perfil de Asesor</Text>
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
              <Text style={styles.footerNote}>Sistema Móvil para Gestión de Inventario</Text>
              <Text style={styles.footerVersion}>Versión 2.0.0 - UTP 2026</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Confirmación de Cierre de Sesión desde Drawer */}
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

      {/* Modal Profesional: Atención y Contacto Mostrador */}
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

      {/* Modal Profesional: Ubicación y Horarios de Almacén */}
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
                  <Text style={styles.infoRowDesc}>Av. Perú 2450, San Martín de Porres, Lima Norte (Cerca al óvalo Habich).</Text>
                </View>
              </View>

              <View style={styles.infoRowBox}>
                <Ionicons name="time" size={20} color="#10B981" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.infoRowTitle}>Horario de Despacho:</Text>
                  <Text style={styles.infoRowDesc}>Lunes a Viernes: 8:00 AM - 6:30 PM{'\n'}Sábados: 8:00 AM - 2:00 PM</Text>
                </View>
              </View>

              <View style={styles.infoRowBox}>
                <Ionicons name="shield-checkmark" size={20} color="#F59E0B" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.infoRowTitle}>Seguridad y Entrega:</Text>
                  <Text style={styles.infoRowDesc}>Retiro en mostrador con código de cotización o envío coordinado a taller.</Text>
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

      {/* Modal Profesional: Historial de Pedidos y Compras */}
      <Modal visible={showHistorialModal} animationType="slide" transparent>
        <View style={styles.popupBg}>
          <View style={[styles.popupCard, { maxHeight: '88%' }]}>
            <View style={styles.popupHeader}>
              <View style={[styles.popupIconCircle, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="receipt" size={24} color="#10B981" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.popupTitle}>Mis Pedidos y Compras</Text>
                <Text style={styles.popupSubtitle}>Registro de compras y cotizaciones</Text>
              </View>
              <TouchableOpacity onPress={() => setShowHistorialModal(false)}>
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {historialPedidos.length === 0 ? (
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
                {historialPedidos.map((ped, index) => (
                  <View key={ped.id || index} style={styles.orderHistoryCard}>
                    <View style={styles.orderHistoryHeader}>
                      <View>
                        <Text style={styles.orderCode}>{ped.id}</Text>
                        <Text style={styles.orderDate}>📅 {ped.fechaCreacion}</Text>
                      </View>
                      <View
                        style={[
                          styles.orderBadge,
                          ped.estado === 'Pagado'
                            ? styles.orderBadgePaid
                            : styles.orderBadgePending,
                        ]}
                      >
                        <Text
                          style={[
                            styles.orderBadgeText,
                            ped.estado === 'Pagado'
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
                      <Text style={styles.orderPayMethod}>
                        💳 {ped.metodoPago || 'Contraentrega SMP'}
                      </Text>
                      <Text style={styles.orderTotal}>
                        Total: <Text style={{ color: '#0066FF', fontWeight: '900' }}>S/ {ped.totalCotizado.toFixed(2)}</Text>
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
  countBar: {
    paddingHorizontal: 18,
    paddingTop: 2,
    paddingBottom: 2,
    marginTop: 0,
    marginBottom: 2,
  },
  countText: {
    fontSize: 12,
    color: '#64748B',
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
  // Estilos de los modales de contacto y ubicación
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
  // Estilos del modal de cerrar sesión en Drawer
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
  // Estado vacío de búsqueda
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
  // Estilos del historial de pedidos
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
