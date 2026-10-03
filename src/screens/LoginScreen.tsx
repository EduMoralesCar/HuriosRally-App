import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthService } from '../services/AuthService';
import { StorageService } from '../services/StorageService';

interface Props {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<Props> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('carlos_mendoza');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Modales de Autenticación Requeridos por el APF2
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showUpdatePassModal, setShowUpdatePassModal] = useState(false);

  // Estados Formulario de Registro de Usuario
  const [regNombre, setRegNombre] = useState('');
  const [regUser, setRegUser] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regRol, setRegRol] = useState<'Asesor' | 'Almacenero' | 'Cliente'>('Asesor');
  const [regTelefono, setRegTelefono] = useState('');
  const [regSede, setRegSede] = useState('Lima Norte / SMP (Sede Central)');
  const [showRegSedeDropdown, setShowRegSedeDropdown] = useState(false);

  // Estados Formulario de Recuperación en 3 Pasos
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1); // 1: Solicitar, 2: Código, 3: Nueva Clave
  const [forgotInput, setForgotInput] = useState('');
  const [forgotTargetEmail, setForgotTargetEmail] = useState('');
  const [forgotTargetUsername, setForgotTargetUsername] = useState('');
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [expectedFallbackCode, setExpectedFallbackCode] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);

  // Estados Formulario de Actualización de Contraseña
  const [updateUser, setUpdateUser] = useState('');
  const [updateCurrentPass, setUpdateCurrentPass] = useState('');
  const [updateNewPass, setUpdateNewPass] = useState('');

  // Diálogo / Feedback Modal Personalizado
  const [dialog, setDialog] = useState<{
    visible: boolean;
    titulo: string;
    mensaje: string;
    tipo: 'success' | 'error' | 'warning' | 'info';
    botonTexto?: string;
    onAceptar?: () => void;
  } | null>(null);

  // Modal para confirmar Autenticación Biométrica
  const [showBioModal, setShowBioModal] = useState(false);

  const mostrarMensaje = (
    titulo: string,
    mensaje: string,
    tipo: 'success' | 'error' | 'warning' | 'info' = 'info',
    onAceptar?: () => void
  ) => {
    setDialog({
      visible: true,
      titulo,
      mensaje,
      tipo,
      botonTexto: 'Entendido',
      onAceptar,
    });
  };

  useEffect(() => {
    verificarSesion();
  }, []);

  const verificarSesion = async () => {
    const sesion = await StorageService.getSesion();
    if (sesion && sesion.isAuthenticated) {
      onLoginSuccess();
    }
  };

  // 1. Login con credenciales y gestión de sesión (token en AsyncStorage)
  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      mostrarMensaje('Campos requeridos', 'Por favor ingresa tu usuario y contraseña.', 'warning');
      return;
    }

    setIsLoading(true);
    const result = await AuthService.login(username, password);
    setIsLoading(false);

    if (result.success) {
      onLoginSuccess();
    } else {
      mostrarMensaje(
        'Acceso no concedido',
        result.message || 'Credenciales incorrectas.\n\nPrueba con la cuenta demo:\nadmin_rally / 123456',
        'error'
      );
    }
  };

  // 2. Autenticación Biométrica (Huella / Face ID)
  const handleBiometricAuth = async () => {
    setShowBioModal(true);
  };

  const confirmarHuella = async () => {
    setShowBioModal(false);
    setIsLoading(true);
    const res = await AuthService.loginWithBiometrics();
    setIsLoading(false);
    if (res.success) {
      onLoginSuccess();
    } else {
      mostrarMensaje('Acceso Biométrico', res.message || 'No se pudo autenticar con biometría.', 'error');
    }
  };

  // Opciones de sedes oficiales
  const REG_SEDES = [
    { id: '1', nombre: 'Lima Norte / SMP (Sede Central)', direccion: 'Av. Perú 2450, San Martín de Porres' },
    { id: '2', nombre: 'Almacén Central / Despacho SMP', direccion: 'Jr. Huancayo 312, SMP' },
  ];

  // Generador automático de usuario y correo corporativo
  // Formato ordenado y claro: Primer Nombre + Apellido Paterno (ej. Juan Pérez Quispe -> juan_perez)
  // Correo: juan_perez.ventas@huriosrally.com
  const generarCredencialesAuto = (nombre: string, rol: 'Asesor' | 'Almacenero' | 'Cliente') => {
    const limpio = nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    if (!limpio) {
      setRegUser('');
      setRegEmail('');
      return;
    }

    const partes = limpio.split(/\s+/).filter(Boolean);
    const primerNombre = (partes[0] || 'usuario').replace(/[^a-z0-9]/g, '');
    const apellidoPaterno = (partes[1] || '').replace(/[^a-z0-9]/g, '');

    // Usuario ordenado: nombre_apellido (ej. juan_perez)
    const userGenerado = apellidoPaterno
      ? `${primerNombre}_${apellidoPaterno}`
      : primerNombre;

    // Correo corporativo con rol/área comercial
    const rolEmailSlug = rol === 'Asesor' ? 'ventas' : rol === 'Almacenero' ? 'almacen' : 'cliente';
    const emailGenerado = `${userGenerado}.${rolEmailSlug}@huriosrally.com`;

    setRegUser(userGenerado);
    setRegEmail(emailGenerado);
  };

  const handleNombreChange = (texto: string) => {
    setRegNombre(texto);
    generarCredencialesAuto(texto, regRol);
  };

  const handleRolChange = (nuevoRol: 'Asesor' | 'Almacenero' | 'Cliente') => {
    setRegRol(nuevoRol);
    generarCredencialesAuto(regNombre, nuevoRol);
  };

  // 3. Registro de usuario para todo tipo de usuarios
  const handleRegister = async () => {
    if (!regNombre.trim() || !regPass.trim()) {
      mostrarMensaje('Validación', 'Por favor ingresa tu nombre completo y contraseña.', 'warning');
      return;
    }

    if (!regUser.trim() || !regEmail.trim()) {
      mostrarMensaje('Validación', 'Ingresa tu nombre para autogenerar tu usuario y correo.', 'warning');
      return;
    }

    if (regPass.length < 6) {
      mostrarMensaje('Seguridad', 'La contraseña debe tener al menos 6 caracteres.', 'warning');
      return;
    }

    const telefonoCompleto = regTelefono.trim()
      ? `+51 ${regTelefono.trim()}`
      : '+51 987 654 321';

    const res = await AuthService.register({
      nombreCompleto: regNombre,
      username: regUser,
      email: regEmail,
      password: regPass,
      rol: regRol,
      telefono: telefonoCompleto,
      sede: regSede,
    });

    if (res.success) {
      setUsername(regUser);
      setPassword(regPass);
      setShowRegisterModal(false);
      setRegNombre('');
      setRegUser('');
      setRegEmail('');
      setRegPass('');
      setRegTelefono('');
      setShowRegSedeDropdown(false);
      mostrarMensaje(
        'Registro Exitoso',
        `Usuario corporativo creado automáticamente:\n\n👤 Usuario: ${regUser}\n✉ Correo: ${regEmail}\n🏢 Sede: ${regSede}\n💼 Rol: ${regRol}\n\nYa puedes iniciar sesión con tus credenciales.`,
        'success'
      );
    } else {
      mostrarMensaje('Error de Registro', res.message || 'No se pudo crear la cuenta.', 'error');
    }
  };

  // 4. Recuperación de contraseña: Flujo 3 Pasos
  // Paso 1: Enviar código al correo (vía servidor SMTP Gmail)
  const handleSolicitarCodigo = async () => {
    const emailLimpio = forgotInput.trim().toLowerCase();
    if (!emailLimpio) {
      mostrarMensaje('Validación', 'Ingresa tu correo electrónico registrado.', 'warning');
      return;
    }

    if (!emailLimpio.includes('@') || !emailLimpio.includes('.')) {
      mostrarMensaje('Correo inválido', 'Por favor ingresa un correo electrónico válido.', 'warning');
      return;
    }

    setIsSendingCode(true);
    const res = await AuthService.sendVerificationCode(emailLimpio);
    setIsSendingCode(false);

    if (res.success && res.email) {
      setForgotTargetEmail(res.email);
      setForgotTargetUsername(res.username || '');
      setExpectedFallbackCode(res.fallbackCode || '');
      setForgotStep(2);
      mostrarMensaje(
        'Código Enviado',
        `Se ha enviado un código de seguridad de 6 dígitos a:\n${res.email}\n\nRevisa tu bandeja de entrada o spam.`,
        'success'
      );
    } else {
      mostrarMensaje('Correo no registrado', res.message, 'error');
    }
  };

  // Paso 2: Verificar el código de 6 dígitos
  const handleVerificarCodigo = async () => {
    if (!verificationCodeInput.trim() || verificationCodeInput.trim().length !== 6) {
      mostrarMensaje('Código Inválido', 'Por favor ingresa los 6 dígitos del código de verificación.', 'warning');
      return;
    }

    setIsSendingCode(true);
    const res = await AuthService.verifyCode(
      forgotTargetEmail,
      verificationCodeInput,
      expectedFallbackCode
    );
    setIsSendingCode(false);

    if (res.success) {
      setForgotStep(3);
    } else {
      mostrarMensaje('Verificación Fallida', res.message, 'error');
    }
  };

  // Paso 3: Guardar la nueva contraseña
  const handleGuardarNuevaPassword = async () => {
    if (!newResetPassword.trim() || !confirmResetPassword.trim()) {
      mostrarMensaje('Campos requeridos', 'Por favor ingresa y confirma tu nueva contraseña.', 'warning');
      return;
    }

    if (newResetPassword.length < 6) {
      mostrarMensaje('Seguridad', 'La contraseña debe contener al menos 6 caracteres.', 'warning');
      return;
    }

    if (newResetPassword !== confirmResetPassword) {
      mostrarMensaje('Contraseña no coincide', 'Las contraseñas ingresadas no son iguales. Verifica e intenta nuevamente.', 'error');
      return;
    }

    setIsSendingCode(true);
    const res = await AuthService.resetPasswordWithVerifiedCode(forgotTargetEmail, newResetPassword);
    setIsSendingCode(false);

    if (res.success) {
      setShowForgotModal(false);
      // Precargar los datos en el login para facilitar el acceso
      if (forgotTargetUsername) {
        setUsername(forgotTargetUsername);
      }
      setPassword(newResetPassword);
      // Resetear estados
      setForgotStep(1);
      setForgotInput('');
      setVerificationCodeInput('');
      setNewResetPassword('');
      setConfirmResetPassword('');

      mostrarMensaje(
        '¡Acceso Restablecido!',
        'Tu contraseña ha sido actualizada con éxito.\nPuedes ingresar ahora al sistema Hurios Rally.',
        'success'
      );
    } else {
      mostrarMensaje('Error', res.message, 'error');
    }
  };

  const handleCerrarModalRecuperacion = () => {
    setShowForgotModal(false);
    setForgotStep(1);
    setVerificationCodeInput('');
    setNewResetPassword('');
    setConfirmResetPassword('');
  };

  // 5. Actualización de contraseña
  const handleUpdatePassword = async () => {
    if (!updateUser.trim() || !updateCurrentPass.trim() || !updateNewPass.trim()) {
      mostrarMensaje('Validación', 'Por favor completa todos los campos solicitados.', 'warning');
      return;
    }

    const usuarios = await StorageService.getUsuarios();
    const target = usuarios.find(
      (u) => u.username.toLowerCase() === updateUser.trim().toLowerCase()
    );

    if (!target) {
      mostrarMensaje('Usuario no encontrado', 'No existe el usuario indicado en el sistema.', 'error');
      return;
    }

    const res = await AuthService.updatePassword(target.id, updateCurrentPass, updateNewPass);
    if (res.success) {
      setShowUpdatePassModal(false);
      setUsername(updateUser);
      setPassword(updateNewPass);
      setUpdateUser('');
      setUpdateCurrentPass('');
      setUpdateNewPass('');
      mostrarMensaje('Contraseña Actualizada', 'Tu contraseña ha sido modificada con éxito. Ya puedes ingresar.', 'success');
    } else {
      mostrarMensaje('Error', res.message || 'No se pudo actualizar la contraseña.', 'error');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Mitad Superior: Fondo con Auto Deportivo y Logo Hurios Rally (Figura A1) */}
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=900&q=80',
        }}
        style={styles.heroBackground}
        resizeMode="cover"
      >
        <View style={styles.heroOverlay}>
          <View style={styles.brandBlock}>
            {/* Bandera a cuadros estilo Rally */}
            <View style={styles.rallyFlag}>
              <View style={styles.flagRow}>
                <View style={[styles.flagTile, { backgroundColor: '#E11D48' }]} />
                <View style={[styles.flagTile, { backgroundColor: '#E11D48' }]} />
                <View style={[styles.flagTile, { backgroundColor: '#FFFFFF' }]} />
                <View style={[styles.flagTile, { backgroundColor: '#FFFFFF' }]} />
              </View>
              <View style={styles.flagRow}>
                <View style={[styles.flagTile, { backgroundColor: '#E11D48' }]} />
                <View style={[styles.flagTile, { backgroundColor: '#E11D48' }]} />
                <View style={[styles.flagTile, { backgroundColor: '#1E293B' }]} />
                <View style={[styles.flagTile, { backgroundColor: '#1E293B' }]} />
              </View>
            </View>

            {/* Tipografía Oficial Hurios Rally */}
            <Text style={styles.brandHurios}>HURIOS</Text>
            <Text style={styles.brandRally}>RALLY</Text>
            <Text style={styles.brandCategory}>REPUESTOS AUTOMOTRICES</Text>

            {/* Línea roja decorativa y eslogan */}
            <View style={styles.redDivider} />
            <Text style={styles.sloganLine}>Tu aliado en</Text>
            <Text style={styles.sloganLine}>cada recorrido</Text>
          </View>
        </View>
      </ImageBackground>

      {/* Mitad Inferior: Tarjeta Flotante Blanca según Propuesta Exacta */}
      <View style={styles.cardContainer}>
        <Text style={styles.title}>Iniciar sesión</Text>
        <Text style={styles.subtitle}>Ingresa tus credenciales para continuar</Text>

        {/* Input Usuario */}
        <View style={styles.inputWrapper}>
          <Ionicons
            name="person-outline"
            size={20}
            color="#64748B"
            style={styles.leftIcon}
          />
          <TextInput
            style={styles.textInput}
            placeholder="Usuario"
            placeholderTextColor="#94A3B8"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>

        {/* Input Contraseña con Ojo */}
        <View style={styles.inputWrapper}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color="#64748B"
            style={styles.leftIcon}
          />
          <TextInput
            style={styles.textInput}
            placeholder="Contraseña"
            placeholderTextColor="#94A3B8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.rightIconButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#64748B"
            />
          </TouchableOpacity>
        </View>

        {/* Botón Ingresar -> */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={styles.buttonContent}>
              <Text style={styles.buttonText}>Ingresar</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </View>
          )}
        </TouchableOpacity>

        {/* Fila: Recordar Sesión + Biometría */}
        <View style={styles.optionsRow}>
          <TouchableOpacity
            style={styles.rememberRow}
            onPress={() => setRememberSession(!rememberSession)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, rememberSession && styles.checkboxActive]}>
              {rememberSession && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </View>
            <Text style={styles.rememberText}>Recordar sesión</Text>
          </TouchableOpacity>

          {/* Botón Biometría */}
          <TouchableOpacity
            style={styles.biometricBtn}
            onPress={handleBiometricAuth}
            activeOpacity={0.7}
          >
            <Ionicons name="finger-print" size={22} color="#0066FF" />
            <Text style={styles.biometricText}>Huella</Text>
          </TouchableOpacity>
        </View>

        {/* Selector Rápido de Cuentas por Rol (Cliente, Asesor, Almacenero) */}
        <View style={styles.quickAccountsBox}>
          <Text style={styles.quickAccountsTitle}>CUENTAS DISPONIBLES POR ROL</Text>
          <View style={styles.quickAccountsRow}>
            {/* 1. Cliente */}
            <TouchableOpacity
              style={[
                styles.quickAccountBtn,
                username === 'carlos_mendoza' && styles.quickAccountBtnActive,
              ]}
              onPress={() => {
                setUsername('carlos_mendoza');
                setPassword('123456');
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="person"
                size={16}
                color={username === 'carlos_mendoza' ? '#FFFFFF' : '#0066FF'}
              />
              <Text
                style={[
                  styles.quickAccountText,
                  username === 'carlos_mendoza' && styles.quickAccountTextActive,
                ]}
              >
                1. Cliente
              </Text>
            </TouchableOpacity>

            {/* 2. Asesor */}
            <TouchableOpacity
              style={[
                styles.quickAccountBtn,
                username === 'edu_morales' && styles.quickAccountBtnActive,
              ]}
              onPress={() => {
                setUsername('edu_morales');
                setPassword('123456');
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="briefcase"
                size={16}
                color={username === 'edu_morales' ? '#FFFFFF' : '#EF4444'}
              />
              <Text
                style={[
                  styles.quickAccountText,
                  username === 'edu_morales' && styles.quickAccountTextActive,
                ]}
              >
                2. Asesor
              </Text>
            </TouchableOpacity>

            {/* 3. Almacenero */}
            <TouchableOpacity
              style={[
                styles.quickAccountBtn,
                username === 'raul_quispe' && styles.quickAccountBtnActive,
              ]}
              onPress={() => {
                setUsername('raul_quispe');
                setPassword('123456');
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="cube"
                size={16}
                color={username === 'raul_quispe' ? '#FFFFFF' : '#059669'}
              />
              <Text
                style={[
                  styles.quickAccountText,
                  username === 'raul_quispe' && styles.quickAccountTextActive,
                ]}
              >
                3. Almacén
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Enlaces de Acción del Módulo de Autenticación */}
        <View style={styles.authLinksGroup}>
          <View style={styles.subLinksRow}>
            <TouchableOpacity onPress={() => setShowForgotModal(true)}>
              <Text style={styles.linkMinor}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
            <Text style={styles.linkDot}>•</Text>
            <TouchableOpacity onPress={() => setShowUpdatePassModal(true)}>
              <Text style={styles.linkMinor}>Cambiar clave</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.registerRow}>
            <Text style={styles.registerPrompt}>¿No tienes una cuenta? </Text>
            <TouchableOpacity onPress={() => setShowRegisterModal(true)}>
              <Text style={styles.registerAction}>Regístrate aquí</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ================= MODAL 1: REGISTRO DE USUARIO ================= */}
      <Modal visible={showRegisterModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Registro de Usuario</Text>
                <Text style={styles.modalSubtitle}>Acceso al sistema Hurios Rally</Text>
              </View>
              <TouchableOpacity onPress={() => setShowRegisterModal(false)}>
                <Ionicons name="close-circle" size={26} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Nombre Completo *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ej. Juan Pérez"
                value={regNombre}
                onChangeText={handleNombreChange}
              />

              <Text style={styles.fieldLabel}>Teléfono de Contacto</Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.countryCodeBadge}>
                  <Text style={styles.countryFlag}>🇵🇪</Text>
                  <Text style={styles.countryCodeText}>+51</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="987 654 321"
                  placeholderTextColor="#94A3B8"
                  value={regTelefono}
                  onChangeText={(t) => setRegTelefono(t.replace(/[^0-9]/g, '').slice(0, 9))}
                  keyboardType="numeric"
                  maxLength={9}
                />
              </View>

              <Text style={styles.fieldLabel}>Rol en el Sistema *</Text>
              <View style={styles.roleSelector}>
                {(['Asesor', 'Almacenero', 'Cliente'] as const).map((rol) => (
                  <TouchableOpacity
                    key={rol}
                    style={[styles.roleChip, regRol === rol && styles.roleChipActive]}
                    onPress={() => handleRolChange(rol)}
                  >
                    <Text style={[styles.roleChipText, regRol === rol && styles.roleChipTextActive]}>
                      {rol}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Sede de Trabajo *</Text>
              <TouchableOpacity
                style={styles.regDropdownBtn}
                onPress={() => setShowRegSedeDropdown(!showRegSedeDropdown)}
                activeOpacity={0.8}
              >
                <View style={styles.regDropdownLeft}>
                  <Ionicons name="business-outline" size={17} color="#0066FF" />
                  <Text style={styles.regDropdownCurrentText} numberOfLines={1}>{regSede}</Text>
                </View>
                <Ionicons
                  name={showRegSedeDropdown ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#64748B"
                />
              </TouchableOpacity>

              {showRegSedeDropdown && (
                <View style={styles.regDropdownList}>
                  {REG_SEDES.map((sede) => (
                    <TouchableOpacity
                      key={sede.id}
                      style={[
                        styles.regDropdownOption,
                        regSede === sede.nombre && styles.regDropdownOptionActive,
                      ]}
                      onPress={() => {
                        setRegSede(sede.nombre);
                        setShowRegSedeDropdown(false);
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.regDropdownOptionText,
                            regSede === sede.nombre && styles.regDropdownOptionTextActive,
                          ]}
                        >
                          {sede.nombre}
                        </Text>
                        <Text style={styles.regDropdownSubtext}>{sede.direccion}</Text>
                      </View>
                      {regSede === sede.nombre && (
                        <Ionicons name="checkmark-circle" size={18} color="#0066FF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Tarjeta de Credenciales Autogeneradas por el Sistema */}
              <View style={styles.autoCredsCard}>
                <View style={styles.autoCredsHeader}>
                  <Ionicons name="sparkles" size={16} color="#0066FF" />
                  <Text style={styles.autoCredsTitle}>Credenciales Autogeneradas</Text>
                </View>

                <View style={styles.autoCredRow}>
                  <Text style={styles.autoCredLabel}>Usuario:</Text>
                  <Text style={styles.autoCredValue}>
                    {regUser || '(Se genera con tu nombre y rol)'}
                  </Text>
                </View>

                <View style={styles.autoCredRow}>
                  <Text style={styles.autoCredLabel}>Correo:</Text>
                  <Text style={styles.autoCredValue}>
                    {regEmail || '(Se genera con tu nombre)'}
                  </Text>
                </View>
              </View>

              <Text style={styles.fieldLabel}>Contraseña (mín. 6 caracteres) *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="••••••••"
                value={regPass}
                onChangeText={setRegPass}
                secureTextEntry
              />

              <TouchableOpacity style={styles.modalPrimaryBtn} onPress={handleRegister}>
                <Text style={styles.modalPrimaryBtnText}>Crear Cuenta y Guardar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 2: RECUPERACIÓN DE CONTRASEÑA EN 3 PASOS ================= */}
      <Modal visible={showForgotModal} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Recuperar Contraseña</Text>
                <Text style={styles.modalSubtitle}>Hurios Rally • Seguridad</Text>
              </View>
              <TouchableOpacity onPress={handleCerrarModalRecuperacion}>
                <Ionicons name="close-circle" size={26} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Barra de Progreso de Pasos (1 - 2 - 3) */}
            <View style={styles.stepsBar}>
              <View style={[styles.stepDot, forgotStep >= 1 && styles.stepDotActive]}>
                <Text style={[styles.stepDotText, forgotStep >= 1 && styles.stepDotTextActive]}>1</Text>
              </View>
              <View style={[styles.stepLine, forgotStep >= 2 && styles.stepLineActive]} />
              <View style={[styles.stepDot, forgotStep >= 2 && styles.stepDotActive]}>
                <Text style={[styles.stepDotText, forgotStep >= 2 && styles.stepDotTextActive]}>2</Text>
              </View>
              <View style={[styles.stepLine, forgotStep >= 3 && styles.stepLineActive]} />
              <View style={[styles.stepDot, forgotStep >= 3 && styles.stepDotActive]}>
                <Text style={[styles.stepDotText, forgotStep >= 3 && styles.stepDotTextActive]}>3</Text>
              </View>
            </View>

            <View style={styles.stepLabelsRow}>
              <Text style={[styles.stepLabel, forgotStep === 1 && styles.stepLabelActive]}>Correo</Text>
              <Text style={[styles.stepLabel, forgotStep === 2 && styles.stepLabelActive]}>Código</Text>
              <Text style={[styles.stepLabel, forgotStep === 3 && styles.stepLabelActive]}>Nueva Clave</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
              {/* PASO 1: Ingreso de Correo Electrónico */}
              {forgotStep === 1 && (
                <View>
                  <Text style={styles.modalHelperText}>
                    Ingresa el correo electrónico asociado a tu cuenta. Te enviaremos un código de seguridad de 6 dígitos para validar tu identidad.
                  </Text>

                  <Text style={styles.fieldLabel}>Correo Electrónico *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="ejemplo@correo.com"
                    value={forgotInput}
                    onChangeText={setForgotInput}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />

                  <TouchableOpacity
                    style={[styles.modalPrimaryBtn, isSendingCode && { opacity: 0.7 }]}
                    onPress={handleSolicitarCodigo}
                    disabled={isSendingCode}
                  >
                    {isSendingCode ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="mail" size={18} color="#FFFFFF" />
                        <Text style={styles.modalPrimaryBtnText}>Enviar Código de Verificación</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* PASO 2: Ingresar Código de Verificación recibido por correo */}
              {forgotStep === 2 && (
                <View>
                  <View style={styles.emailNoticeBox}>
                    <Ionicons name="mail-open" size={24} color="#0066FF" />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.emailNoticeTitle}>Código enviado a:</Text>
                      <Text style={styles.emailNoticeTarget}>{forgotTargetEmail}</Text>
                    </View>
                  </View>

                  <Text style={styles.modalHelperText}>
                    Ingresa los 6 dígitos del código recibido en tu correo electrónico. Es válido por 10 minutos.
                  </Text>

                  <Text style={styles.fieldLabel}>Código de 6 Dígitos *</Text>
                  <TextInput
                    style={[styles.modalInput, styles.codeInput]}
                    placeholder="• • • • • •"
                    value={verificationCodeInput}
                    onChangeText={(val) => setVerificationCodeInput(val.replace(/[^0-9]/g, '').slice(0, 6))}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />

                  <TouchableOpacity
                    style={[styles.modalPrimaryBtn, isSendingCode && { opacity: 0.7 }]}
                    onPress={handleVerificarCodigo}
                    disabled={isSendingCode}
                  >
                    {isSendingCode ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
                        <Text style={styles.modalPrimaryBtnText}>Verificar Código</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.resendCodeBtn}
                    onPress={handleSolicitarCodigo}
                    disabled={isSendingCode}
                  >
                    <Text style={styles.resendCodeText}>¿No recibiste el código? Reenviar</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* PASO 3: Definir la Nueva Contraseña */}
              {forgotStep === 3 && (
                <View>
                  <View style={styles.successVerifiedBox}>
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                    <Text style={styles.successVerifiedText}>¡Identidad verificada exitosamente!</Text>
                  </View>

                  <Text style={styles.modalHelperText}>
                    Crea una nueva contraseña segura para tu cuenta de Hurios Rally.
                  </Text>

                  <Text style={styles.fieldLabel}>Nueva Contraseña (mín. 6 caracteres) *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="••••••••"
                    value={newResetPassword}
                    onChangeText={setNewResetPassword}
                    secureTextEntry
                  />

                  <Text style={styles.fieldLabel}>Confirmar Nueva Contraseña *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="••••••••"
                    value={confirmResetPassword}
                    onChangeText={setConfirmResetPassword}
                    secureTextEntry
                  />

                  <TouchableOpacity
                    style={[styles.modalPrimaryBtn, isSendingCode && { opacity: 0.7 }]}
                    onPress={handleGuardarNuevaPassword}
                    disabled={isSendingCode}
                  >
                    {isSendingCode ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="lock-closed" size={18} color="#FFFFFF" />
                        <Text style={styles.modalPrimaryBtnText}>Guardar Nueva Contraseña</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 3: ACTUALIZACIÓN DE CONTRASEÑA ================= */}
      <Modal visible={showUpdatePassModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Actualizar Contraseña</Text>
                <Text style={styles.modalSubtitle}>Seguridad de la cuenta</Text>
              </View>
              <TouchableOpacity onPress={() => setShowUpdatePassModal(false)}>
                <Ionicons name="close-circle" size={26} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Nombre de Usuario *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="admin_rally"
              value={updateUser}
              onChangeText={setUpdateUser}
              autoCapitalize="none"
            />

            <Text style={styles.fieldLabel}>Contraseña Actual *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="••••••••"
              value={updateCurrentPass}
              onChangeText={setUpdateCurrentPass}
              secureTextEntry
            />

            <Text style={styles.fieldLabel}>Nueva Contraseña (mín. 6 caracteres) *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="••••••••"
              value={updateNewPass}
              onChangeText={setUpdateNewPass}
              secureTextEntry
            />

            <TouchableOpacity style={styles.modalPrimaryBtn} onPress={handleUpdatePassword}>
              <Text style={styles.modalPrimaryBtnText}>Guardar Nueva Contraseña</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL BIOMÉTRICO ELEGANTE ================= */}
      <Modal visible={showBioModal} animationType="fade" transparent>
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogCard}>
            <View style={[styles.dialogIconBadge, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="finger-print" size={38} color="#0066FF" />
            </View>
            <Text style={styles.dialogTitle}>Autenticación Biométrica</Text>
            <Text style={styles.dialogMessage}>
              Coloca tu dedo en el sensor biométrico del dispositivo para ingresar al sistema Hurios Rally.
            </Text>

            <View style={styles.dialogButtonsRow}>
              <TouchableOpacity
                style={styles.dialogBtnCancel}
                onPress={() => setShowBioModal(false)}
              >
                <Text style={styles.dialogBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogBtnPrimary}
                onPress={confirmarHuella}
              >
                <Text style={styles.dialogBtnPrimaryText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL DE FEEDBACK / DIÁLOGO PROFESIONAL ================= */}
      <Modal visible={!!dialog} animationType="fade" transparent>
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogCard}>
            <View
              style={[
                styles.dialogIconBadge,
                dialog?.tipo === 'success'
                  ? { backgroundColor: '#ECFDF5' }
                  : dialog?.tipo === 'error'
                  ? { backgroundColor: '#FEF2F2' }
                  : dialog?.tipo === 'warning'
                  ? { backgroundColor: '#FFFBEB' }
                  : { backgroundColor: '#EFF6FF' },
              ]}
            >
              <Ionicons
                name={
                  dialog?.tipo === 'success'
                    ? 'checkmark-circle'
                    : dialog?.tipo === 'error'
                    ? 'alert-circle'
                    : dialog?.tipo === 'warning'
                    ? 'warning'
                    : 'information-circle'
                }
                size={34}
                color={
                  dialog?.tipo === 'success'
                    ? '#10B981'
                    : dialog?.tipo === 'error'
                    ? '#EF4444'
                    : dialog?.tipo === 'warning'
                    ? '#F59E0B'
                    : '#0066FF'
                }
              />
            </View>
            <Text style={styles.dialogTitle}>{dialog?.titulo}</Text>
            <Text style={styles.dialogMessage}>{dialog?.mensaje}</Text>

            <TouchableOpacity
              style={[
                styles.dialogBtnSingle,
                dialog?.tipo === 'error' && { backgroundColor: '#EF4444' },
                dialog?.tipo === 'warning' && { backgroundColor: '#F59E0B' },
              ]}
              onPress={() => {
                const action = dialog?.onAceptar;
                setDialog(null);
                if (action) action();
              }}
            >
              <Text style={styles.dialogBtnSingleText}>{dialog?.botonTexto || 'Entendido'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  heroBackground: {
    flex: 1.1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5, 10, 20, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  brandBlock: {
    alignItems: 'flex-start',
  },
  rallyFlag: {
    marginBottom: 8,
    transform: [{ skewX: '-18deg' }],
  },
  flagRow: {
    flexDirection: 'row',
  },
  flagTile: {
    width: 14,
    height: 9,
    margin: 0.8,
    borderRadius: 1,
  },
  brandHurios: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
    lineHeight: 34,
  },
  brandRally: {
    color: '#EF4444',
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 4,
    marginTop: -2,
  },
  brandCategory: {
    color: '#CBD5E1',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.8,
    marginTop: 4,
    marginBottom: 16,
  },
  redDivider: {
    width: 38,
    height: 3.5,
    backgroundColor: '#EF4444',
    borderRadius: 2,
    marginBottom: 12,
  },
  sloganLine: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  cardContainer: {
    flex: 1.35,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 20,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  leftIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
  },
  rightIconButton: {
    padding: 6,
  },
  loginButton: {
    backgroundColor: '#0066FF',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 14,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    marginBottom: 16,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  rememberText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 4,
  },
  biometricText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0066FF',
  },
  authLinksGroup: {
    alignItems: 'center',
    gap: 8,
  },
  subLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  linkMinor: {
    fontSize: 12.5,
    color: '#0066FF',
    fontWeight: '600',
  },
  linkDot: {
    color: '#CBD5E1',
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  registerPrompt: {
    fontSize: 13,
    color: '#64748B',
  },
  registerAction: {
    fontSize: 13,
    color: '#0066FF',
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalHelperText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 5,
    marginTop: 6,
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
    marginBottom: 6,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
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
  roleSelector: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 6,
  },
  roleChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roleChipActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  roleChipTextActive: {
    color: '#FFFFFF',
  },
  regDropdownBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    borderRadius: 10,
    height: 46,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  regDropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  regDropdownCurrentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369A1',
  },
  regDropdownList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    overflow: 'hidden',
  },
  regDropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  regDropdownOptionActive: {
    backgroundColor: '#F0F9FF',
  },
  regDropdownOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  regDropdownOptionTextActive: {
    color: '#0066FF',
  },
  regDropdownSubtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  autoCredsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 10,
  },
  autoCredsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 6,
  },
  autoCredsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  autoCredRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  autoCredLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  autoCredValue: {
    fontSize: 12.5,
    color: '#0066FF',
    fontWeight: '800',
  },
  modalPrimaryBtn: {
    backgroundColor: '#0066FF',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogCard: {
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
  dialogIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  dialogMessage: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  dialogButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  dialogBtnCancel: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogBtnCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  dialogBtnPrimary: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogBtnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dialogBtnSingle: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogBtnSingleText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
  // Estilos del Flujo de Recuperación en 3 Pasos
  stepsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 6,
    paddingHorizontal: 20,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: '#0066FF',
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  stepDotTextActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: '#0066FF',
  },
  stepLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
    width: 80,
  },
  stepLabelActive: {
    color: '#0066FF',
    fontWeight: '800',
  },
  emailNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 14,
  },
  emailNoticeTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E40AF',
  },
  emailNoticeTarget: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  codeInput: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 10,
    textAlign: 'center',
    color: '#0066FF',
    backgroundColor: '#F8FAFC',
    borderColor: '#93C5FD',
    height: 52,
  },
  resendCodeBtn: {
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 8,
  },
  resendCodeText: {
    fontSize: 12.5,
    color: '#0066FF',
    fontWeight: '700',
  },
  successVerifiedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 14,
    gap: 8,
  },
  successVerifiedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  quickAccountsBox: {
    marginTop: 10,
    marginBottom: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  quickAccountsTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  quickAccountsRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
  },
  quickAccountBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 7,
    gap: 4,
  },
  quickAccountBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  quickAccountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  quickAccountTextActive: {
    color: '#FFFFFF',
  },
});
