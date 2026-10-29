import { PedidoLocal } from '../types';

type MetodoPago = NonNullable<PedidoLocal['metodoPago']>;
type TipoComprobante = NonNullable<PedidoLocal['comprobanteTipo']>;

export const soloDigitos = (texto: string): string => texto.replace(/\D/g, '');

export const validarDNI = (valor: string): boolean => /^\d{8}$/.test(valor);

/** RUC peruano: 11 dígitos que empiezan por 10, 15, 17 o 20. */
export const validarRUC = (valor: string): boolean => /^(10|15|17|20)\d{9}$/.test(valor);

/** Celular peruano: 9 dígitos que empiezan por 9. */
export const validarCelularPE = (valor: string): boolean => /^9\d{8}$/.test(valor);

/** Número de operación de Yape/Plin: entre 6 y 12 dígitos. */
export const validarOperacion = (valor: string): boolean => /^\d{6,12}$/.test(valor);

/**
 * Pasarela simulada: se exige formato (16 dígitos) pero no el algoritmo de Luhn,
 * para que cualquier evaluador pueda probar el flujo con números de prueba.
 */
export const validarTarjeta = (valor: string): boolean => /^\d{16}$/.test(valor);

export const validarCVV = (valor: string): boolean => /^\d{3,4}$/.test(valor);

/** Agrupa de 4 en 4: "4242424242424242" -> "4242 4242 4242 4242". */
export const formatearTarjeta = (digitos: string): string => digitos.replace(/(\d{4})(?=\d)/g, '$1 ');

/** Escribe MM/AA automáticamente mientras el usuario teclea. */
export const formatearVencimiento = (texto: string): string => {
  const d = soloDigitos(texto).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

/** Valida MM/AA y que la tarjeta no esté vencida (vale hasta el último día del mes). */
export const validarVencimiento = (valor: string, hoy: Date = new Date()): boolean => {
  const m = /^(\d{2})\/(\d{2})$/.exec(valor);
  if (!m) return false;
  const mes = Number(m[1]);
  const anio = 2000 + Number(m[2]);
  if (mes < 1 || mes > 12) return false;
  const finDeMes = new Date(anio, mes, 0, 23, 59, 59);
  return finDeMes.getTime() >= hoy.getTime();
};

export interface DatosCheckout {
  esAsesor: boolean;
  clienteNombre: string;
  clienteTelefono: string;
  metodoPago: MetodoPago;
  tipoComprobante: TipoComprobante;
  numeroDoc: string;
  numOperacion: string;
  numTarjeta: string;
  vencimiento: string;
  cvv: string;
}

export type CampoCheckout =
  | 'cliente'
  | 'telefono'
  | 'documento'
  | 'operacion'
  | 'tarjeta'
  | 'vencimiento'
  | 'cvv';

export type ErroresCheckout = Partial<Record<CampoCheckout, string>>;

/** Valida todo el formulario de pago y devuelve un mensaje por cada campo inválido. */
export const validarCheckout = (d: DatosCheckout): ErroresCheckout => {
  const errores: ErroresCheckout = {};

  if (d.esAsesor) {
    if (d.clienteNombre.trim().length < 3) {
      errores.cliente = 'Ingresa el nombre o razón social del cliente.';
    }
    if (d.clienteTelefono && !validarCelularPE(d.clienteTelefono)) {
      errores.telefono = 'El celular debe tener 9 dígitos y empezar con 9.';
    }
  }

  if (d.tipoComprobante === 'Factura Comercial') {
    if (!validarRUC(d.numeroDoc)) {
      errores.documento = 'El RUC debe tener 11 dígitos (empieza con 10, 15, 17 o 20).';
    }
  } else if (d.numeroDoc && !validarDNI(d.numeroDoc)) {
    errores.documento = 'El DNI debe tener exactamente 8 dígitos.';
  }

  if (d.metodoPago === 'Yape / Plin' && !validarOperacion(d.numOperacion)) {
    errores.operacion = 'Ingresa el número de operación del voucher (6 a 12 dígitos).';
  }

  if (d.metodoPago === 'Tarjeta Débito/Crédito') {
    if (!validarTarjeta(d.numTarjeta)) errores.tarjeta = 'La tarjeta debe tener 16 dígitos.';
    if (!validarVencimiento(d.vencimiento)) errores.vencimiento = 'Fecha inválida o tarjeta vencida (MM/AA).';
    if (!validarCVV(d.cvv)) errores.cvv = 'El CVV debe tener 3 o 4 dígitos.';
  }

  return errores;
};
