import { useState, useEffect } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { clientService } from '../services/clientService';
import type { FirebaseClient } from '../types/firebase';

export interface ClientDataState {
  clientData: FirebaseClient | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export const useClientData = (clientId: string | null) => {
  const [state, setState] = useState<ClientDataState>({
    clientData: null,
    loading: false,
    error: null,
    lastUpdated: null
  });

  useEffect(() => {
    if (!clientId) {
      setState({
        clientData: null,
        loading: false,
        error: null,
        lastUpdated: null
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    // Écouter les changements en temps réel
    const unsubscribe = onSnapshot(
      doc(db, 'clients', clientId),
      (doc) => {
        if (doc.exists()) {
          const clientData = { id: doc.id, ...doc.data() } as FirebaseClient;
          setState({
            clientData,
            loading: false,
            error: null,
            lastUpdated: new Date()
          });
        } else {
          setState({
            clientData: null,
            loading: false,
            error: 'Client non trouvé',
            lastUpdated: new Date()
          });
        }
      },
      (error) => {
        console.error('Erreur lors de l\'écoute des données client:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Erreur lors du chargement des données',
          lastUpdated: new Date()
        }));
      }
    );

    return unsubscribe;
  }, [clientId]);

  // Méthode pour rafraîchir manuellement
  const refresh = async (): Promise<boolean> => {
    if (!clientId) return false;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const freshData = await clientService.getClientById(clientId);
      if (freshData) {
        setState({
          clientData: freshData,
          loading: false,
          error: null,
          lastUpdated: new Date()
        });
        return true;
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Client non trouvé',
          lastUpdated: new Date()
        }));
        return false;
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Erreur lors du rafraîchissement',
        lastUpdated: new Date()
      }));
      return false;
    }
  };

  return {
    ...state,
    refresh
  };
};