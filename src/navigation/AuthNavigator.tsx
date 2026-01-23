import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useClientAuth } from '../hooks/useClientAuth';
import { useDeepLinking } from '../hooks/useDeepLinking';

// Screens
import SplashScreen from '../screens/auth/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import InvitationAuthScreen from '../screens/auth/InvitationAuthScreen';
import CreatePINScreen from '../screens/auth/CreatePINScreen';
import ClientProfileScreen from '../screens/ClientProfileScreen';

// Navigation types
import type { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AuthNavigator() {
  const { session, loading, isAuthenticated, requiresPIN } = useClientAuth();

  // Initialiser le deep linking
  useDeepLinking();

  if (loading) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated && session ? (
        // Utilisateur connecté via invitation
        <>
          <Stack.Screen name="Main" component={ClientProfileScreen} />
          <Stack.Screen name="ClientProfile" component={ClientProfileScreen} />
        </>
      ) : requiresPIN ? (
        // PIN requis pour se reconnecter
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            initialParams={{ showPINLogin: true }}
          />
          <Stack.Screen name="InvitationAuth" component={InvitationAuthScreen} />
        </>
      ) : (
        // Aucune session active
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="InvitationAuth" component={InvitationAuthScreen} />
          <Stack.Screen name="CreatePIN" component={CreatePINScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}