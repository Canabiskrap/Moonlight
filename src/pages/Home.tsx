import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { convertDriveLink } from '../lib/utils';
import { motion } from 'motion/react';
import { ShoppingBag, Sparkles, ShieldCheck, Zap, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(prods);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching products:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const categories = [
    { id: 'all', name: 'الكل' },
    { id: 'cv', name: 'سيرة ذاتية' },
    { id: 'social', name: 'سوشيال ميديا' },
    { id: 'web', name: 'قوالب ويب' },
    { id: 'other', name: 'أخرى' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-24 pb-20 relative"
    >
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
      </div>

      {/* Hero Section */}
      <section className="text-center py-20 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-radial-gradient from-primary/20 to-transparent pointer-events-none blur-3xl" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary-light px-6 py-2 rounded-full text-sm font-bold mb-8 backdrop-blur-sm"
        >
          <Sparkles size={16} className="animate-pulse" />
          نصمم مستقبلك الرقمي باحترافية
        </motion.div>
        
        <h1 className="text-6xl md:text-8xl font-black mb-8 bg-gradient-to-b from-white via-white to-gray-500 bg-clip-text text-transparent leading-tight tracking-tighter">
          حوّل أفكارك إلى <br /> <span className="text-primary">هوية بصرية</span> تتكلم
        </h1>
        
        <div className="max-w-4xl mx-auto mb-12 text-right space-y-6 bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-primary/20 transition-colors" />
          
          <h2 className="text-2xl font-black text-white flex items-center gap-3 justify-end">
            ✨ وصف المتجر
          </h2>
          
          <p className="text-gray-300 text-lg leading-relaxed font-medium">
            متجر يقدم خدمات تصميم احترافية بأسعار تنافسية وجودة عالية، موجه للأفراد وأصحاب المشاريع الذين يبحثون عن هوية قوية وحضور رقمي مميز.
          </p>

          <div className="space-y-4">
            <h3 className="text-primary font-black text-lg">نقدم مجموعة من الخدمات الرقمية تشمل:</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-400 text-sm font-bold">
              {[
                "🎨 تصميم هوية بصرية كاملة تعكس هوية العلامة التجارية",
                "💎 تصميم شعارات (لوجو) مميزة وبسيطة تعبر عن فكرة المشروع",
                "📱 تصميم بوستات وريلز للسوشيال ميديا بأسلوب جذاب وحديث",
                "🌐 تصميم وتطوير مواقع إلكترونية عصرية ومتجاوبة",
                "🚀 تصميم تطبيقات أندرويد و iOS بواجهات احترافية",
                "📂 إنشاء صفحات معرض أعمال (Portfolio) لعرض المشاريع"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 justify-end bg-white/5 p-3 rounded-xl border border-white/5 hover:border-primary/30 transition-all">
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-primary-light font-bold text-center pt-4 border-t border-white/5">
            نهدف إلى تقديم خدمات تصميم رقمية عالية الجودة تساعدك على بناء حضور قوي واحترافي في العالم الرقمي.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 mb-16">
          <div className="flex items-center gap-3 text-sm font-bold text-gray-300 bg-white/5 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-md">
            <ShieldCheck className="text-gold" size={20} />
            دفع آمن 100%
          </div>
          <div className="flex items-center gap-3 text-sm font-bold text-gray-300 bg-white/5 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-md">
            <Zap className="text-primary" size={20} />
            تحميل فوري وآلي
          </div>
        </div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-gray-600 flex flex-col items-center gap-2"
        >
          <span className="text-xs font-bold uppercase tracking-widest">اكتشف منتجاتنا</span>
          <div className="w-px h-12 bg-gradient-to-b from-primary to-transparent" />
        </motion.div>
      </section>

      {/* Products Grid */}
      <section id="products" className="space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-right">
            <h2 className="text-4xl font-black">معرض المنتجات</h2>
            <p className="text-gray-500">تصفح مجموعتنا المختارة من القوالب الرقمية</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/5 backdrop-blur-md">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                  selectedCategory === cat.id 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-dark-light h-[400px] rounded-3xl animate-pulse border border-white/5" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-24 bg-dark-light/50 rounded-[3rem] border border-white/5 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mt-32 group-hover:bg-primary/20 transition-colors duration-700" />
            <div className="relative z-10 flex flex-col items-center space-y-6">
              <div className="w-24 h-24 bg-dark border border-white/10 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(139,92,246,0.15)] group-hover:scale-110 transition-transform duration-500">
                <Sparkles className="text-primary w-12 h-12 animate-pulse" />
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-black text-white">قريباً: معرض أعمالنا الحصري قيد التحديث</h3>
                <p className="text-gray-400 font-medium max-w-md mx-auto leading-relaxed">
                  نعمل حالياً على تجهيز مجموعة مميزة من القوالب والأعمال الرقمية التي سترتقي بمشاريعك. ابقَ على اطلاع!
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -10 }}
                className="bg-white/5 backdrop-blur-xl rounded-[2rem] overflow-hidden border border-white/10 hover:border-primary/50 transition-all duration-500 group shadow-2xl hover:shadow-[0_20px_40px_-15px_rgba(139,92,246,0.3)] relative"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <div className="aspect-video relative overflow-hidden bg-dark-light flex items-center justify-center">
                  <img 
                    src={convertDriveLink(product.imageUrl)} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute top-4 right-4 bg-dark/80 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-black text-gold border border-gold/20 shadow-lg">
                    {product.category === 'cv' ? 'سيرة ذاتية' : product.category === 'social' ? 'سوشيال ميديا' : product.category === 'web' ? 'قالب ويب' : 'أخرى'}
                  </div>
                </div>
                
                <div className="p-8 space-y-4 relative z-10">
                  <h3 className="text-2xl font-black group-hover:text-primary transition-colors">{product.name}</h3>
                  <p className="text-gray-400 text-sm line-clamp-2 font-medium leading-relaxed">{product.description}</p>
                  
                  <div className="flex justify-between items-center pt-6 border-t border-white/10">
                    <div className="text-3xl font-black text-gold">${product.price}</div>
                    <Link 
                      to={`/product/${product.id}`}
                      className="bg-white/10 hover:bg-primary text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-primary/20 backdrop-blur-md border border-white/10 hover:border-primary"
                    >
                      تفاصيل وشراء
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20">
        <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/20 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
          <div className="relative z-10 max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">
              جاهز لنقل مشروعك للمستوى التالي؟
            </h2>
            <p className="text-xl text-gray-300 font-medium">
              دعنا نصنع لك هوية بصرية لا تُنسى. تواصل معنا الآن لبدء رحلة النجاح.
            </p>
            <div className="pt-4">
              <a 
                href="https://wa.me/96569929627" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-white text-dark px-8 py-4 rounded-2xl font-black text-lg hover:scale-105 transition-transform duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)]"
              >
                <MessageCircle size={24} />
                تواصل معنا عبر واتساب
              </a>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
