import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

import { RootStackParamList, HomeTabParamList, ChefTabParamList, ChefStackParamList, User } from '../types';
import { authService } from '../services/authService';
import { clientService } from '../services/clientService';
import { useClientAuth } from '../hooks/useClientAuth';

// Screens


// Chef Screens
import ChefDashboardScreen from '../screens/chef/ChefDashboardScreen';
import ChefChantiersScreen from '../screens/chef/ChefChantiersScreen';
import ChefGalleryScreen from '../screens/chef/ChefGalleryScreen';
import ChefProfilScreen from '../screens/chef/ChefProfilScreen';
import ChantierScreen from '../screens/main/ChantierScreen';
import ProfilScreen from '../screens/main/ProfilScreen';
import SplashScreen from '../screens/auth/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import ClientProjectsScreen from '../screens/main/ClientProjectsScreen';
import ClientDocumentsScreen from '../screens/main/ClientDocumentsScreen';
import ClientDocumentsScreenV3 from '../screens/main/ClientDocumentsScreenV3';
import HelpSupportScreen from '../screens/main/HelpSupportScreen';
import AboutScreen from '../screens/main/AboutScreen';
import HomeScreen from '../screens/main/HomeScreen';
import PhaseDetailScreen from '../screens/main/PhaseDetailScreen';
import ChefPhaseDetailScreen from '../screens/chef/ChefPhaseDetailScreen';
import ChefChantierDetailsScreen from '../screens/chef/ChefChantierDetailsScreen';


const Stack = createNativeStackNavigator<RootStackParamList>();
const ClientTab = createBottomTabNavigator<HomeTabParamList>();
const ChefTab = createBottomTabNavigator<ChefTabParamList>();
const ChefStack = createNativeStackNavigator<ChefStackParamList>();

const ChefStackNavigator = ({ onLogout }: { onLogout: () => void }) => {
  return (
    <ChefStack.Navigator screenOptions={{ headerShown: false }}>
      <ChefStack.Screen name="ChefTabs">
        {() => <ChefTabNavigator onLogout={onLogout} />}
      </ChefStack.Screen>
      <ChefStack.Screen name="ChefPhaseDetail" component={ChefPhaseDetailScreen} />
      <ChefStack.Screen name="ChefChantierDetails" component={ChefChantierDetailsScreen} />
    </ChefStack.Navigator>
  );
};

const ClientTabNavigator = ({ onLogout }: { onLogout: () => void }) => {
  return (
    <ClientTab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#2B2E83',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          paddingTop: 12,
          paddingBottom: 12,
          height: 80,
          borderRadius: 25,
          marginHorizontal: 16,
          marginBottom: 35,
          position: 'absolute',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 20,
          elevation: 10,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        headerShown: false,
      })}
    >
      <ClientTab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: focused ? '#F0F1FF' : 'transparent',
              borderRadius: 16,
              paddingHorizontal: 12,
              paddingVertical: 8,
              minWidth: 50,
            }}>
              <MaterialIcons
                name="home"
                size={24}
                color={focused ? '#2B2E83' : '#9CA3AF'}
              />
              <Text style={{
                fontSize: 10,
                fontFamily: 'FiraSans_600SemiBold',
                color: focused ? '#2B2E83' : '#9CA3AF',
                marginTop: 2,
              }}>Accueil</Text>
            </View>
          ),
        }}
      />
      <ClientTab.Screen
        name="Chantier"
        component={ChantierScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: focused ? '#F0F1FF' : 'transparent',
              borderRadius: 16,
              paddingHorizontal: 12,
              paddingVertical: 8,
              minWidth: 50,
            }}>
              <MaterialIcons
                name="domain"
                size={24}
                color={focused ? '#2B2E83' : '#9CA3AF'}
              />
              <Text style={{
                fontSize: 10,
                fontFamily: 'FiraSans_600SemiBold',
                color: focused ? '#2B2E83' : '#9CA3AF',
                marginTop: 2,
              }}>Chantier</Text>
            </View>
          ),
        }}
      />
      <ClientTab.Screen
        name="Documents"
        component={ClientDocumentsScreenV3}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: focused ? '#F0F1FF' : 'transparent',
              borderRadius: 16,
              paddingHorizontal: 10,
              paddingVertical: 8,
              minWidth: 53,
            }}>
              <MaterialIcons
                name="description"
                size={24}
                color={focused ? '#2B2E83' : '#9CA3AF'}
              />
              <Text style={{
                fontSize: 10,
                fontFamily: 'FiraSans_600SemiBold',
                color: focused ? '#2B2E83' : '#9CA3AF',
                marginTop: 2,
              }}>Documents</Text>
            </View>
          ),
        }}
      />
      <ClientTab.Screen
        name="Profil"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: focused ? '#F0F1FF' : 'transparent',
              borderRadius: 16,
              paddingHorizontal: 12,
              paddingVertical: 8,
              minWidth: 50,
            }}>
              <MaterialIcons
                name="account-circle"
                size={24}
                color={focused ? '#2B2E83' : '#9CA3AF'}
              />
              <Text style={{
                fontSize: 10,
                fontFamily: 'FiraSans_600SemiBold',
                color: focused ? '#2B2E83' : '#9CA3AF',
                marginTop: 2,
              }}>Profil</Text>
            </View>
          ),
        }}
      >
        {(props) => <ProfilScreen {...props} onLogout={onLogout} />}
      </ClientTab.Screen>
    </ClientTab.Navigator>
  );
};

