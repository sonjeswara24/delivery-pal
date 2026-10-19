import { useEffect, useState } from "react";
import { LoaderCircle, MapPin, RotateCw, Truck } from "lucide-react";
import { canLoadDriverMap, type DriverLocation as Location } from "@/lib/driver-location";
import { Button } from "@/components/ui/button";

export function DriverLocation({ location }: { location: Location }) {
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const authorized = canLoadDriverMap(window.location.protocol, window.location.hostname);
    const key = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"];
    if (!authorized || !key) return;
    const params = new URLSearchParams({
      key,
      q: `${location.latitude},${location.longitude}`,
      zoom: "14",
      channel: import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"] ?? "",
    });
    setMapUrl(`https://www.google.com/maps/embed/v1/place?${params}`);
  }, [location.latitude, location.longitude]);

  useEffect(() => {
    if (!mapUrl || loaded || failed) return;
    const timeout = window.setTimeout(() => setFailed(true), 20000);
    return () => window.clearTimeout(timeout);
  }, [mapUrl, loaded, failed, attempt]);

  return (
    <section aria-labelledby="driver-location-heading" className="mt-6 border-t pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="driver-location-heading" className="flex items-center gap-2 text-lg font-bold">
          <Truck className="h-5 w-5 text-primary" />Driver location
        </h3>
        <span className="text-xs font-semibold text-muted-foreground">Sample location · Not live</span>
      </div>
      <p className="mt-3 font-semibold">{location.driver} · Delivery partner</p>
      <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4 shrink-0" />{location.area}
      </p>
      <div className="relative mt-4 h-64 overflow-hidden rounded-lg border bg-muted">
        {mapUrl && !failed ? (
          <>
          {!loaded && <div role="status" className="absolute inset-0 flex items-center justify-center gap-2 bg-muted text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" />Loading driver map…</div>}
          <iframe
            key={attempt}
            title="Sample driver location in Pune"
            src={mapUrl}
            className="h-full w-full border-0"
            loading="eager"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-muted-foreground">
            <MapPin className="h-8 w-8 text-primary" />
            <p className="text-sm">{failed ? "The map is unavailable right now." : "Map available on an authorized site."}</p>
            <p className="text-xs">{location.area}</p>
            {mapUrl && failed && <Button variant="outline" size="sm" onClick={() => { setLoaded(false); setFailed(false); setAttempt((value) => value + 1); }}><RotateCw />Retry map</Button>}
          </div>
        )}
      </div>
    </section>
  );
}