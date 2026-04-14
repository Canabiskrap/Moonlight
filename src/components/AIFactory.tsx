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
  Palette
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { runFactoryMachine } from '../services/geminiService';

interface MachineProps {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
}

export default function AIFactory() {
  const { t } = useTranslation();
  const [activeMachine, setActiveMachine] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [editorContent, setEditorContent] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
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
    }
  ];

  const handleProcess = async () => {
    if (!input.trim()) return;
    setIsProcessing(true);
    setResult(null);
    setEditorContent('');

    try {
      if (activeMachine) {
        const data = await runFactoryMachine(activeMachine, input);
        setResult(data);
        if ((activeMachine === 'contentMaker' || activeMachine === 'brandGuidelines') && data.htmlContent) {
          setEditorContent(data.htmlContent);
        }
      }
    } catch (error) {
      console.error("Factory Error:", error);
    } finally {
      setIsProcessing(false);
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
      filename:     'moonlight-product.pdf',
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(element).save();
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
                  <button
                    onClick={handleProcess}
                    disabled={isProcessing || !input.trim()}
                    className="w-full py-5 bg-primary text-white rounded-3xl font-black text-sm hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-3"
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
                          <Card key={i} className="bg-dark-light/30 border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                              <CardTitle className="text-sm font-black text-primary flex items-center gap-2 uppercase tracking-widest">
                                <Sparkles size={16} />
                                {idea.type}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {idea.content}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {(activeMachine === 'contentMaker' || activeMachine === 'brandGuidelines') && (
                      <Card className="bg-dark-light/30 border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between">
                          <CardTitle className="text-lg font-black text-white flex items-center gap-2">
                            {activeMachine === 'brandGuidelines' ? <Palette size={20} className="text-pink-400" /> : <FileText size={20} className="text-green-400" />}
                            {activeMachine === 'brandGuidelines' ? t('dashboard.factory.machines.brandGuidelines.title') : t('dashboard.factory.machines.contentMaker.editorTitle')}
                          </CardTitle>
                          <button 
                            onClick={handleExportPDF}
                            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
                          >
                            <Download size={14} />
                            {t('dashboard.factory.machines.contentMaker.exportPdf')}
                          </button>
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
