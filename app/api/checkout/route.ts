import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// DIRECT KEY INJECTION: Βάζουμε το Secret Key καρφωτά για να παρακάμψουμε το σφάλμα του Next.js
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_build', {
  apiVersion: '2023-10-16' as any,
});

export async function POST(request: Request) {
  try {
    const { amount } = await request.json();

    // Δημιουργία του Payment Intent. Το Stripe διαβάζει τα ποσά σε cents (λεπτά).
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), 
      currency: 'eur',
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Επιστρέφουμε το "κλειδί" (clientSecret) στο Frontend για να ανοίξει η φόρμα
    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: any) {
    console.error("Stripe API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}