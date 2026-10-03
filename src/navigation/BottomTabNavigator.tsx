import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { CatalogScreen } from '../screens/CatalogScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';
import { SavedFavoritesScreen } from '../screens/SavedFavoritesScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { WarehouseDispatchScreen } from '../screens/WarehouseDispatchScreen';
import { WarehouseStockScreen } from '../screens/WarehouseStockScreen';
import { BottomTabParamList } from './types';
import { useCart } from '../context/CartContext';
import { StorageService } from '../services/StorageService';
import { Usuario } from '../types';

const Tab = createBottomTabNavigator<BottomTabParamList>();

interface Props {
  onLogout: () => void;
  user?: Usuario | null;
}

export const BottomTabNavigator: React.FC<Props> = ({ onLogout, user }) => {
  const { totalCount } = useCart();
  const [currentUser, setCurrentUser] = useState<Usuario | null>(user || null);

  useEffect(() => {
    cargarSesion();
  }, []);

  const cargarSesion = async () => {
    const sesion = await StorageService.getSesion();
    if (sesion) {
      setCurrentUser(sesion);
    }
  };

  const rolActivo = currentUser?.rol || user?.rol;
  const esAsesor = rolActivo === 'Asesor';
  const esAlmacenero = rolActivo === 'Almacenero';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#EF4444',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      {/* SI EL USUARIO ES ALMACENERO: VISTA EXCLUSIVA DE ALMACÉN */}
      {esAlmacenero ? (
        <>
          {/* 1. Despachos y Órdenes por Entregar */}
          <Tab.Screen
            name="InicioTab"
            component={WarehouseDispatchScreen}
            options={{
              tabBarLabel: ({ color, focused }) => (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color, fontSize: 11, fontWeight: '700' }}>Despachos</Text>
                  {focused && <View style={[styles.activeIndicator, { backgroundColor: '#059669' }]} />}
                </View>
              ),
              tabBarIcon: ({ color }) => <Ionicons name="cube-outline" size={22} color={color} />,
            }}
          />

          {/* 2. Control de Stock e Inventario Kardex */}
          <Tab.Screen
            name="PreOrdenTab"
            component={WarehouseStockScreen}
            options={{
              tabBarLabel: ({ color, focused }) => (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color, fontSize: 11, fontWeight: '700' }}>Stock / Kardex</Text>
                  {focused && <View style={[styles.activeIndicator, { backgroundColor: '#059669' }]} />}
                </View>
              ),
              tabBarIcon: ({ color }) => <Ionicons name="clipboard-outline" size={22} color={color} />,
            }}
          />

          {/* 3. Familias de Repuestos */}
          <Tab.Screen
            name="CategoriasTab"
            component={CategoriesScreen}
            options={{
              tabBarLabel: ({ color, focused }) => (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color, fontSize: 11, fontWeight: '700' }}>Familias</Text>
                  {focused && <View style={[styles.activeIndicator, { backgroundColor: '#059669' }]} />}
                </View>
              ),
              tabBarIcon: ({ color }) => <Ionicons name="grid-outline" size={22} color={color} />,
            }}
          />

          {/* 4. Perfil de Almacenero */}
          <Tab.Screen
            name="PerfilTab"
            options={{
              tabBarLabel: ({ color, focused }) => (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color, fontSize: 11, fontWeight: '700' }}>Mi Perfil</Text>
                  {focused && <View style={[styles.activeIndicator, { backgroundColor: '#059669' }]} />}
                </View>
              ),
              tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={22} color={color} />,
            }}
          >
            {() => <ProfileScreen onLogout={onLogout} />}
          </Tab.Screen>
        </>
      ) : (
        <>
          {/* 1. Inicio / Mostrador */}
          <Tab.Screen
            name="InicioTab"
            options={{
              tabBarLabel: ({ color, focused }) => (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color, fontSize: 11, fontWeight: '700' }}>
                    {esAsesor ? 'Mostrador' : 'Inicio'}
                  </Text>
                  {focused && <View style={styles.activeIndicator} />}
                </View>
              ),
              tabBarIcon: ({ color }) => (
                <Ionicons name={esAsesor ? 'storefront-outline' : 'home'} size={22} color={color} />
              ),
            }}
          >
            {(props) => <CatalogScreen {...props} onLogout={onLogout} />}
          </Tab.Screen>

          {/* 2. Categorías / Familias */}
          <Tab.Screen
            name="CategoriasTab"
            component={CategoriesScreen}
            options={{
              tabBarLabel: ({ color, focused }) => (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color, fontSize: 11, fontWeight: '700' }}>
                    {esAsesor ? 'Familias' : 'Categorías'}
                  </Text>
                  {focused && <View style={styles.activeIndicator} />}
                </View>
              ),
              tabBarIcon: ({ color }) => <Ionicons name="grid-outline" size={22} color={color} />,
            }}
          />

          {/* 3. Favoritos / Frecuentes */}
          <Tab.Screen
            name="FavoritosTab"
            component={SavedFavoritesScreen}
            options={{
              tabBarLabel: ({ color, focused }) => (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color, fontSize: 11, fontWeight: '700' }}>
                    {esAsesor ? 'Frecuentes' : 'Favoritos'}
                  </Text>
                  {focused && <View style={styles.activeIndicator} />}
                </View>
              ),
              tabBarIcon: ({ color }) => <Ionicons name={esAsesor ? 'star-outline' : 'heart-outline'} size={22} color={color} />,
            }}
          />

          {/* 4. Pre-orden / Cotizador */}
          <Tab.Screen
            name="PreOrdenTab"
            component={FavoritesScreen}
            options={{
              tabBarLabel: ({ color, focused }) => (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color, fontSize: 11, fontWeight: '700' }}>
                    {esAsesor ? 'Cotizador' : 'Pre-orden'}
                  </Text>
                  {focused && <View style={styles.activeIndicator} />}
                </View>
              ),
              tabBarIcon: ({ color }) => (
                <View style={{ position: 'relative' }}>
                  <Ionicons name={esAsesor ? 'calculator-outline' : 'cart-outline'} size={23} color={color} />
                  {totalCount > 0 && (
                    <View style={styles.tabBadge}>
                      <Text style={styles.tabBadgeText}>{totalCount}</Text>
                    </View>
                  )}
                </View>
              ),
            }}
          />

          {/* 5. Perfil (Módulo de Usuario con Cierre de Sesión) */}
          <Tab.Screen
            name="PerfilTab"
            options={{
              tabBarLabel: ({ color, focused }) => (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color, fontSize: 11, fontWeight: '700' }}>Perfil</Text>
                  {focused && <View style={styles.activeIndicator} />}
                </View>
              ),
              tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={22} color={color} />,
            }}
          >
            {() => <ProfileScreen onLogout={onLogout} />}
          </Tab.Screen>
        </>
      )}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  activeIndicator: {
    width: 22,
    height: 3,
    backgroundColor: '#EF4444',
    borderRadius: 2,
    marginTop: 2,
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
  },
});
