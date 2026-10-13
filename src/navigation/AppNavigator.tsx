import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { DetailScreen } from '../screens/DetailScreen';
import { BottomTabNavigator } from './BottomTabNavigator';
import { RootStackParamList } from './types';
import { StorageService } from '../services/StorageService';
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
    const user = await StorageService.getSesion();
    if (user && user.isAuthenticated) {
      setSessionUser(user);
      setIsAuthenticated(true);
      await refreshCart();
    }
  };

  const handleLoginSuccess = async () => {
    const user = await StorageService.getSesion();
    setSessionUser(user);
    setIsAuthenticated(true);
    await refreshCart();
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
        </>
      )}
    </Stack.Navigator>
  );
};
