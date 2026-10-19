import { describe, expect, it } from "vitest";
import { getDriverLocation } from "@/lib/driver-location";

describe("driver location visibility", () => {
  it("shows a location only while the order is Out for delivery", () => {
    expect(getDriverLocation({ status: "Out for delivery" })).toMatchObject({ driver: "Ravi" });
    expect(getDriverLocation({ status: "Ordered" })).toBeNull();
    expect(getDriverLocation({ status: "Packed" })).toBeNull();
    expect(getDriverLocation({ status: "Delivered" })).toBeNull();
  });
});