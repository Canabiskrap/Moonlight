import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDhlzA_YrixUXD6deyLX-_u0ksLS_97DgM",
  authDomain: "monnlight-store.firebaseapp.com",
  projectId: "monnlight-store",
  storageBucket: "monnlight-store.firebasestorage.app",
  messagingSenderId: "1069132651620",
  appId: "1:1069132651620:web:1608b1d3264ca750f01371",
  measurementId: "G-PYQZRV8603"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Helper for Google Login
export const loginWithGoogle = async () => {
  try {
    // Check if we are on mobile AND on Vercel (or not localhost)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // Force redirect on mobile devices when deployed, as popups are often blocked
    // or fail due to cross-origin isolation policies in mobile browsers.
    if (isMobile && !isLocalhost) {
      console.log("Mobile device detected on production, forcing redirect method...");
      await signInWithRedirect(auth, googleProvider);
      return null;
    }

    // Try popup first for desktop or local development
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Login Error (Popup):", error);
    
    // Fallback to redirect if popup fails
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user' || error.message.includes('Cross-Origin')) {
      console.log("Falling back to redirect method...");
      try {
        await signInWithRedirect(auth, googleProvider);
        return null; 
      } catch (redirectError) {
        console.error("Login Error (Redirect Fallback):", redirectError);
        throw redirectError;
      }
    }
    
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
