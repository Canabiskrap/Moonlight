import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

export default function Terms() {
  const { t, i18n } = useTranslation();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto py-20 space-y-8"
    >
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-white">{t('legal.termsTitle')}</h1>
        <p className="text-gray-400 font-medium">{t('legal.lastUpdate')}: {new Date().toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}</p>
      </div>

      <div className="bg-dark-light/50 border border-white/5 rounded-[2rem] p-8 md:p-12 space-y-8 backdrop-blur-sm">
        <section className="space-y-4">
          <h2 className="text-2xl font-black text-gold">1. {t('legal.t1Title')}</h2>
          <p className="text-gray-300 leading-relaxed">
            {t('legal.t1Content')}
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-gold">2. {t('legal.t2Title')}</h2>
          <p className="text-gray-300 leading-relaxed">
            {t('legal.t2Content')}
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-gold">3. {t('legal.t3Title')}</h2>
          <p className="text-gray-300 leading-relaxed">
            {t('legal.t3Content')}
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-gold">4. {t('legal.t4Title')}</h2>
          <p className="text-gray-300 leading-relaxed">
            {t('legal.t4Content')}
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-gold">5. {t('legal.t5Title')}</h2>
          <p className="text-gray-300 leading-relaxed">
            {t('legal.t5Content')}
          </p>
        </section>
      </div>
    </motion.div>
  );
}
