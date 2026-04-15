import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
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
  Image as ImageIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { runFactoryMachine, chatWithBot } from '../services/geminiService';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface MachineProps {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
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
  addLog
}: FactoryProps) {
  const { t } = useTranslation();
  const [activeMachine, setActiveMachine] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [editorContent, setEditorContent] = useState('');
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Added state
  const [settings, setSettings] = useState<any>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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
      color: 'text-blue-400'
    },
    {
      id: 'product',
      title: t('dashboard.factory.machines.product.title'),
      description: t('dashboard.factory.machines.product.description'),
      icon: Rocket,
      color: 'text-purple-400'
    },
    {
      id: 'contentMaker',
      title: t('dashboard.factory.machines.contentMaker.title'),
      description: t('dashboard.factory.machines.contentMaker.description'),
      icon: FileText,
      color: 'text-green-400'
    },
    {
      id: 'brandGuidelines',
      title: t('dashboard.factory.machines.brandGuidelines.title'),
      description: t('dashboard.factory.machines.brandGuidelines.description'),
      icon: Palette,
      color: 'text-pink-400'
    },
    {
      id: 'visual',
      title: t('dashboard.factory.machines.visual.title'),
      description: t('dashboard.factory.machines.visual.description'),
      icon: Sparkles,
      color: 'text-gold'
    },
    {
      id: 'brandBook',
      title: 'مهندس دليل الهوية',
      description: 'أنشئ دليل هوية بصرية متكامل لعلامتك التجارية بضغطة زر.',
      icon: Palette,
      color: 'text-purple-500'
    },
    {
      id: 'cvMaker',
      title: 'صانع السيرة الذاتية',
      description: 'صمم CV احترافي وعصري يبرز مهاراتك وخبراتك.',
      icon: UserCheck,
      color: 'text-blue-500'
    },
    {
      id: 'templateMaker',
      title: 'صانع القوالب',
      description: 'أنشئ قوالب جاهزة (فواتير، خطابات، خطط) بلمسة فنية.',
      icon: Palette,
      color: 'text-orange-400'
    },
    {
      id: 'visualGenerator',
      title: 'المصمم الآلي',
      description: 'ولد تصاميم سوشيال ميديا احترافية لهويتك البصرية.',
      icon: Sparkles,
      color: 'text-primary'
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
        const data = await runFactoryMachine(activeMachine, input, imageUrl, settings);
        setResult(data);
        if ((activeMachine === 'contentMaker' || activeMachine === 'brandGuidelines' || activeMachine === 'brandBook' || activeMachine === 'visualGenerator' || activeMachine === 'cvMaker' || activeMachine === 'templateMaker') && data.htmlContent) {
          setEditorContent(data.htmlContent);
        }
      }
    } catch (error) {
      console.error("Factory Error:", error);
    } finally {
      setIsProcessing(false);
    }
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
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setShowDownloadMenu(false);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const getImagePrompt = (machineId: string | null, res: any) => {
    if (!machineId || !res) return "abstract digital art, luxury aesthetic";
    const base = ", professional graphic design, high resolution, 8k, masterpiece, commercial advertising layout, flux model";
    if (machineId === 'visualGenerator') return res.designPrompt + base;
    if (machineId === 'strategy') return `business strategy concept, SWOT analysis, professional dashboard, ${res.persona?.name || ''}` + base;
    if (machineId === 'product') return `digital product showcase, ${res.title}, professional marketing` + base;
    if (machineId === 'cvMaker') return `professional modern resume layout, elegant typography, career success` + base;
    if (machineId === 'templateMaker') return `professional document template, structured layout, clean design` + base;
    if (machineId === 'brandGuidelines' || machineId === 'brandBook') return `brand identity guidelines, color palette, logo design showcase` + base;
    return (res.title || "creative digital asset") + base;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-white flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-xl text-primary">
            <Zap size={28} />
          </div>
          {t('dashboard.factory.title')}
        </h2>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mr-12">
          {t('dashboard.factory.subtitle')}
        </p>
      </div>

      {/* Moonlight Oracle Section */}
      {!activeMachine && (
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent border border-primary/20 rounded-[2.5rem] p-8 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Sparkles size={120} className="text-primary" />
            </div>
            
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4 max-w-xl">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/20 p-2 rounded-xl text-primary">
                    <Brain size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-white">عراف Moonlight (AI Oracle)</h3>
                </div>
                <p className="text-gray-400 font-medium leading-relaxed">
                  "دع الذكاء الاصطناعي يقرأ مستقبل متجرك. العراف يحلل هويتك ويقترح عليك منتجات رقمية مبتكرة لتوسيع إمبراطوريتك."
                </p>
                <button
                  onClick={generateOracle}
                  disabled={isGeneratingOracle}
                  className="px-8 py-4 bg-primary text-white rounded-2xl font-black hover:scale-105 transition-all flex items-center gap-3 shadow-xl shadow-primary/20 disabled:opacity-50"
                >
                  {isGeneratingOracle ? <RefreshCw size={20} className="animate-spin" /> : <Sparkles size={20} />}
                  استشر العراف الآن
                </button>
              </div>

              <div className="flex-1 w-full grid grid-cols-1 gap-4">
                {oracleIdeas.length > 0 ? (
                  oracleIdeas.map((idea, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-primary/30 transition-all cursor-pointer group/idea flex items-center justify-between"
                    >
                      <div 
                        className="flex-1"
                        onClick={() => { setInput(idea.content); setActiveMachine('product'); }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black text-primary uppercase tracking-widest">فكرة مقترحة #{i+1}</span>
                        </div>
                        <p className="text-sm text-gray-300 line-clamp-2 font-medium">{idea.content}</p>
                      </div>
                      <button 
                        onClick={() => onInstantPublish?.(idea)}
                        className="ml-4 p-3 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all shadow-lg"
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
                <div className="bg-gold/20 p-2 rounded-xl text-gold">
                  <Palette size={24} />
                </div>
                <h3 className="text-2xl font-black text-white">رواق الإبداع (Gallery)</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {galleryItems.map((item) => (
                  <Card key={item.id} className="bg-dark-light/30 border-white/10 backdrop-blur-xl rounded-[2rem] overflow-hidden group hover:border-primary/50 transition-all duration-500">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{item.timestamp}</span>
                        <div className="flex items-center gap-2">
                          <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase">
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
                      <p className="text-sm text-gray-300 line-clamp-4 font-medium leading-relaxed">
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
                          className="flex-1 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-[10px] font-black transition-all"
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
              whileHover={{ y: -5 }}
              onClick={() => setActiveMachine(machine.id)}
              className="cursor-pointer"
            >
              <Card className="bg-dark-light/30 border-white/10 backdrop-blur-xl rounded-[2.5rem] h-full hover:border-primary/50 transition-all duration-500 overflow-hidden group">
                <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                  <div className={`p-5 rounded-3xl bg-dark/50 ${machine.color} group-hover:scale-110 transition-transform duration-500 shadow-2xl`}>
                    <machine.icon size={40} />
                  </div>
                  <h3 className="text-xl font-black text-white">{machine.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium">
                    {machine.description}
                  </p>
                  <div className="pt-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white group-hover:bg-primary group-hover:text-white transition-all">
                      <ArrowRight size={20} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <button 
            onClick={() => { setActiveMachine(null); setResult(null); setInput(''); }}
            className="text-xs font-black text-gray-500 hover:text-white flex items-center gap-2 transition-colors uppercase tracking-widest"
          >
            <ArrowRight size={14} className="rtl:rotate-180" />
            {t('dashboard.factory.backToFactory')}
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card className="bg-dark-light/30 border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-xl font-black text-white flex items-center gap-3">
                    {machines.find(m => m.id === activeMachine)?.title}
                  </CardTitle>
                  <CardDescription className="text-gray-500 font-bold">
                    {t('dashboard.factory.enterIdeaDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={activeMachine === 'strategy' ? t('dashboard.factory.placeholderStrategy') : t('dashboard.factory.placeholderProduct')}
                    className="w-full h-40 bg-dark/50 border border-white/10 rounded-3xl p-6 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition-all resize-none font-medium"
                  />
                  
                  <div className="flex gap-3">
                    <button
                      onClick={refinePrompt}
                      disabled={isRefining || !input.trim()}
                      className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 border border-white/10 disabled:opacity-50"
                    >
                      {isRefining ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} className="text-primary" />}
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
                      className="flex-1 py-5 bg-primary text-white rounded-3xl font-black text-sm hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-3"
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
                      <div className="flex gap-3">
                        <button
                          onClick={() => onSaveToGallery?.({ content: result.htmlContent || result.description || input, type: activeMachine, machineId: activeMachine })}
                          className="flex-1 py-4 bg-gold/10 hover:bg-gold/20 text-gold rounded-2xl font-black text-xs transition-all border border-gold/20 flex items-center justify-center gap-2"
                        >
                          <Palette size={16} />
                          حفظ في الرواق
                        </button>
                        <button
                          onClick={() => onInstantPublish?.({ title: result.title || input.substring(0, 20), description: result.description || result.htmlContent || input, priceSuggestion: result.priceSuggestion })}
                          className="flex-1 py-4 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-2xl font-black text-xs transition-all border border-primary/20 flex items-center justify-center gap-2"
                        >
                          <Rocket size={16} />
                          نشر فوري
                        </button>
                      </div>
                    )}
                </CardContent>
              </Card>

              <div className="bg-gold/10 border border-gold/20 rounded-3xl p-6 flex gap-4">
                <div className="bg-gold/20 p-3 rounded-2xl text-gold shrink-0 h-fit">
                  <Lightbulb size={24} />
                </div>
                <div>
                  <h4 className="text-gold font-black text-sm mb-1">{t('dashboard.factory.adviceTitle')}</h4>
                  <p className="text-xs text-gray-400 leading-relaxed font-bold">
                    {t('dashboard.factory.adviceDetailed')}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <AnimatePresence mode="wait">
                {result ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                  >
                    {/* Global Image Preview for all machines except visual and visualGenerator (which have their own outputs) */}
                    {activeMachine !== 'visual' && activeMachine !== 'visualGenerator' && (
                      <div className="aspect-video w-full rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl relative group mb-6">
                        <img 
                          src={`https://image.pollinations.ai/prompt/${encodeURIComponent(getImagePrompt(activeMachine, result))}?width=1280&height=720&nologo=true&model=flux&seed=${Math.floor(Math.random() * 1000)}`}
                          alt="Machine Visual"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <p className="text-[10px] text-white font-black uppercase tracking-widest">تصور ذكاء Moonlight الاصطناعي</p>
                          </div>
                          <h3 className="text-lg font-black text-white line-clamp-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
                              <BarChart3 size={20} className="text-primary" />
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
                              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{t('dashboard.factory.machines.strategy.name')}</p>
                              <p className="text-sm text-white font-bold">{result.persona.name}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{t('dashboard.factory.machines.strategy.needs')}</p>
                              <p className="text-xs text-gray-400 leading-relaxed">{result.persona.needs}</p>
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
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{t('dashboard.factory.machines.product.productTitle')}</p>
                            <h3 className="text-xl font-black text-white">{result.title}</h3>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{t('dashboard.factory.machines.product.productDesc')}</p>
                            <p className="text-sm text-gray-400 leading-relaxed">{result.description}</p>
                          </div>
                          <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">{t('dashboard.factory.machines.product.priceSuggestion')}</p>
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
                          <Card key={i} className="bg-dark-light/30 border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden group hover:border-gold/30 transition-all">
                            <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                              <CardTitle className="text-sm font-black text-primary flex items-center gap-2 uppercase tracking-widest">
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
                                  className="flex-1 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1"
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
                              className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
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
                                    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(getImagePrompt(activeMachine, result))}?width=1280&height=720&nologo=true&model=flux&seed=${Math.floor(Math.random() * 1000)}`;
                                    handleDownloadImage(imageUrl, `moonlight-${activeMachine}.jpg`);
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
                        <CardContent className="p-0 bg-gray-100 rounded-b-[2.5rem]">
                          <div className="text-black overflow-hidden jodit-wrapper">
                            <JoditEditor
                              ref={editor}
                              value={editorContent}
                              config={joditConfig}
                              onBlur={newContent => setEditorContent(newContent)}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {activeMachine === 'visualGenerator' && (
                      <Card className="bg-dark-light/30 border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="border-b border-white/5">
                          <CardTitle className="text-lg font-black text-white flex items-center gap-2">
                            <Sparkles size={20} className="text-primary" />
                            نتائج المصمم الآلي (V2 - High Quality)
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                          <div className="aspect-square w-full max-w-md mx-auto relative group rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
                            <img 
                              src={`https://image.pollinations.ai/prompt/${encodeURIComponent(getImagePrompt(activeMachine, result))}?width=1024&height=1024&nologo=true&model=flux&seed=${Math.floor(Math.random() * 1000)}`}
                              alt="Generated Visual"
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              referrerPolicy="no-referrer"
                              onLoad={() => addLog?.("🎨 تم توليد التصميم الاحترافي بنجاح!")}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                              <p className="text-[10px] text-white/80 font-medium italic">تم التوليد بواسطة Moonlight AI (Flux Engine)</p>
                            </div>
                          </div>

                          <div className="flex gap-4">
                            <button 
                              onClick={() => {
                                const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(getImagePrompt(activeMachine, result))}?width=1024&height=1024&nologo=true&model=flux&seed=${Math.floor(Math.random() * 1000)}`;
                                handleDownloadImage(imageUrl, `moonlight-design.jpg`);
                              }}
                              className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-sm hover:bg-primary-dark transition-all shadow-2xl shadow-primary/20 flex items-center justify-center gap-2"
                            >
                              <Download size={18} />
                              تحميل التصميم (عالي الجودة)
                            </button>
                            <button 
                              onClick={() => onSaveToGallery?.({
                                title: result.arabicCaption.substring(0, 50) + '...',
                                content: result.arabicCaption,
                                type: 'تصميم',
                                machineId: 'visualGenerator',
                                imageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(result.designPrompt)}?width=1024&height=1024&nologo=true`
                              })}
                              className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-xs transition-all border border-white/10 flex items-center justify-center gap-2"
                            >
                              <Download size={16} />
                              حفظ في الرواق
                            </button>
                            <button 
                              onClick={() => onInstantPublish?.({
                                name: result.arabicCaption.substring(0, 30),
                                description: result.arabicCaption,
                                priceUSD: '15'
                              })}
                              className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-xs hover:scale-105 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
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
                  <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.02]">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-gray-600 mb-6">
                      <Brain size={40} className={isProcessing ? 'animate-pulse text-primary' : ''} />
                    </div>
                    <h3 className="text-lg font-black text-gray-500">{t('dashboard.factory.waitingTitle')}</h3>
                    <p className="text-xs text-gray-600 mt-2 max-w-[200px] leading-relaxed">
                      {t('dashboard.factory.waitingDesc')}
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
