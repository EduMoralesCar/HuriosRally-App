import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StorageService } from '../services/StorageService';
import { CameraService } from '../services/CameraService';
import { CategoriaRepuesto, PedidoLocal, Repuesto } from '../types';
import { ProductImage } from '../components/ProductImage';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { normalizarTexto, UMBRAL_STOCK_CRITICO } from '../utils/catalog';

interface Props {
  navigation: any;
}

type SubVistaReporte = 'estadisticas' | 'ordenes' | 'crud_catalogo';
type FiltroEstadoOrden = 'Todos' | 'Pagado' | 'Confirmado' | 'Entregado';
type FiltroMetodoOrden = 'Todos' | 'Yape / Plin' | 'Tarjeta Débito/Crédito' | 'Contraentrega SMP';

const CATEGORIAS_EDITABLES: Exclude<CategoriaRepuesto, 'Todos'>[] = [
  'Frenos',
  'Suspensión',
  'Motor',
  'Filtros',
  'Accesorios',
];

const IMAGEN_DEFAULT_REPUESTO =
  'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=500&q=80';

export const ReportsScreen: React.FC<Props> = ({ navigation }) => {
  const [vistaActiva, setVistaActiva] = useState<SubVistaReporte>('estadisticas');
  const [pedidos, setPedidos] = useState<PedidoLocal[]>([]);
  const [catalogo, setCatalogo] = useState<Repuesto[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Búsquedas y filtros de Órdenes (3.5)
  const [busquedaOrden, setBusquedaOrden] = useState('');
  const debouncedOrden = useDebouncedValue(busquedaOrden, 160);
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstadoOrden>('Todos');
  const [filtroMetodo, setFiltroMetodo] = useState<FiltroMetodoOrden>('Todos');

  // Búsquedas y filtros de Catálogo CRUD (3.3 y 3.5)
  const [busquedaCatalogo, setBusquedaCatalogo] = useState('');
  const debouncedCatalogo = useDebouncedValue(busquedaCatalogo, 160);
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaRepuesto>('Todos');

  // Modal Crear / Editar Repuesto (3.3 Lógica de Negocio CRUD)
  const [showRepuestoModal, setShowRepuestoModal] = useState(false);
  const [repuestoEditId, setRepuestoEditId] = useState<string | null>(null);
  const [formOEM, setFormOEM] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formCategoria, setFormCategoria] = useState<Exclude<CategoriaRepuesto, 'Todos'>>('Frenos');
  const [formPrecio, setFormPrecio] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formCompat, setFormCompat] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formImagen, setFormImagen] = useState('');
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const mostrarToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  }, []);

  const cargarDatos = useCallback(async () => {
    const [listaPedidos, listaCatalogo] = await Promise.all([
      StorageService.getHistorialPedidos(),
      StorageService.getCatalogoRepuestos(),
    ]);
    setPedidos(listaPedidos);
    setCatalogo(listaCatalogo);
  }, []);

  useEffect(() => {
    cargarDatos();
    const unsub = navigation.addListener('focus', () => {
      cargarDatos();
    });
    return unsub;
  }, [navigation, cargarDatos]);

  // ---------------- ESTADÍSTICAS PROCESADAS (3.5) ----------------
  const estadisticas = useMemo(() => {
    const totalVentas = pedidos.reduce((acc, p) => acc + (p.totalCotizado || 0), 0);
    const totalIgv = pedidos.reduce((acc, p) => acc + (p.igv || 0), 0);
    const ticketPromedio = pedidos.length > 0 ? totalVentas / pedidos.length : 0;
    const unidadesVendidas = pedidos.reduce(
      (acc, p) => acc + p.items.reduce((sum, it) => sum + it.cantidad, 0),
      0
    );

    const valorInventario = catalogo.reduce((acc, r) => acc + r.precio * r.stock, 0);
    const totalPiezasStock = catalogo.reduce((acc, r) => acc + r.stock, 0);
    const stockCriticoCount = catalogo.filter((r) => r.stock <= UMBRAL_STOCK_CRITICO).length;

    const porCategoria = CATEGORIAS_EDITABLES.map((cat) => {
      const itemsCat = catalogo.filter((r) => r.categoria === cat);
      const stockUnidades = itemsCat.reduce((acc, r) => acc + r.stock, 0);
      const valorCat = itemsCat.reduce((acc, r) => acc + r.precio * r.stock, 0);
      const porcentaje = valorInventario > 0 ? Math.round((valorCat / valorInventario) * 100) : 0;
      return {
        categoria: cat,
        codigos: itemsCat.length,
        unidades: stockUnidades,
        valor: valorCat,
        porcentaje,
      };
    });

    const metodos = {
      yape: pedidos.filter((p) => p.metodoPago === 'Yape / Plin').length,
      tarjeta: pedidos.filter((p) => p.metodoPago === 'Tarjeta Débito/Crédito').length,
      mostrador: pedidos.filter((p) => p.metodoPago === 'Contraentrega SMP').length,
    };

    const comprobantes = {
      boletas: pedidos.filter((p) => p.comprobanteTipo !== 'Factura Comercial').length,
      facturas: pedidos.filter((p) => p.comprobanteTipo === 'Factura Comercial').length,
    };

    return {
      totalVentas,
      totalIgv,
      ticketPromedio,
      unidadesVendidas,
      valorInventario,
      totalPiezasStock,
      stockCriticoCount,
      porCategoria,
      metodos,
      comprobantes,
    };
  }, [pedidos, catalogo]);

  // ---------------- FILTRADO DE ÓRDENES (3.5) ----------------
  const pedidosFiltrados = useMemo(() => {
    const q = normalizarTexto(debouncedOrden);
    return pedidos.filter((p) => {
      if (filtroEstado !== 'Todos' && p.estado !== filtroEstado) return false;
      if (filtroMetodo !== 'Todos' && p.metodoPago !== filtroMetodo) return false;
      if (!q) return true;

      const coincideCabecera =
        normalizarTexto(p.id || '').includes(q) ||
        normalizarTexto(p.clienteNombre || '').includes(q) ||
        normalizarTexto(p.documentoNumero || '').includes(q) ||
        normalizarTexto(p.creadoPorNombre || '').includes(q);

      const coincideItems = p.items.some(
        (it) =>
          normalizarTexto(it.repuesto.nombre).includes(q) ||
          normalizarTexto(it.repuesto.codigoOEM).includes(q)
      );

      return coincideCabecera || coincideItems;
    });
  }, [pedidos, debouncedOrden, filtroEstado, filtroMetodo]);

  // ---------------- FILTRADO DE CATÁLOGO CRUD (3.3 / 3.5) ----------------
  const catalogoFiltrado = useMemo(() => {
    const q = normalizarTexto(debouncedCatalogo);
    return catalogo.filter((r) => {
      if (filtroCategoria !== 'Todos' && r.categoria !== filtroCategoria) return false;
      if (!q) return true;
      return (
        normalizarTexto(r.nombre).includes(q) ||
        normalizarTexto(r.codigoOEM).includes(q) ||
        normalizarTexto(r.compatibilidad).includes(q)
      );
    });
  }, [catalogo, debouncedCatalogo, filtroCategoria]);

  // ---------------- ACCIONES CRUD DE LÓGICA DE NEGOCIO (3.3) ----------------
  const abrirModalCrearRepuesto = () => {
    setRepuestoEditId(null);
    setFormOEM(`HR-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormNombre('');
    setFormCategoria('Frenos');
    setFormPrecio('');
    setFormStock('10');
    setFormCompat('Toyota Hilux / Nissan Frontier');
    setFormDesc('Repuesto automotriz certificado para alto desempeño.');
    setFormImagen('');
    setErrorForm(null);
    setShowRepuestoModal(true);
  };

  const abrirModalEditarRepuesto = (rep: Repuesto) => {
    setRepuestoEditId(rep.id);
    setFormOEM(rep.codigoOEM);
    setFormNombre(rep.nombre);
    setFormCategoria(rep.categoria);
    setFormPrecio(rep.precio.toString());
    setFormStock(rep.stock.toString());
    setFormCompat(rep.compatibilidad);
    setFormDesc(rep.descripcion);
    setFormImagen(rep.imagenUri);
    setErrorForm(null);
    setShowRepuestoModal(true);
  };

  const handleSeleccionarFotoRepuesto = async () => {
    const uri = await CameraService.pickImage();
    if (uri) setFormImagen(uri);
  };

  const handleGuardarRepuesto = async () => {
    if (!formNombre.trim() || !formOEM.trim()) {
      setErrorForm('El código OEM y el nombre del repuesto son obligatorios.');
      return;
    }
    const precioNum = parseFloat(formPrecio);
    if (isNaN(precioNum) || precioNum <= 0) {
      setErrorForm('Ingresa un precio unitario válido mayor a S/ 0.');
      return;
    }
    const stockNum = parseInt(formStock || '0', 10);

    const payload: Repuesto = {
      id: repuestoEditId || `rep_${Date.now()}`,
      codigoOEM: formOEM.trim().toUpperCase(),
      nombre: formNombre.trim(),
      categoria: formCategoria,
      precio: precioNum,
      stock: isNaN(stockNum) ? 0 : Math.max(0, stockNum),
      compatibilidad: formCompat.trim() || 'Uso Universal Automotriz',
      descripcion: formDesc.trim() || 'Repuesto certificado Hurios Rally.',
      imagenUri: formImagen.trim() || IMAGEN_DEFAULT_REPUESTO,
    };

    await StorageService.guardarRepuestoCatalogo(payload);
    setShowRepuestoModal(false);
    await cargarDatos();
    mostrarToast(repuestoEditId ? 'Repuesto actualizado en catálogo' : 'Nuevo repuesto registrado');
  };

  const handleEliminarRepuesto = async (rep: Repuesto) => {
    await StorageService.eliminarRepuestoCatalogo(rep.id);
    await cargarDatos();
    mostrarToast(`Repuesto ${rep.codigoOEM} eliminado del catálogo`);
  };

  const handleRestaurarCatalogo = async () => {
    await StorageService.restaurarCatalogoRepuestos();
    await cargarDatos();
    mostrarToast('Catálogo oficial restaurado al 100%');
  };

  const handleCambiarEstadoPedido = async (
    pedidoId?: string,
    nuevoEstado?: 'Confirmado' | 'Pagado' | 'Entregado'
  ) => {
    if (!pedidoId || !nuevoEstado) return;
    await StorageService.updatePedidoEstado(pedidoId, nuevoEstado);
    await cargarDatos();
    mostrarToast(`Orden ${pedidoId} actualizada a ${nuevoEstado}`);
  };

  const handleEliminarPedido = async (pedidoId?: string) => {
    if (!pedidoId) return;
    await StorageService.eliminarPedidoHistorial(pedidoId);
    await cargarDatos();
    mostrarToast(`Orden ${pedidoId} anulada y stock repuesto en Kardex`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {toastMsg && (
        <View style={styles.floatingToast}>
          <Ionicons name="checkmark-circle" size={18} color="#10B981" />
          <Text style={styles.floatingToastText}>{toastMsg}</Text>
        </View>
      )}

      {/* Encabezado */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Reportes y Gestión</Text>
          <Text style={styles.headerSub}>Estadísticas de ventas, órdenes y catálogo</Text>
        </View>
        <TouchableOpacity style={styles.reloadBtn} onPress={cargarDatos}>
          <Ionicons name="refresh" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Selector de Sub-módulo */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, vistaActiva === 'estadisticas' && styles.tabBtnActive]}
          onPress={() => setVistaActiva('estadisticas')}
        >
          <Ionicons
            name="bar-chart-outline"
            size={15}
            color={vistaActiva === 'estadisticas' ? '#FFFFFF' : '#475569'}
          />
          <Text style={[styles.tabBtnText, vistaActiva === 'estadisticas' && styles.tabBtnTextActive]}>
            Estadísticas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, vistaActiva === 'ordenes' && styles.tabBtnActive]}
          onPress={() => setVistaActiva('ordenes')}
        >
          <Ionicons
            name="receipt-outline"
            size={15}
            color={vistaActiva === 'ordenes' ? '#FFFFFF' : '#475569'}
          />
          <Text style={[styles.tabBtnText, vistaActiva === 'ordenes' && styles.tabBtnTextActive]}>
            Órdenes ({pedidos.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, vistaActiva === 'crud_catalogo' && styles.tabBtnActive]}
          onPress={() => setVistaActiva('crud_catalogo')}
        >
          <Ionicons
            name="layers-outline"
            size={15}
            color={vistaActiva === 'crud_catalogo' ? '#FFFFFF' : '#475569'}
          />
          <Text
            style={[styles.tabBtnText, vistaActiva === 'crud_catalogo' && styles.tabBtnTextActive]}
          >
            Catálogo ({catalogo.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* VISTA 1: ESTADÍSTICAS Y KPIS */}
      {vistaActiva === 'estadisticas' && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <View style={[styles.kpiIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="cash-outline" size={18} color="#0066FF" />
              </View>
              <Text style={styles.kpiLabel}>Ventas Procesadas</Text>
              <Text style={styles.kpiValue}>S/ {estadisticas.totalVentas.toFixed(2)}</Text>
              <Text style={styles.kpiSub}>IGV 18%: S/ {estadisticas.totalIgv.toFixed(2)}</Text>
            </View>

            <View style={styles.kpiCard}>
              <View style={[styles.kpiIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="trending-up-outline" size={18} color="#059669" />
              </View>
              <Text style={styles.kpiLabel}>Ticket Promedio</Text>
              <Text style={[styles.kpiValue, { color: '#059669' }]}>
                S/ {estadisticas.ticketPromedio.toFixed(2)}
              </Text>
              <Text style={styles.kpiSub}>{estadisticas.unidadesVendidas} piezas vendidas</Text>
            </View>

            <View style={styles.kpiCard}>
              <View style={[styles.kpiIconBox, { backgroundColor: '#F5F3FF' }]}>
                <Ionicons name="cube-outline" size={18} color="#7C3AED" />
              </View>
              <Text style={styles.kpiLabel}>Kardex Valorizado</Text>
              <Text style={[styles.kpiValue, { color: '#7C3AED' }]}>
                S/ {estadisticas.valorInventario.toFixed(0)}
              </Text>
              <Text style={styles.kpiSub}>{estadisticas.totalPiezasStock} unid. en anaqueles</Text>
            </View>

            <View style={styles.kpiCard}>
              <View style={[styles.kpiIconBox, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="alert-circle-outline" size={18} color="#DC2626" />
              </View>
              <Text style={styles.kpiLabel}>Stock Crítico</Text>
              <Text style={[styles.kpiValue, { color: '#DC2626' }]}>
                {estadisticas.stockCriticoCount} ítems
              </Text>
              <Text style={styles.kpiSub}>Umbral ≤ {UMBRAL_STOCK_CRITICO} unidades</Text>
            </View>
          </View>

          {/* Gráfico de Barras por Categoría */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Valorización de Inventario por Familia Técnica</Text>
            <Text style={styles.sectionSub}>
              Distribución porcentual y monetaria de los {catalogo.length} códigos OEM activos
            </Text>

            {estadisticas.porCategoria.map((item) => (
              <View key={item.categoria} style={styles.barRow}>
                <View style={styles.barHeader}>
                  <Text style={styles.barLabel}>
                    {item.categoria} ({item.codigos} OEM • {item.unidades} unid.)
                  </Text>
                  <Text style={styles.barAmount}>
                    S/ {item.valor.toFixed(0)} ({item.porcentaje}%)
                  </Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${Math.max(6, Math.min(100, item.porcentaje))}%` },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>

          {/* Distribución de Pagos y Comprobantes */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Distribución de Medios de Pago y Comprobantes</Text>
            <View style={styles.splitMetricsRow}>
              <View style={styles.splitBox}>
                <Text style={styles.splitNumber}>{estadisticas.metodos.yape}</Text>
                <Text style={styles.splitLabel}>Yape / Plin</Text>
              </View>
              <View style={styles.splitBox}>
                <Text style={styles.splitNumber}>{estadisticas.metodos.tarjeta}</Text>
                <Text style={styles.splitLabel}>Tarjeta SSL</Text>
              </View>
              <View style={styles.splitBox}>
                <Text style={styles.splitNumber}>{estadisticas.metodos.mostrador}</Text>
                <Text style={styles.splitLabel}>Mostrador SMP</Text>
              </View>
              <View style={styles.splitBox}>
                <Text style={[styles.splitNumber, { color: '#059669' }]}>
                  {estadisticas.comprobantes.boletas}/{estadisticas.comprobantes.facturas}
                </Text>
                <Text style={styles.splitLabel}>Boleta / Factura</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* VISTA 2: LISTADO, BÚSQUEDA Y FILTROS DE ÓRDENES */}
      {vistaActiva === 'ordenes' && (
        <View style={{ flex: 1 }}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por N° pedido, cliente, RUC/DNI o repuesto..."
              placeholderTextColor="#94A3B8"
              value={busquedaOrden}
              onChangeText={setBusquedaOrden}
            />
            {busquedaOrden.length > 0 && (
              <TouchableOpacity onPress={() => setBusquedaOrden('')}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.filtersWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {(['Todos', 'Pagado', 'Confirmado', 'Entregado'] as FiltroEstadoOrden[]).map((est) => (
                <TouchableOpacity
                  key={est}
                  style={[styles.filterChip, filtroEstado === est && styles.filterChipActive]}
                  onPress={() => setFiltroEstado(est)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filtroEstado === est && styles.filterChipTextActive,
                    ]}
                  >
                    Estado: {est}
                  </Text>
                </TouchableOpacity>
              ))}
              {(['Todos', 'Yape / Plin', 'Tarjeta Débito/Crédito', 'Contraentrega SMP'] as FiltroMetodoOrden[]).map(
                (met) => (
                  <TouchableOpacity
                    key={met}
                    style={[styles.filterChip, filtroMetodo === met && styles.filterChipActiveBlue]}
                    onPress={() => setFiltroMetodo(met)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        filtroMetodo === met && styles.filterChipTextActive,
                      ]}
                    >
                      {met === 'Todos' ? 'Todo Pago' : met}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </ScrollView>
          </View>

          <FlatList
            data={pedidosFiltrados}
            keyExtractor={(item, idx) => item.id || `ord-${idx}`}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            renderItem={({ item }) => (
              <View style={styles.orderCard}>
                <View style={styles.orderTop}>
                  <View>
                    <Text style={styles.orderCode}>{item.id}</Text>
                    <Text style={styles.orderMeta}>
                      {item.fechaCreacion} • {item.clienteNombre || 'Cliente'}
                    </Text>
                  </View>
                  <Text style={styles.orderTotal}>S/ {item.totalCotizado.toFixed(2)}</Text>
                </View>

                <Text style={styles.orderDetailText}>
                  {item.comprobanteTipo || 'Boleta'}{' '}
                  {item.documentoNumero ? `(${item.documentoNumero})` : ''} •{' '}
                  {item.metodoPago || 'Mostrador'} • {item.items.length} código(s) OEM
                </Text>

                <View style={styles.orderActionsRow}>
                  <View style={styles.orderStatusPills}>
                    {(['Confirmado', 'Pagado', 'Entregado'] as const).map((est) => {
                      const activo = item.estado === est;
                      return (
                        <TouchableOpacity
                          key={est}
                          style={[styles.stateMiniBtn, activo && styles.stateMiniBtnActive]}
                          onPress={() => handleCambiarEstadoPedido(item.id, est)}
                        >
                          <Text
                            style={[
                              styles.stateMiniBtnText,
                              activo && styles.stateMiniBtnTextActive,
                            ]}
                          >
                            {est}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    style={styles.deleteOrderBtn}
                    onPress={() => handleEliminarPedido(item.id)}
                  >
                    <Ionicons name="trash-outline" size={15} color="#DC2626" />
                    <Text style={styles.deleteOrderBtnText}>Anular</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Ionicons name="document-text-outline" size={44} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>Sin órdenes para los filtros aplicados</Text>
              </View>
            }
          />
        </View>
      )}

      {/* VISTA 3: CRUD DE LÓGICA DE NEGOCIO (CATÁLOGO DE REPUESTOS) */}
      {vistaActiva === 'crud_catalogo' && (
        <View style={{ flex: 1 }}>
          <View style={styles.crudTopActions}>
            <TouchableOpacity style={styles.btnCreateRepuesto} onPress={abrirModalCrearRepuesto}>
              <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.btnCreateRepuestoText}>Registrar Repuesto</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnRestoreCat} onPress={handleRestaurarCatalogo}>
              <Ionicons name="refresh-outline" size={16} color="#0066FF" />
              <Text style={styles.btnRestoreCatText}>Restaurar Base</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Filtrar repuestos por nombre, código OEM o marca..."
              placeholderTextColor="#94A3B8"
              value={busquedaCatalogo}
              onChangeText={setBusquedaCatalogo}
            />
          </View>

          <View style={styles.filtersWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {(['Todos', ...CATEGORIAS_EDITABLES] as CategoriaRepuesto[]).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.filterChip, filtroCategoria === cat && styles.filterChipActive]}
                  onPress={() => setFiltroCategoria(cat)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filtroCategoria === cat && styles.filterChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <FlatList
            data={catalogoFiltrado}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            renderItem={({ item }) => (
              <View style={styles.crudItemCard}>
                <ProductImage uri={item.imagenUri} style={styles.crudImg} resizeMode="contain" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.crudName} numberOfLines={1}>
                    {item.nombre}
                  </Text>
                  <Text style={styles.crudOem}>
                    OEM: {item.codigoOEM} • {item.categoria}
                  </Text>
                  <Text style={styles.crudPrice}>
                    S/ {item.precio.toFixed(2)} • Stock: {item.stock} unid.
                  </Text>
                </View>

                <View style={styles.crudBtnsCol}>
                  <TouchableOpacity
                    style={styles.crudEditBtn}
                    onPress={() => abrirModalEditarRepuesto(item)}
                  >
                    <Ionicons name="create-outline" size={16} color="#0066FF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.crudDelBtn}
                    onPress={() => handleEliminarRepuesto(item)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>
      )}

      {/* Modal Crear / Actualizar Repuesto (3.3 Lógica de Negocio) */}
      <Modal visible={showRepuestoModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {repuestoEditId ? 'Actualizar Repuesto' : 'Registrar Nuevo Repuesto'}
              </Text>
              <TouchableOpacity onPress={() => setShowRepuestoModal(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {errorForm && <Text style={styles.errorAlert}>{errorForm}</Text>}

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Código OEM *</Text>
                  <TextInput
                    style={styles.input}
                    value={formOEM}
                    onChangeText={setFormOEM}
                    placeholder="Ej. 04465-0K200"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Precio (S/) *</Text>
                  <TextInput
                    style={styles.input}
                    value={formPrecio}
                    onChangeText={setFormPrecio}
                    keyboardType="numeric"
                    placeholder="Ej. 185.00"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Nombre del Repuesto *</Text>
              <TextInput
                style={styles.input}
                value={formNombre}
                onChangeText={setFormNombre}
                placeholder="Ej. Pastillas de Freno Cerámicas"
              />

              <Text style={styles.inputLabel}>Categoría Técnica</Text>
              <View style={styles.catSelectorRow}>
                {CATEGORIAS_EDITABLES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catOption, formCategoria === cat && styles.catOptionActive]}
                    onPress={() => setFormCategoria(cat)}
                  >
                    <Text
                      style={[
                        styles.catOptionText,
                        formCategoria === cat && styles.catOptionTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ width: 110 }}>
                  <Text style={styles.inputLabel}>Stock Inicial</Text>
                  <TextInput
                    style={styles.input}
                    value={formStock}
                    onChangeText={setFormStock}
                    keyboardType="numeric"
                    placeholder="10"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Compatibilidad Vehicular</Text>
                  <TextInput
                    style={styles.input}
                    value={formCompat}
                    onChangeText={setFormCompat}
                    placeholder="Toyota Hilux / Yaris"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Descripción Técnica</Text>
              <TextInput
                style={[styles.input, { height: 64, textAlignVertical: 'top', paddingTop: 10 }]}
                value={formDesc}
                onChangeText={setFormDesc}
                multiline
                placeholder="Especificaciones de la pieza..."
              />

              <TouchableOpacity style={styles.photoPickerBtn} onPress={handleSeleccionarFotoRepuesto}>
                <Ionicons name="images-outline" size={16} color="#0066FF" />
                <Text style={styles.photoPickerText}>
                  {formImagen ? 'Imagen adjuntada (Cambiar)' : 'Seleccionar imagen desde galería'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveModalBtn} onPress={handleGuardarRepuesto}>
                <Text style={styles.saveModalBtnText}>
                  {repuestoEditId ? 'Guardar Actualización' : 'Registrar en Catálogo'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
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
    fontSize: 17,
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
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtnActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  tabBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  kpiValue: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  kpiSub: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 12,
  },
  barRow: {
    marginBottom: 10,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },
  barAmount: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0066FF',
  },
  barTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#0066FF',
    borderRadius: 4,
  },
  splitMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  splitBox: {
    alignItems: 'center',
    flex: 1,
  },
  splitNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  splitLabel: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 6,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  filtersWrapper: {
    paddingVertical: 8,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 6,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterChipActiveBlue: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderCode: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  orderMeta: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  orderTotal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0066FF',
  },
  orderDetailText: {
    fontSize: 11.5,
    color: '#475569',
    marginTop: 6,
  },
  orderActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  orderStatusPills: {
    flexDirection: 'row',
    gap: 5,
  },
  stateMiniBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  stateMiniBtnActive: {
    backgroundColor: '#059669',
  },
  stateMiniBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },
  stateMiniBtnTextActive: {
    color: '#FFFFFF',
  },
  deleteOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
  },
  deleteOrderBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  crudTopActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 6,
    gap: 8,
  },
  btnCreateRepuesto: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    height: 40,
    borderRadius: 10,
  },
  btnCreateRepuestoText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  btnRestoreCat: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  btnRestoreCatText: {
    color: '#0066FF',
    fontSize: 12,
    fontWeight: '700',
  },
  crudItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  crudImg: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  crudName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  crudOem: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  crudPrice: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0066FF',
    marginTop: 2,
  },
  crudBtnsCol: {
    flexDirection: 'row',
    gap: 6,
  },
  crudEditBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  crudDelBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  errorAlert: {
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    padding: 8,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
    marginTop: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0F172A',
  },
  catSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  catOption: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  catOptionActive: {
    backgroundColor: '#0066FF',
  },
  catOptionText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  catOptionTextActive: {
    color: '#FFFFFF',
  },
  photoPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  photoPickerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0066FF',
  },
  saveModalBtn: {
    backgroundColor: '#0066FF',
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  saveModalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
