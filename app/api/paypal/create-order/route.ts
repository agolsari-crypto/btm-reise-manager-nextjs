import { NextRequest, NextResponse } from 'next/server';
import { createPayPalOrder } from '@/lib/paypal';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, description, patientName, doctorName } = body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Ungültiger Betrag' },
        { status: 400 }
      );
    }

    const orderDescription = description || 
      `BTM-Formular & Attest - ${patientName || 'Patient'} - ${doctorName || 'NEVPAZ'}`;

    const order = await createPayPalOrder(amount, orderDescription);

    console.log(`[PayPal] Order erstellt: ${order.id} - ${amount}€`);

    return NextResponse.json({ 
      orderId: order.id,
      success: true 
    });

  } catch (error) {
    console.error('[PayPal] Create Order Error:', error);
    return NextResponse.json(
      { error: 'Order konnte nicht erstellt werden' },
      { status: 500 }
    );
  }
}
