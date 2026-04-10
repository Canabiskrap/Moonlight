import { db, auth, storage } from '../lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, deleteObject } from 'firebase/storage';
import { convertDriveLink } from './utils';

export interface DiagnosticResult {
  status: 'ok' | 'error' | 'warning';
  message: string;
  details?: any;
}

export class SmartDiagnosticService {
  /**
   * Checks if Firebase Firestore is reachable and writable
   */
  static async checkFirestore(): Promise<DiagnosticResult> {
    try {
      const testCol = collection(db, '_diagnostics');
      const docRef = await addDoc(testCol, {
        timestamp: Timestamp.now(),
        user: auth.currentUser?.email || 'anonymous',
        type: 'health_check'
      });
      return { status: 'ok', message: 'Firestore متصل ويعمل بشكل صحيح', details: { id: docRef.id } };
    } catch (error: any) {
      return { 
        status: 'error', 
        message: 'فشل الاتصال بقاعدة البيانات (Firestore)', 
        details: error.message 
      };
    }
  }

  /**
   * Checks if Firebase Storage is reachable
   */
  static async checkStorage(): Promise<DiagnosticResult> {
    try {
      const storageRef = ref(storage, `_diagnostics/test_${Date.now()}.txt`);
      const blob = new Blob(['test'], { type: 'text/plain' });
      await uploadBytes(storageRef, blob);
      await deleteObject(storageRef);
      return { status: 'ok', message: 'خدمة التخزين (Storage) متصلة وتعمل' };
    } catch (error: any) {
      return { 
        status: 'error', 
        message: 'فشل الاتصال بخدمة التخزين (Storage). قد يكون الـ Bucket غير صحيح.', 
        details: error.message 
      };
    }
  }

  /**
   * Validates a URL and checks if it's a Google Drive link that needs conversion
   */
  static validateImageUrl(url: string): DiagnosticResult {
    if (!url) return { status: 'warning', message: 'لا يوجد رابط للصورة' };
    
    if (url.includes('drive.google.com')) {
      const converted = convertDriveLink(url);
      if (converted !== url) {
        return { 
          status: 'ok', 
          message: 'تم اكتشاف رابط Google Drive وتصحيحه تلقائياً', 
          details: { original: url, fixed: converted } 
        };
      }
    }
    
    if (!url.startsWith('http')) {
      return { status: 'error', message: 'الرابط غير صالح (يجب أن يبدأ بـ http أو https)' };
    }

    return { status: 'ok', message: 'الرابط يبدو صالحاً' };
  }

  /**
   * Attempts to automatically fix common issues in a product object
   */
  static async autoFixProduct(product: any): Promise<{ fixed: any, changes: string[] }> {
    const changes: string[] = [];
    const fixed = { ...product };

    // 1. Fix Image URL
    if (fixed.imageUrl && fixed.imageUrl.includes('drive.google.com')) {
      const converted = convertDriveLink(fixed.imageUrl);
      if (converted !== fixed.imageUrl) {
        fixed.imageUrl = converted;
        changes.push('تم تصحيح رابط صورة Google Drive');
      }
    }

    // 2. Fix Download URL
    if (fixed.downloadUrl && fixed.downloadUrl.includes('drive.google.com')) {
      // For download links, we might want to ensure it's a direct download link if possible
      // but usually users want the original link. We just log it for now.
    }

    // 3. Ensure HTTPS
    if (fixed.imageUrl && !fixed.imageUrl.startsWith('http') && fixed.imageUrl.includes('.')) {
      fixed.imageUrl = `https://${fixed.imageUrl}`;
      changes.push('إضافة https:// لرابط الصورة');
    }

    return { fixed, changes };
  }

  /**
   * Runs a full diagnostic suite and attempts auto-fixes for the current session
   */
  static async runFullDiagnostic() {
    console.log('--- بدء الفحص الذكي للنظام ---');
    const firestore = await this.checkFirestore();
    const storage = await this.checkStorage();
    
    const results = {
      firestore,
      storage,
      auth: {
        status: auth.currentUser ? 'ok' : 'warning',
        message: auth.currentUser ? `مسجل دخول بـ ${auth.currentUser.email}` : 'لم يتم تسجيل الدخول'
      }
    };

    console.table(results);
    return results;
  }
}
