import { createFileRoute, Link } from "@tanstack/react-router";
import { Package, Truck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ShipTrack — Track orders & manage deliveries" },
      { name: "description", content: "Customers track their orders live. Delivery partners see pending deliveries at a glance." },
      { property: "og:title", content: "ShipTrack — Track orders & manage deliveries" },
      { property: "og:description", content: "Two portals: customer tracking and delivery partner dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <p className="font-display text-sm font-bold uppercase tracking-widest text-primary">ShipTrack</p>
        <h1 className="mt-3 text-5xl font-bold leading-tight md:text-6xl">
          Every parcel, <span className="text-primary">one place.</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">Choose how you want to continue.</p>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Link to="/track" className="group rounded-xl bg-card p-8 shadow-card transition hover:-translate-y-1">
            <Package className="h-10 w-10 text-primary" />
            <h2 className="mt-6 text-2xl font-bold">I'm a customer</h2>
            <p className="mt-2 text-muted-foreground">Enter your tracking ID to see where your order is.</p>
            <span className="mt-6 inline-block font-semibold text-primary">Track order →</span>
          </Link>
          <Link to="/delivery" className="group rounded-xl bg-secondary p-8 text-secondary-foreground shadow-card transition hover:-translate-y-1">
            <Truck className="h-10 w-10 text-primary" />
            <h2 className="mt-6 text-2xl font-bold">I'm a delivery partner</h2>
            <p className="mt-2 opacity-75">See pending deliveries and mark them complete.</p>
            <span className="mt-6 inline-block font-semibold text-primary">Open dashboard →</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
