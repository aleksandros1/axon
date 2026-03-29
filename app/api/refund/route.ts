import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// DIRECT KEY INJECTION: Το Secret Key σου για απόλυτη πρόσβαση
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_build', {
  apiVersion: '2023-10-16' as any,
});

export async function POST(request: Request) {
  try {
    // Παίρνουμε το ID της αρχικής συναλλαγής και το ποσό που θέλουμε να επιστρέψουμε
    const { paymentIntentId, amountToRefund } = await request.json();

    if (!paymentIntentId) {
      throw new Error("Payment Intent ID is required for a refund.");
    }

    // Στήνουμε τις παραμέτρους της επιστροφής
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    };

    // Αν ο πωλητής έχει ορίσει συγκεκριμένο ποσό (Partial Refund), το βάζουμε σε cents.
    // Αν δεν στείλει ποσό, το Stripe κάνει ΑΥΤΟΜΑΤΑ Ολική Επιστροφή (Full Refund).
    if (amountToRefund && amountToRefund > 0) {
      refundParams.amount = Math.round(amountToRefund * 100);
    }

    // Εκτέλεση της επιστροφής στην Τράπεζα
    const refund = await stripe.refunds.create(refundParams);

    return NextResponse.json({ success: true, refund });
  } catch (err: any) {
    console.error("Refund API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}