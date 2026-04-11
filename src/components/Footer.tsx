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
    <footer className="bg-dark-light/30 border-t border-white/5 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <Link to="/" className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-xl overflow-hidden flex items-center justify-center w-10 h-10">
                <img 
                  src={logoUrl || "/logo.png"} 
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
              <span className="text-2xl font-black tracking-tighter text-white">Moonlight 🌕</span>
            </Link>
            <p className="text-gray-400 max-w-sm leading-relaxed font-medium">
              نصمم مستقبلك الرقمي باحترافية. Moonlight 🌕 يقدم أفضل الخدمات الرقمية والتصاميم العصرية لمشاريعك.
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

          <div>
            <h4 className="text-white font-black mb-6 uppercase tracking-widest text-xs">روابط سريعة</h4>
            <ul className="space-y-4 text-gray-400 font-bold text-sm">
              <li><Link to="/" className="hover:text-primary transition-colors">المتجر</Link></li>
              <li><a href="#products" className="hover:text-primary transition-colors">المنتجات</a></li>
              <li><Link to="/login" className="hover:text-primary transition-colors">تسجيل الدخول</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-black mb-6 uppercase tracking-widest text-xs">تواصل معنا</h4>
            <ul className="space-y-4 text-gray-400 font-bold text-sm">
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-primary" />
                <span>support@moonlight.com</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-primary" />
                <span>+965 69929627</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 text-center">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
            © {new Date().getFullYear()} Moonlight 🌕. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
}
