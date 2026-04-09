import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';
import { ShoppingBag, Sparkles, ShieldCheck, Zap } from 'lucide-react';
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
      <section className="text-center py-12 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-radial-gradient from-primary/10 to-transparent pointer-events-none" />
        
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary-light px-4 py-2 rounded-full text-sm font-bold mb-6">
          <Sparkles size={16} />
          خدمات تصميم احترافية بجودة عالمية
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-white via-white to-primary bg-clip-text text-transparent leading-tight">
          حوّل أفكارك إلى <br /> هوية بصرية تتكلم
        </h1>
        
        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10">
          نصمم بإبداع ونسلم باحترافية — من اللوجو والهوية البصرية إلى المواقع والتطبيقات. احصل على قوالبك الجاهزة الآن.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
            <ShieldCheck className="text-gold" size={18} />
            دفع آمن عبر PayPal
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
            <Zap className="text-primary" size={18} />
            تسليم فوري للملفات
          </div>
        </div>
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
