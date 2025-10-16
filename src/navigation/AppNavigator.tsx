import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

import { RootStackParamList, HomeTabParamList } from '../types';

// Screens
import SplashScreen from '../screens/auth/SplashScreen.simple';
import LoginScreen from '../screens/auth/LoginScreen';
import HomeScreen from '../screens/main/HomeScreen';
import ChantierScreen from '../screens/main/ChantierScreen';
import ChatScreen from '../screens/main/ChatScreen';
import FinitionsScreen from '../screens/main/FinitionsScreen';
import ProfilScreen from '../screens/main/ProfilScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<HomeTabParamList>();

const TabNavigator = ({ onLogout }: { onLogout: () => void }) => {
  return (
    <Tab.Navigator
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
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: focused ? '#E8E9F7' : 'transparent',
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
      <Tab.Screen
        name="Chantier"
        component={ChantierScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: focused ? '#E8E9F7' : 'transparent',
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
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: focused ? '#E8E9F7' : 'transparent',
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
      <Tab.Screen
        name="Finitions"
        component={FinitionsScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: focused ? '#E8E9F7' : 'transparent',
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
      <Tab.Screen
        name="Profil"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: focused ? '#E8E9F7' : 'transparent',
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
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} onLogin={handleLogin} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="HomeTabs">
            {() => <TabNavigator onLogout={handleLogout} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}