import React, { useEffect } from 'react';
import { useDeepLinking } from '../hooks/useDeepLinking';
import { useAuth } from '../hooks/useAuth';
import { Alert } from 'react-native';

interface DeepLinkHandlerProps {
  children: React.ReactNode;
}

/**
 * Composant qui gère les deep links de manière globale
 * À placer au niveau racine de l'app, après l'authentification
 */
export const DeepLinkHandler: React.FC<DeepLinkHandlerProps> = ({ children }) => {
  const { user } = useAuth();
  const { isProcessing } = useDeepLinking();

  // Vérifier que l'utilisateur est connecté avant de traiter les deep links
  useEffect(() => {
    if (!user && isProcessing) {
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté pour accepter une invitation. Veuillez vous connecter puis réessayer.',
        [{ text: 'OK' }]
      );
    }
  }, [user, isProcessing]);

  return <>{children}</>;
};