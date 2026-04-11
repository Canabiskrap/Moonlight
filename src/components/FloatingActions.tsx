import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Bot, X, Send, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { chatWithBot } from '../services/geminiService';

export default function FloatingActions() {
  const [showBot, setShowBot] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{role: 'bot' | 'user', text: string}[]>([
    { role: 'bot', text: 'مرحباً بك في متجر Monnlight! أنا مساعدك الذكي، كيف يمكنني مساعدتك اليوم؟' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const whatsappNumber = "96569929627"; 
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    console.log("Bot: Sending message...", userMessage);
    try {
      // Map history to Gemini format
      const history = messages.slice(1).map(m => ({
        role: m.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: m.text }]
      }));

      const botResponse = await chatWithBot(userMessage, history);
      setMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
    } catch (error: any) {
      console.error("Bot Error Details:", error);
      let errorMsg = "عذراً، حدث خطأ تقني. يمكنك التواصل معنا عبر الواتساب مباشرة.";
      
      const errorStr = JSON.stringify(error);
      if (errorStr.includes('403') || errorStr.includes('PERMISSION_DENIED')) {
        errorMsg = "خطأ: ليس لديك صلاحية للوصول إلى الذكاء الاصطناعي. يرجى التأكد من صحة مفتاح API في الإعدادات وتفعيل Generative Language API.";
      } else if (error?.message?.includes('API_KEY_INVALID') || error?.message?.includes('API key')) {
        errorMsg = "خطأ: مفتاح API الخاص بالذكاء الاصطناعي غير صالح أو مفقود.";
      } else if (error?.message?.includes('quota')) {
        errorMsg = "عذراً، تم تجاوز حصة الاستخدام اليومية للذكاء الاصطناعي.";
      } else if (error?.message) {
        errorMsg = `خطأ تقني: ${error.message.substring(0, 100)}`;
      }

      setMessages(prev => [...prev, { role: 'bot', text: errorMsg }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4">
      {/* WhatsApp Button */}
      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="bg-[#25D366] text-white p-4 rounded-full shadow-2xl shadow-[#25D366]/30 flex items-center justify-center group relative"
      >
        <MessageCircle size={28} />
        <span className="absolute right-full mr-4 bg-white text-dark px-3 py-1 rounded-lg text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
          تواصل معنا عبر واتساب
        </span>
      </motion.a>

      {/* Smart Bot Button */}
      <motion.button
        onClick={() => setShowBot(!showBot)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="bg-primary text-white w-16 h-16 rounded-full shadow-2xl shadow-primary/30 flex items-center justify-center group relative"
      >
        {showBot ? <X size={28} /> : (
          <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center">
            <Bot size={28} className="text-white" />
            <img 
              src="/bot-avatar.png" 
              alt="Bot Avatar" 
              className="w-full h-full object-cover absolute inset-0 transition-opacity duration-300" 
              onLoad={(e) => e.currentTarget.style.opacity = '1'}
              onError={(e) => e.currentTarget.style.opacity = '0'} 
              style={{ opacity: 0 }}
            />
          </div>
        )}
        <span className="absolute right-full mr-4 bg-white text-dark px-3 py-1 rounded-lg text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
          المساعد الذكي
        </span>
      </motion.button>

      {/* Smart Bot UI */}
      <AnimatePresence>
        {showBot && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-20 right-0 w-80 md:w-96 bg-dark-light border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="bg-primary p-5 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setMessages([{ role: 'bot', text: 'مرحباً بك في متجر Monnlight! أنا مساعدك الذكي، كيف يمكنني مساعدتك اليوم؟' }])}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors"
                  title="مسح المحادثة"
                >
                  <RefreshCw size={16} />
                </button>
                <div className="bg-white/20 w-10 h-10 rounded-xl relative overflow-hidden flex items-center justify-center">
                  <Bot size={24} className="text-white" />
                  <img 
                    src="/bot-avatar.png" 
                    alt="Bot Avatar" 
                    className="w-full h-full object-cover absolute inset-0 transition-opacity duration-300" 
                    onLoad={(e) => e.currentTarget.style.opacity = '1'}
                    onError={(e) => e.currentTarget.style.opacity = '0'} 
                    style={{ opacity: 0 }}
                  />
                </div>
              </div>
              <div>
                <p className="font-black text-sm">مساعد Monnlight الذكي</p>
                <p className="text-[10px] text-white/70">مدعوم بالذكاء الاصطناعي</p>
              </div>
            </div>

            <div 
              ref={scrollRef}
              className="p-6 space-y-4 h-80 overflow-y-auto scrollbar-hide bg-dark/30"
            >
              {messages.map((msg, i) => (
                <motion.div
                  initial={{ opacity: 0, x: msg.role === 'user' ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed font-bold ${
                    msg.role === 'user' 
                    ? 'bg-white/10 text-white rounded-tl-none' 
                    : 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/10'
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-end">
                  <div className="bg-primary/20 p-3 rounded-2xl rounded-tr-none flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-primary" />
                    <span className="text-[10px] font-bold text-primary">يفكر...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/5 bg-dark/50 flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="اسألني أي شيء..." 
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors font-bold"
              />
              <button 
                onClick={handleSendMessage}
                disabled={isTyping}
                className="bg-primary p-2 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
