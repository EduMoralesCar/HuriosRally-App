import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { StorageService } from '../services/StorageService';
import { Usuario } from '../types';

interface Props {
  navigation: any;
}

export const FavoritesScreen: React.FC<Props> = ({ navigation }) => {
  const {
    items,
    totalCount,
    subtotal,
    igv,
    total,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [listaClientesRegistrados, setListaClientesRegistrados] = useState<Usuario[]>([]);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [showClearModal, setShowClearModal] = React.useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [metodoPago, setMetodoPago] = useState<'Yape / Plin' | 'Tarjeta Débito/Crédito' | 'Contraentrega SMP'>('Yape / Plin');
  const [tipoComprobante, setTipoComprobante] = useState<'Boleta Electrónica' | 'Factura Comercial'>('Boleta Electrónica');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [numeroDoc, setNumeroDoc] = useState('');
  const [numOperacion, setNumOperacion] = useState('');
  const [numTarjeta, setNumTarjeta] = useState('');
  const [cotizacionGenerada, setCotizacionGenerada] = useState<{
    id: string;
    total: number;
    metodo: string;
    comprobante: string;
    cliente?: string;
  } | null>(null);

  useEffect(() => {
    cargarSesion();
    cargarClientes();
  }, []);

  const cargarSesion = async () => {
    const sesion = await StorageService.getSesion();
    if (sesion) {
      setCurrentUser(sesion);
    }
  };

  const cargarClientes = async () => {
    const todos = await StorageService.getUsuarios();
    const soloClientes = todos.filter((u) => u.rol === 'Cliente');
    setListaClientesRegistrados(soloClientes);
  };

  const seleccionarClienteRegistrado = (cli: Usuario) => {
    setClienteNombre(cli.nombreCompleto);
    setBusquedaCliente('');
    if (cli.telefono) {
      // Extraer solo dígitos sin el +51 si existe
      const soloNum = cli.telefono.replace(/[^0-9]/g, '').slice(-9);
      setClienteTelefono(soloNum);
    }
  };

  // Filtrado reactivo en tiempo real para búsqueda ERP de clientes
  const clientesFiltrados = listaClientesRegistrados.filter((cli) => {
    if (!busquedaCliente.trim()) return true;
    const q = busquedaCliente.toLowerCase().trim();
    return (
      cli.nombreCompleto.toLowerCase().includes(q) ||
      cli.username.toLowerCase().includes(q) ||
      cli.email.toLowerCase().includes(q)
    );
  });

  const handleVaciarPreorden = () => {
    if (items.length === 0) return;
    setShowClearModal(true);
  };

  const confirmarVaciar = async () => {
    await clearCart();
    setShowClearModal(false);
  };

  const abrirCheckout = () => {
    if (items.length === 0) return;
    setShowCheckoutModal(true);
  };

  const handleConfirmarPedidoYpago = async () => {
    const codPed = `PED-${Math.floor(1000 + Math.random() * 9000)}`;
    const nombreFinal = clienteNombre.trim() || (currentUser?.rol === 'Asesor' ? 'Cliente de Mostrador' : (currentUser?.nombreCompleto || 'Cliente'));

    await StorageService.savePedidoEnHistorial({
      id: codPed,
      items: [...items],
      fechaCreacion: new Date().toLocaleDateString('es-PE'),
      subtotal,
      igv,
      totalCotizado: total,
      estado: metodoPago === 'Contraentrega SMP' ? 'Confirmado' : 'Pagado',
      clienteNombre: nombreFinal,
      metodoPago,
      comprobanteTipo: tipoComprobante,
      documentoNumero: numeroDoc.trim() || undefined,
    });

    setCotizacionGenerada({
      id: codPed,
      total,
      metodo: metodoPago,
      comprobante: tipoComprobante,
      cliente: nombreFinal,
    });

    setShowCheckoutModal(false);
    await clearCart();
    setShowSuccessModal(true);
  };

  const esAsesor = currentUser?.rol === 'Asesor';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header Oficial (Figura A5) */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {esAsesor ? '💼 Mostrador de Ventas / Cotizador' : 'Mi Pre-orden'}
        </Text>
        <TouchableOpacity style={styles.headerBtn} onPress={handleVaciarPreorden}>
          <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Banner Resumen de Repuestos Agregados */}
      <View style={styles.bannerBlue}>
        <View style={styles.bannerIconBox}>
          <Ionicons name="cart" size={20} color="#0066FF" />
        </View>
        <View>
          <Text style={styles.bannerTitle}>Resumen de repuestos</Text>
          <Text style={styles.bannerCount}>{totalCount} productos agregados</Text>
        </View>
      </View>

      {/* Lista de Ítems */}
      <FlatList
        data={items}
        keyExtractor={(item) => `${item.repuesto.id}-${item.repuesto.codigoOEM}`}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <Image
              source={{ uri: item.repuesto.imagenUri }}
              style={styles.itemImage}
              resizeMode="contain"
            />
            <View style={styles.itemInfo}>
              <View style={styles.itemTopRow}>
                <Text style={styles.itemNombre} numberOfLines={1}>
                  {item.repuesto.nombre}
                </Text>
                <TouchableOpacity
                  onPress={() => removeFromCart(item.repuesto.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              <Text style={styles.itemOEM}>OEM: {item.repuesto.codigoOEM}</Text>
              <Text style={styles.itemUnit}>S/ {item.repuesto.precio.toFixed(2)}</Text>

              <View style={styles.itemBottomRow}>
                {/* Control + y - */}
                <View style={styles.qtyBox}>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.repuesto.id, -1)}
                    style={styles.qtyBtn}
                  >
                    <Text style={styles.qtyBtnTxt}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyVal}>{item.cantidad}</Text>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.repuesto.id, 1)}
                    style={styles.qtyBtn}
                  >
                    <Text style={styles.qtyBtnTxt}>+</Text>
                  </TouchableOpacity>
                </View>

                {/* Subtotal del ítem */}
                <Text style={styles.itemSubtotal}>
                  S/ {(item.repuesto.precio * item.cantidad).toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={54} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Tu pre-orden está vacía</Text>
            <Text style={styles.emptySub}>
              Agrega repuestos desde el catálogo para iniciar una cotización rápida.
            </Text>
            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={() => navigation.navigate('InicioTab')}
            >
              <Text style={styles.exploreBtnText}>Explorar Catálogo</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
      />

      {/* Bloque Financiero y Botón Enviar Cotización (Figura A5) */}
      {items.length > 0 && (
        <View style={styles.financeFooter}>
          <View style={styles.financeRow}>
            <Text style={styles.financeLabel}>Subtotal</Text>
            <Text style={styles.financeVal}>S/ {subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.financeRow}>
            <Text style={styles.financeLabel}>IGV (18%)</Text>
            <Text style={styles.financeVal}>S/ {igv.toFixed(2)}</Text>
          </View>
          <View
            style={[
              styles.financeRow,
              {
                marginTop: 6,
                paddingTop: 6,
                borderTopWidth: 1,
                borderTopColor: '#F1F5F9',
              },
            ]}
          >
            <Text style={styles.totalLabel}>Total estimado</Text>
            <Text style={styles.totalVal}>S/ {total.toFixed(2)}</Text>
          </View>

          <TouchableOpacity
            style={styles.btnCotizacion}
            onPress={abrirCheckout}
            activeOpacity={0.85}
          >
            <Ionicons
              name="card-outline"
              size={19}
              color="#FFFFFF"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.btnCotizacionText}>Continuar al Pago • S/ {total.toFixed(2)}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal Confirmación de Vaciar Carrito */}
      <Modal visible={showClearModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmBox}>
            <View style={[styles.confirmIconCircle, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="trash" size={28} color="#EF4444" />
            </View>
            <Text style={styles.confirmTitle}>¿Vaciar Pre-orden?</Text>
            <Text style={styles.confirmDesc}>
              Se eliminarán todos los repuestos agregados a tu lista actual. Esta acción no se puede deshacer.
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

      {/* ================= MODAL DE CHECKOUT Y PASARELA DE PAGO ================= */}
      <Modal visible={showCheckoutModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.checkoutBox}>
            <View style={styles.checkoutHeader}>
              <View>
                <Text style={styles.checkoutTitle}>Finalizar Pedido</Text>
                <Text style={styles.checkoutSub}>Hurios Rally • Caja y Despacho</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCheckoutModal(false)}>
                <Ionicons name="close-circle" size={26} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Resumen Financiero Rápido */}
              <View style={styles.checkoutTotalBanner}>
                <Text style={styles.checkoutTotalLabel}>Monto Total a Liquidar:</Text>
                <Text style={styles.checkoutTotalAmount}>S/ {total.toFixed(2)}</Text>
                <Text style={styles.checkoutIgvNote}>Incluye IGV 18% (S/ {igv.toFixed(2)})</Text>
              </View>

              {/* Datos del Cliente en Mostrador (Específico para Rol Asesor) */}
              {esAsesor && (
                <View style={styles.asesorClientBox}>
                  <View style={styles.asesorClientHeader}>
                    <Ionicons name="person-circle" size={20} color="#0066FF" />
                    <Text style={styles.asesorClientTitle}>Datos del Cliente en Mostrador</Text>
                  </View>
                  <Text style={styles.asesorClientSub}>
                    Como asesor, registra la identidad del cliente que realiza la compra presencial:
                  </Text>
                  {/* Buscador con Lista Desplegable idéntica a la imagen */}
                  <View style={styles.erpSearchSection}>
                    <Text style={styles.erpSearchLabel}>BUSCAR CLIENTE REGISTRADO</Text>
                    
                    {/* Barra de Búsqueda con Lupa y botón Limpiar */}
                    <View style={styles.dropdownInputContainer}>
                      <Ionicons name="search" size={20} color="#334155" style={{ marginLeft: 10 }} />
                      <TextInput
                        style={styles.dropdownTextInput}
                        placeholder="Buscar cliente por nombre o usuario..."
                        placeholderTextColor="#94A3B8"
                        value={busquedaCliente}
                        onChangeText={setBusquedaCliente}
                      />
                      {busquedaCliente.length > 0 && (
                        <TouchableOpacity onPress={() => setBusquedaCliente('')} style={{ padding: 8 }}>
                          <Ionicons name="close" size={18} color="#64748B" />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Menú Desplegable directamente bajo la barra de búsqueda (Como la imagen) */}
                    {busquedaCliente.trim().length > 0 && (
                      <View style={styles.dropdownMenuBox}>
                        {clientesFiltrados.length > 0 ? (
                          <ScrollView
                            nestedScrollEnabled
                            style={{ maxHeight: 180 }}
                            showsVerticalScrollIndicator={true}
                          >
                            {clientesFiltrados.map((cli, idx) => {
                              // Extraer iniciales para el badge tipo 'PJ', 'SUNAT', 'RENIEC'
                              const partes = cli.nombreCompleto.split(' ');
                              const iniciales = partes.length >= 2
                                ? `${partes[0][0]}${partes[1][0]}`.toUpperCase()
                                : cli.nombreCompleto.slice(0, 3).toUpperCase();

                              return (
                                <TouchableOpacity
                                  key={cli.id}
                                  style={[
                                    styles.dropdownRowItem,
                                    idx === clientesFiltrados.length - 1 && { borderBottomWidth: 0 },
                                  ]}
                                  onPress={() => seleccionarClienteRegistrado(cli)}
                                  activeOpacity={0.7}
                                >
                                  {/* Badge Gris estilo entidad de la imagen */}
                                  <View style={styles.dropdownBadge}>
                                    <Text style={styles.dropdownBadgeText}>{iniciales}</Text>
                                  </View>

                                  {/* Nombre en mayúsculas / título */}
                                  <View style={{ flex: 1 }}>
                                    <Text style={styles.dropdownRowTitle} numberOfLines={1}>
                                      {cli.nombreCompleto.toUpperCase()}
                                    </Text>
                                    <Text style={styles.dropdownRowSub}>
                                      Usuario: @{cli.username} • Tel: {cli.telefono || 'Sin tel'}
                                    </Text>
                                  </View>

                                  <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                        ) : (
                          <View style={styles.dropdownEmptyRow}>
                            <Text style={styles.dropdownEmptyText}>
                              No se encontró "{busquedaCliente}". Ingrésalo manualmente abajo:
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>

                  <Text style={styles.asesorInputLabel}>Nombre Completo / Razón Social *</Text>
                  <TextInput
                    style={styles.asesorInput}
                    placeholder="Ej. Juan Pérez Ramos / Transportes EIRL"
                    placeholderTextColor="#94A3B8"
                    value={clienteNombre}
                    onChangeText={setClienteNombre}
                  />

                  <Text style={styles.asesorInputLabel}>Teléfono de Contacto del Cliente</Text>
                  <TextInput
                    style={styles.asesorInput}
                    placeholder="Ej. 987 654 321"
                    placeholderTextColor="#94A3B8"
                    value={clienteTelefono}
                    onChangeText={(t) => setClienteTelefono(t.replace(/[^0-9]/g, '').slice(0, 9))}
                    keyboardType="numeric"
                    maxLength={9}
                  />
                </View>
              )}

              {/* Selector de Método de Pago */}
              <Text style={styles.checkoutSectionLabel}>1. SELECCIONA EL MÉTODO DE PAGO</Text>
              <View style={styles.paymentMethodsGrid}>
                {/* Opción 1: Yape / Plin */}
                <TouchableOpacity
                  style={[
                    styles.payMethodCard,
                    metodoPago === 'Yape / Plin' && styles.payMethodCardActive,
                  ]}
                  onPress={() => setMetodoPago('Yape / Plin')}
                >
                  <View style={styles.payMethodIconRow}>
                    <Ionicons name="phone-portrait-outline" size={20} color={metodoPago === 'Yape / Plin' ? '#7C3AED' : '#64748B'} />
                    <Text style={[styles.payMethodTitle, metodoPago === 'Yape / Plin' && { color: '#7C3AED' }]}>
                      Yape / Plin
                    </Text>
                  </View>
                  <Text style={styles.payMethodSub}>Billeteras Móviles 24/7</Text>
                </TouchableOpacity>

                {/* Opción 2: Tarjeta Débito/Crédito */}
                <TouchableOpacity
                  style={[
                    styles.payMethodCard,
                    metodoPago === 'Tarjeta Débito/Crédito' && styles.payMethodCardActive,
                  ]}
                  onPress={() => setMetodoPago('Tarjeta Débito/Crédito')}
                >
                  <View style={styles.payMethodIconRow}>
                    <Ionicons name="card-outline" size={20} color={metodoPago === 'Tarjeta Débito/Crédito' ? '#0066FF' : '#64748B'} />
                    <Text style={[styles.payMethodTitle, metodoPago === 'Tarjeta Débito/Crédito' && { color: '#0066FF' }]}>
                      Tarjeta
                    </Text>
                  </View>
                  <Text style={styles.payMethodSub}>Visa / Mastercard</Text>
                </TouchableOpacity>

                {/* Opción 3: Contraentrega Mostrador */}
                <TouchableOpacity
                  style={[
                    styles.payMethodCard,
                    metodoPago === 'Contraentrega SMP' && styles.payMethodCardActive,
                  ]}
                  onPress={() => setMetodoPago('Contraentrega SMP')}
                >
                  <View style={styles.payMethodIconRow}>
                    <Ionicons name="storefront-outline" size={20} color={metodoPago === 'Contraentrega SMP' ? '#059669' : '#64748B'} />
                    <Text style={[styles.payMethodTitle, metodoPago === 'Contraentrega SMP' && { color: '#059669' }]}>
                      Mostrador
                    </Text>
                  </View>
                  <Text style={styles.payMethodSub}>Pago al recoger en SMP</Text>
                </TouchableOpacity>
              </View>

              {/* Detalle interactivo según método seleccionado */}
              {metodoPago === 'Yape / Plin' && (
                <View style={styles.paymentInfoBox}>
                  <Text style={styles.qrTitle}>📲 Transfiere al número corporativo:</Text>
                  <View style={styles.qrAccountRow}>
                    <Text style={styles.qrNumber}>987 654 321</Text>
                    <Text style={styles.qrHolder}>Hurios Rally E.I.R.L.</Text>
                  </View>
                  <Text style={styles.qrInstruction}>Ingresa el número de operación de tu voucher:</Text>
                  <TextInput
                    style={styles.checkoutInput}
                    placeholder="Ej. Operación # 14829304"
                    placeholderTextColor="#94A3B8"
                    value={numOperacion}
                    onChangeText={setNumOperacion}
                  />
                </View>
              )}

              {metodoPago === 'Tarjeta Débito/Crédito' && (
                <View style={styles.paymentInfoBox}>
                  <Text style={styles.qrInstruction}>Número de tarjeta (Débito o Crédito):</Text>
                  <TextInput
                    style={styles.checkoutInput}
                    placeholder="•••• •••• •••• 4242"
                    placeholderTextColor="#94A3B8"
                    value={numTarjeta}
                    onChangeText={(t) => setNumTarjeta(t.replace(/[^0-9]/g, '').slice(0, 16))}
                    keyboardType="numeric"
                    maxLength={16}
                  />
                  <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '700', marginTop: 4 }}>
                    🔒 Transacción encriptada y protegida con SSL
                  </Text>
                </View>
              )}

              {metodoPago === 'Contraentrega SMP' && (
                <View style={styles.paymentInfoBox}>
                  <Text style={styles.qrTitle}>📍 Pago presencial en caja:</Text>
                  <Text style={styles.qrInstruction}>
                    Se reservará tu pedido en almacén. Podrás pagar en efectivo o POS al momento del retiro en Av. Perú 2450, San Martín de Porres.
                  </Text>
                </View>
              )}

              {/* Selector de Comprobante */}
              <Text style={styles.checkoutSectionLabel}>2. TIPO DE COMPROBANTE DE PAGO</Text>
              <View style={styles.invoiceTypeRow}>
                <TouchableOpacity
                  style={[
                    styles.invoiceChip,
                    tipoComprobante === 'Boleta Electrónica' && styles.invoiceChipActive,
                  ]}
                  onPress={() => setTipoComprobante('Boleta Electrónica')}
                >
                  <Text
                    style={[
                      styles.invoiceChipText,
                      tipoComprobante === 'Boleta Electrónica' && styles.invoiceChipTextActive,
                    ]}
                  >
                    Boleta Electrónica
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.invoiceChip,
                    tipoComprobante === 'Factura Comercial' && styles.invoiceChipActive,
                  ]}
                  onPress={() => setTipoComprobante('Factura Comercial')}
                >
                  <Text
                    style={[
                      styles.invoiceChipText,
                      tipoComprobante === 'Factura Comercial' && styles.invoiceChipTextActive,
                    ]}
                  >
                    Factura Comercial (RUC)
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.checkoutInput}
                placeholder={
                  tipoComprobante === 'Factura Comercial'
                    ? 'Ingresa RUC (11 dígitos)'
                    : 'DNI del comprador (Opcional)'
                }
                placeholderTextColor="#94A3B8"
                value={numeroDoc}
                onChangeText={(t) => setNumeroDoc(t.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                maxLength={tipoComprobante === 'Factura Comercial' ? 11 : 8}
              />

              <TouchableOpacity
                style={styles.btnPagarFinal}
                onPress={handleConfirmarPedidoYpago}
                activeOpacity={0.88}
              >
                <Ionicons name="checkmark-circle-outline" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.btnPagarFinalText}>Confirmar y Procesar Pago</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Éxito Pedido y Pago Confirmado */}
      <Modal visible={showSuccessModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmBox}>
            <View style={[styles.confirmIconCircle, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="checkmark-circle" size={40} color="#10B981" />
            </View>
            <Text style={styles.confirmTitle}>¡Pedido Registrado con Éxito!</Text>
            <Text style={styles.confirmDesc}>
              {cotizacionGenerada?.metodo === 'Contraentrega SMP'
                ? 'Tu pedido quedó confirmado para pagar y retirar en nuestro mostrador.'
                : 'Tu pago fue procesado correctamente y el despacho ha sido programado.'}
            </Text>

            {cotizacionGenerada && (
              <View style={styles.cotizacionCardResumen}>
                <View style={styles.cotRow}>
                  <Text style={styles.cotLabel}>N° de Pedido:</Text>
                  <Text style={styles.cotVal}>{cotizacionGenerada.id}</Text>
                </View>
                <View style={styles.cotRow}>
                  <Text style={styles.cotLabel}>Monto Total:</Text>
                  <Text style={[styles.cotVal, { color: '#0066FF' }]}>
                    S/ {cotizacionGenerada.total.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.cotRow}>
                  <Text style={styles.cotLabel}>Método de Pago:</Text>
                  <Text style={[styles.cotVal, { color: '#059669' }]}>
                    {cotizacionGenerada.metodo}
                  </Text>
                </View>
                <View style={styles.cotRow}>
                  <Text style={styles.cotLabel}>Comprobante:</Text>
                  <Text style={styles.cotVal}>{cotizacionGenerada.comprobante}</Text>
                </View>
                <View style={styles.cotRow}>
                  <Text style={styles.cotLabel}>Sede de Retiro:</Text>
                  <Text style={styles.cotVal}>Lima Norte - SMP (Central)</Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.btnAceptarCotizacion}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.navigate('InicioTab');
              }}
            >
              <Text style={styles.btnAceptarCotizacionText}>Volver al Catálogo</Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerBtn: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  bannerBlue: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    gap: 12,
  },
  bannerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  bannerCount: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 5,
  },
  itemImage: {
    width: 75,
    height: 75,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemNombre: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  itemOEM: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  itemUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  itemBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qtyBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnTxt: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0066FF',
  },
  qtyVal: {
    paddingHorizontal: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemSubtotal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  exploreBtn: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 18,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13.5,
  },
  financeFooter: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 8,
  },
  financeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  financeLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  financeVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0066FF',
  },
  btnCotizacion: {
    flexDirection: 'row',
    backgroundColor: '#0066FF',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  btnCotizacionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
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
    width: 60,
    height: 60,
    borderRadius: 30,
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
    marginBottom: 16,
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
  cotizacionCardResumen: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    gap: 8,
  },
  cotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cotLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  cotVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  btnAceptarCotizacion: {
    width: '100%',
    height: 48,
    backgroundColor: '#0066FF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnAceptarCotizacionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  // Estilos de la pasarela y checkout
  checkoutBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    width: '100%',
    maxHeight: '90%',
  },
  checkoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  checkoutTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  checkoutSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  checkoutTotalBanner: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  checkoutTotalLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  checkoutTotalAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: '#10B981',
    marginVertical: 4,
  },
  checkoutIgvNote: {
    fontSize: 11,
    color: '#94A3B8',
  },
  checkoutSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 4,
  },
  paymentMethodsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  payMethodCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  payMethodCardActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0066FF',
  },
  payMethodIconRow: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  payMethodTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
  },
  payMethodSub: {
    fontSize: 9.5,
    color: '#64748B',
    textAlign: 'center',
  },
  paymentInfoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  qrTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  qrAccountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 8,
  },
  qrNumber: {
    fontSize: 15,
    fontWeight: '900',
    color: '#7C3AED',
  },
  qrHolder: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  qrInstruction: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 6,
  },
  invoiceTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  invoiceChip: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  invoiceChipActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  invoiceChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  invoiceChipTextActive: {
    color: '#FFFFFF',
  },
  checkoutInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    height: 46,
    paddingHorizontal: 12,
    fontSize: 13.5,
    color: '#0F172A',
    marginBottom: 14,
  },
  btnPagarFinal: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  btnPagarFinalText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  asesorClientBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 16,
  },
  asesorClientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  asesorClientTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  asesorClientSub: {
    fontSize: 11.5,
    color: '#3B82F6',
    marginBottom: 10,
    lineHeight: 16,
  },
  asesorInputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 4,
  },
  asesorInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#93C5FD',
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 10,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 8,
  },
  clientQuickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#93C5FD',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    gap: 4,
  },
  clientQuickChipActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  clientQuickChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
  },
  clientQuickChipTextActive: {
    color: '#FFFFFF',
  },
  clientQuickChipSub: {
    fontSize: 9.5,
    color: '#60A5FA',
    fontWeight: '600',
  },
  clientQuickChipSubActive: {
    color: '#E0F2FE',
  },
  erpSearchSection: {
    marginBottom: 12,
  },
  erpSearchLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#1E40AF',
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  dropdownInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#0066FF',
    borderRadius: 10,
    height: 44,
  },
  dropdownTextInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  dropdownMenuBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    marginTop: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  dropdownRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  dropdownBadge: {
    backgroundColor: '#64748B',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dropdownRowTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1E293B',
  },
  dropdownRowSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  dropdownEmptyRow: {
    padding: 12,
    alignItems: 'center',
  },
  dropdownEmptyText: {
    fontSize: 11.5,
    color: '#64748B',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
