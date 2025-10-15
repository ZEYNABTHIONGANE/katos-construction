// RootNavigation.tsx
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

// Puis dans ta stack navigator


import { auth } from '../services/firebase';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import HomeScreen from '../screens/Main/HomeScreen';
import ProjectsScreen from '../screens/Main/ProjectsScreen';
import CatalogScreen from '../screens/Main/CatalogScreen';
import MessagesScreen from '../screens/Main/MessagesScreen';
import MediaManagerScreen from '../screens/Main/MediaManagerScreen';


import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigation() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  if (initializing) {
    return null; // ou écran de chargement
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={user ? 'Home' : 'Login'}>
        {user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Projects" component={ProjectsScreen} />
            <Stack.Screen name="Catalog" component={CatalogScreen} />
            <Stack.Screen name="Messages" component={MessagesScreen} />
            <Stack.Screen name="MediaManager" component={MediaManagerScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />

          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
