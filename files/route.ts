import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientName, doctorName, formData } = body;

    // Preis in Cent (11.50 EUR = 1150 Cent)
    const priceInCents = 1150;

    // Checkout Session erstellen
    // Stripe zeigt automatisch alle aktivierten Zahlungsmethoden (Karte, PayPal, etc.)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'BTM-Reisebescheinigung & Ärztliches Attest',
              description: `Patient: ${patientName || 'N/A'} • Arzt: ${doctorName || 'NEVPAZ'}`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      // Keine payment_method_types angeben = Stripe zeigt ALLE aktivierten Methoden
      // Das inkludiert automatisch: card, paypal, apple_pay, google_pay, etc.
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://reise.nevpaz.de'}/btm-app.html?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://reise.nevpaz.de'}/btm-app.html?payment=cancelled`,
      locale: 'de',
      // Metadaten für spätere Verifikation
      metadata: {
        patientName: patientName || '',
        doctorName: doctorName || '',
        formDataHash: formData ? Buffer.from(JSON.stringify(formData)).toString('base64').slice(0, 500) : '',
      },
      // Kundeninformationen sammeln
      billing_address_collection: 'auto',
      // PayPal-spezifische Einstellungen
      payment_method_options: {
        paypal: {
          preferred_locale: 'de-DE',
        },
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Checkout konnte nicht erstellt werden' },
      { status: 500 }
    );
  }
}
