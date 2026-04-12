import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Sparkles, Brain, Zap, MessageSquare, Loader2, ArrowRight, User, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { chatWithBot } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface SmartAIAssistantProps {
  products: any[];
  orders: any[];
}

export default function SmartAIAssistant({ products, orders }: SmartAIAssistantProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const prompt = `بصفتك خبير مبيعات ذكي لمتجر Moonlight، قم بتحليل هذه البيانات وقدم نصيحة استراتيجية واحدة قوية لزيادة المبيعات:
      عدد المنتجات: ${products.length}
      عدد الطلبات: ${orders.length}
      المنتجات: ${products.slice(0, 5).map(p => p.name).join(', ')}`;
      
      const response = await chatWithBot(prompt, [], 'dashboard');
      setInsight(response);
    } catch (error) {
      console.error("AI Analysis Error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', parts: [{ text: userMsg }] }]);

    try {
      const response = await chatWithBot(userMsg, chatHistory, 'dashboard');
      setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: response }] }]);
    } catch (error) {
      console.error("Chat Error:", error);
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
            <CardTitle className="text-xl font-black text-white">تحليل الذكاء الاصطناعي</CardTitle>
          </div>
          <CardDescription className="text-gray-400 font-medium">
            دع الذكاء الاصطناعي يحلل أداء متجرك ويقترح عليك خطوات للنمو.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="relative z-10 space-y-6">
          <AnimatePresence mode="wait">
            {insight ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-dark-surface p-6 rounded-2xl border border-gold/20 text-right"
              >
                <div className="text-gray-200 leading-relaxed font-medium markdown-body">
                  <ReactMarkdown>{insight}</ReactMarkdown>
                </div>
                <Button 
                  variant="ghost" 
                  className="mt-4 text-primary font-black hover:bg-primary/10"
                  onClick={() => setInsight(null)}
                >
                  إعادة التحليل
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
                <p className="text-sm text-gray-500 font-bold">جاهز لتحليل بيانات المتجر...</p>
                <Button 
                  onClick={runAnalysis} 
                  disabled={isAnalyzing}
                  className="bg-primary hover:bg-primary-dark text-white px-8 py-6 rounded-2xl font-black text-lg shadow-xl shadow-primary/20"
                >
                  {isAnalyzing ? <Loader2 className="animate-spin ml-2" /> : <Sparkles className="ml-2" />}
                  ابدأ التحليل الذكي
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* AI Chat Assistant */}
      <Card className="bg-dark-light/30 border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-[500px]">
        <CardHeader className="border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-gold/20 p-2 rounded-xl text-gold">
              <MessageSquare size={20} />
            </div>
            <div>
              <CardTitle className="text-xl font-black text-white">مساعد Moonlight الذكي</CardTitle>
              <CardDescription className="text-gray-500 font-bold">اسألني عن أي شيء يخص إدارة المتجر</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
          {chatHistory.length === 0 && (
            <div className="text-center py-20 text-gray-600">
              <p className="text-sm font-bold">ابدأ المحادثة الآن للحصول على مساعدة فورية</p>
            </div>
          )}
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                msg.role === 'user' ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-primary/20' : 'bg-gradient-to-r from-gold to-gold-light text-dark shadow-gold/20'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium markdown-body text-right ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-r from-primary/20 to-primary/10 text-white border border-primary/30 rounded-tr-none' 
                  : 'bg-dark-surface text-gray-200 border border-gold/30 rounded-tl-none shadow-[0_0_15px_rgba(178,255,5,0.05)]'
              }`}>
                <ReactMarkdown>{msg.parts[0].text}</ReactMarkdown>
              </div>
            </div>
          ))}
        </CardContent>
        
        <div className="p-4 border-t border-white/5">
          <form onSubmit={handleChat} className="relative">
            <input 
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="اكتب سؤالك هنا..."
              className="w-full bg-white/5 border border-white/10 focus:border-primary/50 outline-none p-4 pr-12 rounded-2xl text-sm transition-all text-right"
            />
            <button 
              type="submit"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-primary hover:scale-110 transition-transform"
            >
              <ArrowRight size={20} />
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
}
