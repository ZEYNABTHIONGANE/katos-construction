import { create } from 'zustand';
import { User } from 'firebase/auth';
import { User as AppUser } from '../types/user';

/**
 * Store Zustand pour gérer la session utilisateur
 */

interface SessionState {
  // État d'authentification
  firebaseUser: User | null;
  appUser: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setFirebaseUser: (user: User | null) => void;
  setAppUser: (user: AppUser | null) => void;
  setLoading: (loading: boolean) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  // État initial
  firebaseUser: null,
  appUser: null,
  isAuthenticated: false,
  isLoading: true,

  // Actions
  setFirebaseUser: (user: User | null) => {
    set({
      firebaseUser: user,
      isAuthenticated: !!user,
    });
  },

  setAppUser: (user: AppUser | null) => {
    set({ appUser: user });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  clearSession: () => {
    set({
      firebaseUser: null,
      appUser: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
}));

// Sélecteurs pour un accès plus propre
export const selectIsAuthenticated = (state: SessionState) => state.isAuthenticated;
export const selectFirebaseUser = (state: SessionState) => state.firebaseUser;
export const selectAppUser = (state: SessionState) => state.appUser;
export const selectIsLoading = (state: SessionState) => state.isLoading;