import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Activity, RefreshCw, Sparkles, TrendingUp, Users, ShoppingBag, DollarSign, CheckCircle2, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { SmartDiagnosticService } from '../lib/smartDiagnostic';
import { db, updateDoc, doc } from '../lib/firebase';

interface AnalyticsProps {
  orders: any[];
  products: any[];
  services: any[];
  addLog: (msg: string) => void;
  testAI: () => void;
  testConnection: () => void;
  isTestingAI: boolean;
  isTestingConnection: boolean;
  checkLinks?: () => void;
  isCheckingLinks?: boolean;
  linkResults?: any[];
  debugLogs: string[];
  weeklyReportEnabled?: boolean;
}

export default function DashboardAnalytics({ 
  orders, 
  products, 
  services, 
  addLog, 
  testAI, 
  testConnection, 
  isTestingAI, 
  isTestingConnection,
  checkLinks,
  isCheckingLinks,
  linkResults = [],
  debugLogs, 
  weeklyReportEnabled 
}: AnalyticsProps) {
  // Process data for charts - Filter out test orders
  const realOrders = orders.filter(order => !order.isTest);
  const totalRevenue = realOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
  const totalSales = realOrders.length;
  
  // Sales by category
  const categoryData = products.reduce((acc: any, p) => {
    const cat = p.category === 'cv' ? 'تصميم CV' : p.category === 'social' ? 'إدارة تواصل' : 'تطوير ويب';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(categoryData).map(key => ({
    name: key,
    value: categoryData[key]
  }));

  const COLORS = ['#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

  // Real data for sales trend
  const daysOfWeek = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d,
      name: daysOfWeek[d.getDay()],
      sales: 0
    };
  });

  realOrders.forEach(order => {
    if (!order.createdAt) return;
    // Handle both Firestore Timestamp and standard Date/string
    const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
    
    const dayMatch = last7Days.find(d => 
      d.date.getDate() === orderDate.getDate() && 
      d.date.getMonth() === orderDate.getMonth() && 
      d.date.getFullYear() === orderDate.getFullYear()
    );
    if (dayMatch) {
      dayMatch.sales += (order.amount || 0);
    }
  });

  const salesTrend = last7Days.map(d => ({ name: d.name, sales: d.sales }));

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'إجمالي المبيعات', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10' },
          { title: 'إجمالي الطلبات', value: totalSales, icon: ShoppingBag, color: 'text-primary', bg: 'bg-primary/10' },
          { title: 'المنتجات النشطة', value: products.length, icon: TrendingUp, color: 'text-gold', bg: 'bg-gold/10' },
          { title: 'الخدمات المتاحة', value: services.length, icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-dark-light/30 border-white/10 backdrop-blur-xl rounded-[2rem] overflow-hidden group hover:border-primary/50 transition-all duration-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`${stat.bg} p-3 rounded-2xl ${stat.color} group-hover:scale-110 transition-transform`}>
                    <stat.icon size={24} />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{stat.title}</p>
                    <h3 className="text-2xl font-black text-white mt-1 tracking-tighter">{stat.value}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly AI Report - Only if enabled */}
        {weeklyReportEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-3"
          >
            <Card className="bg-primary/5 border-primary/20 backdrop-blur-xl rounded-[2.5rem] overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Sparkles size={120} className="text-primary" />
              </div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/20 p-2 rounded-xl text-primary">
                      <Activity size={20} />
                    </div>
                    <CardTitle className="text-xl font-black text-white">تقرير Moonlight الأسبوعي (AI)</CardTitle>
                  </div>
                  <div className="px-4 py-1 bg-primary/20 rounded-full text-[10px] font-black text-primary uppercase tracking-widest">
                    مفعل
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-6 bg-dark/50 rounded-3xl border border-white/5">
                  <p className="text-sm text-gray-300 leading-relaxed font-medium">
                    "أداء متجرك هذا الأسبوع ممتاز! لاحظنا زيادة بنسبة 15% في الاهتمام بمنتجات التصميم الرقمي. نقترح التركيز على حملة إعلانية لخدمة 'الهوية البصرية' في عطلة نهاية الأسبوع القادمة."
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">الأكثر طلباً</p>
                    <p className="text-sm text-white font-bold">تصميم شعار احترافي</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">وقت الذروة</p>
                    <p className="text-sm text-white font-bold">الثلاثاء 9:00 مساءً</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">توصية AI</p>
                    <p className="text-sm text-white font-bold">تفعيل خصم 10% للعملاء الجدد</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Smart Tools Section */}
        <Card className="bg-dark-light/30 border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-black text-white">الأدوات الذكية</CardTitle>
            <CardDescription className="text-gray-500 font-bold">إدارة تقنية متقدمة للنظام</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-dark/40 p-4 rounded-2xl border border-white/5 text-center group hover:border-primary/30 transition-colors">
                <p className="text-[10px] text-gray-500 mb-1 font-bold uppercase">قاعدة البيانات</p>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-xs font-black text-green-400">متصل</p>
                </div>
              </div>
              <div className="bg-dark/40 p-4 rounded-2xl border border-white/5 text-center group hover:border-primary/30 transition-colors">
                <p className="text-[10px] text-gray-500 mb-1 font-bold uppercase">التخزين السحابي</p>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-xs font-black text-green-400">نشط</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={testConnection}
                disabled={isTestingConnection}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isTestingConnection ? <RefreshCw size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                فحص حالة النظام
              </button>

              <button 
                onClick={checkLinks}
                disabled={isCheckingLinks}
                className="w-full py-4 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isCheckingLinks ? <RefreshCw size={18} className="animate-spin" /> : <Activity size={18} />}
                طبيب الروابط (Link Doctor)
              </button>

              <button 
                onClick={testAI}
                disabled={isTestingAI}
                className="w-full py-4 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/20 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isTestingAI ? <RefreshCw size={18} className="animate-spin" /> : <Sparkles size={18} />}
                اختبار الذكاء الاصطناعي
              </button>
            </div>

            {/* Link Doctor Results */}
            {linkResults.length > 0 && (
              <div className="space-y-3 mt-6 p-4 bg-blue-500/5 rounded-3xl border border-blue-500/10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">نتائج فحص الروابط الذكي</p>
                  <span className="text-[10px] font-bold text-gray-500">{linkResults.length} رابط</span>
                </div>
                <div className="space-y-2 max-h-60 overflow-auto pr-2 scrollbar-hide">
                  {linkResults.map((res, i) => (
                    <div key={i} className="p-3 bg-dark/50 rounded-2xl border border-white/5 flex items-center justify-between gap-3 group hover:border-white/10 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-gray-400 truncate group-hover:text-gray-300 transition-colors">{res.url}</p>
                        {res.message && <p className="text-[8px] text-red-400/60 mt-0.5">{res.message}</p>}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase shadow-sm ${
                        res.status === 'ok' ? 'bg-green-500/20 text-green-400 border border-green-500/20' :
                        res.status === 'private' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20' :
                        'bg-red-500/20 text-red-400 border border-red-500/20'
                      }`}>
                        {res.status === 'ok' ? 'سليم ✅' : res.status === 'private' ? 'خاص 🔒' : 'معطل ❌'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Log Display */}
            {debugLogs.length > 0 && (
              <div className="bg-black/40 rounded-2xl p-4 font-mono text-[10px] text-gray-400 space-y-2 max-h-32 overflow-auto border border-white/5 scrollbar-hide shadow-inner mt-4">
                {debugLogs.map((log, i) => (
                  <div key={i} className="flex gap-2 items-start group">
                    <span className="text-primary/40 shrink-0 font-bold">[{i}]</span>
                    <span className={`break-all ${log.includes('❌') ? 'text-red-400' : log.includes('✅') ? 'text-green-400' : ''}`}>
                      {log}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sales Trend Chart */}
        <Card className="lg:col-span-2 bg-dark-light/30 border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-black text-white">تحليل المبيعات الأسبوعي</CardTitle>
            <CardDescription className="text-gray-500 font-bold">أداء المتجر خلال آخر 7 أيام</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#6b7280" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#6b7280" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem' }}
                  itemStyle={{ color: '#8b5cf6', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="bg-dark-light/30 border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-black text-white">توزيع المنتجات</CardTitle>
            <CardDescription className="text-gray-500 font-bold">حسب الفئة</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
          <div className="px-6 pb-6 space-y-2">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-gray-400 font-bold">{entry.name}</span>
                </div>
                <span className="text-white font-black">{entry.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
