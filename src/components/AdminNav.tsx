import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Activity, Settings, LogOut } from 'lucide-react';
import { logout } from '@/lib/firebase';

const navItems = [
  { name: 'لوحة التحكم', path: '/admin', icon: LayoutDashboard },
  { name: 'إدارة المنتجات', path: '/admin/products', icon: Package },
  { name: 'إدارة الطلبات', path: '/admin/orders', icon: ShoppingCart },
  { name: 'نظام التشخيص', path: '/admin/diagnostics', icon: Activity },
  { name: 'إعدادات المتجر', path: '/admin/settings', icon: Settings },
];

export default function AdminNav() {
  const pathname = useLocation().pathname;

  return (
    <nav className="w-64 bg-[#0a0a0f] border-l border-white/10 h-screen p-6 flex flex-col fixed right-0 top-0">
      <div className="text-2xl font-black text-white mb-10">Moonlight 🌕</div>
      <div className="flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${isActive ? 'bg-[#7c5cfc] text-white' : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}
            >
              <Icon size={20} />
              <span className="font-bold">{item.name}</span>
            </Link>
          );
        })}
      </div>
      <button onClick={logout} className="flex items-center gap-4 p-4 text-red-500 hover:bg-red-500/10 rounded-2xl transition-all">
        <LogOut size={20} />
        <span className="font-bold">تسجيل الخروج</span>
      </button>
    </nav>
  );
}
