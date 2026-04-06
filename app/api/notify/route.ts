import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    // Η αρχικοποίηση μπήκε ΕΔΩ ΜΕΣΑ για να περάσει το Vercel Build
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const { email, title, message, type } = await req.json();

    const data = await resend.emails.send({
      from: 'AXON Command Center <system@axon-trading.com>',
      to: [email],
      subject: `[AXON ALERT] ${title}`,
      html: `
        <div style="background: #020509; color: #F8F5EE; padding: 40px; font-family: monospace;">
          <h2 style="color: #A6947D; border-bottom: 1px solid #A6947D; padding-bottom: 10px;">${title}</h2>
          <p style="font-size: 14px; color: #888;">CLASSIFICATION: ${type.toUpperCase()}</p>
          <div style="margin-top: 20px; padding: 20px; background: #01030A; border-left: 4px solid #A6947D;">
            <p style="font-size: 16px;">${message}</p>
          </div>
          <p style="margin-top: 30px; font-size: 10px; color: #555;">This is an automated transmission from the AXON Institutional Network.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}