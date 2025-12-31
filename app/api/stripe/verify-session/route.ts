import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

// Rate Limiting
const verifyRateLimitStore = new Map<string, { count: number; resetTime: number }>();
const VERIFY_RATE_LIMIT = 10; // Max 10 Verifizierungen
const VERIFY_RATE_WINDOW = 60 * 1000; // 1 Minute

function isVerifyRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = verifyRateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    verifyRateLimitStore.set(ip, { count: 1, resetTime: now + VERIFY_RATE_WINDOW });
    return false;
  }

  if (record.count >= VERIFY_RATE_LIMIT) {
    return true;
  }

  record.count++;
  return false;
}

// Session ID Validierung (Stripe Session IDs haben ein bestimmtes Format)
function isValidSessionId(input: unknown): boolean {
  if (typeof input !== 'string') return false;
  // Stripe Session IDs: cs_test_... oder cs_live_...
  return /^cs_(test|live)_[a-zA-Z0-9]{20,}$/.test(input);
}

export async function POST(request: NextRequest) {
  try {
    // Rate Limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown';

    if (isVerifyRateLimited(ip)) {
      console.warn(`Verify rate limit exceeded for IP: ${ip}`);
      return NextResponse.json(
        { error: 'Zu viele Anfragen. Bitte warten Sie einen Moment.', verified: false },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { sessionId } = body;

    // Validierung
    if (!sessionId || !isValidSessionId(sessionId)) {
      console.warn(`Invalid session ID from IP: ${ip}`);
      return NextResponse.json(
        { error: 'Ungültige Session ID', verified: false },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'customer'],
    });

    if (session.payment_status !== 'paid') {
      console.log(`Payment not completed: ${sessionId} | Status: ${session.payment_status}`);
      return NextResponse.json({
        verified: false,
        error: 'Zahlung nicht abgeschlossen',
        status: session.payment_status
      });
    }

    console.log(`Payment verified: ${sessionId} | Amount: €${((session.amount_total || 0) / 100).toFixed(2)} | IP: ${ip}`);

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
    return NextResponse.json(
      { error: 'Verifizierung fehlgeschlagen', verified: false },
      { status: 500 }
    );
  }
}
