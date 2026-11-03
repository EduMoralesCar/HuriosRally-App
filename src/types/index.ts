export type CategoriaRepuesto = 'Todos' | 'Suspensión' | 'Frenos' | 'Motor' | 'Accesorios' | 'Filtros';

export type RolUsuario = 'Asesor' | 'Almacenero' | 'Administrador' | 'Cliente';

export type PermisoSistema =
  | 'catalogo.ver'
  | 'catalogo.crud'
  | 'cotizador.usar'
  | 'clientes.buscar_erp'
  | 'kardex.ajustar'
  | 'despachos.entregar'
  | 'reportes.ver'
  | 'usuarios.gestionar';

export interface Repuesto {
  id: string;
  codigoOEM: string;
  nombre: string;
  categoria: 'Suspensión' | 'Frenos' | 'Motor' | 'Accesorios' | 'Filtros';
  precio: number;
  stock: number;
  compatibilidad: string;
  descripcion: string;
  imagenUri: string;
  fotoInspeccionUri?: string;
  rating?: number;
  numReviews?: number;
  enStock?: boolean;
  esPersonalizado?: boolean;
}

export interface Usuario {
  id: string;
  username: string;
  email: string;
  nombreCompleto: string;
  rol: RolUsuario;
  telefono?: string;
  tipoDocumento?: 'DNI' | 'RUC';
  numeroDocumento?: string;
  direccion?: string;
  fotoPerfilUri?: string;
  sede?: string;
  password?: string;
  passwordHash?: string;
  isAuthenticated: boolean;
  token?: string;
  tokenCipher?: string;
  sessionIssuedAt?: string;
  sessionExpiresAt?: number;
  biometricsEnabled?: boolean;
  activo?: boolean;
  fechaBaja?: string;
  ultimoAcceso?: string;
}

export interface EventoSeguridad {
  id: string;
  fecha: string;
  usuario: string;
  rol: RolUsuario;
  accion: string;
  detalle: string;
}

export interface PedidoItem {
  repuesto: Repuesto;
  cantidad: number;
}

export interface PedidoLocal {
  id?: string;
  items: PedidoItem[];
  fechaCreacion: string;
  subtotal: number;
  igv: number;
  totalCotizado: number;
  estado?: 'Pendiente' | 'Confirmado' | 'Pagado' | 'Entregado';
  clienteId?: string;
  clienteNombre?: string;
  clienteTelefono?: string;
  creadoPorId?: string;
  creadoPorNombre?: string;
  metodoPago?: 'Yape / Plin' | 'Tarjeta Débito/Crédito' | 'Contraentrega SMP';
  comprobanteTipo?: 'Boleta Electrónica' | 'Factura Comercial';
  documentoNumero?: string;
  numOperacion?: string;
}
