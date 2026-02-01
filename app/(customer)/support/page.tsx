export default function SupportPage() {
  return (
    <div className="bg-(--color-bg) min-h-screen py-10">
      <div className="mx-auto w-full max-w-full sm:max-w-10/12 px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-(--color-text) mb-6">Customer Service</h1>
        
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-8 shadow-panel border border-(--color-border-strong)">
            <h2 className="text-2xl font-bold text-(--color-accent) mb-4">Contact Us</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-(--color-muted)">Name</label>
                <input type="text" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-(--color-primary) focus:outline-none focus:ring-1 focus:ring-(--color-primary)" />
              </div>
              <div>
                <label className="block text-sm font-medium text-(--color-muted)">Email</label>
                <input type="email" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-(--color-primary) focus:outline-none focus:ring-1 focus:ring-(--color-primary)" />
              </div>
              <div>
                <label className="block text-sm font-medium text-(--color-muted)">Message</label>
                <textarea rows={4} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-(--color-primary) focus:outline-none focus:ring-1 focus:ring-(--color-primary)"></textarea>
              </div>
              <button type="submit" className="rounded-md bg-(--color-accent) px-6 py-2 text-white font-bold hover:bg-black transition-colors">
                Send Message
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-8 shadow-panel border border-(--color-border-strong)">
              <h3 className="text-xl font-bold text-(--color-accent) mb-2">FAQ</h3>
              <p className="text-(--color-muted)">Find answers to common questions about shipping, returns, and more.</p>
            </div>
            <div className="rounded-2xl bg-white p-8 shadow-panel border border-(--color-border-strong)">
              <h3 className="text-xl font-bold text-(--color-accent) mb-2">Returns Policy</h3>
              <p className="text-(--color-muted)">Learn about our 30-day return policy and how to initiate a return.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

