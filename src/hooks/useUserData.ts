'use client';

import { useDocument } from 'react-firebase-hooks/firestore';
import { doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { getUserById } from '@/lib/users';
import type { User } from '@/types/user';

/**
 * Hook to get the current user's Firestore document
 * Uses react-firebase-hooks for real-time updates
 */
export function useUserData() {
  const { user, isAuthenticated } = useAuth();
  const userDocRef = user && isAuthenticated ? doc(db, 'users', user.uid) : null;
  const [snapshot, loading, error] = useDocument(userDocRef);

  // Convert snapshot to User type
  let userData: User | null = null;
  if (snapshot?.exists()) {
    const data = snapshot.data();
    userData = {
      id: snapshot.id,
      email: data.email || '',
      name: data.name || undefined,
      trackedActivities: data.trackedActivities || undefined,
      hasSeenWelcomeModal: data.hasSeenWelcomeModal ?? false,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  }

  return {
    userData,
    loading,
    error,
  };
}
