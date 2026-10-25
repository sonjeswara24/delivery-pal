-- Allowed status transitions (the lifecycle both backend and frontend share)
CREATE TABLE status_transitions (
  from_status package_status NOT NULL,
  to_status   package_status NOT NULL,
  PRIMARY KEY (from_status, to_status)
);

INSERT INTO status_transitions VALUES
  ('BOOKED', 'PACKED'),
  ('PACKED', 'PICKED_UP'),
  ('PICKED_UP', 'AT_SORTING_HUB'),
  ('AT_SORTING_HUB', 'IN_TRANSIT'),
  ('IN_TRANSIT', 'AT_SORTING_HUB'),   -- multi-hub journeys
  ('IN_TRANSIT', 'AT_DEPOT'),
  ('AT_DEPOT', 'OUT_FOR_DELIVERY'),
  ('OUT_FOR_DELIVERY', 'ARRIVING'),
  ('OUT_FOR_DELIVERY', 'DELIVERED'),
  ('OUT_FOR_DELIVERY', 'FAILED_ATTEMPT'),
  ('ARRIVING', 'DELIVERED'),
  ('ARRIVING', 'FAILED_ATTEMPT'),
  ('FAILED_ATTEMPT', 'OUT_FOR_DELIVERY'),
  ('FAILED_ATTEMPT', 'RETURNED');

-- 1) Validate the transition AND keep packages.current_status in sync.
--    Done in one BEFORE trigger (not AFTER) so multi-row inserts see each
--    row's effect on the next, and FOR UPDATE stops two scans racing.
CREATE OR REPLACE FUNCTION apply_tracking_event() RETURNS trigger AS $$
DECLARE
  cur package_status;
BEGIN
  SELECT current_status INTO cur
  FROM packages WHERE package_id = NEW.package_id FOR UPDATE;

  IF NOT EXISTS (
    SELECT 1 FROM status_transitions
    WHERE from_status = cur AND to_status = NEW.event_type
  ) THEN
    RAISE EXCEPTION 'Invalid status transition for package %: % -> %',
      NEW.package_id, cur, NEW.event_type
      USING ERRCODE = 'check_violation';
  END IF;

  UPDATE packages SET current_status = NEW.event_type
  WHERE package_id = NEW.package_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_apply_event
  BEFORE INSERT ON tracking_events
  FOR EACH ROW EXECUTE FUNCTION apply_tracking_event();

-- 2) The log is append-only: no updates, no deletes
CREATE OR REPLACE FUNCTION block_event_changes() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'tracking_events is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_events_append_only
  BEFORE UPDATE OR DELETE ON tracking_events
  FOR EACH ROW EXECUTE FUNCTION block_event_changes();