import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '../../../lib/supabase'; // Το path είναι σωστό

// 1. Αρχικοποιούμε τη Stripe με το Μυστικό Κλειδί
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_build', {
  apiVersion: '2023-10-16' as any,
});

// 2. Το "Συνθηματικό" του Webhook
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  // ΑΦΑΙΡΕΘΗΚΕ Ο ΑΥΣΤΗΡΟΣ ΤΥΠΟΣ ΓΙΑ ΝΑ ΜΗΝ ΧΤΥΠΑΕΙ ΤΟ TYPESCRIPT
  let event;

  try {
    // 3. ΕΛΕΓΧΟΣ ΑΣΦΑΛΕΙΑΣ
    if (!sig || !endpointSecret) {
      throw new Error('Λείπει η υπογραφή Stripe ή το Webhook Secret.');
    }
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`🚨 ΣΥΝΑΓΕΡΜΟΣ WEBHOOK: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  console.log(`✅ ΕΠΙΒΕΒΑΙΩΜΕΝΟ ΣΗΜΑ STRIPE: ${event.type}`);

  // 4. ΕΚΤΕΛΕΣΗ ΔΙΑΤΑΓΩΝ ΑΝΑΛΟΓΑ ΜΕ ΤΟ ΣΗΜΑ
  if (event.type === 'payment_intent.succeeded') {
    // Βάζουμε "as any" για να μην μπλοκάρει ο κώδικας
    const paymentIntent = event.data.object as any;
    
    console.log(`💰 ΤΑ ΚΕΦΑΛΑΙΑ ΚΛΕΙΔΩΣΑΝ! PaymentIntent ID: ${paymentIntent.id}`);

    // Αλλάζουμε το Status του συμβολαίου στο Supabase
    const { error } = await supabase
      .from('contracts')
      .update({ status: 'funded' })
      .eq('stripe_payment_id', paymentIntent.id);

    if (error) {
      console.error('❌ Σφάλμα κατά την ενημέρωση του Supabase:', error.message);
    } else {
      console.log('✅ Το Smart Contract στο Supabase ενημερώθηκε επιτυχώς σε "funded".');
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as any;
    console.log(`❌ Η ΠΛΗΡΩΜΗ ΑΠΕΤΥΧΕ Ή ΑΚΥΡΩΘΗΚΕ: ${paymentIntent.id}`);
  }

  return NextResponse.json({ received: true });
}