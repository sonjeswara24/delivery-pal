import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check } from "lucide-react";
import { ORDERS, STEPS, type Order } from "@/lib/orders";
import { getDriverLocation } from "@/lib/driver-location";
import { DriverLocation } from "@/components/driver-location";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "Track your order — ShipTrack" },
      { name: "description", content: "Enter your tracking ID to see live order status." },
      { property: "og:title", content: "Track your order — ShipTrack" },
      { property: "og:description", content: "Live order status for customers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Track,
});

function Track() {
  const [q, setQ] = useState("TRK1001");
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const search = () => setOrder(ORDERS.find((o) => o.id.toLowerCase() === q.trim().toLowerCase()) ?? null);
  const idx = order ? STEPS.indexOf(order.status) : -1;
  const driverLocation = order ? getDriverLocation(order) : null;

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="text-sm text-muted-foreground">← Back</Link>
        <h1 className="mt-4 text-4xl font-bold">Track your order</h1>
        <div className="mt-6 flex gap-2">
          <input aria-label="Tracking ID" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="e.g. TRK1001" className="min-w-0 flex-1 rounded-lg border border-input bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-ring" />
          <Button onClick={search} className="h-auto rounded-lg px-6 font-semibold">Track</Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Try TRK1001 – TRK1006</p>

        {order === null && <p className="mt-8 text-destructive">No order found with that ID.</p>}
        {order && (
          <div className="mt-8 rounded-xl bg-card p-6 shadow-card">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{order.id}</p>
                <h2 className="text-2xl font-bold">{order.item}</h2>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">ETA</p>
                <p className="font-semibold">{order.eta}</p>
              </div>
            </div>
            <ol className="mt-8 space-y-0">
              {STEPS.map((s, i) => (
                <li key={s} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full ${i <= idx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {i <= idx ? <Check className="h-4 w-4" /> : i + 1}
                    </span>
                    {i < STEPS.length - 1 && <span className={`h-10 w-0.5 ${i < idx ? "bg-primary" : "bg-muted"}`} />}
                  </div>
                  <p className={`pt-1 ${i <= idx ? "font-semibold" : "text-muted-foreground"}`}>{s}</p>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-sm text-muted-foreground">Delivering to {order.address}</p>
            {driverLocation && <DriverLocation location={driverLocation} />}
          </div>
        )}
      </div>
    </main>
  );
}
