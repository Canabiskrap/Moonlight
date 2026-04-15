import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Sparkles, Brain, Zap, MessageSquare, Loader2, ArrowRight, User, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { chatWithBot } from '../services/geminiService';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';

interface SmartAIAssistantProps {
  products: any[];
  orders: any[];
}

export default function SmartAIAssistant({ products, orders }: SmartAIAssistantProps) {
  const { t } = useTranslation();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  React.useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'appearance'), (doc) => {
      if (doc.exists()) {
        setSettings(doc.data());
      }
    });
    return () => unsub();
  }, []);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const prompt = `بصفتك خبير مبيعات ذكي لمتجر Moonlight، قم بتحليل هذه البيانات وقدم نصيحة استراتيجية واحدة قوية لزيادة المبيعات:
      عدد المنتجات: ${products.length}
      عدد الطلبات: ${orders.length}
      المنتجات: ${products.slice(0, 5).map(p => p.name).join(', ')}`;
      
      const response = await chatWithBot(prompt, [], 'dashboard', settings);
      setInsight(response);
    } catch (error) {
      console.error("AI Analysis Error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || isChatting) return;

    const userMsg = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', parts: [{ text: userMsg }] }]);
    setIsChatting(true);

    try {
      const response = await chatWithBot(userMsg, chatHistory, 'dashboard', settings);
      setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: response }] }]);
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* AI Insights Card */}
      <Card className="bg-primary/5 border-primary/20 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Brain size={120} className="text-primary" />
        </div>
        
        <CardHeader className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/20 p-2 rounded-xl text-primary">
              <Sparkles size={20} />
            </div>
            <CardTitle className="text-xl font-black text-white">{t('bot.title')}</CardTitle>
          </div>
          <CardDescription className="text-gray-400 font-medium">
            {t('bot.description')}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="relative z-10 space-y-6">
          <AnimatePresence mode="wait">
            {insight ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-dark-surface p-6 rounded-2xl border border-gold/20 text-right shadow-inner"
              >
                <div className="text-gray-200 leading-relaxed font-medium markdown-body">
                  <ReactMarkdown>{insight}</ReactMarkdown>
                </div>
                <Button 
                  variant="ghost" 
                  className="mt-4 text-primary font-black hover:bg-primary/10"
                  onClick={() => setInsight(null)}
                >
                  {t('bot.reAnalyze')}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-10 text-center space-y-4"
              >
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-primary animate-pulse">
                  <Zap size={32} />
                </div>
                <p className="text-sm text-gray-500 font-bold">{t('bot.ready')}</p>
                <Button 
                  onClick={runAnalysis} 
                  disabled={isAnalyzing}
                  className="bg-primary hover:bg-primary-dark text-white px-8 py-6 rounded-2xl font-black text-lg shadow-xl shadow-primary/20"
                >
                  {isAnalyzing ? <Loader2 className="animate-spin ml-2" /> : <Sparkles className="ml-2" />}
                  {t('bot.startAnalysis')}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* AI Chat Assistant */}
      <Card className="bg-dark-light/30 border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-[500px]">
        <CardHeader className="border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="bg-gold/20 p-2 rounded-xl text-gold">
              <MessageSquare size={20} />
            </div>
            <div>
              <CardTitle className="text-xl font-black text-white">{t('bot.assistantTitle')}</CardTitle>
              <CardDescription className="text-gray-500 font-bold">{t('bot.assistantDesc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {chatHistory.length === 0 && (
            <div className="text-center py-20 text-gray-600">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={32} />
              </div>
              <p className="text-sm font-bold">{t('bot.startChat')}</p>
            </div>
          )}
          {chatHistory.map((msg, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                msg.role === 'user' ? 'bg-primary text-white shadow-primary/20' : 'bg-gold text-dark shadow-gold/20'
              }`}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-bold leading-relaxed shadow-lg ${
                msg.role === 'user' 
                  ? 'bg-primary/20 text-white border border-primary/30 rounded-tr-none' 
                  : 'bg-white/5 text-gray-200 border border-white/10 rounded-tl-none'
              }`}>
                <div className="markdown-body text-right">
                  <ReactMarkdown>{msg.parts[0].text}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
          {isChatting && (
            <div className="flex gap-3 flex-row">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-gold text-dark flex items-center justify-center animate-pulse">
                <Bot size={20} />
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 rounded-tl-none">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gold rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2 h-2 bg-gold rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2 h-2 bg-gold rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          )}
        </CardContent>
        
        <div className="p-6 border-t border-white/5 bg-white/[0.02]">
          <form onSubmit={handleChat} className="relative group">
            <input 
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder={t('bot.placeholder')}
              disabled={isChatting}
              className="w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:bg-white/[0.08] outline-none p-5 pr-14 rounded-2xl text-sm transition-all text-right text-white font-bold placeholder:text-gray-600 disabled:opacity-50"
            />
            <button 
              type="submit"
              disabled={isChatting || !chatMessage.trim()}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary/10 text-primary hover:bg-primary hover:text-white disabled:opacity-50 disabled:hover:bg-primary/10 disabled:hover:text-primary rounded-xl flex items-center justify-center transition-all shadow-lg shadow-primary/10"
            >
              {isChatting ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
}
