import { StorageService } from './StorageService';
import { Usuario } from '../types';

/**
 * Valida que la contraseña cumpla:
 * - Mínimo 8 caracteres
 * - Al menos 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial
 */
export const validateStrongPassword = (password: string): { valid: boolean; message?: string } => {
  if (!password || password.length < 8) {
    return { valid: false, message: 'La contraseña debe tener como mínimo 8 caracteres.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'La contraseña debe contener al menos una letra mayúscula (A-Z).' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'La contraseña debe contener al menos una letra minúscula (a-z).' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'La contraseña debe contener al menos un número (0-9).' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>_\-]/.test(password)) {
    return { valid: false, message: 'La contraseña debe contener al menos un carácter especial (@, $, #, _, -, etc.).' };
  }
  return { valid: true };
};

const SERVER_URLS = [
  'http://192.168.1.109:3000',
  'http://localhost:3000',
  'http://10.0.2.2:3000',
];

export const AuthService = {
  async login(usernameOrEmail: string, password: string): Promise<{ success: boolean; user?: Usuario; message?: string }> {
    const cleanUser = usernameOrEmail.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, message: 'Ingresa tu usuario o correo y tu contraseña.' };
    }

    const usuarios = await StorageService.getUsuarios();
    const usuario = usuarios.find(
      (u) => (u.username.toLowerCase() === cleanUser || u.email.toLowerCase() === cleanUser) && u.password === cleanPass
    );

    if (usuario) {
      await StorageService.saveSesion(usuario);
      return { success: true, user: usuario };
    }

    return {
      success: false,
      message: 'Usuario o contraseña incorrectos. Verifica tus datos e intenta nuevamente.',
    };
  },

  async loginWithBiometrics(): Promise<{ success: boolean; user?: Usuario; message?: string }> {
    const sesionPrevia = await StorageService.getSesion();
    const usuarios = await StorageService.getUsuarios();

    const userToAuth = sesionPrevia?.biometricsEnabled ? sesionPrevia : usuarios.find((u) => u.biometricsEnabled);

    if (userToAuth && userToAuth.biometricsEnabled) {
      await StorageService.saveSesion(userToAuth);
      return { success: true, user: userToAuth };
    }

    return {
      success: false,
      message: 'Aún no has vinculado tu huella dactilar. Inicia sesión con tu clave y actívala en Perfil > Ajustes y Seguridad.',
    };
  },

  async register(data: {
    username: string;
    email: string;
    nombreCompleto: string;
    password: string;
    rol?: 'Asesor' | 'Almacenero' | 'Cliente';
    telefono?: string;
    sede?: string;
  }): Promise<{ success: boolean; message?: string; user?: Usuario }> {
    const usuarios = await StorageService.getUsuarios();

    const exists = usuarios.some(
      (u) => u.username.toLowerCase() === data.username.toLowerCase() || u.email.toLowerCase() === data.email.toLowerCase()
    );

    if (exists) {
      return { success: false, message: 'El nombre de usuario o correo ya se encuentra registrado.' };
    }

    const passCheck = validateStrongPassword(data.password);
    if (!passCheck.valid) {
      return { success: false, message: passCheck.message };
    }

    const nuevoUsuario: Usuario = {
      id: `usr_${Date.now()}`,
      username: data.username.trim(),
      email: data.email.trim(),
      nombreCompleto: data.nombreCompleto.trim(),
      rol: data.rol || 'Asesor',
      telefono: data.telefono || '+51 900 000 000',
      sede: data.sede || 'Lima Norte / SMP (Sede Central)',
      password: data.password,
      fotoPerfilUri: '',
      isAuthenticated: false,
    };

    await StorageService.saveUsuario(nuevoUsuario);
    return { success: true, user: nuevoUsuario, message: 'Usuario registrado con éxito.' };
  },

  async sendVerificationCode(email: string): Promise<{
    success: boolean;
    message: string;
    email?: string;
    username?: string;
    fallbackCode?: string;
  }> {
    const usuarios = await StorageService.getUsuarios();
    const cleanEmail = email.trim().toLowerCase();

    const usuario = usuarios.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!usuario) {
      return {
        success: false,
        message: 'No existe ninguna cuenta registrada con este correo electrónico.',
      };
    }

    const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString();

    for (const baseUrl of SERVER_URLS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const response = await fetch(`${baseUrl}/api/auth/send-reset-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: usuario.email,
            username: usuario.nombreCompleto || usuario.username,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          return {
            success: true,
            message: `Código de verificación enviado a ${usuario.email}`,
            email: usuario.email,
            username: usuario.username,
            fallbackCode: data.code,
          };
        }
      } catch {
        // Siguiente intento o respaldo local
      }
    }

    await StorageService.saveTempResetCode(usuario.email, fallbackCode);

    return {
      success: true,
      message: `Código generado para ${usuario.email}`,
      email: usuario.email,
      username: usuario.username,
      fallbackCode,
    };
  },

  async verifyCode(email: string, code: string, expectedFallback?: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    for (const baseUrl of SERVER_URLS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const response = await fetch(`${baseUrl}/api/auth/verify-reset-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, code: cleanCode }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          return { success: true, message: 'Código verificado con éxito.' };
        }
        const errData = await response.json();
        return { success: false, message: errData.message || 'Código incorrecto.' };
      } catch {
        // Siguiente intento
      }
    }

    if (expectedFallback && expectedFallback === cleanCode) {
      return { success: true, message: 'Código verificado con éxito.' };
    }

    const localSaved = await StorageService.getTempResetCode(cleanEmail);
    if (localSaved && localSaved === cleanCode) {
      return { success: true, message: 'Código verificado con éxito.' };
    }

    return { success: false, message: 'El código de 6 dígitos no es correcto o ha expirado.' };
  },

  async resetPasswordWithVerifiedCode(email: string, newPass: string): Promise<{ success: boolean; message: string }> {
    const passCheck = validateStrongPassword(newPass);
    if (!passCheck.valid) {
      return { success: false, message: passCheck.message || 'Contraseña no válida.' };
    }

    const usuarios = await StorageService.getUsuarios();
    const cleanEmail = email.trim().toLowerCase();
    const usuario = usuarios.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!usuario) {
      return { success: false, message: 'Usuario no encontrado.' };
    }

    usuario.password = newPass;
    await StorageService.saveUsuario(usuario);

    return { success: true, message: 'Contraseña restablecida exitosamente.' };
  },

  async updatePassword(
    userId: string,
    currentPass: string,
    newPass: string
  ): Promise<{ success: boolean; message: string }> {
    const usuarios = await StorageService.getUsuarios();
    const usuario = usuarios.find((u) => u.id === userId);

    if (!usuario) {
      return { success: false, message: 'Usuario no encontrado.' };
    }

    if (usuario.password !== currentPass) {
      return { success: false, message: 'La contraseña actual no coincide.' };
    }

    const passCheck = validateStrongPassword(newPass);
    if (!passCheck.valid) {
      return { success: false, message: passCheck.message || 'Contraseña no válida.' };
    }

    usuario.password = newPass;
    await StorageService.saveUsuario(usuario);

    const sesion = await StorageService.getSesion();
    if (sesion && sesion.id === userId) {
      await StorageService.saveSesion(usuario);
    }

    return { success: true, message: 'Contraseña actualizada correctamente.' };
  },

  async logout(): Promise<void> {
    await StorageService.clearSesion();
  },

  async getCurrentUser(): Promise<Usuario | null> {
    return await StorageService.getSesion();
  },
};
