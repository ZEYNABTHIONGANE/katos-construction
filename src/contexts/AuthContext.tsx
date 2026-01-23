import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { authService } from '../services/authService';
import { FirebaseUser } from '../types/firebase';

interface AuthContextType {
  user: User | null;
  userData: FirebaseUser | null;
  loading: boolean;
  isChef: boolean;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const userInfo = await authService.getUserData(firebaseUser.uid);
          setUserData(userInfo);
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const isChef = userData?.role === 'chef' || userData?.role === 'admin' || userData?.role === 'super_admin';

  const signOut = async () => {
    try {
      await authService.signOutAll();
      setUser(null);
      setUserData(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const deleteAccount = async (): Promise<boolean> => {
    try {
      const result = await authService.deleteAccount();
      if (result.success) {
        setUser(null);
        setUserData(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting account:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    userData,
    loading,
    isChef,
    signOut,
    deleteAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;