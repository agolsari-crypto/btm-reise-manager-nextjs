import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, patientName, doctorName, patientEmail } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Ungültiger Betrag' }, { status: 400 });
    }

    // Checkout Session mit expliziten Zahlungsmethoden
    // PayPal Domain ID: pmd_1ScAkBGhzHUByt1x2OcVCYSw
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'paypal'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'BTM-Formular & Attest',
            description: `Patient: ${patientName || 'Nicht angegeben'} | Arzt: ${doctorName || 'NEVPAZ'}`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://reise.nevpaz.de'}/btm-app.html?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://reise.nevpaz.de'}/btm-app.html?payment=cancelled`,
      customer_email: patientEmail || undefined,
      metadata: { patientName: patientName || '', doctorName: doctorName || '', type: 'btm-formular' },
      locale: 'de',
    });

    console.log('Stripe Session created:', session.id, 'Payment methods:', session.payment_method_types);
    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: unknown) {
    console.error('Stripe Session Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    return NextResponse.json({ error: 'Checkout-Session konnte nicht erstellt werden', details: errorMessage }, { status: 500 });
  }
}
