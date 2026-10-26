const BASE = import.meta.env.VITE_API_URL ?? "https://delivery-pal.onrender.com";

export type TrackEvent = {
  event_id: number;
  event_type: string;
  remarks: string | null;
  event_ts: string;
  facility_name: string | null;
  driver_name: string | null;
};

export type TrackResponse = {
  package: {
    package_id: number;
    tracking_no: string;
    weight_kg: string;
    current_status: string;
    destination_address: string;
    destination_city: string;
    destination_postal_code: string;
  };
  events: TrackEvent[];
};

export async function trackPackage(trackingNo: string): Promise<TrackResponse> {
  const res = await fetch(`${BASE}/track/${encodeURIComponent(trackingNo)}`);
  if (res.status === 404) throw new Error("Package not found");
  if (!res.ok) throw new Error("Could not load tracking details");
  return res.json();
}