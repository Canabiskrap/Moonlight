import React, { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db, uploadFile, deleteFile } from '../lib/firebase';
import { motion } from 'motion/react';
import { Plus, Trash2, Package, DollarSign, Image as ImageIcon, Link as LinkIcon, FileText, Upload, CheckCircle2, Globe } from 'lucide-react';

export default function Dashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [uploadMethod, setUploadMethod] = useState<'direct' | 'link'>('direct');
  const [category, setCategory] = useState('cv');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const qProds = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));

    const unsubProds = onSnapshot(qProds, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubProds();
      unsubOrders();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      let finalImageUrl = imageUrl;
      let finalDownloadUrl = downloadUrl;

      if (uploadMethod === 'direct') {
        if (!imageFile || !productFile) {
          throw new Error("يرجى اختيار صورة الغلاف والملف الرقمي أولاً.");
        }
        try {
          finalImageUrl = await uploadFile(imageFile, `products/images/${Date.now()}_${imageFile.name}`);
          finalDownloadUrl = await uploadFile(productFile, `products/files/${Date.now()}_${productFile.name}`);
        } catch (storageErr: any) {
          console.error("Storage Error:", storageErr);
          throw new Error("فشل رفع الملفات. يرجى التأكد من تفعيل Firebase Storage في إعدادات مشروعك وإضافة صلاحيات (Rules) تسمح بالرفع.");
        }
      }

      if (!finalImageUrl || !finalDownloadUrl) {
        throw new Error("يرجى التأكد من رفع الملفات أو وضع الروابط");
      }

      await addDoc(collection(db, 'products'), {
        name,
        description,
        price: parseFloat(price),
        imageUrl: finalImageUrl,
        downloadUrl: finalDownloadUrl,
        category,
        createdAt: Timestamp.now()
      });
      
      // Reset form
      setName('');
      setDescription('');
      setPrice('');
      setImageUrl('');
      setDownloadUrl('');
      setImageFile(null);
      setProductFile(null);
      setSuccessMessage("تم إضافة المنتج بنجاح!");
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "فشل إضافة المنتج");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, imageUrl: string, downloadUrl: string) => {
    try {
      // First delete the document
      await deleteDoc(doc(db, 'products', id));
      
      // Then attempt to delete associated files if they are in Firebase Storage
      if (imageUrl) await deleteFile(imageUrl);
      if (downloadUrl) await deleteFile(downloadUrl);
      
      setDeletingId(null);
    } catch (err) {
      console.error(err);
      setErrorMessage("حدث خطأ أثناء الحذف");
    }
  };

  const totalRevenue = orders.reduce((sum, order) => sum + (order.amount || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-black">لوحة التحكم</h1>
        <div className="flex gap-4">
          <div className="bg-dark-light px-6 py-3 rounded-2xl border border-white/5 text-center">
            <p className="text-xs text-gray-500">إجمالي المبيعات</p>
            <p className="text-xl font-black text-gold">${totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-dark-light px-6 py-3 rounded-2xl border border-white/5 text-center">
            <p className="text-xs text-gray-500">عدد الطلبات</p>
            <p className="text-xl font-black text-primary">{orders.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Add Product Form */}
        <div className="lg:col-span-1">
          <div className="bg-dark-light p-8 rounded-[2rem] border border-white/5 sticky top-24">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
              <Plus className="text-primary" />
              إضافة منتج جديد
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400">اسم المنتج</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="bg-dark border-white/5 focus:border-primary outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400">الفئة</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-dark border-white/5 focus:border-primary outline-none transition-all"
                >
                  <option value="cv">سيرة ذاتية</option>
                  <option value="social">سوشيال ميديا</option>
                  <option value="web">قالب ويب</option>
                  <option value="other">أخرى</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400">السعر ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={price} 
                  onChange={(e) => setPrice(e.target.value)}
                  className="bg-dark border-white/5 focus:border-primary outline-none transition-all w-full p-4 rounded-2xl"
                  required
                />
              </div>

              <div className="flex bg-dark p-1 rounded-xl border border-white/5 mb-6">
                <button 
                  type="button"
                  onClick={() => setUploadMethod('direct')}
                  className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${uploadMethod === 'direct' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:text-white'}`}
                >
                  رفع مباشر
                </button>
                <button 
                  type="button"
                  onClick={() => setUploadMethod('link')}
                  className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${uploadMethod === 'link' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:text-white'}`}
                >
                  استخدام روابط
                </button>
              </div>

              {uploadMethod === 'direct' ? (
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400">1. صورة الغلاف (تظهر للزوار)</label>
                    <div className="relative group">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="image-upload"
                      />
                      <label 
                        htmlFor="image-upload"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                      >
                        {imageFile ? (
                          <div className="flex flex-col items-center gap-2 text-primary font-bold text-xs p-4 text-center">
                            <CheckCircle2 size={24} />
                            <span className="break-all">{imageFile.name}</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="text-gray-500 mb-2" size={24} />
                            <span className="text-xs text-gray-500">اختر صورة المعرض</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400">2. الملف الرقمي (الذي سيتم بيعه)</label>
                    <div className="relative group">
                      <input 
                        type="file" 
                        onChange={(e) => setProductFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="file-upload"
                      />
                      <label 
                        htmlFor="file-upload"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                      >
                        {productFile ? (
                          <div className="flex flex-col items-center gap-2 text-gold font-bold text-xs p-4 text-center">
                            <CheckCircle2 size={24} />
                            <span className="break-all">{productFile.name}</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="text-gray-500 mb-2" size={24} />
                            <span className="text-xs text-gray-500">اختر الملف (PDF, ZIP, etc)</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400">رابط صورة الغلاف</label>
                    <input 
                      type="url" 
                      value={imageUrl} 
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="bg-dark border-white/5 focus:border-primary outline-none transition-all w-full p-4 rounded-2xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400">رابط تحميل الملف</label>
                    <input 
                      type="url" 
                      value={downloadUrl} 
                      onChange={(e) => setDownloadUrl(e.target.value)}
                      placeholder="https://..."
                      className="bg-dark border-white/5 focus:border-primary outline-none transition-all w-full p-4 rounded-2xl"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400">وصف المنتج</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب تفاصيل المنتج هنا..."
                  className="bg-dark border-white/5 focus:border-primary outline-none transition-all w-full p-4 rounded-2xl min-h-[120px]"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-primary text-white py-4 rounded-xl font-black text-lg hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {isSubmitting ? "جاري النشر..." : "نشر المنتج الآن"}
              </button>
            </form>
          </div>
        </div>

        {/* Products List & Orders */}
        <div className="lg:col-span-2 space-y-10">
          {/* Products Table */}
          <div className="bg-dark-light rounded-[2rem] border border-white/5 overflow-hidden">
            <div className="p-8 border-b border-white/5">
              <h2 className="text-2xl font-black flex items-center gap-2">
                <Package className="text-gold" />
                المنتجات الحالية ({products.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-white/5 text-gray-400 text-sm">
                    <th className="p-4">المنتج</th>
                    <th className="p-4">الفئة</th>
                    <th className="p-4">السعر</th>
                    <th className="p-4">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={p.imageUrl} className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                          <span className="font-bold">{p.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-400">{p.category}</td>
                      <td className="p-4 font-black text-gold">${p.price}</td>
                      <td className="p-4">
                        {deletingId === p.id ? (
                          <div className="flex items-center gap-2 justify-end flex-wrap min-w-[120px]">
                            <span className="text-xs text-gray-400 w-full text-right mb-1">تأكيد؟</span>
                            <button onClick={() => handleDelete(p.id, p.imageUrl, p.downloadUrl)} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors">نعم</button>
                            <button onClick={() => setDeletingId(null)} className="bg-white/10 text-gray-300 hover:bg-white/20 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors">لا</button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setDeletingId(p.id)}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-dark-light rounded-[2rem] border border-white/5 overflow-hidden">
            <div className="p-8 border-b border-white/5">
              <h2 className="text-2xl font-black flex items-center gap-2">
                <DollarSign className="text-green-400" />
                آخر الطلبات ({orders.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-white/5 text-gray-400 text-sm">
                    <th className="p-4">المنتج</th>
                    <th className="p-4">العميل</th>
                    <th className="p-4">المبلغ</th>
                    <th className="p-4">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b border-white/5">
                      <td className="p-4 font-bold">{o.productName}</td>
                      <td className="p-4 text-sm text-gray-400">{o.customerEmail}</td>
                      <td className="p-4 font-black text-green-400">${o.amount}</td>
                      <td className="p-4 text-xs text-gray-500">
                        {o.createdAt?.toDate().toLocaleDateString('ar-EG')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
