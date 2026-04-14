import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { convertDriveLink, convertDriveVideoLink } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Sparkles, ShieldCheck, Zap, MessageCircle, Search, Brain, Loader2, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSmartRecommendations } from '../services/geminiService';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [aiFilteredIds, setAiFilteredIds] = useState<string[] | null>(null);
  const [heroVideoUrl, setHeroVideoUrl] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);
    try {
      const recommendedIds = await getSmartRecommendations(searchQuery, products);
      setAiFilteredIds(recommendedIds);
    } catch (err) {
      console.error("AI Search failed", err);
    } finally {
      setIsSearching(false);
    }
  };

  const clearAiSearch = () => {
    setAiFilteredIds(null);
    setSearchQuery('');
  };

  useEffect(() => {
    const qProds = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const qServices = query(collection(db, 'services'), orderBy('createdAt', 'desc'));

    const unsubProds = onSnapshot(qProds, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(prods);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching products:", error);
      setLoading(false);
    });

    const unsubServices = onSnapshot(qServices, (snapshot) => {
      const servs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setServices(servs);
    }, (error) => {
      console.error("Error fetching services:", error);
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'appearance'), (doc) => {
      if (doc.exists()) {
        setHeroVideoUrl(doc.data().heroVideoUrl || null);
      }
    });

    return () => {
      unsubProds();
      unsubServices();
      unsubSettings();
    };
  }, []);

  const filteredProducts = aiFilteredIds 
    ? products.filter(p => aiFilteredIds.includes(p.id))
    : (selectedCategory === 'all' 
        ? products 
        : products.filter(p => p.category === selectedCategory));

  const categories = [
    { id: 'all', name: t('hero.categories.all') },
    { id: 'cv', name: t('hero.categories.cv') },
    { id: 'social', name: t('hero.categories.social') },
    { id: 'web', name: t('hero.categories.web') },
    { id: 'other', name: t('hero.categories.other') }
  ];

  return (
    <div className="space-y-24 pb-20 relative">
      <div className="cosmic-bg" />
      
      {/* Hero Section */}
      <section className="relative pt-10 pb-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full -mr-64 -mt-64" />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-right space-y-8 order-2 lg:order-1"
          >
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-primary-light">
              <Sparkles size={12} className="animate-pulse" />
              {t('hero.subtitle')}
            </div>
            
            <h1 className="text-5xl md:text-7xl xl:text-8xl font-black leading-[1.1] tracking-tighter">
              {t('hero.title')} <br />
              <span className="text-gold text-glow">{t('hero.titleAccent')}</span>
            </h1>
            
            <p className="text-gray-400 text-lg md:text-xl leading-relaxed max-w-xl mr-auto font-medium">
              {t('hero.description')}
            </p>

            <div className="flex flex-wrap gap-4 justify-end">
              <a href="#products" className="btn-gradient px-10 py-4 rounded-2xl text-sm border border-white/10">
                {t('hero.browseProducts')}
              </a>
              <button onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })} className="btn-premium bg-white/5 text-white px-10 py-4 rounded-2xl font-black text-sm border border-white/10 hover:bg-white/10">
                {t('hero.ourServices')}
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="relative order-1 lg:order-2 flex justify-center w-full"
          >
            <div className="relative group w-full max-w-[400px]">
              <div className="absolute inset-0 bg-primary/30 blur-[150px] rounded-full animate-pulse" />
              <motion.div
                className="w-full aspect-[9/16] overflow-hidden relative z-10 border border-white/10 shadow-[0_0_120px_rgba(139,92,246,0.5)] bg-black rounded-[3rem]"
              >
                <video 
                  key={heroVideoUrl}
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-full h-full object-cover"
                >
                  <source src={heroVideoUrl || "https://uqemmhgfnriaeoyj.public.blob.vercel-storage.com/-8694076496645624839-uUCmBsrtnU4pJlimUGe3YXPAxVrDcA.mp4"} type="video/mp4" />
                  {t('hero.videoFallback')}
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black">{t('services.title')}</h2>
          <p className="text-gray-500 text-sm font-bold">{t('services.description')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.length > 0 ? (
            services.map((service, i) => (
              <div key={service.id || i} className="glass-card p-8 rounded-[2.5rem] space-y-6 group hover:border-primary/50 transition-all duration-500">
                <div className="w-full h-48 rounded-3xl overflow-hidden bg-dark/50 border border-white/5 relative group-hover:border-primary/20 transition-colors">
                  {service.imageUrl ? (
                    <img 
                      src={convertDriveLink(service.imageUrl)} 
                      alt={service.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-primary/10 to-transparent">
                      {service.icon || '✨'}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black group-hover:text-gold transition-colors">{service.title}</h3>
                  <p className="text-gray-500 text-sm font-medium line-clamp-2">{service.description}</p>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <div className="gold-capsule">{t('services.startFrom')} {service.price} {service.currency || 'USD'}</div>
                  <Link to={`/service/${service.id}`} className="btn-gradient px-6 py-2 rounded-full text-xs">{t('services.orderNow')}</Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-10 glass-card rounded-[2rem]">
              <p className="text-gray-500 font-bold">{t('services.comingSoon')}</p>
            </div>
          )}
        </div>
      </section>

      {/* Products Grid */}
      <section id="products" className="space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="text-right space-y-2">
            <h2 className="text-4xl font-black">{t('products.title')}</h2>
            <p className="text-gray-500 font-medium">{t('products.description')}</p>
          </div>
          
          <div className="flex flex-col gap-4 w-full md:w-96">
            <form onSubmit={handleAiSearch} className="relative group">
              <div className="absolute inset-0 bg-primary/5 blur-xl rounded-2xl group-focus-within:bg-primary/10 transition-colors" />
              <div className="relative flex items-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 focus-within:border-primary/50 transition-all">
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('hero.searchPlaceholder')}
                  className="bg-transparent border-none focus:ring-0 text-white px-4 py-2 text-sm w-full text-right"
                  dir="rtl"
                />
                {aiFilteredIds ? (
                  <button 
                    type="button"
                    onClick={clearAiSearch}
                    className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>
                ) : (
                  <button 
                    type="submit"
                    disabled={isSearching}
                    className="bg-primary text-white p-2 rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    {isSearching ? <Loader2 className="animate-spin" size={18} /> : <Brain size={18} />}
                  </button>
                )}
              </div>
            </form>

            <div className="flex flex-wrap justify-end gap-3 bg-white/5 p-2 rounded-2xl border border-white/5 backdrop-blur-md">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setAiFilteredIds(null);
                  }}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                    selectedCategory === cat.id && !aiFilteredIds
                      ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card h-[450px] rounded-[2.5rem] animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-24 glass-card rounded-[3rem] relative overflow-hidden group">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mt-32 group-hover:bg-primary/20 transition-colors duration-700" />
            <div className="relative z-10 flex flex-col items-center space-y-6">
              <div className="w-24 h-24 bg-dark border border-white/10 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(139,92,246,0.15)] group-hover:scale-110 transition-transform duration-500">
                <Sparkles className="text-primary w-12 h-12 animate-pulse" />
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-black text-white">{t('products.comingSoonTitle')}</h3>
                <p className="text-gray-400 font-medium max-w-md mx-auto leading-relaxed">
                  {t('products.comingSoonDesc')}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -12 }}
                className="glass-card rounded-[2.5rem] overflow-hidden group relative transition-all duration-500"
              >
                <div className="aspect-[4/5] relative overflow-hidden bg-dark-surface flex items-center justify-center">
                  <img 
                    src={convertDriveLink(product.imageUrl)} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop';
                    }}
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
                  
                  {aiFilteredIds && aiFilteredIds.includes(product.id) && (
                    <div className="absolute top-6 left-6 bg-primary/90 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black text-white border border-white/20 shadow-xl z-20 animate-pulse">
                      <div className="flex items-center gap-1">
                        <Brain size={12} />
                        {t('products.aiRecommended')}
                      </div>
                    </div>
                  )}

                  <div className="absolute top-6 right-6 bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black text-gray-300 border border-white/10 uppercase tracking-widest">
                    {product.category}
                  </div>
                </div>
                
                <div className="p-8 space-y-6 relative z-10">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <div className="gold-capsule">{product.price} {product.currency || selectedCurrency}</div>
                        <select 
                            value={selectedCurrency}
                            onChange={(e) => setSelectedCurrency(e.target.value)}
                            className="bg-dark/50 text-[10px] p-1 rounded-lg border border-white/10"
                        >
                            <option value="SAR">SAR</option>
                            <option value="KWD">KWD</option>
                            <option value="USD">USD</option>
                            <option value="AED">AED</option>
                        </select>
                    </div>
                    <h3 className="text-xl font-black group-hover:text-gold transition-colors text-right">{product.name}</h3>
                  </div>
                  
                  <p className="text-gray-500 text-sm line-clamp-2 font-medium leading-relaxed text-right">{product.description}</p>
                  
                  <Link 
                    to={`/product/${product.id}`}
                    className="flex items-center justify-center w-full btn-gradient py-4 rounded-2xl font-black text-sm transition-all duration-500 border border-white/10 group/btn"
                  >
                    <span>{t('products.viewDetails')}</span>
                    <ArrowRight size={16} className={`${i18n.language === 'ar' ? 'mr-2 -translate-x-2' : 'ml-2 translate-x-2'} opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all`} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Buyer Protection Highlight */}
      <section className="py-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-[3rem] p-10 md:p-16 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -ml-32 -mt-32" />
          
          <div className="w-24 h-24 bg-primary/20 rounded-3xl flex items-center justify-center text-primary border border-primary/30 shadow-2xl shadow-primary/10 flex-shrink-0">
            <ShieldCheck size={48} />
          </div>
          
          <div className="flex-1 text-center md:text-right space-y-4 relative z-10">
            <h2 className="text-3xl font-black text-white">{t('protection.advice.footer')}</h2>
            <p className="text-gray-400 font-medium text-lg leading-relaxed">
              {t('protection.header.description')}
            </p>
            <div className="flex flex-wrap justify-center md:justify-end gap-4 pt-4">
              <Link 
                to="/buyer-protection" 
                className="bg-white/5 hover:bg-white/10 text-white px-8 py-3 rounded-xl font-black text-sm border border-white/10 transition-all flex items-center gap-2"
              >
                {t('protection.advice.buttonHome')}
                <ArrowRight size={18} className={i18n.language === 'ar' ? '' : 'rotate-180'} />
              </Link>
              <Link 
                to="/recover-order" 
                className="text-gold hover:text-white transition-colors font-black text-sm flex items-center gap-2"
              >
                {t('myOrders.recoverLost')}
                <Search size={18} />
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Contact Section */}
      <section className="py-20">
        <div className="glass-card p-12 rounded-[3rem] text-center space-y-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full" />
          <h2 className="text-4xl font-black relative z-10">{t('footer.contact')}</h2>
          <p className="text-gray-400 font-medium max-w-lg mx-auto relative z-10">
            {t('footer.contactDesc')}
          </p>
          <div className="flex justify-center gap-4 relative z-10">
            <a href="https://wa.me/96569929627" target="_blank" rel="noopener noreferrer" className="btn-gradient px-10 py-4 rounded-2xl text-sm">
              {t('services.contactWhatsapp')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
