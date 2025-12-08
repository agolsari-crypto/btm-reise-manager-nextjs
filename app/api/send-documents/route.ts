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
      ? `${formatDate(travelStartDate)} - ${formatDate(travelEndDate)}`
      : 'Nicht angegeben';

    // Dateinamen generieren
    const safeName = (patientName || 'Patient').replace(/[^a-zA-Z0-9äöüÄÖÜß\s]/g, '').replace(/\s+/g, '_');
    const dateStamp = new Date().toISOString().split('T')[0];

    const { data, error } = await resend.emails.send({
      from: 'NEVPAZ Privatpraxis <noreply@nevpaz.de>',
      to: [patientEmail],
      subject: `Ihre BTM-Reisedokumente – NEVPAZ`,
      html: `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">
        NEVPAZ Privatpraxis
      </h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">
        Neurovaskulär-Psychiatrische Ambulanz
      </p>
    </div>
    
    <!-- Content -->
    <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
      
      <p style="font-size: 16px; color: #334155; margin: 0 0 24px 0;">
        Sehr geehrte/r <strong>${patientName || 'Patient/in'}</strong>,
      </p>
      
      <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">
        anbei erhalten Sie Ihre BTM-Reisedokumente für Ihre bevorstehende Reise.
      </p>
      
      <!-- Info Box -->
      <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 12px; padding: 20px; margin: 0 0 24px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px; width: 140px;">Ausstellender Arzt:</td>
            <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${doctorName || 'NEVPAZ'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Reisezeitraum:</td>
            <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${reiseZeitraum}</td>
          </tr>
          ${destination ? `
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Reiseziel:</td>
            <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${destination}</td>
          </tr>
          ` : ''}
        </table>
      </div>
      
      <!-- Documents -->
      <div style="margin: 0 0 24px 0;">
        <p style="font-size: 14px; color: #334155; font-weight: 600; margin: 0 0 12px 0;">
          📎 Angehängte Dokumente:
        </p>
        <ul style="margin: 0; padding: 0 0 0 20px; color: #475569; font-size: 14px; line-height: 1.8;">
          <li>BTM-Formular (Amtliches Mitführungsformular)</li>
          <li>Ärztliches Attest (Englisch/Deutsch)</li>
        </ul>
      </div>
      
      <!-- Important Notice -->
      <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 12px; padding: 16px; margin: 0 0 24px 0;">
        <p style="font-size: 13px; color: #92400e; margin: 0; line-height: 1.5;">
          <strong>⚠️ Wichtig:</strong> Bitte drucken Sie beide Dokumente aus und führen Sie diese zusammen mit Ihrem Medikament im Handgepäck mit. Die Bescheinigung ist nur im Original gültig.
        </p>
      </div>
      
      <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 8px 0;">
        Wir wünschen Ihnen eine angenehme und sichere Reise!
      </p>
      
      <p style="font-size: 15px; color: #475569; margin: 24px 0 0 0;">
        Mit freundlichen Grüßen,<br>
        <strong style="color: #0f766e;">Ihr NEVPAZ-Team</strong>
      </p>
      
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; padding: 24px; color: #94a3b8; font-size: 12px;">
      <p style="margin: 0 0 8px 0;">
        <strong>Privatpraxis NEVPAZ GmbH</strong>
      </p>
      <p style="margin: 0 0 4px 0;">
        Dammtorwall 7a • 20354 Hamburg
      </p>
      <p style="margin: 0 0 4px 0;">
        Tel: +49 40 238353790 • info@nevpaz.de
      </p>
      <p style="margin: 16px 0 0 0; font-size: 11px;">
        Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese Nachricht.
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
