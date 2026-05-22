import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  signInWithCredential,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { auth, githubProvider } from '../services/firebase';
import { createOrUpdateUser, getUser } from '../services/dbService';
import { User } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!currentUser) return;
    const profile = await getUser(currentUser.uid);
    setUserProfile(profile);
  }, [currentUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await createOrUpdateUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          provider: user.providerData[0]?.providerId === 'github.com' ? 'github' : 'google',
        });
        const profile = await getUser(user.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Google → Native Android account picker (no browser needed)
  const signInWithGoogle = async () => {
    try {
      const result = await FirebaseAuthentication.signInWithGoogle();
      const credential = GoogleAuthProvider.credential(
        result.credential?.idToken,
        result.credential?.accessToken,
      );
      await signInWithCredential(auth, credential);
    } catch (error) {
      console.error('Google sign in error:', error);
      throw new Error('Failed to sign in with Google. Please try again.');
    }
  };

  // GitHub → Opens in external Chrome browser
  const signInWithGithub = async () => {
    try {
      await signInWithPopup(auth, githubProvider);
    } catch (error) {
      console.error('GitHub sign in error:', error);
      throw new Error('Failed to sign in with GitHub. Please try again.');
    }
  };

  const signOut = async () => {
    await FirebaseAuthentication.signOut();
    await firebaseSignOut(auth);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfile,
      loading,
      signInWithGoogle,
      signInWithGithub,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
