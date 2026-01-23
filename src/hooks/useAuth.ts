import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { authService } from '../services/authService';
import type { FirebaseUser } from '../types/firebase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (user) => {
      setUser(user);
      setLoading(true);

      if (user) {
        try {
          const userData = await authService.getUserData(user.uid);
          setUserData(userData);
        } catch (err) {
          setError('Failed to load user data');
          console.error('Error loading user data:', err);
        }
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      await authService.signIn(email, password);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const signInWithUsername = async (username: string, password: string) => {
    try {
      setError(null);
      await authService.signInWithUsername(username, password);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const signUp = async (email: string, password: string, displayName: string, phoneNumber?: string) => {
    try {
      setError(null);
      await authService.signUp(email, password, displayName, phoneNumber);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await authService.signOut();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    user,
    userData,
    loading,
    error,
    signIn,
    signInWithUsername,
    signUp,
    signOut,
    isAuthenticated: !!user
  };
};