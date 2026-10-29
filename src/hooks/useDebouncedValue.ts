import { useEffect, useState } from 'react';

/**
 * Devuelve `value` con retraso: sólo se actualiza cuando el valor deja de cambiar
 * durante `delay` ms. Evita filtrar el catálogo completo en cada tecla.
 */
export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
