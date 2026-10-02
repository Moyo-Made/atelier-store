// Shown while the bag is checked against current prices and stock.
export default function BagLoading() {
  return (
    <main className="flex-1 pt-header">
      <div className="shell pt-8 pb-10 lg:pt-14 lg:pb-14">
        <p className="type-caption text-muted">Home / Bag</p>
        <h1 className="type-headline mt-4">Bag</h1>
      </div>
      <div className="border-t">
        <div className="shell py-section">
          <p role="status" className="type-body text-muted">
            Checking your bag against current stock…
          </p>
        </div>
      </div>
    </main>
  );
}
