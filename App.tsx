import React from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-gesture-handler';

import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <>
      <RootNavigator />
      <StatusBar style="auto" />
    </>
  );
}
