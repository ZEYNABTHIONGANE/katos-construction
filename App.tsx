import React from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-gesture-handler';

import AppNavigator from './src/navigation/AppNavigator';
import useCustomFonts from './src/hooks/useFonts';

export default function App() {
  const fontsLoaded = useCustomFonts();

  if (!fontsLoaded) {
    return null; // or a loading screen
  }

  return (
    <>
      <AppNavigator />
      <StatusBar style="light" />
    </>
  );
}