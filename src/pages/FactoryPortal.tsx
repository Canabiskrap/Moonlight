import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Brain, 
  ArrowLeft, 
  Sparkles, 
  Zap, 
  History,
  Layout,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight
} from 'lucide-react';
import AIFactory from '../components/AIFactory';
import { db, auth, collection, query, orderBy, onSnapshot, addDoc, Timestamp, deleteDoc, doc } from '../lib/firebase';
import { chatWithBot } from '../services/geminiService';

export default function FactoryPortal() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { machineId } = useParams();
  const [oracleIdeas, setOracleIdeas] = useState<any[]>([]);
  const [isGeneratingOracle, setIsGeneratingOracle] = useState(false);
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setDebugLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 5));
  };

  useEffect(() => {
    const qGallery = query(collection(db, 'creative_gallery'), orderBy('createdAt', 'desc'));
    const unsubGallery = onSnapshot(qGallery, (snap) => {
      setGalleryItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qOracle = query(collection(db, 'oracle_ideas'), orderBy('createdAt', 'desc'));
    const unsubOracle = onSnapshot(qOracle, (snap) => {
      setOracleIdeas(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubGallery();
      unsubOracle();
    };
  }, []);

  const generateOracle = async () => {
    setIsGeneratingOracle(true);
    addLog("🔮 جاري استحضار أفكار إبداعية من الأوركل...");
    try {
      const prompt = `أنت "أوركل" Moonlight، خبير استراتيجي ومبدع. ولد 3 أفكار لمشاريع أو منتجات رقمية مبتكرة جداً وفريدة من نوعها. اجعل كل فكرة تتضمن: عنواناً، وصفاً قصيراً، والجمهور المستهدف. النتيجة بتنسيق JSON: [{title, description, targetAudience}]`;
      const response = await chatWithBot(prompt, []);
      const ideas = JSON.parse(response);
      
      for (const idea of ideas) {
        await addDoc(collection(db, 'oracle_ideas'), {
          ...idea,
          createdAt: Timestamp.now()
        });
      }
      addLog("✅ تم تحديث الأوركل بأفكار جديدة.");
    } catch (error) {
      console.error("Oracle Error:", error);
      addLog("❌ فشل الأوركل في استحضار الأفكار.");
    } finally {
      setIsGeneratingOracle(false);
    }
  };

  const handleInstantPublish = (data: any) => {
    addLog("🚀 تم تجهيز البيانات للنشر! يمكنك إكمال العملية من لوحة التحكم.");
  };

  const saveToGallery = async (item: any) => {
    try {
      const newItem = {
        content: item.content || item.title || '',
        type: item.type || 'إبداع',
        machineId: item.machineId || 'unknown',
        timestamp: new Date().toLocaleString('ar-SA'),
        createdAt: Timestamp.now()
      };
      await addDoc(collection(db, 'creative_gallery'), newItem);
      addLog("🎨 تم حفظ الإبداع في الرواق!");
    } catch (err: any) {
      console.error("Gallery Save Error:", err);
      addLog("❌ فشل حفظ الإبداع: " + err.message);
    }
  };

  const deleteFromGallery = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'creative_gallery', id));
      addLog("🗑️ تم حذف الإبداع من الرواق.");
    } catch (err: any) {
      console.error("Gallery Delete Error:", err);
      addLog("❌ فشل حذف الإبداع.");
    }
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-white font-sans selection:bg-primary/30">
      {/* Immersive Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Portal Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-black/40 backdrop-blur-xl border-b border-white/5 z-50 px-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 border border-purple-500/30">
              <Brain size={24} className="text-purple-500 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight uppercase flex items-center gap-2">
                <span className="text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">Moonlight AI Factory</span>
                {machineId && (
                  <>
                    <ChevronRight size={16} className="text-gray-600" />
                    <span className="text-blue-400">
                      {machineId === 'strategy' ? 'العراف الاستراتيجي' : 
                       machineId === 'product' ? 'مهندس المنتجات' :
                       machineId === 'contentMaker' ? 'صانع المحتوى' :
                       machineId === 'brandGuidelines' ? 'دليل الهوية' :
                       machineId === 'visual' ? 'المصمم البصري' :
                       machineId === 'visualGenerator' ? 'المصمم الآلي' :
                       machineId === 'bananaGenerator' ? 'مولد الموز (Banana)' : machineId}
                    </span>
                  </>
                )}
              </h1>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] text-blue-400/60 font-bold uppercase tracking-widest">Neural Engine Active</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
            <Zap size={14} className="text-gold" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Credits: Unlimited</span>
          </div>
          <button className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400">
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Portal Content */}
      <main className="pt-28 pb-12 px-8 relative z-10 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Left Sidebar - Status & Logs */}
          <div className="xl:col-span-3 space-y-6 hidden xl:block">
            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] backdrop-blur-sm">
              <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                <History size={14} />
                سجل العمليات
              </h3>
              <div className="space-y-3">
                {debugLogs.length > 0 ? debugLogs.map((log, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i} 
                    className="text-[10px] text-gray-500 font-medium font-mono border-l border-white/10 pl-3 py-1"
                  >
                    {log}
                  </motion.div>
                )) : (
                  <p className="text-[10px] text-gray-600 italic">بانتظار بدء العمليات...</p>
                )}
              </div>
            </div>

            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] backdrop-blur-sm">
              <h3 className="text-xs font-black text-gold uppercase tracking-widest mb-4 flex items-center gap-2">
                <Sparkles size={14} />
                نصيحة اليوم
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed italic">
                "الإبداع لا ينمو إلا في بيئة تثق في الخيال. استخدم المصنع لتجربة أفكار لم يسبق لها مثيل."
              </p>
            </div>
          </div>

          {/* Center Content - The Factory */}
          <div className="xl:col-span-9">
            <AIFactory 
              oracleIdeas={oracleIdeas}
              generateOracle={generateOracle}
              isGeneratingOracle={isGeneratingOracle}
              onInstantPublish={handleInstantPublish}
              onSaveToGallery={saveToGallery}
              onDeleteFromGallery={deleteFromGallery}
              galleryItems={galleryItems}
              addLog={addLog}
              initialMachine={machineId}
            />
          </div>
        </div>
      </main>

      {/* Portal Footer */}
      <footer className="fixed bottom-0 left-0 right-0 h-12 bg-black/40 backdrop-blur-xl border-t border-white/5 z-50 px-8 flex items-center justify-between text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">
        <div>© 2026 Moonlight AI Factory • v4.0.0</div>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-primary transition-colors">Documentation</a>
          <a href="#" className="hover:text-primary transition-colors">Support</a>
          <a href="#" className="hover:text-primary transition-colors">API</a>
        </div>
      </footer>
    </div>
  );
}
