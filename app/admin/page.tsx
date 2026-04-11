'use client';
import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import AdminNav from '@/components/AdminNav';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ orders: 0, revenue: 0, visitors: 0 });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const orders = snapshot.docs.map(doc => doc.data());
      const revenue = orders.reduce((acc, curr) => acc + (curr.total || 0), 0);
      setStats({ orders: orders.length, revenue, visitors: 1240 });
    });
    return unsubscribe;
  }, []);

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-white">
      <AdminNav />
      <main className="flex-1 p-10 mr-64">
        <h1 className="text-4xl font-black mb-10">لوحة التحكم الرئيسية</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-[#1a1a24] p-8 rounded-3xl border border-white/5">
            <h3 className="text-gray-500 font-bold mb-2">إجمالي الطلبات</h3>
            <p className="text-4xl font-black">{stats.orders}</p>
          </div>
          <div className="bg-[#1a1a24] p-8 rounded-3xl border border-white/5">
            <h3 className="text-gray-500 font-bold mb-2">إجمالي الإيرادات</h3>
            <p className="text-4xl font-black">${stats.revenue.toFixed(2)}</p>
          </div>
          <div className="bg-[#1a1a24] p-8 rounded-3xl border border-white/5">
            <h3 className="text-gray-500 font-bold mb-2">الزوار النشطون</h3>
            <p className="text-4xl font-black">{stats.visitors}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
