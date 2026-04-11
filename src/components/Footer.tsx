import { ShoppingBag, Instagram, Twitter, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-dark-light/30 border-t border-white/5 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <Link to="/" className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-xl">
                <ShoppingBag className="text-white" size={24} />
              </div>
              <span className="text-2xl font-black tracking-tighter text-white">Moonlight</span>
            </Link>
            <p className="text-gray-400 max-w-sm leading-relaxed font-medium">
              نصمم مستقبلك الرقمي باحترافية. متجر Moonlight يقدم أفضل الخدمات الرقمية والتصاميم العصرية لمشاريعك.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all">
                <Instagram size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all">
                <Twitter size={20} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-black mb-6 uppercase tracking-widest text-xs">روابط سريعة</h4>
            <ul className="space-y-4 text-gray-400 font-bold text-sm">
              <li><Link to="/" className="hover:text-primary transition-colors">المتجر</Link></li>
              <li><a href="#products" className="hover:text-primary transition-colors">المنتجات</a></li>
              <li><Link to="/login" className="hover:text-primary transition-colors">تسجيل الدخول</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-black mb-6 uppercase tracking-widest text-xs">تواصل معنا</h4>
            <ul className="space-y-4 text-gray-400 font-bold text-sm">
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-primary" />
                <span>support@moonlight.com</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-primary" />
                <span>+965 69929627</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 text-center">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
            © {new Date().getFullYear()} Moonlight Store. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
}
