import { motion } from 'motion/react';
import { ShieldCheck, Target, Zap, Sparkles } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white py-20 px-6">
      {/* Cinematic Hero Section */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-purple-300">
            <Sparkles size={12} />
            قصتنا
          </div>
          <h1 className="relative text-5xl md:text-7xl font-bold leading-tight tracking-tighter font-serif">
            <span className="absolute inset-0 text-purple-500 blur-2xl opacity-50">حكايةٌ بدأت تحت ضوء القمر</span>
            <span className="absolute inset-0 text-purple-300 blur-lg opacity-70">حكايةٌ بدأت تحت ضوء القمر</span>
            <span className="relative text-white">حكايةٌ بدأت تحت ضوء القمر</span>
          </h1>
          <div className="space-y-6 text-gray-300 text-lg font-light leading-relaxed text-right">
            <p>
              في اللحظات التي يهدأ فيها صخب العالم، ويغمر ضوء القمر الأفق بسكونه الفاتن، ولدت فكرة <strong>Moonlight 🌕</strong>. لم نكن نبحث عن مجرد متجر يبيع المنتجات، بل كنا نبحث عن 'تلك اللمسة' التي تضيء يومك تماماً كما يفعل القمر في عتمة الليل.
            </p>
            <p>
              نحن نؤمن أن الأشياء التي نقتنيها ليست مجرد جمادات، بل هي رفقاء في لحظاتنا الخاصة. لذا، في <strong>Moonlight</strong>، نختار كل قطعة بعناية فائقة، وكأننا نجمع خيوط الضوء لنقدمها لك في قالب من الأناقة والتميز.
            </p>
            <p>
              <strong>لماذا Moonlight🌕؟</strong>
              <br />
              لأننا نقدس التفاصيل الهادئة والفخامة التي لا تحتاج إلى صراخ لتُلاحظ. رحلتنا بدأت بشغف تحويل التسوق من عملية روتينية إلى رحلة ملهمة، واليوم، نحن هنا لنكون رفيقك في اختيار كل ما هو فريد، بجودة تليق بك، وأمان يجعلك تتسوق بقلبٍ مطمئن.
            </p>
            <p className="font-bold text-purple-300">
              شكراً لأنك اخترت أن تكون جزءاً من حكايتنا.. شكراً لأنك اخترت أن تتألق بضياء <strong>Moonlight</strong>.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative h-[600px] rounded-[3rem] overflow-hidden shadow-2xl shadow-purple-900/20"
        >
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-contain"
          >
            <source src="https://uqemmhgfnriaeoyj.public.blob.vercel-storage.com/-8694076496645624839-uUCmBsrtnU4pJlimUGe3YXPAxVrDcA.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] via-transparent to-transparent rounded-[3rem]" />
        </motion.div>
      </div>

      {/* Values Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mt-24"
      >
        {[
          { icon: Sparkles, title: 'التميز', desc: 'نختار لك الأفضل بعناية فائقة.', color: 'text-yellow-400' },
          { icon: ShieldCheck, title: 'الأمان', desc: 'تجربة تسوق آمنة وموثوقة.', color: 'text-green-400' },
          { icon: Target, title: 'الوضوح', desc: 'شفافية تامة في كل تفصيل.', color: 'text-blue-400' },
        ].map((item, i) => (
          <div key={i} className="bg-white/[0.03] border border-white/5 p-10 rounded-[2rem] text-center space-y-4 hover:border-purple-500/30 transition-all group">
            <div className={`w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto ${item.color}`}>
              <item.icon size={32} />
            </div>
            <h3 className="text-2xl font-bold text-white">{item.title}</h3>
            <p className="text-gray-400 font-light text-sm">{item.desc}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
