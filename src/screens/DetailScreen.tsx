import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Repuesto } from '../types';
import { StorageService } from '../services/StorageService';
import { CameraService } from '../services/CameraService';
import { useCart } from '../context/CartContext';

interface Props {
  route: any;
  navigation: any;
}

export const DetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { repuesto }: { repuesto: Repuesto } = route.params;
  const [cantidad, setCantidad] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [fotoCapturada, setFotoCapturada] = useState<string | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; mensaje: string; tipo: 'success' | 'info' } | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    checkFavoriteStatus();
  }, []);

  const showToastMsg = (mensaje: string, tipo: 'success' | 'info' = 'success') => {
    setToast({ visible: true, mensaje, tipo });
    setTimeout(() => {
      setToast(null);
    }, 2800);
  };

  const checkFavoriteStatus = async () => {
    const favs = await StorageService.getFavoritos();
    setIsFavorite(favs.some((f) => f.id === repuesto.id));
  };

  const handleToggleFavorite = async () => {
    let favs = await StorageService.getFavoritos();
    if (isFavorite) {
      favs = favs.filter((f) => f.id !== repuesto.id);
      setIsFavorite(false);
      showToastMsg('Repuesto removido de favoritos', 'info');
    } else {
      favs.push(repuesto);
      setIsFavorite(true);
      showToastMsg(`${repuesto.nombre} guardado en favoritos ❤️`, 'success');
    }
    await StorageService.saveFavoritos(favs);
  };

  const handleAgregarPreOrden = async () => {
    await addToCart(
      {
        ...repuesto,
        fotoInspeccionUri: fotoCapturada || undefined,
      },
      cantidad
    );
    showToastMsg(`✓ ${cantidad} unidad(es) agregada(s) a la pre-orden`, 'success');
  };

  // Abrir cámara nativa o modal de inspección (Figura A4)
  const handleTomarFoto = async () => {
    const uri = await CameraService.takePhoto();
    if (uri) {
      setFotoCapturada(uri);
      setShowCameraModal(true);
    }
  };

  const handlePickGaleria = async () => {
    const uri = await CameraService.pickImage();
    if (uri) {
      setFotoCapturada(uri);
      setShowCameraModal(true);
    }
  };

  return (
    <View style={styles.container}>
      {/* Toast Notificación Flotante */}
      {toast && (
        <View
          style={[
            styles.floatingToast,
            toast.tipo === 'info' ? styles.toastInfo : styles.toastSuccess,
          ]}
        >
          <Ionicons
            name={toast.tipo === 'info' ? 'information-circle' : 'checkmark-circle'}
            size={20}
            color={toast.tipo === 'info' ? '#0284C7' : '#059669'}
          />
          <Text style={styles.floatingToastText}>{toast.mensaje}</Text>
        </View>
      )}

      {/* Header Personalizado (Figura A3) */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle del Repuesto</Text>
        <TouchableOpacity style={styles.headerIconBtn} onPress={handleToggleFavorite}>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? '#EF4444' : '#FFFFFF'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Imagen Principal del Repuesto con Paginador de Puntitos */}
        <View style={styles.imageCard}>
          <Image source={{ uri: repuesto.imagenUri }} style={styles.image} resizeMode="contain" />
          <View style={styles.dotsRow}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>

        {/* Información Comercial */}
        <View style={styles.infoSection}>
          <Text style={styles.nombre}>{repuesto.nombre}</Text>
          <Text style={styles.oem}>OEM: {repuesto.codigoOEM}</Text>

          {/* Marca con logo / texto */}
          <View style={styles.brandRow}>
            <Ionicons name="shield-checkmark" size={16} color="#DC2626" />
            <Text style={styles.brandText}>Toyota Genuine Parts</Text>
          </View>

          {/* Precio y Estado En Stock */}
          <View style={styles.priceRow}>
            <Text style={styles.precio}>S/ {repuesto.precio.toFixed(2)}</Text>
            <View style={styles.stockBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              <Text style={styles.stockText}>En stock</Text>
            </View>
          </View>

          {/* Calificación y Reseñas */}
          <View style={styles.ratingRow}>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Ionicons key={s} name="star" size={14} color="#F59E0B" />
              ))}
            </View>
            <Text style={styles.ratingText}>
              {repuesto.rating || 4.8} ({repuesto.numReviews || 120} reseñas)
            </Text>
          </View>

          {/* Descripción Técnica */}
          <View style={styles.descBlock}>
            <Text style={styles.sectionHeading}>Descripción</Text>
            <Text style={styles.descText}>{repuesto.descripcion}</Text>
          </View>

          {/* Tabla de Especificaciones Técnicas */}
          <View style={styles.specsCard}>
            <View style={styles.specItem}>
              <View style={styles.specLabelGroup}>
                <Ionicons name="settings-outline" size={16} color="#64748B" />
                <Text style={styles.specLabel}>Categoría</Text>
              </View>
              <Text style={styles.specValue}>{repuesto.categoria}</Text>
            </View>

            <View style={styles.specItem}>
              <View style={styles.specLabelGroup}>
                <Ionicons name="car-outline" size={16} color="#64748B" />
                <Text style={styles.specLabel}>Compatibilidad</Text>
              </View>
              <Text style={styles.specValue}>{repuesto.compatibilidad}</Text>
            </View>

            <View style={styles.specItem}>
              <View style={styles.specLabelGroup}>
                <Ionicons name="cube-outline" size={16} color="#64748B" />
                <Text style={styles.specLabel}>Código OEM</Text>
              </View>
              <Text style={styles.specValue}>{repuesto.codigoOEM}</Text>
            </View>

            <View style={[styles.specItem, { borderBottomWidth: 0 }]}>
              <View style={styles.specLabelGroup}>
                <Ionicons name="ribbon-outline" size={16} color="#64748B" />
                <Text style={styles.specLabel}>Marca</Text>
              </View>
              <Text style={styles.specValue}>Toyota</Text>
            </View>
          </View>

          {/* Control de Cantidad */}
          <View style={styles.quantityRow}>
            <Text style={styles.quantityLabel}>Cantidad</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setCantidad(Math.max(1, cantidad - 1))}
              >
                <Text style={styles.qtyBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyNumber}>{cantidad}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setCantidad(cantidad + 1)}
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Fotografía Capturada (Si existe inspección) */}
          {fotoCapturada && (
            <View style={styles.inspeccionCard}>
              <View style={styles.inspeccionBadge}>
                <Ionicons name="checkmark-circle" size={15} color="#10B981" />
                <Text style={styles.inspeccionBadgeText}>Fotografía guardada correctamente</Text>
              </View>
              <Image source={{ uri: fotoCapturada }} style={styles.inspeccionImage} />
              <Text style={styles.inspeccionNota}>
                Inspección visual asociada al lote de almacén.
              </Text>
            </View>
          )}

          {/* Botones de Acción (Figura A3) */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.btnPreorden}
              onPress={handleAgregarPreOrden}
              activeOpacity={0.8}
            >
              <Ionicons name="cart-outline" size={18} color="#0066FF" style={{ marginRight: 6 }} />
              <Text style={styles.btnPreordenText}>Agregar a Pre-orden</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnCamara}
              onPress={handleTomarFoto}
              activeOpacity={0.8}
            >
              <Ionicons name="camera-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.btnCamaraText}>Verificar con Cámara</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Modal: Previsualización de Foto Capturada (Figura A4) */}
      <Modal visible={showCameraModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <View style={styles.modalTopBar}>
              <Text style={styles.modalTopTitle}>Foto Capturada</Text>
              <TouchableOpacity onPress={() => setShowCameraModal(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {fotoCapturada && (
              <Image source={{ uri: fotoCapturada }} style={styles.modalPreviewImg} />
            )}

            <View style={styles.modalTagOk}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <Text style={styles.modalTagOkText}>Fotografía guardada correctamente</Text>
            </View>

            <View style={styles.modalItemResume}>
              <Text style={styles.modalItemTitle}>{repuesto.nombre}</Text>
              <Text style={styles.modalItemOEM}>OEM: {repuesto.codigoOEM}</Text>
              <Text style={styles.modalItemPrice}>S/ {repuesto.precio.toFixed(2)}</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalBtnSec} onPress={handleTomarFoto}>
                <Ionicons name="camera-reverse-outline" size={16} color="#0066FF" style={{ marginRight: 4 }} />
                <Text style={styles.modalBtnSecText}>Tomar otra foto</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalBtnPri}
                onPress={() => setShowCameraModal(false)}
              >
                <Ionicons name="checkmark" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.modalBtnPriText}>Listo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerIconBtn: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  imageCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  image: {
    width: '100%',
    height: 190,
  },
  dotsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#0066FF',
  },
  infoSection: {
    paddingHorizontal: 18,
    marginTop: 14,
  },
  nombre: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  oem: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  brandText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  precio: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  stockText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '700',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 6,
  },
  ratingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  descBlock: {
    marginTop: 16,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  descText: {
    fontSize: 13.5,
    color: '#475569',
    lineHeight: 20,
  },
  specsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  specItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  specLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  specLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  specValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 6,
  },
  quantityLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 38,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0066FF',
  },
  qtyNumber: {
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  inspeccionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
  },
  inspeccionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  inspeccionBadgeText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '700',
  },
  inspeccionImage: {
    width: '100%',
    height: 140,
    borderRadius: 10,
  },
  inspeccionNota: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  btnPreorden: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#0066FF',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPreordenText: {
    color: '#0066FF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  btnCamara: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#0066FF',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCamaraText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    elevation: 8,
  },
  modalTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTopTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalPreviewImg: {
    width: '100%',
    height: 190,
    borderRadius: 12,
  },
  modalTagOk: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: 8,
    gap: 6,
    marginTop: 10,
  },
  modalTagOkText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '700',
  },
  modalItemResume: {
    marginVertical: 10,
  },
  modalItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalItemOEM: {
    fontSize: 12,
    color: '#64748B',
  },
  modalItemPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalBtnSec: {
    flex: 1,
    flexDirection: 'row',
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnSecText: {
    color: '#0066FF',
    fontWeight: '700',
    fontSize: 13,
  },
  modalBtnPri: {
    flex: 1,
    flexDirection: 'row',
    height: 44,
    borderRadius: 10,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnPriText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  floatingToast: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    gap: 10,
  },
  toastSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  toastInfo: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  floatingToastText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
});
