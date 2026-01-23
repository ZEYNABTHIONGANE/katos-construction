import { useFonts } from 'expo-font';
import {
  FiraSans_400Regular,
  FiraSans_600SemiBold,
  FiraSans_700Bold,
} from '@expo-google-fonts/fira-sans';

export default function useCustomFonts() {
  const [fontsLoaded] = useFonts({
    FiraSans_400Regular,
    FiraSans_600SemiBold,
    FiraSans_700Bold,
  });

  return fontsLoaded;
}