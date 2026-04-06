import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Βεβαιώσου ότι έχεις βάλει το RESEND_API_KEY στο .env.local σου
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, title, message, type } = await req.json();

    // Στέλνουμε το Email
    const data = await resend.emails.send({
      from: 'AXON Command Center <system@axon-trading.com>', // Άλλαξέ το με το domain σου όταν το κάνεις verify
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