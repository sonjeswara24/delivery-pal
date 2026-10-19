import type { Order } from "@/lib/orders";

export type DriverLocation = {
  driver: string;
  area: string;
  latitude: number;
  longitude: number;
};

const SAMPLE_LOCATION: DriverLocation = {
  driver: "Ravi",
  area: "Near Shivajinagar, Pune",
  latitude: 18.5308,
  longitude: 73.8475,
};

export function getDriverLocation(order: Pick<Order, "status">): DriverLocation | null {
  return order.status === "Out for delivery" ? SAMPLE_LOCATION : null;
}