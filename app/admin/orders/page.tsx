'use client';
import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import AdminNav from '@/components/AdminNav';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'orders'), (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-white">
      <AdminNav />
      <main className="flex-1 p-10 mr-64">
        <h1 className="text-4xl font-black mb-10">إدارة الطلبات</h1>
        
        <div className="bg-[#1a1a24] rounded-3xl border border-white/5 p-8">
          <table className="w-full text-right">
            <thead>
              <tr className="text-gray-500 text-sm">
                <th className="p-4">رقم الطلب</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-white/5">
                  <td className="p-4">{o.id}</td>
                  <td className="p-4">{o.status}</td>
                  <td className="p-4">${o.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
