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
import { ReportsScreen } from '../screens/ReportsScreen';
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
  const esAdmin = rolActivo === 'Administrador' || rolActivo === 'Almacenero';

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
      {esAdmin ? (
        <>
          <Tab.Screen
            name="InicioTab"
            component={WarehouseDispatchScreen}
            options={{
              tabBarLabel: ({ color, focused }) => (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color, fontSize: 11, fontWeight: '700' }}>Pedidos</Text>
                  {focused && <View style={[styles.activeIndicator, { backgroundColor: '#059669' }]} />}
                </View>
              ),
              tabBarIcon: ({ color }) => <Ionicons name="cube-outline" size={22} color={color} />,
            }}
          />

          <Tab.Screen
            name="PreOrdenTab"
            component={WarehouseStockScreen}
            options={{
              tabBarLabel: ({ color, focused }) => (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color, fontSize: 11, fontWeight: '700' }}>Inventario</Text>
                  {focused && <View style={[styles.activeIndicator, { backgroundColor: '#059669' }]} />}
                </View>
              ),
              tabBarIcon: ({ color }) => <Ionicons name="clipboard-outline" size={22} color={color} />,
            }}
          />

          <Tab.Screen
            name="ReportesTab"
            component={ReportsScreen}
            options={{
              tabBarLabel: ({ color, focused }) => (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color, fontSize: 11, fontWeight: '700' }}>Reportes</Text>
                  {focused && <View style={[styles.activeIndicator, { backgroundColor: '#059669' }]} />}
                </View>
              ),
              tabBarIcon: ({ color }) => <Ionicons name="bar-chart-outline" size={22} color={color} />,
            }}
          />

          <Tab.Screen
            name="CategoriasTab"
            component={CategoriesScreen}
            options={{
              tabBarLabel: ({ color, focused }) => (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color, fontSize: 11, fontWeight: '700' }}>Catálogo</Text>
                  {focused && <View style={[styles.activeIndicator, { backgroundColor: '#059669' }]} />}
                </View>
              ),
              tabBarIcon: ({ color }) => <Ionicons name="grid-outline" size={22} color={color} />,
            }}
          />

          <Tab.Screen
            name="PerfilTab"
            options={{
              tabBarLabel: ({ color, focused }) => (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color, fontSize: 11, fontWeight: '700' }}>Perfil</Text>
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
                <Ionicons name={esAsesor ? 'storefront-outline' : 'home-outline'} size={22} color={color} />
              ),
            }}
          >
            {(props) => <CatalogScreen {...props} onLogout={onLogout} />}
          </Tab.Screen>

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

          <Tab.Screen
            name="FavoritosTab"
            component={SavedFavoritesScreen}
            options={{
              tabBarLabel: ({ color, focused }) => (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color, fontSize: 11, fontWeight: '700' }}>
                    {esAsesor ? 'Rotación' : 'Favoritos'}
                  </Text>
                  {focused && <View style={styles.activeIndicator} />}
                </View>
              ),
              tabBarIcon: ({ color }) => (
                <Ionicons name={esAsesor ? 'star-outline' : 'heart-outline'} size={22} color={color} />
              ),
            }}
          />

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
