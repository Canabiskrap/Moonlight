import { Link } from 'react-router-dom';
import { User } from 'firebase/auth';
import { LogIn, User as UserIcon, LogOut, LayoutDashboard, ShoppingBag } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';

interface NavbarProps {
  user: User | null;
  isAdmin: boolean;
}

export default function Navbar({ user, isAdmin }: NavbarProps) {
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
    <nav className="bg-dark/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform overflow-hidden flex items-center justify-center w-10 h-10">
              <img 
                src={logoUrl || "/logo.png"} 
                alt="Moonlight Logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  if (logoUrl) {
                    setLogoUrl(null); // Fallback to local logo
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
            <span className="text-2xl font-black tracking-tighter text-white group-hover:text-primary transition-colors">Moonlight 🌕</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">المتجر</Link>
            <a href="#products" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">المنتجات</a>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              {isAdmin && (
                <Link 
                  to="/dashboard" 
                  className="flex items-center gap-2 bg-gold/10 text-gold px-4 py-2 rounded-xl text-sm font-bold border border-gold/20 hover:bg-gold/20 transition-all"
                >
                  <LayoutDashboard size={18} />
                  <span className="hidden sm:inline">لوحة التحكم</span>
                </Link>
              )}
              
              <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                  <UserIcon size={16} className="text-primary" />
                </div>
                <span className="text-sm font-bold text-gray-300 hidden sm:inline">{user.displayName || 'مستخدم'}</span>
                <button 
                  onClick={() => auth.signOut()}
                  className="text-gray-500 hover:text-red-400 transition-colors p-1"
                  title="تسجيل الخروج"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
            >
              <LogIn size={18} />
              دخول
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
