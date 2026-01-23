import { useState, useEffect } from 'react';
import { clientService } from '../services/clientService';
import type { FirebaseClient } from '../types/firebase';

export const useFirebaseClients = () => {
  const [clients, setClients] = useState<FirebaseClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = clientService.subscribeToClients((clients) => {
      setClients(clients);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const addClient = async (clientData: Omit<FirebaseClient, 'id' | 'createdAt'>) => {
    try {
      setError(null);
      return await clientService.addClient(clientData);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const addClientWithCredentials = async (clientData: Omit<FirebaseClient, 'id' | 'createdAt'>) => {
    try {
      setError(null);
      return await clientService.addClientWithCredentials(clientData);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateClient = async (id: string, updates: Partial<Omit<FirebaseClient, 'id' | 'createdAt'>>) => {
    try {
      setError(null);
      await clientService.updateClient(id, updates);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      setError(null);
      await clientService.deleteClient(id);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const searchClients = async (searchTerm: string) => {
    try {
      setError(null);
      return await clientService.searchClients(searchTerm);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const getClientsByStatus = async (status: FirebaseClient['status']) => {
    try {
      setError(null);
      return await clientService.getClientsByStatus(status);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    clients,
    loading,
    error,
    addClient,
    addClientWithCredentials,
    updateClient,
    deleteClient,
    searchClients,
    getClientsByStatus
  };
};

export const useFirebaseClientsByStatus = (status: FirebaseClient['status']) => {
  const [clients, setClients] = useState<FirebaseClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = clientService.subscribeToClientsByStatus(status, (clients) => {
      setClients(clients);
      setLoading(false);
    });

    return unsubscribe;
  }, [status]);

  return {
    clients,
    loading,
    error
  };
};