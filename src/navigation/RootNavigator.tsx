import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, Text } from 'react-native';

import { useAuthUser } from '../hooks/useAuthUser';

// Import des écrans
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import GalleryScreen from '../screens/GalleryScreen';
import SelectionsScreen from '../screens/SelectionsScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Types pour la navigation
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppTabsParamList = {
  Home: undefined;
  Chat: undefined;
  Gallery: undefined;
  Selections: undefined;
  Profile: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppTabs = createBottomTabNavigator<AppTabsParamList>();

// Stack d'authentification
function AuthStackNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#2E7D3E' },
        headerTintColor: 'white',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'Connexion' }}
      />
      <AuthStack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: 'Inscription' }}
      />
    </AuthStack.Navigator>
  );
}

// Tabs principales de l'app
function AppTabsNavigator() {
  return (
    <AppTabs.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: 'white' },
        tabBarActiveTintColor: '#2E7D3E',
        tabBarInactiveTintColor: 'gray',
        headerStyle: { backgroundColor: '#2E7D3E' },
        headerTintColor: 'white',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <AppTabs.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Accueil',
          tabBarLabel: 'Accueil'
        }}
      />
      <AppTabs.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          title: 'Messages',
          tabBarLabel: 'Chat'
        }}
      />
      <AppTabs.Screen
        name="Gallery"
        component={GalleryScreen}
        options={{
          title: 'Galerie',
          tabBarLabel: 'Galerie'
        }}
      />
      <AppTabs.Screen
        name="Selections"
        component={SelectionsScreen}
        options={{
          title: 'Sélections',
          tabBarLabel: 'Sélections'
        }}
      />
      <AppTabs.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profil',
          tabBarLabel: 'Profil'
        }}
      />
    </AppTabs.Navigator>
  );
}

// Écran de chargement
function LoadingScreen() {
  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f5f5f5'
    }}>
      <ActivityIndicator size="large" color="#2E7D3E" />
      <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>
        Chargement...
      </Text>
    </View>
  );
}

// Navigateur principal avec guard d'authentification
export default function RootNavigator() {
  const { isAuthenticated, isLoading, appUser } = useAuthUser();

  // Affichage du loading pendant l'initialisation
  if (isLoading) {
    return <LoadingScreen />;
  }

  console.log('🔄 RootNavigator - Auth state:', {
    isAuthenticated,
    userRole: appUser?.role,
    isLoading,
  });

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppTabsNavigator /> : <AuthStackNavigator />}
    </NavigationContainer>
  );
}