import React, { memo, useEffect, useState } from 'react';
import { ActivityIndicator, Image, ImageResizeMode, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  uri?: string;
  style?: StyleProp<ViewStyle>;
  resizeMode?: ImageResizeMode;
  iconSize?: number;
}

/**
 * Imagen remota con indicador de carga y respaldo visual si la URL falla.
 * Las fotos de repuestos vienen de tiendas externas y pueden caerse en cualquier momento.
 */
const ProductImageBase: React.FC<Props> = ({ uri, style, resizeMode = 'contain', iconSize = 28 }) => {
  const [estado, setEstado] = useState<'cargando' | 'ok' | 'error'>(uri ? 'cargando' : 'error');

  useEffect(() => {
    setEstado(uri ? 'cargando' : 'error');
  }, [uri]);

  return (
    <View style={[styles.contenedor, style]}>
      {estado !== 'error' && uri ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          resizeMode={resizeMode}
          fadeDuration={150}
          onLoad={() => setEstado('ok')}
          onError={() => setEstado('error')}
        />
      ) : null}
      {estado === 'cargando' && <ActivityIndicator size="small" color="#CBD5E1" />}
      {estado === 'error' && <Ionicons name="image-outline" size={iconSize} color="#CBD5E1" />}
    </View>
  );
};

export const ProductImage = memo(ProductImageBase);

const styles = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
