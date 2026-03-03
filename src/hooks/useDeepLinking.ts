import { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import { useInvitations } from './useInvitations';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

interface DeepLinkData {
  type: 'invitation' | 'unknown';
  token?: string;
  data?: any;
}

export const useDeepLinking = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { validateInvitation, acceptInvitation } = useInvitations();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Traiter l'URL de deep link
  const handleDeepLink = async (url: string) => {
    try {
      setIsProcessing(true);

      // Parser l'URL
      const { hostname, queryParams } = Linking.parse(url);

      if (hostname === 'invitation' && queryParams?.token) {
        await handleInvitationLink(queryParams.token as string);
      } else {
        console.log('Deep link non reconnu:', url);
      }
    } catch (error) {
      console.error('Erreur lors du traitement du deep link:', error);
      Alert.alert(
        'Erreur',
        'Impossible de traiter le lien d\'invitation',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Traiter spécifiquement un lien d'invitation
  const handleInvitationLink = async (token: string) => {
    try {
      // Naviguer directement vers l'écran d'authentification par invitation
      navigation.navigate('InvitationAuth', { token });
    } catch (error) {
      console.error('Erreur lors du traitement de l\'invitation:', error);
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors du traitement de l\'invitation',
        [{ text: 'OK' }]
      );
    }
  };

  // Écouter les deep links entrants
  useEffect(() => {
    // Gérer l'ouverture de l'app via deep link (app fermée)
    const handleInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleDeepLink(initialUrl);
      }
    };

    // Gérer les deep links quand l'app est déjà ouverte
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    handleInitialURL();

    return () => {
      subscription?.remove();
    };
  }, []);

  // Créer une URL d'invitation (utile pour les tests)
  const createInvitationURL = (token: string): string => {
    return Linking.createURL('invitation', { queryParams: { token } });
  };

  // Tester si l'app peut gérer une URL
  const canOpenURL = async (url: string): Promise<boolean> => {
    try {
      return await Linking.canOpenURL(url);
    } catch {
      return false;
    }
  };

  return {
    isProcessing,
    handleDeepLink,
    handleInvitationLink,
    createInvitationURL,
    canOpenURL
  };
};