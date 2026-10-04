import React, { useState, useEffect } from 'react';
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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Usuario } from '../types';
import { StorageService } from '../services/StorageService';
import { CameraService } from '../services/CameraService';
import { AuthService } from '../services/AuthService';

interface Props {
  onLogout: () => void;
}

// Opciones de sedes según la empresa Hurios Rally E.I.R.L.
const SEDES_DISPONIBLES = [
  { id: '1', nombre: 'Lima Norte / SMP (Sede Central)', direccion: 'Av. Perú 2450, San Martín de Porres' },
  { id: '2', nombre: 'Almacén Central / Despacho SMP', direccion: 'Jr. Huancayo 312, SMP' },
];

export const ProfileScreen: React.FC<Props> = ({ onLogout }) => {
  const [user, setUser] = useState<Usuario | null>(null);

  // Modales
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Toast / Feedback animado en pantalla
  const [feedback, setFeedback] = useState<{ tipo: 'success' | 'error' | 'info'; titulo: string; mensaje: string } | null>(null);

  // Estados Formulario Editar Perfil
  const [nombreEdit, setNombreEdit] = useState('');
  const [telefonoEdit, setTelefonoEdit] = useState('');
  const [sedeEdit, setSedeEdit] = useState('Lima Norte / SMP (Sede Central)');
  const [showSedeDropdown, setShowSedeDropdown] = useState(false);

  // Estados Formulario Seguridad y Contraseña
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [biometricsActive, setBiometricsActive] = useState(false);

  useEffect(() => {
    cargarDatosUsuario();
  }, []);

  const triggerFeedback = (tipo: 'success' | 'error' | 'info', titulo: string, mensaje: string) => {
    setFeedback({ tipo, titulo, mensaje });
    setTimeout(() => {
      setFeedback(null);
    }, 3800);
  };

  const cargarDatosUsuario = async () => {
    const sesion = await StorageService.getSesion();
    if (sesion) {
      setUser(sesion);
      setNombreEdit(sesion.nombreCompleto);
      const telClean = (sesion.telefono || '').replace('+51', '').trim();
      setTelefonoEdit(telClean || '987654321');
      setSedeEdit(sesion.sede || 'Lima Norte / SMP (Sede Central)');
      setBiometricsActive(!!sesion.biometricsEnabled);
    }
  };

  const handleTomarFotoCamara = async () => {
    const uri = await CameraService.takePhoto();
    if (uri && user) {
      const updated = { ...user, fotoPerfilUri: uri };
      setUser(updated);
      await StorageService.saveSesion(updated);
      await StorageService.saveUsuario(updated);
      triggerFeedback('success', 'Foto Actualizada', 'Tu fotografía de perfil fue tomada y guardada con éxito.');
    }
  };

  const handleSeleccionarGaleria = async () => {
    const uri = await CameraService.pickImage();
    if (uri && user) {
      const updated = { ...user, fotoPerfilUri: uri };
      setUser(updated);
      await StorageService.saveSesion(updated);
      await StorageService.saveUsuario(updated);
      triggerFeedback('success', 'Foto Actualizada', 'Se cargó la foto desde la galería correctamente.');
    }
  };

  const handleGuardarPerfil = async () => {
    if (!nombreEdit.trim()) {
      triggerFeedback('error', 'Campo Obligatorio', 'El nombre completo no puede quedar en blanco.');
      return;
    }

    if (user) {
      const telCompleto = telefonoEdit.trim() ? `+51 ${telefonoEdit.trim()}` : '+51 987 654 321';
      const updated: Usuario = {
        ...user,
        nombreCompleto: nombreEdit.trim(),
        telefono: telCompleto,
        sede: sedeEdit,
      };
      setUser(updated);
      await StorageService.saveSesion(updated);
      await StorageService.saveUsuario(updated);
      setShowEditModal(false);
      triggerFeedback('success', 'Perfil Actualizado', 'Los datos del colaborador se guardaron en el sistema.');
    }
  };

  // Guardar nueva contraseña
  const handleCambiarPassword = async () => {
    if (!currentPass.trim() || !newPass.trim() || !confirmPass.trim()) {
      triggerFeedback('error', 'Campos Incompletos', 'Por favor completa todos los campos de contraseña.');
      return;
    }

    if (newPass.length < 6) {
      triggerFeedback('error', 'Contraseña Débil', 'La nueva contraseña debe tener como mínimo 6 caracteres.');
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
        setShowSecurityModal(false);
        triggerFeedback('success', 'Contraseña Actualizada', 'Tus nuevas credenciales ya están activas.');
      } else {
        triggerFeedback('error', 'Error de Validación', res.message);
      }
    }
  };

  // Registro de Huella Dactilar
  const handleToggleBiometrics = async (value: boolean) => {
    if (!user) return;

    if (value) {
      const updated: Usuario = { ...user, biometricsEnabled: true };
      setUser(updated);
      setBiometricsActive(true);
      await StorageService.saveSesion(updated);
      await StorageService.saveUsuario(updated);
      triggerFeedback(
        'success',
        'Huella Dactilar Vinculada',
        'Tu sensor biométrico quedó registrado para iniciar sesión con huella en este dispositivo.'
      );
    } else {
      const updated: Usuario = { ...user, biometricsEnabled: false };
      setUser(updated);
      setBiometricsActive(false);
      await StorageService.saveSesion(updated);
      await StorageService.saveUsuario(updated);
      triggerFeedback('info', 'Huella Desactivada', 'Se desvinculó el sensor biométrico para esta cuenta.');
    }
  };

  const confirmarCerrarSesion = async () => {
    setShowLogoutModal(false);
    await StorageService.clearSesion();
    onLogout();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Banner / Toast de Feedback Elegante */}
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

      {/* Header Perfil */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <TouchableOpacity style={styles.editBtn} onPress={() => setShowEditModal(true)}>
          <Ionicons name="create-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Tarjeta de Avatar y Datos Principales */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{
                uri:
                  user?.fotoPerfilUri ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
              }}
              style={styles.avatarImage}
            />
          </View>

          {/* Botones de Cámara y Galería Profesionales */}
          <View style={styles.photoActionsRow}>
            <TouchableOpacity style={styles.photoActionBtn} onPress={handleTomarFotoCamara}>
              <Ionicons name="camera" size={14} color="#0066FF" />
              <Text style={styles.photoActionText}>Cámara</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoActionBtn} onPress={handleSeleccionarGaleria}>
              <Ionicons name="images" size={14} color="#0066FF" />
              <Text style={styles.photoActionText}>Galería</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{user?.nombreCompleto || 'Edu Morales Carlos'}</Text>
          <Text style={styles.userRole}>
            {user?.rol || 'Asesor de Ventas'} • {user?.sede || 'Lima Norte / SMP (Sede Central)'}
          </Text>
          <Text style={styles.userEmail}>{user?.email || 'ventas@huriosrally.com'}</Text>
        </View>

        {/* Métricas y Estadísticas adaptadas según Rol */}
        <View style={styles.statsCard}>
          {user?.rol === 'Asesor' ? (
            <>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>18</Text>
                <Text style={styles.statLabel}>Cotizaciones</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>142</Text>
                <Text style={styles.statLabel}>Consultas OEM</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>98%</Text>
                <Text style={styles.statLabel}>Precisión Stock</Text>
              </View>
            </>
          ) : user?.rol === 'Almacenero' ? (
            <>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>64</Text>
                <Text style={styles.statLabel}>Despachos</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>Ingresos Guías</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>100%</Text>
                <Text style={styles.statLabel}>Kardex al Día</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>4</Text>
                <Text style={styles.statLabel}>Mis Pedidos</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>8</Text>
                <Text style={styles.statLabel}>Guardados</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>SMP</Text>
                <Text style={styles.statLabel}>Sede Preferida</Text>
              </View>
            </>
          )}
        </View>

        {/* Sección: Información de la Cuenta */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Información de la Cuenta</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="person-outline" size={18} color="#64748B" />
              <Text style={styles.infoLabel}>Usuario:</Text>
            </View>
            <Text style={styles.infoValue}>{user?.username || 'admin_rally'}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="call-outline" size={18} color="#64748B" />
              <Text style={styles.infoLabel}>Teléfono:</Text>
            </View>
            <Text style={styles.infoValue}>{user?.telefono || '+51 987 654 321'}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="business-outline" size={18} color="#64748B" />
              <Text style={styles.infoLabel}>Sede Operativa:</Text>
            </View>
            <Text style={styles.infoValue} numberOfLines={1}>
              {user?.sede || 'Lima Norte / SMP (Sede Central)'}
            </Text>
          </View>
        </View>

        {/* Sección: Ajustes de Seguridad y Biometría */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Ajustes y Seguridad</Text>

          {/* Opción 1: Actualizar Contraseña */}
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setShowSecurityModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.infoLeft}>
              <Ionicons name="lock-closed-outline" size={18} color="#0066FF" />
              <View>
                <Text style={styles.optionText}>Seguridad y Contraseña</Text>
                <Text style={styles.optionSub}>Cambiar contraseña actual por una nueva</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* Opción 2: Registro de Huella Dactilar */}
          <View style={styles.biometricSwitchRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="finger-print" size={22} color="#0066FF" />
              <View style={{ flex: 1 }}>
                <Text style={styles.optionText}>Acceso con Huella Dactilar</Text>
                <Text style={styles.optionSub}>
                  {biometricsActive
                    ? 'Huella registrada y activa para Login'
                    : 'Desactivado - Activa para vincular sensor biométrico'}
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

          {/* Opción 3: Ficha Institucional de la Empresa (Modal Elegante) */}
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setShowCompanyModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.infoLeft}>
              <Ionicons name="business" size={18} color="#EF4444" />
              <View>
                <Text style={styles.optionText}>Datos de la Empresa</Text>
                <Text style={styles.optionSub}>RUC, razón social y datos fiscales</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Botón de Cierre de Sesión */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => setShowLogoutModal(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <Text style={styles.versionTag}>Hurios Rally App v2.0.0 (Modo Local)</Text>
      </ScrollView>

      {/* ================= MODAL 1: EDITAR PERFIL (DROPDOWN DE SEDES) ================= */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Información</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {/* Indicador de Identidad Fija */}
            <View style={styles.fixedAccountBox}>
              <View style={styles.fixedAccountRow}>
                <Ionicons name="shield-checkmark" size={16} color="#0066FF" />
                <Text style={styles.fixedAccountUser}>@{user?.username || 'usuario'}</Text>
              </View>
              <Text style={styles.fixedAccountSub}>
                El nombre de usuario y correo son asignados por el sistema y no se pueden modificar.
              </Text>
            </View>

            <Text style={styles.modalFieldLabel}>Nombre Completo *</Text>
            <TextInput
              style={styles.modalInput}
              value={nombreEdit}
              onChangeText={setNombreEdit}
              placeholder="Nombre y Apellidos"
            />

            <Text style={styles.modalFieldLabel}>Teléfono de Contacto:</Text>
            <View style={styles.phoneInputRow}>
              <View style={styles.countryCodeBadge}>
                <Text style={styles.countryFlag}>🇵🇪</Text>
                <Text style={styles.countryCodeText}>+51</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                value={telefonoEdit}
                onChangeText={(t) => setTelefonoEdit(t.replace(/[^0-9]/g, '').slice(0, 9))}
                keyboardType="numeric"
                maxLength={9}
                placeholder="987 654 321"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <Text style={styles.modalFieldLabel}>Sede de Trabajo:</Text>
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

            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleGuardarPerfil}>
              <Text style={styles.modalSaveBtnText}>Guardar Cambios</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 2: SEGURIDAD Y ACTUALIZAR CONTRASEÑA ================= */}
      <Modal visible={showSecurityModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Seguridad de la Cuenta</Text>
                <Text style={styles.modalSubtitle}>Actualización de credenciales de acceso</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSecurityModal(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalFieldLabel}>Contraseña Actual *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ingresa tu contraseña actual"
              value={currentPass}
              onChangeText={setCurrentPass}
              secureTextEntry
            />

            <Text style={styles.modalFieldLabel}>Nueva Contraseña (mín. 6 caracteres) *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nueva contraseña"
              value={newPass}
              onChangeText={setNewPass}
              secureTextEntry
            />

            <Text style={styles.modalFieldLabel}>Confirmar Nueva Contraseña *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Repite la nueva contraseña"
              value={confirmPass}
              onChangeText={setConfirmPass}
              secureTextEntry
            />

            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleCambiarPassword}>
              <Text style={styles.modalSaveBtnText}>Actualizar Contraseña</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 3: FICHA DE LA EMPRESA (PROFESIONAL) ================= */}
      <Modal visible={showCompanyModal} animationType="fade" transparent>
        <View style={styles.modalBg}>
          <View style={styles.companyCard}>
            {/* Header Corporativo */}
            <View style={styles.companyHeader}>
              <View style={styles.companyBadge}>
                <Ionicons name="shield-checkmark" size={24} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.companyTitle}>HURIOS RALLY E.I.R.L.</Text>
                <Text style={styles.companyRuc}>RUC: 20608542191 • Estado: Activo</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCompanyModal(false)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Ficha Técnica de la Organización */}
            <ScrollView style={styles.companyBody}>
              <View style={styles.companyRow}>
                <Ionicons name="briefcase-outline" size={18} color="#0066FF" />
                <View style={styles.companyRowText}>
                  <Text style={styles.companyLabel}>Giro de Negocio:</Text>
                  <Text style={styles.companyValue}>
                    Importación, distribución minorista y comercialización de repuestos de alto rendimiento y competición.
                  </Text>
                </View>
              </View>

              <View style={styles.companyRow}>
                <Ionicons name="location-outline" size={18} color="#EF4444" />
                <View style={styles.companyRowText}>
                  <Text style={styles.companyLabel}>Sede Operativa Principal:</Text>
                  <Text style={styles.companyValue}>
                    Av. Perú 2450, San Martín de Porres, Lima Norte (Mostrador y Despacho).
                  </Text>
                </View>
              </View>

              <View style={styles.companyRow}>
                <Ionicons name="time-outline" size={18} color="#10B981" />
                <View style={styles.companyRowText}>
                  <Text style={styles.companyLabel}>Horario de Atención:</Text>
                  <Text style={styles.companyValue}>
                    Lunes a Sábado: 8:00 AM - 6:30 PM (Domingos cerrado por mantenimiento).
                  </Text>
                </View>
              </View>

              <View style={styles.companyRow}>
                <Ionicons name="call-outline" size={18} color="#F59E0B" />
                <View style={styles.companyRowText}>
                  <Text style={styles.companyLabel}>Canales Directos:</Text>
                  <Text style={styles.companyValue}>
                    📞 Central: (01) 534-8920{'\n'}📱 WhatsApp: +51 987 654 321{'\n'}✉ ventas@huriosrally.com
                  </Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.companyCloseBtn}
              onPress={() => setShowCompanyModal(false)}
            >
              <Text style={styles.companyCloseBtnText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 4: CONFIRMACIÓN DE CIERRE DE SESIÓN ================= */}
      <Modal visible={showLogoutModal} animationType="fade" transparent>
        <View style={styles.modalBg}>
          <View style={styles.logoutModalCard}>
            <View style={styles.logoutIconCircle}>
              <Ionicons name="log-out" size={32} color="#EF4444" />
            </View>

            <Text style={styles.logoutModalTitle}>¿Cerrar Sesión?</Text>
            <Text style={styles.logoutModalSub}>
              Se cerrará tu sesión activa en este dispositivo. Podrás volver a ingresar en cualquier momento con tus credenciales o tu huella dactilar.
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
                <Text style={styles.logoutConfirmText}>Sí, Salir</Text>
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
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
    fontSize: 11,
    marginTop: 18,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  fixedAccountBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 10,
  },
  fixedAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  fixedAccountUser: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0066FF',
  },
  fixedAccountSub: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
  },
  modalFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    marginTop: 8,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    height: 46,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
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
    paddingHorizontal: 10,
    gap: 5,
  },
  countryFlag: {
    fontSize: 16,
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
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  modalSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
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
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  companyCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  logoutModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
  },
  logoutIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  logoutModalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
  },
  logoutModalSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
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
    height: 48,
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
    height: 48,
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
