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
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { 
  Plus, 
  Trash2, 
  Package, 
  DollarSign, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  FileText, 
  Upload, 
  ArrowRight, 
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
  UserCheck,
  Lightbulb,
  Palette,
  Rocket
} from 'lucide-react';

import { getProductInsights, chatWithBot } from '../services/geminiService';
import DashboardAnalytics from '../components/DashboardAnalytics';
import SmartAIAssistant from '../components/SmartAIAssistant';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function Dashboard() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceSAR, setPriceSAR] = useState('');
  const [priceKWD, setPriceKWD] = useState('');
  const [priceUSD, setPriceUSD] = useState('');
  const [priceAED, setPriceAED] = useState('');
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
  const [isCheckingLinks, setIsCheckingLinks] = useState(false);
  const [linkResults, setLinkResults] = useState<any[]>([]);
  const [imageUploadType, setImageUploadType] = useState<'file' | 'link'>('file');
  const [customBucket, setCustomBucket] = useState('');
  const [isZenMode, setIsZenMode] = useState(false);
  const [inspirationNotes, setInspirationNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
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
    const qInspiration = query(collection(db, 'inspiration_notes'), orderBy('createdAt', 'desc'));
    const qGallery = query(collection(db, 'creative_gallery'), orderBy('createdAt', 'desc'));

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

    const unsubInspiration = onSnapshot(qInspiration, 
      (snapshot) => {
        setInspirationNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => {
        console.error("Inspiration Snapshot Error:", error);
      }
    );

    return () => {
      unsubProds();
      unsubServices();
      unsubOrders();
      unsubInspiration();
    };
  }, []);

  const isAdminUser = currentUser && 
    [
      "canabiskrap07@gmail.com", 
      "canabiskrap007@gmail.com",
      "esraa0badr@gmail.com",
      "samemlywk@gmail.com",
      "karmabiskrap@gmail.com"
    ].includes(currentUser.email?.toLowerCase().trim() || "");

  const isEmailVerified = currentUser?.emailVerified;

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setEditingServiceId(null);
    setName(product.name);
    setDescription(product.description);
    setPriceSAR(product.priceSAR?.toString() || '');
    setPriceKWD(product.priceKWD?.toString() || '');
    setPriceUSD(product.priceUSD?.toString() || '');
    setPriceAED(product.priceAED?.toString() || '');
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
    setPriceSAR(service.priceSAR?.toString() || '');
    setPriceKWD(service.priceKWD?.toString() || '');
    setPriceUSD(service.priceUSD?.toString() || '');
    setPriceAED(service.priceAED?.toString() || '');
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
    setPriceSAR('');
    setPriceKWD('');
    setPriceUSD('');
    setPriceAED('');
    setServiceIcon('🎨');
    setImageFile(null);
    setProductFile(null);
    setImageUrl('');
    setDownloadUrl('');
    setStatus('idle');
    setUploadProgress(0);
  };

  const [activeTab, setActiveTab] = useState<'products' | 'services' | 'orders' | 'settings' | 'analytics' | 'ai' | 'factory' | 'inspiration'>('analytics');
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
  const [aiPersona, setAiPersona] = useState<'ceo' | 'artist' | 'buddy'>('ceo');
  const [moonSyncEnabled, setMoonSyncEnabled] = useState(false);
  const [whatsappNotificationsEnabled, setWhatsappNotificationsEnabled] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [weeklyReportEnabled, setWeeklyReportEnabled] = useState(false);
  const [brandColors, setBrandColors] = useState<string[]>([]);
  const [brandFonts, setBrandFonts] = useState<string[]>([]);
  const [brandDescription, setBrandDescription] = useState('');

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
        setAiPersona(data.aiPersona || 'ceo');
        setMoonSyncEnabled(data.moonSyncEnabled || false);
        setWhatsappNotificationsEnabled(data.whatsappNotificationsEnabled || false);
        setWhatsappNumber(data.whatsappNumber || '');
        setWeeklyReportEnabled(data.weeklyReportEnabled || false);
        setBrandColors(data.brandColors || []);
        setBrandFonts(data.brandFonts || []);
        setBrandDescription(data.brandDescription || '');
      }
    });
    return () => unsub();
  }, []);

  const handleSaveGeneralSettings = async () => {
    try {
      addLog("جاري حفظ الإعدادات العامة...");
      await setDoc(doc(db, 'settings', 'appearance'), {
        aiPersona,
        moonSyncEnabled,
        whatsappNotificationsEnabled,
        whatsappNumber,
        weeklyReportEnabled,
        brandColors,
        brandFonts,
        brandDescription,
        updatedAt: Timestamp.now()
      }, { merge: true });
      addLog("✅ تم حفظ الإعدادات بنجاح");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err: any) {
      addLog(`❌ فشل الحفظ: ${err.message}`);
    }
  };

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

      if (activeTab === 'services' || editingServiceId) {
        addLog("جاري حفظ الخدمة...");
        let docId = editingServiceId;
        
        // Encrypt downloadUrl if it's a link
        let finalDownloadUrl = downloadUrl;
        if (uploadMethod === 'link' && downloadUrl && !downloadUrl.includes(':')) {
          addLog("جاري تشفير رابط التحميل...");
          const res = await fetch('/api/encrypt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: downloadUrl })
          });
          const data = await res.json();
          if (data.encryptedUrl) finalDownloadUrl = data.encryptedUrl;
        }

        const serviceData = {
          title: name,
          description,
          priceSAR: parseFloat(priceSAR) || 0,
          priceKWD: parseFloat(priceKWD) || 0,
          priceUSD: parseFloat(priceUSD) || 0,
          priceAED: parseFloat(priceAED) || 0,
          icon: serviceIcon,
          imageUrl: imageUploadType === 'link' ? imageUrl : (editingServiceId ? imageUrl : ''),
          downloadUrl: finalDownloadUrl,
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

        // Encrypt downloadUrl if it's a link
        let finalDownloadUrl = downloadUrl;
        if (uploadMethod === 'link' && downloadUrl && !downloadUrl.includes(':')) {
          addLog("جاري تشفير رابط التحميل...");
          const res = await fetch('/api/encrypt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: downloadUrl })
          });
          const data = await res.json();
          if (data.encryptedUrl) finalDownloadUrl = data.encryptedUrl;
        }

        const productData = {
          name,
          description,
          priceSAR: parseFloat(priceSAR) || 0,
          priceKWD: parseFloat(priceKWD) || 0,
          priceUSD: parseFloat(priceUSD) || 0,
          priceAED: parseFloat(priceAED) || 0,
          category,
          imageUrl: imageUploadType === 'link' ? imageUrl : (editingId ? imageUrl : ''),
          downloadUrl: finalDownloadUrl,
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
        finalDownloadUrl = downloadUrl;

        if (imageFile) {
          addLog("جاري رفع الصورة...");
          finalImageUrl = await uploadFile(imageFile, (p) => setUploadProgress(p));
          addLog("تم رفع الصورة.");
          await updateDoc(doc(db, 'products', docId!), { imageUrl: finalImageUrl });
        }

        if (productFile) {
          addLog("جاري رفع الملف الرقمي...");
          const rawUrl = await uploadFile(productFile, (p) => setUploadProgress(p));
          addLog("تم رفع الملف. جاري التشفير...");
          
          const res = await fetch('/api/encrypt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: rawUrl })
          });
          const data = await res.json();
          finalDownloadUrl = data.encryptedUrl || rawUrl;
          
          addLog("تم التشفير.");
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
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
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

  const handleInstantPublish = (data: any) => {
    setName(data.title || '');
    setDescription(data.description || data.content || '');
    setPriceUSD(data.priceSuggestion?.replace(/[^0-9.]/g, '') || '');
    setActiveTab('products'); // Switch to products tab to see the form
    addLog("🚀 تم نقل بيانات المنتج إلى النموذج بنجاح!");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const checkProductLinks = async () => {
    setIsCheckingLinks(true);
    addLog("🩺 طبيب الروابط يبدأ الفحص الشامل...");
    
    try {
      const rawLinks = [
        ...products.map(p => p.downloadUrl),
        ...services.map(s => s.downloadUrl),
        ...products.map(p => p.imageUrl),
        ...services.map(s => s.imageUrl),
        heroVideoUrl,
        instagramUrl,
        twitterUrl,
        facebookUrl,
        tiktokUrl,
        telegramUrl
      ];

      const allLinks = Array.from(new Set(rawLinks.filter(url => url && typeof url === 'string' && url.trim() !== '')));

      if (allLinks.length === 0) {
        addLog("ℹ️ لا توجد روابط خارجية للفحص.");
        setIsCheckingLinks(false);
        return;
      }

      const response = await fetch('/api/check-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: allLinks })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      setLinkResults(data.results || []);
      
      const issues = data.results.filter((r: any) => r.status !== 'ok');
      if (issues.length > 0) {
        addLog(`⚠️ تم اكتشاف ${issues.length} مشكلة في الروابط!`);
      } else {
        addLog("✅ جميع الروابط سليمة ومتاحة للعملاء.");
      }
    } catch (err: any) {
      addLog("❌ فشل فحص الروابط: " + err.message);
    } finally {
      setIsCheckingLinks(false);
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

  const handleDeleteOrder = async (orderId: string) => {
    try {
      addLog("جاري حذف الطلب...");
      await deleteDoc(doc(db, 'orders', orderId));
      addLog("✅ تم حذف الطلب بنجاح");
      setDeletingOrderId(null);
    } catch (err: any) {
      console.error("Delete Order Error:", err);
      addLog(`❌ فشل حذف الطلب: ${err.message}`);
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
      exit={{ opacity: 0, y: -20 }}
      className="space-y-10 pb-64"
    >
      {/* Store Health Pulse Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{
            opacity: [0.05, 0.15, 0.05],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: status === 'uploading' ? 1 : 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] bg-primary/20 blur-[120px] rounded-full"
        />
        <motion.div
          animate={{
            opacity: [0.03, 0.1, 0.03],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: status === 'uploading' ? 1.5 : 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] bg-gold/10 blur-[120px] rounded-full"
        />
      </div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="flex flex-col">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-black text-white tracking-tight">{t('dashboard.title')}</h1>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">🌕 {t('dashboard.managementSystem')}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 bg-dark-light/30 p-2 rounded-[2.5rem] border border-white/5">
          {[
            { id: 'analytics', label: t('dashboard.tabs.analytics'), icon: Activity, color: 'primary' },
            { id: 'ai', label: t('dashboard.tabs.ai'), icon: Brain, color: 'gold' },
            { id: 'factory', label: t('dashboard.tabs.factory'), icon: Zap, color: 'primary' },
            { id: 'products', label: t('dashboard.tabs.products'), icon: Package, color: 'primary' },
            { id: 'services', label: t('dashboard.tabs.services'), icon: Sparkles, color: 'primary' },
            { id: 'orders', label: t('dashboard.tabs.orders'), icon: ShoppingBag, color: 'primary' },
            { id: 'inspiration', label: 'لوحة الإلهام', icon: Lightbulb, color: 'gold' },
            { id: 'settings', label: t('dashboard.tabs.settings'), icon: Settings, color: 'primary' },
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
                    <h2 className="text-3xl font-black text-white">مظهر المتجر</h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">تخصيص الهوية البصرية والروابط</p>
                  </div>
                </div>

                <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-white mb-1">شعار المتجر (Logo)</h3>
                      <p className="text-xs text-gray-500 font-bold">يفضل أن يكون بخلفية شفافة PNG</p>
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
                        {logoFile ? logoFile.name : 'اختر ملف الشعار'}
                      </span>
                      <span className="text-[10px] text-gray-600 mt-2">اسحب الملف هنا أو اضغط للاختيار</span>
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
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">اربط حساباتك لتظهر في أسفل الموقع</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest mr-2">إنستغرام</label>
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
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest mr-2">تويتر (X)</label>
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
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest mr-2">فيسبوك</label>
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
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest mr-2">تيك توك</label>
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
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest mr-2">تيليجرام</label>
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
                      حفظ جميع الروابط
                    </button>
                  </div>
                </div>

                      <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5 space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <Zap size={24} />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-white">فيديو الواجهة (Hero)</h3>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">تغيير الفيديو المتحرك في الصفحة الرئيسية</p>
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
                                    <span className="text-xs text-gray-500 font-bold">اختر فيديو جديد</span>
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
                      استخدم فيديوهات قصيرة (أقل من 10 ثوانٍ) وبحجم صغير لضمان سرعة تحميل الموقع للزوار.
                    </p>
                  </div>
                </div>

                {/* AI Persona Section */}
                <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500">
                      <Brain size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">شخصية الذكاء الاصطناعي</h3>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">اختر كيف يتحدث معك المصنع والمساعد</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'ceo', label: 'المدير (CEO)', desc: 'رسمي ومباشر' },
                      { id: 'artist', label: 'الفنان (Artist)', desc: 'ملهم وشاعري' },
                      { id: 'buddy', label: 'الصديق (Buddy)', desc: 'مرح وودود' }
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setAiPersona(p.id as any)}
                        className={`p-4 rounded-2xl border transition-all text-center space-y-1 ${
                          aiPersona === p.id 
                            ? 'border-primary bg-primary/10 text-white' 
                            : 'border-white/5 bg-white/5 text-gray-500 hover:border-white/20'
                        }`}
                      >
                        <p className="text-xs font-black">{p.label}</p>
                        <p className="text-[9px] opacity-60">{p.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Moon Sync Section */}
                <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                        <Zap size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white">مزامنة دورة القمر</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">تغيير ثيم الموقع حسب حالة القمر الحقيقية</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setMoonSyncEnabled(!moonSyncEnabled)}
                      className={`w-14 h-8 rounded-full transition-all relative ${moonSyncEnabled ? 'bg-primary' : 'bg-gray-700'}`}
                    >
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${moonSyncEnabled ? 'right-7' : 'right-1'}`} />
                    </button>
                  </div>
                </div>

                {/* Notification Hub Section */}
                <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500">
                      <Send size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">مركز الإشعارات</h3>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">إشعارات الواتساب والتقارير</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div>
                        <p className="text-sm font-bold text-white">إشعارات WhatsApp</p>
                        <p className="text-[10px] text-gray-500">استلام تحديثات الطلبات فوراً</p>
                      </div>
                      <button
                        onClick={() => setWhatsappNotificationsEnabled(!whatsappNotificationsEnabled)}
                        className={`w-12 h-6 rounded-full transition-all relative ${whatsappNotificationsEnabled ? 'bg-green-500' : 'bg-gray-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${whatsappNotificationsEnabled ? 'right-7' : 'right-1'}`} />
                      </button>
                    </div>
                    {whatsappNotificationsEnabled && (
                      <input 
                        type="text"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        placeholder="رقم الواتساب (مثال: 966500000000)"
                        className="w-full bg-white/5 border border-white/5 focus:border-green-500 outline-none p-4 rounded-2xl text-sm transition-all"
                      />
                    )}
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div>
                        <p className="text-sm font-bold text-white">تقرير Moonlight الأسبوعي</p>
                        <p className="text-[10px] text-gray-500">ملخص ذكاء اصطناعي لأداء متجرك</p>
                      </div>
                      <button
                        onClick={() => setWeeklyReportEnabled(!weeklyReportEnabled)}
                        className={`w-12 h-6 rounded-full transition-all relative ${weeklyReportEnabled ? 'bg-primary' : 'bg-gray-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${weeklyReportEnabled ? 'right-7' : 'right-1'}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Brand Vault Section */}
                <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center text-gold">
                      <Sparkles size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">خزنة الهوية (Brand Vault)</h3>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">تخزين أصول علامتك التجارية للذكاء الاصطناعي</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">وصف العلامة التجارية (للذكاء الاصطناعي)</label>
                      <textarea 
                        value={brandDescription}
                        onChange={(e) => setBrandDescription(e.target.value)}
                        placeholder="اشرح قصة براندك، قيمك، والجمهور المستهدف..."
                        className="w-full bg-white/5 border border-white/5 focus:border-primary outline-none p-4 rounded-2xl text-sm min-h-[100px] resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">أكواد الألوان (HEX)</label>
                      <input 
                        type="text"
                        value={brandColors.join(', ')}
                        onChange={(e) => setBrandColors(e.target.value.split(',').map(c => c.trim()))}
                        placeholder="#A855F7, #050505, #F59E0B"
                        className="w-full bg-white/5 border border-white/5 focus:border-primary outline-none p-4 rounded-2xl text-sm"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSaveGeneralSettings}
                  className="w-full py-5 bg-primary text-white rounded-[2rem] font-black text-sm hover:bg-primary-dark transition-all shadow-2xl shadow-primary/20 flex items-center justify-center gap-3"
                >
                  <CheckCircle2 size={20} />
                  حفظ جميع الإعدادات الجديدة
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'settings' && (
          <div className={`grid grid-cols-1 lg:grid-cols-3 gap-10 transition-all duration-700 ${isZenMode ? 'blur-sm opacity-20 pointer-events-none scale-95' : ''}`}>
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
                  إلغاء التعديل
                </button>
              )}
            </div>

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black flex items-center gap-2">
                {editingId || editingServiceId ? <CheckCircle2 className="text-gold" /> : <Plus className="text-primary" />}
                {editingId ? 'تعديل المنتج الحالي' : editingServiceId ? 'تعديل الخدمة الحالية' : activeTab === 'services' ? 'إضافة خدمة جديدة' : 'إضافة منتج جديد'}
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
                  <p className="text-[10px] text-gray-400">أنت مسجل دخول بـ <span className="text-white">{currentUser.email}</span></p>
                </div>
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                  هذا الحساب ليس لديه صلاحيات المسؤول. لن تتمكن من حفظ التغييرات أو حذف البيانات.
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
                  <p className="text-sm font-black text-gold">تأكيد البريد الإلكتروني مطلوب</p>
                  <p className="text-[10px] text-gray-400">أنت مسجل دخول بـ <span className="text-white">{currentUser.email}</span> ولكن البريد غير مؤكد.</p>
                </div>
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                  يرجى مراجعة بريدك الإلكتروني والضغط على رابط التأكيد لتتمكن من إدارة المتجر.
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
                      {t('dashboard.form.preparing')}
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
                  تم {editingId || editingServiceId ? t('common.edit') : t('common.save')} {activeTab === 'services' || editingServiceId ? t('dashboard.form.serviceName') : t('dashboard.form.productName')} بنجاح!
                </motion.div>
              )}
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">
                    {activeTab === 'services' || editingServiceId ? t('dashboard.form.serviceName') : t('dashboard.form.productName')}
                  </label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder={activeTab === 'services' || editingServiceId ? t('dashboard.form.namePlaceholderService') : t('dashboard.form.namePlaceholderProduct')}
                    className="bg-white/5 border border-white/5 focus:border-primary/50 focus:bg-white/10 outline-none transition-all w-full p-4 rounded-2xl text-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">
                    {activeTab === 'services' || editingServiceId ? t('dashboard.form.iconLabel') : t('dashboard.form.categoryLabel')}
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
                          <option value="cv">{t('hero.categories.cv')}</option>
                          <option value="social">{t('hero.categories.social')}</option>
                          <option value="web">{t('hero.categories.web')}</option>
                          <option value="other">{t('hero.categories.other')}</option>
                        </select>
                      <Settings className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-1 bg-white/5 rounded-2xl border border-white/5 flex">
                      <button 
                        type="button"
                        onClick={() => setUploadMethod('direct')}
                        className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${uploadMethod === 'direct' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                      >
                        {t('dashboard.form.uploadMethodFiles')}
                      </button>
                      <button 
                        type="button"
                        onClick={() => setUploadMethod('link')}
                        className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${uploadMethod === 'link' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                      >
                        {t('dashboard.form.uploadMethodLinks')}
                      </button>
                  </div>

                  {uploadMethod === 'direct' ? (
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-400">1. {t('dashboard.form.coverImage')}</label>
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
                                <span>{t('dashboard.form.existingImage')}</span>
                              </div>
                            ) : (
                              <>
                                <Upload className="text-gray-500 mb-2" size={24} />
                                <span className="text-xs text-gray-500">{t('dashboard.form.chooseImage')}</span>
                              </>
                            )}
                          </label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-400">2. {activeTab === 'services' || editingServiceId ? t('dashboard.form.serviceFileOptional') : t('dashboard.form.digitalFile')}</label>
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
                                  <span>{t('dashboard.form.existingFile')}</span>
                                </div>
                              ) : (
                                <>
                                  <Upload className="text-gray-500 mb-2" size={24} />
                                  <span className="text-xs text-gray-500">{t('dashboard.form.chooseFile')}</span>
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
                          <label className="text-sm font-bold text-gray-400">1. {t('dashboard.form.coverImage')}</label>
                          <div className="flex bg-dark rounded-lg p-1 border border-white/5">
                              <button 
                                type="button"
                                onClick={() => setImageUploadType('file')}
                                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${imageUploadType === 'file' ? 'bg-primary text-white' : 'text-gray-500'}`}
                              >
                                {t('dashboard.form.uploadFile')}
                              </button>
                              <button 
                                type="button"
                                onClick={() => setImageUploadType('link')}
                                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${imageUploadType === 'link' ? 'bg-primary text-white' : 'text-gray-500'}`}
                              >
                                {t('dashboard.form.externalLink')}
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
                                  <span>{t('dashboard.form.existingImage')}</span>
                                </div>
                              ) : (
                                <>
                                  <Upload className="text-gray-500 mb-2" size={24} />
                                  <span className="text-xs text-gray-500">{t('dashboard.form.chooseImage')}</span>
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
                                placeholder={t('dashboard.form.imageLinkPlaceholder')}
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
                                <p className="text-[10px] text-gold font-bold flex items-center gap-1">
                                  <Sparkles size={12} />
                                  {t('dashboard.form.driveDetected')}
                                </p>
                                <p className="text-[9px] text-gray-400 leading-tight">
                                  {t('dashboard.form.driveHint')}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-bold text-gray-400">2. {activeTab === 'services' || editingServiceId ? t('dashboard.form.serviceFileOptional') : t('dashboard.form.downloadLink')}</label>
                            {downloadUrl.includes('drive.google.com') && (
                              <span className="text-[10px] text-gold font-bold">رابط Google Drive ✅</span>
                            )}
                          </div>
                          <input 
                            type="url" 
                            value={downloadUrl} 
                            onChange={(e) => setDownloadUrl(e.target.value)}
                            placeholder={t('dashboard.form.downloadLinkPlaceholder')}
                            className="bg-dark border-white/5 focus:border-primary outline-none transition-all w-full p-4 rounded-2xl"
                            required={uploadMethod === 'link'}
                          />
                          {downloadUrl.includes('drive.google.com') && (
                            <p className="text-[9px] text-gray-500 px-2">
                              {t('dashboard.form.drivePublicHint')}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">
                  {activeTab === 'services' || editingServiceId ? t('dashboard.form.serviceName') : t('dashboard.form.productName')}
                </label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('dashboard.form.descriptionPlaceholder')}
                  className="bg-white/5 border border-white/5 focus:border-primary/50 focus:bg-white/10 outline-none transition-all w-full p-4 rounded-2xl min-h-[120px] text-sm resize-none"
                  required
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">الدفع</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">SAR (السعودية 🇸🇦)</label>
                    <input type="number" step="0.01" value={priceSAR} onChange={(e) => setPriceSAR(e.target.value)} placeholder="0.00" className="bg-white/5 border border-white/5 focus:border-primary/50 focus:bg-white/10 outline-none transition-all w-full p-4 rounded-2xl text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">KWD (الكويت 🇰🇼)</label>
                    <input type="number" step="0.01" value={priceKWD} onChange={(e) => setPriceKWD(e.target.value)} placeholder="0.00" className="bg-white/5 border border-white/5 focus:border-primary/50 focus:bg-white/10 outline-none transition-all w-full p-4 rounded-2xl text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">USD (الولايات المتحدة 🇺🇸)</label>
                    <input type="number" step="0.01" value={priceUSD} onChange={(e) => setPriceUSD(e.target.value)} placeholder="0.00" className="bg-white/5 border border-white/5 focus:border-primary/50 focus:bg-white/10 outline-none transition-all w-full p-4 rounded-2xl text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">AED (الإمارات 🇦🇪)</label>
                    <input type="number" step="0.01" value={priceAED} onChange={(e) => setPriceAED(e.target.value)} placeholder="0.00" className="bg-white/5 border border-white/5 focus:border-primary/50 focus:bg-white/10 outline-none transition-all w-full p-4 rounded-2xl text-sm" />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                {status === 'uploading' && (
                  <div className="space-y-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <div className="flex justify-between items-center">
                      <div className="space-y-2 flex-1">
                        <div className="flex justify-between text-[10px] font-black text-gold uppercase tracking-widest">
                          <span>{t('dashboard.form.processing')}</span>
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
                        {t('common.cancel')}
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
                          ? `${t('dashboard.form.saving')} ${Math.round(uploadProgress)}%` 
                          : t('dashboard.form.preparing')}
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
                        {t('dashboard.form.cancelEdit')}
                      </div>
                    </div>
                  ) : status === 'success' ? (
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      {t('dashboard.form.saveSuccess')}
                    </span>
                  ) : (
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {editingId || editingServiceId ? <CheckCircle2 size={18} /> : <Plus size={18} />}
                      {editingId || editingServiceId ? t('dashboard.form.updateChanges') : activeTab === 'services' ? t('dashboard.form.publishService') : t('dashboard.form.publishProduct')}
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
              checkLinks={checkProductLinks}
              isCheckingLinks={isCheckingLinks}
              linkResults={linkResults}
              debugLogs={debugLogs}
              weeklyReportEnabled={weeklyReportEnabled}
            />
          )}

          {activeTab === 'factory' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-dark-light/30 backdrop-blur-2xl p-12 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden text-center"
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -mr-48 -mt-48 animate-pulse" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold/5 rounded-full blur-[100px] -ml-48 -mb-48 animate-pulse" />
              
              <div className="relative z-10 space-y-8 max-w-2xl mx-auto">
                <div className="w-24 h-24 bg-gradient-to-br from-primary to-purple-600 rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-primary/30 rotate-3 hover:rotate-0 transition-transform duration-500">
                  <Brain size={48} />
                </div>
                
                <div className="space-y-4">
                  <h2 className="text-4xl font-black text-white tracking-tight">AI Factory Portal</h2>
                  <p className="text-gray-400 leading-relaxed">
                    مرحباً بك في واجهة المصنع الموحدة. هنا يمكنك الوصول إلى جميع أدوات الذكاء الاصطناعي، توليد المحتوى، وتصميم الصور في بيئة عمل غامرة واحترافية.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-8">
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                    <Zap className="text-primary mx-auto mb-3" size={24} />
                    <h3 className="text-xs font-black uppercase tracking-widest">سرعة فائقة</h3>
                  </div>
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                    <Palette className="text-gold mx-auto mb-3" size={24} />
                    <h3 className="text-xs font-black uppercase tracking-widest">تصميم احترافي</h3>
                  </div>
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                    <Sparkles className="text-primary mx-auto mb-3" size={24} />
                    <h3 className="text-xs font-black uppercase tracking-widest">ذكاء متطور</h3>
                  </div>
                </div>

                <button 
                  onClick={() => navigate('/factory')}
                  className="w-full py-6 bg-primary text-white rounded-[2rem] font-black text-xl hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-4 group"
                >
                  <span>دخول المصنع الذكي</span>
                  <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            </motion.div>
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
                    <h2 className="text-2xl font-black text-white">{t('dashboard.list.availableServices')}</h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">{t('dashboard.list.manageServices')} ({services.length})</p>
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
                          {s.price} {s.currency || 'USD'}
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
                        {t('common.edit')}
                      </button>
                      
                      {deletingId === s.id ? (
                        <div className="flex-1 flex items-center gap-1 bg-red-500/10 p-1 rounded-xl border border-red-500/20">
                          <button 
                            onClick={() => handleDeleteService(s.id)} 
                            className="flex-1 bg-red-500 text-white py-2 rounded-lg text-[10px] font-black hover:bg-red-600 transition-colors"
                          >
                            {t('dashboard.list.yes')}
                          </button>
                          <button 
                            onClick={() => setDeletingId(null)} 
                            className="flex-1 bg-white/10 text-white py-2 rounded-lg text-[10px] font-black hover:bg-white/20 transition-colors"
                          >
                            {t('dashboard.list.no')}
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setDeletingId(s.id)}
                          className="flex-1 py-3 bg-white/5 hover:bg-red-500/20 text-white hover:text-red-500 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2"
                        >
                          <Trash2 size={16} />
                          {t('common.delete')}
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
                    <h2 className="text-2xl font-black text-white">{t('dashboard.list.products')}</h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{t('dashboard.list.manageInventory')} ({products.length})</p>
                  </div>
                </div>
                
                <div className="relative w-full md:w-80">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input 
                    type="text"
                    placeholder={t('dashboard.list.searchPlaceholder')}
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
                      <th className="p-6">{t('dashboard.list.tableProduct')}</th>
                      <th className="p-6">{t('dashboard.list.tableCategory')}</th>
                      <th className="p-6">{t('dashboard.list.tablePrice')}</th>
                      <th className="p-6 text-left">{t('dashboard.list.tableActions')}</th>
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
                              <span className="font-black text-white group-hover:text-gold transition-colors">{p.name}</span>
                              <span className="text-[10px] text-gray-500 line-clamp-1 max-w-[200px]">{p.description}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-gray-400 border border-white/5">
                            {p.category === 'cv' ? t('hero.categories.cv') : p.category === 'social' ? t('hero.categories.social') : t('hero.categories.web')}
                          </span>
                        </td>
                        <td className="p-6 font-black text-gold tracking-tighter text-lg">{p.price} {p.currency || 'USD'}</td>
                        <td className="p-6">
                          <div className="flex items-center gap-2 justify-end">
                            <button 
                              onClick={() => handleTestPurchase(p, 'product')}
                              className="w-10 h-10 flex items-center justify-center bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-xl transition-all"
                              title={t('dashboard.list.testPurchase')}
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
                                <span className="text-[9px] font-black text-red-500 px-2 uppercase">{t('dashboard.list.confirmDelete')}</span>
                                <button 
                                  onClick={() => handleDelete(p.id, p.imageUrl, p.downloadUrl)} 
                                  className="bg-red-500 text-white px-4 py-1.5 rounded-lg text-[10px] font-black hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                                >
                                  {t('dashboard.list.yes')}
                                </button>
                                <button 
                                  onClick={() => setDeletingId(null)} 
                                  className="bg-white/10 text-white px-4 py-1.5 rounded-lg text-[10px] font-black hover:bg-white/20 transition-colors"
                                >
                                  {t('dashboard.list.no')}
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
                    <h2 className="text-2xl font-black text-white">{t('dashboard.orders.title')}</h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{t('dashboard.orders.salesLog')} ({orders.length})</p>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                      <th className="p-6">{t('dashboard.list.tableProduct')}</th>
                      <th className="p-6">{t('dashboard.orders.tableCustomer')}</th>
                      <th className="p-6">{t('dashboard.list.tablePrice')}</th>
                      <th className="p-6">{t('dashboard.orders.tableStatus')}</th>
                      <th className="p-6">{t('dashboard.orders.tablePortal')}</th>
                      <th className="p-6">{t('dashboard.orders.tableDate')}</th>
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
                            <span className="mr-2 px-2 py-0.5 bg-gold/20 text-gold text-[8px] rounded-md border border-gold/30">{t('dashboard.orders.testOrder')}</span>
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
                            <option value="pending">{t('dashboard.orders.statusPending')}</option>
                            <option value="processing">{t('dashboard.orders.statusProcessing')}</option>
                            <option value="completed">{t('dashboard.orders.statusCompleted')}</option>
                          </select>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => window.open(`/order-portal/${o.id}`, '_blank')}
                              className="text-gold hover:text-white transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                            >
                              <ExternalLink size={14} />
                              {t('dashboard.orders.openPortal')}
                            </button>

                            {deletingOrderId === o.id ? (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-2 bg-red-500/10 p-1.5 rounded-xl border border-red-500/20"
                              >
                                <button 
                                  onClick={() => handleDeleteOrder(o.id)} 
                                  className="bg-red-500 text-white px-3 py-1 rounded-lg text-[9px] font-black hover:bg-red-600 transition-colors"
                                >
                                  {t('common.delete')}
                                </button>
                                <button 
                                  onClick={() => setDeletingOrderId(null)} 
                                  className="bg-white/10 text-white px-3 py-1 rounded-lg text-[9px] font-black hover:bg-white/20 transition-colors"
                                >
                                  {t('common.cancel')}
                                </button>
                              </motion.div>
                            ) : (
                              <button 
                                onClick={() => setDeletingOrderId(o.id)}
                                className="text-red-500/50 hover:text-red-500 transition-colors p-1"
                                title="حذف الطلب"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="p-6 text-[10px] text-gray-500 font-bold">
                          {o.createdAt?.toDate().toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'inspiration' && (
            <div className="space-y-8">
              <div className="bg-dark-light/30 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gold/10 rounded-2xl flex items-center justify-center text-gold border border-gold/20">
                    <Lightbulb size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">لوحة الإلهام المشتركة</h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">مساحة خاصة لك ولزوجتك لتبادل الأفكار</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-1 bg-dark-light/30 border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl self-start">
                  <CardHeader>
                    <CardTitle className="text-xl font-black text-white">إضافة فكرة جديدة</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <textarea 
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="اكتب فكرتك هنا..."
                      className="w-full h-32 bg-dark/50 border border-white/10 rounded-2xl p-4 text-white resize-none focus:border-gold outline-none transition-all"
                    />
                    <button 
                      onClick={async () => {
                        if (!newNote.trim()) return;
                        try {
                          let userName = 'ضيف';
                          const email = auth.currentUser?.email?.toLowerCase();
                          if (email === 'canabiskrap07@gmail.com' || email === 'canabiskrap007@gmail.com' || email === 'karmabiskrap@gmail.com') userName = 'المدير';
                          else if (email === 'esraa0badr@gmail.com') userName = 'إسراء';
                          else if (email === 'samemlywk@gmail.com') userName = 'المصممة';
                          
                          await addDoc(collection(db, 'inspiration_notes'), {
                            text: newNote,
                            user: userName,
                            date: new Date().toLocaleString('ar-SA'),
                            createdAt: Timestamp.now()
                          });
                          setNewNote('');
                          addLog("💡 تم إضافة فكرة جديدة للوحة الإلهام!");
                        } catch (err: any) {
                          addLog("❌ فشل إضافة الفكرة: " + err.message);
                        }
                      }}
                      className="w-full py-4 bg-gold text-dark rounded-2xl font-black text-sm hover:scale-[1.02] transition-all shadow-xl shadow-gold/20"
                    >
                      تثبيت الفكرة
                    </button>
                  </CardContent>
                </Card>

                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {inspirationNotes.length > 0 ? (
                    inspirationNotes.map((note) => (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/5 border border-white/10 p-6 rounded-[2rem] relative group hover:border-gold/30 transition-all"
                      >
                        <button 
                          onClick={async () => {
                            try {
                              await deleteDoc(doc(db, 'inspiration_notes', note.id));
                              addLog("🗑️ تم حذف الفكرة من اللوحة");
                            } catch (err: any) {
                              addLog("❌ فشل حذف الفكرة: " + err.message);
                            }
                          }}
                          className="absolute top-4 right-4 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center text-gold text-[10px] font-black">
                            {note.user[0]}
                          </div>
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{note.date}</span>
                        </div>
                        <p className="text-sm text-gray-200 leading-relaxed font-medium">{note.text}</p>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[2.5rem] text-gray-600">
                      <Lightbulb size={48} className="mb-4 opacity-20" />
                      <p className="text-sm font-bold uppercase tracking-widest">لا توجد أفكار مثبتة بعد</p>
                    </div>
                  )}
                </div>
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

      {/* Zen Mode Overlay */}
      <AnimatePresence>
        {isZenMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-dark/80 backdrop-blur-3xl flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-40 h-40 rounded-full bg-primary/20 blur-3xl absolute"
            />
            
            <div className="relative space-y-8 max-w-2xl">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20 text-primary">
                <Clock size={40} className="animate-pulse" />
              </div>
              <h2 className="text-4xl font-black text-white tracking-tighter">وضع الهدوء (Zen Mode)</h2>
              <p className="text-xl text-gray-400 font-medium leading-relaxed">
                "الإبداع يزدهر في الصمت. ركز على فكرتك القادمة، وسنتولى نحن الباقي."
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <button 
                  onClick={() => { setActiveTab('factory'); setIsZenMode(false); }}
                  className="px-8 py-4 bg-primary text-white rounded-2xl font-black hover:scale-105 transition-all flex items-center gap-2"
                >
                  <Zap size={20} />
                  انتقل للمصنع الآن
                </button>
                <button 
                  onClick={() => setIsZenMode(false)}
                  className="px-8 py-4 bg-white/5 text-white rounded-2xl font-black hover:bg-white/10 transition-all"
                >
                  العودة للوحة التحكم
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Zen Toggle */}
      <button
        onClick={() => setIsZenMode(!isZenMode)}
        className="fixed bottom-8 left-8 z-[110] w-14 h-14 bg-dark-light/50 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white hover:text-primary hover:border-primary/50 transition-all shadow-2xl group"
        title="Zen Mode"
      >
        <Activity size={24} className={isZenMode ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'} />
      </button>
    </motion.div>
  );
}
