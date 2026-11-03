import AsyncStorage from '@react-native-async-storage/async-storage';
import { Repuesto, Usuario, PedidoLocal, EventoSeguridad, RolUsuario } from '../types';
import { REPUESTOS_MOCK } from '../data/repuestos.mock';
import { SecurityService } from './SecurityService';

const KEYS = {
  AUTH_USER: '@hurios_auth_user',
  AUTH_TOKEN: '@hurios_auth_token',
  USERS_DB: '@hurios_users_db',
  FAVORITOS: '@hurios_favoritos',
  PREORDEN: '@hurios_preorden',
  HISTORIAL_PEDIDOS: '@hurios_pedidos_historial',
  STOCK_OVERRIDES: '@hurios_stock_overrides',
  CUSTOM_REPUESTOS: '@hurios_custom_repuestos',
  DELETED_REPUESTOS: '@hurios_deleted_repuestos',
  SECURITY_LOGS: '@hurios_security_logs',
};

const STOCK_BASE_MAP: Record<string, number> = REPUESTOS_MOCK.reduce((acc, item) => {
  acc[item.id] = item.stock;
  return acc;
}, {} as Record<string, number>);

const DEFAULT_HASH = SecurityService.hashPassword('Hurios@2026');

const limpiarFotoDemo = (uri?: string): string => {
  if (!uri) return '';
  if (uri.startsWith('https://images.unsplash.com/')) return '';
  return uri;
};

