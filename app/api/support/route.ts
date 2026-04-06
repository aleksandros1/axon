import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    // Η αρχικοποίηση μπήκε ΕΔΩ ΜΕΣΑ για να περάσει το Vercel Build
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const { name, email, subject, message } = await req.json();

    const data = await resend.emails.send({
      from: 'AXON System <system@axon-trading.com>', 
      to: ['ΤΟ_EMAIL_ΣΟΥ@gmail.com'], // Βεβαιώσου ότι έχεις βάλει το email σου εδώ
      subject: `[SUPPORT PROTOCOL] ${subject.toUpperCase()}`,
      html: `
        <div style="background: #020509; color: #F8F5EE; padding: 40px; font-family: serif;">
          <h1 style="color: #A6947D; border-bottom: 1px solid #A6947D;">AXON SUPPORT TRANSMISSION</h1>
          <p><strong>Entity:</strong> ${name}</p>
          <p><strong>Origin:</strong> ${email}</p>
          <p><strong>Classification:</strong> ${subject}</p>
          <div style="margin-top: 20px; padding: 20px; background: #01030A; border-left: 4px solid #A6947D;">
            ${message}
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: 'Transmission failed' }, { status: 500 });
  }
}