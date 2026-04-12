import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface VisitorInfo {
  page: string;
  source: string;
  device: string;
  productViewed?: string;
}

export async function trackVisitor(info: Partial<VisitorInfo> = {}) {
  try {
    // Detect source from referrer
    const referrer = document.referrer;
    let source = 'direct';
    
    if (referrer.includes('google') || referrer.includes('bing') || referrer.includes('yahoo')) {
      source = 'search';
    } else if (referrer.includes('facebook') || referrer.includes('instagram') || referrer.includes('twitter') || referrer.includes('tiktok')) {
      source = 'social';
    } else if (referrer.includes('wa.me') || referrer.includes('whatsapp')) {
      source = 'whatsapp';
    } else if (referrer && !referrer.includes(window.location.hostname)) {
      source = 'referral';
    }

    // Detect device type
    const userAgent = navigator.userAgent.toLowerCase();
    let device = 'desktop';
    if (/mobile|android|iphone|ipad|tablet/.test(userAgent)) {
      device = 'mobile';
    }

    await addDoc(collection(db, 'visitors'), {
      timestamp: Timestamp.now(),
      page: info.page || window.location.pathname,
      source: info.source || source,
      device: info.device || device,
      productViewed: info.productViewed || null,
      userAgent: navigator.userAgent,
      screenWidth: window.innerWidth,
    });
  } catch (error) {
    console.error('Error tracking visitor:', error);
  }
}

export async function trackProductView(productName: string) {
  await trackVisitor({
    page: window.location.pathname,
    productViewed: productName
  });
}
