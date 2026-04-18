import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import JoditEditor from 'jodit-react';
import html2pdf from 'html2pdf.js';
import { 
  Zap, 
  Brain, 
  Target, 
  TrendingUp, 
  Users, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  RefreshCw,
  Rocket,
  Lightbulb,
  BarChart3,
  Download,
  Palette,
  Trash2,
  UserCheck,
  ChevronDown,
  Type,
  Layout,
  AlertTriangle,
  Image as ImageIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { runFactoryMachine, chatWithBot, generateImageWithGemini } from '../services/geminiService';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { MachineErrorBoundary } from './MachineErrorBoundary';
import { ProcessTracker } from './ui/ProcessTracker';

interface MachineProps {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  subTools?: { id: string, title: string, icon: any }[];
}

interface FactoryProps {
  oracleIdeas?: any[];
  generateOracle?: () => void;
  isGeneratingOracle?: boolean;
  onInstantPublish?: (data: any) => void;
  onSaveToGallery?: (item: any) => void;
  onDeleteFromGallery?: (id: string) => void;
  galleryItems?: any[];
  addLog?: (msg: string) => void;
}

export default function AIFactory({ 
  oracleIdeas = [], 
  generateOracle, 
  isGeneratingOracle,
  onInstantPublish,
  onSaveToGallery,
  onDeleteFromGallery,
  galleryItems = [],
  addLog,
  initialMachine = null
}: FactoryProps & { initialMachine?: string | null }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Initialize state from localStorage
  const [activeMachine, setActiveMachine] = useState<string | null>(() => localStorage.getItem('moonlight_activeMachine') || initialMachine);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRefining, setIsRefining] = useState(false);
  
  // Progress tracker logic
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isProcessing) {
      setCurrentStep(0);
      interval = setInterval(() => {
        setCurrentStep(prev => (prev < 2 ? prev + 1 : prev));
      }, 1500);
    } else {
      setCurrentStep(0);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);
  const [result, setResult] = useState<any>(() => {
    const saved = localStorage.getItem('moonlight_factoryResult');
    return saved ? JSON.parse(saved) : null;
  });

  // Persist state to localStorage
  React.useEffect(() => {
    if (activeMachine) localStorage.setItem('moonlight_activeMachine', activeMachine);
    else localStorage.removeItem('moonlight_activeMachine');
  }, [activeMachine]);

  React.useEffect(() => {
    if (result) localStorage.setItem('moonlight_factoryResult', JSON.stringify(result));
    else localStorage.removeItem('moonlight_factoryResult');
  }, [result]);

  const resetFactory = () => {
    setActiveMachine(null);
    setResult(null);
    setInput('');
    localStorage.removeItem('moonlight_activeMachine');
    localStorage.removeItem('moonlight_factoryResult');
  };
  const [editorContent, setEditorContent] = useState('');
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [useUltraQuality, setUseUltraQuality] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  
  // Project Context State
  const [projectContext, setProjectContext] = useState(() => {
    const saved = localStorage.getItem('moonlight_projectContext');
    return saved ? JSON.parse(saved) : { brandName: 'Moonlight 🌕', brandIdentity: '', targetAudience: '' };
  });

  React.useEffect(() => {
    localStorage.setItem('moonlight_projectContext', JSON.stringify(projectContext));
  }, [projectContext]);

  React.useEffect(() => {
    if (initialMachine) {
      setActiveMachine(initialMachine);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [initialMachine]);

  React.useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'appearance'), (doc) => {
      if (doc.exists()) {
        setSettings(doc.data());
      }
    });
    return () => unsub();
  }, []);
  const editor = useRef(null);

  const joditConfig = useMemo(() => ({
    readonly: false,
    direction: 'rtl' as const,
    language: 'ar',
    theme: 'default',
    height: 'auto',
    minHeight: 600,
    style: {
      background: '#ffffff',
      fontFamily: 'Cairo, sans-serif',
    },
    uploader: {
      insertImageAsBase64URI: true,
    },
    image: {
      editSrc: false,
      useImageEditor: true,
    },
    buttons: [
      'undo', 'redo', '|',
      'bold', 'strikethrough', 'underline', 'italic', '|',
      'superscript', 'subscript', '|',
      'align', '|',
      'ul', 'ol', 'outdent', 'indent', '|',
      'font', 'fontsize', 'brush', 'paragraph', '|',
      'image', 'video', 'table', 'link', '|',
      'hr', 'eraser', 'copyformat', '|',
      'fullsize', 'print', 'source'
    ],
  }), []);

  const machines: MachineProps[] = [
    {
      id: 'strategy',
      title: t('dashboard.factory.machines.strategy.title'),
      description: t('dashboard.factory.machines.strategy.description'),
      icon: Target,
      color: 'text-blue-400',
      subTools: [
        { id: 'swot', title: 'تحليل SWOT', icon: BarChart3 },
        { id: 'persona', title: 'تحليل الشخصية', icon: Users },
        { id: 'market', title: 'دراسة السوق', icon: TrendingUp }
      ]
    },
    {
      id: 'product',
      title: t('dashboard.factory.machines.product.title'),
      description: t('dashboard.factory.machines.product.description'),
      icon: Rocket,
      color: 'text-purple-400',
      subTools: [
        { id: 'proposal', title: 'مقترح منتج', icon: Rocket },
        { id: 'pricing', title: 'استراتيجية تسعير', icon: Zap },
        { id: 'features', title: 'قائمة المميزات', icon: CheckCircle2 }
      ]
    },
    {
      id: 'contentMaker',
      title: t('dashboard.factory.machines.contentMaker.title'),
      description: t('dashboard.factory.machines.contentMaker.description'),
      icon: FileText,
      color: 'text-green-400',
      subTools: [
        { id: 'blog', title: 'مقال مدونة', icon: FileText },
        { id: 'social', title: 'منشور اجتماعي', icon: Sparkles },
        { id: 'email', title: 'حملة بريدية', icon: Zap }
      ]
    },
    {
      id: 'brandGuidelines',
      title: t('dashboard.factory.machines.brandGuidelines.title'),
      description: t('dashboard.factory.machines.brandGuidelines.description'),
      icon: Palette,
      color: 'text-pink-400',
      subTools: [
        { id: 'colors', title: 'لوحة الألوان', icon: Palette },
        { id: 'fonts', title: 'اختيار الخطوط', icon: Type },
        { id: 'voice', title: 'نبرة الصوت', icon: Brain }
      ]
    },
    {
      id: 'visual',
      title: t('dashboard.factory.machines.visual.title'),
      description: t('dashboard.factory.machines.visual.description'),
      icon: Sparkles,
      color: 'text-purple-500',
      subTools: [
        { id: 'logo', title: 'أفكار شعارات', icon: Palette },
        { id: 'banner', title: 'تصميم بنر', icon: Layout },
        { id: 'mockup', title: 'موكم أب', icon: Sparkles }
      ]
    },
    {
      id: 'brandBook',
      title: 'مهندس دليل الهوية',
      description: 'أنشئ دليل هوية بصرية متكامل لعلامتك التجارية بضغطة زر.',
      icon: Palette,
      color: 'text-purple-500',
      subTools: [
        { id: 'book', title: 'كتاب الهوية', icon: FileText },
        { id: 'assets', title: 'الأصول البصرية', icon: ImageIcon }
      ]
    },
    {
      id: 'cvMaker',
      title: 'صانع السيرة الذاتية',
      description: 'صمم CV احترافي وعصري يبرز مهاراتك وخبراتك.',
      icon: UserCheck,
      color: 'text-blue-500',
      subTools: [
        { id: 'modern', title: 'قالب عصري', icon: Layout },
        { id: 'classic', title: 'قالب كلاسيكي', icon: FileText }
      ]
    },
    {
      id: 'bananaGenerator',
      title: 'مولد الموز (Banana)',
      description: 'مكنة إبداعية غير تقليدية لتوليد أفكار مجنونة.',
      icon: Sparkles,
      color: 'text-yellow-400',
      subTools: [
        { id: 'crazyIdea', title: 'فكرة مجنونة', icon: Brain },
        { id: 'crazyHook', title: 'خطاف مجنون', icon: Zap }
      ]
    },
    {
      id: 'templateMaker',
      title: 'صانع القوالب',
      description: 'أنشئ قوالب جاهزة (فواتير، خطابات، خطط) بلمسة فنية.',
      icon: Palette,
      color: 'text-orange-400',
      subTools: [
        { id: 'invoice', title: 'فاتورة', icon: FileText },
        { id: 'letter', title: 'خطاب رسمي', icon: Type }
      ]
    }
  ];

  const handleProcess = async () => {
    if (!input.trim()) return;
    setIsProcessing(true);
    setResult(null);
    setEditorContent('');

    try {
      let imageUrl = '';
      if (selectedFile) {
        // Upload file first
        const formData = new FormData();
        formData.append("file", selectedFile);
        const response = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await response.json();
        imageUrl = data.url;
      }

      if (activeMachine) {
        // Pass imageUrl and settings to the machine
        const data = await runFactoryMachine(activeMachine, input, imageUrl, settings, projectContext);
        
        // Ensure imageUrl is constructed for ALL machines to prevent broken icons
        if (!data.imageUrl) {
          data.imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(getImagePrompt(activeMachine, data))}?width=1280&height=720&nologo=true&model=flux&seed=${Math.floor(Math.random() * 1000)}`;
          
          // Adjust dimensions for visual if needed
          if (activeMachine === 'visual') {
            data.imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(getImagePrompt(activeMachine, data))}?width=1024&height=1024&nologo=true&model=flux&seed=${Math.floor(Math.random() * 1000)}`;
          }
        }
        
        if (activeMachine === 'visual' && useUltraQuality) {
          addLog?.("🚀 جاري توليد التصميم فائق الدقة باستخدام Gemini 2.5...");
          try {
            const geminiImageUrl = await generateImageWithGemini(data.designPrompt || input, aspectRatio);
            data.imageUrl = geminiImageUrl;
            addLog?.("✨ تم توليد التصميم بدقة مذهلة!");
          } catch (err) {
            console.error("Gemini Image Error:", err);
            addLog?.("⚠️ فشل التوليد فائق الدقة، سنستخدم المحرك القياسي.");
          }
        }

        setResult(data);
        if ((activeMachine === 'contentMaker' || activeMachine === 'brandGuidelines' || activeMachine === 'brandBook' || activeMachine === 'visual' || activeMachine === 'cvMaker' || activeMachine === 'templateMaker') && data.htmlContent) {
          setEditorContent(data.htmlContent);
        }
      }
    } catch (error) {
      console.error("Factory Error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetMachine = () => {
    setResult(null);
    setEditorContent('');
    setInput('');
  };

  const refinePrompt = async () => {
    if (!input.trim()) return;
    setIsRefining(true);
    try {
      const prompt = `حول هذه الفكرة البسيطة إلى مطالبة (Prompt) احترافية ومفصلة جداً لاستخدامها في الذكاء الاصطناعي لإنتاج أفضل نتيجة ممكنة. الفكرة: "${input}". اجعل النتيجة باللغة العربية والإنجليزية.`;
      const refined = await chatWithBot(prompt, []);
      setInput(refined);
    } catch (error) {
      console.error("Refine Error:", error);
    } finally {
      setIsRefining(false);
    }
  };

  const handleExportPDF = () => {
    if (!editorContent) return;
    
    const element = document.createElement('div');
    element.innerHTML = editorContent;
    element.style.padding = '20px';
    element.style.fontFamily = 'Inter, sans-serif';
    element.style.direction = 'rtl'; // Assuming Arabic content mostly
    
    const opt = {
      margin:       10,
      filename:     `moonlight-${activeMachine || 'document'}.pdf`,
      image:        { type: 'jpeg' as const, quality: 1.0 },
      html2canvas:  { scale: 4, useCORS: true, letterRendering: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(element).save();
    setShowDownloadMenu(false);
  };

  const handleDownloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      const blob = await response.blob();
      
      // Check if blob is actually an image
      if (!blob.type.startsWith('image/')) {
        const text = await blob.text();
        if (text.includes('Too Many Requests') || text.includes('error')) {
          addLog?.("⚠️ عذراً، خادم الصور مشغول حالياً. يرجى المحاولة بعد قليل.");
          return;
        }
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setShowDownloadMenu(false);
      addLog?.("✅ تم تحميل التصميم بنجاح!");
    } catch (error: any) {
      console.error('Error downloading image:', error);
      addLog?.("❌ فشل تحميل الصورة: " + error.message);
    }
  };

  const getImagePrompt = (machineId: string | null, res: any) => {
    if (!machineId || !res) return "abstract digital art, luxury aesthetic, cinematic lighting";
    
    // If the machine already provided a specific design prompt, use it as the primary source
    const rawPrompt = res.designPrompt || res.title || input;
    
    // Core instruction: LITERAL COMPLIANCE BEFORE AESTHETICS. 
    // Always enforce that the core subject requested by the user is the primary focus.
    const literalInstruction = "SUBJECT PROMPT: " + rawPrompt + ". CORE SUBJECT MUST BE THE ABSOLUTE FOCUS OF THE IMAGE. DO NOT HALLUCINATE BACKGROUNDS. ";
    
    const base = ", professional photography, hyper-realistic, 8k resolution, cinematic studio lighting, luxury branding aesthetic, text 'Moonlight' engraved or applied as a decal on the main object where appropriate, ultra-sharp focus, masterpiece";
    
    if (machineId === 'visual') {
      return `${literalInstruction} ${base}`;
    }
    
    // Default fallback for other machines
    if (machineId === 'strategy') return `business strategy concept, SWOT analysis, professional dashboard, ${res.persona?.name || ''}, elegant data visualization` + base;
    if (machineId === 'product') return `digital product showcase, ${res.title}, professional marketing, premium tech aesthetic` + base;
    if (machineId === 'cvMaker') return `professional modern resume layout, elegant typography, career success, minimalist aesthetic` + base;
    if (machineId === 'templateMaker') return `professional document template, structured layout, clean design, premium paper texture` + base;
    if (machineId === 'brandGuidelines' || machineId === 'brandBook') return `brand identity guidelines, color palette, logo design showcase, professional brand book layout` + base;
    
    return literalInstruction + base;
  };

  return (
    <>
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-black text-white flex items-center gap-3 animate-heartbeat-glow" style={{ '--glow-color': '#FFFFFF' } as React.CSSProperties}>
          {/* Tool Icon Container */}
          <div className="p-2 bg-purple-500/20 rounded-xl text-purple-500 shadow-[0_0_15px_rgba(139,92,246,0.5)] animate-soft-pulse">
            <Brain size={36} />
          </div>
          <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            {t('dashboard.factory.title')}
          </span>
        </h2>
        <p className="text-[#C4B5FD] font-bold uppercase tracking-widest text-sm mr-16">
          {t('dashboard.factory.subtitle')}
        </p>
      </div>

      <Card className="bg-dark-light/30 border-white/5 backdrop-blur-xl rounded-[2rem] p-6 shadow-2xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-[#8B5CF6]/10 text-[#8B5CF6] rounded-xl shadow-[0_0_10px_rgba(139,92,246,0.3)]">
            <Brain size={24} />
          </div>
          <h3 className="text-xl font-black text-white animate-heartbeat-glow" style={{ '--glow-color': 'var(--glow-gold)' } as React.CSSProperties}>إعدادات المشروع الحالية</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input 
            type="text" 
            placeholder="اسم البراند (مثلاً: Moonlight)"
            value={projectContext.brandName}
            onChange={(e) => setProjectContext({...projectContext, brandName: e.target.value})}
            className="bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-md font-bold placeholder:text-[#E9D5FF] outline-none focus:border-[#8B5CF6] focus:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all"
          />
          <input 
            type="text" 
            placeholder="الهوية (مثلاً: فاخرة، تقنية)"
            value={projectContext.brandIdentity}
            onChange={(e) => setProjectContext({...projectContext, brandIdentity: e.target.value})}
            className="bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-md font-bold placeholder:text-[#E9D5FF] outline-none focus:border-[#8B5CF6] focus:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all"
          />
          <input 
            type="text" 
            placeholder="الجمهور (مثلاً: رواد الأعمال)"
            value={projectContext.targetAudience}
            onChange={(e) => setProjectContext({...projectContext, targetAudience: e.target.value})}
            className="bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-md font-bold placeholder:text-[#E9D5FF] outline-none focus:border-[#8B5CF6] focus:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all"
          />
        </div>
      </Card>

      {/* Moonlight Oracle Section */}
      {!activeMachine && (
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-transparent border border-purple-500/20 rounded-[2.5rem] p-8 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Sparkles size={120} className="text-purple-500" />
            </div>
            
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4 max-w-xl">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-500/20 p-2 rounded-xl text-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                    <Brain size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-purple-500 drop-shadow-[0_0_5px_rgba(168,85,247,0.4)] animate-heartbeat-glow" style={{'--glow-color': 'var(--glow-gold)'} as React.CSSProperties}>عراف Moonlight (AI Oracle)</h3>
                </div>
                <p className="text-blue-400 font-medium leading-relaxed">
                  "دع الذكاء الاصطناعي يقرأ مستقبل متجرك. العراف يحلل هويتك ويقترح عليك منتجات رقمية مبتكرة لتوسيع إمبراطوريتك."
                </p>
                <button
                  onClick={generateOracle}
                  disabled={isGeneratingOracle}
                  className="px-8 py-4 bg-purple-500 text-white rounded-2xl font-black hover:scale-105 transition-all flex items-center gap-3 shadow-xl shadow-purple-500/20 disabled:opacity-50"
                >
                  {isGeneratingOracle ? <RefreshCw size={20} className="animate-spin" /> : <Sparkles size={20} />}
                  استشر العراف الآن
                </button>
              </div>

              <div className="flex-1 w-full grid grid-cols-1 gap-4">
                {/* Quick Starters */}
                <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-4 mb-4">
                  <h4 className="text-sm font-bold text-gray-400 animate-heartbeat-glow" style={{ '--glow-color': 'var(--glow-gold)' } as React.CSSProperties}>قوالب البدء السريع:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { title: 'خطة تسويق لمنتج جديد', prompt: 'أنشئ خطة تسويق متكاملة لمنتج جديد في قطاع ', icon: Rocket },
                      { title: 'مقال مدونة تخصصي', prompt: 'اكتب مقال مدونة احترافي ومقنع حول ', icon: FileText },
                      { title: 'تحليل المنافسين', prompt: 'قم بإجراء تحليل SWOT لمنافس في مجال ', icon: BarChart3 },
                      { title: 'نص إعلاني (Social Media)', prompt: 'اكتب نص إعلاني جذاب لـ ', icon: Sparkles }
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setInput(item.prompt); setActiveMachine('contentMaker'); }}
                        className="flex items-center gap-3 p-3 bg-black/20 hover:bg-primary/20 border border-white/5 hover:border-primary/50 rounded-xl text-xs font-bold text-white transition-all text-right"
                      >
                        <item.icon size={16} className="text-primary" />
                        {item.title}
                      </button>
                    ))}
                  </div>
                </div>
                {oracleIdeas.length > 0 ? (
                  oracleIdeas.map((idea, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-purple-500/30 transition-all cursor-pointer group/idea flex items-center justify-between"
                    >
                      <div 
                        className="flex-1"
                        onClick={() => { setInput(idea.content); setActiveMachine('product'); }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">فكرة مقترحة #{i+1}</span>
                        </div>
                        <p className="text-sm text-blue-400 line-clamp-2 font-medium">{idea.content}</p>
                      </div>
                      <button 
                        onClick={() => onInstantPublish?.(idea)}
                        className="ml-4 p-3 bg-purple-500/10 text-purple-500 rounded-xl hover:bg-purple-500 hover:text-white transition-all shadow-lg"
                        title="نشر فوري"
                      >
                        <Rocket size={18} />
                      </button>
                    </motion.div>
                  ))
                ) : (
                  <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl text-gray-600">
                    <p className="text-xs font-bold uppercase tracking-widest">بانتظار استشارة العراف...</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Creative Gallery Section */}
          {galleryItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="bg-purple-500/20 p-2 rounded-xl text-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                  <Palette size={24} />
                </div>
                <h3 className="text-2xl font-black text-purple-500 drop-shadow-[0_0_5px_rgba(168,85,247,0.4)] animate-heartbeat-glow" style={{'--glow-color': 'var(--glow-gold)'} as React.CSSProperties}>رواق الإبداع (Gallery)</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {galleryItems.map((item) => (
                  <Card key={item.id} className="bg-dark-light/30 border-white/10 backdrop-blur-xl rounded-[2rem] overflow-hidden group hover:border-purple-500/50 transition-all duration-500">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-blue-400/60 uppercase tracking-widest">{item.timestamp}</span>
                        <div className="flex items-center gap-2">
                          <div className="bg-purple-500/10 text-purple-500 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                            {item.type || 'إبداع'}
                          </div>
                          <button 
                            onClick={() => onDeleteFromGallery?.(item.id)}
                            className="p-1 text-gray-600 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-blue-400 font-medium leading-relaxed">
                        {item.content || item.title}
                      </p>
                      <div className="flex gap-2 pt-2">
                        <button 
                          onClick={() => { setInput(item.content || item.title); setActiveMachine(item.machineId || 'contentMaker'); }}
                          className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black transition-all"
                        >
                          تعديل
                        </button>
                        <button 
                          onClick={() => onInstantPublish?.(item)}
                          className="flex-1 py-2 bg-purple-500/10 hover:bg-purple-500 text-purple-500 hover:text-white rounded-xl text-[10px] font-black transition-all"
                        >
                          نشر فوري
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {!activeMachine ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {machines.map((machine) => (
                <motion.div
                  key={machine.id}
                  whileHover={{ y: -10, scale: 1.02 }}
                  onClick={() => setActiveMachine(machine.id)}
                  className="cursor-pointer"
                >
              <Card className="bg-dark-light/30 border-white/10 backdrop-blur-xl rounded-[2.5rem] h-full hover:border-purple-500/50 transition-all duration-500 overflow-hidden group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-8 flex flex-col items-center text-center space-y-4 relative z-10">
                  <div className={`p-5 rounded-3xl bg-dark/50 ${machine.color} group-hover:scale-110 group-hover:text-purple-500 transition-all duration-500 shadow-2xl group-hover:shadow-purple-500/20`}>
                    <machine.icon size={40} />
                  </div>
                  <h3 className="text-xl font-black text-white group-hover:text-purple-500 transition-colors duration-300 drop-shadow-[0_0_5px_rgba(168,85,247,0)] group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.5)] animate-heartbeat-glow" style={{ '--glow-color': 'var(--glow-gold)' } as React.CSSProperties}>
                    {machine.title}
                  </h3>
                  <p className="text-sm text-blue-400/60 group-hover:text-blue-400 leading-relaxed font-medium transition-colors duration-300">
                    {machine.description}
                  </p>
                  <div className="pt-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white group-hover:bg-purple-500 group-hover:text-white transition-all shadow-lg group-hover:shadow-purple-500/40">
                      <ArrowRight size={20} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <MachineErrorBoundary machineName={machines.find(m => m.id === activeMachine)?.title}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <button 
            onClick={() => { 
              if (initialMachine) {
                navigate('/factory');
              } else {
                setActiveMachine(null); 
                setResult(null); 
                setInput(''); 
              }
            }}
            className="text-xs font-black text-blue-400/60 hover:text-purple-500 flex items-center gap-2 transition-all uppercase tracking-widest group"
          >
            <ArrowRight size={14} className="rtl:rotate-180 group-hover:-translate-x-1 transition-transform" />
            {t('dashboard.factory.backToFactory')}
          </button>

          <div className="flex flex-col xl:flex-row gap-10 h-full">
            {/* Left Sidebar: Smart Tools & Input */}
            <div className="w-full xl:w-[400px] space-y-6 shrink-0">
              <Card className="bg-dark-light/30 border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl xl:sticky xl:top-28">
                <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                  <CardTitle className="text-xl font-black text-purple-500 drop-shadow-[0_0_5px_rgba(168,85,247,0.4)] flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-dark/50 ${machines.find(m => m.id === activeMachine)?.color} group-hover:text-purple-500 transition-colors`}>
                      {React.createElement(machines.find(m => m.id === activeMachine)?.icon || Zap, { size: 24 })}
                    </div>
                    {machines.find(m => m.id === activeMachine)?.title}
                  </CardTitle>
                  <CardDescription className="text-blue-400/60 font-bold">
                    {t('dashboard.factory.enterIdeaDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={activeMachine === 'strategy' ? t('dashboard.factory.placeholderStrategy') : t('dashboard.factory.placeholderProduct')}
                    className="w-full h-40 bg-dark/50 border border-white/10 rounded-3xl p-6 text-blue-400 placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 transition-all resize-none font-medium"
                  />
                  
                  <div className="flex gap-3">
                    <button
                      onClick={refinePrompt}
                      disabled={isRefining || !input.trim()}
                      className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-blue-400 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 border border-white/10 disabled:opacity-50"
                    >
                      {isRefining ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} className="text-purple-500" />}
                      تحسين الفكرة سحرياً
                    </button>
                    
                    <button
                      onClick={() => setInput('')}
                      className="px-6 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl font-black text-xs transition-all border border-red-500/20"
                    >
                      مسح
                    </button>
                  </div>

                    <button
                      onClick={handleProcess}
                      disabled={isProcessing || !input.trim()}
                      className="flex-1 py-5 bg-purple-500 text-white rounded-3xl font-black text-sm hover:bg-purple-600 transition-all shadow-xl shadow-purple-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw size={20} className="animate-spin" />
                          {t('dashboard.factory.runningMachine')}
                        </>
                      ) : (
                        <>
                          <Zap size={20} />
                          {t('dashboard.factory.startProduction')}
                        </>
                      )}
                    </button>

                    {result && (
                      <button
                        onClick={resetMachine}
                        className="w-full py-4 mt-3 bg-white/5 hover:bg-white/10 text-blue-400 rounded-2xl font-black text-xs transition-all border border-white/10 flex items-center justify-center gap-2"
                      >
                        <RefreshCw size={16} />
                        بدء منتج جديد
                      </button>
                    )}

                    {activeMachine === 'visual' && (
                      <div className="space-y-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles size={16} className="text-purple-500" />
                            <span className="text-xs font-black text-blue-400">دقة فائقة (Gemini 2.5)</span>
                          </div>
                          <button 
                            onClick={() => setUseUltraQuality(!useUltraQuality)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${useUltraQuality ? 'bg-purple-500' : 'bg-gray-700'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${useUltraQuality ? 'left-7' : 'left-1'}`} />
                          </button>
                        </div>
                        
                        {useUltraQuality && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-purple-500/60 uppercase tracking-widest">أبعاد التصميم</p>
                            <div className="grid grid-cols-3 gap-2">
                              {['1:1', '9:16', '16:9'].map((ratio) => (
                                <button
                                  key={ratio}
                                  onClick={() => setAspectRatio(ratio)}
                                  className={`py-2 rounded-xl text-[10px] font-black transition-all border ${
                                    aspectRatio === ratio ? 'bg-purple-500 border-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'bg-white/5 border-white/10 text-blue-400/60'
                                  }`}
                                >
                                  {ratio}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {result && (
                      <div className="pt-6 border-t border-white/5 space-y-3">
                        <p className="text-[10px] font-black text-purple-500/60 uppercase tracking-widest mb-2">إجراءات سريعة</p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => onSaveToGallery?.({ content: result.htmlContent || result.description || input, type: activeMachine, machineId: activeMachine })}
                            className="flex-1 py-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 rounded-xl font-black text-[10px] transition-all border border-purple-500/20 flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(168,85,247,0.1)]"
                          >
                            <Palette size={14} />
                            حفظ في الرواق
                          </button>
                          <button
                            onClick={() => onInstantPublish?.({ title: result.title || input.substring(0, 20), description: result.description || result.htmlContent || input, priceSuggestion: result.priceSuggestion })}
                            className="flex-1 py-3 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white rounded-xl font-black text-[10px] transition-all border border-blue-500/20 flex items-center justify-center gap-2"
                          >
                            <Rocket size={14} />
                            نشر فوري
                          </button>
                        </div>
                      </div>
                    )}

                    {machines.find(m => m.id === activeMachine)?.subTools && (
                      <div className="pt-6 border-t border-white/5 space-y-3">
                        <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-2">الأدوات الذكية المتاحة</p>
                        <div className="grid grid-cols-2 gap-2">
                          {machines.find(m => m.id === activeMachine)?.subTools?.map(tool => (
                            <button
                              key={tool.id}
                              onClick={() => {
                                setInput(prev => `${prev}\n\n[استخدام أداة: ${tool.title}]`);
                                handleProcess();
                              }}
                              className="p-3 bg-white/5 hover:bg-white/10 text-blue-400 rounded-xl text-[10px] font-bold transition-all border border-white/5 flex flex-col items-center gap-2 group"
                            >
                              <tool.icon size={16} className="text-blue-400/60 group-hover:text-purple-500 transition-colors" />
                              {tool.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-8 bg-purple-500/10 border border-purple-500/20 rounded-3xl p-6 flex gap-4 shadow-[0_0_15px_rgba(168,85,247,0.05)]">
                      <div className="bg-purple-500/20 p-3 rounded-2xl text-purple-500 shrink-0 h-fit shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                        <Lightbulb size={24} />
                      </div>
                      <div>
                        <h4 className="text-purple-500 font-black text-sm mb-1 animate-heartbeat-glow" style={{ '--glow-color': 'var(--glow-gold)' } as React.CSSProperties}>{t('dashboard.factory.adviceTitle')}</h4>
                        <p className="text-xs text-blue-400/80 leading-relaxed font-bold">
                          {t('dashboard.factory.adviceDetailed')}
                        </p>
                      </div>
                    </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Side: Large Results Display */}
            <div className="flex-1 min-w-0 space-y-6">
              <AnimatePresence mode="wait">
                {isProcessing ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center h-[500px]"
                  >
                    <div className="text-center space-y-6">
                      <ProcessTracker 
                        steps={[
                          { id: 1, label: 'فهم الطلب' },
                          { id: 2, label: 'توليد المحتوى' },
                          { id: 3, label: 'الصقل والتحسين' }
                        ]} 
                        currentStep={currentStep} 
                      />
                      <p className="text-purple-400 font-black text-lg animate-pulse">جاري العمل في المصنع...</p>
                    </div>
                  </motion.div>
                ) : result ? (
                  <motion.div
                    key={activeMachine || 'result'}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Global Image Preview for all machines except visual (which have their own outputs) */}
                    {activeMachine !== 'visual' && (
                      <div className="aspect-video w-full rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl relative group mb-6 bg-black/40">
                        {/* Loading Placeholder */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-0">
                           <motion.div 
                             animate={{ rotate: 360 }}
                             transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                             className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full"
                           />
                        </div>

                        <img 
                          src={result.imageUrl || `https://image.pollinations.ai/prompt/${encodeURIComponent(getImagePrompt(activeMachine, result))}?width=1280&height=720&nologo=true&model=flux&seed=0`}
                          alt="Machine Visual"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 relative z-10"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            console.error("Global Image load failed");
                            e.currentTarget.src = `https://picsum.photos/seed/${Math.random()}/1280/720?blur=4`;
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                            <p className="text-[10px] text-white font-black uppercase tracking-widest">تصور ذكاء Moonlight الاصطناعي</p>
                          </div>
                          <h3 className="text-lg font-black text-white line-clamp-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-heartbeat-glow" style={{ '--glow-color': 'var(--glow-gold)' } as React.CSSProperties}>
                            {result.title || result.persona?.name || 'إبداع جديد من المصنع'}
                          </h3>
                        </div>
                      </div>
                    )}

                    {activeMachine === 'strategy' && (
                      <div className="space-y-6">
                        <Card className="bg-dark-light/30 border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
                          <CardHeader className="border-b border-white/5">
                            <CardTitle className="text-lg font-black text-white flex items-center gap-2">
                              <BarChart3 size={20} className="text-purple-500" />
                              {t('dashboard.factory.strategicSwot')}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <p className="text-[10px] font-black text-green-400 uppercase tracking-widest">{t('dashboard.factory.machines.strategy.strengths')}</p>
                                <ul className="space-y-1">
                                  {result.swot.strengths.map((s: string, i: number) => (
                                    <li key={i} className="text-xs text-gray-300 flex items-center gap-2">
                                      <CheckCircle2 size={12} className="text-green-500" /> {s}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="space-y-2">
                                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">{t('dashboard.factory.machines.strategy.weaknesses')}</p>
                                <ul className="space-y-1">
                                  {result.swot.weaknesses.map((s: string, i: number) => (
                                    <li key={i} className="text-xs text-gray-300 flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> {s}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-dark-light/30 border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
                          <CardHeader className="border-b border-white/5">
                            <CardTitle className="text-lg font-black text-white flex items-center gap-2">
                              <Users size={20} className="text-blue-400" />
                              {t('dashboard.factory.machines.strategy.persona')}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6 space-y-4">
                            <div>
                              <p className="text-[10px] font-black text-blue-400/60 uppercase tracking-widest mb-1">{t('dashboard.factory.machines.strategy.name')}</p>
                              <p className="text-sm text-white font-bold">{result.persona.name}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-blue-400/60 uppercase tracking-widest mb-1">{t('dashboard.factory.machines.strategy.needs')}</p>
                              <p className="text-xs text-blue-400 leading-relaxed">{result.persona.needs}</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {activeMachine === 'product' && (
                      <Card className="bg-dark-light/30 border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="border-b border-white/5">
                          <CardTitle className="text-lg font-black text-white flex items-center gap-2">
                            <Rocket size={20} className="text-purple-400" />
                            {t('dashboard.factory.machines.product.proposal')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                          <div>
                            <p className="text-[10px] font-black text-blue-400/60 uppercase tracking-widest mb-2">{t('dashboard.factory.machines.product.productTitle')}</p>
                            <h3 className="text-xl font-black text-white animate-heartbeat-glow" style={{ '--glow-color': 'var(--glow-gold)' } as React.CSSProperties}>{result.title}</h3>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-blue-400/60 uppercase tracking-widest mb-2">{t('dashboard.factory.machines.product.productDesc')}</p>
                            <p className="text-sm text-blue-400 leading-relaxed">{result.description}</p>
                          </div>
                          <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                            <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-1">{t('dashboard.factory.machines.product.priceSuggestion')}</p>
                            <p className="text-lg font-black text-white">{result.priceSuggestion}</p>
                          </div>
                          <button className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 border border-white/10">
                            <FileText size={16} />
                            {t('dashboard.factory.exportToProduct')}
                          </button>
                        </CardContent>
                      </Card>
                    )}

                    {activeMachine === 'visual' && (
                      <div className="space-y-6">
                        {result.ideas.map((idea: any, i: number) => (
                          <Card key={i} className="bg-dark-light/30 border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden group hover:border-purple-500/30 transition-all">
                            <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                              <CardTitle className="text-sm font-black text-purple-500 flex items-center gap-2 uppercase tracking-widest">
                                <Sparkles size={16} />
                                {idea.type}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                              <div className="aspect-video w-full rounded-xl overflow-hidden border border-white/5 bg-dark/50">
                                <img 
                                  src={`https://image.pollinations.ai/prompt/${encodeURIComponent(idea.content.substring(0, 100) + ", professional graphic design, high resolution, 8k, flux model")}?width=800&height=450&nologo=true&model=flux&seed=${i}`}
                                  alt={idea.type}
                                  className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {idea.content}
                              </p>
                              <div className="flex gap-2 pt-2">
                                <button 
                                  onClick={() => {
                                    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(idea.content.substring(0, 100) + ", professional graphic design, high resolution, 8k, flux model")}?width=1280&height=720&nologo=true&model=flux&seed=${i}`;
                                    handleDownloadImage(imageUrl, `moonlight-idea-${i}.jpg`);
                                  }}
                                  className="flex-1 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-500 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1"
                                >
                                  <Download size={12} />
                                  تحميل الصورة
                                </button>
                                <button 
                                  onClick={() => onSaveToGallery?.({
                                    title: idea.type,
                                    content: idea.content,
                                    type: 'فكرة مرئية',
                                    machineId: 'visual',
                                    imageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(idea.content.substring(0, 100))}?width=800&height=450&nologo=true`
                                  })}
                                  className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black transition-all"
                                >
                                  حفظ في الرواق
                                </button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {(activeMachine === 'contentMaker' || activeMachine === 'brandGuidelines' || activeMachine === 'brandBook' || activeMachine === 'cvMaker' || activeMachine === 'templateMaker') && (
                      <Card className="bg-dark-light/30 border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between">
                          <CardTitle className="text-lg font-black text-white flex items-center gap-2">
                            {activeMachine === 'brandGuidelines' ? <Palette size={20} className="text-pink-400" /> : 
                             activeMachine === 'brandBook' ? <Palette size={20} className="text-purple-500" /> : 
                             activeMachine === 'cvMaker' ? <UserCheck size={20} className="text-blue-500" /> :
                             activeMachine === 'templateMaker' ? <Palette size={20} className="text-orange-400" /> :
                             <FileText size={20} className="text-green-400" />}
                            
                            {activeMachine === 'brandGuidelines' ? t('dashboard.factory.machines.brandGuidelines.title') : 
                             activeMachine === 'brandBook' ? 'دليل الهوية البصرية' : 
                             activeMachine === 'cvMaker' ? 'محرر السيرة الذاتية' :
                             activeMachine === 'templateMaker' ? 'محرر القوالب' :
                             t('dashboard.factory.machines.contentMaker.editorTitle')}
                          </CardTitle>
                          <div className="relative">
                            <button 
                              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
                            >
                              <Download size={14} />
                              تحميل
                              <ChevronDown size={14} />
                            </button>
                            {showDownloadMenu && (
                              <div className="absolute top-full left-0 mt-2 w-48 bg-dark-light border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                                <button
                                  onClick={handleExportPDF}
                                  className="w-full text-right px-4 py-3 text-xs font-bold text-white hover:bg-white/5 flex items-center gap-2 transition-colors"
                                >
                                  <FileText size={14} className="text-green-400" />
                                  {activeMachine === 'cvMaker' ? 'تحميل السيرة الذاتية (PDF)' : 
                                   activeMachine === 'templateMaker' ? 'تحميل القالب (PDF)' :
                                   activeMachine === 'brandBook' ? 'تحميل دليل الهوية (PDF)' :
                                   activeMachine === 'brandGuidelines' ? 'تحميل الإرشادات (PDF)' :
                                   'تحميل كملف PDF'}
                                </button>
                                <button
                                  onClick={() => {
                                    if (result.imageUrl) {
                                      handleDownloadImage(result.imageUrl, `moonlight-${activeMachine}.jpg`);
                                    }
                                  }}
                                  className="w-full text-right px-4 py-3 text-xs font-bold text-white hover:bg-white/5 flex items-center gap-2 transition-colors border-t border-white/5"
                                >
                                  <ImageIcon size={14} className="text-blue-400" />
                                  تحميل صورة عالية الجودة
                                </button>
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="p-0 bg-white rounded-b-[2.5rem] shadow-inner min-h-[700px]">
                          <div className="text-black overflow-hidden jodit-wrapper h-full">
                            <JoditEditor
                              ref={editor}
                              value={editorContent}
                              config={{
                                ...joditConfig,
                                minHeight: 700,
                                height: 'auto',
                                autofocus: true
                              }}
                              onBlur={newContent => setEditorContent(newContent)}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {activeMachine === 'visual' && (
                      <Card className="bg-dark-light/30 border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="border-b border-white/5">
                          <CardTitle className="text-lg font-black text-purple-500 drop-shadow-[0_0_5px_rgba(168,85,247,0.4)] flex items-center gap-2">
                            <Sparkles size={20} className="text-purple-500" />
                            نتائج المصمم الآلي (V2 - High Quality)
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                          <div className={`w-full max-w-md mx-auto relative group rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl ${aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-square'} bg-black/40`}>
                            {/* Loading Placeholder */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-0">
                               <motion.div 
                                 animate={{ rotate: 360 }}
                                 transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                 className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full"
                               />
                            </div>

                            <img 
                              src={result.imageUrl || `https://image.pollinations.ai/prompt/${encodeURIComponent(getImagePrompt(activeMachine, result))}?width=1024&height=1024&nologo=true&model=flux&seed=0`}
                              alt="Generated Visual"
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 relative z-10"
                              referrerPolicy="no-referrer"
                              onLoad={() => {
                                addLog?.("🎨 تم توليد التصميم الاحترافي بنجاح!");
                              }}
                              onError={(e) => {
                                console.error("Image load failed for visualGenerator");
                                addLog?.("⚠️ فشل تحميل الصورة، جاري المحاولة ببديل...");
                                e.currentTarget.src = `https://picsum.photos/seed/${Math.random()}/1024/1024?blur=2`;
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6 z-20">
                              <p className="text-[10px] text-blue-400/80 font-medium italic">تم التوليد بواسطة Moonlight AI (Flux Engine)</p>
                            </div>
                          </div>

                            <div className="flex gap-4">
                              <button 
                                onClick={() => {
                                  if (result.imageUrl) {
                                    handleDownloadImage(result.imageUrl, `moonlight-design.jpg`);
                                  }
                                }}
                              className="flex-1 py-4 bg-purple-500 text-white rounded-2xl font-black text-sm hover:bg-purple-600 transition-all shadow-2xl shadow-purple-500/20 flex items-center justify-center gap-2"
                            >
                              <Download size={18} />
                              تحميل التصميم (عالي الجودة)
                            </button>
                            <button 
                              onClick={() => {
                                onSaveToGallery?.({
                                  title: (result.arabicCaption || result.title || 'تصميم إبداعي').substring(0, 50),
                                  content: editorContent || result.arabicCaption || result.description || JSON.stringify(result),
                                  type: activeMachine === 'visual' ? 'تصميم مرئي' : activeMachine,
                                  machineId: activeMachine,
                                  imageUrl: result.imageUrl,
                                  timestamp: new Date().toISOString()
                                });
                              }}
                              className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-blue-400 rounded-2xl font-black text-xs transition-all border border-white/10 flex items-center justify-center gap-2"
                            >
                              <Sparkles size={16} className="text-purple-500" />
                              حفظ في الرواق
                            </button>
                            <button 
                              onClick={() => onInstantPublish?.({
                                name: result.arabicCaption.substring(0, 30),
                                description: result.arabicCaption,
                                priceUSD: '15'
                              })}
                              className="flex-1 py-4 bg-blue-500 text-white rounded-2xl font-black text-xs hover:scale-105 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2"
                            >
                              <Rocket size={16} />
                              نشر كمنتج
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    )}



                  </motion.div>
                ) : (
                  <motion.div
                    key="waiting"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.02]"
                  >
                    <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-500 mb-6 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                      <Brain size={40} className={isProcessing ? 'animate-pulse' : ''} />
                    </div>
                    <h3 className="text-lg font-black text-purple-500 drop-shadow-[0_0_5px_rgba(168,85,247,0.4)] animate-heartbeat-glow" style={{ '--glow-color': 'var(--glow-gold)' } as React.CSSProperties}>{t('dashboard.factory.waitingTitle')}</h3>
                    <p className="text-xs text-blue-400 mt-2 max-w-[200px] leading-relaxed">
                      {t('dashboard.factory.waitingDesc')}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
        </MachineErrorBoundary>
      )}
    </motion.div>

    <AnimatePresence>
    </AnimatePresence>
    </>
  );
}
