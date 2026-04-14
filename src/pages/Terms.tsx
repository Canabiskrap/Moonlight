import { motion } from 'motion/react';

export default function Terms() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto py-20 space-y-8"
    >
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-white">الشروط والأحكام</h1>
        <p className="text-gray-400 font-medium">آخر تحديث: {new Date().toLocaleDateString('ar-EG')}</p>
      </div>

      <div className="bg-dark-light/50 border border-white/5 rounded-[2rem] p-8 md:p-12 space-y-8 backdrop-blur-sm">
        <section className="space-y-4">
          <h2 className="text-2xl font-black text-gold">1. قبول الشروط</h2>
          <p className="text-gray-300 leading-relaxed">
            باستخدامك لموقع Moonlight 🌕 وشرائك لمنتجاتنا الرقمية، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء من هذه الشروط، يرجى عدم استخدام خدماتنا.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-gold">2. المنتجات الرقمية</h2>
          <p className="text-gray-300 leading-relaxed">
            جميع المنتجات المعروضة في المتجر هي منتجات رقمية (Digital Products) قابلة للتنزيل. لا يتم شحن أي منتجات مادية. بمجرد إتمام عملية الدفع بنجاح، ستحصل على رابط لتحميل الملفات مباشرة.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-gold">3. سياسة الاسترداد (Refund Policy)</h2>
          <p className="text-gray-300 leading-relaxed">
            نظراً لطبيعة المنتجات الرقمية التي لا يمكن إرجاعها بعد تحميلها، فإننا <strong className="text-white">لا نقدم عمليات استرداد للأموال (No Refunds)</strong> بعد إتمام عملية الشراء وتحميل المنتج. يرجى قراءة وصف المنتج بعناية والتأكد من أنه يلبي احتياجاتك قبل الشراء.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-gold">4. حقوق الملكية والاستخدام</h2>
          <p className="text-gray-300 leading-relaxed">
            عند شرائك لأي قالب أو منتج رقمي من Moonlight، فإنك تحصل على ترخيص غير حصري لاستخدامه في مشاريعك الشخصية أو التجارية. <strong className="text-red-400">يُمنع منعاً باتاً</strong> إعادة بيع، توزيع، أو مشاركة الملفات الأصلية مع أطراف أخرى بأي شكل من الأشكال.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-gold">5. التعديلات على الشروط</h2>
          <p className="text-gray-300 leading-relaxed">
            نحتفظ بالحق في تعديل أو تغيير هذه الشروط والأحكام في أي وقت دون إشعار مسبق. استمرارك في استخدام الموقع بعد أي تغييرات يُعد قبولاً منك للشروط الجديدة.
          </p>
        </section>
      </div>
    </motion.div>
  );
}
