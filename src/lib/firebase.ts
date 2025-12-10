import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { isBrowser } from "./utils";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCAf3bEIuDWFzQu5EvzAiM5JFMumse26Y4",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "tadpole-43fab.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "tadpole-43fab",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "tadpole-43fab.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "59068092652",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:59068092652:web:47415b438af4a1314595c9",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-XFJLYQZF09",
};

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firestore
db = getFirestore(app);

// Enable persistence on client-side for better offline support and connection stability
if (isBrowser()) {
  try {
    enableIndexedDbPersistence(db).catch((error: any) => {
      // Ignore errors if persistence is already enabled (e.g., in another tab)
      if (error.code !== 'failed-precondition' && error.code !== 'unimplemented') {
        console.warn('Firestore persistence error:', error);
      }
    });
  } catch (error) {
    // Ignore persistence errors during initialization
  }
}

// Initialize Auth (can be used on both server and client)
auth = getAuth(app);

export { app, db, auth };
export default app;
