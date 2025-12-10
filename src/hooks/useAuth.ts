'use client';

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth';
import { createUser } from '@/lib/users';

/**
 * Hook to get the current authentication state
 * Returns the user, loading state, and error
 */
export function useAuth() {
  const [user, loading, error] = useAuthState(auth);

  return {
    user: user as FirebaseUser | null,
    loading,
    error,
    isAuthenticated: !!user,
  };
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message || 'Failed to sign in' };
  }
}

/**
 * Sign up with email and password
 * Creates a Firebase Auth user and a corresponding Firestore user document
 */
export async function signUp(email: string, password: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Create user document in Firestore using the Firebase Auth UID
    // Mark as new user (hasSeenWelcomeModal = false)
    try {
      await createUser(
        {
          email: userCredential.user.email || email,
          hasSeenWelcomeModal: false
        },
        userCredential.user.uid
      );
    } catch (firestoreError: any) {
      // If Firestore creation fails, log it but don't fail the signup
      // The user is already authenticated, so they can still use the app
      console.error('Error creating Firestore user document:', firestoreError);
    }

    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message || 'Failed to sign up' };
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  try {
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error: any) {
    return { error: error.message || 'Failed to sign out' };
  }
}
