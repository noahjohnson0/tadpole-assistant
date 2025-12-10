import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import type { User, UserData } from "@/types/user";
import type { TrackedActivity } from "@/types/tracked-activity";

const USERS_COLLECTION = "users";

/**
 * Convert Firestore Timestamp to Date
 */
function timestampToDate(timestamp: any): Date {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date();
}

/**
 * Convert Firestore document to User
 */
function docToUser(docId: string, data: any): User {
  return {
    id: docId,
    email: data.email,
    name: data.name || undefined,
    trackedActivities: data.trackedActivities || undefined,
    hasSeenWelcomeModal: data.hasSeenWelcomeModal ?? false,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
  };
}

/**
 * Get a user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    if (!userDoc.exists()) {
      return null;
    }
    return docToUser(userDoc.id, userDoc.data());
  } catch (error) {
    console.error("Error getting user:", error);
    throw error;
  }
}

/**
 * Get a user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const q = query(collection(db, USERS_COLLECTION), where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const userDoc = querySnapshot.docs[0];
    return docToUser(userDoc.id, userDoc.data());
  } catch (error) {
    console.error("Error getting user by email:", error);
    throw error;
  }
}

/**
 * Get all users
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
    return querySnapshot.docs.map((doc) => docToUser(doc.id, doc.data()));
  } catch (error) {
    console.error("Error getting all users:", error);
    throw error;
  }
}

/**
 * Create a new user
 * @param userData - User data to create
 * @param userId - Optional user ID (e.g., Firebase Auth UID). If not provided, a random ID will be generated.
 */
export async function createUser(userData: UserData, userId?: string): Promise<User> {
  try {
    const now = Timestamp.now();
    const userRef = userId
      ? doc(db, USERS_COLLECTION, userId)
      : doc(collection(db, USERS_COLLECTION));

    const data = {
      email: userData.email,
      name: userData.name || null,
      trackedActivities: userData.trackedActivities || null,
      hasSeenWelcomeModal: userData.hasSeenWelcomeModal ?? false,
      createdAt: userData.createdAt ? Timestamp.fromDate(userData.createdAt) : now,
      updatedAt: userData.updatedAt ? Timestamp.fromDate(userData.updatedAt) : now,
    };

    await setDoc(userRef, data);
    return docToUser(userRef.id, data);
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

/**
 * Update a user
 */
export async function updateUser(userId: string, userData: Partial<UserData>): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const updateData: any = {
      updatedAt: Timestamp.now(),
    };

    if (userData.email !== undefined) updateData.email = userData.email;
    if (userData.name !== undefined) updateData.name = userData.name || null;
    if (userData.trackedActivities !== undefined) updateData.trackedActivities = userData.trackedActivities || null;
    if (userData.hasSeenWelcomeModal !== undefined) updateData.hasSeenWelcomeModal = userData.hasSeenWelcomeModal;

    await updateDoc(userRef, updateData);
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

/**
 * Delete a user
 */
export async function deleteUser(userId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, USERS_COLLECTION, userId));
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

/**
 * Update tracked activities for a user
 */
export async function updateTrackedActivities(
  userId: string,
  trackedActivities: TrackedActivity[]
): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      trackedActivities: trackedActivities,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating tracked activities:", error);
    throw error;
  }
}
