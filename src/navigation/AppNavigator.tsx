import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { DetailScreen } from '../screens/DetailScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { BottomTabNavigator } from './BottomTabNavigator';
import { RootStackParamList } from './types';
import { StorageService } from '../services/StorageService';
import { SecurityService } from '../services/SecurityService';
import { useCart } from '../context/CartContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const { refreshCart, clearCart } = useCart();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const user = await StorageService.getSesion();
      const validation = SecurityService.validateSession(user);
      if (user && validation.valid) {
        setSessionUser(user);
        setIsAuthenticated(true);
        await refreshCart().catch(() => {});
      } else if (user) {
        await StorageService.clearSesion();
        setSessionUser(null);
        setIsAuthenticated(false);
      }
    } catch (e) {
      console.warn('Error verificando sesión en AppNavigator:', e);
      setIsAuthenticated(false);
    }
  };

  const handleLoginSuccess = async () => {
    try {
      const user = await StorageService.getSesion();
      setSessionUser(user);
      setIsAuthenticated(true);
      await refreshCart().catch(() => {});
    } catch (e) {
      console.warn('Error en handleLoginSuccess:', e);
      setIsAuthenticated(true);
    }
  };

  const handleLogout = async () => {
    await StorageService.clearSesion();
    setSessionUser(null);
    setIsAuthenticated(false);
    await clearCart();
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login">
          {() => <LoginScreen onLoginSuccess={handleLoginSuccess} />}
        </Stack.Screen>
      ) : (
        <>
          <Stack.Screen name="Main">
            {() => (
              <BottomTabNavigator
                key={sessionUser?.id || sessionUser?.username || 'user-nav'}
                user={sessionUser}
                onLogout={handleLogout}
              />
            )}
          </Stack.Screen>
          <Stack.Screen
            name="Detail"
            component={DetailScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Reports"
            component={ReportsScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};
