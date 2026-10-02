// Shown on the way back from Stripe, while the payment is checked with Stripe.
export default function CheckoutSuccessLoading() {
  return (
    <main className="flex-1 pt-header">
      <div className="shell-reading py-section">
        <h1 className="type-headline">Confirming your payment</h1>
        <p role="status" className="type-lead mt-4 text-muted">
          We are checking the payment with Stripe. Please keep this page open;
          there is no need to pay again.
        </p>
      </div>
    </main>
  );
}
