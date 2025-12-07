import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

import { RootStackParamList, HomeTabParamList, ChefTabParamList, User } from '../types';
import { authService } from '../services/authService';
import { useClientAuth } from '../hooks/useClientAuth';

// Screens


// Chef Screens
import ChefDashboardScreen from '../screens/chef/ChefDashboardScreen';
import ChefChantiersScreen from '../screens/chef/ChefChantiersScreen';
import ChefDocumentsScreen from '../screens/chef/ChefDocumentsScreen';
import ChefChatScreen from '../screens/chef/ChefChatScreen';
import ChefProfilScreen from '../screens/chef/ChefProfilScreen';
import ChantierScreen from '../screens/main/ChantierScreen';
import ChatScreen from '../screens/main/ChatScreen';
import FinitionsScreen from '../screens/main/FinitionsScreen';
import ProfilScreen from '../screens/main/ProfilScreen';
import SplashScreen from '../screens/auth/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import ClientProjectsScreen from '../screens/main/ClientProjectsScreen';
import ClientDocumentsScreen from '../screens/main/ClientDocumentsScreen';
import HelpSupportScreen from '../screens/main/HelpSupportScreen';
import AboutScreen from '../screens/main/AboutScreen';
import HomeScreen from '../screens/main/HomeScreen';


const Stack = createNativeStackNavigator<RootStackParamList>();
const ClientTab = createBottomTabNavigator<HomeTabParamList>();
const ChefTab = createBottomTabNavigator<ChefTabParamList>();

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
              {focused && (
                <Text style={{
                  fontSize: 10,
                  fontFamily: 'FiraSans_600SemiBold',
                  color: '#2B2E83',
                  marginTop: 2,
                }}>Accueil</Text>
              )}
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
              {focused && (
                <Text style={{
                  fontSize: 10,
                  fontFamily: 'FiraSans_600SemiBold',
                  color: '#2B2E83',
                  marginTop: 2,
                }}>Chantier</Text>
              )}
            </View>
          ),
        }}
      />
      <ClientTab.Screen
        name="Chat"
        component={ChatScreen}
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
                name="chat-bubble"
                size={24}
                color={focused ? '#2B2E83' : '#9CA3AF'}
              />
              {focused && (
                <Text style={{
                  fontSize: 10,
                  fontFamily: 'FiraSans_600SemiBold',
                  color: '#2B2E83',
                  marginTop: 2,
                }}>Messages</Text>
              )}
            </View>
          ),
        }}
      />
      <ClientTab.Screen
        name="Finitions"
        component={FinitionsScreen}
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
                name="shopping-cart"
                size={24}
                color={focused ? '#2B2E83' : '#9CA3AF'}
              />
              {focused && (
                <Text style={{
                  fontSize: 10,
                  fontFamily: 'FiraSans_600SemiBold',
                  color: '#2B2E83',
                  marginTop: 2,
                }}>Finitions</Text>
              )}
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
              {focused && (
                <Text style={{
                  fontSize: 10,
                  fontFamily: 'FiraSans_600SemiBold',
                  color: '#2B2E83',
                  marginTop: 2,
                }}>Profil</Text>
              )}
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
              {focused && (
                <Text style={{
                  fontSize: 10,
                  fontFamily: 'FiraSans_600SemiBold',
                  color: '#003366',
                  marginTop: 2,
                }}>Accueil</Text>
              )}
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
              {focused && (
                <Text style={{
                  fontSize: 10,
                  fontFamily: 'FiraSans_600SemiBold',
                  color: '#003366',
                  marginTop: 2,
                }}>Chantiers</Text>
              )}
            </View>
          ),
        }}
      />
      <ChefTab.Screen
        name="ChefDocuments"
        component={ChefDocumentsScreen}
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
                name="description"
                size={24}
                color={focused ? '#2B2E83' : '#9CA3AF'}
              />
              {focused && (
                <Text style={{
                  fontSize: 10,
                  fontFamily: 'FiraSans_600SemiBold',
                  color: '#003366',
                  marginTop: 2,
                }}>Documents</Text>
              )}
            </View>
          ),
        }}
      />
      <ChefTab.Screen
        name="ChefChat"
        component={ChefChatScreen}
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
                name="chat-bubble"
                size={24}
                color={focused ? '#2B2E83' : '#9CA3AF'}
              />
              {focused && (
                <Text style={{
                  fontSize: 10,
                  fontFamily: 'FiraSans_600SemiBold',
                  color: '#003366',
                  marginTop: 2,
                }}>Messages</Text>
              )}
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
              {focused && (
                <Text style={{
                  fontSize: 10,
                  fontFamily: 'FiraSans_600SemiBold',
                  color: '#003366',
                  marginTop: 2,
                }}>Profil</Text>
              )}
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

  console.log('🏗️ AppNavigator render:', {
    isLoading,
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
        // Utilisateur connecté avec Firebase
        const userData = await authService.getUserData(user.uid);
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
    setIsLoading(false);
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

  if (isLoading) {
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
                {() => <ChefTabNavigator onLogout={handleLogout} />}
              </Stack.Screen>
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}