import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase/config';
import { idNumberToEmail, emailToIdNumber } from '../utils/auth';

type UserRole = 'Administrador' | 'Coordenador' | 'Voluntário' | 'Visitante';

interface User {
  uid: string;
  idNumber: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (idNumber: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribePresence: (() => void) | null = null;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const user = {
              uid: firebaseUser.uid,
              idNumber: emailToIdNumber(firebaseUser.email || ''),
              role: userData.role as UserRole
            };
            setUser(user);
            // Set online status to true
            await setDoc(userRef, { online: true }, { merge: true });
            // Listen for window/tab close to set online to false
            const handleOffline = async () => {
              await setDoc(userRef, { online: false }, { merge: true });
            };
            window.addEventListener('beforeunload', handleOffline);
            // On sign out, set online to false
            unsubscribePresence = () => {
              window.removeEventListener('beforeunload', handleOffline);
              setDoc(userRef, { online: false }, { merge: true });
            };
          }
        } catch (err) {
          setError('Error fetching user data');
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => {
      unsubscribe();
      if (unsubscribePresence) unsubscribePresence();
    };
  }, []);

  const signIn = async (idNumber: string, password: string) => {
    try {
      setError(null);
      const email = idNumberToEmail(idNumber);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError('Failed to sign in');
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { online: false }, { merge: true });
      }
      await firebaseSignOut(auth);
    } catch (err) {
      setError('Failed to sign out');
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 