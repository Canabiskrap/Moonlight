import React from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const generateHistory = (degradedDays: number[] = []) => {
  return Array.from({ length: 30 }, (_, i) => {
    const date = new Date(2026, 3, 11); // Apr 11, 2026 as base date to match the video
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: degradedDays.includes(29 - i) ? 'degraded' : 'operational'
    };
  });
};

const services = [
  { name: 'AI Gateway', status: 'Operational', history: generateHistory() },
  { name: 'API', status: 'Operational', history: generateHistory() },
  { name: 'Build & Deploy', status: 'Operational', history: generateHistory([15, 16, 17, 18, 19]) },
  { name: 'CI/CD', status: 'Operational', history: generateHistory() },
  { name: 'Data Cache', status: 'Operational', history: generateHistory() },
  { name: 'DNS', status: 'Operational', history: generateHistory() },
  { name: 'Domain Registration', status: 'Operational', history: generateHistory() },
  { name: 'Edge Functions', status: 'Operational', history: generateHistory() },
  { name: 'Edge Middleware', status: 'Operational', history: generateHistory() },
  { name: 'Edge Network', status: 'Operational', history: generateHistory(), isGroup: true },
  { name: 'Image Optimization', status: 'Operational', history: generateHistory() },
  { name: 'Logs', status: 'Operational', history: generateHistory() },
  { name: 'Drains', status: 'Operational', history: generateHistory() },
  { name: 'Marketplace', status: 'Operational', history: generateHistory() },
  { name: 'Remote Caching', status: 'Operational', history: generateHistory() },
  { name: 'SAML Single Sign-On', status: 'Operational', history: generateHistory() },
  { name: 'Sandbox', status: 'Operational', history: generateHistory([5, 6]) },
  { name: 'Serverless Functions', status: 'Operational', history: generateHistory() },
  { name: 'Secure Compute', status: 'Operational', history: generateHistory(), isGroup: true },
  { name: 'Speed Insights', status: 'Operational', history: generateHistory() },
  { name: 'SSL Certificates', status: 'Operational', history: generateHistory() },
  { name: 'Storage', status: 'Operational', history: generateHistory(), isGroup: true },
  { name: 'v0', status: 'Operational', history: generateHistory(), isGroup: true },
  { name: 'Web Analytics', status: 'Operational', history: generateHistory() },
  { name: 'Queues', status: 'Operational', history: generateHistory() },
  { name: 'Workflow', status: 'Operational', history: generateHistory() },
];

