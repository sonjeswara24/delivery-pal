-- Small starter dataset (extend to ~200 packages in Phase 1)
INSERT INTO logistics_contractors (name, contact) VALUES ('SwiftFleet Logistics', 'ops@swiftfleet.example');

INSERT INTO facilities (type, name, address, city, postal_code, location) VALUES
  ('FULFILLMENT_CENTER', 'Bhiwandi Fulfillment Center', 'Bhiwandi Warehouse Zone', 'Thane', '421302', ST_SetSRID(ST_MakePoint(73.0630, 19.2813), 4326)::geography),
  ('SORTING_HUB',        'Mumbai Central Sorting Hub', 'Parel Industrial Estate', 'Mumbai', '400012', ST_SetSRID(ST_MakePoint(72.8397, 19.0076), 4326)::geography),
  ('DELIVERY_DEPOT',     'Andheri Delivery Depot',     'MIDC Andheri East',       'Mumbai', '400093', ST_SetSRID(ST_MakePoint(72.8777, 19.1136), 4326)::geography);

INSERT INTO drivers (name, phone, license_no, contractor_id) VALUES
  ('Ravi Kumar', '9000000001', 'MH02-2020-0001', 1),
  ('Anita Desai', '9000000002', 'MH02-2021-0002', 1);

INSERT INTO vehicles (plate_no, type, capacity_kg, contractor_id) VALUES
  ('MH02AB1234', 'VAN', 800, 1);

INSERT INTO customers (name, email, phone) VALUES
  ('Asha Patil', 'asha@example.com', '9100000001'),
  ('Rohan Mehta', 'rohan@example.com', '9100000002');

INSERT INTO orders (customer_id, total_amount) VALUES (1, 1499.00), (2, 799.00);

INSERT INTO packages (order_id, tracking_no, weight_kg, destination_address, destination_city, destination_postal_code, destination_location) VALUES
  (1, 'TRK1001', 1.2, 'Flat 12, Sea View Apartments, Versova', 'Mumbai', '400061', ST_SetSRID(ST_MakePoint(72.8130, 19.1330), 4326)::geography),
  (1, 'TRK1002', 0.6, 'Flat 12, Sea View Apartments, Versova', 'Mumbai', '400061', ST_SetSRID(ST_MakePoint(72.8130, 19.1330), 4326)::geography),
  (2, 'TRK1003', 2.5, '4 Lake Road, Powai',                    'Mumbai', '400076', ST_SetSRID(ST_MakePoint(72.9050, 19.1176), 4326)::geography);

INSERT INTO shipment_items (package_id, sku, description, quantity) VALUES
  (1, 'SKU-HEADPHONES', 'Wireless headphones', 1),
  (2, 'SKU-CASE', 'Phone case', 2),
  (3, 'SKU-KETTLE', 'Electric kettle', 1);

-- Events go through the triggers, so the status lifecycle is enforced.
-- event_ts is set explicitly so the history order is unambiguous.

-- TRK1001: delivered
INSERT INTO tracking_events (package_id, event_type, facility_id, remarks, event_ts) VALUES
  (1, 'PACKED',           1, 'Packed at fulfillment center', now() - interval '7 hours'),
  (1, 'PICKED_UP',        1, 'Picked up by contractor',      now() - interval '6 hours'),
  (1, 'AT_SORTING_HUB',   2, 'Scanned at Mumbai Central',    now() - interval '5 hours'),
  (1, 'IN_TRANSIT',       2, 'Left sorting hub',             now() - interval '4 hours'),
  (1, 'AT_DEPOT',         3, 'Arrived at Andheri depot',     now() - interval '3 hours'),
  (1, 'OUT_FOR_DELIVERY', 3, 'Out for delivery',             now() - interval '2 hours'),
  (1, 'DELIVERED',        3, 'Delivered to customer',        now() - interval '1 hour');

-- TRK1002: out for delivery
INSERT INTO tracking_events (package_id, event_type, facility_id, remarks, event_ts) VALUES
  (2, 'PACKED',           1, NULL, now() - interval '6 hours'),
  (2, 'PICKED_UP',        1, NULL, now() - interval '5 hours'),
  (2, 'AT_SORTING_HUB',   2, NULL, now() - interval '4 hours'),
  (2, 'IN_TRANSIT',       2, NULL, now() - interval '3 hours'),
  (2, 'AT_DEPOT',         3, NULL, now() - interval '2 hours'),
  (2, 'OUT_FOR_DELIVERY', 3, NULL, now() - interval '30 minutes');

-- TRK1003: just packed
INSERT INTO tracking_events (package_id, event_type, facility_id, remarks, event_ts) VALUES
  (3, 'PACKED', 1, 'Packed at fulfillment center', now() - interval '10 minutes');

-- One route for today's rider, with one stop
INSERT INTO routes (driver_id, vehicle_id, depot_id, route_date, status)
  VALUES (1, 1, 3, CURRENT_DATE, 'IN_PROGRESS');

INSERT INTO route_stops (route_id, stop_sequence, address, location) VALUES
  (1, 1, 'Flat 12, Sea View Apartments, Versova', ST_SetSRID(ST_MakePoint(72.8130, 19.1330), 4326)::geography);

INSERT INTO package_stop_mappings (package_id, stop_id) VALUES (2, 1);

-- TRK1001 is delivered, so give it a proof of delivery record
INSERT INTO proof_of_delivery (package_id, recipient_name) VALUES (1, 'Asha Patil');