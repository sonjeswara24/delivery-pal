import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Sparkles } from "lucide-react";
import { ORDERS, type Order } from "@/lib/orders";
import { planRoute } from "@/lib/route-plan.functions";

function RoutePlanner({ stops }: { stops: Order[] }) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const run = async () => {
    setLoading(true); setError(null); setPlan(null);
    try {
      const r = await planRoute({ data: { stops: stops.map(({ id, customer, address, item, eta }) => ({ id, customer, address, item, eta })) } });
      if ("error" in r && r.error) setError(r.error); else setPlan(r.text ?? null);
    } catch { setError("Couldn't generate a route plan right now."); }
    finally { setLoading(false); }
  };
  return (
    <div className="mt-8 rounded-xl bg-secondary p-6 text-secondary-foreground shadow-card">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold"><Sparkles className="h-5 w-5 text-primary" />Smart route plan</h2>
          <p className="text-sm opacity-75">AI suggests the best order to deliver your pending parcels.</p>
        </div>
        <button disabled={loading || stops.length === 0} onClick={run} className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
          {loading ? "Planning…" : "Plan my route"}
        </button>
      </div>
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      {plan && <p className="mt-4 whitespace-pre-line text-sm leading-relaxed">{plan}</p>}
    </div>
  );
}

export const Route = createFileRoute("/delivery")({
  head: () => ({
    meta: [
      { title: "Delivery dashboard — ShipTrack" },
      { name: "description", content: "See pending deliveries and mark them delivered." },
      { property: "og:title", content: "Delivery dashboard — ShipTrack" },
      { property: "og:description", content: "Pending deliveries for delivery partners." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Delivery,
});

function Delivery() {
  const [orders, setOrders] = useState<Order[]>(ORDERS);
  const pending = orders.filter((o) => o.status !== "Delivered");
  const done = orders.length - pending.length;
  const markDone = (id: string) =>
    setOrders((os) => os.map((o) => (o.id === id ? { ...o, status: "Delivered", eta: "Delivered just now" } : o)));

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <Link to="/" className="text-sm text-muted-foreground">← Back</Link>
        <h1 className="mt-4 text-4xl font-bold">Hi Ravi, here's your day</h1>
        <div className="mt-6 grid grid-cols-3 gap-4">
          <Stat label="Pending" value={pending.length} tone="bg-primary text-primary-foreground" />
          <Stat label="Delivered" value={done} tone="bg-card" />
          <Stat label="Total" value={orders.length} tone="bg-card" />
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-success transition-all" style={{ width: `${(done / orders.length) * 100}%` }} />
        </div>

        <RoutePlanner stops={pending} />

        <h2 className="mt-10 text-xl font-bold">Pending deliveries</h2>
        <ul className="mt-4 space-y-3">
          {pending.length === 0 && <p className="text-muted-foreground">All done for today 🎉</p>}
          {pending.map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-4 rounded-xl bg-card p-5 shadow-card">
              <div>
                <p className="text-xs text-muted-foreground">{o.id} · {o.status}</p>
                <p className="font-semibold">{o.customer} — {o.item}</p>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3 w-3" />{o.address}</p>
              </div>
              <button onClick={() => markDone(o.id)} className="shrink-0 rounded-lg bg-success px-4 py-2 text-sm font-semibold text-primary-foreground">
                Mark delivered
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`rounded-xl p-5 shadow-card ${tone}`}>
      <p className="text-sm opacity-75">{label}</p>
      <p className="font-display text-4xl font-bold">{value}</p>
    </div>
  );
}
