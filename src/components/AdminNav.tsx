import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Activity, Settings, LogOut, ExternalLink, Users } from 'lucide-react';
import { logout, db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const navItems = [
  { name: 'لوحة التحكم', path: '/admin', icon: LayoutDashboard },
  { name: 'إدارة المنتجات', path: '/admin/products', icon: Package },
  { name: 'إدارة الطلبات', path: '/admin/orders', icon: ShoppingCart },
  { name: 'نظام التشخيص', path: '/admin/diagnostics', icon: Activity },
  { name: 'إعدادات المتجر', path: '/admin/settings', icon: Settings },
];

export default function AdminNav() {
  const pathname = useLocation().pathname;
  const [hasNewOrders, setHasNewOrders] = useState(false);
  const [lastOrderTime, setLastOrderTime] = useState<Date | null>(null);
  const [visitorCount, setVisitorCount] = useState(0);

  useEffect(() => {
    // Track orders for pulse animation
    const ordersUnsubscribe = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (ordersData.length > 0) {
        const latestOrder = ordersData.reduce((latest: any, order: any) => {
          const orderTime = order.createdAt?.toDate?.() || new Date(0);
          const latestTime = latest?.createdAt?.toDate?.() || new Date(0);
          return orderTime > latestTime ? order : latest;
        }, ordersData[0]);
        
        const orderTime = latestOrder?.createdAt?.toDate?.();
        if (orderTime) {
          setLastOrderTime(orderTime);
          const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
          setHasNewOrders(orderTime > thirtyMinutesAgo);
        }
      }
    });

    // Simulate visitor count
    const visitorInterval = setInterval(() => {
      setVisitorCount(Math.floor(Math.random() * 50) + 10);
    }, 30000);
    setVisitorCount(Math.floor(Math.random() * 50) + 10);

    return () => {
      ordersUnsubscribe();
      clearInterval(visitorInterval);
    };
  }, []);

  const formatLastOrderTime = (date: Date | null): string => {
    if (!date) return 'لا توجد طلبات';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    return `منذ ${diffDays} يوم`;
  };

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
      {/* Smart Store Button */}
      <div className="relative group mb-4">
        <a
          href="https://monnlight-store.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all w-full ${
            hasNewOrders
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse'
              : 'text-gray-500 hover:bg-white/5 hover:text-white'
          }`}
        >
          <span className="text-xl">🛍️</span>
          <span className="flex-1">زيارة المتجر</span>
          {visitorCount > 0 && (
            <span className="flex items-center gap-1 text-xs bg-white/10 px-2 py-1 rounded-full">
              <Users size={12} />
              {visitorCount}
            </span>
          )}
          <ExternalLink size={16} className="opacity-60" />
        </a>
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-xs whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
          <span className="text-gray-400">آخر طلب: </span>
          <span className="text-white font-bold">{formatLastOrderTime(lastOrderTime)}</span>
        </div>
      </div>

      <button onClick={logout} className="flex items-center gap-4 p-4 text-red-500 hover:bg-red-500/10 rounded-2xl transition-all">
        <LogOut size={20} />
        <span className="font-bold">تسجيل الخروج</span>
      </button>
    </nav>
  );
}
