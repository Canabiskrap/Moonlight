import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { 
  initializeFirestore,
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  Timestamp,
  getDocFromServer
} from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

/**
 * Firebase Configuration
 * Pulls from Vite environment variables (VITE_*) with fallback to the local config file.
 */
const firebaseConfigValues = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
};

const app = initializeApp(firebaseConfigValues);

/**
 * Firestore Initialization
 * Using experimentalForceLongPolling: true to ensure stability in restricted network environments 
 * or where WebSockets might be blocked by proxy/firewalls (fixes 'Firebase Client Offline' errors).
 */
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export { db };
export const auth = getAuth(app);

export { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  Timestamp 
};

// Ensure session persistence for a smooth user experience
setPersistence(auth, browserLocalPersistence).catch(err => {
  // Only log critical auth errors
  if (import.meta.env.DEV) console.error("Firebase Persistence Error:", err);
});

export const storage = getStorage(app, (firebaseConfig as any).storageBucket);
export const googleProvider = new GoogleAuthProvider();

// Prevent silent failures by allowing account selection
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Google Authentication Helper
 */
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (import.meta.env.DEV) console.error("Google Login Error:", error);
    throw error;
  }
};

export const logout = () => signOut(auth);

/**
 * Cloud Storage File Upload Helper
 */
export const uploadFile = async (
  file: File, 
  path: string, 
  onProgress?: (progress: number) => void
) => {
  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file);
  
  if (onProgress) {
    uploadTask.on('state_changed', (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      onProgress(progress);
    });
  }
  
  await uploadTask;
  return getDownloadURL(storageRef);
};

/**
 * Cloud Storage File Deletion Helper
 */
export const deleteFile = async (url: string) => {
  try {
    if (url.includes('firebasestorage.googleapis.com')) {
      const storageRef = ref(storage, url);
      await deleteObject(storageRef);
    }
  } catch (error) {
    if (import.meta.env.DEV) console.error("Error deleting file:", error);
  }
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: any[];
  }
}

/**
 * Centralized Firestore Error Handler
 * Standardizes security and connectivity error responses.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  
  if (import.meta.env.DEV) console.error('Firestore Error Detailed Info:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Backend Connectivity Diagnostic
 * Runs on initialization to verify if Firestore is reachable.
 */
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    const errorMsg = error?.message?.toLowerCase() || "";
    if (errorMsg.includes('offline')) {
      console.error("❌ Firebase Connectivity Alert: The client is currently offline. Please verify network settings or ad-blocker configurations.");
    }
  }
}

// Perform initial connection test in non-production builds
if (import.meta.env.DEV) {
  testConnection();
}
