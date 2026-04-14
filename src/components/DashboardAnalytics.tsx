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
  debugLogs: string[];
}

export default function DashboardAnalytics({ orders, products, services, addLog, testAI, testConnection, isTestingAI, isTestingConnection, debugLogs }: AnalyticsProps) {
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
                onClick={testAI}
                disabled={isTestingAI}
                className="w-full py-4 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/20 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isTestingAI ? <RefreshCw size={18} className="animate-spin" /> : <Sparkles size={18} />}
                اختبار الذكاء الاصطناعي
              </button>
            </div>

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
