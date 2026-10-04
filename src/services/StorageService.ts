import AsyncStorage from '@react-native-async-storage/async-storage';
import { Repuesto, Usuario, PedidoLocal } from '../types';

const KEYS = {
  AUTH_USER: '@hurios_auth_user',
  AUTH_TOKEN: '@hurios_auth_token',
  USERS_DB: '@hurios_users_db',
  FAVORITOS: '@hurios_favoritos',
  PREORDEN: '@hurios_preorden',
  HISTORIAL_PEDIDOS: '@hurios_pedidos_historial',
  STOCK_OVERRIDES: '@hurios_stock_overrides',
};

// 3 Cuentas maestras predeterminadas (Exactamente 1 Cliente, 1 Asesor y 1 Almacenero)
const USUARIOS_SEMILLA: Usuario[] = [
  {
    id: 'usr_cliente_01',
    username: 'carlos_mendoza',
    email: 'carlos_mendoza.cliente@huriosrally.com',
    nombreCompleto: 'Carlos Mendoza Silva',
    rol: 'Cliente',
    telefono: '+51 987 111 222',
    sede: 'Lima Norte / SMP (Sede Central)',
    password: '123456',
    fotoPerfilUri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    isAuthenticated: false,
  },
  {
    id: 'usr_asesor_01',
    username: 'edu_morales',
    email: 'edu_morales.ventas@huriosrally.com',
    nombreCompleto: 'Edu Morales Carlos',
    rol: 'Asesor',
    telefono: '+51 987 654 321',
    sede: 'Lima Norte / SMP (Sede Central)',
    password: '123456',
    fotoPerfilUri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
    isAuthenticated: false,
  },
  {
    id: 'usr_almacen_01',
    username: 'raul_quispe',
    email: 'raul_quispe.almacen@huriosrally.com',
    nombreCompleto: 'Raúl Quispe Huamán',
    rol: 'Almacenero',
    telefono: '+51 987 333 444',
    sede: 'Almacén Central / Despacho SMP',
    password: '123456',
    fotoPerfilUri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
    isAuthenticated: false,
  },
];

