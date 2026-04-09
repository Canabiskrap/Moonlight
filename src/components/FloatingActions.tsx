import { motion } from 'motion/react';
import { MessageCircle, Bot, X } from 'lucide-react';
import { useState } from 'react';

export default function FloatingActions() {
  const [showBot, setShowBot] = useState(false);

  const whatsappNumber = "96569929627"; 
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;

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
        className="bg-primary text-white p-4 rounded-full shadow-2xl shadow-primary/30 flex items-center justify-center group relative"
      >
        {showBot ? <X size={28} /> : <Bot size={28} />}
        <span className="absolute right-full mr-4 bg-white text-dark px-3 py-1 rounded-lg text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
          المساعد الذكي
        </span>
      </motion.button>

      {/* Simple Bot UI (Placeholder) */}
      {showBot && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute bottom-20 right-0 w-80 bg-dark-light border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="bg-primary p-4 flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-sm">المساعد الذكي</p>
              <p className="text-[10px] text-white/70">متصل الآن</p>
            </div>
          </div>
          <div className="p-6 space-y-4 h-64 overflow-y-auto text-sm">
            <div className="bg-white/5 p-3 rounded-2xl rounded-tr-none">
              مرحباً بك في متجر Monnlight! كيف يمكنني مساعدتك اليوم؟
            </div>
            <div className="bg-primary/10 p-3 rounded-2xl rounded-tr-none border border-primary/20">
              يمكنك سؤالي عن المنتجات، طرق الدفع، أو كيفية التحميل.
            </div>
          </div>
          <div className="p-4 border-t border-white/5 bg-dark/50">
            <input 
              type="text" 
              placeholder="اكتب رسالتك هنا..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
