import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut, setPersistence, browserLocalPersistence, getRedirectResult } from 'firebase/auth';
import { 
  getFirestore, 
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
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Use environment variables if available (prefixed with VITE_ for client-side)
// Fallback to the values in firebase-applet-config.json
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || (firebaseConfig as any).firestoreDatabaseId
};

const app = initializeApp(config);
export const db = getFirestore(app, config.firestoreDatabaseId);
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

// Set persistence to local to ensure session survives redirects and refreshes
setPersistence(auth, browserLocalPersistence).catch(err => console.error("Persistence Error:", err));

export const storage = getStorage(app, (firebaseConfig as any).storageBucket);
console.log("Firebase Storage initialized with bucket:", (firebaseConfig as any).storageBucket);
export const googleProvider = new GoogleAuthProvider();
// Force select account to avoid silent failures
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Helper for Google Login
export const loginWithGoogle = async () => {
  console.log("Attempting Google Login...");
  try {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isIframe = window.self !== window.top;

    console.log("Environment check:", { isMobile, isIframe });

    // In iframes, popups are often blocked. Redirect is safer but reloads the page.
    // However, on Vercel (not an iframe), popup is usually better.
    
    if (isIframe) {
      console.log("In iframe, using signInWithRedirect...");
      await signInWithRedirect(auth, googleProvider);
      return null;
    }

    try {
      console.log("Attempting signInWithPopup...");
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Login success:", result.user.email);
      return result.user;
    } catch (popupError: any) {
      console.error("Popup Login Error:", popupError);
      
      if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/popup-closed-by-user' || popupError.code === 'auth/cancelled-popup-request') {
        console.log("Popup blocked or closed, falling back to signInWithRedirect...");
        await signInWithRedirect(auth, googleProvider);
        return null;
      }
      
      throw popupError;
    }
  } catch (error: any) {
    console.error("General Login Error:", error);
    throw error;
  }
};

// Helper for Logout
export const logout = () => signOut(auth);

// Helper for File Upload
export const uploadFile = async (file: File, path: string) => {
  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file);
  await uploadTask;
  return getDownloadURL(storageRef);
};

// Helper for File Deletion
export const deleteFile = async (url: string) => {
  try {
    // Only attempt to delete if it's a Firebase Storage URL
    if (url.includes('firebasestorage.googleapis.com')) {
      const storageRef = ref(storage, url);
      await deleteObject(storageRef);
    }
  } catch (error) {
    console.error("Error deleting file:", error);
    // We don't throw here to prevent blocking document deletion if file is already gone
  }
};

// Error handling for Firestore
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
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