const ChefTabNavigator = ({ onLogout }: { onLogout: () => void }) => {
  return (
    <ChefTab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#2B2E83',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          paddingTop: 12,
          paddingBottom: 12,
          height: 80,
          borderRadius: 25,
          marginHorizontal: 16,
          marginBottom: 35,
          position: 'absolute',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 20,
          elevation: 10,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        headerShown: false,
      })}
    >
      <ChefTab.Screen
        name="ChefDashboard"
        component={ChefDashboardScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: focused ? '#F0F1FF' : 'transparent',
              borderRadius: 16,
              paddingHorizontal: 12,
              paddingVertical: 8,
              minWidth: 50,
            }}>
              <MaterialIcons
                name="dashboard"
                size={24}
                color={focused ? '#2B2E83' : '#9CA3AF'}
              />
              <Text style={{
                fontSize: 10,
                fontFamily: 'FiraSans_600SemiBold',
                color: focused ? '#2B2E83' : '#9CA3AF',
                marginTop: 2,
              }}>Accueil</Text>
            </View>
          ),
        }}
      />
      <ChefTab.Screen
        name="ChefChantiers"
        component={ChefChantiersScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: focused ? '#F0F1FF' : 'transparent',
              borderRadius: 16,
              paddingHorizontal: 12,
              paddingVertical: 8,
              minWidth: 50,
            }}>
              <MaterialIcons
                name="domain"
                size={24}
                color={focused ? '#2B2E83' : '#9CA3AF'}
              />
              <Text style={{
                fontSize: 10,
                fontFamily: 'FiraSans_600SemiBold',
                color: focused ? '#2B2E83' : '#9CA3AF',
                marginTop: 2,
              }}>Chantiers</Text>
            </View>
          ),
        }}
      />
      <ChefTab.Screen
        name="ChefGallery"
        component={ChefGalleryScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: focused ? '#F0F1FF' : 'transparent',
              borderRadius: 16,
              paddingHorizontal: 12,
              paddingVertical: 8,
              minWidth: 50,
            }}>
              <MaterialIcons
                name="photo-library"
                size={24}
                color={focused ? '#2B2E83' : '#9CA3AF'}
              />
              <Text style={{
                fontSize: 10,
                fontFamily: 'FiraSans_600SemiBold',
                color: focused ? '#2B2E83' : '#9CA3AF',
                marginTop: 2,
              }}>Galerie</Text>
            </View>
          ),
        }}
      />
      <ChefTab.Screen
        name="ChefProfil"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: focused ? '#F0F1FF' : 'transparent',
              borderRadius: 16,
              paddingHorizontal: 12,
              paddingVertical: 8,
              minWidth: 50,
            }}>
              <MaterialIcons
                name="account-circle"
                size={24}
                color={focused ? '#2B2E83' : '#9CA3AF'}
              />
              <Text style={{
                fontSize: 10,
                fontFamily: 'FiraSans_600SemiBold',
                color: focused ? '#2B2E83' : '#9CA3AF',
                marginTop: 2,
              }}>Profil</Text>
            </View>
          ),
        }}
      >
        {(props) => <ChefProfilScreen {...props} onLogout={onLogout} />}
      </ChefTab.Screen>
    </ChefTab.Navigator>
  );
};

