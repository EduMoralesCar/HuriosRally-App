import { Repuesto } from '../types';

/** Umbral por debajo del cual un repuesto se considera con stock crítico. */
export const UMBRAL_STOCK_CRITICO = 3;

/** Normaliza texto para búsquedas: minúsculas y sin tildes ("Suspensión" == "suspension"). */
export const normalizarTexto = (texto: string): string =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

/** La marca se deduce de la primera palabra de la compatibilidad (ej. "Toyota Hilux 2016" -> "Toyota"). */
export const getMarca = (repuesto: Pick<Repuesto, 'compatibilidad'>): string => {
  const primera = repuesto.compatibilidad.trim().split(/\s+/)[0];
  return primera || 'Genérico';
};

export type EstadoStock = 'agotado' | 'critico' | 'disponible';

export interface InfoStock {
  estado: EstadoStock;
  etiqueta: string;
  color: string;
  fondo: string;
  icono: 'close-circle' | 'alert-circle' | 'checkmark-circle';
}

/** Traduce una cantidad de stock a la etiqueta/colores que se muestran en tarjetas y detalle. */
export const getInfoStock = (stock: number): InfoStock => {
  if (stock <= 0) {
    return { estado: 'agotado', etiqueta: 'Agotado', color: '#DC2626', fondo: '#FEF2F2', icono: 'close-circle' };
  }
  if (stock <= UMBRAL_STOCK_CRITICO) {
    return {
      estado: 'critico',
      etiqueta: stock === 1 ? 'Queda 1' : `Quedan ${stock}`,
      color: '#D97706',
      fondo: '#FFFBEB',
      icono: 'alert-circle',
    };
  }
  return { estado: 'disponible', etiqueta: 'En stock', color: '#059669', fondo: '#ECFDF5', icono: 'checkmark-circle' };
};

/** Formatea un monto en soles. */
export const formatearSoles = (monto: number): string => `S/ ${monto.toFixed(2)}`;
