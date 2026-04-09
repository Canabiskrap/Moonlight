import { Link } from 'react-router-dom';
import { User } from 'firebase/auth';
import { logout } from '../lib/firebase';
import { ShoppingBag, LayoutDashboard, LogOut, LogIn, Moon } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  isAdmin: boolean;
}

export default function Navbar({ user, isAdmin }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-[#0a0e1a]/95 backdrop-blur-md z-50 border-b border-white/5 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="bg-gradient-to-br from-gold to-orange-500 w-10 h-10 flex items-center justify-center rounded-xl shadow-lg shadow-gold/20 group-hover:scale-110 transition-transform">
            <Moon className="text-dark w-6 h-6 fill-current" />
          </div>
          <span className="text-2xl font-black text-white tracking-tighter">Monnlight</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/" className="text-gray-400 hover:text-white font-medium transition-colors">المتجر</Link>
          
          {isAdmin && (
            <Link 
              to="/dashboard" 
              className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-lg font-bold border border-primary/20 hover:bg-primary/20 transition-all"
            >
              <LayoutDashboard size={18} />
              لوحة التحكم
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-bold text-white leading-none">{user.displayName}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <button 
                onClick={logout}
                className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="flex items-center gap-2 text-gray-400 hover:text-white font-bold transition-colors"
            >
              <LogIn size={20} />
              دخول
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
