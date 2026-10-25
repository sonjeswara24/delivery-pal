import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check } from "lucide-react";
import { trackPackage, type TrackResponse } from "@/lib/api";
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

// Happy-path lifecycle, matching the package_status enum in the database
const STEPS = [
  "BOOKED",
  "PACKED",
  "PICKED_UP",
  "AT_SORTING_HUB",
  "IN_TRANSIT",
  "AT_DEPOT",
  "OUT_FOR_DELIVERY",
  "ARRIVING",
  "DELIVERED",
];

const pretty = (s: string) =>
  s.replace(/_/g, " ").toLowerCase().replace(/(^|\s)\w/g, (c) => c.toUpperCase());

function Track() {
  const [q, setQ] = useState("TRK1001");
  const [data, setData] = useState<TrackResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    const id = q.trim().toUpperCase();
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setData(await trackPackage(id));
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const status = data?.package.current_status ?? "";
  let idx = STEPS.indexOf(status);
  if (status === "FAILED_ATTEMPT" || status === "RETURNED") idx = STEPS.indexOf("OUT_FOR_DELIVERY");

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="text-sm text-muted-foreground">← Back</Link>
        <h1 className="mt-4 text-4xl font-bold">Track your order</h1>
        <div className="mt-6 flex gap-2">
          <input
            aria-label="Tracking ID"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="e.g. TRK1001"
            className="min-w-0 flex-1 rounded-lg border border-input bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
          />
          <Button onClick={search} disabled={loading} className="h-auto rounded-lg px-6 font-semibold">
            {loading ? "Searching…" : "Track"}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Try TRK1001 – TRK1003</p>

        {error && <p className="mt-8 text-destructive">{error}</p>}

        {data && (
          <div className="mt-8 rounded-xl bg-card p-6 shadow-card">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{data.package.tracking_no}</p>
                <h2 className="text-2xl font-bold">{pretty(status)}</h2>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Weight</p>
                <p className="font-semibold">{data.package.weight_kg} kg</p>
              </div>
            </div>

            {(status === "FAILED_ATTEMPT" || status === "RETURNED" || status === "CANCELLED") && (
              <p className="mt-4 text-sm text-destructive">
                {status === "FAILED_ATTEMPT" && "Delivery attempt failed. We will try again."}
                {status === "RETURNED" && "This package was returned to the sender."}
                {status === "CANCELLED" && "This shipment was cancelled."}
              </p>
            )}

            <ol className="mt-8 space-y-0">
              {STEPS.map((s, i) => (
                <li key={s} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        i <= idx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i <= idx ? <Check className="h-4 w-4" /> : i + 1}
                    </span>
                    {i < STEPS.length - 1 && (
                      <span className={`h-10 w-0.5 ${i < idx ? "bg-primary" : "bg-muted"}`} />
                    )}
                  </div>
                  <p className={`pt-1 ${i <= idx ? "font-semibold" : "text-muted-foreground"}`}>{pretty(s)}</p>
                </li>
              ))}
            </ol>

            <p className="mt-4 text-sm text-muted-foreground">
              Delivering to {data.package.destination_address}, {data.package.destination_city}{" "}
              {data.package.destination_postal_code}
            </p>

            <h3 className="mt-8 font-semibold">Scan history</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {data.events.length === 0 && <li className="text-muted-foreground">No scans yet.</li>}
              {data.events.map((e) => (
                <li key={e.event_id} className="flex justify-between gap-4 border-b border-muted pb-2">
                  <span>
                    {pretty(e.event_type)}
                    {e.facility_name ? ` — ${e.facility_name}` : ""}
                    {e.remarks ? ` (${e.remarks})` : ""}
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    {new Date(e.event_ts).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}