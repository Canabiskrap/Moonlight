import { motion } from 'motion/react';

export default function Privacy() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto py-20 space-y-8"
    >
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-white">سياسة الخصوصية</h1>
        <p className="text-gray-400 font-medium">آخر تحديث: {new Date().toLocaleDateString('ar-EG')}</p>
      </div>

      <div className="bg-dark-light/50 border border-white/5 rounded-[2rem] p-8 md:p-12 space-y-8 backdrop-blur-sm">
        <section className="space-y-4">
          <h2 className="text-2xl font-black text-primary">1. جمع المعلومات</h2>
          <p className="text-gray-300 leading-relaxed">
            نحن في Monnlight نقوم بجمع المعلومات التي تقدمها لنا مباشرة عند استخدامك لخدماتنا، مثل الاسم، البريد الإلكتروني، ومعلومات الدفع عند إتمام عملية الشراء. نستخدم هذه المعلومات فقط لتقديم الخدمات المطلوبة وتحسين تجربة المستخدم.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-primary">2. استخدام المعلومات</h2>
          <p className="text-gray-300 leading-relaxed">
            نستخدم المعلومات التي نجمعها من أجل:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 marker:text-primary">
            <li>معالجة طلباتك وتوفير المنتجات الرقمية.</li>
            <li>التواصل معك بخصوص طلباتك أو استفساراتك.</li>
            <li>تحسين موقعنا وخدماتنا.</li>
            <li>إرسال تحديثات أو عروض ترويجية (إذا وافقت على ذلك).</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-primary">3. حماية البيانات</h2>
          <p className="text-gray-300 leading-relaxed">
            نحن نتخذ إجراءات أمنية مناسبة لحماية معلوماتك الشخصية من الوصول غير المصرح به أو التعديل أو الإفصاح أو الإتلاف. نستخدم بوابات دفع آمنة (مثل PayPal) ولا نقوم بتخزين معلومات بطاقتك الائتمانية على خوادمنا.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-primary">4. مشاركة المعلومات</h2>
          <p className="text-gray-300 leading-relaxed">
            لا نقوم ببيع أو تأجير معلوماتك الشخصية لأطراف ثالثة. قد نشارك معلوماتك فقط مع مزودي الخدمات الذين يساعدوننا في تشغيل موقعنا (مثل بوابات الدفع) والذين يلتزمون بالحفاظ على سرية هذه المعلومات.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-primary">5. حقوقك</h2>
          <p className="text-gray-300 leading-relaxed">
            يحق لك طلب الوصول إلى معلوماتك الشخصية التي نحتفظ بها، أو طلب تصحيحها أو حذفها. يمكنك التواصل معنا في أي وقت لممارسة هذه الحقوق.
          </p>
        </section>
      </div>
    </motion.div>
  );
}
