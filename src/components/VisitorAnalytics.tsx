import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, query, where, Timestamp, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Users, Eye, TrendingUp, Globe, Monitor, Smartphone, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import { motion } from 'motion/react';

interface VisitorData {
  id: string;
  timestamp: any;
  page: string;
  source: string;
  device: string;
  productViewed?: string;
}

interface AnalyticsStats {
  totalVisitors: number;
  activeNow: number;
  todayVisitors: number;
  weeklyVisitors: number;
  monthlyVisitors: number;
  topProducts: { name: string; views: number }[];
  trafficSources: { source: string; count: number; percentage: number }[];
  hourlyData: number[];
}

export default function VisitorAnalytics() {
  const [stats, setStats] = useState<AnalyticsStats>({
    totalVisitors: 0,
    activeNow: 0,
    todayVisitors: 0,
    weeklyVisitors: 0,
    monthlyVisitors: 0,
    topProducts: [],
    trafficSources: [],
    hourlyData: Array(24).fill(0)
  });
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time listener for visitors
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const unsubscribe = onSnapshot(collection(db, 'visitors'), (snapshot) => {
      const visitors = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VisitorData[];

      // Calculate stats
      const todayVisitors = visitors.filter(v => {
        const timestamp = v.timestamp?.toDate?.() || new Date(0);
        return timestamp >= startOfToday;
      });

      const weeklyVisitors = visitors.filter(v => {
        const timestamp = v.timestamp?.toDate?.() || new Date(0);
        return timestamp >= startOfWeek;
      });

      const monthlyVisitors = visitors.filter(v => {
        const timestamp = v.timestamp?.toDate?.() || new Date(0);
        return timestamp >= startOfMonth;
      });

      const activeNow = visitors.filter(v => {
        const timestamp = v.timestamp?.toDate?.() || new Date(0);
        return timestamp >= fiveMinutesAgo;
      }).length;

      // Calculate hourly data for today
      const hourlyData = Array(24).fill(0);
      todayVisitors.forEach(v => {
        const hour = v.timestamp?.toDate?.()?.getHours() || 0;
        hourlyData[hour]++;
      });

      // Calculate top products
      const productViews: Record<string, number> = {};
      visitors.forEach(v => {
        if (v.productViewed) {
          productViews[v.productViewed] = (productViews[v.productViewed] || 0) + 1;
        }
      });
      const topProducts = Object.entries(productViews)
        .map(([name, views]) => ({ name, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);

      // Calculate traffic sources
      const sourceCount: Record<string, number> = {};
      visitors.forEach(v => {
        const source = v.source || 'direct';
        sourceCount[source] = (sourceCount[source] || 0) + 1;
      });
      const totalSources = Object.values(sourceCount).reduce((a, b) => a + b, 0);
      const trafficSources = Object.entries(sourceCount)
        .map(([source, count]) => ({
          source,
          count,
          percentage: Math.round((count / totalSources) * 100)
        }))
        .sort((a, b) => b.count - a.count);

      setStats({
        totalVisitors: visitors.length,
        activeNow,
        todayVisitors: todayVisitors.length,
        weeklyVisitors: weeklyVisitors.length,
        monthlyVisitors: monthlyVisitors.length,
        topProducts,
        trafficSources,
        hourlyData
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getDisplayData = () => {
    switch (timeRange) {
      case 'day': return stats.todayVisitors;
      case 'week': return stats.weeklyVisitors;
      case 'month': return stats.monthlyVisitors;
    }
  };

  const sourceIcons: Record<string, string> = {
    direct: 'مباشر',
    social: 'سوشيال',
    search: 'بحث',
    referral: 'إحالة',
    whatsapp: 'واتساب'
  };

  const maxHourly = Math.max(...stats.hourlyData, 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black flex items-center gap-3">
          <Eye className="text-primary" size={24} />
          تحليلات الزوار
        </h2>
        <div className="flex gap-2 bg-dark/50 p-1 rounded-xl">
          {(['day', 'week', 'month'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                timeRange === range
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {range === 'day' ? 'اليوم' : range === 'week' ? 'الأسبوع' : 'الشهر'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-light/50 backdrop-blur-xl p-5 rounded-2xl border border-white/5"
        >
          <div className="flex items-center justify-between mb-3">
            <Users className="text-primary" size={20} />
            <span className="text-xs text-green-400 font-bold flex items-center gap-1">
              <ArrowUp size={12} />
              +12%
            </span>
          </div>
          <p className="text-2xl font-black">{stats.totalVisitors.toLocaleString()}</p>
          <p className="text-xs text-gray-500">إجمالي الزوار</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-dark-light/50 backdrop-blur-xl p-5 rounded-2xl border border-emerald-500/20 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-emerald-500/5" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <Globe className="text-emerald-400" size={20} />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-400">{stats.activeNow}</p>
            <p className="text-xs text-gray-500">متصل الآن</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-dark-light/50 backdrop-blur-xl p-5 rounded-2xl border border-white/5"
        >
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="text-gold" size={20} />
            <span className="text-xs text-green-400 font-bold flex items-center gap-1">
              <ArrowUp size={12} />
              +8%
            </span>
          </div>
          <p className="text-2xl font-black">{getDisplayData().toLocaleString()}</p>
          <p className="text-xs text-gray-500">
            {timeRange === 'day' ? 'زوار اليوم' : timeRange === 'week' ? 'زوار الأسبوع' : 'زوار الشهر'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-dark-light/50 backdrop-blur-xl p-5 rounded-2xl border border-white/5"
        >
          <div className="flex items-center justify-between mb-3">
            <Clock className="text-blue-400" size={20} />
          </div>
          <p className="text-2xl font-black">
            {stats.todayVisitors > 0 ? Math.round((stats.todayVisitors / 24) * 10) / 10 : 0}
          </p>
          <p className="text-xs text-gray-500">متوسط الزوار/ساعة</p>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Chart */}
        <div className="bg-dark-light/50 backdrop-blur-xl p-6 rounded-2xl border border-white/5">
          <h3 className="font-bold text-sm text-gray-400 mb-4">نشاط الزوار (24 ساعة)</h3>
          <div className="flex items-end gap-1 h-32">
            {stats.hourlyData.map((value, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-primary/20 rounded-t transition-all hover:bg-primary/40"
                  style={{ height: `${(value / maxHourly) * 100}%`, minHeight: value > 0 ? '4px' : '0' }}
                >
                  <div
                    className="w-full bg-primary rounded-t"
                    style={{ height: '100%' }}
                  />
                </div>
                {i % 4 === 0 && (
                  <span className="text-[10px] text-gray-600">{i}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-dark-light/50 backdrop-blur-xl p-6 rounded-2xl border border-white/5">
          <h3 className="font-bold text-sm text-gray-400 mb-4">مصادر الزيارات</h3>
          <div className="space-y-3">
            {stats.trafficSources.length > 0 ? (
              stats.trafficSources.slice(0, 4).map((source, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-24 text-sm font-bold text-gray-300">
                    {sourceIcons[source.source] || source.source}
                  </div>
                  <div className="flex-1 bg-dark rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${source.percentage}%` }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-primary to-primary-dark"
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-400 w-12 text-left">
                    {source.percentage}%
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">لا توجد بيانات بعد</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-dark-light/50 backdrop-blur-xl p-6 rounded-2xl border border-white/5">
        <h3 className="font-bold text-sm text-gray-400 mb-4">المنتجات الأكثر مشاهدة</h3>
        {stats.topProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {stats.topProducts.map((product, i) => (
              <div
                key={i}
                className="bg-dark/50 p-4 rounded-xl border border-white/5 text-center"
              >
                <p className="text-2xl font-black text-primary mb-1">{product.views}</p>
                <p className="text-xs text-gray-400 truncate">{product.name}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">لا توجد مشاهدات بعد</p>
        )}
      </div>
    </div>
  );
}
