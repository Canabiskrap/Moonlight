import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth, deleteFile, handleFirestoreError, OperationType } from '../lib/firebase';
import { uploadToCloudinary } from '../lib/cloudinary';
import { motion } from 'motion/react';
import { Plus, Trash2, Package, DollarSign, Image as ImageIcon, Link as LinkIcon, FileText, Upload, CheckCircle2, Globe, Search } from 'lucide-react';

export default function Dashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [uploadMethod, setUploadMethod] = useState<'direct' | 'link'>('direct');
  const [category, setCategory] = useState('cv');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const qProds = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));

    const unsubProds = onSnapshot(qProds, 
      (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (error) => {
        console.error("Products Snapshot Error:", error);
        setErrorMessage("فشل تحميل المنتجات: " + error.message);
        setLoading(false);
      }
    );

    const unsubOrders = onSnapshot(qOrders, 
      (snapshot) => {
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => {
        console.error("Orders Snapshot Error:", error);
      }
    );

    return () => {
      unsubProds();
      unsubOrders();
    };
  }, []);

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setName(product.name);
    setDescription(product.description);
    setPrice(product.price.toString());
    setCategory(product.category);
    setImageUrl(product.imageUrl);
    setDownloadUrl(product.downloadUrl);
    setUploadMethod('link'); // Default to link when editing to avoid re-uploading unless needed
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setPrice('');
    setImageFile(null);
    setProductFile(null);
    setImageUrl('');
    setDownloadUrl('');
    setStatus('idle');
    setUploadProgress(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'uploading') return;
    
    setStatus('uploading');
    setErrorMessage('');
    setShowToast(false);
    setUploadProgress(0);

    try {
      if (!auth.currentUser) {
        throw new Error("يجب تسجيل الدخول كمسؤول للقيام بهذه العملية.");
      }

      // URL Validation helper
      const isValidUrl = (url: string) => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      };

      let finalImageUrl = imageUrl;
      let finalDownloadUrl = downloadUrl;

      if (uploadMethod === 'direct') {
        if (imageFile) {
          console.log("Starting image upload to Cloudinary...");
          try {
            finalImageUrl = await uploadToCloudinary(imageFile, (progress) => {
              setUploadProgress(Math.round(progress * 0.1));
            });
            console.log("Image upload success:", finalImageUrl);
          } catch (imgErr: any) {
            console.error("Cloudinary Error:", imgErr);
            throw new Error("فشل رفع الصورة: " + imgErr.message);
          }
        }
        
        if (productFile) {
          console.log("Starting product file upload to Firebase...");
          const fileRef = ref(storage, `products/files/${Date.now()}_${productFile.name}`);
          const fileUploadTask = uploadBytesResumable(fileRef, productFile);
          
          // Track progress
          fileUploadTask.on('state_changed', (snapshot) => {
            const progress = 10 + ((snapshot.bytesTransferred / snapshot.totalBytes) * 90);
            setUploadProgress(Math.round(progress));
          });

          try {
            await fileUploadTask;
            finalDownloadUrl = await getDownloadURL(fileRef);
            console.log("Product file upload success:", finalDownloadUrl);
          } catch (uploadErr: any) {
            console.error("Firebase Storage Error:", uploadErr);
            throw new Error("فشل رفع الملف الرقمي: " + uploadErr.message);
          }
        }
      } else {
        // Validation for link method
        if (imageFile) {
          finalImageUrl = await uploadToCloudinary(imageFile, (progress) => {
            setUploadProgress(Math.round(progress));
          });
        } else if (imageUrl && !isValidUrl(imageUrl)) {
          // Try to fix common missing https://
          if (imageUrl.includes('.') && !imageUrl.startsWith('http')) {
            finalImageUrl = `https://${imageUrl}`;
          } else {
            throw new Error("رابط الصورة غير صالح. يجب أن يبدأ بـ http:// أو https://");
          }
        }

        if (downloadUrl && !isValidUrl(downloadUrl)) {
          if (downloadUrl.includes('.') && !downloadUrl.startsWith('http')) {
            finalDownloadUrl = `https://${downloadUrl}`;
          } else {
            throw new Error("رابط التحميل غير صالح. يجب أن يبدأ بـ http:// أو https://");
          }
        }
      }

      if (!finalImageUrl || !finalDownloadUrl) {
        throw new Error("يرجى التأكد من رفع الملفات أو وضع الروابط الصحيحة");
      }

      const numericPrice = parseFloat(price);
      if (isNaN(numericPrice)) {
        throw new Error("يرجى إدخال سعر صحيح");
      }

      const productData = {
        name,
        description,
        price: numericPrice,
        imageUrl: finalImageUrl,
        downloadUrl: finalDownloadUrl,
        category,
        updatedAt: Timestamp.now()
      };

      try {
        if (editingId) {
          await updateDoc(doc(db, 'products', editingId), productData);
        } else {
          await addDoc(collection(db, 'products'), {
            ...productData,
            createdAt: Timestamp.now()
          });
        }
      } catch (firestoreErr) {
        console.error("Firestore Save Error:", firestoreErr);
        handleFirestoreError(firestoreErr, editingId ? OperationType.UPDATE : OperationType.CREATE, 'products');
      }
      
      setStatus('success');
      setShowToast(true);
      resetForm();
      
      setTimeout(() => {
        setStatus('idle');
        setShowToast(false);
      }, 3000);
      
    } catch (err: any) {
      console.error("Submit Error:", err);
      setStatus('error');
      // If the error is a JSON string from handleFirestoreError, try to parse it
      try {
        const parsed = JSON.parse(err.message);
        setErrorMessage(`خطأ: ${parsed.error}`);
      } catch {
        setErrorMessage(err.message || "فشل حفظ المنتج");
      }
    } finally {
      // Ensure we don't stay in uploading state if something unexpected happens
      // but only if we didn't succeed (success sets it to success then idle)
      if (status === 'uploading') {
        // We don't set to idle immediately if it's success/error to let the UI show the result
      }
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProductsList = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string, imageUrl: string, downloadUrl: string) => {
    console.log("Attempting to delete product:", id);
    try {
      setDeletingId(id);
      
      // 1. Delete from Firestore first - this is the most important part
      console.log("Deleting Firestore document...");
      try {
        await deleteDoc(doc(db, 'products', id));
        console.log("Firestore document deleted successfully");
      } catch (firestoreErr) {
        console.error("Firestore Delete Error:", firestoreErr);
        handleFirestoreError(firestoreErr, OperationType.DELETE, `products/${id}`);
      }
      
      // 2. Delete files (don't let file deletion failure block the process)
      if (imageUrl && imageUrl.includes('cloudinary')) {
        console.log("Image is on Cloudinary, skipping storage delete...");
      } else if (imageUrl) {
        console.log("Deleting image from Storage...");
        await deleteFile(imageUrl).catch(e => console.warn("Image delete failed:", e));
      }

      if (downloadUrl) {
        console.log("Deleting product file from Storage...");
        await deleteFile(downloadUrl).catch(e => console.warn("File delete failed:", e));
      }
      
      setDeletingId(null);
      setErrorMessage('');
      console.log("Delete process finished");
    } catch (err: any) {
      console.error("Overall Delete Error:", err);
      setDeletingId(null);
      try {
        const parsed = JSON.parse(err.message);
        setErrorMessage(`خطأ في الحذف: ${parsed.error}`);
      } catch {
        setErrorMessage(err.message || "حدث خطأ أثناء الحذف. تأكد من صلاحياتك.");
      }
    }
  };

  const totalRevenue = orders.reduce((sum, order) => sum + (order.amount || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 pb-32"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col">
          <h1 className="text-4xl font-black">لوحة التحكم</h1>
          <span className="text-[10px] text-gray-600 mt-1 uppercase tracking-widest">Cloudinary & Firebase Integrated System</span>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="flex-1 md:flex-none bg-dark-light px-6 py-3 rounded-2xl border border-white/5 text-center">
            <p className="text-xs text-gray-500">إجمالي المبيعات</p>
            <p className="text-xl font-black text-gold">${totalRevenue.toFixed(2)}</p>
          </div>
          <div className="flex-1 md:flex-none bg-dark-light px-6 py-3 rounded-2xl border border-white/5 text-center">
            <p className="text-xs text-gray-500">عدد الطلبات</p>
            <p className="text-xl font-black text-primary">{orders.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Add/Edit Product Form */}
        <div className="lg:col-span-1">
          <div className="bg-dark-light p-8 rounded-[2rem] border border-white/5 sticky top-24">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black flex items-center gap-2">
                {editingId ? <CheckCircle2 className="text-gold" /> : <Plus className="text-primary" />}
                {editingId ? 'تعديل المنتج' : 'إضافة منتج جديد'}
              </h2>
              {editingId && (
                <button 
                  onClick={resetForm}
                  className="text-xs font-bold text-gray-500 hover:text-white underline"
                >
                  إلغاء التعديل
                </button>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm font-bold">
                  {errorMessage}
                </div>
              )}
              {showToast && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded-xl text-sm font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  تم {editingId ? 'تحديث' : 'إضافة'} المنتج بنجاح!
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400">اسم المنتج</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="bg-dark border-white/5 focus:border-primary outline-none transition-all w-full p-4 rounded-2xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400">الفئة</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-dark border-white/5 focus:border-primary outline-none transition-all w-full p-4 rounded-2xl appearance-none"
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
                  رفع ملفات
                </button>
                <button 
                  type="button"
                  onClick={() => setUploadMethod('link')}
                  className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${uploadMethod === 'link' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:text-white'}`}
                >
                  روابط خارجية
                </button>
              </div>

              {uploadMethod === 'direct' ? (
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400">1. صورة الغلاف</label>
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
                        ) : imageUrl ? (
                          <div className="flex flex-col items-center gap-2 text-primary font-bold text-xs p-4 text-center">
                            <ImageIcon size={24} />
                            <span>صورة موجودة مسبقاً</span>
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
                    <label className="text-sm font-bold text-gray-400">2. الملف الرقمي</label>
                    <div className="relative group">
                      <input 
                        type="file" 
                        accept=".zip,application/zip,application/x-zip-compressed,application/octet-stream,multipart/x-zip,*/*"
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
                        ) : downloadUrl ? (
                          <div className="flex flex-col items-center gap-2 text-gold font-bold text-xs p-4 text-center">
                            <LinkIcon size={24} />
                            <span>ملف موجود مسبقاً</span>
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
                      required={uploadMethod === 'link'}
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

              <div className="space-y-4">
                {status === 'uploading' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-gray-400">
                      <span>حالة الرفع</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-dark rounded-full h-4 overflow-hidden border border-white/10">
                      <div 
                        className="bg-primary h-4 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.max(uploadProgress, 2)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                <button 
                  type="submit" 
                  disabled={status === 'uploading' || status === 'success'}
                  className={`w-full text-white py-4 rounded-xl font-black text-lg transition-all shadow-lg relative overflow-hidden ${
                    status === 'success' ? 'bg-green-500 shadow-green-500/20' :
                    status === 'error' ? 'bg-red-500 shadow-red-500/20 hover:bg-red-600' :
                    'bg-primary hover:bg-primary-dark shadow-primary/20 disabled:opacity-50'
                  }`}
                >
                  {status === 'uploading' ? (
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                      {uploadProgress > 0 
                        ? `جاري الحفظ... ${Math.round(uploadProgress)}%` 
                        : "جاري التحضير..."}
                    </span>
                  ) : status === 'success' ? (
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      تم بنجاح
                    </span>
                  ) : (
                    editingId ? "تحديث المنتج" : "نشر المنتج الآن"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Products List & Orders */}
        <div className="lg:col-span-2 space-y-10">
          {/* Products Table */}
          <div className="bg-dark-light rounded-[2rem] border border-white/5 overflow-hidden">
            <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
              <h2 className="text-2xl font-black flex items-center gap-2">
                <Package className="text-gold" />
                المنتجات الحالية ({products.length})
              </h2>
              <div className="relative w-full md:w-64">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="text"
                  placeholder="بحث عن منتج..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-dark border-white/5 focus:border-primary outline-none p-3 pr-12 rounded-xl text-sm"
                />
              </div>
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
                  {filteredProductsList.map((p) => (
                    <tr key={p.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${editingId === p.id ? 'bg-primary/5 border-primary/20' : ''}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={p.imageUrl} className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                          <span className="font-bold">{p.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-400">
                        {p.category === 'cv' ? 'سيرة ذاتية' : p.category === 'social' ? 'سوشيال ميديا' : 'قالب ويب'}
                      </td>
                      <td className="p-4 font-black text-gold">${p.price}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 justify-end">
                          <button 
                            onClick={() => handleEdit(p)}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="تعديل"
                          >
                            <FileText size={18} />
                          </button>
                          {deletingId === p.id ? (
                            <div className="flex items-center gap-2 bg-red-500/10 p-1 rounded-lg border border-red-500/20">
                              <span className="text-[10px] font-bold text-red-500 px-2">متأكد؟</span>
                              <button 
                                onClick={() => handleDelete(p.id, p.imageUrl, p.downloadUrl)} 
                                className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-600 transition-colors"
                              >
                                نعم
                              </button>
                              <button 
                                onClick={() => setDeletingId(null)} 
                                className="bg-white/10 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-white/20 transition-colors"
                              >
                                لا
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setDeletingId(p.id)}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="حذف"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
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
                    <th className="p-4">رقم الطلب (PayPal)</th>
                    <th className="p-4">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 font-bold">{o.productName}</td>
                      <td className="p-4 text-sm text-gray-400">{o.customerEmail}</td>
                      <td className="p-4 font-black text-green-400">${o.amount}</td>
                      <td className="p-4 text-xs font-mono text-gray-500">{o.paypalOrderId || '---'}</td>
                      <td className="p-4 text-xs text-gray-500">
                        {o.createdAt?.toDate().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
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
