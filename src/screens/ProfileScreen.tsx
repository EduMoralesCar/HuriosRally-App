import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { EventoSeguridad, RolUsuario, Usuario } from '../types';
import { StorageService } from '../services/StorageService';
import { CameraService } from '../services/CameraService';
import { AuthService, validateStrongPassword } from '../services/AuthService';
import { UMBRAL_STOCK_CRITICO } from '../utils/catalog';
import { filtrarPedidosPorUsuario, resumirPedidos } from '../utils/orders';

interface Props {
  onLogout: () => void;
}

const SEDES_DISPONIBLES = [
  { id: '1', nombre: 'Lima Norte / SMP (Sede Central)', direccion: 'Av. Perú 2450, San Martín de Porres' },
  { id: '2', nombre: 'Almacén Central / Despacho SMP', direccion: 'Jr. Huancayo 312, SMP' },
];

const ROLES_DISPONIBLES: RolUsuario[] = ['Cliente', 'Asesor', 'Administrador'];

const formatearTelefonoVisual = (digits: string): string => {
  const clean = digits.replace(/[^0-9]/g, '').slice(0, 9);
  if (clean.length === 9) {
    return `+51 ${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 9)}`;
  }
  return clean ? `+51 ${clean}` : '+51 987 654 321';
};

