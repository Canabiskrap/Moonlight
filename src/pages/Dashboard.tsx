import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytesResumable, getDownloadURL, uploadBytes, getStorage } from 'firebase/storage';
import { 
  db, 
  storage, 
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
import { Plus, Trash2, Package, DollarSign, Image as ImageIcon, Link as LinkIcon, FileText, Upload, CheckCircle2, Globe, Search, RefreshCw, Sparkles, ShoppingBag, AlertCircle, Settings, Activity, LogOut, Loader2 } from 'lucide-react';

import { getProductInsights } from '../services/geminiService';

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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [imageUploadType, setImageUploadType] = useState<'file' | 'link'>('file');
  const [customBucket, setCustomBucket] = useState('');
  const navigate = useNavigate();

  const addLog = (msg: string) => {
    console.log(`[Dashboard] ${msg}`);
    const time = new Date().toLocaleTimeString();
    setDebugLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 10));
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    addLog("بدء اختبار الاتصال الشامل...");
    try {
      // 1. Test Firestore
      addLog("1. اختبار Firestore...");
      const testCol = collection(db, 'test_connection');
      await addDoc(testCol, { 
        lastTest: Timestamp.now(),
        user: auth.currentUser?.email,
        status: 'ok',
        type: 'full_diagnostic'
      });
      addLog("✅ Firestore: متصل");

      // 2. Test Storage
      addLog("2. اختبار Storage...");
      try {
        const activeStorage = customBucket ? getStorage(storage.app, customBucket) : storage;
        if (customBucket) addLog(`استخدام Bucket مخصص: ${customBucket}`);
        
        const storageTestRef = ref(activeStorage, `test/connection_${Date.now()}.txt`);
        const blob = new Blob(["connection test"], { type: "text/plain" });
        
        const uploadPromise = uploadBytes(storageTestRef, blob);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("انتهت مهلة اختبار التخزين (30 ثانية). قد يكون هناك حظر للاتصال أو الـ Bucket غير صحيح.")), 30000)
        );

        await Promise.race([uploadPromise, timeoutPromise]);
        addLog("✅ Storage: متصل (تم رفع ملف تجريبي)");
      } catch (sErr: any) {
        addLog(`❌ Storage: فشل (${sErr.code || sErr.message})`);
        if (sErr.code === 'storage/retry-limit-exceeded' || sErr.message.includes('مهلة')) {
          addLog("تنبيه: يبدو أن هناك مشكلة في إعدادات الـ Bucket أو جدار حماية يمنع الاتصال.");
          addLog("نصيحة: جرب استخدام 'روابط خارجية' ووضع رابط مباشر للصورة والملف لتجاوز هذه المشكلة.");
        }
      }

      alert("تم الانتهاء من الفحص. راجع سجل العمليات (Debug) للتفاصيل.");
    } catch (err: any) {
      addLog(`❌ فشل عام: ${err.message}`);
      console.error("Diagnostic Error:", err);
      alert(`فشل الفحص: ${err.message}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  useEffect(() => {
    setCurrentUser(auth.currentUser);
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

  const isAdminUser = currentUser && 
    ["canabiskrap07@gmail.com", "esraa0badr@gmail.com"].includes(currentUser.email?.toLowerCase() || "");

  const isEmailVerified = currentUser?.emailVerified;

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
    setUploadProgress(1); // Start at 1% to show "Saving..." instead of "Preparing..."
    addLog("بدء عملية الحفظ...");

    try {
      if (!auth.currentUser) {
        throw new Error("يجب تسجيل الدخول كمسؤول للقيام بهذه العملية.");
      }

      if (!isAdminUser) {
        throw new Error(`حسابك (${currentUser?.email}) ليس لديه صلاحيات المسؤول.`);
      }

      if (!isEmailVerified) {
        throw new Error("يرجى تأكيد بريدك الإلكتروني في جوجل لتتمكن من النشر.");
      }

      let finalImageUrl = convertDriveLink(imageUrl);
      let finalDownloadUrl = downloadUrl;

      if (uploadMethod === 'direct') {
        const createTimeout = (ms: number, msg: string) => 
          new Promise((_, reject) => setTimeout(() => reject(new Error(msg)), ms));

        const activeStorage = customBucket ? getStorage(storage.app, customBucket) : storage;

        if (imageFile) {
          addLog("جاري رفع الصورة...");
          const imageRef = ref(activeStorage, `products/images/${Date.now()}_${imageFile.name}`);
          const imageUploadTask = uploadBytesResumable(imageRef, imageFile);
          
          imageUploadTask.on('state_changed', (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 10;
            setUploadProgress(Math.round(progress));
          });

          try {
            await Promise.race([
              imageUploadTask,
              createTimeout(120000, "انتهت مهلة رفع الصورة (دقيقتان). يرجى التحقق من اتصال الإنترنت.")
            ]);
            finalImageUrl = await getDownloadURL(imageRef);
            addLog("تم رفع الصورة بنجاح");
          } catch (imgErr: any) {
            addLog(`خطأ في رفع الصورة: ${imgErr.message}`);
            throw new Error("فشل رفع الصورة: " + imgErr.message);
          }
        }
        
        if (productFile) {
          addLog("جاري رفع الملف الرقمي...");
          const fileRef = ref(activeStorage, `products/files/${Date.now()}_${productFile.name}`);
          const fileUploadTask = uploadBytesResumable(fileRef, productFile);
          
          // Track progress
          fileUploadTask.on('state_changed', (snapshot) => {
            const progress = 10 + ((snapshot.bytesTransferred / snapshot.totalBytes) * 90);
            setUploadProgress(Math.round(progress));
          });

          try {
            await Promise.race([
              fileUploadTask,
              createTimeout(600000, "انتهت مهلة رفع الملف (10 دقائق). إذا كان الملف كبيراً جداً، يرجى التأكد من استقرار الإنترنت.")
            ]);
            finalDownloadUrl = await getDownloadURL(fileRef);
            addLog("تم رفع الملف بنجاح");
          } catch (uploadErr: any) {
            addLog(`خطأ في رفع الملف: ${uploadErr.message}`);
            throw new Error("فشل رفع الملف الرقمي: " + uploadErr.message);
          }
        }
      } else {
        // Validation for link method
        const activeStorage = customBucket ? getStorage(storage.app, customBucket) : storage;
        const createTimeout = (ms: number, msg: string) => 
          new Promise((_, reject) => setTimeout(() => reject(new Error(msg)), ms));

        if (imageUploadType === 'file' && imageFile) {
          addLog("جاري رفع الصورة (طريقة الرابط)...");
          const imageRef = ref(activeStorage, `products/images/${Date.now()}_${imageFile.name}`);
          const imageUploadTask = uploadBytesResumable(imageRef, imageFile);
          
          imageUploadTask.on('state_changed', (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 50;
            setUploadProgress(Math.round(progress));
          });

          try {
            await Promise.race([
              imageUploadTask,
              createTimeout(120000, "انتهت مهلة رفع الصورة (دقيقتان).")
            ]);
            finalImageUrl = await getDownloadURL(imageRef);
            addLog("تم رفع الصورة بنجاح");
          } catch (imgErr: any) {
            addLog(`خطأ في رفع الصورة: ${imgErr.message}`);
            throw new Error("فشل رفع الصورة: " + imgErr.message);
          }
        } else if (imageUploadType === 'link' || !imageFile) {
          if (imageUrl) {
            const convertedUrl = convertDriveLink(imageUrl);
            if (!isValidUrl(convertedUrl)) {
              // Try to fix common missing https://
              if (imageUrl.includes('.') && !imageUrl.startsWith('http')) {
                finalImageUrl = `https://${imageUrl}`;
              } else {
                throw new Error("رابط الصورة غير صالح. يجب أن يبدأ بـ http:// أو https://");
              }
            } else {
              finalImageUrl = convertedUrl;
            }
          }
        }

        if (downloadUrl && !isValidUrl(downloadUrl)) {
          if (downloadUrl.includes('.') && !downloadUrl.startsWith('http')) {
            finalDownloadUrl = `https://${downloadUrl}`;
          } else {
            throw new Error("رابط التحميل غير صالح. يجب أن يبدأ بـ http:// أو https://");
          }
        }
        
        // Google Drive link helper
        if (finalDownloadUrl.includes('drive.google.com')) {
          addLog("تنبيه: تم اكتشاف رابط Google Drive. تأكد من أنه رابط مباشر للتحميل.");
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
          addLog("جاري تحديث البيانات في قاعدة البيانات...");
          await updateDoc(doc(db, 'products', editingId), productData);
          addLog("تم التحديث بنجاح");
        } else {
          addLog("جاري إضافة المنتج لقاعدة البيانات...");
          await addDoc(collection(db, 'products'), {
            ...productData,
            createdAt: Timestamp.now()
          });
          addLog("تمت الإضافة بنجاح");
        }
      } catch (firestoreErr) {
        addLog(`خطأ في قاعدة البيانات: ${firestoreErr instanceof Error ? firestoreErr.message : 'خطأ غير معروف'}`);
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
      // If we are still in uploading state and no success/error was set, reset to idle
      // This prevents the UI from being stuck if an uncaught error occurs
      setTimeout(() => {
        setStatus(current => {
          if (current === 'uploading') return 'idle';
          return current;
        });
      }, 10000); // 10 second safety timeout
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

  const [isTestingAI, setIsTestingAI] = useState(false);

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
            <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">Moonlight Management System</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-dark-light/50 backdrop-blur-xl px-8 py-5 rounded-[2rem] border border-white/5 text-right relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-gold opacity-50" />
            <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">إجمالي الأرباح</p>
            <p className="text-2xl font-black text-gold tracking-tighter">${totalRevenue.toFixed(2)}</p>
            <DollarSign className="absolute -bottom-2 -left-2 w-16 h-16 text-gold/5 -rotate-12 group-hover:scale-110 transition-transform duration-500" />
          </motion.div>
          
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-dark-light/50 backdrop-blur-xl px-8 py-5 rounded-[2rem] border border-white/5 text-right relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-50" />
            <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">إجمالي الطلبات</p>
            <p className="text-2xl font-black text-primary tracking-tighter">{orders.length}</p>
            <ShoppingBag className="absolute -bottom-2 -left-2 w-16 h-16 text-primary/5 -rotate-12 group-hover:scale-110 transition-transform duration-500" />
          </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Add/Edit Product Form */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-dark-light/30 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
            
            <div className="flex justify-between items-center mb-8 relative z-10">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${editingId ? 'bg-gold/20 text-gold' : 'bg-primary/20 text-primary'}`}>
                  {editingId ? <CheckCircle2 size={20} /> : <Plus size={20} />}
                </div>
                {editingId ? 'تعديل المنتج' : 'إضافة منتج'}
              </h2>
              {editingId && (
                <button 
                  onClick={resetForm}
                  className="text-xs font-bold text-gray-500 hover:text-white transition-colors flex items-center gap-1"
                >
                  إلغاء
                </button>
              )}
            </div>

            {/* Smart Fix & System Health - Collapsible or Integrated */}
            <div className="mb-8 p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-primary" />
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">حالة النظام</h3>
                </div>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500/30"></div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-dark/40 p-3 rounded-2xl border border-white/5 text-center group hover:border-primary/30 transition-colors">
                  <p className="text-[8px] text-gray-500 mb-1 font-bold uppercase">Database</p>
                  <p className="text-[10px] font-black text-green-400">ONLINE</p>
                </div>
                <div className="bg-dark/40 p-3 rounded-2xl border border-white/5 text-center group hover:border-primary/30 transition-colors">
                  <p className="text-[8px] text-gray-500 mb-1 font-bold uppercase">Storage</p>
                  <p className="text-[10px] font-black text-green-400">ACTIVE</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={async () => {
                    addLog("بدء الفحص...");
                    const results = await SmartDiagnosticService.runFullDiagnostic();
                    if (results.firestore.status === 'ok' && results.storage.status === 'ok') {
                      alert("النظام يعمل بكفاءة عالية ✅");
                    }
                  }}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw size={12} />
                  فحص
                </button>

                <button 
                  onClick={async () => {
                    if (!confirm("هل تريد تشغيل الإصلاح الذكي لجميع المنتجات؟ سيقوم النظام بتصحيح الروابط التالفة تلقائياً.")) return;
                    
                    addLog("بدء إصلاح جميع المنتجات...");
                    let fixedCount = 0;
                    
                    for (const product of products) {
                      const { fixed, changes } = await SmartDiagnosticService.autoFixProduct(product);
                      if (changes.length > 0) {
                        addLog(`جاري إصلاح المنتج: ${product.name} (${changes.join(', ')})`);
                        await updateDoc(doc(db, 'products', product.id), fixed);
                        fixedCount++;
                      }
                    }
                    
                    if (fixedCount > 0) {
                      addLog(`✅ تم إصلاح ${fixedCount} منتج بنجاح.`);
                      alert(`تم الانتهاء! تم إصلاح ${fixedCount} منتج تلقائياً.`);
                    } else {
                      addLog("✅ لم يتم العثور على مشاكل تحتاج لإصلاح في المنتجات الحالية.");
                      alert("جميع المنتجات سليمة ولا تحتاج لإصلاح.");
                    }
                  }}
                  className="flex-1 py-3 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/20 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles size={12} />
                  إصلاح
                </button>
              </div>
            </div>

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
            
            {/* System Diagnostic & Tools Section */}
            <div className="mb-10 bg-dark-light/30 rounded-[2.5rem] border border-white/5 overflow-hidden backdrop-blur-sm">
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                    <Activity className="text-primary" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">أدوات النظام والتشخيص</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">System Health & AI Diagnostics</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Storage Bucket</p>
                    <p className="text-[9px] text-primary/70 font-mono">{storage.app.options.storageBucket || 'Default'}</p>
                  </div>
                  <button 
                    onClick={() => setDebugLogs([])}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 transition-colors"
                    title="مسح السجل"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-8">
                {/* Log Display */}
                <div className="bg-black/40 rounded-3xl p-6 font-mono text-[11px] text-gray-400 space-y-2 max-h-48 overflow-auto border border-white/5 scrollbar-hide shadow-inner">
                  {debugLogs.length > 0 ? (
                    debugLogs.map((log, i) => (
                      <div key={i} className="flex gap-3 items-start group">
                        <span className="text-primary/40 shrink-0 font-bold">[{i}]</span>
                        <span className={`break-all ${log.includes('❌') ? 'text-red-400' : log.includes('✅') ? 'text-green-400' : ''}`}>
                          {log}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 opacity-20">
                      <Activity size={32} className="mb-2" />
                      <p className="italic font-bold">لا توجد عمليات مسجلة حالياً</p>
                    </div>
                  )}
                </div>

                {/* Tool Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-primary transition-colors">
                        <Globe size={16} />
                      </div>
                      <input 
                        type="text"
                        placeholder="تغيير الـ Bucket..."
                        value={customBucket}
                        onChange={(e) => setCustomBucket(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs outline-none focus:border-primary/50 focus:bg-primary/5 transition-all text-white font-bold"
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={testAI}
                    disabled={isTestingAI}
                    className="flex items-center justify-center gap-3 py-4 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-2xl text-xs font-black transition-all disabled:opacity-50"
                  >
                    {isTestingAI ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                    اختبار الذكاء الاصطناعي
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={testConnection}
                    disabled={isTestingConnection}
                    className="flex items-center justify-center gap-3 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl text-xs font-black transition-all disabled:opacity-50 shadow-xl"
                  >
                    {isTestingConnection ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                    بدء الفحص الشامل
                  </motion.button>
                </div>
                
                <p className="text-[10px] text-gray-600 text-center font-medium">
                  * ملاحظة: تغيير الـ Bucket يؤثر فقط على الجلسة الحالية لأغراض الاختبار الفني.
                </p>
              </div>
            </div>

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
                  تم {editingId ? 'تحديث' : 'إضافة'} المنتج بنجاح!
                </motion.div>
              )}
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">اسم المنتج</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: قالب سيرة ذاتية احترافي"
                    className="bg-white/5 border border-white/5 focus:border-primary/50 focus:bg-white/10 outline-none transition-all w-full p-4 rounded-2xl text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">الفئة</label>
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
                      <label className="text-sm font-bold text-gray-400">2. رابط تحميل الملف</label>
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

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">وصف المنتج</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب تفاصيل المنتج هنا..."
                  className="bg-white/5 border border-white/5 focus:border-primary/50 focus:bg-white/10 outline-none transition-all w-full p-4 rounded-2xl min-h-[120px] text-sm resize-none"
                  required
                />
              </div>

              <div className="space-y-4 pt-4">
                {status === 'uploading' && (
                  <div className="space-y-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <div className="space-y-2">
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
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      <RefreshCw size={18} className="animate-spin" />
                      {uploadProgress > 0 
                        ? `جاري الحفظ... ${Math.round(uploadProgress)}%` 
                        : "جاري التحضير..."}
                    </span>
                  ) : status === 'success' ? (
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      تم الحفظ بنجاح
                    </span>
                  ) : (
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {editingId ? <CheckCircle2 size={18} /> : <Plus size={18} />}
                      {editingId ? "تحديث التغييرات" : "نشر المنتج الآن"}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Products List & Orders */}
        <div className="lg:col-span-2 space-y-10">
          {/* Products Table */}
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

          {/* Orders Table */}
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
                    <th className="p-6">رقم الطلب</th>
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
                      <td className="p-6 font-black text-white">{o.productName}</td>
                      <td className="p-6 text-sm text-gray-400 font-medium">{o.customerEmail}</td>
                      <td className="p-6 font-black text-green-400 tracking-tighter text-lg">${o.amount}</td>
                      <td className="p-6 text-[10px] font-mono text-gray-500">{o.paypalOrderId || '---'}</td>
                      <td className="p-6 text-[10px] text-gray-500 font-bold">
                        {o.createdAt?.toDate().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

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
          <p className="text-[8px] text-gray-500 uppercase tracking-[0.5em] font-black">Moonlight Security Protocol</p>
          <div className="h-[1px] w-12 bg-gray-500"></div>
        </div>
      </div>
    </motion.div>
  );
}
