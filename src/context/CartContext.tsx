import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { PedidoItem, PedidoLocal, Repuesto } from '../types';
import { StorageService } from '../services/StorageService';
import { REPUESTOS_MOCK } from '../data/repuestos.mock';

interface CartContextType {
  items: PedidoItem[];
  totalCount: number;
  subtotal: number;
  igv: number;
  total: number;
  addToCart: (repuesto: Repuesto, cantidad?: number) => Promise<void>;
  removeFromCart: (repuestoId: string) => Promise<void>;
  updateQuantity: (repuestoId: string, delta: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<PedidoItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [igv, setIgv] = useState(0);
  const [total, setTotal] = useState(0);

  // Sincronizar repuestos con la data más reciente de repuestos.mock.ts y stock de almacén
  const sincronizarConCatalogo = useCallback(
    (itemsGuardados: PedidoItem[], overrides: Record<string, number>): PedidoItem[] => {
      return itemsGuardados.map((item) => {
        const repuestoFresco = REPUESTOS_MOCK.find(
          (r) => r.codigoOEM === item.repuesto.codigoOEM || r.id === item.repuesto.id
        );

        const base = repuestoFresco || item.repuesto;
        const stockReal = overrides[base.id] !== undefined ? overrides[base.id] : base.stock;

        return {
          ...item,
          repuesto: {
            ...base,
            stock: stockReal,
            fotoInspeccionUri: item.repuesto.fotoInspeccionUri || base.fotoInspeccionUri,
          },
        };
      });
    },
    []
  );

  const calcularFinanzas = useCallback((itemsActuales: PedidoItem[]) => {
    const sub = itemsActuales.reduce((acc, curr) => acc + curr.repuesto.precio * curr.cantidad, 0);
    const tax = sub * 0.18;
    const tot = sub + tax;
    setSubtotal(sub);
    setIgv(tax);
    setTotal(tot);
  }, []);

  const guardarYActualizar = useCallback(
    async (nuevosItems: PedidoItem[]) => {
      setItems(nuevosItems);
      calcularFinanzas(nuevosItems);

      const sub = nuevosItems.reduce((acc, curr) => acc + curr.repuesto.precio * curr.cantidad, 0);
      const tax = sub * 0.18;
      const tot = sub + tax;

      const preorden: PedidoLocal = {
        items: nuevosItems,
        fechaCreacion: new Date().toISOString(),
        subtotal: sub,
        igv: tax,
        totalCotizado: tot,
        estado: 'Pendiente',
      };

      await StorageService.savePreOrden(preorden);
    },
    [calcularFinanzas]
  );

  const cargarPreordenInicial = useCallback(async () => {
    try {
      const [preorden, overrides] = await Promise.all([
        StorageService.getPreOrden(),
        StorageService.getStockOverrides(),
      ]);

      if (!preorden || !preorden.items) {
        setItems([]);
        calcularFinanzas([]);
      } else {
        const itemsSincronizados = sincronizarConCatalogo(preorden.items, overrides);
        setItems(itemsSincronizados);
        calcularFinanzas(itemsSincronizados);
      }
    } catch (e) {
      console.error('Error cargando preorden:', e);
    }
  }, [calcularFinanzas, sincronizarConCatalogo]);

  useEffect(() => {
    cargarPreordenInicial();
  }, [cargarPreordenInicial]);

  const addToCart = useCallback(
    async (repuesto: Repuesto, cantidad = 1) => {
      const overrides = await StorageService.getStockOverrides();
      const repuestoBase =
        REPUESTOS_MOCK.find((r) => r.codigoOEM === repuesto.codigoOEM || r.id === repuesto.id) || repuesto;
      const stockDisponible =
        overrides[repuestoBase.id] !== undefined ? overrides[repuestoBase.id] : repuestoBase.stock;

      if (stockDisponible <= 0) return;

      const repuestoFresco: Repuesto = {
        ...repuestoBase,
        stock: stockDisponible,
        fotoInspeccionUri: repuesto.fotoInspeccionUri || repuestoBase.fotoInspeccionUri,
      };

      const copia = [...items];
      const index = copia.findIndex((i) => i.repuesto.codigoOEM === repuestoFresco.codigoOEM);

      if (index >= 0) {
        const nuevaCant = Math.min(stockDisponible, copia[index].cantidad + cantidad);
        copia[index] = {
          ...copia[index],
          cantidad: nuevaCant,
          repuesto: repuestoFresco,
        };
      } else {
        copia.push({
          repuesto: repuestoFresco,
          cantidad: Math.min(stockDisponible, cantidad),
        });
      }

      await guardarYActualizar(copia);
    },
    [items, guardarYActualizar]
  );

  const removeFromCart = useCallback(
    async (repuestoId: string) => {
      const copia = items.filter((i) => i.repuesto.id !== repuestoId && i.repuesto.codigoOEM !== repuestoId);
      await guardarYActualizar(copia);
    },
    [items, guardarYActualizar]
  );

  const updateQuantity = useCallback(
    async (repuestoId: string, delta: number) => {
      const overrides = await StorageService.getStockOverrides();
      const copia = items
        .map((i) => {
          if (i.repuesto.id === repuestoId || i.repuesto.codigoOEM === repuestoId) {
            const maxStock =
              overrides[i.repuesto.id] !== undefined ? overrides[i.repuesto.id] : i.repuesto.stock;
            const nuevaCantidad = Math.min(Math.max(1, maxStock), i.cantidad + delta);
            return i.cantidad + delta > 0 ? { ...i, cantidad: nuevaCantidad } : null;
          }
          return i;
        })
        .filter(Boolean) as PedidoItem[];

      await guardarYActualizar(copia);
    },
    [items, guardarYActualizar]
  );

  const clearCart = useCallback(async () => {
    await guardarYActualizar([]);
  }, [guardarYActualizar]);

  const refreshCart = useCallback(async () => {
    await cargarPreordenInicial();
  }, [cargarPreordenInicial]);

  const totalCount = useMemo(() => items.reduce((acc, curr) => acc + curr.cantidad, 0), [items]);

  const value = useMemo(
    () => ({
      items,
      totalCount,
      subtotal,
      igv,
      total,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      refreshCart,
    }),
    [items, totalCount, subtotal, igv, total, addToCart, removeFromCart, updateQuantity, clearCart, refreshCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};
