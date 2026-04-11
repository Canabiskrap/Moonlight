import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { put } from '@vercel/blob';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, Edit2, X, Upload, Loader2, Package, DollarSign, 
  BarChart3, ImageIcon, FileText, Save, Eye, Settings, 
  Palette, ShoppingBag, TrendingUp
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  downloadUrl: string;
  createdAt: any;
}

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'settings'>('products');

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('cv');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [downloadFile, setDownloadFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  // Settings state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(prods);
      setLoading(false);
    });

    const ordersUnsubscribe = onSnapshot(collection(db, 'orders'), (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribe();
      ordersUnsubscribe();
    };
  }, []);

  const uploadToBlob = async (file: File, prefix: string): Promise<string> => {
    const token = import.meta.env.VITE_BLOB_READ_WRITE_TOKEN;
    const filename = `${prefix}/${Date.now()}-${file.name}`;
    
    const { url } = await put(filename, file, {
      access: 'public',
      token,
      addRandomSuffix: true,
    });
    
    return url;
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setCategory('cv');
    setImageFile(null);
    setDownloadFile(null);
    setImageUrl('');
    setDownloadUrl('');
    setEditingProduct(null);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description || '');
    setPrice(product.price.toString());
    setCategory(product.category || 'cv');
    setImageUrl(product.imageUrl || '');
    setDownloadUrl(product.downloadUrl || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let finalImageUrl = imageUrl;
      let finalDownloadUrl = downloadUrl;

      // Upload image if new file selected
      if (imageFile) {
        setUploadProgress('جاري رفع الصورة...');
        finalImageUrl = await uploadToBlob(imageFile, 'products/images');
      }

      // Upload download file if new file selected
      if (downloadFile) {
        setUploadProgress('جاري رفع ملف التحميل...');
        finalDownloadUrl = await uploadToBlob(downloadFile, 'products/downloads');
        
        // Encrypt the download URL
        try {
          const encryptRes = await fetch('/api/encrypt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: finalDownloadUrl })
          });
          if (encryptRes.ok) {
            const { encryptedUrl } = await encryptRes.json();
            finalDownloadUrl = encryptedUrl;
          }
        } catch (err) {
          console.warn('Encryption failed, using plain URL:', err);
        }
      }

      const productData = {
        name,
        description,
        price: parseFloat(price),
        category,
        imageUrl: finalImageUrl,
        downloadUrl: finalDownloadUrl,
        updatedAt: Timestamp.now(),
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: Timestamp.now(),
        });
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('حدث خطأ أثناء حفظ المنتج');
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      await deleteDoc(doc(db, 'products', id));
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;
    setSavingSettings(true);
    
    try {
      const logoUrl = await uploadToBlob(logoFile, 'settings');
      await updateDoc(doc(db, 'settings', 'appearance'), { logoUrl });
      alert('تم تحديث الشعار بنجاح!');
      setLogoFile(null);
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('حدث خطأ أثناء رفع الشعار');
    } finally {
      setSavingSettings(false);
    }
  };

  const totalRevenue = orders.reduce((acc, order) => acc + (order.amount || 0), 0);

  const categories = [
    { id: 'cv', name: 'سيرة ذاتية' },
    { id: 'social', name: 'سوشيال ميديا' },
    { id: 'web', name: 'قوالب ويب' },
    { id: 'other', name: 'أخرى' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#0a0e1a] text-white"
    >
      {/* Header */}
      <div className="bg-dark-light/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black flex items-center gap-3">
              <div className="bg-primary p-2 rounded-xl">
                <BarChart3 size={24} />
              </div>
              لوحة التحكم
            </h1>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-gray-500">إجمالي المنتجات</p>
                <p className="text-xl font-black text-primary">{products.length}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">إجمالي الإيرادات</p>
                <p className="text-xl font-black text-gold">${totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-dark-light/50 backdrop-blur-xl p-6 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <Package className="text-primary" size={24} />
              <span className="text-xs text-green-400 font-bold">+12%</span>
            </div>
            <p className="text-3xl font-black">{products.length}</p>
            <p className="text-sm text-gray-500">المنتجات</p>
          </div>
          
          <div className="bg-dark-light/50 backdrop-blur-xl p-6 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <ShoppingBag className="text-gold" size={24} />
              <span className="text-xs text-green-400 font-bold">+8%</span>
            </div>
            <p className="text-3xl font-black">{orders.length}</p>
            <p className="text-sm text-gray-500">الطلبات</p>
          </div>
          
          <div className="bg-dark-light/50 backdrop-blur-xl p-6 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="text-green-400" size={24} />
              <span className="text-xs text-green-400 font-bold">+23%</span>
            </div>
            <p className="text-3xl font-black">${totalRevenue.toFixed(0)}</p>
            <p className="text-sm text-gray-500">الإيرادات</p>
          </div>
          
          <div className="bg-dark-light/50 backdrop-blur-xl p-6 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="text-blue-400" size={24} />
              <span className="text-xs text-green-400 font-bold">+15%</span>
            </div>
            <p className="text-3xl font-black">{orders.length > 0 ? (totalRevenue / orders.length).toFixed(0) : 0}</p>
            <p className="text-sm text-gray-500">متوسط الطلب</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-dark-light/30 p-2 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'products' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Package size={18} />
              المنتجات
            </div>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'orders' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShoppingBag size={18} />
              الطلبات
            </div>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'settings' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings size={18} />
              الإعدادات
            </div>
          </button>
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black">إدارة المنتجات</h2>
              <button
                onClick={() => { resetForm(); setShowModal(true); }}
                className="flex items-center gap-2 bg-primary px-6 py-3 rounded-xl font-bold hover:bg-primary-dark transition-all"
              >
                <Plus size={20} />
                إضافة منتج
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-primary" size={40} />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-dark-light/30 rounded-3xl border border-white/5">
                <Package className="mx-auto text-gray-600 mb-4" size={48} />
                <p className="text-gray-500 font-bold">لا توجد منتجات بعد</p>
                <p className="text-gray-600 text-sm">ابدأ بإضافة منتجك الأول</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-dark-light/50 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/5 group"
                  >
                    <div className="aspect-video bg-dark relative overflow-hidden">
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="text-gray-700" size={48} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button
                          onClick={() => openEditModal(product)}
                          className="bg-primary p-3 rounded-xl hover:scale-110 transition-transform"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="bg-red-500 p-3 rounded-xl hover:scale-110 transition-transform"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="p-6 space-y-3">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg">{product.name}</h3>
                        <span className="text-gold font-black">${product.price}</span>
                      </div>
                      <p className="text-gray-500 text-sm line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <span className="text-xs text-primary font-bold px-3 py-1 bg-primary/10 rounded-lg">
                          {categories.find(c => c.id === product.category)?.name || product.category}
                        </span>
                        {product.downloadUrl && (
                          <span className="text-xs text-green-400 flex items-center gap-1">
                            <FileText size={12} />
                            ملف متاح
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black">سجل الطلبات</h2>
            
            {orders.length === 0 ? (
              <div className="text-center py-20 bg-dark-light/30 rounded-3xl border border-white/5">
                <ShoppingBag className="mx-auto text-gray-600 mb-4" size={48} />
                <p className="text-gray-500 font-bold">لا توجد طلبات بعد</p>
              </div>
            ) : (
              <div className="bg-dark-light/50 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden">
                <table className="w-full text-right">
                  <thead className="bg-dark/50">
                    <tr>
                      <th className="p-4 text-gray-500 font-bold text-sm">المنتج</th>
                      <th className="p-4 text-gray-500 font-bold text-sm">العميل</th>
                      <th className="p-4 text-gray-500 font-bold text-sm">المبلغ</th>
                      <th className="p-4 text-gray-500 font-bold text-sm">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-t border-white/5">
                        <td className="p-4 font-bold">{order.productName}</td>
                        <td className="p-4 text-gray-400">{order.customerEmail}</td>
                        <td className="p-4 text-gold font-bold">${order.amount}</td>
                        <td className="p-4">
                          <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-lg text-xs font-bold">
                            {order.status || 'مكتمل'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-xl font-black">إعدادات المتجر</h2>
            
            <div className="bg-dark-light/50 backdrop-blur-xl p-8 rounded-2xl border border-white/5 space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <Palette className="text-primary" size={24} />
                <div>
                  <h3 className="font-bold">شعار المتجر</h3>
                  <p className="text-sm text-gray-500">قم برفع شعار جديد للمتجر</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <Upload className="mx-auto text-gray-500 mb-3" size={32} />
                    <p className="text-gray-400 font-bold">
                      {logoFile ? logoFile.name : 'اختر صورة الشعار'}
                    </p>
                    <p className="text-xs text-gray-600 mt-2">PNG, JPG حتى 2MB</p>
                  </div>
                </label>

                <button
                  onClick={handleLogoUpload}
                  disabled={!logoFile || savingSettings}
                  className="w-full flex items-center justify-center gap-2 bg-primary py-4 rounded-xl font-bold hover:bg-primary-dark transition-all disabled:opacity-50"
                >
                  {savingSettings ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <Save size={20} />
                      حفظ الشعار
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-dark-light w-full max-w-2xl rounded-3xl border border-white/10 overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center sticky top-0 bg-dark-light z-10">
                <h2 className="text-xl font-black">
                  {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400">اسم المنتج</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-dark p-4 rounded-xl border border-white/5 focus:border-primary/50 outline-none transition-colors"
                    placeholder="أدخل اسم المنتج"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400">الوصف</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-dark p-4 rounded-xl border border-white/5 focus:border-primary/50 outline-none transition-colors h-24 resize-none"
                    placeholder="وصف مختصر للمنتج"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400">السعر (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-dark p-4 rounded-xl border border-white/5 focus:border-primary/50 outline-none transition-colors"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400">الفئة</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-dark p-4 rounded-xl border border-white/5 focus:border-primary/50 outline-none transition-colors"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400">صورة المنتج</label>
                  <label className="block">
                    <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <ImageIcon className="mx-auto text-gray-500 mb-2" size={24} />
                      <p className="text-sm text-gray-400">
                        {imageFile ? imageFile.name : (imageUrl ? 'صورة محملة مسبقاً' : 'اختر صورة المنتج')}
                      </p>
                    </div>
                  </label>
                  {!imageFile && (
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full bg-dark p-3 rounded-xl border border-white/5 focus:border-primary/50 outline-none transition-colors text-sm"
                      placeholder="أو أدخل رابط الصورة مباشرة"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400">ملف التحميل</label>
                  <label className="block">
                    <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        onChange={(e) => setDownloadFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <FileText className="mx-auto text-gray-500 mb-2" size={24} />
                      <p className="text-sm text-gray-400">
                        {downloadFile ? downloadFile.name : (downloadUrl ? 'ملف محمل مسبقاً' : 'اختر ملف التحميل')}
                      </p>
                    </div>
                  </label>
                  {!downloadFile && (
                    <input
                      type="url"
                      value={downloadUrl}
                      onChange={(e) => setDownloadUrl(e.target.value)}
                      className="w-full bg-dark p-3 rounded-xl border border-white/5 focus:border-primary/50 outline-none transition-colors text-sm"
                      placeholder="أو أدخل رابط التحميل مباشرة"
                    />
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-4 rounded-xl font-bold border border-white/10 hover:bg-white/5 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 bg-primary py-4 rounded-xl font-bold hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        {uploadProgress || 'جاري الحفظ...'}
                      </>
                    ) : (
                      <>
                        <Save size={20} />
                        {editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
