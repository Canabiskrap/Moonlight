import { User } from 'firebase/auth';
import { loginWithGoogle } from '../lib/firebase';
import { motion } from 'motion/react';
import { LogIn, ShieldCheck, Mail } from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface LoginProps {
  user: User | null;
}

export default function Login({ user }: LoginProps) {
  if (user) {
    return <Navigate to="/" />;
  }

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      alert(`فشل تسجيل الدخول: ${err.message || "خطأ غير معروف"}`);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-dark-light p-10 rounded-[2.5rem] border border-white/5 w-full max-w-md text-center space-y-8 shadow-2xl shadow-black/50"
      >
        <div className="bg-primary/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto border border-primary/20">
          <LogIn className="text-primary" size={40} />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black">تسجيل الدخول</h1>
          <p className="text-gray-500">سجل دخولك للوصول إلى لوحة التحكم أو متابعة مشترياتك</p>
        </div>

        <button 
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-4 bg-white text-dark py-4 rounded-2xl font-black text-lg hover:bg-gray-200 transition-all shadow-xl shadow-white/5"
        >
          <img src="https://www.google.com/favicon.ico" className="w-6 h-6" alt="Google" />
          الدخول بواسطة جوجل
        </button>

        <div className="pt-6 border-t border-white/5 flex items-center justify-center gap-2 text-gray-600 text-sm">
          <ShieldCheck size={16} />
          دخول آمن ومحمي
        </div>
      </motion.div>
    </div>
  );
}
