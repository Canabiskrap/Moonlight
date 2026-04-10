import { Link } from 'react-router-dom';
import { Instagram, Twitter, MessageCircle, Moon } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-dark-light border-t border-white/5 pt-16 pb-8 mt-20 relative z-10">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2 text-2xl font-black text-white">
              <div className="bg-gradient-to-br from-gold to-yellow-600 p-2 rounded-xl">
                <Moon size={24} className="text-dark" />
              </div>
              Monnlight
            </Link>
            <p className="text-gray-400 font-medium max-w-sm leading-relaxed">
              وكالة تصميم رقمي متخصصة في بناء الهويات البصرية، تصميم الشعارات، وتطوير المواقع والتطبيقات بأعلى معايير الجودة.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-white font-black text-lg">روابط سريعة</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-primary transition-colors font-medium">الرئيسية</Link>
              </li>
              <li>
                <a href="/#products" className="text-gray-400 hover:text-primary transition-colors font-medium">خدماتنا</a>
              </li>
              <li>
                <Link to="/login" className="text-gray-400 hover:text-primary transition-colors font-medium">تسجيل الدخول</Link>
              </li>
            </ul>
          </div>

          {/* Social & Contact */}
          <div className="space-y-4">
            <h4 className="text-white font-black text-lg">تواصل معنا</h4>
            <div className="flex gap-4">
              <a href="https://wa.me/96569929627" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#25D366] hover:text-white transition-all">
                <MessageCircle size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-pink-500 hover:to-purple-500 hover:text-white transition-all">
                <Instagram size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-blue-400 hover:text-white transition-all">
                <Twitter size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm font-medium">
            جميع الحقوق محفوظة © {new Date().getFullYear()} Monnlight
          </p>
          <div className="flex gap-4 text-sm text-gray-500 font-medium">
            <Link to="/privacy" className="hover:text-white transition-colors">سياسة الخصوصية</Link>
            <Link to="/terms" className="hover:text-white transition-colors">الشروط والأحكام</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
