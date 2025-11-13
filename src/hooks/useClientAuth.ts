import { useState, useEffect } from 'react';
import { authService, ClientSession } from '../services/authService';
import { Toast } from 'toastify-react-native';

export interface ClientAuthState {
  session: ClientSession | null;
  loading: boolean;
  isAuthenticated: boolean;
  requiresPIN: boolean;
}

export const useClientAuth = () => {
  const [authState, setAuthState] = useState<ClientAuthState>({
    session: null,
    loading: true,
    isAuthenticated: false,
    requiresPIN: false
  });

  // Vérifier l'état d'authentification au démarrage
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));

      const autoLoginResult = await authService.autoLoginClient();

      if (autoLoginResult.success && autoLoginResult.session) {
        // Connexion automatique réussie
        setAuthState({
          session: autoLoginResult.session,
          loading: false,
          isAuthenticated: true,
          requiresPIN: false
        });
      } else if (autoLoginResult.requiresPIN) {
        // PIN requis
        setAuthState({
          session: null,
          loading: false,
          isAuthenticated: false,
          requiresPIN: true
        });
      } else {
        // Aucune session active
        setAuthState({
          session: null,
          loading: false,
          isAuthenticated: false,
          requiresPIN: false
        });
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'authentification:', error);
      setAuthState({
        session: null,
        loading: false,
        isAuthenticated: false,
        requiresPIN: false
      });
    }
  };

  // Authentification avec token d'invitation
  const authenticateWithInvitation = async (token: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));

      const result = await authService.authenticateWithInvitationToken(token);

      if (result.success && result.session) {
        setAuthState({
          session: result.session,
          loading: false,
          isAuthenticated: true,
          requiresPIN: false
        });

        Toast.success(`Bienvenue ${result.session.clientData.prenom} !`);
        return true;
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
        Toast.error(result.reason || 'Erreur de connexion');
        return false;
      }
    } catch (error) {
      console.error('Erreur d\'authentification:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
      Toast.error('Erreur de connexion');
      return false;
    }
  };

  // Connexion avec PIN
  const loginWithPIN = async (pin: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));

      const result = await authService.loginWithPIN(pin);

      if (result.success && result.session) {
        setAuthState({
          session: result.session,
          loading: false,
          isAuthenticated: true,
          requiresPIN: false
        });

        Toast.success(`Bonjour ${result.session.clientData.prenom} !`);
        return true;
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
        Toast.error(result.reason || 'Code PIN incorrect');
        return false;
      }
    } catch (error) {
      console.error('Erreur de connexion avec PIN:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
      Toast.error('Erreur de connexion');
      return false;
    }
  };

  // Créer un code PIN
  const createPIN = async (pin: string): Promise<boolean> => {
    try {
      const success = await authService.createPIN(pin);
      if (success) {
        Toast.success('Code PIN créé avec succès');
        return true;
      } else {
        Toast.error('Erreur lors de la création du PIN');
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la création du PIN:', error);
      Toast.error('Erreur lors de la création du PIN');
      return false;
    }
  };

  // Vérifier si un PIN existe
  const hasPIN = async (): Promise<boolean> => {
    return await authService.hasPIN();
  };

  // Rafraîchir les données client
  const refreshClientData = async (): Promise<boolean> => {
    try {
      const success = await authService.refreshClientData();
      if (success) {
        // Recharger la session mise à jour
        const session = await authService.getCurrentClientSession();
        if (session) {
          setAuthState(prev => ({ ...prev, session }));
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
      return false;
    }
  };

  // Déconnexion
  const logout = async (): Promise<void> => {
    try {
      await authService.signOutAll();
      setAuthState({
        session: null,
        loading: false,
        isAuthenticated: false,
        requiresPIN: false
      });
      Toast.success('Déconnecté avec succès');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      Toast.error('Erreur lors de la déconnexion');
    }
  };

  // Supprimer le compte
  const deleteAccount = async (): Promise<boolean> => {
    try {
      const session = authState.session;
      if (!session) {
        Toast.error('Aucune session active');
        return false;
      }

      const result = await authService.deleteClientAccount(session.clientId);
      if (result.success) {
        setAuthState({
          session: null,
          loading: false,
          isAuthenticated: false,
          requiresPIN: false
        });
        Toast.success('Compte supprimé avec succès');
        return true;
      } else {
        Toast.error(result.reason || 'Erreur lors de la suppression');
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du compte:', error);
      Toast.error('Erreur lors de la suppression du compte');
      return false;
    }
  };

  return {
    // État
    ...authState,

    // Méthodes
    authenticateWithInvitation,
    loginWithPIN,
    createPIN,
    hasPIN,
    refreshClientData,
    logout,
    deleteAccount,
    checkAuthStatus
  };
};