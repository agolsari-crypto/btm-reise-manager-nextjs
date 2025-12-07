'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: Record<string, unknown>) => {
        render: (container: HTMLElement) => Promise<void>;
      };
    };
  }
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  price: number;
  onPaymentSuccess: (paymentData: PaymentResult) => void;
  patientName?: string;
  doctorName?: string;
}

interface PaymentResult {
  success: boolean;
  verified: boolean;
  transactionId: string;
  amount: string;
  payerEmail?: string;
  payerName?: string;
  verificationToken: string;
}

export default function PaymentModal({
  isOpen,
  onClose,
  price,
  onPaymentSuccess,
  patientName,
  doctorName,
}: PaymentModalProps) {
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [paypalError, setPaypalError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const paypalButtonsRendered = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      paypalButtonsRendered.current = false;
      setPaypalLoaded(false);
      setPaypalError(null);
      setPaymentSuccess(false);
      setIsProcessing(false);
      return;
    }

    if (window.paypal) {
      setPaypalLoaded(true);
      return;
    }

    const existingScript = document.getElementById('paypal-sdk-script');
    if (existingScript) existingScript.remove();

    const script = document.createElement('script');
    script.id = 'paypal-sdk-script';
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=EUR&locale=de_DE`;
    script.async = true;
    script.onload = () => setPaypalLoaded(true);
    script.onerror = () => setPaypalError('PayPal konnte nicht geladen werden.');
    document.body.appendChild(script);

    return () => { paypalButtonsRendered.current = false; };
  }, [isOpen]);

  useEffect(() => {
    if (!paypalLoaded || !isOpen || !paypalContainerRef.current || !window.paypal || paypalButtonsRendered.current) return;

    paypalContainerRef.current.innerHTML = '';

    try {
      window.paypal.Buttons({
        style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal', height: 45 },

        createOrder: async () => {
          const response = await fetch('/api/paypal/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: price, patientName, doctorName }),
          });
          const data = await response.json();
          if (!response.ok || !data.orderId) throw new Error(data.error || 'Order fehlgeschlagen');
          return data.orderId;
        },

        onApprove: async (data: { orderID: string }) => {
          setIsProcessing(true);
          setPaypalError(null);
          try {
            const response = await fetch('/api/paypal/capture-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: data.orderID }),
            });
            const result = await response.json();
            if (!response.ok || !result.verified) throw new Error(result.error || 'Verifizierung fehlgeschlagen');
            setPaymentSuccess(true);
            setTimeout(() => { onPaymentSuccess(result); onClose(); }, 1500);
          } catch (error) {
            setPaypalError(error instanceof Error ? error.message : 'Zahlung fehlgeschlagen');
            setIsProcessing(false);
          }
        },

        onCancel: () => setPaypalError('Zahlung abgebrochen.'),
        onError: () => setPaypalError('Ein Fehler ist aufgetreten.'),
      }).render(paypalContainerRef.current);

      paypalButtonsRendered.current = true;
    } catch { setPaypalError('PayPal konnte nicht initialisiert werden.'); }
  }, [paypalLoaded, isOpen, price, patientName, doctorName, onPaymentSuccess, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-[#003087] to-[#009cde] p-6 text-white flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold">Sichere Zahlung</h3>
            <p className="text-blue-100 text-sm mt-1">Serverseitig verifiziert</p>
          </div>
          <button onClick={onClose} disabled={isProcessing} className="text-white/70 hover:text-white p-2 disabled:opacity-50">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-8">
          <div className="flex justify-between items-center mb-6 pb-6 border-b border-slate-100">
            <div>
              <div className="text-xs text-slate-400 uppercase font-bold mb-1">Produkt</div>
              <div className="text-lg font-bold text-slate-800">BTM-Formular & Attest</div>
              {patientName && <div className="text-xs text-slate-500 mt-1">Patient: {patientName}</div>}
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 uppercase font-bold mb-1">Betrag</div>
              <div className="text-3xl font-extrabold text-[#003087]">{price.toFixed(2).replace('.', ',')} €</div>
            </div>
          </div>

          {paymentSuccess && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 flex items-center gap-3">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <div><div className="font-bold">Zahlung verifiziert!</div><div className="text-sm">PDF wird erstellt...</div></div>
            </div>
          )}

          {paypalError && !paymentSuccess && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
              <span className="flex-1 text-sm">{paypalError}</span>
              <button onClick={() => setPaypalError(null)} className="text-red-400 hover:text-red-600">✕</button>
            </div>
          )}

          {isProcessing && !paymentSuccess && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
              <span className="text-sm font-medium">Zahlung wird verifiziert...</span>
            </div>
          )}

          {!paymentSuccess && (
            <div className="min-h-[45px]">
              {!paypalLoaded && !paypalError && (
                <div className="flex items-center justify-center py-8 gap-3 text-slate-500">
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-[#003087] rounded-full animate-spin" />
                  <span className="text-sm">PayPal wird geladen...</span>
                </div>
              )}
              <div ref={paypalContainerRef} className={paypalLoaded ? '' : 'hidden'} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
