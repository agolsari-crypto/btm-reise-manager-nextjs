import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID fehlt' },
        { status: 400 }
      );
    }

    // Session von Stripe abrufen
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'line_items'],
    });

    // Prüfen ob Zahlung erfolgreich war
    if (session.payment_status !== 'paid') {
      return NextResponse.json({
        verified: false,
        error: 'Zahlung nicht abgeschlossen',
        status: session.payment_status,
      });
    }

    // Zahlungsmethode ermitteln
    let paymentMethod = 'unknown';
    if (session.payment_intent && typeof session.payment_intent !== 'string') {
      const paymentIntent = session.payment_intent as Stripe.PaymentIntent;
      if (paymentIntent.payment_method) {
        const pm = await stripe.paymentMethods.retrieve(
          typeof paymentIntent.payment_method === 'string' 
            ? paymentIntent.payment_method 
            : paymentIntent.payment_method.id
        );
        paymentMethod = pm.type; // 'card', 'paypal', etc.
      }
    }

    // Verifikationstoken generieren
    const verificationToken = Buffer.from(
      `${session.id}:${session.amount_total}:${Date.now()}`
    ).toString('base64');

    return NextResponse.json({
      verified: true,
      success: true,
      transactionId: session.payment_intent 
        ? (typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent.id)
        : session.id,
      amount: ((session.amount_total || 0) / 100).toFixed(2),
      currency: session.currency?.toUpperCase(),
      paymentMethod: paymentMethod,
      customerEmail: session.customer_details?.email,
      customerName: session.customer_details?.name,
      verificationToken: verificationToken,
      metadata: session.metadata,
    });
  } catch (error) {
    console.error('Stripe Verification Error:', error);
    return NextResponse.json(
      { 
        verified: false,
        error: error instanceof Error ? error.message : 'Verifizierung fehlgeschlagen' 
      },
      { status: 500 }
    );
  }
}
