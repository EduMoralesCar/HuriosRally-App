import { PedidoLocal, Usuario } from '../types';

/**
 * Decide qué pedidos puede ver cada rol:
 * - Almacenero / Administrador: todos (necesitan despachar y auditar).
 * - Asesor: los pedidos que él mismo emitió en mostrador (o cotizaciones corporativas sin emisor asignado).
 * - Cliente: los suyos (como comprador o emisor).
 *   Los pedidos antiguos sin dueño se asocian por nombre para no perder el historial demo.
 */
export const filtrarPedidosPorUsuario = (pedidos: PedidoLocal[], user: Usuario | null): PedidoLocal[] => {
  if (!user) return [];

  if (user.rol === 'Almacenero' || user.rol === 'Administrador') return pedidos;

  if (user.rol === 'Asesor') {
    return pedidos.filter(
      (p) => p.creadoPorId === user.id || (!p.creadoPorId && p.comprobanteTipo === 'Factura Comercial')
    );
  }

  return pedidos.filter(
    (p) =>
      p.clienteId === user.id ||
      p.creadoPorId === user.id ||
      (!p.clienteId && !p.creadoPorId && p.clienteNombre === user.nombreCompleto)
  );
};

export interface ResumenPedidos {
  cantidad: number;
  monto: number;
  pendientes: number;
  entregados: number;
}

export const resumirPedidos = (pedidos: PedidoLocal[]): ResumenPedidos => ({
  cantidad: pedidos.length,
  monto: pedidos.reduce((acc, p) => acc + p.totalCotizado, 0),
  pendientes: pedidos.filter((p) => p.estado !== 'Entregado').length,
  entregados: pedidos.filter((p) => p.estado === 'Entregado').length,
});

/** Genera un código PED-XXXX que no choque con los ya existentes. */
export const generarCodigoPedido = (existentes: PedidoLocal[]): string => {
  const usados = new Set(existentes.map((p) => p.id));
  for (let intento = 0; intento < 50; intento++) {
    const codigo = `PED-${Math.floor(1000 + Math.random() * 9000)}`;
    if (!usados.has(codigo)) return codigo;
  }
  return `PED-${Date.now().toString().slice(-6)}`;
};