export const ProfileScreen: React.FC<Props> = ({ onLogout }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [usuariosSistema, setUsuariosSistema] = useState<Usuario[]>([]);
  const [eventosSeguridad, setEventosSeguridad] = useState<EventoSeguridad[]>([]);
  const [totalCatalogo, setTotalCatalogo] = useState<number>(46);
  const [metricas, setMetricas] = useState({
    pedidosCount: 0,
    montoTotal: 0,
    favoritosCount: 0,
    pendientesDespacho: 0,
    entregadosDespacho: 0,
    stockCriticoCount: 0,
  });

  // Modales
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [tabUsuarios, setTabUsuarios] = useState<'activos' | 'inactivos'>('activos');

  const [feedback, setFeedback] = useState<{
    tipo: 'success' | 'error' | 'info';
    titulo: string;
    mensaje: string;
  } | null>(null);

  // Formulario Editar Perfil
  const [nombreEdit, setNombreEdit] = useState('');
  const [telefonoEdit, setTelefonoEdit] = useState('');
  const [tipoDocEdit, setTipoDocEdit] = useState<'DNI' | 'RUC'>('DNI');
  const [numDocEdit, setNumDocEdit] = useState('');
  const [direccionEdit, setDireccionEdit] = useState('');
  const [sedeEdit, setSedeEdit] = useState('Lima Norte / SMP (Sede Central)');
  const [showSedeDropdown, setShowSedeDropdown] = useState(false);

  // Formulario Cambiar Contraseña
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [biometricsActive, setBiometricsActive] = useState(false);

  const cargarDatosUsuario = useCallback(async () => {
    const [sesion, historial, favs, catalogo, listaUsuarios, logs] = await Promise.all([
      StorageService.getSesion(),
      StorageService.getHistorialPedidos(),
      StorageService.getFavoritos(),
      StorageService.getCatalogoRepuestos(),
      StorageService.getUsuarios(),
      StorageService.getEventosSeguridad(),
    ]);

    setUsuariosSistema(listaUsuarios);
    setEventosSeguridad(logs);
    setTotalCatalogo(catalogo.length);

    if (sesion) {
      setUser(sesion);
      setNombreEdit(sesion.nombreCompleto);
      const telDigits = (sesion.telefono || '')
        .replace(/^\+51\s*/, '')
        .replace(/[^0-9]/g, '')
        .slice(0, 9);
      setTelefonoEdit(telDigits || '987654321');
      setTipoDocEdit(sesion.tipoDocumento || 'DNI');
      setNumDocEdit(sesion.numeroDocumento || '');
      setDireccionEdit(sesion.direccion || '');
      setSedeEdit(sesion.sede || 'Lima Norte / SMP (Sede Central)');
      setBiometricsActive(!!sesion.biometricsEnabled);

      const misPedidos = filtrarPedidosPorUsuario(historial, sesion);
      const resumenMio = resumirPedidos(misPedidos);
      const resumenGlobal = resumirPedidos(historial);
      const criticos = catalogo.filter((r) => r.stock <= UMBRAL_STOCK_CRITICO).length;

      setMetricas({
        pedidosCount: resumenMio.cantidad,
        montoTotal: resumenMio.monto,
        favoritosCount: favs.length,
        pendientesDespacho: resumenGlobal.pendientes,
        entregadosDespacho: resumenGlobal.entregados,
        stockCriticoCount: criticos,
      });
    }
  }, []);

  useEffect(() => {
    cargarDatosUsuario();
  }, [cargarDatosUsuario]);

  const triggerFeedback = (tipo: 'success' | 'error' | 'info', titulo: string, mensaje: string) => {
    setFeedback({ tipo, titulo, mensaje });
    setTimeout(() => {
      setFeedback(null);
    }, 3200);
  };

  const handleTomarFotoCamara = async () => {
    const uri = await CameraService.takePhoto();
    if (uri && user) {
      const updated = { ...user, fotoPerfilUri: uri };
      setUser(updated);
      await StorageService.saveSesion(updated);
      await StorageService.saveUsuario(updated);
      triggerFeedback('success', 'Foto Actualizada', 'Tu foto de perfil se guardó correctamente.');
    }
  };

  const handleSeleccionarGaleria = async () => {
    const uri = await CameraService.pickImage();
    if (uri && user) {
      const updated = { ...user, fotoPerfilUri: uri };
      setUser(updated);
      await StorageService.saveSesion(updated);
      await StorageService.saveUsuario(updated);
      triggerFeedback('success', 'Foto Actualizada', 'Se actualizó tu foto desde la galería.');
    }
  };

  const handleRestablecerIconoPerfil = async () => {
    if (!user) return;
    const updated = { ...user, fotoPerfilUri: '' };
    setUser(updated);
    await StorageService.saveSesion(updated);
    await StorageService.saveUsuario(updated);
    triggerFeedback('info', 'Foto Restablecida', 'Se restableció el avatar por defecto.');
  };

  const handleGuardarPerfil = async () => {
    if (!nombreEdit.trim()) {
      triggerFeedback('error', 'Campo Obligatorio', 'Ingresa tu nombre completo.');
      return;
    }

    if (telefonoEdit.trim().length > 0 && telefonoEdit.trim().length < 9) {
      triggerFeedback('error', 'Teléfono Incompleto', 'El número de celular debe tener 9 dígitos.');
      return;
    }

    if (user?.rol === 'Cliente' && numDocEdit.trim().length > 0) {
      const longitudEsperada = tipoDocEdit === 'DNI' ? 8 : 11;
      if (numDocEdit.trim().length !== longitudEsperada) {
        triggerFeedback(
          'error',
          'Documento Inválido',
          `El ${tipoDocEdit} debe tener exactamente ${longitudEsperada} dígitos.`
        );
        return;
      }
    }

    if (user) {
      const telFormateado = formatearTelefonoVisual(telefonoEdit);
      const updated: Usuario = {
        ...user,
        nombreCompleto: nombreEdit.trim(),
        telefono: telFormateado,
        ...(user.rol === 'Cliente'
          ? {
              tipoDocumento: tipoDocEdit,
              numeroDocumento: numDocEdit.trim(),
              direccion: direccionEdit.trim(),
            }
          : {
              sede: sedeEdit,
            }),
      };
      setUser(updated);
      await StorageService.saveSesion(updated);
      await StorageService.saveUsuario(updated);
      setShowEditModal(false);
      await cargarDatosUsuario();
      triggerFeedback('success', 'Datos Guardados', 'Tu información fue actualizada con éxito.');
    }
  };

  const handleCambiarPassword = async () => {
    if (!currentPass.trim() || !newPass.trim() || !confirmPass.trim()) {
      triggerFeedback('error', 'Campos Incompletos', 'Completa todos los campos de contraseña.');
      return;
    }

    const passVal = validateStrongPassword(newPass);
    if (!passVal.valid) {
      triggerFeedback(
        'error',
        'Contraseña Inválida',
        passVal.message || 'La nueva contraseña debe tener al menos 8 caracteres.'
      );
      return;
    }

    if (newPass !== confirmPass) {
      triggerFeedback('error', 'No Coinciden', 'La confirmación no coincide con la nueva contraseña.');
      return;
    }

    if (user) {
      const res = await AuthService.updatePassword(user.id, currentPass, newPass);
      if (res.success) {
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
        setShowCurrentPass(false);
        setShowNewPass(false);
        setShowConfirmPass(false);
        setShowPasswordModal(false);
        await cargarDatosUsuario();
        triggerFeedback('success', 'Contraseña Actualizada', 'Tu contraseña ha sido modificada con éxito.');
      } else {
        triggerFeedback('error', 'Error', res.message);
      }
    }
  };

  const handleToggleBiometrics = async (value: boolean) => {
    if (!user) return;
    const updated: Usuario = { ...user, biometricsEnabled: value };
    setUser(updated);
    setBiometricsActive(value);
    await StorageService.saveSesion(updated);
    await StorageService.saveUsuario(updated);
    triggerFeedback(
      value ? 'success' : 'info',
      value ? 'Huella Activada' : 'Huella Desactivada',
      value
        ? 'Ahora puedes iniciar sesión rápidamente con tu huella.'
        : 'Se desactivó el inicio de sesión con huella.'
    );
  };

  const handleCambiarRolUsuario = async (targetUser: Usuario, nuevoRol: RolUsuario) => {
    const actualizado: Usuario = { ...targetUser, rol: nuevoRol };
    await StorageService.saveUsuario(actualizado);
    if (user && user.id === targetUser.id) {
      await StorageService.saveSesion(actualizado);
    }
    await StorageService.registrarEventoSeguridad({
      usuario: targetUser.username,
      rol: nuevoRol,
      accion: 'Cambio de Rol',
      detalle: `Rol de @${targetUser.username} cambiado a ${nuevoRol}.`,
    });
    await cargarDatosUsuario();
    triggerFeedback('success', 'Rol Actualizado', `@${targetUser.username} ahora es ${nuevoRol}.`);
  };

  const handleDesactivarCuenta = async (targetUser: Usuario) => {
    if (user && targetUser.id === user.id) {
      triggerFeedback('error', 'Acción no permitida', 'No puedes desactivar tu propia cuenta en uso.');
      return;
    }
    await StorageService.desactivarUsuario(targetUser.id);
    await cargarDatosUsuario();
    triggerFeedback('info', 'Cuenta Desactivada', `@${targetUser.username} fue movido a inactivos.`);
  };

  const handleRestaurarCuenta = async (targetUser: Usuario) => {
    await StorageService.restaurarUsuario(targetUser.id);
    await cargarDatosUsuario();
    triggerFeedback('success', 'Cuenta Restaurada', `@${targetUser.username} se encuentra activo nuevamente.`);
  };

  const handleRestaurarTodos = async () => {
    await StorageService.restaurarUsuariosSemilla();
    await cargarDatosUsuario();
    triggerFeedback('success', 'Cuentas Restauradas', 'Todos los usuarios fueron activados.');
  };

  const confirmarCerrarSesion = async () => {
    setShowLogoutModal(false);
    await StorageService.clearSesion();
    onLogout();
  };

  const esCliente = user?.rol === 'Cliente';
  const esAsesor = user?.rol === 'Asesor';
  const esAdmin = user?.rol === 'Administrador' || user?.rol === 'Almacenero';

  const usuariosActivos = usuariosSistema.filter((u) => u.activo !== false);
  const usuariosInactivos = usuariosSistema.filter((u) => u.activo === false);
  const tieneFotoPersonalizada = !!(user?.fotoPerfilUri && user.fotoPerfilUri.trim() !== '');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {feedback && (
        <View
          style={[
            styles.toastBox,
            feedback.tipo === 'success'
              ? styles.toastSuccess
              : feedback.tipo === 'error'
                ? styles.toastError
                : styles.toastInfo,
          ]}
        >
          <Ionicons
            name={
              feedback.tipo === 'success'
                ? 'checkmark-circle'
                : feedback.tipo === 'error'
                  ? 'alert-circle'
                  : 'information-circle'
            }
            size={22}
            color={
              feedback.tipo === 'success'
                ? '#059669'
                : feedback.tipo === 'error'
                  ? '#DC2626'
                  : '#0284C7'
            }
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.toastTitle}>{feedback.titulo}</Text>
            <Text style={styles.toastMessage}>{feedback.mensaje}</Text>
          </View>
          <TouchableOpacity onPress={() => setFeedback(null)}>
            <Ionicons name="close" size={18} color="#64748B" />
          </TouchableOpacity>
        </View>
      )}

      {/* Encabezado */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity style={styles.editBtn} onPress={cargarDatosUsuario}>
            <Ionicons name="refresh-outline" size={21} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.editBtn} onPress={() => setShowEditModal(true)}>
            <Ionicons name="create-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Tarjeta Principal de Perfil */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarWrapper}>
            <Image
              source={
                tieneFotoPersonalizada
                  ? { uri: user!.fotoPerfilUri }
                  : require('../../assets/default-avatar.png')
              }
              style={styles.avatarImage}
            />
          </View>

          <View style={styles.photoActionsRow}>
            <TouchableOpacity style={styles.photoActionBtn} onPress={handleTomarFotoCamara}>
              <Ionicons name="camera-outline" size={14} color="#0066FF" />
              <Text style={styles.photoActionText}>Cámara</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoActionBtn} onPress={handleSeleccionarGaleria}>
              <Ionicons name="image-outline" size={14} color="#0066FF" />
              <Text style={styles.photoActionText}>Galería</Text>
            </TouchableOpacity>
            {tieneFotoPersonalizada && (
              <TouchableOpacity
                style={[styles.photoActionBtn, { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' }]}
                onPress={handleRestablecerIconoPerfil}
              >
                <Ionicons name="person-outline" size={14} color="#475569" />
                <Text style={[styles.photoActionText, { color: '#475569' }]}>Por Defecto</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.userName}>{user?.nombreCompleto || 'Usuario'}</Text>
          <Text style={styles.userRole}>
            {esAdmin
              ? `Administrador • ${user?.sede || 'Sede Central SMP'}`
              : esAsesor
                ? `Asesor Comercial • ${user?.sede || 'Sede Central SMP'}`
                : `Cliente • @${user?.username || 'cliente'}`}
          </Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
        </View>

        {/* Resumen según Rol */}
        <View style={styles.statsCard}>
          {esAsesor ? (
            <>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{metricas.pedidosCount}</Text>
                <Text style={styles.statLabel}>Cotizaciones</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>S/ {metricas.montoTotal.toFixed(0)}</Text>
                <Text style={styles.statLabel}>Total Ventas</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{totalCatalogo}</Text>
                <Text style={styles.statLabel}>Repuestos</Text>
              </View>
            </>
          ) : esAdmin ? (
            <>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: '#16A34A' }]}>
                  {metricas.entregadosDespacho}
                </Text>
                <Text style={styles.statLabel}>Entregados</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: '#D97706' }]}>
                  {metricas.pendientesDespacho}
                </Text>
                <Text style={styles.statLabel}>Pendientes</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: '#DC2626' }]}>
                  {metricas.stockCriticoCount}
                </Text>
                <Text style={styles.statLabel}>Stock Crítico</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{metricas.pedidosCount}</Text>
                <Text style={styles.statLabel}>Mis Pedidos</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{metricas.favoritosCount}</Text>
                <Text style={styles.statLabel}>Favoritos</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>S/ {metricas.montoTotal.toFixed(0)}</Text>
                <Text style={styles.statLabel}>Mis Compras</Text>
              </View>
            </>
          )}
        </View>

        {/* Datos de la Cuenta según Rol */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Datos Personales</Text>
            <TouchableOpacity onPress={() => setShowEditModal(true)}>
              <Text style={styles.editLinkText}>Editar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="person-outline" size={18} color="#64748B" />
              <Text style={styles.infoLabel}>Usuario:</Text>
            </View>
            <Text style={styles.infoValue}>@{user?.username || 'usuario'}</Text>
          </View>

          {esCliente ? (
            <>
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <Ionicons name="card-outline" size={18} color="#64748B" />
                  <Text style={styles.infoLabel}>{user?.tipoDocumento || 'DNI'}:</Text>
                </View>
                <Text style={styles.infoValue}>
                  {user?.numeroDocumento || 'Sin registrar'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <Ionicons name="call-outline" size={18} color="#64748B" />
                  <Text style={styles.infoLabel}>Teléfono:</Text>
                </View>
                <Text style={styles.infoValue}>{user?.telefono || 'Sin registrar'}</Text>
              </View>

              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <View style={styles.infoLeft}>
                  <Ionicons name="location-outline" size={18} color="#64748B" />
                  <Text style={styles.infoLabel}>Dirección:</Text>
                </View>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {user?.direccion || 'San Martín de Porres, Lima'}
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <Ionicons name="briefcase-outline" size={18} color="#64748B" />
                  <Text style={styles.infoLabel}>Cargo:</Text>
                </View>
                <Text style={[styles.infoValue, { color: '#0066FF' }]}>
                  {esAdmin ? 'Administrador' : 'Asesor Comercial'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <Ionicons name="call-outline" size={18} color="#64748B" />
                  <Text style={styles.infoLabel}>Teléfono:</Text>
                </View>
                <Text style={styles.infoValue}>{user?.telefono || '+51 987 654 321'}</Text>
              </View>

              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <View style={styles.infoLeft}>
                  <Ionicons name="business-outline" size={18} color="#64748B" />
                  <Text style={styles.infoLabel}>Sede:</Text>
                </View>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {user?.sede || 'Lima Norte / SMP (Sede Central)'}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Opciones de Cuenta y Administración (exclusivo Admin lo interno) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {esAdmin ? 'Panel de Administración' : 'Configuración de Cuenta'}
          </Text>

          {esAdmin && (
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => setShowUsersModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.infoLeft}>
                <Ionicons name="people-outline" size={20} color="#059669" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionText}>Gestión de Usuarios</Text>
                  <Text style={styles.optionSub}>
                    {usuariosActivos.length} activos • {usuariosInactivos.length} inactivos
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}

          {esAdmin && (
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => setShowAuditModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.infoLeft}>
                <Ionicons name="time-outline" size={20} color="#7C3AED" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionText}>Registro de Actividad</Text>
                  <Text style={styles.optionSub}>Historial de accesos y movimientos</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setShowPasswordModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.infoLeft}>
              <Ionicons name="lock-closed-outline" size={20} color="#0066FF" />
              <View style={{ flex: 1 }}>
                <Text style={styles.optionText}>Cambiar Contraseña</Text>
                <Text style={styles.optionSub}>Actualizar tu clave de acceso</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.biometricSwitchRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="finger-print" size={20} color="#0066FF" />
              <View style={{ flex: 1 }}>
                <Text style={styles.optionText}>Acceso con Huella Dactilar</Text>
                <Text style={styles.optionSub}>
                  {biometricsActive ? 'Activado para inicio rápido' : 'Desactivado'}
                </Text>
              </View>
            </View>
            <Switch
              value={biometricsActive}
              onValueChange={handleToggleBiometrics}
              trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
              thumbColor={biometricsActive ? '#0066FF' : '#94A3B8'}
            />
          </View>

          <TouchableOpacity
            style={[styles.optionRow, { borderBottomWidth: 0 }]}
            onPress={() => setShowCompanyModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.infoLeft}>
              <Ionicons name="business-outline" size={20} color="#EF4444" />
              <View style={{ flex: 1 }}>
                <Text style={styles.optionText}>Información de la Empresa</Text>
                <Text style={styles.optionSub}>Sede principal, RUC y canales de atención</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => setShowLogoutModal(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <Text style={styles.versionTag}>Hurios Rally E.I.R.L.</Text>
      </ScrollView>

      {/* Modal 1: Editar Información (adaptado según rol) */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Información</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalFieldLabel}>Nombre Completo *</Text>
              <TextInput
                style={styles.modalInput}
                value={nombreEdit}
                onChangeText={setNombreEdit}
                placeholder="Nombre y Apellidos"
              />

              {esCliente && (
                <>
                  <Text style={styles.modalFieldLabel}>Documento de Identidad (DNI / RUC):</Text>
                  <View style={styles.docTypeRow}>
                    {(['DNI', 'RUC'] as const).map((tipo) => (
                      <TouchableOpacity
                        key={tipo}
                        style={[
                          styles.docTypeChip,
                          tipoDocEdit === tipo && styles.docTypeChipActive,
                        ]}
                        onPress={() => {
                          setTipoDocEdit(tipo);
                          const maxLen = tipo === 'DNI' ? 8 : 11;
                          setNumDocEdit((prev) => prev.slice(0, maxLen));
                        }}
                      >
                        <Text
                          style={[
                            styles.docTypeChipText,
                            tipoDocEdit === tipo && styles.docTypeChipTextActive,
                          ]}
                        >
                          {tipo === 'DNI' ? 'DNI (8 dígitos)' : 'RUC (11 dígitos)'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TextInput
                    style={styles.modalInput}
                    value={numDocEdit}
                    onChangeText={(t) =>
                      setNumDocEdit(
                        t.replace(/[^0-9]/g, '').slice(0, tipoDocEdit === 'DNI' ? 8 : 11)
                      )
                    }
                    keyboardType="numeric"
                    maxLength={tipoDocEdit === 'DNI' ? 8 : 11}
                    placeholder={
                      tipoDocEdit === 'DNI' ? 'Ingresa los 8 dígitos de tu DNI' : 'Ingresa los 11 dígitos de tu RUC'
                    }
                    placeholderTextColor="#94A3B8"
                  />
                </>
              )}

              <Text style={styles.modalFieldLabel}>Teléfono de Contacto (9 dígitos):</Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.countryCodeBadge}>
                  <Text style={styles.countryCodeText}>+51</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  value={telefonoEdit}
                  onChangeText={(t) => setTelefonoEdit(t.replace(/[^0-9]/g, '').slice(0, 9))}
                  keyboardType="numeric"
                  maxLength={9}
                  placeholder="987654321"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {esCliente ? (
                <>
                  <Text style={styles.modalFieldLabel}>Dirección de Entrega / Referencia:</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={direccionEdit}
                    onChangeText={setDireccionEdit}
                    placeholder="Ej. Av. Habich 420, San Martín de Porres"
                    placeholderTextColor="#94A3B8"
                  />
                </>
              ) : (
                <>
                  <Text style={styles.modalFieldLabel}>Sede Asignada:</Text>
                  <TouchableOpacity
                    style={styles.dropdownBtn}
                    onPress={() => setShowSedeDropdown(!showSedeDropdown)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.dropdownLeft}>
                      <Ionicons name="business-outline" size={18} color="#0066FF" />
                      <Text style={styles.dropdownCurrentText}>{sedeEdit}</Text>
                    </View>
                    <Ionicons
                      name={showSedeDropdown ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color="#64748B"
                    />
                  </TouchableOpacity>

                  {showSedeDropdown && (
                    <View style={styles.dropdownList}>
                      {SEDES_DISPONIBLES.map((sede) => (
                        <TouchableOpacity
                          key={sede.id}
                          style={[
                            styles.dropdownOption,
                            sedeEdit === sede.nombre && styles.dropdownOptionActive,
                          ]}
                          onPress={() => {
                            setSedeEdit(sede.nombre);
                            setShowSedeDropdown(false);
                          }}
                        >
                          <View>
                            <Text
                              style={[
                                styles.dropdownOptionText,
                                sedeEdit === sede.nombre && styles.dropdownOptionTextActive,
                              ]}
                            >
                              {sede.nombre}
                            </Text>
                            <Text style={styles.dropdownSubtext}>{sede.direccion}</Text>
                          </View>
                          {sedeEdit === sede.nombre && (
                            <Ionicons name="checkmark-circle" size={18} color="#0066FF" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}

              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleGuardarPerfil}>
                <Text style={styles.modalSaveBtnText}>Guardar Cambios</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal 2: Cambiar Contraseña (Limpio y directo para todos los usuarios) */}
      <Modal visible={showPasswordModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Cambiar Contraseña</Text>
                <Text style={styles.modalSubtitle}>Ingresa tu clave actual y la nueva contraseña</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalFieldLabel}>Contraseña Actual</Text>
            <View style={styles.passInputWrapper}>
              <TextInput
                style={styles.passTextInput}
                placeholder="Ingresa tu contraseña actual"
                placeholderTextColor="#94A3B8"
                value={currentPass}
                onChangeText={setCurrentPass}
                secureTextEntry={!showCurrentPass}
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPass(!showCurrentPass)}
                style={styles.eyeBtn}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showCurrentPass ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalFieldLabel}>Nueva Contraseña</Text>
            <View style={styles.passInputWrapper}>
              <TextInput
                style={styles.passTextInput}
                placeholder="Mín. 8 caracteres, mayúscula, número y símbolo"
                placeholderTextColor="#94A3B8"
                value={newPass}
                onChangeText={setNewPass}
                secureTextEntry={!showNewPass}
              />
              <TouchableOpacity
                onPress={() => setShowNewPass(!showNewPass)}
                style={styles.eyeBtn}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showNewPass ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalFieldLabel}>Confirmar Nueva Contraseña</Text>
            <View style={styles.passInputWrapper}>
              <TextInput
                style={styles.passTextInput}
                placeholder="Repite la nueva contraseña"
                placeholderTextColor="#94A3B8"
                value={confirmPass}
                onChangeText={setConfirmPass}
                secureTextEntry={!showConfirmPass}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPass(!showConfirmPass)}
                style={styles.eyeBtn}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showConfirmPass ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleCambiarPassword}>
              <Text style={styles.modalSaveBtnText}>Actualizar Contraseña</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal 3: Gestión de Usuarios (Exclusivo Administrador) */}
      <Modal visible={showUsersModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Gestión de Usuarios</Text>
                <Text style={styles.modalSubtitle}>Control de cuentas, roles y estado de acceso</Text>
              </View>
              <TouchableOpacity onPress={() => setShowUsersModal(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <View style={styles.userTabsRow}>
              <TouchableOpacity
                style={[styles.userTabBtn, tabUsuarios === 'activos' && styles.userTabBtnActive]}
                onPress={() => setTabUsuarios('activos')}
              >
                <Text
                  style={[
                    styles.userTabText,
                    tabUsuarios === 'activos' && styles.userTabTextActive,
                  ]}
                >
                  Activos ({usuariosActivos.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.userTabBtn, tabUsuarios === 'inactivos' && styles.userTabBtnActive]}
                onPress={() => setTabUsuarios('inactivos')}
              >
                <Text
                  style={[
                    styles.userTabText,
                    tabUsuarios === 'inactivos' && styles.userTabTextActive,
                  ]}
                >
                  Inactivos ({usuariosInactivos.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.restoreAllBtn} onPress={handleRestaurarTodos}>
                <Ionicons name="refresh" size={14} color="#059669" />
                <Text style={styles.restoreAllText}>Restaurar</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {(tabUsuarios === 'activos' ? usuariosActivos : usuariosInactivos).map((usr) => (
                <View key={usr.id} style={styles.userItemCard}>
                  <View style={styles.userItemHeader}>
                    <Image
                      source={
                        usr.fotoPerfilUri && usr.fotoPerfilUri.trim() !== ''
                          ? { uri: usr.fotoPerfilUri }
                          : require('../../assets/default-avatar.png')
                      }
                      style={styles.userItemAvatar}
                    />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.userItemName}>{usr.nombreCompleto}</Text>
                      <Text style={styles.userItemMeta}>
                        @{usr.username} • {usr.email}
                      </Text>
                    </View>
                    {usr.activo === false ? (
                      <TouchableOpacity
                        style={styles.btnRestoreUser}
                        onPress={() => handleRestaurarCuenta(usr)}
                      >
                        <Ionicons name="refresh" size={14} color="#FFFFFF" />
                        <Text style={styles.btnRestoreUserText}>Restaurar</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.btnDeactivateUser}
                        onPress={() => handleDesactivarCuenta(usr)}
                      >
                        <Text style={styles.btnDeactivateUserText}>Desactivar</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.roleChipsRow}>
                    <Text style={styles.roleChipsLabel}>Rol:</Text>
                    {ROLES_DISPONIBLES.map((rol) => {
                      const seleccionado =
                        usr.rol === rol || (rol === 'Administrador' && usr.rol === 'Almacenero');
                      return (
                        <TouchableOpacity
                          key={rol}
                          style={[styles.roleChip, seleccionado && styles.roleChipActive]}
                          onPress={() => handleCambiarRolUsuario(usr, rol)}
                        >
                          <Text
                            style={[
                              styles.roleChipText,
                              seleccionado && styles.roleChipTextActive,
                            ]}
                          >
                            {rol === 'Administrador' ? 'Admin' : rol}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}

              {tabUsuarios === 'inactivos' && usuariosInactivos.length === 0 && (
                <View style={styles.emptyUsersBox}>
                  <Ionicons name="checkmark-circle-outline" size={38} color="#10B981" />
                  <Text style={styles.emptyUsersText}>
                    No hay usuarios inactivos en este momento.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal 4: Registro de Actividad (Exclusivo Administrador) */}
      <Modal visible={showAuditModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Registro de Actividad</Text>
                <Text style={styles.modalSubtitle}>Últimos eventos del sistema</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAuditModal(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {eventosSeguridad.slice(0, 12).map((ev) => (
                <View key={ev.id} style={styles.auditRow}>
                  <Text style={styles.auditAction}>
                    {ev.accion} • @{ev.usuario} ({ev.rol === 'Almacenero' ? 'Administrador' : ev.rol})
                  </Text>
                  <Text style={styles.auditDetail}>
                    {ev.detalle} ({ev.fecha})
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal 5: Información de la Empresa */}
      <Modal visible={showCompanyModal} animationType="fade" transparent>
        <View style={styles.modalBg}>
          <View style={styles.companyCard}>
            <View style={styles.companyHeader}>
              <View style={styles.companyBadge}>
                <Ionicons name="business" size={22} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.companyTitle}>HURIOS RALLY E.I.R.L.</Text>
                <Text style={styles.companyRuc}>RUC: 20608542191</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCompanyModal(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.companyBody}>
              <View style={styles.companyRow}>
                <Ionicons name="car-sport-outline" size={18} color="#0066FF" />
                <View style={styles.companyRowText}>
                  <Text style={styles.companyLabel}>Rubro Comercial:</Text>
                  <Text style={styles.companyValue}>
                    Venta y distribución de repuestos automotrices multimarca y accesorios.
                  </Text>
                </View>
              </View>

              <View style={styles.companyRow}>
                <Ionicons name="location-outline" size={18} color="#EF4444" />
                <View style={styles.companyRowText}>
                  <Text style={styles.companyLabel}>Dirección Principal:</Text>
                  <Text style={styles.companyValue}>
                    Av. Perú 2450, San Martín de Porres, Lima.
                  </Text>
                </View>
              </View>

              <View style={styles.companyRow}>
                <Ionicons name="time-outline" size={18} color="#10B981" />
                <View style={styles.companyRowText}>
                  <Text style={styles.companyLabel}>Horario de Atención:</Text>
                  <Text style={styles.companyValue}>
                    Lunes a Sábado: 8:00 a.m. - 7:00 p.m.
                  </Text>
                </View>
              </View>

              <View style={[styles.companyRow, { borderBottomWidth: 0 }]}>
                <Ionicons name="call-outline" size={18} color="#F59E0B" />
                <View style={styles.companyRowText}>
                  <Text style={styles.companyLabel}>Contacto:</Text>
                  <Text style={styles.companyValue}>
                    Central: (01) 534-8920{'\n'}WhatsApp: +51 987 654 321{'\n'}Correo: ventas@huriosrally.com
                  </Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.companyCloseBtn}
              onPress={() => setShowCompanyModal(false)}
            >
              <Text style={styles.companyCloseBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal 6: Confirmación de Cierre de Sesión */}
      <Modal visible={showLogoutModal} animationType="fade" transparent>
        <View style={styles.modalBg}>
          <View style={styles.logoutModalCard}>
            <View style={styles.logoutIconCircle}>
              <Ionicons name="log-out-outline" size={30} color="#EF4444" />
            </View>

            <Text style={styles.logoutModalTitle}>¿Cerrar sesión?</Text>
            <Text style={styles.logoutModalSub}>
              ¿Estás seguro de que deseas salir de tu cuenta?
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
                onPress={confirmarCerrarSesion}
              >
                <Text style={styles.logoutConfirmText}>Salir</Text>
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
  toastBox: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  toastSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  toastError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  toastInfo: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  toastTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  toastMessage: {
    fontSize: 11.5,
    color: '#475569',
    marginTop: 1,
  },
  header: {
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  editBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  avatarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  avatarWrapper: {
    marginBottom: 8,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#0066FF',
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  photoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  photoActionText: {
    fontSize: 11.5,
    color: '#0066FF',
    fontWeight: '700',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  userRole: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  userEmail: {
    fontSize: 12,
    color: '#0066FF',
    marginTop: 3,
    fontWeight: '600',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0066FF',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 26,
    backgroundColor: '#E2E8F0',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  editLinkText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0066FF',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    maxWidth: '62%',
    textAlign: 'right',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  biometricSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  optionText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  optionSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#FEE2E2',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
  versionTag: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 18,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  modalFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    marginTop: 10,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 13.5,
    color: '#0F172A',
  },
  docTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  docTypeChip: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docTypeChipActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  docTypeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  docTypeChipTextActive: {
    color: '#FFFFFF',
  },
  passInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    height: 46,
    paddingLeft: 12,
    paddingRight: 6,
  },
  passTextInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#0F172A',
    height: '100%',
  },
  eyeBtn: {
    padding: 8,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  countryCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    height: 46,
    paddingHorizontal: 12,
  },
  countryCodeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    height: 46,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  dropdownBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 12,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownCurrentText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0369A1',
  },
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 6,
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  dropdownOptionActive: {
    backgroundColor: '#F0F9FF',
  },
  dropdownOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  dropdownOptionTextActive: {
    color: '#0066FF',
  },
  dropdownSubtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  modalSaveBtn: {
    backgroundColor: '#0066FF',
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  modalSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  userTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  userTabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  userTabBtnActive: {
    backgroundColor: '#0F172A',
  },
  userTabText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  userTabTextActive: {
    color: '#FFFFFF',
  },
  restoreAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  restoreAllText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  userItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userItemAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#0066FF',
  },
  userItemName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  userItemMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  btnDeactivateUser: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  btnDeactivateUserText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  btnRestoreUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnRestoreUserText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  roleChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  roleChipsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginRight: 4,
  },
  roleChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  roleChipActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  roleChipTextActive: {
    color: '#FFFFFF',
  },
  emptyUsersBox: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyUsersText: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  auditRow: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0066FF',
  },
  auditAction: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  auditDetail: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  companyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    maxHeight: '85%',
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 14,
    marginBottom: 14,
  },
  companyBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  companyRuc: {
    fontSize: 11.5,
    color: '#059669',
    fontWeight: '700',
    marginTop: 2,
  },
  companyBody: {
    marginVertical: 4,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    gap: 12,
  },
  companyRowText: {
    flex: 1,
  },
  companyLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  companyValue: {
    fontSize: 13,
    color: '#0F172A',
    marginTop: 2,
    lineHeight: 18,
    fontWeight: '500',
  },
  companyCloseBtn: {
    backgroundColor: '#0F172A',
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  companyCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  logoutModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
  },
  logoutIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoutModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  logoutModalSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
    marginBottom: 18,
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
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
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
});
