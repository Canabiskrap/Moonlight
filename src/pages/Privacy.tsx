import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

export default function Privacy() {
  const { t, i18n } = useTranslation();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto py-20 space-y-8"
    >
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-white">{t('legal.privacyTitle')}</h1>
        <p className="text-gray-400 font-medium">{t('legal.lastUpdate')}: {new Date().toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}</p>
      </div>

      <div className="bg-dark-light/50 border border-white/5 rounded-[2rem] p-8 md:p-12 space-y-8 backdrop-blur-sm">
        <section className="space-y-4">
          <h2 className="text-2xl font-black text-gold">1. {t('legal.p1Title')}</h2>
          <p className="text-gray-300 leading-relaxed">
            {t('legal.p1Content')}
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-gold">2. {t('legal.p2Title')}</h2>
          <p className="text-gray-300 leading-relaxed">
            {t('legal.p2Content')}
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 marker:text-primary">
            <li>{t('legal.p2Item1')}</li>
            <li>{t('legal.p2Item2')}</li>
            <li>{t('legal.p2Item3')}</li>
            <li>{t('legal.p2Item4')}</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-gold">3. {t('legal.p3Title')}</h2>
          <p className="text-gray-300 leading-relaxed">
            {t('legal.p3Content')}
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-gold">4. {t('legal.p4Title')}</h2>
          <p className="text-gray-300 leading-relaxed">
            {t('legal.p4Content')}
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-gold">5. {t('legal.p5Title')}</h2>
          <p className="text-gray-300 leading-relaxed">
            {t('legal.p5Content')}
          </p>
        </section>
      </div>
    </motion.div>
  );
}
