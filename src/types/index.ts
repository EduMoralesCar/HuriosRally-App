export type CategoriaRepuesto = 'Todos' | 'Suspensión' | 'Frenos' | 'Motor' | 'Accesorios' | 'Filtros';

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
}

export interface Usuario {
  id: string;
  username: string;
  email: string;
  nombreCompleto: string;
  rol: 'Asesor' | 'Almacenero' | 'Administrador' | 'Cliente';
  telefono?: string;
  fotoPerfilUri?: string;
  sede?: string;
  password?: string;
  isAuthenticated: boolean;
  token?: string;
  biometricsEnabled?: boolean;
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
  clienteNombre?: string;
  metodoPago?: 'Yape / Plin' | 'Tarjeta Débito/Crédito' | 'Contraentrega SMP';
  comprobanteTipo?: 'Boleta Electrónica' | 'Factura Comercial';
  documentoNumero?: string;
}
