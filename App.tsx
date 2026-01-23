import 'react-native-get-random-values';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-gesture-handler';

import AppNavigator from './src/navigation/AppNavigator';
import useCustomFonts from './src/hooks/useFonts';
import ToastManager from 'toastify-react-native';
import { AuthProvider } from './src/contexts/AuthContext';

export default function App() {
  const fontsLoaded = useCustomFonts();

  if (!fontsLoaded) {
    return null; // or a loading screen
  }

  return (
    <AuthProvider>
      <AppNavigator />
      <StatusBar style="light" />
      <ToastManager />
    </AuthProvider>
  );
}