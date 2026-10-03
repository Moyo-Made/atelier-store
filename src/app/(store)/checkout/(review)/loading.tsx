// Shown while the checkout review is prepared and the bag is checked. It is
// in the `(review)` group so that it does not also cover the confirmation
// page, which has to be able to answer with a 404 status.
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