const USUARIOS_SEMILLA: Usuario[] = [
  {
    id: 'usr_cliente_01',
    username: 'carlos_mendoza',
    email: 'carlos_mendoza.cliente@huriosrally.com',
    nombreCompleto: 'Carlos Mendoza Silva',
    rol: 'Cliente',
    telefono: '+51 987 111 222',
    tipoDocumento: 'DNI',
    numeroDocumento: '45892103',
    direccion: 'Av. Habich 420, San Martín de Porres',
    sede: 'Lima Norte / SMP (Sede Central)',
    password: 'Hurios@2026',
    passwordHash: DEFAULT_HASH,
    fotoPerfilUri: '',
    isAuthenticated: false,
    activo: true,
  },
  {
    id: 'usr_asesor_01',
    username: 'edu_morales',
    email: 'edu_morales.ventas@huriosrally.com',
    nombreCompleto: 'Edu Morales Carlos',
    rol: 'Asesor',
    telefono: '+51 987 654 321',
    sede: 'Lima Norte / SMP (Sede Central)',
    password: 'Hurios@2026',
    passwordHash: DEFAULT_HASH,
    fotoPerfilUri: '',
    isAuthenticated: false,
    activo: true,
  },
  {
    id: 'usr_almacen_01',
    username: 'raul_quispe',
    email: 'raul_quispe.admin@huriosrally.com',
    nombreCompleto: 'Raúl Quispe Huamán',
    rol: 'Administrador',
    telefono: '+51 987 333 444',
    sede: 'Sede Central / Administración SMP',
    password: 'Hurios@2026',
    passwordHash: DEFAULT_HASH,
    fotoPerfilUri: '',
    isAuthenticated: false,
    activo: true,
  },
  {
    id: 'usr_admin_01',
    username: 'admin_rally',
    email: 'admin.gerencia@huriosrally.com',
    nombreCompleto: 'Administración Hurios Rally',
    rol: 'Administrador',
    telefono: '+51 987 000 111',
    sede: 'Lima Norte / SMP (Sede Central)',
    password: 'Hurios@2026',
    passwordHash: DEFAULT_HASH,
    fotoPerfilUri: '',
    isAuthenticated: false,
    activo: true,
  },
  {
    id: 'usr_almacen_02',
    username: 'victor_palacios',
    email: 'victor_palacios.ventas@huriosrally.com',
    nombreCompleto: 'Víctor Hugo Palacios',
    rol: 'Asesor',
    telefono: '+51 955 641 200',
    sede: 'Lima Norte / SMP (Sede Central)',
    password: 'Hurios@2026',
    passwordHash: DEFAULT_HASH,
    fotoPerfilUri: '',
    isAuthenticated: false,
    activo: false,
    fechaBaja: '28/10/2026',
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

  // ---------------- GESTIÓN DE SESIÓN ----------------
  async getSesion(): Promise<Usuario | null> {
    const user = await this.getItem<Usuario>(KEYS.AUTH_USER);
    if (!user) return null;
    let changed = false;
    const fotoLimpia = limpiarFotoDemo(user.fotoPerfilUri);
    if (fotoLimpia !== user.fotoPerfilUri) {
      user.fotoPerfilUri = fotoLimpia;
      changed = true;
    }
    if (user.rol === 'Almacenero') {
      user.rol = 'Administrador';
      changed = true;
    }
    if (user.username === 'carlos_mendoza' && !user.numeroDocumento) {
      user.tipoDocumento = 'DNI';
      user.numeroDocumento = '45892103';
      user.direccion = user.direccion || 'Av. Habich 420, San Martín de Porres';
      changed = true;
    }
    if (changed) {
      await this.saveItem(KEYS.AUTH_USER, user);
    }
    if (user.tokenCipher && !user.token) {
      user.token = SecurityService.decryptData(user.tokenCipher);
    }
    return user;
  },

  async saveSesion(user: Usuario): Promise<void> {
    const signed = SecurityService.generateSignedSessionToken({
      id: user.id,
      username: user.username,
      rol: user.rol,
    });
    const passwordHash =
      user.passwordHash || (user.password ? SecurityService.hashPassword(user.password) : DEFAULT_HASH);
    const ahora = new Date().toLocaleString('es-PE');
    const userWithToken: Usuario = {
      ...user,
      fotoPerfilUri: limpiarFotoDemo(user.fotoPerfilUri),
      passwordHash,
      token: signed.token,
      tokenCipher: signed.tokenCipher,
      sessionIssuedAt: signed.issuedAt,
      sessionExpiresAt: signed.expiresAt,
      ultimoAcceso: ahora,
      activo: user.activo !== false,
      isAuthenticated: true,
    };
    await this.saveItem(KEYS.AUTH_USER, userWithToken);
    await AsyncStorage.setItem(KEYS.AUTH_TOKEN, signed.tokenCipher);
  },

  async clearSesion(): Promise<void> {
    const sesion = await this.getSesion();
    if (sesion) {
      await this.registrarEventoSeguridad({
        usuario: sesion.username,
        rol: sesion.rol,
        accion: 'Cierre de Sesión',
        detalle: 'Sesión finalizada por el usuario.',
      });
    }
    await this.removeItem(KEYS.AUTH_USER);
    await this.removeItem(KEYS.AUTH_TOKEN);
  },

  async getToken(): Promise<string | null> {
    const raw = await AsyncStorage.getItem(KEYS.AUTH_TOKEN);
    return raw ? SecurityService.decryptData(raw) : null;
  },

  // ---------------- BITÁCORA DE ACCESOS ----------------
  async getEventosSeguridad(): Promise<EventoSeguridad[]> {
    const list = await this.getItem<EventoSeguridad[]>(KEYS.SECURITY_LOGS);
    if (!list || list.length === 0) {
      const iniciales: EventoSeguridad[] = [
        {
          id: 'sec_01',
          fecha: new Date().toLocaleString('es-PE'),
          usuario: 'raul_quispe',
          rol: 'Administrador',
          accion: 'Sistema Iniciado',
          detalle: 'Servicios de catálogo, pedidos y usuarios activos.',
        },
      ];
      await this.saveItem(KEYS.SECURITY_LOGS, iniciales);
      return iniciales;
    }
    return list;
  },

  async registrarEventoSeguridad(datos: {
    usuario: string;
    rol: RolUsuario;
    accion: string;
    detalle: string;
  }): Promise<void> {
    const logs = await this.getEventosSeguridad();
    const nuevo: EventoSeguridad = {
      id: `sec_${Date.now()}`,
      fecha: new Date().toLocaleString('es-PE'),
      usuario: datos.usuario,
      rol: datos.rol,
      accion: datos.accion,
      detalle: datos.detalle,
    };
    const actualizados = [nuevo, ...logs].slice(0, 25);
    await this.saveItem(KEYS.SECURITY_LOGS, actualizados);
  },

  // ---------------- GESTIÓN Y RESTAURACIÓN DE USUARIOS ----------------
  async getUsuarios(): Promise<Usuario[]> {
    try {
      const list = await this.getItem<Usuario[]>(KEYS.USERS_DB);
      if (!list || !Array.isArray(list) || list.length === 0) {
        await this.saveItem(KEYS.USERS_DB, USUARIOS_SEMILLA);
        return USUARIOS_SEMILLA;
      }

      let updated = false;
      const currentList = list.map((u) => {
        const hash = u.passwordHash || (u.password ? SecurityService.hashPassword(u.password) : DEFAULT_HASH);
        const activo = u.activo === undefined ? true : u.activo;
        const fotoLimpia = limpiarFotoDemo(u.fotoPerfilUri);
        const rolNormalizado: RolUsuario = u.rol === 'Almacenero' ? 'Administrador' : u.rol;
        if (
          u.passwordHash !== hash ||
          u.activo === undefined ||
          u.fotoPerfilUri !== fotoLimpia ||
          u.rol !== rolNormalizado
        ) {
          updated = true;
          return { ...u, rol: rolNormalizado, passwordHash: hash, activo, fotoPerfilUri: fotoLimpia };
        }
        return u;
      });

      USUARIOS_SEMILLA.forEach((semilla) => {
        const idx = currentList.findIndex(
          (u) => (u.username || '').toLowerCase() === semilla.username.toLowerCase()
        );
        if (idx === -1) {
          currentList.push(semilla);
          updated = true;
        } else {
          const actual = currentList[idx];
          const needsRoleSync =
            semilla.username === 'raul_quispe' && actual.rol !== 'Administrador';
          const needsDocSync =
            semilla.username === 'carlos_mendoza' && !actual.numeroDocumento;
          if (!actual.passwordHash || actual.password !== semilla.password || needsRoleSync || needsDocSync) {
            currentList[idx] = {
              ...actual,
              password: semilla.password,
              passwordHash: semilla.passwordHash,
              rol: needsRoleSync ? 'Administrador' : actual.rol,
              tipoDocumento: actual.tipoDocumento || semilla.tipoDocumento,
              numeroDocumento: actual.numeroDocumento || semilla.numeroDocumento,
              direccion: actual.direccion || semilla.direccion,
              email: actual.email || semilla.email,
              nombreCompleto: actual.nombreCompleto || semilla.nombreCompleto,
            };
            updated = true;
          }
        }
      });

      if (updated) {
        await this.saveItem(KEYS.USERS_DB, currentList);
      }

      return currentList;
    } catch (e) {
      console.error('Error recuperando base de usuarios:', e);
      return USUARIOS_SEMILLA;
    }
  },

  async saveUsuario(nuevoUsuario: Usuario): Promise<void> {
    const usuarios = await this.getUsuarios();
    const passwordHash =
      nuevoUsuario.passwordHash ||
      (nuevoUsuario.password ? SecurityService.hashPassword(nuevoUsuario.password) : DEFAULT_HASH);
    const usuarioNormalizado: Usuario = {
      ...nuevoUsuario,
      fotoPerfilUri: limpiarFotoDemo(nuevoUsuario.fotoPerfilUri),
      passwordHash,
      activo: nuevoUsuario.activo === undefined ? true : nuevoUsuario.activo,
    };

    const index = usuarios.findIndex(
      (u) => u.id === usuarioNormalizado.id || u.username.toLowerCase() === usuarioNormalizado.username.toLowerCase()
    );
    if (index >= 0) {
      usuarios[index] = usuarioNormalizado;
    } else {
      usuarios.push(usuarioNormalizado);
    }
    await this.saveItem(KEYS.USERS_DB, usuarios);
  },

  async desactivarUsuario(userId: string): Promise<boolean> {
    const usuarios = await this.getUsuarios();
    const idx = usuarios.findIndex((u) => u.id === userId);
    if (idx < 0) return false;
    usuarios[idx] = {
      ...usuarios[idx],
      activo: false,
      fechaBaja: new Date().toLocaleDateString('es-PE'),
    };
    await this.saveItem(KEYS.USERS_DB, usuarios);
    await this.registrarEventoSeguridad({
      usuario: usuarios[idx].username,
      rol: usuarios[idx].rol,
      accion: 'Baja de Usuario',
      detalle: `Cuenta @${usuarios[idx].username} desactivada temporalmente.`,
    });
    return true;
  },

  async restaurarUsuario(userId: string): Promise<boolean> {
    const usuarios = await this.getUsuarios();
    const idx = usuarios.findIndex((u) => u.id === userId);
    if (idx < 0) return false;
    usuarios[idx] = {
      ...usuarios[idx],
      activo: true,
      fechaBaja: undefined,
    };
    await this.saveItem(KEYS.USERS_DB, usuarios);
    await this.registrarEventoSeguridad({
      usuario: usuarios[idx].username,
      rol: usuarios[idx].rol,
      accion: 'Restauración de Usuario',
      detalle: `Cuenta @${usuarios[idx].username} restaurada y habilitada.`,
    });
    return true;
  },

  async restaurarUsuariosSemilla(): Promise<Usuario[]> {
    const actuales = await this.getUsuarios();
    const mapa = new Map<string, Usuario>();
    actuales.forEach((u) => {
      mapa.set(u.username.toLowerCase(), {
        ...u,
        fotoPerfilUri: limpiarFotoDemo(u.fotoPerfilUri),
        activo: true,
        fechaBaja: undefined,
      });
    });
    USUARIOS_SEMILLA.forEach((s) => {
      const existente = mapa.get(s.username.toLowerCase());
      mapa.set(s.username.toLowerCase(), {
        ...(existente || s),
        fotoPerfilUri: limpiarFotoDemo(existente?.fotoPerfilUri),
        activo: true,
        fechaBaja: undefined,
      });
    });
    const restaurados = Array.from(mapa.values());
    await this.saveItem(KEYS.USERS_DB, restaurados);
    await this.registrarEventoSeguridad({
      usuario: 'admin_sistema',
      rol: 'Administrador',
      accion: 'Restauración Masiva',
      detalle: 'Todas las cuentas maestras e inactivas fueron restauradas.',
    });
    return restaurados;
  },

  // ---------------- LÓGICA DE NEGOCIO: CRUD DE CATÁLOGO Y REPUESTOS (3.3) ----------------
  async getCustomRepuestos(): Promise<Record<string, Repuesto>> {
    const map = await this.getItem<Record<string, Repuesto>>(KEYS.CUSTOM_REPUESTOS);
    return map || {};
  },

  async getDeletedRepuestosIds(): Promise<string[]> {
    const ids = await this.getItem<string[]>(KEYS.DELETED_REPUESTOS);
    return ids || [];
  },

  async getCatalogoRepuestos(): Promise<Repuesto[]> {
    const [customMap, deletedIds, overrides] = await Promise.all([
      this.getCustomRepuestos(),
      this.getDeletedRepuestosIds(),
      this.getStockOverrides(),
    ]);

    const deletedSet = new Set(deletedIds);
    const resultado: Repuesto[] = [];
    const procesados = new Set<string>();

    // Primero los personalizados nuevos para que aparezcan al inicio del catálogo
    Object.values(customMap).forEach((rep) => {
      if (!deletedSet.has(rep.id) && !STOCK_BASE_MAP[rep.id]) {
        const stockFinal = overrides[rep.id] !== undefined ? overrides[rep.id] : rep.stock;
        resultado.push({ ...rep, stock: stockFinal, esPersonalizado: true });
        procesados.add(rep.id);
      }
    });

    // Luego el catálogo base combinado con ediciones y overrides de stock
    REPUESTOS_MOCK.forEach((base) => {
      if (deletedSet.has(base.id) || procesados.has(base.id)) return;
      const version = customMap[base.id] ? { ...base, ...customMap[base.id] } : base;
      const stockFinal = overrides[base.id] !== undefined ? overrides[base.id] : version.stock;
      resultado.push({ ...version, stock: stockFinal });
    });

    return resultado;
  },

  async guardarRepuestoCatalogo(repuesto: Repuesto): Promise<Repuesto> {
    const [customMap, deletedIds, overrides] = await Promise.all([
      this.getCustomRepuestos(),
      this.getDeletedRepuestosIds(),
      this.getStockOverrides(),
    ]);

    const normalizado: Repuesto = {
      ...repuesto,
      id: repuesto.id || `rep_${Date.now()}`,
      precio: Math.max(1, Number(repuesto.precio) || 0),
      stock: Math.max(0, Math.floor(Number(repuesto.stock) || 0)),
      rating: repuesto.rating || 4.9,
      numReviews: repuesto.numReviews || 18,
    };

    customMap[normalizado.id] = normalizado;
    overrides[normalizado.id] = normalizado.stock;

    const nuevosEliminados = deletedIds.filter((id) => id !== normalizado.id);

    await Promise.all([
      this.saveItem(KEYS.CUSTOM_REPUESTOS, customMap),
      this.saveItem(KEYS.STOCK_OVERRIDES, overrides),
      this.saveItem(KEYS.DELETED_REPUESTOS, nuevosEliminados),
    ]);

    return normalizado;
  },

  async eliminarRepuestoCatalogo(repuestoId: string): Promise<void> {
    const deletedIds = await this.getDeletedRepuestosIds();
    if (!deletedIds.includes(repuestoId)) {
      deletedIds.push(repuestoId);
      await this.saveItem(KEYS.DELETED_REPUESTOS, deletedIds);
    }
  },

  async restaurarCatalogoRepuestos(): Promise<void> {
    await Promise.all([
      this.removeItem(KEYS.DELETED_REPUESTOS),
      this.removeItem(KEYS.CUSTOM_REPUESTOS),
    ]);
  },

  // ---------------- FAVORITOS Y PRE-ORDEN (AISLADOS POR USUARIO) ----------------
  async getFavoritos(): Promise<Repuesto[]> {
    const sesion = await this.getSesion();
    const key = sesion ? `${KEYS.FAVORITOS}_${sesion.id}` : KEYS.FAVORITOS;
    const list = await this.getItem<Repuesto[]>(key);
    return list || [];
  },

  async saveFavoritos(favoritos: Repuesto[]): Promise<void> {
    const sesion = await this.getSesion();
    const key = sesion ? `${KEYS.FAVORITOS}_${sesion.id}` : KEYS.FAVORITOS;
    await this.saveItem(key, favoritos);
  },

  async getPreOrden(): Promise<PedidoLocal | null> {
    const sesion = await this.getSesion();
    const key = sesion ? `${KEYS.PREORDEN}_${sesion.id}` : KEYS.PREORDEN;
    return await this.getItem<PedidoLocal>(key);
  },

  async savePreOrden(pedido: PedidoLocal): Promise<void> {
    const sesion = await this.getSesion();
    const key = sesion ? `${KEYS.PREORDEN}_${sesion.id}` : KEYS.PREORDEN;
    await this.saveItem(key, pedido);
  },

  async getHistorialPedidos(): Promise<PedidoLocal[]> {
    const list = await this.getItem<PedidoLocal[]>(KEYS.HISTORIAL_PEDIDOS);
    if (!list || list.length === 0) {
      const demoPedidos: PedidoLocal[] = [
        {
          id: 'PED-4821',
          fechaCreacion: '23/09/2026',
          clienteId: 'usr_cliente_01',
          clienteNombre: 'Carlos Mendoza Silva',
          creadoPorId: 'usr_cliente_01',
          creadoPorNombre: 'Carlos Mendoza Silva',
          subtotal: 470.0,
          igv: 84.6,
          totalCotizado: 554.6,
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
                precio: 180.0,
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
                precio: 290.0,
                stock: 8,
                compatibilidad: 'Toyota Hilux 4x4',
                descripcion: 'Disco ventilado con aleación de carbono.',
                imagenUri:
                  'https://refaccionariamario.info/73958-tm_thickbox_default/disco-de-freno-ventilado-delantero-fritec-para-spark-14.jpg',
              },
              cantidad: 1,
            },
          ],
        },
        {
          id: 'PED-3904',
          fechaCreacion: '23/09/2026',
          clienteNombre: 'Transportes & Logística Rally E.I.R.L.',
          creadoPorId: 'usr_asesor_01',
          creadoPorNombre: 'Edu Morales Carlos',
          subtotal: 620.0,
          igv: 111.6,
          totalCotizado: 731.6,
          estado: 'Confirmado',
          metodoPago: 'Contraentrega SMP',
          comprobanteTipo: 'Factura Comercial',
          documentoNumero: '20608542191',
          items: [
            {
              repuesto: {
                id: 'm2',
                codigoOEM: '13568-39016',
                nombre: 'Faja / Correa de Distribución Reforzada',
                categoria: 'Motor',
                precio: 165.0,
                stock: 14,
                compatibilidad: 'Toyota Hilux 1KD / 2KD',
                descripcion: 'Correa dentada reforzada con fibra de vidrio.',
                imagenUri:
                  'https://tse3.mm.bing.net/th/id/OIP.H_aAez5mVi2q7i5x_UtiAwHaGB?r=0&rs=1&pid=ImgDetMain&o=7&rm=3',
              },
              cantidad: 2,
            },
            {
              repuesto: {
                id: 'f3',
                codigoOEM: '04495-0K070',
                nombre: 'Zapatas de Freno Posteriores',
                categoria: 'Frenos',
                precio: 145.0,
                stock: 12,
                compatibilidad: 'Toyota Hilux Revo',
                descripcion: 'Juego de zapatas con forro adherido.',
                imagenUri:
                  'https://static.wixstatic.com/media/02e9a7_d73ba103680b4ce49bd56331a1c09a46~mv2.png/v1/fill/w_909,h_825,al_c,q_90,enc_avif,quality_auto/02e9a7_d73ba103680b4ce49bd56331a1c09a46~mv2.png',
              },
              cantidad: 2,
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

    const overrides = await this.getStockOverrides();
    pedido.items.forEach((item) => {
      const id = item.repuesto.id;
      const base =
        overrides[id] !== undefined ? overrides[id] : (STOCK_BASE_MAP[id] ?? item.repuesto.stock);
      overrides[id] = Math.max(0, base - item.cantidad);
    });
    await this.saveItem(KEYS.STOCK_OVERRIDES, overrides);

    const sesion = await this.getSesion();
    if (sesion) {
      await this.removeItem(`${KEYS.PREORDEN}_${sesion.id}`);
    }
    await this.removeItem(KEYS.PREORDEN);
  },

  async updatePedidoEstado(
    pedidoId: string,
    nuevoEstado: 'Pendiente' | 'Confirmado' | 'Pagado' | 'Entregado'
  ): Promise<boolean> {
    const historial = await this.getHistorialPedidos();
    const index = historial.findIndex((p) => p.id === pedidoId);
    if (index >= 0) {
      historial[index].estado = nuevoEstado;
      await this.saveItem(KEYS.HISTORIAL_PEDIDOS, historial);
      return true;
    }
    return false;
  },

  async eliminarPedidoHistorial(pedidoId: string): Promise<boolean> {
    const historial = await this.getHistorialPedidos();
    const pedido = historial.find((p) => p.id === pedidoId);
    if (!pedido) return false;

    const overrides = await this.getStockOverrides();
    pedido.items.forEach((item) => {
      const id = item.repuesto.id;
      const actual =
        overrides[id] !== undefined ? overrides[id] : (STOCK_BASE_MAP[id] ?? item.repuesto.stock);
      overrides[id] = actual + item.cantidad;
    });
    await this.saveItem(KEYS.STOCK_OVERRIDES, overrides);

    const nuevoHistorial = historial.filter((p) => p.id !== pedidoId);
    await this.saveItem(KEYS.HISTORIAL_PEDIDOS, nuevoHistorial);
    return true;
  },

  // ---------------- CONTROL DE STOCK DE ALMACÉN (KARDEX LOCAL) ----------------
  async getStockOverrides(): Promise<Record<string, number>> {
    const overrides = await this.getItem<Record<string, number>>(KEYS.STOCK_OVERRIDES);
    return overrides || {};
  },

  async updateStockItem(repuestoId: string, delta: number): Promise<number> {
    const overrides = await this.getStockOverrides();
    const stockActual =
      overrides[repuestoId] !== undefined
        ? overrides[repuestoId]
        : (STOCK_BASE_MAP[repuestoId] ?? 10);
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
    const record = await this.getItem<{ code: string; expiresAt: number }>(
      `RESET_CODE_${email.toLowerCase()}`
    );
    if (!record) return null;
    if (Date.now() > record.expiresAt) return null;
    return record.code;
  },
};
