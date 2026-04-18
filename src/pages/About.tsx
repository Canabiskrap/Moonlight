import { motion } from 'motion/react';
import { ShieldCheck, Target, Zap, Sparkles } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen text-white py-20 px-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[150px] -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 blur-[150px] -ml-64 -mb-64" />

      {/* Cinematic Hero Section */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-3 bg-primary/10 border border-primary/20 px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-[0.4em] text-primary animate-pulse">
            <Sparkles size={14} />
            قصتنا
          </div>
          <h1 className="text-6xl md:text-8xl font-black leading-none tracking-tighter">
            حكايةٌ بدأت تحت <br />
            <span className="text-gold animate-heartbeat-glow block mt-4" style={{ '--glow-color': 'var(--glow-gold)' } as React.CSSProperties}>ضوء القمر</span>
          </h1>
          <div className="space-y-6 text-white/60 text-xl font-medium leading-relaxed text-right italic">
            <p>
              في اللحظات التي يهدأ فيها صخب العالم، ويغمر ضوء القمر الأفق بسكونه الفاتن، ولدت فكرة <span className="text-primary font-black drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]">Moonlight 🌕</span>. لم نكن نبحث عن مجرد متجر يبيع المنتجات، بل كنا نبحث عن 'تلك اللمسة' التي تضيء يومك تماماً كما يفعل القمر في عتمة الليل.
            </p>
            <p>
              نحن نؤمن أن الأشياء التي نقتنيها ليست مجرد جمادات، بل هي رفقاء في لحظاتنا الخاصة. لذا، في <span className="text-white font-bold">Moonlight</span>، نختار كل قطعة بعناية فائقة، وكأننا نجمع خيوط الضوء لنقدمها لك في قالب من الأناقة والتميز.
            </p>
            <p>
              <strong className="text-gold text-2xl not-italic tracking-tight block mt-10 mb-4">لماذا Moonlight🌕؟</strong>
              لأننا نقدس التفاصيل الهادئة والفخامة التي لا تحتاج إلى صراخ لتُلاحظ. رحلتنا بدأت بشغف تحويل التسوق من عملية روتينية إلى رحلة ملهمة، واليوم، نحن هنا لنكون رفيقك في اختيار كل ما هو فريد، بجودة تليق بك، وأمان يجعلك تتسوق بقلبٍ مطمئن.
            </p>
            <p className="font-black text-2xl text-white not-italic mt-12 bg-white/5 p-8 rounded-[3rem] border border-white/10 shadow-2xl backdrop-blur-xl">
              شكراً لأنك اخترت أن تكون جزءاً من حكايتنا.. شكراً لأنك اخترت أن تتألق بضياء <span className="text-primary tracking-widest uppercase ml-2">Moonlight</span>.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
          whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="relative h-[700px] rounded-[4rem] overflow-hidden shadow-[0_0_100px_rgba(56,189,248,0.15)] border border-white/10 group bg-dark-light/40 backdrop-blur-3xl"
        >
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-contain mix-blend-screen opacity-90 group-hover:scale-110 transition-transform duration-1000"
          >
            <source src="https://uqemmhgfnriaeoyj.public.blob.vercel-storage.com/-8694076496645624839-uUCmBsrtnU4pJlimUGe3YXPAxVrDcA.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/50 to-transparent flex flex-col items-center justify-end pb-16 px-10 text-center">
             <div className="w-1.5 h-16 bg-gradient-to-t from-primary to-transparent rounded-full animate-pulse mb-6" />
             <p className="text-white/40 text-xs font-black uppercase tracking-[0.5em]">Vision of Elegance</p>
          </div>
        </motion.div>
      </div>

      {/* Values Section */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 mt-32 relative z-10 px-4 md:px-0">
        {[
          { icon: Sparkles, title: 'التميز', desc: 'نختار لك الأفضل بعناية فائقة.', color: 'text-yellow-400', glow: 'var(--glow-gold)' },
          { icon: ShieldCheck, title: 'الأمان', desc: 'تجربة تسوق آمنة وموثوقة.', color: 'text-green-400', glow: '#10b981' },
          { icon: Target, title: 'الوضوح', desc: 'شفافية تامة في كل تفصيل.', color: 'text-blue-400', glow: 'var(--glow-blue)' },
        ].map((item, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.2 }}
            className="magic-card p-12 rounded-[3.5rem] text-center space-y-6 hover:translate-y-[-10px] transition-all duration-500 group"
          >
            <div className={`w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto ${item.color} border border-white/5 shadow-2xl group-hover:rotate-12 transition-transform duration-700`}>
              <item.icon size={40} />
            </div>
            <h3 className="text-3xl font-black text-white group-hover:animate-heartbeat-glow transition-all" style={{'--glow-color': item.glow} as React.CSSProperties}>{item.title}</h3>
            <p className="text-white/40 font-medium text-lg leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
