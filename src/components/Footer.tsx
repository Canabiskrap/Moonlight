import { ShoppingBag, Instagram, Twitter, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Footer() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'appearance'), (doc) => {
      if (doc.exists()) {
        setLogoUrl(doc.data().logoUrl);
      }
    });
    return () => unsub();
  }, []);

  return (
    <footer className="relative mt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="glass-card rounded-[3rem] p-12 grid grid-cols-1 md:grid-cols-4 gap-12 border-white/5">
          <div className="md:col-span-2 space-y-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 overflow-hidden">
                <img 
                  src={logoUrl || "https://i.ibb.co/6cJ5wS0h/nf9gthbcbxrmw0cxg8993rpk28-result-0.png"} 
                  alt="Moonlight Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    if (logoUrl) {
                      setLogoUrl(null);
                    } else {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        const icon = document.createElement('div');
                        icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shopping-bag text-white"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>';
                        parent.appendChild(icon.firstChild!);
                      }
                    }
                  }}
                />
              </div>
              <span className="text-2xl font-black tracking-tighter">MOONLIGHT</span>
            </Link>
            <p className="text-gray-500 font-medium leading-relaxed max-w-sm">
              نحن نؤمن بأن كل فكرة تستحق أن تظهر بأفضل صورة ممكنة. Moonlight هو شريكك في رحلة النجاح الرقمي.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all">
                <Instagram size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all">
                <Twitter size={20} />
              </a>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-sm font-black uppercase tracking-widest text-primary">روابط سريعة</h4>
            <ul className="space-y-4">
              <li><Link to="/" className="text-gray-400 hover:text-white font-bold transition-colors">الرئيسية</Link></li>
              <li><a href="/#products" className="text-gray-400 hover:text-white font-bold transition-colors">المنتجات</a></li>
              <li><a href="/#services" className="text-gray-400 hover:text-white font-bold transition-colors">خدماتنا</a></li>
              <li><Link to="/terms" className="text-gray-400 hover:text-white font-bold transition-colors">الشروط والأحكام</Link></li>
              <li><Link to="/privacy" className="text-gray-400 hover:text-white font-bold transition-colors">سياسة الخصوصية</Link></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-sm font-black uppercase tracking-widest text-primary">تواصل معنا</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-gray-400 font-bold">
                <Mail size={18} className="text-primary" />
                <span>esraa0badr@gmail.com</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400 font-bold">
                <Phone size={18} className="text-primary" />
                <span>+965 69929627</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 text-center text-gray-600 text-xs font-black uppercase tracking-[0.3em]">
          &copy; {new Date().getFullYear()} Moonlight Store. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
