import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { ActivityIndicator, Button, SafeAreaView, Text, View } from 'react-native';

import { auth } from './src/services/firebase';
import LoginScreen from './src/screens/Auth/LoginScreen';
import RegisterScreen from './src/screens/Auth/RegisterScreen';
import { RootStackParamList } from './src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function LoadingScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
      }}
    >
      <ActivityIndicator size="large" color="#2E7D3E" />
      <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>Chargement...</Text>
    </View>
  );
}

function AccountScreen({ user }: { user: FirebaseUser }) {
  return (
    <SafeAreaView
      style={{
        flex: 1,
        padding: 24,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          backgroundColor: '#fff',
          padding: 24,
          borderRadius: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#2E7D3E', marginBottom: 12 }}>
          Bienvenue !
        </Text>
        <Text style={{ fontSize: 16, color: '#333', marginBottom: 4 }}>
          {user.email ?? 'Utilisateur sans email'}
        </Text>
        <Text style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>
          UID: {user.uid}
        </Text>
        <Button title="Se déconnecter" onPress={() => signOut(auth)} color="#2E7D3E" />
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  if (initializing) {
    return <LoadingScreen />;
  }

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: '#2E7D3E' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        >
          {user ? (
            <Stack.Screen
              name="Account"
              options={{ title: 'Mon compte' }}
            >
              {() => <AccountScreen user={user} />}
            </Stack.Screen>
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Connexion' }} />
              <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Inscription' }} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </>
  );
}
