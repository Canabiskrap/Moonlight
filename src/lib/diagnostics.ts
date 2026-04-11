import { db, storage } from './firebase';
import { getDocs, collection } from 'firebase/firestore';
import { ref, getMetadata } from 'firebase/storage';
import { generateFixSuggestion } from '../services/geminiService';

export type Severity = 'critical' | 'warning' | 'info';

export interface DiagnosticResult {
  id: string;
  name: string;
  status: 'passed' | 'failed';
  message: string;
  severity: Severity;
}

export interface ErrorDetail {
  id: string;
  description: string;
  severity: Severity;
  rootCause: string;
  codeSnippet?: string;
}

export const runAutoScanner = async (): Promise<DiagnosticResult[]> => {
  const results: DiagnosticResult[] = [];

  // 1. Check Firebase Storage
  try {
    const storageRef = ref(storage, 'products/images');
    await getMetadata(storageRef);
    results.push({ id: 'storage', name: 'Firebase Storage', status: 'passed', message: 'Storage bucket accessible', severity: 'info' });
  } catch (e) {
    results.push({ id: 'storage', name: 'Firebase Storage', status: 'failed', message: 'Storage bucket inaccessible', severity: 'critical' });
  }

  // 2. Check Environment Variables
  const requiredEnvVars = ['VITE_GEMINI_API_KEY'];
  const missingVars = requiredEnvVars.filter(v => !(import.meta as any).env[v]);
  if (missingVars.length === 0) {
    results.push({ id: 'env', name: 'Environment Variables', status: 'passed', message: 'All required variables set', severity: 'info' });
  } else {
    results.push({ id: 'env', name: 'Environment Variables', status: 'failed', message: `Missing: ${missingVars.join(', ')}`, severity: 'critical' });
  }

  // 3. Check Firestore
  try {
    await getDocs(collection(db, 'products'));
    results.push({ id: 'firestore', name: 'Firestore Database', status: 'passed', message: 'Database accessible', severity: 'info' });
  } catch (e) {
    results.push({ id: 'firestore', name: 'Firestore Database', status: 'failed', message: 'Database inaccessible', severity: 'critical' });
  }

  return results;
};

export const detectErrors = async (): Promise<ErrorDetail[]> => {
  return []; // Placeholder for real error detection logic
};

export const generateFixPrompt = async (error: ErrorDetail): Promise<string> => {
  const prompt = `Fix this error in my Next.js + Firebase + Vercel project:
  Error: ${error.description}
  Root Cause: ${error.rootCause}
  
  Please provide the exact code snippet to fix this issue without breaking other features.`;
  
  return await generateFixSuggestion(prompt);
};

export const calculateHealthScore = (results: DiagnosticResult[]): number => {
  const total = results.length;
  if (total === 0) return 100;
  const passed = results.filter(r => r.status === 'passed').length;
  return Math.round((passed / total) * 100);
};
