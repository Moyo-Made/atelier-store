// Shown while a checkout page is prepared: the review while the bag is
// checked, the confirmation while Stripe is asked about the payment.
export default function CheckoutLoading() {
  return (
    <main className="flex-1 pt-header">
      <div className="shell pt-8 pb-10 lg:pt-14 lg:pb-14">
        <p className="type-caption text-muted">Home / Bag / Checkout</p>
        <h1 className="type-headline mt-4">Checkout</h1>
      </div>
      <div className="border-t">
        <div className="shell py-section">
          <p role="status" className="type-body text-muted">
            One moment…
          </p>
        </div>
      </div>
    </main>
  );
}
