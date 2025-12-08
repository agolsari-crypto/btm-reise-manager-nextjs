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
      return NextResponse.json({ error: 'Session ID fehlt' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'customer'],
    });

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ verified: false, error: 'Zahlung nicht abgeschlossen', status: session.payment_status });
    }

    return NextResponse.json({
      verified: true,
      success: true,
      transactionId: session.payment_intent?.toString() || session.id,
      amount: ((session.amount_total || 0) / 100).toFixed(2),
      currency: session.currency?.toUpperCase(),
      customerEmail: session.customer_email || session.customer_details?.email,
      customerName: session.customer_details?.name,
      metadata: session.metadata,
      verificationToken: Buffer.from(`${session.id}:${session.payment_status}:${Date.now()}`).toString('base64'),
    });
  } catch (error) {
    console.error('Stripe Verify Error:', error);
    return NextResponse.json({ error: 'Verifizierung fehlgeschlagen', verified: false }, { status: 500 });
  }
}
