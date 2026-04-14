/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import ServiceDetails from './pages/ServiceDetails';
import OrderPortal from './pages/OrderPortal';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import MyOrders from './pages/MyOrders';
import RecoverOrder from './pages/RecoverOrder';
import BuyerProtection from './pages/BuyerProtection';
import FloatingActions from './components/FloatingActions';
import { ErrorBoundary } from './components/ErrorBoundary';
import { motion, AnimatePresence } from 'motion/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { useTranslation } from 'react-i18next';

import Status from './pages/Status';

const ADMIN_EMAILS = [
  'canabiskrap07@gmail.com',
  'Esraa0badr@gmail.com',
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth state changed:", currentUser?.email || "No user");
      setUser(currentUser);
      if (currentUser) {
        let isUserAdmin = false;

        // 1. Check by email first (safest, doesn't require Firestore permissions)
        if (currentUser.email && ADMIN_EMAILS.map(e => e.toLowerCase()).includes(currentUser.email.toLowerCase())) {
          isUserAdmin = true;
        } 
        // 2. Fallback to Firestore check if not in the hardcoded list
        else {
          try {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists() && userDoc.data().role === 'admin') {
              isUserAdmin = true;
            }
          } catch (error) {
            console.error("Firestore permission error or user doc doesn't exist:", error);
          }
        }
        
        setIsAdmin(isUserAdmin);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className={`min-h-screen bg-dark text-white font-sans flex flex-col ${i18n.language === 'ar' ? 'font-arabic' : 'font-sans'}`}>
          <Navbar user={user} isAdmin={isAdmin} />
          <main className="pt-32 pb-10 px-6 max-w-7xl mx-auto flex-1 w-full relative z-10">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/product/:id" element={<ProductDetails />} />
                <Route path="/service/:id" element={<ServiceDetails />} />
                <Route path="/order-portal/:id" element={<OrderPortal />} />
                <Route path="/login" element={<Login user={user} />} />
                <Route path="/my-orders" element={<MyOrders />} />
                <Route path="/recover-order" element={<RecoverOrder />} />
                <Route path="/buyer-protection" element={<BuyerProtection />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/status" element={<Status />} />
                <Route 
                  path="/dashboard" 
                  element={isAdmin ? <Dashboard /> : <Navigate to="/login" />} 
                />
              </Routes>
            </AnimatePresence>
          </main>
          <Footer />
          <FloatingActions />
          {/* Vercel Speed Insights */}
          <SpeedInsights />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

