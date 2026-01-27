import 'react-native-get-random-values';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';

import AppNavigator from './src/navigation/AppNavigator';
import useCustomFonts from './src/hooks/useFonts';
import ToastManager from 'toastify-react-native';
import { AuthProvider } from './src/contexts/AuthContext';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might cause this to error */
});

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