export const StorageService = {
  async saveItem<T>(key: string, value: T): Promise<void> {
    try {
      const json = JSON.stringify(value);
      await AsyncStorage.setItem(key, json);
    } catch (e) {
      console.error('Error guardando en AsyncStorage', e);
    }
  },

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value != null ? JSON.parse(value) : null;
    } catch (e) {
      console.error('Error leyendo de AsyncStorage', e);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error('Error eliminando de AsyncStorage', e);
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.error('Error limpiando AsyncStorage', e);
    }
  },

  // ---------------- GESTIÓN DE SESIÓN Y TOKEN ----------------
  async getSesion(): Promise<Usuario | null> {
    return await this.getItem<Usuario>(KEYS.AUTH_USER);
  },

  async saveSesion(user: Usuario): Promise<void> {
    // Generar un token de sesión simulado seguro
    const token = `hr_token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const userWithToken = { ...user, token, isAuthenticated: true };
    await this.saveItem(KEYS.AUTH_USER, userWithToken);
    await AsyncStorage.setItem(KEYS.AUTH_TOKEN, token);
  },

  async clearSesion(): Promise<void> {
    await this.removeItem(KEYS.AUTH_USER);
    await this.removeItem(KEYS.AUTH_TOKEN);
  },

  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem(KEYS.AUTH_TOKEN);
  },

  // ---------------- BASE DE DATOS DE USUARIOS (OFFLINE) ----------------
  async getUsuarios(): Promise<Usuario[]> {
    const list = await this.getItem<Usuario[]>(KEYS.USERS_DB);
    if (!list || list.length === 0) {
      // Inicializar con los 3 usuarios maestros de Hurios Rally
      await this.saveItem(KEYS.USERS_DB, USUARIOS_SEMILLA);
      return USUARIOS_SEMILLA;
    }

    // Asegurar que las 3 cuentas maestras siempre existan con su contraseña y rol oficial
    let updated = false;
    const currentList = [...list];
    USUARIOS_SEMILLA.forEach((semilla) => {
      const idx = currentList.findIndex((u) => u.username.toLowerCase() === semilla.username.toLowerCase());
      if (idx === -1) {
        currentList.push(semilla);
        updated = true;
      } else {
        // Sincronizar contraseña y rol oficial
        if (currentList[idx].password !== semilla.password || currentList[idx].rol !== semilla.rol) {
          currentList[idx] = {
            ...currentList[idx],
            password: semilla.password,
            rol: semilla.rol,
            email: semilla.email,
            nombreCompleto: semilla.nombreCompleto,
          };
          updated = true;
        }
      }
    });

    if (updated) {
      await this.saveItem(KEYS.USERS_DB, currentList);
    }

    return currentList;
  },

  async saveUsuario(nuevoUsuario: Usuario): Promise<void> {
    const usuarios = await this.getUsuarios();
    const index = usuarios.findIndex((u) => u.id === nuevoUsuario.id || u.username === nuevoUsuario.username);
    if (index >= 0) {
      usuarios[index] = nuevoUsuario;
    } else {
      usuarios.push(nuevoUsuario);
    }
    await this.saveItem(KEYS.USERS_DB, usuarios);
  },

  // ---------------- FAVORITOS Y PRE-ORDEN ----------------
  async getFavoritos(): Promise<Repuesto[]> {
    const list = await this.getItem<Repuesto[]>(KEYS.FAVORITOS);
    return list || [];
  },

  async saveFavoritos(favoritos: Repuesto[]): Promise<void> {
    await this.saveItem(KEYS.FAVORITOS, favoritos);
  },

  async getPreOrden(): Promise<PedidoLocal | null> {
    return await this.getItem<PedidoLocal>(KEYS.PREORDEN);
  },

  async savePreOrden(pedido: PedidoLocal): Promise<void> {
    await this.saveItem(KEYS.PREORDEN, pedido);
  },

  async getHistorialPedidos(): Promise<PedidoLocal[]> {
    const list = await this.getItem<PedidoLocal[]>(KEYS.HISTORIAL_PEDIDOS);
    if (!list || list.length === 0) {
      const demoPedidos: PedidoLocal[] = [
        {
          id: 'PED-4821',
          fechaCreacion: '23/09/2026',
          clienteNombre: 'Carlos Mendoza Silva',
          subtotal: 470.00,
          igv: 84.60,
          totalCotizado: 554.60,
          estado: 'Pagado',
          metodoPago: 'Yape / Plin',
          comprobanteTipo: 'Boleta Electrónica',
          documentoNumero: '72819201',
          items: [
            {
              repuesto: {
                id: 'f1',
                codigoOEM: '04465-0K200',
                nombre: 'Pastillas de Freno Delanteras',
                categoria: 'Frenos',
                precio: 180.00,
                stock: 15,
                compatibilidad: 'Toyota Hilux 2016 - 2023',
                descripcion: 'Pastillas de freno semimetálicas.',
                imagenUri: 'https://http2.mlstatic.com/D_NQ_NP_939433-MCO72508186952_102023-O.webp',
              },
              cantidad: 1,
            },
            {
              repuesto: {
                id: 'f2',
                codigoOEM: '43512-0K090',
                nombre: 'Disco de Freno Ventilado Delantero',
                categoria: 'Frenos',
                precio: 290.00,
                stock: 8,
                compatibilidad: 'Toyota Hilux 4x4',
                descripcion: 'Disco ventilado con aleación de carbono.',
                imagenUri: 'https://refaccionariamario.info/73958-tm_thickbox_default/disco-de-freno-ventilado-delantero-fritec-para-spark-14.jpg',
              },
              cantidad: 1,
            },
          ],
        },
        {
          id: 'PED-3904',
          fechaCreacion: '23/09/2026',
          clienteNombre: 'Transportes & Logística Rally E.I.R.L.',
          subtotal: 620.00,
          igv: 111.60,
          totalCotizado: 731.60,
          estado: 'Confirmado',
          metodoPago: 'Contraentrega SMP',
          comprobanteTipo: 'Factura Comercial',
          documentoNumero: '20608542191',
          items: [
            {
              repuesto: {
                id: 'm1',
                codigoOEM: '13568-39016',
                nombre: 'Faja de Distribución / Sincronización',
                categoria: 'Motor',
                precio: 210.00,
                stock: 14,
                compatibilidad: 'Toyota Hilux 1KD / 2KD',
                descripcion: 'Correa dentada reforzada con fibra de aramida.',
                imagenUri: 'https://m.media-amazon.com/images/I/71Y+Ld6J0zL._AC_SL1500_.jpg',
              },
              cantidad: 2,
            },
            {
              repuesto: {
                id: 'f3',
                codigoOEM: '04495-0K070',
                nombre: 'Zapatas de Freno Posteriores',
                categoria: 'Frenos',
                precio: 145.00,
                stock: 12,
                compatibilidad: 'Toyota Hilux Revo',
                descripcion: 'Juego de zapatas con forro adherido.',
                imagenUri: 'https://static.wixstatic.com/media/02e9a7_d73ba103680b4ce49bd56331a1c09a46~mv2.png/v1/fill/w_909,h_825,al_c,q_90,enc_avif,quality_auto/02e9a7_d73ba103680b4ce49bd56331a1c09a46~mv2.png',
              },
              cantidad: 1,
            },
          ],
        },
      ];
      await this.saveItem(KEYS.HISTORIAL_PEDIDOS, demoPedidos);
      return demoPedidos;
    }
    return list;
  },

  async savePedidoEnHistorial(pedido: PedidoLocal): Promise<void> {
    const historial = await this.getHistorialPedidos();
    historial.unshift(pedido);
    await this.saveItem(KEYS.HISTORIAL_PEDIDOS, historial);
    // Limpiar preorden activa
    await this.removeItem(KEYS.PREORDEN);
  },

  async updatePedidoEstado(pedidoId: string, nuevoEstado: 'Pendiente' | 'Confirmado' | 'Pagado' | 'Entregado'): Promise<boolean> {
    const historial = await this.getHistorialPedidos();
    const index = historial.findIndex((p) => p.id === pedidoId);
    if (index >= 0) {
      historial[index].estado = nuevoEstado;
      await this.saveItem(KEYS.HISTORIAL_PEDIDOS, historial);
      return true;
    }
    return false;
  },

  // ---------------- CONTROL DE STOCK DE ALMACÉN (KARDEX LOCAL) ----------------
  async getStockOverrides(): Promise<Record<string, number>> {
    const overrides = await this.getItem<Record<string, number>>(KEYS.STOCK_OVERRIDES);
    return overrides || {};
  },

  async updateStockItem(repuestoId: string, delta: number): Promise<number> {
    const overrides = await this.getStockOverrides();
    const stockActual = overrides[repuestoId] !== undefined ? overrides[repuestoId] : 10;
    const nuevoStock = Math.max(0, stockActual + delta);
    overrides[repuestoId] = nuevoStock;
    await this.saveItem(KEYS.STOCK_OVERRIDES, overrides);
    return nuevoStock;
  },

  async setStockItem(repuestoId: string, nuevoStock: number): Promise<number> {
    const overrides = await this.getStockOverrides();
    const cleanStock = Math.max(0, nuevoStock);
    overrides[repuestoId] = cleanStock;
    await this.saveItem(KEYS.STOCK_OVERRIDES, overrides);
    return cleanStock;
  },

  // ---------------- RECUPERACIÓN DE CONTRASEÑA ----------------
  async saveTempResetCode(email: string, code: string): Promise<void> {
    await this.saveItem(`RESET_CODE_${email.toLowerCase()}`, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });
  },

  async getTempResetCode(email: string): Promise<string | null> {
    const record = await this.getItem<{ code: string; expiresAt: number }>(`RESET_CODE_${email.toLowerCase()}`);
    if (!record) return null;
    if (Date.now() > record.expiresAt) return null;
    return record.code;
  },
};
