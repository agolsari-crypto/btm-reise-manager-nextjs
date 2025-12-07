import { NextRequest, NextResponse } from 'next/server';
import { capturePayPalOrder } from '@/lib/paypal';

const EXPECTED_PRICE = 11.50;
const PRICE_TOLERANCE = 0.01;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json(
        { error: 'Keine Order-ID angegeben' },
        { status: 400 }
      );
    }

    const result = await capturePayPalOrder(orderId);

    if (!result.success) {
      console.error(`[PayPal] Capture fehlgeschlagen: ${orderId} - ${result.error}`);
      return NextResponse.json(
        { error: result.error || 'Zahlung fehlgeschlagen' },
        { status: 400 }
      );
    }

    const paidAmount = parseFloat(result.amount || '0');
    if (Math.abs(paidAmount - EXPECTED_PRICE) > PRICE_TOLERANCE) {
      console.error(`[PayPal] WARNUNG: Falscher Betrag! Erwartet: ${EXPECTED_PRICE}€, Erhalten: ${paidAmount}€`);
    }

    console.log(`[PayPal] Zahlung erfolgreich: ${result.transactionId} - ${result.amount}€ von ${result.payerEmail}`);

    const verificationToken = Buffer.from(
      JSON.stringify({
        orderId,
        transactionId: result.transactionId,
        amount: result.amount,
        timestamp: Date.now(),
      })
    ).toString('base64');

    return NextResponse.json({
      success: true,
      verified: true,
      transactionId: result.transactionId,
      amount: result.amount,
      payerEmail: result.payerEmail,
      payerName: result.payerName,
      verificationToken,
    });

  } catch (error) {
    console.error('[PayPal] Capture Error:', error);
    return NextResponse.json(
      { error: 'Zahlungsverifizierung fehlgeschlagen' },
      { status: 500 }
    );
  }
}
