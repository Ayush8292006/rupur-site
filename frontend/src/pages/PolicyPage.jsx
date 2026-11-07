import { Link, useParams } from 'react-router-dom';
import { Card, PageShell } from '../components/ui';

/* Policy pages – Razorpay live account ke liye zaroori.
   Text client se ek baar padhwa lena (business ke hisaab se badal sakte hain). */

const BIZ = {
  name: 'Rupur Enterprises',
  brand: 'RUPUR Fragrances',
  address: 'In front of Tehsil, Kalapipal Mandi, Dist. Shajapur (M.P.) 465337',
  email: 'Rupurperfumes@gmail.com',
  phone: '97136 20850',
  site: 'www.rupurfragrances.com',
};
const UPDATED = '4 November 2026';

const P = ({ children }) => <p className="text-[15px] leading-[1.8] text-mist">{children}</p>;
const H = ({ children }) => <h2 className="mt-8 font-serif text-2xl text-cream first:mt-0">{children}</h2>;
const UL = ({ items }) => (
  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[15px] leading-[1.7] text-mist marker:text-gold">
    {items.map((i) => <li key={i}>{i}</li>)}
  </ul>
);

const POLICIES = {
  'shipping-policy': {
    title: 'Shipping', accent: 'policy',
    body: (
      <>
        <H>Where we deliver</H>
        <P>We ship across India through our delivery partner Delhivery. At checkout, enter your pincode to check if delivery is available at your address.</P>
        <H>Shipping charges</H>
        <UL items={[
          'Orders of ₹999 or more: free shipping.',
          'Orders below ₹999 with 1 item: ₹80.',
          'Orders below ₹999 with 2 or more items: ₹100.',
          'There are no taxes or other charges added at checkout. The total you see is the amount you pay.',
        ]} />
        <H>Dispatch and delivery</H>
        <P>After your payment is confirmed, your order is packed and handed to Delhivery. Delivery time depends on your location. You will receive your Delhivery tracking number by email and can follow your parcel under My Orders on this website.</P>
        <H>Payment</H>
        <P>All orders are prepaid online through Razorpay (UPI, cards, net banking and wallets). Cash on delivery is not available.</P>
        <H>Wrong address or failed delivery</H>
        <P>Please check your address and phone number before paying. If a parcel is returned to us because the address was incomplete or the customer could not be reached, re-shipping charges may apply.</P>
      </>
    ),
  },
  'refund-policy': {
    title: 'Refund &', accent: 'cancellation',
    body: (
      <>
        <H>No cancellations</H>
        <P>Once an order is placed and paid, it cannot be cancelled.</P>
        <H>No returns or refunds</H>
        <P>Perfumes and attars are personal care products. For hygiene reasons, we do not accept returns, exchanges or offer refunds on any order.</P>
        <H>Failed or duplicate payments</H>
        <P>If money was deducted but your order was not confirmed, the amount is automatically returned to your original payment method by Razorpay, usually within 5–7 working days. If it is not, write to us at {BIZ.email} with your payment details and we will help.</P>
        <H>Questions</H>
        <P>WhatsApp or call {BIZ.phone}, or email {BIZ.email}.</P>
      </>
    ),
  },
  terms: {
    title: 'Terms &', accent: 'conditions',
    body: (
      <>
        <P>This website ({BIZ.site}) is run by {BIZ.name}, {BIZ.address}. By using this website or placing an order, you agree to these terms.</P>
        <H>Products and prices</H>
        <UL items={[
          'All prices are in Indian Rupees (₹). The price shown on the product is the price you pay; no taxes are added at checkout.',
          'Product photos are for reference. Packaging and colour may vary slightly.',
          'We may change prices or stop selling a product at any time. The price at the time you pay is final for that order.',
        ]} />
        <H>Orders and payment</H>
        <UL items={[
          'You need an account to place an order. Please keep your password safe.',
          'Payments are processed securely by Razorpay. We do not store your card or UPI details.',
          'An order is confirmed only after the payment is successful. You will receive a confirmation email.',
          'Cash on delivery is not available.',
        ]} />
        <H>Delivery</H>
        <P>Orders are delivered by Delhivery. See our <Link to="/shipping-policy" className="text-gold-light underline">Shipping policy</Link>.</P>
        <H>Cancellations and refunds</H>
        <P>Orders cannot be cancelled, returned or refunded. See our <Link to="/refund-policy" className="text-gold-light underline">Refund &amp; cancellation policy</Link>.</P>
        <H>Use of the website</H>
        <P>Do not misuse this website, try to break its security, or place fake orders. We may block accounts that do.</P>
        <H>Contact</H>
        <P>{BIZ.name}, {BIZ.address}. Email {BIZ.email}, phone {BIZ.phone}.</P>
      </>
    ),
  },
  'privacy-policy': {
    title: 'Privacy', accent: 'policy',
    body: (
      <>
        <P>{BIZ.name} ("we") respects your privacy. This page explains what we collect when you use {BIZ.site} and how we use it.</P>
        <H>What we collect</H>
        <UL items={[
          'Account details: your name, email, mobile number and password (stored securely in encrypted form).',
          'Order details: delivery address, items ordered and order amount.',
          'Payment details are entered on Razorpay. We only receive a payment reference, not your card or UPI details.',
          'Messages you send us through the contact form.',
        ]} />
        <H>How we use it</H>
        <UL items={[
          'To process and deliver your order, and send you order and delivery updates by email.',
          'To share your name, phone and address with Delhivery so they can deliver your parcel.',
          'To reply to your questions and give support.',
        ]} />
        <H>Sharing</H>
        <P>We share your information only with the services needed to complete your order – Razorpay (payments) and Delhivery (delivery) – or when required by law. We do not sell your data.</P>
        <H>Cookies</H>
        <P>We use a cookie to keep you logged in, and your browser stores your cart. We do not use advertising cookies.</P>
        <H>Your choices</H>
        <P>To update or delete your account details, write to {BIZ.email}.</P>
        <H>Contact</H>
        <P>{BIZ.name}, {BIZ.address}. Email {BIZ.email}.</P>
      </>
    ),
  },
};

export default function PolicyPage() {
  const { slug } = useParams();
  const p = POLICIES[slug];
  if (!p) {
    return (
      <PageShell title="Page" accent="not found">
        <Link to="/" className="text-gold-light underline">Go to home</Link>
      </PageShell>
    );
  }
  return (
    <PageShell eyebrow={BIZ.brand} title={p.title} accent={p.accent} sub={`Last updated ${UPDATED}`}>
      <Card className="page-in max-w-3xl p-6 md:p-10">{p.body}</Card>
      <nav className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {[['shipping-policy', 'Shipping'], ['refund-policy', 'Refund & cancellation'], ['terms', 'Terms'], ['privacy-policy', 'Privacy']].map(([s, l]) => (
          <Link key={s} to={`/${s}`} className={s === slug ? 'text-gold-light' : 'text-mist hover:text-cream'}>{l}</Link>
        ))}
      </nav>
    </PageShell>
  );
}
