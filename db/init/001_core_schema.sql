-- Courier Management System: core schema (Phase 0/1)
CREATE EXTENSION IF NOT EXISTS postgis;

-- ---------- Enumerations ----------
CREATE TYPE facility_type AS ENUM ('FULFILLMENT_CENTER', 'SORTING_HUB', 'DELIVERY_DEPOT');

CREATE TYPE package_status AS ENUM (
  'BOOKED', 'PACKED', 'PICKED_UP', 'AT_SORTING_HUB', 'IN_TRANSIT',
  'AT_DEPOT', 'OUT_FOR_DELIVERY', 'ARRIVING', 'DELIVERED',
  'FAILED_ATTEMPT', 'RETURNED', 'CANCELLED'
);

-- ---------- Customers and orders ----------
CREATE TABLE customers (
  customer_id SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  phone       TEXT
);

CREATE TABLE orders (
  order_id     SERIAL PRIMARY KEY,
  customer_id  INT NOT NULL REFERENCES customers(customer_id),
  order_date   TIMESTAMPTZ NOT NULL DEFAULT now(),
  order_status TEXT NOT NULL DEFAULT 'PLACED',
  total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0)
);

-- ---------- Network (supertype/subtype via facility_type) ----------
CREATE TABLE facilities (
  facility_id SERIAL PRIMARY KEY,
  type        facility_type NOT NULL,
  name        TEXT NOT NULL,
  address     TEXT,
  city        TEXT,
  postal_code TEXT,
  location    GEOGRAPHY(Point, 4326)
);
CREATE INDEX idx_facilities_location ON facilities USING GIST (location);

-- ---------- Fleet ----------
CREATE TABLE logistics_contractors (
  contractor_id SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  contact       TEXT
);

CREATE TABLE drivers (
  driver_id     SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  phone         TEXT,
  license_no    TEXT NOT NULL UNIQUE,
  contractor_id INT REFERENCES logistics_contractors(contractor_id),
  status        TEXT NOT NULL DEFAULT 'AVAILABLE'
);

CREATE TABLE vehicles (
  vehicle_id    SERIAL PRIMARY KEY,
  plate_no      TEXT NOT NULL UNIQUE,
  type          TEXT NOT NULL,
  capacity_kg   NUMERIC(8,2) CHECK (capacity_kg > 0),
  contractor_id INT REFERENCES logistics_contractors(contractor_id)
);

-- ---------- Packages ----------
CREATE TABLE packages (
  package_id              SERIAL PRIMARY KEY,
  order_id                INT NOT NULL REFERENCES orders(order_id),
  tracking_no             TEXT NOT NULL UNIQUE,
  weight_kg               NUMERIC(8,2) NOT NULL CHECK (weight_kg > 0),
  current_status          package_status NOT NULL DEFAULT 'BOOKED',
  destination_address     TEXT NOT NULL,   -- private: never returned by the public API
  destination_city        TEXT NOT NULL,
  destination_postal_code TEXT NOT NULL,
  destination_location    GEOGRAPHY(Point, 4326)
);
CREATE INDEX idx_packages_order ON packages(order_id);
CREATE INDEX idx_packages_destination ON packages USING GIST (destination_location);

CREATE TABLE shipment_items (
  item_id     SERIAL PRIMARY KEY,
  package_id  INT NOT NULL REFERENCES packages(package_id) ON DELETE CASCADE,
  sku         TEXT NOT NULL,
  description TEXT,
  quantity    INT NOT NULL CHECK (quantity > 0)
);

-- ---------- Routing and last mile ----------
CREATE TABLE routes (
  route_id   SERIAL PRIMARY KEY,
  driver_id  INT NOT NULL REFERENCES drivers(driver_id),
  vehicle_id INT NOT NULL REFERENCES vehicles(vehicle_id),
  depot_id   INT NOT NULL REFERENCES facilities(facility_id),
  route_date DATE NOT NULL,
  status     TEXT NOT NULL DEFAULT 'PLANNED'
);

CREATE TABLE route_stops (
  stop_id       SERIAL PRIMARY KEY,
  route_id      INT NOT NULL REFERENCES routes(route_id) ON DELETE CASCADE,
  stop_sequence INT NOT NULL CHECK (stop_sequence > 0),
  address       TEXT NOT NULL,
  location      GEOGRAPHY(Point, 4326),
  status        TEXT NOT NULL DEFAULT 'PENDING',
  UNIQUE (route_id, stop_sequence)
);
CREATE INDEX idx_route_stops_location ON route_stops USING GIST (location);

CREATE TABLE package_stop_mappings (
  package_id INT NOT NULL REFERENCES packages(package_id) ON DELETE CASCADE,
  stop_id    INT NOT NULL REFERENCES route_stops(stop_id) ON DELETE CASCADE,
  PRIMARY KEY (package_id, stop_id)
);

-- ---------- Tracking log (append-only, partitioned by month) ----------
CREATE TABLE tracking_events (
  event_id    BIGSERIAL,
  package_id  INT NOT NULL REFERENCES packages(package_id),
  event_type  package_status NOT NULL,
  facility_id INT REFERENCES facilities(facility_id),
  driver_id   INT REFERENCES drivers(driver_id),
  location    GEOGRAPHY(Point, 4326),
  remarks     TEXT,
  event_ts    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (package_id, event_ts, event_id)
) PARTITION BY RANGE (event_ts);

CREATE TABLE tracking_events_default PARTITION OF tracking_events DEFAULT;
CREATE TABLE tracking_events_2026_10 PARTITION OF tracking_events
  FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE tracking_events_2026_11 PARTITION OF tracking_events
  FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE tracking_events_2026_12 PARTITION OF tracking_events
  FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

CREATE INDEX idx_tracking_events_pkg_ts ON tracking_events (package_id, event_ts DESC);

-- ---------- Proof of delivery ----------
CREATE TABLE proof_of_delivery (
  pod_id          SERIAL PRIMARY KEY,
  package_id      INT NOT NULL UNIQUE REFERENCES packages(package_id),
  stop_id         INT REFERENCES route_stops(stop_id),
  delivery_time   TIMESTAMPTZ NOT NULL DEFAULT now(),
  recipient_name  TEXT NOT NULL,
  delivery_status TEXT NOT NULL DEFAULT 'DELIVERED'
);