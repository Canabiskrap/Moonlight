import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

interface PayPalButtonProps {
  item: any;
  type: 'product' | 'service';
  currency: string;
  price: number;
  onSuccess: (orderId: string) => void;
}

export default function PayPalButton({ item, type, currency, price, onSuccess }: PayPalButtonProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const containerId = `paypal-button-container-${item.id}`;
    const container = document.getElementById(containerId);
    if (!container) return;
    if (container.innerHTML !== '') return;

    const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'AcbwuN16XVq7P_HKhjbHRTegmSRXI0DoFOoLw2pn-LilZUuf1FRl0v888wjPvs428lM5sdf97LUNcvT5';
    
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}`;
    script.async = true;
    script.onload = () => {
      if ((window as any).paypal) {
        (window as any).paypal.Buttons({
          createOrder: (data: any, actions: any) => {
            return actions.order.create({
              purchase_units: [{
                amount: {
                  value: price.toFixed(2),
                  currency_code: currency
                },
                description: `${type === 'product' ? 'Product' : 'Service'}: ${item.name || item.title}`
              }]
            });
          },
          onApprove: async (data: any, actions: any) => {
            setLoading(true);
            try {
              const order = await actions.order.capture();
              
              // Record order in Firestore
              const orderData: any = {
                productId: type === 'product' ? item.id : null,
                serviceId: type === 'service' ? item.id : null,
                productName: type === 'product' ? item.name : null,
                serviceTitle: type === 'service' ? item.title : null,
                amount: price,
                currency: currency,
                customerEmail: order.payer.email_address,
                customerName: order.payer.name?.given_name || '',
                paypalOrderId: order.id,
                status: type === 'product' ? 'completed' : 'pending',
                encryptedUrl: item.downloadUrl || '', // Store the encrypted URL
                type: type,
                userId: auth.currentUser?.uid || null,
                createdAt: Timestamp.now()
              };

              const orderRef = await addDoc(collection(db, 'orders'), orderData);
              onSuccess(orderRef.id);
            } catch (err) {
              console.error("PayPal Capture Error:", err);
              alert(t('common.processingError'));
            } finally {
              setLoading(false);
            }
          },
          onError: (err: any) => {
            console.error("PayPal Error:", err);
            alert(t('common.paymentError') || "Payment failed. Please try again.");
          }
        }).render(`#${containerId}`);
      }
    };
    document.body.appendChild(script);

    return () => {
      const existingScript = document.querySelector(`script[src*="paypal.com/sdk/js?client-id=${clientId}"]`);
      if (existingScript) document.body.removeChild(existingScript);
    };
  }, [item, currency, price]);

  return (
    <div className="space-y-4">
      <div id={`paypal-button-container-${item.id}`} className="min-h-[150px] relative z-10" />
      {loading && (
        <div className="flex items-center justify-center gap-2 text-primary font-bold">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          جاري معالجة الطلب...
        </div>
      )}
    </div>
  );
}
