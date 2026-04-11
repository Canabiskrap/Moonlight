'use client';
import React, { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import AdminNav from '@/components/AdminNav';
import { Plus, Trash2, Edit2, Search } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('cv');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'products'), {
        name,
        price: parseFloat(price),
        category,
        createdAt: new Date()
      });
      setName('');
      setPrice('');
    } catch (error) {
      console.error("Error adding product:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-white">
      <AdminNav />
      <main className="flex-1 p-10 mr-64">
        <h1 className="text-4xl font-black mb-10">إدارة المنتجات</h1>
        
        <form onSubmit={handleAddProduct} className="bg-[#1a1a24] p-8 rounded-3xl border border-white/5 mb-10 space-y-4">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم المنتج" className="w-full p-4 bg-[#0a0a0f] rounded-2xl border border-white/5" required />
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="السعر" className="w-full p-4 bg-[#0a0a0f] rounded-2xl border border-white/5" required />
          <button type="submit" disabled={loading} className="w-full bg-[#7c5cfc] py-4 rounded-2xl font-bold hover:bg-[#6c4ceb] transition-all">
            {loading ? 'جاري الإضافة...' : 'إضافة منتج'}
          </button>
        </form>

        <div className="bg-[#1a1a24] rounded-3xl border border-white/5 p-8">
          <table className="w-full text-right">
            <thead>
              <tr className="text-gray-500 text-sm">
                <th className="p-4">الاسم</th>
                <th className="p-4">السعر</th>
                <th className="p-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-white/5">
                  <td className="p-4">{p.name}</td>
                  <td className="p-4">${p.price}</td>
                  <td className="p-4 flex gap-2">
                    <button onClick={() => deleteDoc(doc(db, 'products', p.id))} className="text-[#ff1744]"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
