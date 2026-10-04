import React, { createContext, useContext, useState, useEffect } from 'react';
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

  useEffect(() => {
    cargarPreordenInicial();
  }, []);

  // Función para sincronizar repuestos con la data más reciente de repuestos.mock.ts
  const sincronizarConCatalogo = (itemsGuardados: PedidoItem[]): PedidoItem[] => {
    return itemsGuardados.map((item) => {
      // Buscar el repuesto en REPUESTOS_MOCK por código OEM o por ID
      const repuestoFresco = REPUESTOS_MOCK.find(
        (r) => r.codigoOEM === item.repuesto.codigoOEM || r.id === item.repuesto.id
      );

      if (repuestoFresco) {
        return {
          ...item,
          repuesto: {
            ...repuestoFresco,
            fotoInspeccionUri: item.repuesto.fotoInspeccionUri || repuestoFresco.fotoInspeccionUri,
          },
        };
      }
      return item;
    });
  };

  const calcularFinanzas = (itemsActuales: PedidoItem[]) => {
    const sub = itemsActuales.reduce((acc, curr) => acc + curr.repuesto.precio * curr.cantidad, 0);
    const tax = sub * 0.18;
    const tot = sub + tax;
    setSubtotal(sub);
    setIgv(tax);
    setTotal(tot);
  };

  const guardarYActualizar = async (nuevosItems: PedidoItem[]) => {
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
  };

  const cargarPreordenInicial = async () => {
    try {
      let preorden = await StorageService.getPreOrden();

      if (!preorden || !preorden.items || preorden.items.length === 0) {
        // Inicializar con los primeros 3 productos de REPUESTOS_MOCK (con sus URLs y datos actualizados)
        const iniciales: PedidoItem[] = [
          { repuesto: REPUESTOS_MOCK[0], cantidad: 2 }, // Pastillas de freno
          { repuesto: REPUESTOS_MOCK[10], cantidad: 1 }, // Filtro de aceite
          { repuesto: REPUESTOS_MOCK[1], cantidad: 1 }, // Disco de freno o amortiguador
        ];
        await guardarYActualizar(iniciales);
      } else {
        // Sincronizar los ítems guardados con las URLs y datos frescos de repuestos.mock.ts
        const itemsSincronizados = sincronizarConCatalogo(preorden.items);
        await guardarYActualizar(itemsSincronizados);
      }
    } catch (e) {
      console.error('Error cargando preorden:', e);
    }
  };

  const addToCart = async (repuesto: Repuesto, cantidad = 1) => {
    // Tomar siempre los datos más actualizados del repuesto
    const repuestoFresco = REPUESTOS_MOCK.find(
      (r) => r.codigoOEM === repuesto.codigoOEM || r.id === repuesto.id
    ) || repuesto;

    const copia = [...items];
    const index = copia.findIndex((i) => i.repuesto.codigoOEM === repuestoFresco.codigoOEM);

    if (index >= 0) {
      copia[index] = {
        ...copia[index],
        cantidad: copia[index].cantidad + cantidad,
        repuesto: repuestoFresco,
      };
    } else {
      copia.push({
        repuesto: repuestoFresco,
        cantidad,
      });
    }

    await guardarYActualizar(copia);
  };

  const removeFromCart = async (repuestoId: string) => {
    const copia = items.filter((i) => i.repuesto.id !== repuestoId && i.repuesto.codigoOEM !== repuestoId);
    await guardarYActualizar(copia);
  };

  const updateQuantity = async (repuestoId: string, delta: number) => {
    const copia = items
      .map((i) => {
        if (i.repuesto.id === repuestoId || i.repuesto.codigoOEM === repuestoId) {
          const nuevaCantidad = i.cantidad + delta;
          return nuevaCantidad > 0 ? { ...i, cantidad: nuevaCantidad } : null;
        }
        return i;
      })
      .filter(Boolean) as PedidoItem[];

    await guardarYActualizar(copia);
  };

  const clearCart = async () => {
    await guardarYActualizar([]);
  };

  const refreshCart = async () => {
    await cargarPreordenInicial();
  };

  const totalCount = items.reduce((acc, curr) => acc + curr.cantidad, 0);

  return (
    <CartContext.Provider
      value={{
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};
