import { useEffect } from 'react';

declare global {
  interface Window {
    Tawk_API: any;
    Tawk_LoadStart: Date;
  }
}

export default function TawkChat() {
  useEffect(() => {
    try {
      // Tawk.to Property ID from user: 69e33705a603381c3186c7b5
      const propertyId = '69e33705a603381c3186c7b5';

      window.Tawk_API = window.Tawk_API || {};
      window.Tawk_LoadStart = new Date();

      const s1 = document.createElement("script");
      const s0 = document.getElementsByTagName("script")[0];
      
      s1.async = true;
      s1.src = `https://embed.tawk.to/${propertyId}/default`;
      s1.charset = 'UTF-8';
      s1.setAttribute('crossorigin', '*');
      
      s1.onerror = () => {
        console.warn("Tawk.to script failed to load");
      };
      
      if (s0 && s0.parentNode) {
        s0.parentNode.insertBefore(s1, s0);
      } else {
        document.head.appendChild(s1);
      }
    } catch (e) {
      console.error("Tawk.to initialization failed", e);
    }

    return () => {
      // Cleanup if necessary
    };
  }, []);

  return null;
}
