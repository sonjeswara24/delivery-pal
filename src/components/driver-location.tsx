import { useEffect, useState } from "react";
import { MapPin, Truck } from "lucide-react";
import type { DriverLocation as Location } from "@/lib/driver-location";

export function DriverLocation({ location }: { location: Location }) {
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const hostname = window.location.hostname;
    const authorized = window.location.protocol === "https:" &&
      (hostname.endsWith(".lovable.app") || hostname.endsWith(".lovableproject.com")) &&
      !hostname.includes("-devserver-");
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
      <div className="mt-4 h-64 overflow-hidden rounded-lg border bg-muted">
        {mapUrl && !failed ? (
          <iframe
            title="Sample driver location in Pune"
            src={mapUrl}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer"
            allowFullScreen
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-muted-foreground">
            <MapPin className="h-8 w-8 text-primary" />
            <p className="text-sm">{failed ? "The map is unavailable right now." : "Map available on an authorized site."}</p>
            <p className="text-xs">{location.area}</p>
          </div>
        )}
      </div>
    </section>
  );
}