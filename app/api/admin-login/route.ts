import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Das Passwort wird aus der Environment Variable gelesen
// In Vercel: Settings → Environment Variables → ADMIN_PASSWORD
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'nevpaz2024!';

// Einfacher Token für Session (in Produktion besser JWT verwenden)
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Token-Store (in Produktion: Redis oder Datenbank)
const validTokens = new Map<string, { expires: number }>();

// Cleanup alte Tokens alle 10 Minuten
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of validTokens.entries()) {
    if (data.expires < now) {
      validTokens.delete(token);
    }
  }
}, 10 * 60 * 1000);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, password, token } = body;

    // Login-Versuch
    if (action === 'login') {
      if (!password) {
        return NextResponse.json({ success: false, error: 'Passwort erforderlich' }, { status: 400 });
      }

      // Timing-safe Vergleich gegen Timing-Attacken
      const passwordBuffer = Buffer.from(password);
      const correctBuffer = Buffer.from(ADMIN_PASSWORD);
      
      const isValid = passwordBuffer.length === correctBuffer.length && 
                      crypto.timingSafeEqual(passwordBuffer, correctBuffer);

      if (isValid) {
        const newToken = generateToken();
        // Token ist 8 Stunden gültig
        validTokens.set(newToken, { expires: Date.now() + 8 * 60 * 60 * 1000 });
        
        return NextResponse.json({ 
          success: true, 
          token: newToken,
          message: 'Login erfolgreich' 
        });
      } else {
        // Verzögerung gegen Brute-Force
        await new Promise(resolve => setTimeout(resolve, 1000));
        return NextResponse.json({ success: false, error: 'Falsches Passwort' }, { status: 401 });
      }
    }

    // Token-Verifizierung
    if (action === 'verify') {
      if (!token) {
        return NextResponse.json({ success: false, valid: false }, { status: 400 });
      }

      const tokenData = validTokens.get(token);
      const isValid = tokenData && tokenData.expires > Date.now();

      return NextResponse.json({ success: true, valid: isValid });
    }

    // Logout
    if (action === 'logout') {
      if (token) {
        validTokens.delete(token);
      }
      return NextResponse.json({ success: true, message: 'Logout erfolgreich' });
    }

    return NextResponse.json({ success: false, error: 'Ungültige Aktion' }, { status: 400 });

  } catch (error) {
    console.error('Admin Login Error:', error);
    return NextResponse.json({ success: false, error: 'Server-Fehler' }, { status: 500 });
  }
}
