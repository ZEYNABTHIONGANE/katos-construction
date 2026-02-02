import 'react-native-get-random-values';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';

import AppNavigator from './src/navigation/AppNavigator';
import useCustomFonts from './src/hooks/useFonts';
import ToastManager from 'toastify-react-native';
import { AuthProvider } from './src/contexts/AuthContext';

// Native splash screen will hide as soon as the JS bundle is loaded
// SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const fontsLoaded = useCustomFonts();

  return (
    <AuthProvider>
      <AppNavigator fontsLoaded={fontsLoaded} />
      <StatusBar style="light" />
      <ToastManager />
    </AuthProvider>
  );
}