const incidents = [
  { date: 'Apr 11, 2026', incidents: [] },
  { date: 'Apr 10, 2026', incidents: [] },
  { date: 'Apr 9, 2026', incidents: [] },
  { date: 'Apr 8, 2026', incidents: [] },
  { 
    date: 'Apr 7, 2026', 
    incidents: [
      {
        title: 'Elevated queue times for deployments on the Hobby plan',
        updates: [
          { status: 'Resolved', message: 'This incident has been resolved.', time: 'Apr 7, 18:56 UTC' },
          { status: 'Update', message: 'A fix has been rolled out, and we are monitoring the results. Queued deployments are being processed and new deployments are building normally now.', time: 'Apr 7, 18:27 UTC' },
          { status: 'Identified', message: 'We have identified an issue causing elevated queue times for deployments on the Hobby plan. We are investigating a fix and will share more updates as soon as we have more information.', time: 'Apr 7, 18:06 UTC' }
        ]
      },
      {
        title: 'Builds logs stuck in loading state in iad1',
        updates: [
          { status: 'Resolved', message: 'The incident has been resolved. If you don\'t see build logs for a specific deployment, please redeploy.', time: 'Apr 7, 08:37 UTC' },
          { status: 'Monitoring', message: 'We identified the cause of build logs stuck in the loading state affecting iad1 and are working around the issue for new builds. Please redeploy to your build to view build logs.', time: 'Apr 7, 08:29 UTC' },
          { status: 'Investigating', message: 'We are investigating reports of build logs stuck in loading state.', time: 'Apr 7, 07:19 UTC' }
        ]
      }
    ] 
  },
  { date: 'Apr 6, 2026', incidents: [] },
  { date: 'Apr 5, 2026', incidents: [] },
  { date: 'Apr 4, 2026', incidents: [] },
  { date: 'Apr 3, 2026', incidents: [] },
  { 
    date: 'Apr 2, 2026', 
    incidents: [
      {
        title: 'Elevated INTERNAL_UNEXPECTED_ERROR error rates for some deployments',
        updates: [
          { status: 'Resolved', message: 'This incident has been resolved.', time: 'Apr 2, 23:09 UTC' },
          { status: 'Monitoring', message: 'The fix has been rolled out and we are monitoring the results. If you are still seeing issues, we recommend redeploying or performing an instant rollback to fix the issue.', time: 'Apr 2, 20:02 UTC' },
          { status: 'Identified', message: 'We have identified the issue and are rolling out a fix. Deployments created between 16:10 to 19:12 UTC may be affected. If you are still seeing issues, we recommend redeploying or performing an instant rollback to fix the issue.', time: 'Apr 2, 19:26 UTC' },
          { status: 'Investigating', message: 'We are investigating reports of elevated INTERNAL_UNEXPECTED_ERROR responses affecting some customer deployments. We will provide updates as we learn more.', time: 'Apr 2, 18:39 UTC' }
        ]
      },
      {
        title: 'Elevated errors (SIGSEGV) for Vercel Functions running Node.js 20 in cle1 and dub1 regions',
        updates: [
          { status: 'Resolved', message: 'This incident has been resolved.', time: 'Apr 2, 18:53 UTC' },
          { status: 'Monitoring', message: 'The root cause has been identified, a fix has been rolled out, and we are actively monitoring. Newly deployed Vercel Functions on Node.js 20 in cle1 and dub1 no longer terminate with SIGSEGV. We recommend redeploying affected Vercel Functions if you are still seeing issues.', time: 'Apr 2, 18:09 UTC' },
          { status: 'Update', message: 'We are continuing to investigate increased rates of Vercel Functions running on Node.js 20 terminating with SIGSEGV in Vercel\'s cle1 and dub1 regions. Other regions are unaffected. We recommend redeploying affected Vercel Functions or upgrading them to either Node.js 22 or 24.', time: 'Apr 2, 16:13 UTC' },
          { status: 'Investigating', message: 'We are currently investigating increased rates of Vercel Functions running on Node.js 20 terminating with SIGSEGV. We recommend redeploying affected Vercel Functions or upgrading them to either Node.js 22 or 24.', time: 'Apr 2, 14:10 UTC' }
        ]
      }
    ] 
  },
  { 
    date: 'Apr 1, 2026', 
    incidents: [
      {
        title: 'Elevated errors creating deployments with integrations and increased delays in delivering webhooks',
        updates: [
          { status: 'Resolved', message: 'This incident has been resolved.', time: 'Apr 1, 22:17 UTC' },
          { status: 'Monitoring', message: 'A fix has been implemented and we are monitoring the results. Webhook events are being delivered normally, and deployments with integrations are building successfully.', time: 'Apr 1, 21:57 UTC' },
          { status: 'Identified', message: 'We have identified an issue causing elevated latency and errors with delivering webhooks and creating deployments that use integrations. We are working on a fix for this issue and will provide further updates as soon as they become available.', time: 'Apr 1, 20:48 UTC' }
        ]
      }
    ] 
  },
  { 
    date: 'Mar 31, 2026', 
    incidents: [
      {
        title: 'Elevated Errors Creating Deployments',
        updates: [
          { status: 'Resolved', message: 'This incident has been resolved.', time: 'Mar 31, 21:23 UTC' },
          { status: 'Monitoring', message: 'A fix has been applied for an issue where deployments were erroring with "invalid request" and we are monitoring the results. We recommend redeploying any failed deployments.', time: 'Mar 31, 21:17 UTC' },
          { status: 'Investigating', message: 'We are investigating reports of elevated errors when creating deployments. Existing deployments and live traffic are unaffected. We will provide updates as they become available.', time: 'Mar 31, 21:11 UTC' }
        ]
      },
      {
        title: 'Degraded Support Case Submission',
        updates: [
          { status: 'Resolved', message: 'This incident has been resolved.', time: 'Mar 31, 13:29 UTC' },
          { status: 'Update', message: 'Support case submission has been confirmed to be functioning normally. We will share updates as they become available.', time: 'Mar 31, 13:16 UTC' },
          { status: 'Monitoring', message: 'A fix has been implemented and we are monitoring the results. We will share updates as they become available.', time: 'Mar 31, 13:16 UTC' },
          { status: 'Investigating', message: 'We are currently investigating reports of elevated errors when submitting support cases. Some customers may experience timeouts when creating support tickets. We will share updates as they become available.', time: 'Mar 31, 13:10 UTC' }
        ]
      }
    ] 
  },
  { date: 'Mar 30, 2026', incidents: [] },
  { date: 'Mar 29, 2026', incidents: [] },
  { date: 'Mar 28, 2026', incidents: [] },
];

