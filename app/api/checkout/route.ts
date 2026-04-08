import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Αρχικοποίηση Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16',
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Στην πράξη το vendorStripeAccountId θα έρχεται από τη βάση δεδομένων σου.
    // Για το τεστ, βάλε εδώ το acct_ που μόλις αντέγραψες!
    const { slabId, buyerId, vendorId, price, vendorStripeAccountId = 'acct_1TJvWW1RTGgmHrj9' } = body;

    if (!price || !slabId) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Το Stripe δουλεύει ΠΑΝΤΑ με λεπτά (cents). Άρα 1000€ = 100000 cents.
    const amountInCents = Math.round(price * 100);
    
    // Το δικό σου fee (2.5%) -> Το AXON "Διόδιο"
    const platformFeeInCents = Math.round(amountInCents * 0.025);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `AXON Contract: AX-${slabId.substring(0,8)}`,
              description: 'Premium Asset - Escrow Secured',
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      payment_intent_data: {
        // ΕΔΩ ΓΙΝΕΤΑΙ Η ΜΑΓΕΙΑ (Destination Charge)
        transfer_data: {
          destination: vendorStripeAccountId, // Στέλνει το 97.5% απευθείας στον Παυλίδη
        },
        application_fee_amount: platformFeeInCents, // Κρατάει το 2.5% στο δικό σου λογαριασμό AXON
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?status=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?status=cancelled`,
      metadata: {
        slab_id: slabId,
        buyer_id: buyerId || 'test_buyer',
        vendor_id: vendorId || 'test_vendor',
        price: price.toString(),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Checkout Error:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}