export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSplashReady, setIsSplashReady] = useState(false);

  console.log('🏗️ AppNavigator render:', {
    isLoading,
    isSplashReady,
    isAuthenticated,
    currentUserRole: currentUser?.role,
    currentUserEmail: currentUser?.email
  });

  // Détecter le rôle de l'utilisateur
  const getUserRole = async (user: any): Promise<'client' | 'chef'> => {
    try {
      const userData = await authService.getUserData(user.uid);
      if (userData?.role === 'chef' || userData?.role === 'admin') {
        return 'chef';
      }

      // Si l'utilisateur a un username avec format CLI, c'est un client
      if (userData?.username && userData.username.match(/^CLI\d{9}$/)) {
        return 'client';
      }

      // Par défaut, considérer comme chef si pas de username CLI
      return userData?.email ? 'chef' : 'client';
    } catch (error) {
      console.error('Erreur lors de la détection du rôle:', error);
      return 'client';
    }
  };



  // Écouter les changements d'état d'authentification Firebase
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (user) => {
      if (user) {
        // Race condition protection: ensure user is still logged in
        const currentUser = authService.getCurrentUser();
        if (!currentUser || currentUser.uid !== user.uid) {
          console.log('⛔ preventing stale auth update');
          return;
        }

        // Utilisateur connecté avec Firebase
        try {
          const userData = await authService.getUserData(user.uid);

          // Re-check race condition after await
          const currentUserAfterFetch = authService.getCurrentUser();
          if (!currentUserAfterFetch || currentUserAfterFetch.uid !== user.uid) {
            console.log('⛔ preventing stale auth update after fetch');
            return;
          }

          // Check if this is a client account and if it is active
          if (userData?.username && userData.username.match(/^CLI\d{9}$/)) {
            // Verify client active status DIRECTLY from Firestore (source of truth)
            // This avoids race conditions where AsyncStorage session is not yet ready
            try {
              const clientData = await clientService.getClientByUserId(user.uid);

              if (clientData && clientData.isActive === false) {
                console.warn('❌ Account disabled detected in Navigator (Firestore check)');
                await authService.signOutAll();
                setCurrentUser(null);
                setIsAuthenticated(false);
                setIsLoading(false);
                return;
              }
            } catch (err) {
              console.error('Error verifying client status:', err);
            }
          }

          const userRole = await getUserRole(user);

          if (userData) {
            setCurrentUser({
              id: user.uid,
              email: user.email!,
              name: userData.displayName,
              role: userRole,
              phone: userData.phoneNumber || undefined
            });
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      } else {
        // Utilisateur déconnecté
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleContinueFromSplash = () => {
    setIsSplashReady(true);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await authService.signOutAll();
      setCurrentUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  if (isLoading || !isSplashReady) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash">
            {(props) => <SplashScreen {...props} onContinue={handleContinueFromSplash} />}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            {currentUser?.role === 'client' ? (
              <>
                <Stack.Screen name="ClientTabs">
                  {() => <ClientTabNavigator onLogout={handleLogout} />}
                </Stack.Screen>
                <Stack.Screen
                  name="PhaseDetail"
                  component={PhaseDetailScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="ClientProjects"
                  component={ClientProjectsScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="ClientDocuments"
                  component={ClientDocumentsScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="HelpSupport"
                  component={HelpSupportScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="About"
                  component={AboutScreen}
                  options={{ headerShown: false }}
                />
              </>
            ) : (
              <Stack.Screen name="ChefTabs">
                {() => <ChefStackNavigator onLogout={handleLogout} />}
              </Stack.Screen>
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}