export default function Status() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <div className={`min-h-screen bg-black text-white font-sans selection:bg-primary/30 ${isAr ? 'font-arabic' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="flex justify-between items-center p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
            <span className="text-xl">🌕</span>
          </div>
          <span className="text-xl font-black tracking-tighter uppercase">Moonlight Status</span>
        </div>
        <button className="px-4 py-2 text-sm font-bold bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
          {isAr ? 'اشترك في التنبيهات' : 'Subscribe to Updates'}
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Banner */}
        <div className="bg-primary/20 border border-primary/30 rounded-2xl p-6 flex items-center gap-4 mb-12 shadow-2xl shadow-primary/10">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center border border-white/20 animate-pulse">
            <Check className="text-white" size={20} />
          </div>
          <span className="font-black text-xl">{isAr ? 'جميع الأنظمة تعمل بكفاءة' : 'All Systems Operational'}</span>
        </div>

        {/* Services */}
        <div className="space-y-8 mb-16">
          {services.map(service => (
            <div key={service.name} className="border-b border-white/10 pb-6 last:border-0">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  {service.isGroup && <ChevronRight size={16} className="text-gray-400" />}
                  <span className="font-medium text-lg">{service.name}</span>
                </div>
                <span className="text-primary text-sm font-black uppercase tracking-widest">{isAr ? 'يعمل' : service.status}</span>
              </div>
              
              {/* Bars */}
              <div className="flex gap-1 h-10 items-end mb-2 group relative">
                {service.history.map((day, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 rounded-sm transition-all hover:opacity-80 cursor-pointer ${day.status === 'operational' ? 'bg-primary h-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]' : 'bg-gold h-3/4'}`}
                    title={`${day.date}\n${day.status === 'operational' ? (isAr ? 'لم يتم تسجيل أي تعطل في هذا اليوم.' : 'No downtime recorded on this day.') : (isAr ? 'تم تسجيل حادثة في هذا اليوم.' : 'Incident recorded on this day.')}`}
                  />
                ))}
              </div>
              
              <div className="flex justify-between text-[10px] text-gray-600 font-black uppercase tracking-widest">
                <span>{isAr ? 'قبل 30 يوماً' : '30 days ago'}</span>
                <span>{isAr ? 'اليوم' : 'Today'}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Past Incidents */}
        <div>
          <h2 className="text-3xl font-black mb-10 tracking-tighter">{isAr ? 'الحوادث السابقة' : 'Past Incidents'}</h2>
          <div className="space-y-12">
            {incidents.map(day => (
              <div key={day.date} className="border-b border-white/10 pb-10 last:border-0 relative">
                <div className="absolute -left-6 top-1.5 w-2 h-2 rounded-full bg-white/10" />
                <h3 className="text-xl font-bold mb-6 text-gray-400">{day.date}</h3>
                {day.incidents.length === 0 ? (
                  <p className="text-gray-600 font-bold uppercase tracking-widest text-[10px]">{isAr ? 'لم يتم الإبلاغ عن أي حوادث.' : 'No incidents reported.'}</p>
                ) : (
                  <div className="space-y-10">
                    {day.incidents.map((incident, i) => (
                      <div key={i} className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
                        <h4 className="text-gold font-black text-lg mb-4">{incident.title}</h4>
                        <div className="space-y-6">
                          {incident.updates.map((update, j) => (
                            <div key={j} className="text-sm border-r-2 border-white/10 pr-4">
                              <p className="text-gray-300 mb-2">
                                <strong className="text-white uppercase text-xs tracking-widest">{update.status}</strong> - {update.message}
                              </p>
                              <p className="text-gray-500 text-[10px] font-bold">{update.time}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
