import { describe, expect, it } from "vitest";
import { canLoadDriverMap, getDriverLocation } from "@/lib/driver-location";

describe("driver location visibility", () => {
  it("shows a location only while the order is Out for delivery", () => {
    expect(getDriverLocation({ status: "Out for delivery" })).toMatchObject({ driver: "Ravi" });
    expect(getDriverLocation({ status: "Ordered" })).toBeNull();
    expect(getDriverLocation({ status: "Packed" })).toBeNull();
    expect(getDriverLocation({ status: "Delivered" })).toBeNull();
  });
});

describe("driver map origin safety", () => {
  it("allows credential-free HTTPS Lovable origins", () => {
    expect(canLoadDriverMap("https:", "shiptrack.lovable.app")).toBe(true);
    expect(canLoadDriverMap("https:", "id-preview--shiptrack.lovable.app")).toBe(true);
    expect(canLoadDriverMap("https:", "shiptrack.lovableproject.com")).toBe(true);
  });

  it("blocks credential-bearing preview hostnames", () => {
    expect(canLoadDriverMap("https:", "project-devserver-accesskey.lovableproject.com")).toBe(false);
  });

  it("blocks HTTP and unauthorized domains before sending a request", () => {
    expect(canLoadDriverMap("http:", "shiptrack.lovable.app")).toBe(false);
    expect(canLoadDriverMap("http:", "localhost")).toBe(false);
    expect(canLoadDriverMap("https:", "example.com")).toBe(false);
    expect(canLoadDriverMap("https:", "shiptrack.lovable.app.example.com")).toBe(false);
  });
});