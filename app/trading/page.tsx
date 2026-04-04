const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// 10.000 € (το Stripe μετράει σε cents, άρα 1.000.000)
const totalAmountCents = 1000000; 

// Προμήθεια 2,5% (250 € -> 25.000 cents)
const platformFeeCents = 25000; 

const paymentIntent = await stripe.paymentIntents.create({
  amount: totalAmountCents,
  currency: 'eur',
  
  // 1. ΑΥΤΟ ΚΛΕΙΔΩΝΕΙ ΤΑ ΛΕΦΤΑ ΣΤΗΝ ΚΑΡΤΑ ΧΩΡΙΣ ΝΑ ΤΑ ΤΡΑΒΗΞΕΙ ΑΚΟΜΑ
  capture_method: 'manual', 
  
  // 2. ΕΔΩ ΛΕΜΕ ΟΤΙ ΤΑ ΛΕΦΤΑ ΘΑ ΠΑΝΕ ΣΤΟΝ ΠΩΛΗΤΗ
  transfer_data: {
    destination: 'acct_VENDOR_STRIPE_ID', // Το ID του πωλητή στο Stripe Connect
  },
  
  // 3. Η ΠΡΟΜΗΘΕΙΑ ΤΗΣ ΠΛΑΤΦΟΡΜΑΣ (ΑΧΟΝ)
  application_fee_amount: platformFeeCents, 
});