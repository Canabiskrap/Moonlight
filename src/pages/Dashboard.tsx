import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  db, 
  auth, 
  logout,
  deleteFile, 
  handleFirestoreError, 
  OperationType,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  setDoc
} from '../lib/firebase';
import { convertDriveLink, isValidUrl } from '../lib/utils';
import { SmartDiagnosticService } from '../lib/smartDiagnostic';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Package, 
  DollarSign, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  FileText, 
  Upload, 
  CheckCircle2, 
  Globe, 
  Search, 
  RefreshCw, 
  Sparkles, 
  ShoppingBag, 
  AlertCircle, 
  Settings, 
  Activity, 
  LogOut, 
  Loader2, 
  Zap, 
  Brain, 
  Instagram, 
  Twitter, 
  Facebook, 
  Send, 
  Video, 
  ExternalLink, 
  Clock,
  PlayCircle,
  UserCheck
} from 'lucide-react';

import { getProductInsights, chatWithBot } from '../services/geminiService';
import DashboardAnalytics from '../components/DashboardAnalytics';
import SmartAIAssistant from '../components/SmartAIAssistant';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export default function Dashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [serviceIcon, setServiceIcon] = useState('🎨');
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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [imageUploadType, setImageUploadType] = useState<'file' | 'link'>('file');
  const [customBucket, setCustomBucket] = useState('');
  const navigate = useNavigate();

  const uploadFile = async (file: File, onProgress?: (progress: number) => void) => {
    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append("file", file);

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress(percentComplete);
        }
      });

      xhr.addEventListener("load", () => {
        const text = xhr.responseText;
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          reject(new Error("Server returned invalid response: " + text));
          return;
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data.url);
        } else {
          reject(new Error(data.error || "Upload failed"));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network error during upload"));
      });

      xhr.open("POST", "/api/upload");
      xhr.send(formData);
    });
  };

  const addLog = (msg: string) => {
    console.log(`[Dashboard] ${msg}`);
    const time = new Date().toLocaleTimeString();
    setDebugLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 10));
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    setDebugLogs([]); // Clear logs
    addLog("بدء اختبار الاتصال الشامل...");
    try {
      // 1. Test Firestore
      addLog("1. اختبار Firestore...");
      try {
        const testCol = collection(db, 'test_connection');
        await addDoc(testCol, { 
          lastTest: Timestamp.now(),
          user: auth.currentUser?.email,
          status: 'ok'
        });
        addLog("✅ Firestore: متصل");
      } catch (fErr: any) {
        addLog(`❌ Firestore: فشل (${fErr.message})`);
      }

      // 2. Test Storage (Vercel Blob)
      addLog("2. اختبار Storage (Vercel Blob)...");
      try {
        addLog("✅ Vercel Blob: متصل (جاهز للرفع)");
      } catch (sErr: any) {
        addLog(`❌ Vercel Blob: فشل (الرسالة: ${sErr.message})`);
        console.error("Blob Diagnostic Error:", sErr);
      }

      addLog("تم الانتهاء من الفحص.");
    } catch (err: any) {
      addLog(`❌ فشل عام: ${err.message}`);
      console.error("Diagnostic Error:", err);
    } finally {
      setIsTestingConnection(false);
    }
  };

  useEffect(() => {
    setCurrentUser(auth.currentUser);
    const qProds = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const qServices = query(collection(db, 'services'), orderBy('createdAt', 'desc'));
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

    const unsubServices = onSnapshot(qServices, 
      (snapshot) => {
        setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => {
        console.error("Services Snapshot Error:", error);
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
      unsubServices();
      unsubOrders();
    };
  }, []);

  const isAdminUser = currentUser && 
    ["canabiskrap07@gmail.com", "esraa0badr@gmail.com"].includes(currentUser.email?.toLowerCase() || "");

  const isEmailVerified = currentUser?.emailVerified;

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setEditingServiceId(null);
    setName(product.name);
    setDescription(product.description);
    setPrice(product.price.toString());
    setCategory(product.category);
    setImageUrl(product.imageUrl);
    setDownloadUrl(product.downloadUrl);
    setUploadMethod('link'); // Default to link when editing to avoid re-uploading unless needed
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditService = (service: any) => {
    setEditingServiceId(service.id);
    setEditingId(null);
    setName(service.title);
    setDescription(service.description);
    setPrice(service.price.toString());
    setServiceIcon(service.icon || '🎨');
    setImageUrl(service.imageUrl || '');
    setDownloadUrl(service.downloadUrl || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setEditingServiceId(null);
    setName('');
    setDescription('');
    setPrice('');
    setServiceIcon('🎨');
    setImageFile(null);
    setProductFile(null);
    setImageUrl('');
    setDownloadUrl('');
    setStatus('idle');
    setUploadProgress(0);
  };

  const [activeTab, setActiveTab] = useState<'products' | 'services' | 'orders' | 'settings' | 'analytics' | 'ai'>('analytics');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [heroVideoFile, setHeroVideoFile] = useState<File | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingHeroVideo, setIsUploadingHeroVideo] = useState(false);
  const [heroVideoUrl, setHeroVideoUrl] = useState<string | null>(null);
  const [instagramUrl, setInstagramUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [telegramUrl, setTelegramUrl] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'appearance'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setHeroVideoUrl(data.heroVideoUrl || null);
        setInstagramUrl(data.instagramUrl || '');
        setTwitterUrl(data.twitterUrl || '');
        setFacebookUrl(data.facebookUrl || '');
        setTiktokUrl(data.tiktokUrl || '');
        setTelegramUrl(data.telegramUrl || '');
      }
    });
    return () => unsub();
  }, []);

  const handleSaveSocialLinks = async () => {
    try {
      addLog("جاري حفظ روابط التواصل الاجتماعي...");
      await setDoc(doc(db, 'settings', 'appearance'), {
        instagramUrl,
        twitterUrl,
        facebookUrl,
        tiktokUrl,
        telegramUrl,
        updatedAt: Timestamp.now()
      }, { merge: true });
      addLog("✅ تم حفظ الروابط بنجاح");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err: any) {
      addLog(`❌ فشل الحفظ: ${err.message}`);
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;
    setIsUploadingLogo(true);
      addLog("جاري رفع الشعار الجديد (Vercel Blob)...");
      
      try {
        const url = await uploadFile(logoFile);
        
        // Update a settings document in Firestore to store the logo URL
      await setDoc(doc(db, 'settings', 'appearance'), {
        logoUrl: url,
        updatedAt: Timestamp.now()
      }, { merge: true });
      
      addLog("تم تحديث الشعار بنجاح! سيظهر التغيير بعد تحديث الصفحة.");
      setLogoFile(null);
      setShowToast(true);
    } catch (err: any) {
      console.error("Logo Upload Error:", err);
      addLog(`خطأ في رفع الشعار: ${err.message}`);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleHeroVideoUpload = async () => {
    if (!heroVideoFile) return;
    setIsUploadingHeroVideo(true);
    addLog("جاري رفع فيديو الواجهة الجديد (Vercel Blob)...");
    
    try {
      const url = await uploadFile(heroVideoFile);
      
      await setDoc(doc(db, 'settings', 'appearance'), {
        heroVideoUrl: url,
        updatedAt: Timestamp.now()
      }, { merge: true });
      
      addLog("تم تحديث فيديو الواجهة بنجاح!");
      setHeroVideoFile(null);
      setShowToast(true);
    } catch (err: any) {
      console.error("Hero Video Upload Error:", err);
      addLog(`خطأ في رفع الفيديو: ${err.message}`);
    } finally {
      setIsUploadingHeroVideo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'uploading') return;
    
    setStatus('uploading');
    setErrorMessage('');
    setShowToast(false);
    setUploadProgress(1);
    addLog("بدء عملية الحفظ...");

    try {
      if (!auth.currentUser) throw new Error("يجب تسجيل الدخول كمسؤول.");
      if (!isAdminUser) throw new Error(`حسابك ليس لديه صلاحيات المسؤول.`);
      if (!isEmailVerified) throw new Error("يرجى تأكيد بريدك الإلكتروني.");

      const numericPrice = parseFloat(price);
      if (isNaN(numericPrice)) throw new Error("يرجى إدخال سعر صحيح");

      if (activeTab === 'services' || editingServiceId) {
        addLog("جاري حفظ الخدمة...");
        let docId = editingServiceId;
        const serviceData = {
          title: name,
          description,
          price: numericPrice,
          icon: serviceIcon,
          imageUrl: imageUploadType === 'link' ? imageUrl : (editingServiceId ? imageUrl : ''),
          downloadUrl: uploadMethod === 'link' ? downloadUrl : (editingServiceId ? downloadUrl : ''),
          updatedAt: Timestamp.now()
        };

        if (editingServiceId) {
          await updateDoc(doc(db, 'services', editingServiceId), serviceData);
        } else {
          const docRef = await addDoc(collection(db, 'services'), {
            ...serviceData,
            createdAt: Timestamp.now()
          });
          docId = docRef.id;
        }

        // Handle Image Upload for Service
        let finalImageUrl = imageUrl;
        if (imageFile) {
          addLog("جاري رفع صورة الخدمة...");
          finalImageUrl = await uploadFile(imageFile, (p) => setUploadProgress(p));
          addLog("تم رفع صورة الخدمة.");
          await updateDoc(doc(db, 'services', docId!), { imageUrl: finalImageUrl });
        }

        if (productFile) {
          addLog("جاري رفع ملف الخدمة...");
          const finalDownloadUrl = await uploadFile(productFile, (p) => setUploadProgress(p));
          addLog("تم رفع الملف.");
          await updateDoc(doc(db, 'services', docId!), { downloadUrl: finalDownloadUrl });
        }

        addLog("تم حفظ الخدمة بنجاح!");
      } else {
        // 1. Save to Firestore FIRST (with initial data)
        addLog("جاري حفظ البيانات الأساسية في قاعدة البيانات...");
        let docId = editingId;
        const productData = {
          name,
          description,
          price: numericPrice,
          category,
          imageUrl: imageUploadType === 'link' ? imageUrl : (editingId ? imageUrl : ''),
          downloadUrl: uploadMethod === 'link' ? downloadUrl : (editingId ? downloadUrl : ''),
          updatedAt: Timestamp.now()
        };

        if (editingId) {
          await updateDoc(doc(db, 'products', editingId), { ...productData });
        } else {
          const docRef = await addDoc(collection(db, 'products'), { 
            ...productData, 
            createdAt: Timestamp.now(),
            status: 'uploading'
          });
          docId = docRef.id;
        }
        addLog("تم حفظ البيانات الأساسية بنجاح (ID: " + docId + ")");

        // 2. Handle Uploads
        let finalImageUrl = imageUrl;
        let finalDownloadUrl = downloadUrl;

        if (imageFile) {
          addLog("جاري رفع الصورة...");
          finalImageUrl = await uploadFile(imageFile, (p) => setUploadProgress(p));
          addLog("تم رفع الصورة.");
          await updateDoc(doc(db, 'products', docId!), { imageUrl: finalImageUrl });
        }

        if (productFile) {
          addLog("جاري رفع الملف الرقمي...");
          finalDownloadUrl = await uploadFile(productFile, (p) => setUploadProgress(p));
          addLog("تم رفع الملف.");
          await updateDoc(doc(db, 'products', docId!), { downloadUrl: finalDownloadUrl });
        }

        // 3. Finalize
        await updateDoc(doc(db, 'products', docId!), { 
          imageUrl: finalImageUrl,
          downloadUrl: finalDownloadUrl,
          status: 'completed'
        });
      }
      
      setUploadProgress(100);
      addLog("تم الحفظ بنجاح!");
      setStatus('success');
      setShowToast(true);
      resetForm();
      
      setTimeout(() => {
        setStatus('idle');
        setShowToast(false);
      }, 3000);
      
    } catch (err: any) {
      console.error("Submit Error:", err);
      addLog("❌ خطأ: " + err.message);
      setStatus('error');
      setErrorMessage(err.message || "فشل حفظ البيانات");
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

  const handleDeleteService = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteDoc(doc(db, 'services', id));
      setDeletingId(null);
      addLog("تم حذف الخدمة بنجاح.");
    } catch (err: any) {
      console.error("Delete Service Error:", err);
      setDeletingId(null);
      setErrorMessage(err.message || "فشل حذف الخدمة");
    }
  };

  const totalRevenue = orders.reduce((sum, order) => sum + (order.amount || 0), 0);

  const [isTestingAI, setIsTestingAI] = useState(false);
  const uploadTaskRef = useRef<any>(null);

  const handleCancelUpload = () => {
    setStatus('idle');
    setUploadProgress(0);
    addLog("تم إلغاء عملية الرفع (ملاحظة: الرفع قد يستمر في الخلفية).");
  };

  const testAI = async () => {
    setIsTestingAI(true);
    addLog("جاري اختبار الذكاء الاصطناعي...");
    try {
      const result = await getProductInsights({
        name: "منتج تجريبي",
        description: "وصف تجريبي لاختبار النظام",
        category: "test",
        price: 10
      });
      addLog("✅ نجح اختبار الذكاء الاصطناعي: " + result.creativeSummary.substring(0, 50) + "...");
      alert("الذكاء الاصطناعي يعمل بنجاح! ✅");
    } catch (err: any) {
      const errorStr = JSON.stringify(err);
      let msg = err.message;
      if (errorStr.includes('403') || errorStr.includes('PERMISSION_DENIED')) {
        msg = "خطأ 403: ليس لديك صلاحية. يرجى التأكد من تفعيل Generative Language API لمفتاحك.";
      }
      addLog("❌ فشل اختبار الذكاء الاصطناعي: " + msg);
      console.error("AI Test Error:", err);
      alert("فشل اختبار الذكاء الاصطناعي: " + msg);
    } finally {
      setIsTestingAI(false);
    }
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleSmartLogout = async () => {
    try {
      addLog("جاري تسجيل الخروج...");
      await logout();
      navigate('/login');
    } catch (err: any) {
      console.error("Logout Error:", err);
      addLog("❌ فشل تسجيل الخروج: " + err.message);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: Timestamp.now()
      });
      addLog(`تم تحديث حالة الطلب إلى: ${newStatus}`);
    } catch (err) {
      console.error("Error updating order status:", err);
      addLog("خطأ في تحديث حالة الطلب");
    }
  };

  const handleTestPurchase = async (item: any, type: 'product' | 'service') => {
    try {
      addLog(`جاري إنشاء طلب تجريبي لـ ${type === 'product' ? 'منتج' : 'خدمة'}...`);
      
      const orderData = {
        productId: type === 'product' ? item.id : null,
        serviceId: type === 'service' ? item.id : null,
        productName: type === 'product' ? item.name : null,
        serviceTitle: type === 'service' ? item.title : null,
        amount: item.price,
        customerEmail: auth.currentUser?.email || 'admin@test.com',
        customerName: 'المدير (تجربة)',
        paypalOrderId: `TEST-${Math.random().toString(36).toUpperCase().slice(2, 10)}`,
        status: type === 'product' ? 'completed' : 'pending',
        downloadUrl: item.downloadUrl || '',
        type: type,
        isTest: true,
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      addLog("✅ تم إنشاء الطلب التجريبي بنجاح!");
      
      // Open Order Portal in a new tab
      window.open(`/order-portal/${docRef.id}`, '_blank');
    } catch (err) {
      console.error("Test purchase failed:", err);
      addLog("❌ فشل إنشاء الطلب التجريبي");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 pb-64"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="flex flex-col">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-black text-white tracking-tight">لوحة التحكم</h1>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">🌕 Management System</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 bg-dark-light/30 p-2 rounded-[2.5rem] border border-white/5">
          {[
            { id: 'analytics', label: 'التحليلات', icon: Activity, color: 'primary' },
            { id: 'ai', label: 'الذكاء الاصطناعي', icon: Brain, color: 'gold' },
            { id: 'products', label: 'المنتجات', icon: Package, color: 'primary' },
            { id: 'services', label: 'الخدمات', icon: Sparkles, color: 'primary' },
            { id: 'orders', label: 'الطلبات', icon: ShoppingBag, color: 'primary' },
            { id: 'settings', label: 'الإعدادات', icon: Settings, color: 'primary' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3.5 rounded-2xl text-sm font-black transition-all flex items-center gap-2 ${
                activeTab === tab.id 
                  ? tab.color === 'gold' 
                    ? 'bg-gold text-black shadow-lg shadow-gold/20' 
                    : 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="bg-dark-light/30 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
              
              <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
                    <Settings size={28} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white">إعدادات المظهر</h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">تخصيص هوية Moonlight 🌕</p>
                  </div>
                </div>

                <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-white mb-1">شعار المتجر (Logo)</h3>
                      <p className="text-xs text-gray-500 font-bold">سيظهر الشعار في أعلى وأسفل الموقع</p>
                    </div>
                    <div className="w-20 h-20 bg-dark rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden">
                      {logoFile ? (
                        <img src={URL.createObjectURL(logoFile)} className="w-full h-full object-contain p-2" alt="Preview" />
                      ) : (
                        <img src="/logo.png" className="w-full h-full object-contain p-2" alt="Current Logo" onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/100?text=Logo'} />
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="logo-upload-input"
                    />
                    <label 
                      htmlFor="logo-upload-input"
                      className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/10 rounded-3xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
                    >
                      <Upload className="text-gray-500 mb-3 group-hover:text-primary transition-colors" size={32} />
                      <span className="text-sm font-black text-gray-400 group-hover:text-white transition-colors">
                        {logoFile ? logoFile.name : 'اختر صورة الشعار الجديد'}
                      </span>
                      <span className="text-[10px] text-gray-600 mt-2">يفضل أن تكون الخلفية شفافة (PNG)</span>
                    </label>

                    <button 
                      onClick={handleLogoUpload}
                      disabled={!logoFile || isUploadingLogo}
                      className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {isUploadingLogo ? (
                        <>
                          <RefreshCw size={18} className="animate-spin" />
                          جاري الرفع...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={18} />
                          حفظ الشعار الجديد
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-500">
                      <Instagram size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">روابط التواصل الاجتماعي</h3>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">اربط متجرك بمنصات التواصل</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest mr-2">رابط إنستغرام</label>
                      <div className="relative">
                        <Instagram className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input 
                          type="text"
                          value={instagramUrl}
                          onChange={(e) => setInstagramUrl(e.target.value)}
                          placeholder="https://instagram.com/your-store"
                          className="w-full bg-white/5 border border-white/5 focus:border-primary/50 outline-none p-4 pr-12 rounded-2xl text-sm transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest mr-2">رابط تويتر (X)</label>
                      <div className="relative">
                        <Twitter className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input 
                          type="text"
                          value={twitterUrl}
                          onChange={(e) => setTwitterUrl(e.target.value)}
                          placeholder="https://twitter.com/your-store"
                          className="w-full bg-white/5 border border-white/5 focus:border-primary/50 outline-none p-4 pr-12 rounded-2xl text-sm transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest mr-2">رابط فيسبوك</label>
                      <div className="relative">
                        <Facebook className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input 
                          type="text"
                          value={facebookUrl}
                          onChange={(e) => setFacebookUrl(e.target.value)}
                          placeholder="https://facebook.com/your-store"
                          className="w-full bg-white/5 border border-white/5 focus:border-primary/50 outline-none p-4 pr-12 rounded-2xl text-sm transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest mr-2">رابط تيك توك</label>
                      <div className="relative">
                        <Video className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input 
                          type="text"
                          value={tiktokUrl}
                          onChange={(e) => setTiktokUrl(e.target.value)}
                          placeholder="https://tiktok.com/@your-store"
                          className="w-full bg-white/5 border border-white/5 focus:border-primary/50 outline-none p-4 pr-12 rounded-2xl text-sm transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest mr-2">رابط تلغرام</label>
                      <div className="relative">
                        <Send className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input 
                          type="text"
                          value={telegramUrl}
                          onChange={(e) => setTelegramUrl(e.target.value)}
                          placeholder="https://t.me/your-store"
                          className="w-full bg-white/5 border border-white/5 focus:border-primary/50 outline-none p-4 pr-12 rounded-2xl text-sm transition-all"
                        />
                      </div>
                    </div>

                    <button 
                      onClick={handleSaveSocialLinks}
                      className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3 border border-white/5"
                    >
                      <CheckCircle2 size={18} className="text-primary" />
                      حفظ الروابط
                    </button>
                  </div>
                </div>

                      <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5 space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <Zap size={24} />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-white">فيديو الواجهة الرئيسية</h3>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">ارفع الفيديو الذي تعبت في إنشائه هنا</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                          <div className="space-y-4">
                            <div className="relative group">
                              <input 
                                type="file" 
                                accept="video/*"
                                onChange={(e) => setHeroVideoFile(e.target.files?.[0] || null)}
                                className="hidden"
                                id="hero-video-upload"
                              />
                              <label 
                                htmlFor="hero-video-upload"
                                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-white/10 rounded-[2rem] cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
                              >
                                {heroVideoFile ? (
                                  <div className="flex flex-col items-center gap-2 text-primary font-bold text-xs p-4 text-center">
                                    <CheckCircle2 size={32} />
                                    <span className="break-all">{heroVideoFile.name}</span>
                                  </div>
                                ) : (
                                  <>
                                    <Upload className="text-gray-500 mb-2 group-hover:text-primary transition-colors" size={32} />
                                    <span className="text-xs text-gray-500 font-bold">اختر ملف الفيديو (MP4)</span>
                                  </>
                                )}
                              </label>
                            </div>
                            <button 
                              onClick={handleHeroVideoUpload}
                              disabled={!heroVideoFile || isUploadingHeroVideo}
                              className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
                            >
                              {isUploadingHeroVideo ? (
                                <>
                                  <RefreshCw size={18} className="animate-spin" />
                                  جاري الرفع...
                                </>
                              ) : (
                                <>
                                  <Zap size={18} />
                                  تحديث فيديو الواجهة
                                </>
                              )}
                            </button>
                          </div>

                          <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">المعاينة الحالية</label>
                            <div className="aspect-video rounded-[2rem] overflow-hidden border border-white/10 bg-dark flex items-center justify-center relative group">
                              {heroVideoUrl ? (
                                <video 
                                  src={heroVideoUrl} 
                                  className="w-full h-full object-cover"
                                  autoPlay 
                                  loop 
                                  muted 
                                  playsInline
                                />
                              ) : (
                                <div className="text-gray-600 flex flex-col items-center gap-2">
                                  <Zap size={48} className="opacity-20" />
                                  <span className="text-xs font-bold">لا يوجد فيديو حالياً</span>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">فيديو الواجهة</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gold/10 border border-gold/20 p-6 rounded-3xl flex items-start gap-4">
                  <div className="bg-gold/20 p-2 rounded-lg text-gold">
                    <Activity size={20} />
                  </div>
                  <div>
                    <h4 className="text-gold font-black text-sm mb-1">نصيحة تقنية</h4>
                    <p className="text-xs text-gray-400 leading-relaxed font-bold">
                      بعد رفع الشعار، قد يستغرق الأمر بضع ثوانٍ ليظهر في جميع صفحات الموقع. إذا لم يتغير الشعار فوراً، يرجى تحديث الصفحة.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Add/Edit Product Form */}
            <div className={`lg:col-span-1 space-y-8 ${activeTab === 'orders' ? 'hidden lg:block opacity-30 pointer-events-none' : ''}`}>
          <div className="bg-dark-light/30 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
            
            <div className="flex justify-between items-center mb-8 relative z-10">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${editingId || editingServiceId ? 'bg-gold/20 text-gold' : 'bg-primary/20 text-primary'}`}>
                  {editingId || editingServiceId ? <CheckCircle2 size={20} /> : <Plus size={20} />}
                </div>
                {editingId ? 'تعديل المنتج' : editingServiceId ? 'تعديل الخدمة' : activeTab === 'services' ? 'إضافة خدمة' : 'إضافة منتج'}
              </h2>
              {(editingId || editingServiceId) && (
                <button 
                  onClick={resetForm}
                  className="text-xs font-bold text-gray-500 hover:text-white transition-colors flex items-center gap-1"
                >
                  إلغاء
                </button>
              )}
            </div>

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black flex items-center gap-2">
                {editingId || editingServiceId ? <CheckCircle2 className="text-gold" /> : <Plus className="text-primary" />}
                {editingId ? 'تعديل المنتج' : editingServiceId ? 'تعديل الخدمة' : activeTab === 'services' ? 'إضافة خدمة جديدة' : 'إضافة منتج جديد'}
              </h2>
              {(editingId || editingServiceId) && (
                <button 
                  onClick={resetForm}
                  className="text-xs font-bold text-gray-500 hover:text-white underline"
                >
                  إلغاء التعديل
                </button>
              )}
            </div>

            {/* Admin Debug Info */}
            {currentUser && !isAdminUser && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] text-center space-y-3"
              >
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="text-red-500" size={24} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black text-red-500">تنبيه الصلاحيات</p>
                  <p className="text-[10px] text-gray-400">أنت مسجل دخول بـ: <span className="text-white">{currentUser.email}</span></p>
                </div>
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                  هذا الحساب ليس مسجلاً كمسؤول. يرجى تسجيل الدخول بالحساب الصحيح للتحكم في المتجر.
                </p>
              </motion.div>
            )}

            {currentUser && isAdminUser && !isEmailVerified && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-8 p-6 bg-gold/10 border border-gold/20 rounded-[2rem] text-center space-y-3"
              >
                <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="text-gold" size={24} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black text-gold">تأكيد البريد الإلكتروني</p>
                  <p className="text-[10px] text-gray-400">بريدك <span className="text-white">{currentUser.email}</span> غير مؤكد</p>
                </div>
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                  يرجى تأكيد بريدك في إعدادات جوجل لتتمكن من نشر المنتجات.
                </p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              {errorMessage && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-2"
                >
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-xs font-bold flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={14} />
                      <span>{errorMessage}</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        setStatus('idle');
                        setErrorMessage('');
                      }}
                      className="text-[10px] bg-red-500/20 hover:bg-red-500/30 px-3 py-1.5 rounded-lg self-start transition-all"
                    >
                      إعادة المحاولة
                    </button>
                  </div>
                </motion.div>
              )}
              
              {showToast && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded-2xl text-xs font-bold flex items-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  تم {editingId || editingServiceId ? 'تحديث' : 'إضافة'} {activeTab === 'services' || editingServiceId ? 'الخدمة' : 'المنتج'} بنجاح!
                </motion.div>
              )}
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">
                    {activeTab === 'services' || editingServiceId ? 'اسم الخدمة' : 'اسم المنتج'}
                  </label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder={activeTab === 'services' || editingServiceId ? "مثال: تصميم هوية بصرية" : "مثال: قالب سيرة ذاتية احترافي"}
                    className="bg-white/5 border border-white/5 focus:border-primary/50 focus:bg-white/10 outline-none transition-all w-full p-4 rounded-2xl text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">
                      {activeTab === 'services' || editingServiceId ? 'أيقونة' : 'الفئة'}
                    </label>
                    {activeTab === 'services' || editingServiceId ? (
                      <input 
                        type="text" 
                        value={serviceIcon} 
                        onChange={(e) => setServiceIcon(e.target.value)}
                        placeholder="🎨"
                        className="bg-white/5 border border-white/5 focus:border-primary/50 focus:bg-white/10 outline-none transition-all w-full p-4 rounded-2xl text-sm"
                      />
                    ) : (
                      <div className="relative">
                        <select 
                          value={category} 
                          onChange={(e) => setCategory(e.target.value)}
                          className="bg-white/5 border border-white/5 focus:border-primary/50 focus:bg-white/10 outline-none transition-all w-full p-4 rounded-2xl text-sm appearance-none cursor-pointer"
                        >
                          <option value="cv">سيرة ذاتية</option>
                          <option value="social">سوشيال ميديا</option>
                          <option value="web">قالب ويب</option>
                          <option value="other">أخرى</option>
                        </select>
                        <Settings className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">السعر ($)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={price} 
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="bg-white/5 border border-white/5 focus:border-primary/50 focus:bg-white/10 outline-none transition-all w-full p-4 rounded-2xl text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-1 bg-white/5 rounded-2xl border border-white/5 flex">
                    <button 
                      type="button"
                      onClick={() => setUploadMethod('direct')}
                      className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${uploadMethod === 'direct' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                      رفع ملفات
                    </button>
                    <button 
                      type="button"
                      onClick={() => setUploadMethod('link')}
                      className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${uploadMethod === 'link' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
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
                        <label className="text-sm font-bold text-gray-400">2. {activeTab === 'services' || editingServiceId ? 'ملف الخدمة (اختياري)' : 'الملف الرقمي'}</label>
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
                                <div className="flex flex-col items-center gap-2 text-primary font-bold text-xs p-4 text-center">
                                  <CheckCircle2 size={24} />
                                  <span className="break-all">{productFile.name}</span>
                                </div>
                              ) : downloadUrl ? (
                                <div className="flex flex-col items-center gap-2 text-primary font-bold text-xs p-4 text-center">
                                  <Package size={24} />
                                  <span>ملف موجود مسبقاً</span>
                                </div>
                              ) : (
                                <>
                                  <Upload className="text-gray-500 mb-2" size={24} />
                                  <span className="text-xs text-gray-500">ارفع الملف الرقمي (ZIP)</span>
                                </>
                              )}
                            </label>
                          </div>
                        </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-bold text-gray-400">1. صورة الغلاف</label>
                          <div className="flex bg-dark rounded-lg p-1 border border-white/5">
                            <button 
                              type="button"
                              onClick={() => setImageUploadType('file')}
                              className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${imageUploadType === 'file' ? 'bg-primary text-white' : 'text-gray-500'}`}
                            >
                              رفع ملف
                            </button>
                            <button 
                              type="button"
                              onClick={() => setImageUploadType('link')}
                              className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${imageUploadType === 'link' ? 'bg-primary text-white' : 'text-gray-500'}`}
                            >
                              رابط خارجي
                            </button>
                          </div>
                        </div>

                        {imageUploadType === 'file' ? (
                          <div className="relative group">
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                              className="hidden"
                              id="image-upload-link"
                            />
                            <label 
                              htmlFor="image-upload-link"
                              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                            >
                              {imageFile ? (
                                <div className="flex flex-col items-center gap-2 text-primary font-bold text-xs p-4 text-center">
                                  <CheckCircle2 size={24} />
                                  <span className="break-all">{imageFile.name}</span>
                                </div>
                              ) : imageUrl ? (
                                <div className="flex flex-col items-center gap-2 text-primary font-bold text-xs p-4 text-center">
                                  <img 
                                    src={convertDriveLink(imageUrl)} 
                                    className="w-12 h-12 rounded-lg object-cover mb-1" 
                                    referrerPolicy="no-referrer"
                                    onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Error'}
                                  />
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
                        ) : (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <input 
                                type="url" 
                                value={imageUrl} 
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https:// رابط الصورة..."
                                className="bg-dark border-white/5 focus:border-primary outline-none transition-all flex-1 p-4 rounded-2xl"
                              />
                              {imageUrl && (
                                <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 bg-dark-light flex items-center justify-center">
                                  <img 
                                    src={convertDriveLink(imageUrl)} 
                                    className="w-full h-full object-cover" 
                                    referrerPolicy="no-referrer" 
                                    alt="Preview"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      if (!target.src.includes('placeholder')) {
                                        target.src = 'https://via.placeholder.com/150?text=Invalid+Link';
                                      }
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                            {imageUrl.includes('drive.google.com') && (
                              <div className="bg-primary/10 border border-primary/20 p-3 rounded-xl space-y-1">
                                <p className="text-[10px] text-primary font-bold flex items-center gap-1">
                                  <Sparkles size={12} />
                                  تم اكتشاف رابط Google Drive
                                </p>
                                <p className="text-[9px] text-gray-400 leading-tight">
                                  تأكد من أن الملف في Google Drive مضبوط على "أي شخص لديه الرابط يمكنه العرض" (Anyone with the link can view) وإلا فلن تظهر الصورة للعملاء.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-bold text-gray-400">2. {activeTab === 'services' || editingServiceId ? 'رابط ملف الخدمة (اختياري)' : 'رابط تحميل الملف'}</label>
                            {downloadUrl.includes('drive.google.com') && (
                              <span className="text-[10px] text-primary font-bold">رابط Google Drive ✅</span>
                            )}
                          </div>
                          <input 
                            type="url" 
                            value={downloadUrl} 
                            onChange={(e) => setDownloadUrl(e.target.value)}
                            placeholder="https:// رابط تحميل الملف الرقمي..."
                            className="bg-dark border-white/5 focus:border-primary outline-none transition-all w-full p-4 rounded-2xl"
                            required={uploadMethod === 'link'}
                          />
                          {downloadUrl.includes('drive.google.com') && (
                            <p className="text-[9px] text-gray-500 px-2">
                              * تأكد من جعل الملف "عام" (Public) في Google Drive ليتمكن العميل من تحميله بعد الشراء.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">
                  {activeTab === 'services' || editingServiceId ? 'وصف الخدمة' : 'وصف المنتج'}
                </label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب التفاصيل هنا..."
                  className="bg-white/5 border border-white/5 focus:border-primary/50 focus:bg-white/10 outline-none transition-all w-full p-4 rounded-2xl min-h-[120px] text-sm resize-none"
                  required
                />
              </div>

              <div className="space-y-4 pt-4">
                {status === 'uploading' && (
                  <div className="space-y-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <div className="flex justify-between items-center">
                      <div className="space-y-2 flex-1">
                        <div className="flex justify-between text-[10px] font-black text-primary uppercase tracking-widest">
                          <span>جاري المعالجة</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-dark/50 rounded-full h-2 overflow-hidden border border-white/5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(uploadProgress, 5)}%` }}
                            className="bg-primary h-full rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCancelUpload}
                        className="ml-4 px-3 py-1 bg-red-500/10 text-red-500 rounded-lg text-[10px] font-black hover:bg-red-500/20 transition-all"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
                
                <button 
                  type="submit" 
                  disabled={status === 'uploading' || status === 'success'}
                  className={`w-full py-5 rounded-2xl font-black text-sm transition-all shadow-2xl relative overflow-hidden group ${
                    status === 'success' ? 'bg-green-500 text-white' :
                    status === 'error' ? 'bg-red-500 text-white hover:bg-red-600' :
                    'bg-primary text-white hover:bg-primary-dark disabled:opacity-50'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  {status === 'uploading' ? (
                    <div className="relative z-10 flex flex-col items-center gap-2">
                      <div className="flex items-center justify-center gap-3">
                        <RefreshCw size={18} className="animate-spin" />
                        {uploadProgress > 0 
                          ? `جاري الحفظ... ${Math.round(uploadProgress)}%` 
                          : "جاري التحضير..."}
                      </div>
                      <div 
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCancelUpload();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCancelUpload();
                          }
                        }}
                        className="text-[10px] text-white/60 hover:text-white underline font-bold mt-1 transition-colors cursor-pointer"
                      >
                        إلغاء العملية
                      </div>
                    </div>
                  ) : status === 'success' ? (
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      تم الحفظ بنجاح
                    </span>
                  ) : (
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {editingId || editingServiceId ? <CheckCircle2 size={18} /> : <Plus size={18} />}
                      {editingId || editingServiceId ? "تحديث التغييرات" : activeTab === 'services' ? "نشر الخدمة الآن" : "نشر المنتج الآن"}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Products List & Orders */}
        <div className="lg:col-span-2 space-y-10">
          {activeTab === 'analytics' && (
            <DashboardAnalytics 
              orders={orders} 
              products={products} 
              services={services} 
              addLog={addLog} 
              testAI={testAI}
              testConnection={testConnection}
              isTestingAI={isTestingAI}
              isTestingConnection={isTestingConnection}
              debugLogs={debugLogs}
            />
          )}

          {activeTab === 'ai' && (
            <SmartAIAssistant products={products} orders={orders} />
          )}

          {activeTab === 'services' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-dark-light/30 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gold/10 rounded-2xl flex items-center justify-center text-gold border border-gold/20">
                    <Sparkles size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">الخدمات المتاحة</h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">إدارة وتطوير خدماتك ({services.length})</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {services.map((s, index) => (
                  <motion.div 
                    key={s.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-dark-light/30 backdrop-blur-xl rounded-[2rem] border ${editingServiceId === s.id ? 'border-gold shadow-[0_0_30px_rgba(234,179,8,0.15)]' : 'border-white/5 hover:border-white/20'} overflow-hidden group transition-all duration-500 flex flex-col`}
                  >
                    <div className="p-6 flex-grow space-y-6">
                      <div className="flex justify-between items-start">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform duration-500">
                          {s.imageUrl ? (
                            <img src={convertDriveLink(s.imageUrl)} className="w-full h-full object-cover rounded-2xl" alt={s.title} />
                          ) : (
                            s.icon || '🎨'
                          )}
                        </div>
                        <div className="bg-gold/10 text-gold px-4 py-1.5 rounded-full text-sm font-black border border-gold/20">
                          ${s.price}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-black text-white mb-2 group-hover:text-gold transition-colors">{s.title}</h3>
                        <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">{s.description}</p>
                      </div>
                    </div>
                    
                    <div className="p-4 border-t border-white/5 bg-white/[0.02] flex items-center justify-between gap-2">
                      <button 
                        onClick={() => handleTestPurchase(s, 'service')}
                        className="w-12 h-12 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white rounded-xl transition-all flex items-center justify-center"
                        title="تجربة شراء (بوابة العميل)"
                      >
                        <PlayCircle size={20} />
                      </button>

                      <button 
                        onClick={() => handleEditService(s)}
                        className="flex-1 py-3 bg-white/5 hover:bg-primary/20 text-white hover:text-primary rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2"
                      >
                        <FileText size={16} />
                        تعديل
                      </button>
                      
                      {deletingId === s.id ? (
                        <div className="flex-1 flex items-center gap-1 bg-red-500/10 p-1 rounded-xl border border-red-500/20">
                          <button 
                            onClick={() => handleDeleteService(s.id)} 
                            className="flex-1 bg-red-500 text-white py-2 rounded-lg text-[10px] font-black hover:bg-red-600 transition-colors"
                          >
                            تأكيد
                          </button>
                          <button 
                            onClick={() => setDeletingId(null)} 
                            className="flex-1 bg-white/10 text-white py-2 rounded-lg text-[10px] font-black hover:bg-white/20 transition-colors"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setDeletingId(s.id)}
                          className="flex-1 py-3 bg-white/5 hover:bg-red-500/20 text-white hover:text-red-500 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2"
                        >
                          <Trash2 size={16} />
                          حذف
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="bg-dark-light/30 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center text-gold">
                    <Package size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">المنتجات</h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">إدارة المخزون ({products.length})</p>
                  </div>
                </div>
                
                <div className="relative w-full md:w-80">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input 
                    type="text"
                    placeholder="بحث عن منتج..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 focus:border-primary/50 outline-none p-4 pr-12 rounded-2xl text-sm transition-all"
                  />
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                      <th className="p-6">المنتج</th>
                      <th className="p-6">الفئة</th>
                      <th className="p-6">السعر</th>
                      <th className="p-6 text-left">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredProductsList.map((p, index) => (
                      <motion.tr 
                        key={p.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`group hover:bg-white/[0.02] transition-colors ${editingId === p.id ? 'bg-primary/5' : ''}`}
                      >
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 group-hover:border-primary/30 transition-colors bg-dark relative">
                              <img 
                                src={convertDriveLink(p.imageUrl)} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                referrerPolicy="no-referrer" 
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  if (!target.src.includes('placeholder')) {
                                    target.src = 'https://via.placeholder.com/150?text=Error';
                                  }
                                }}
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-black text-white group-hover:text-primary transition-colors">{p.name}</span>
                              <span className="text-[10px] text-gray-500 line-clamp-1 max-w-[200px]">{p.description}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-gray-400 border border-white/5">
                            {p.category === 'cv' ? 'سيرة ذاتية' : p.category === 'social' ? 'سوشيال ميديا' : 'قالب ويب'}
                          </span>
                        </td>
                        <td className="p-6 font-black text-gold tracking-tighter text-lg">${p.price}</td>
                        <td className="p-6">
                          <div className="flex items-center gap-2 justify-end">
                            <button 
                              onClick={() => handleTestPurchase(p, 'product')}
                              className="w-10 h-10 flex items-center justify-center bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-xl transition-all"
                              title="تجربة شراء (بوابة العميل)"
                            >
                              <PlayCircle size={18} />
                            </button>
                            <button 
                              onClick={() => handleEdit(p)}
                              className="w-10 h-10 flex items-center justify-center bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-all"
                              title="تعديل"
                            >
                              <FileText size={18} />
                            </button>
                            
                            {deletingId === p.id ? (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-2 bg-red-500/10 p-1.5 rounded-xl border border-red-500/20"
                              >
                                <span className="text-[9px] font-black text-red-500 px-2 uppercase">تأكيد؟</span>
                                <button 
                                  onClick={() => handleDelete(p.id, p.imageUrl, p.downloadUrl)} 
                                  className="bg-red-500 text-white px-4 py-1.5 rounded-lg text-[10px] font-black hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                                >
                                  نعم
                                </button>
                                <button 
                                  onClick={() => setDeletingId(null)} 
                                  className="bg-white/10 text-white px-4 py-1.5 rounded-lg text-[10px] font-black hover:bg-white/20 transition-colors"
                                >
                                  لا
                                </button>
                              </motion.div>
                            ) : (
                              <button 
                                onClick={() => setDeletingId(p.id)}
                                className="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                                title="حذف"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {activeTab === 'orders' && (
            <div className="bg-dark-light/30 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500">
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">آخر الطلبات</h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">سجل المبيعات ({orders.length})</p>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                      <th className="p-6">المنتج</th>
                      <th className="p-6">العميل</th>
                      <th className="p-6">المبلغ</th>
                      <th className="p-6">الحالة</th>
                      <th className="p-6">رابط البوابة</th>
                      <th className="p-6">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {orders.map((o, index) => (
                      <motion.tr 
                        key={o.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="p-6 font-black text-white">
                          {o.productName || o.serviceTitle}
                          {o.isTest && (
                            <span className="mr-2 px-2 py-0.5 bg-gold/20 text-gold text-[8px] rounded-md border border-gold/30">تجريبي</span>
                          )}
                        </td>
                        <td className="p-6 text-sm text-gray-400 font-medium">{o.customerEmail}</td>
                        <td className="p-6 font-black text-green-400 tracking-tighter text-lg">${o.amount}</td>
                        <td className="p-6">
                          <select 
                            value={o.status || 'pending'} 
                            onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                            className={`text-[10px] font-black px-3 py-1.5 rounded-lg outline-none border transition-all ${
                              o.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                              o.status === 'processing' ? 'bg-primary/10 text-primary border-primary/20' :
                              'bg-gray-500/10 text-gray-500 border-white/10'
                            }`}
                          >
                            <option value="pending">📦 تم استلام الطلب</option>
                            <option value="processing">⚙️ جاري التجهيز</option>
                            <option value="completed">✅ جاهز للتحميل</option>
                          </select>
                        </td>
                        <td className="p-6">
                          <button 
                            onClick={() => window.open(`/order-portal/${o.id}`, '_blank')}
                            className="text-primary hover:text-white transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                          >
                            <ExternalLink size={14} />
                            فتح البوابة
                          </button>
                        </td>
                        <td className="p-6 text-[10px] text-gray-500 font-bold">
                          {o.createdAt?.toDate().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    )}


    {/* Debug Logs - Collapsible at bottom */}
      <div className="mt-20">
      </div>

      {/* Final Logout Section at the very bottom */}
      <div className="mt-40 pt-20 border-t border-white/5 flex flex-col items-center gap-8 pb-20 relative z-10">
        <div className="text-center space-y-3">
          <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <LogOut className="text-red-500 w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-white">إنهاء جلسة الإدارة</h3>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">
            سيتم إغلاق لوحة التحكم وتسجيل خروجك بأمان من النظام.
          </p>
        </div>
        
        <div className="flex flex-col items-center gap-6 w-full max-w-sm">
          <AnimatePresence mode="wait">
            {!showLogoutConfirm ? (
              <motion.button
                key="logout-btn"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px -10px rgba(239, 68, 68, 0.2)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full py-6 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-[2.5rem] border border-red-500/20 transition-all font-black text-xl flex items-center justify-center gap-4 shadow-2xl"
              >
                <LogOut size={24} />
                تسجيل الخروج الآمن
              </motion.button>
            ) : (
              <motion.div
                key="confirm-box"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full p-6 bg-red-500 rounded-3xl shadow-2xl shadow-red-500/20 text-center space-y-4"
              >
                <p className="font-black text-white">هل أنت متأكد حقاً؟</p>
                <div className="flex gap-3">
                  <button 
                    onClick={handleSmartLogout}
                    className="flex-1 py-3 bg-white text-red-500 rounded-2xl font-black hover:bg-gray-100 transition-colors"
                  >
                    نعم، خروج
                  </button>
                  <button 
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 py-3 bg-black/20 text-white rounded-2xl font-black hover:bg-black/30 transition-colors"
                  >
                    تراجع
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="flex items-center gap-4 opacity-30">
          <div className="h-[1px] w-12 bg-gray-500"></div>
          <p className="text-[8px] text-gray-500 uppercase tracking-[0.5em] font-black">🌕 Security Protocol</p>
          <div className="h-[1px] w-12 bg-gray-500"></div>
        </div>
      </div>
    </motion.div>
  );
}
