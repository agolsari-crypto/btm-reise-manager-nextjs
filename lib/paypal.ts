const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

interface PayPalAccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface PayPalOrder {
  id: string;
  status: string;
  purchase_units: Array<{
    amount: {
      currency_code: string;
      value: string;
    };
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount: {
          currency_code: string;
          value: string;
        };
      }>;
    };
  }>;
  payer?: {
    email_address?: string;
    name?: {
      given_name?: string;
      surname?: string;
    };
  };
}

export async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal Credentials nicht konfiguriert');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('PayPal Auth Error:', error);
    throw new Error('PayPal Authentifizierung fehlgeschlagen');
  }

  const data: PayPalAccessToken = await response.json();
  return data.access_token;
}

export async function createPayPalOrder(
  amount: number,
  description: string
): Promise<{ id: string }> {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'EUR',
            value: amount.toFixed(2),
          },
          description: description.substring(0, 127),
        },
      ],
      application_context: {
        brand_name: 'NEVPAZ GmbH',
        locale: 'de-DE',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('PayPal Create Order Error:', error);
    throw new Error('Order konnte nicht erstellt werden');
  }

  const order = await response.json();
  return { id: order.id };
}

export async function capturePayPalOrder(orderId: string): Promise<{
  success: boolean;
  transactionId?: string;
  amount?: string;
  payerEmail?: string;
  payerName?: string;
  error?: string;
}> {
  const accessToken = await getPayPalAccessToken();

  const captureResponse = await fetch(
    `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!captureResponse.ok) {
    const error = await captureResponse.text();
    console.error('PayPal Capture Error:', error);
    return { success: false, error: 'Zahlung konnte nicht abgeschlossen werden' };
  }

  const order: PayPalOrder = await captureResponse.json();

  if (order.status !== 'COMPLETED') {
    return { success: false, error: `Unerwarteter Status: ${order.status}` };
  }

  const capture = order.purchase_units?.[0]?.payments?.captures?.[0];
  
  if (!capture || capture.status !== 'COMPLETED') {
    return { success: false, error: 'Zahlung nicht erfolgreich abgeschlossen' };
  }

  return {
    success: true,
    transactionId: capture.id,
    amount: capture.amount.value,
    payerEmail: order.payer?.email_address,
    payerName: order.payer?.name 
      ? `${order.payer.name.given_name} ${order.payer.name.surname}`.trim()
      : undefined,
  };
}
