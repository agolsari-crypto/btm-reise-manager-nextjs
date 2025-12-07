'use client';

import { useState } from 'react';
import PaymentModal from '@/components/PaymentModal';

export default function Home() {
  const [showPayment, setShowPayment] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  const handlePaymentSuccess = (result: {
    transactionId: string;
    amount: string;
    payerEmail?: string;
    verificationToken: string;
  }) => {
    console.log('Zahlung verifiziert:', result);
    setTransactionId(result.transactionId);
    setPaymentComplete(true);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-800">BTM Reise-Manager</h1>
          <p className="text-slate-500 mt-2">PayPal Integration Test</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Status</h2>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span className="text-sm text-emerald-700">Server-API aktiv</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span className="text-sm text-emerald-700">Serverseitige Verifizierung aktiv</span>
            </div>
          </div>

          {paymentComplete && (
            <div className="mt-6 p-4 bg-emerald-50 border border-emerald-300 rounded-xl">
              <div className="font-bold text-emerald-800">✓ Zahlung erfolgreich!</div>
              <div className="text-sm text-emerald-600 mt-1">Transaktions-ID: {transactionId}</div>
            </div>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={() => setShowPayment(true)}
            className="px-8 py-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all"
          >
            PayPal-Zahlung testen (11,50 €)
          </button>
          <p className="text-xs text-slate-400 mt-4">Sandbox-Modus - keine echten Zahlungen</p>
        </div>

        <PaymentModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          price={11.50}
          onPaymentSuccess={handlePaymentSuccess}
          patientName="Test Patient"
          doctorName="Dr. med. Amir Golsari"
        />
      </div>
    </main>
  );
}
