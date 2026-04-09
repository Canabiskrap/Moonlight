import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';
import { ShoppingBag, Sparkles, ShieldCheck, Zap, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-12"
    >
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
        
        <p className="text-gray-400 text-xl max-w-3xl mx-auto mb-12 leading-relaxed">
          نحن لا نصمم فقط، نحن نصنع تجارب بصرية فريدة. من الشعارات المبتكرة إلى المواقع المتكاملة، متجر Monnlight هو وجهتك الأولى للتميز الرقمي.
        </p>

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

      {/* Features Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12">
        {[
          { title: "جودة عالمية", desc: "تصاميم عصرية تتماشى مع أحدث التوجهات العالمية", icon: Sparkles, color: "text-gold" },
          { title: "دعم فني", desc: "فريقنا متواجد دائماً لمساعدتك في أي استفسار", icon: MessageCircle, color: "text-green-400" },
          { title: "تنوع فريد", desc: "تشكيلة واسعة من القوالب التي تغطي كافة احتياجاتك", icon: ShoppingBag, color: "text-primary" }
        ].map((feature, i) => (
          <div key={i} className="p-8 bg-dark-light rounded-[2rem] border border-white/5 hover:border-white/10 transition-all group">
            <feature.icon className={`${feature.color} mb-4 group-hover:scale-110 transition-transform`} size={32} />
            <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </section>

      {/* Products Grid */}
      <section id="products" className="space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-black">أحدث المنتجات</h2>
            <p className="text-gray-500">تصفح مجموعتنا المختارة من القوالب الرقمية</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-dark-light h-[400px] rounded-3xl animate-pulse border border-white/5" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-dark-light rounded-3xl border border-dashed border-white/10">
            <ShoppingBag className="mx-auto text-gray-600 mb-4" size={48} />
            <p className="text-gray-500 font-bold text-xl">لا توجد منتجات حالياً</p>
            <p className="text-gray-600">سيتم إضافة منتجات جديدة قريباً، ابقَ على اطلاع!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {products.map((product) => (
              <motion.div
                key={product.id}
                whileHover={{ y: -10 }}
                className="bg-dark-light rounded-3xl overflow-hidden border border-white/5 hover:border-primary/50 transition-all group"
              >
                <div className="aspect-video relative overflow-hidden">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 bg-dark/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-gold border border-gold/20">
                    {product.category === 'cv' ? 'سيرة ذاتية' : product.category === 'social' ? 'سوشيال ميديا' : 'قالب ويب'}
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{product.name}</h3>
                  <p className="text-gray-500 text-sm line-clamp-2">{product.description}</p>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    <div className="text-2xl font-black text-gold">${product.price}</div>
                    <Link 
                      to={`/product/${product.id}`}
                      className="bg-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
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
    </motion.div>
  );
}
