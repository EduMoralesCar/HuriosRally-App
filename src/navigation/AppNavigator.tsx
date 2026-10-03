import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { DetailScreen } from '../screens/DetailScreen';
import { BottomTabNavigator } from './BottomTabNavigator';
import { RootStackParamList } from './types';
import { StorageService } from '../services/StorageService';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [sessionUser, setSessionUser] = useState<any>(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const user = await StorageService.getSesion();
    if (user && user.isAuthenticated) {
      setSessionUser(user);
      setIsAuthenticated(true);
    }
  };

  const handleLoginSuccess = async () => {
    const user = await StorageService.getSesion();
    setSessionUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await StorageService.clearSesion();
    setSessionUser(null);
    setIsAuthenticated(false);
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
