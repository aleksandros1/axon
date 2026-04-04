import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Αρχικοποίηση του Stripe με το Secret Key από το .env.local
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16', // Ή η νεότερη έκδοση που υποστηρίζει το Stripe
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, vendorStripeAccountId } = body;

    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
    }

    // Το Stripe δουλεύει ΠΑΝΤΑ με cents (π.χ. 10.000€ = 1.000.000 cents)
    const amountInCents = Math.round(amount * 100);
    
    // Υπολογισμός Προμήθειας AXON: 2.5%
    const platformFeeCents = Math.round(amountInCents * 0.025);

    // Βασικές Παράμετροι Συναλλαγής
    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: amountInCents,
      currency: 'eur',
      // ΑΥΤΟ ΕΙΝΑΙ ΤΟ ΜΥΣΤΙΚΟ ΤΟΥ ESCROW: Δεσμεύει, ΔΕΝ τραβάει τα λεφτά!
      capture_method: 'manual', 
    };

    // Αν ο πωλητής έχει συνδέσει τον λογαριασμό του (Stripe Connect), τότε στέλνουμε τα λεφτά 
    // σε αυτόν και κρατάμε την προμήθεια. 
    // (Αν δεν έχει, τα λεφτά απλά δεσμεύονται στον κεντρικό λογαριασμό του AXON προς το παρόν)
    if (vendorStripeAccountId) {
      paymentIntentParams.transfer_data = {
        destination: vendorStripeAccountId,
      };
      paymentIntentParams.application_fee_amount = platformFeeCents;
    }

    // Δημιουργία του Payment Intent στο Stripe
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    // Επιστροφή του κλειδιού στο Frontend για να ανοίξει το παράθυρο της κάρτας
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
    
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}