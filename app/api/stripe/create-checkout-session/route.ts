import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

// SICHERHEIT: Preise serverseitig definiert - können nicht vom Client manipuliert werden
const FIXED_PRICES = {
  'btm-bundle': 11.50,  // BTM-Formular + Attest (korrigiert von 29.00)
} as const;

// Rate Limiting: Einfacher In-Memory Store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // Max Requests
const RATE_WINDOW = 60 * 1000; // 1 Minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return false;
  }

  if (record.count >= RATE_LIMIT) {
    return true;
  }

  record.count++;
  return false;
}

// Input Sanitization
function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .slice(0, 200) // Max 200 Zeichen
    .replace(/<[^>]*>/g, '') // HTML Tags entfernen
    .replace(/[<>\"'`;(){}]/g, ''); // Gefährliche Zeichen entfernen
}

function sanitizeEmail(input: unknown): string | undefined {
  if (typeof input !== 'string') return undefined;
  const email = input.trim().toLowerCase().slice(0, 100);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) ? email : undefined;
}

export async function POST(request: NextRequest) {
  try {
    // Rate Limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown';

    if (isRateLimited(ip)) {
      console.warn(`Rate limit exceeded for IP: ${ip}`);
      return NextResponse.json(
        { error: 'Zu viele Anfragen. Bitte warten Sie einen Moment.' },
        { status: 429 }
      );
    }

    const body = await request.json();

    // SICHERHEIT: Preis wird NICHT vom Client akzeptiert!
    // Der Preis ist serverseitig fixiert
    const fixedAmount = FIXED_PRICES['btm-bundle'];

    // Input Sanitization
    const patientName = sanitizeString(body.patientName);
    const doctorName = sanitizeString(body.doctorName);
    const patientEmail = sanitizeEmail(body.patientEmail);

    // Checkout Session erstellen mit FIXEM Preis
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'paypal'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'BTM-Formular & Attest',
            description: `Patient: ${patientName || 'Nicht angegeben'} | Arzt: ${doctorName || 'NEVPAZ'}`,
          },
          unit_amount: Math.round(fixedAmount * 100), // FIXER PREIS vom Server: 1150 Cent = 11,50€
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://reise.nevpaz.de'}/btm-app.html?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://reise.nevpaz.de'}/btm-app.html?payment=cancelled`,
      customer_email: patientEmail,
      metadata: {
        patientName: patientName || '',
        doctorName: doctorName || '',
        type: 'btm-formular',
        fixedPrice: String(fixedAmount) // Preis in Metadata für Audit
      },
      locale: 'de',
    });

    console.log(`Stripe Session created: ${session.id} | Amount: €${fixedAmount} | IP: ${ip}`);
    return NextResponse.json({ sessionId: session.id, url: session.url });

  } catch (error: unknown) {
    console.error('Stripe Session Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    return NextResponse.json(
      { error: 'Checkout-Session konnte nicht erstellt werden', details: errorMessage },
      { status: 500 }
    );
  }
}
