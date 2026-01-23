import { useState } from 'react';
import { clientService } from '../services/clientService';
import type { FirebaseClient } from '../types/firebase';

interface ClientCreationResult {
  success: boolean;
  clientId?: string;
  credentials?: {
    username: string;
    password: string;
    loginUrl: string;
  };
  error?: string;
}

export function useClientCreation() {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createClient = async (
    clientData: Omit<FirebaseClient, 'id' | 'createdAt'>
  ): Promise<ClientCreationResult> => {
    try {
      setCreating(true);
      setError(null);

      console.log('🔄 Début création client:', clientData.email);

      const result = await clientService.addClientWithCredentials(clientData);

      console.log('✅ Client créé avec succès:', {
        clientId: result.clientId,
        username: result.credentials.username
      });

      return {
        success: true,
        clientId: result.clientId,
        credentials: result.credentials
      };

    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la création du client';
      console.error('❌ Erreur création client:', errorMessage);
      setError(errorMessage);

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setCreating(false);
    }
  };

  const createClientBasic = async (
    clientData: Omit<FirebaseClient, 'id' | 'createdAt'>
  ): Promise<{ success: boolean; clientId?: string; error?: string }> => {
    try {
      setCreating(true);
      setError(null);

      const clientId = await clientService.addClient(clientData);

      return {
        success: true,
        clientId
      };

    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la création du client';
      setError(errorMessage);

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setCreating(false);
    }
  };

  const clearError = () => setError(null);

  return {
    creating,
    error,
    createClient,
    createClientBasic,
    clearError
  };
}