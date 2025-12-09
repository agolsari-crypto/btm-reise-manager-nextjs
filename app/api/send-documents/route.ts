import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      patientEmail, 
      patientName, 
      doctorName,
      btmPdfBase64,
      attestPdfBase64,
      travelStartDate,
      travelEndDate,
      destination
    } = body;

    if (!patientEmail || !btmPdfBase64 || !attestPdfBase64) {
      return NextResponse.json(
        { error: 'Fehlende Daten: Email und PDFs sind erforderlich' }, 
        { status: 400 }
      );
    }

    // Email-Validierung
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(patientEmail)) {
      return NextResponse.json(
        { error: 'Ungültige Email-Adresse' }, 
        { status: 400 }
      );
    }

    // Datum formatieren
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const reiseZeitraum = travelStartDate && travelEndDate 
      ? `${formatDate(travelStartDate)} – ${formatDate(travelEndDate)}`
      : 'Siehe Dokumente';

    // Dateinamen generieren
    const safeName = (patientName || 'Patient').replace(/[^a-zA-Z0-9äöüÄÖÜß\s]/g, '').replace(/\s+/g, '_');
    const dateStamp = new Date().toISOString().split('T')[0];

    const { data, error } = await resend.emails.send({
      from: 'NEVPAZ Privatpraxis <noreply@nevpaz.de>',
      to: [patientEmail],
      subject: `Ihre BTM-Reisebescheinigung – NEVPAZ Privatpraxis`,
      html: `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f1f5f9;">
  <div style="max-width: 640px; margin: 0 auto; padding: 24px 16px;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%); padding: 40px 32px; text-align: center; border-radius: 20px 20px 0 0;">
      <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -1px;">NEVPAZ</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 10px 0 0; font-size: 15px; font-weight: 500;">Privatpraxis für Neurologie & Psychiatrie</p>
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.2);">
        <p style="color: rgba(255,255,255,0.95); margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">BTM-Reisebescheinigung</p>
      </div>
    </div>
    
    <!-- Content -->
    <div style="background: white; padding: 40px 32px; border-radius: 0 0 20px 20px; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.1);">
      
      <!-- Greeting -->
      <p style="color: #1e293b; font-size: 17px; line-height: 1.7; margin: 0 0 24px;">
        Sehr geehrte/r <strong>${patientName || 'Patient/in'}</strong>,
      </p>
      
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 28px;">
        vielen Dank für Ihr Vertrauen in unsere Praxis. Anbei erhalten Sie Ihre offiziellen Dokumente für das legale Mitführen Ihrer verschriebenen Betäubungsmittel auf Reisen.
      </p>
      
      <!-- Info Box -->
      <div style="background: linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%); border: 1px solid #99f6e4; border-radius: 16px; padding: 24px; margin: 0 0 28px;">
        <p style="color: #0f766e; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px;">Ihre Reisedaten</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; color: #64748b; font-size: 14px; width: 140px; vertical-align: top;">Ausstellender Arzt:</td>
            <td style="padding: 10px 0; color: #0f766e; font-size: 15px; font-weight: 600;">${doctorName || 'NEVPAZ Privatpraxis'}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #64748b; font-size: 14px; vertical-align: top;">Reisezeitraum:</td>
            <td style="padding: 10px 0; color: #1e293b; font-size: 15px; font-weight: 600;">${reiseZeitraum}</td>
          </tr>
          ${destination ? `
          <tr>
            <td style="padding: 10px 0; color: #64748b; font-size: 14px; vertical-align: top;">Reiseziel:</td>
            <td style="padding: 10px 0; color: #1e293b; font-size: 15px; font-weight: 600;">${destination}</td>
          </tr>
          ` : ''}
        </table>
      </div>
      
      <!-- Documents Section -->
      <div style="margin: 0 0 28px;">
        <p style="color: #1e293b; font-size: 15px; font-weight: 700; margin: 0 0 16px;">
          📎 Angehängte Dokumente:
        </p>
        
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 12px;">
          <p style="color: #1e293b; font-size: 14px; font-weight: 600; margin: 0 0 6px;">1. BTM-Formular (Schengen-Bescheinigung)</p>
          <p style="color: #64748b; font-size: 13px; margin: 0; line-height: 1.5;">Amtliches Mitführungsformular nach §4 BtMVV für Reisen innerhalb des Schengen-Raums. Dieses Dokument muss vom zuständigen Gesundheitsamt beglaubigt werden.</p>
        </div>
        
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
          <p style="color: #1e293b; font-size: 14px; font-weight: 600; margin: 0 0 6px;">2. Ärztliches Attest (Deutsch/Englisch)</p>
          <p style="color: #64748b; font-size: 13px; margin: 0; line-height: 1.5;">Zweisprachige ärztliche Bescheinigung über die medizinische Notwendigkeit Ihrer Medikation. Empfohlen für alle internationalen Reisen.</p>
        </div>
      </div>
      
      <!-- Instructions -->
      <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1px solid #93c5fd; border-radius: 16px; padding: 24px; margin: 0 0 28px;">
        <p style="color: #1e40af; font-size: 14px; font-weight: 700; margin: 0 0 12px;">📋 So gehen Sie vor:</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #1e40af; font-size: 14px; vertical-align: top; width: 24px;"><strong>1.</strong></td>
            <td style="padding: 8px 0; color: #1e40af; font-size: 14px; line-height: 1.5;"><strong>Drucken</strong> Sie beide Dokumente aus (am besten in Farbe)</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #1e40af; font-size: 14px; vertical-align: top;"><strong>2.</strong></td>
            <td style="padding: 8px 0; color: #1e40af; font-size: 14px; line-height: 1.5;"><strong>Beglaubigung:</strong> Lassen Sie das BTM-Formular vom Gesundheitsamt abstempeln (für Schengen-Reisen erforderlich)</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #1e40af; font-size: 14px; vertical-align: top;"><strong>3.</strong></td>
            <td style="padding: 8px 0; color: #1e40af; font-size: 14px; line-height: 1.5;"><strong>Mitführen:</strong> Bewahren Sie die Dokumente zusammen mit Ihrem Reisepass im <strong>Handgepäck</strong> auf</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #1e40af; font-size: 14px; vertical-align: top;"><strong>4.</strong></td>
            <td style="padding: 8px 0; color: #1e40af; font-size: 14px; line-height: 1.5;"><strong>Medikamente:</strong> Belassen Sie Ihre Medikamente in der Originalverpackung mit Beipackzettel</td>
          </tr>
        </table>
      </div>
      
      <!-- Warning Box -->
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #f59e0b; border-radius: 16px; padding: 20px; margin: 0 0 32px;">
        <p style="color: #92400e; font-size: 14px; font-weight: 700; margin: 0 0 12px;">⚠️ Wichtige Hinweise:</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0; color: #92400e; font-size: 13px; line-height: 1.5;">• Die Bescheinigung ist nur im <strong>Original</strong> gültig – keine Kopien</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #92400e; font-size: 13px; line-height: 1.5;">• Gültigkeit: maximal <strong>30 Tage</strong> (Schengen-Bescheinigung)</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #92400e; font-size: 13px; line-height: 1.5;">• Bei Reisen außerhalb des Schengen-Raums informieren Sie sich über die Einfuhrbestimmungen</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #92400e; font-size: 13px; line-height: 1.5;">• Führen Sie nur die für die Reisedauer benötigte Menge mit</td>
          </tr>
        </table>
      </div>
      
      <!-- Contact Box -->
      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 0 0 28px; text-align: center;">
        <p style="color: #64748b; font-size: 13px; margin: 0 0 8px;">Bei Fragen erreichen Sie uns unter:</p>
        <p style="color: #0f766e; font-size: 15px; font-weight: 600; margin: 0;">
          +49 40 238353790 · info@nevpaz.de
        </p>
      </div>
      
      <!-- Signature -->
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0;">
        Wir wünschen Ihnen eine angenehme und sichere Reise!<br><br>
        Mit freundlichen Grüßen,<br>
        <strong style="color: #0f766e;">Ihr NEVPAZ-Praxisteam</strong>
      </p>
      
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; padding: 32px 16px;">
      <p style="color: #64748b; font-size: 13px; font-weight: 600; margin: 0 0 8px;">
        Privatpraxis NEVPAZ GmbH
      </p>
      <p style="color: #94a3b8; font-size: 12px; margin: 0 0 4px;">
        Dammtorwall 7a • 20354 Hamburg
      </p>
      <p style="color: #94a3b8; font-size: 12px; margin: 0 0 16px;">
        Tel: +49 40 238353790 • www.nevpaz.de
      </p>
      <p style="color: #cbd5e1; font-size: 11px; margin: 0; line-height: 1.5;">
        Diese E-Mail wurde automatisch generiert.<br>
        Bitte antworten Sie nicht direkt auf diese Nachricht.
      </p>
    </div>
    
  </div>
</body>
</html>
      `,
      attachments: [
        {
          filename: `BTM-Formular_${safeName}_${dateStamp}.pdf`,
          content: btmPdfBase64,
        },
        {
          filename: `Attest_${safeName}_${dateStamp}.pdf`,
          content: attestPdfBase64,
        },
      ],
    });

    if (error) {
      console.error('Resend Error:', error);
      return NextResponse.json(
        { error: 'Email konnte nicht gesendet werden', details: error.message }, 
        { status: 500 }
      );
    }

    console.log('Email sent successfully:', data);

    return NextResponse.json({
      success: true,
      messageId: data?.id,
      message: `Dokumente wurden an ${patientEmail} gesendet`
    });

  } catch (error) {
    console.error('Send Documents Error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Email-Versand' }, 
      { status: 500 }
    );
  }
}
