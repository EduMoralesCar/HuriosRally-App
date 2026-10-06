import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

export const CameraService = {
  async requestCameraPermission(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } catch (e) {
      console.warn('Error al solicitar permisos de cámara:', e);
      return false;
    }
  },

  async requestMediaLibraryPermission(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    } catch (e) {
      console.warn('Error al solicitar permisos de galería:', e);
      return false;
    }
  },

  async takePhoto(): Promise<string | null> {
    try {
      const hasPermission = await this.requestCameraPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permiso Denegado',
          'Se requieren permisos de cámara para capturar fotografías. Por favor actívalos en los ajustes.'
        );
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1], // Cuadrado óptimo para avatar de perfil
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0].uri;
      }
      return null;
    } catch (error: any) {
      console.error('[CameraService] Error en cámara:', error);
      Alert.alert(
        'Cámara no disponible',
        'No se pudo abrir la cámara. Si estás en un emulador, asegúrate de que tenga una cámara virtual configurada o prueba arrastrando una foto a la Galería.'
      );
      return null;
    }
  },

  async pickImage(): Promise<string | null> {
    try {
      const hasPermission = await this.requestMediaLibraryPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permiso Denegado',
          'Se requiere acceso a la galería para seleccionar fotografías de tu dispositivo.'
        );
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1], // Cuadrado óptimo para avatar de perfil
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0].uri;
      }
      return null;
    } catch (error: any) {
      console.error('[CameraService] Error al abrir galería:', error);
      Alert.alert('Galería', 'Ocurrió un inconveniente al abrir la galería de imágenes.');
      return null;
    }
  }
};

