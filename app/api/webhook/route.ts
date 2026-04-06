import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// 1. Αρχικοποίηση Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16',
});

// 2. Αρχικοποίηση Supabase με το MASTER KEY (Service Role) για απόλυτη πρόσβαση
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function POST(req: Request) {
  const body = await req.text();
  // ΕΔΩ ΕΓΙΝΕ Η ΔΙΟΡΘΩΣΗ: Προστέθηκε το await
  const headersList = await headers();
  const signature = headersList.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    // Επαλήθευση ότι το χτύπημα είναι 100% από το Stripe και όχι από hacker
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // 3. Αν η πληρωμή ολοκληρώθηκε με επιτυχία
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // Παίρνουμε τα κρυφά δεδομένα (metadata) που στείλαμε όταν ξεκίνησε το checkout
    const slabId = session.metadata?.slab_id;
    const buyerId = session.metadata?.buyer_id;
    const vendorId = session.metadata?.vendor_id;
    const price = session.metadata?.price;

    if (slabId && buyerId && vendorId) {
      
      // A. Φτιάχνουμε το συμβόλαιο στη βάση δεδομένων
      const { error: contractError } = await supabaseAdmin
        .from('contracts')
        .insert([
          {
            slab_id: slabId,
            buyer_id: buyerId,
            vendor_id: vendorId,
            price: price,
            status: 'funded', // STATUS: FUNDS LOCKED
            stripe_payment_id: session.payment_intent as string,
          }
        ]);

      if (contractError) console.error('Error creating contract:', contractError);

      // B. Ενημερώνουμε την πλάκα ότι "ΠΟΥΛΗΘΗΚΕ" (Δεν είναι πια διαθέσιμη στο Trading Floor)
      await supabaseAdmin
        .from('slabs')
        .update({ is_available: false, visibility: 'private' })
        .eq('id', slabId);

      // C. Στέλνουμε Ειδοποίηση στον Πωλητή να ετοιμάσει το καράβι (BOL)
      await supabaseAdmin
        .from('notifications')
        .insert([
          {
            user_id: vendorId,
            type: 'payment',
            title: 'FUNDS SECURED IN ESCROW',
            message: `Payment for Asset AX-${slabId.substring(0,6)} has been secured by the buyer. Please prepare logistics and BOL.`
          }
        ]);
        
      // D. Στέλνουμε Ειδοποίηση στον Αγοραστή ότι τα λεφτά του κλειδώθηκαν με ασφάλεια
      await supabaseAdmin
        .from('notifications')
        .insert([
          {
            user_id: buyerId,
            type: 'payment',
            title: 'ESCROW FUNDED SUCCESSFULLY',
            message: `Your funds for AX-${slabId.substring(0,6)} are safely locked in the AXON Escrow Vault. Awaiting vendor logistics.`
          }
        ]);
    }
  }

  return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
}