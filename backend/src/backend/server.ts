import Fastify from "fastify";
import cors from "@fastify/cors";
import pg from "pg";
import { z } from "zod";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const app = Fastify({ logger: true });
await app.register(cors, {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true,
});

const STATUSES = [
  "BOOKED", "PACKED", "PICKED_UP", "AT_SORTING_HUB", "IN_TRANSIT", "AT_DEPOT",
  "OUT_FOR_DELIVERY", "ARRIVING", "DELIVERED", "FAILED_ATTEMPT", "RETURNED", "CANCELLED",
] as const;

const idParam = z.object({ id: z.coerce.number().int().positive() });

// Turn database errors (including your trigger errors) into clean HTTP responses
app.setErrorHandler((err: any, _req, reply) => {
  if (err instanceof z.ZodError)
    return reply.code(400).send({ error: "Invalid input", details: err.issues });
  if (err.code === "23514") return reply.code(409).send({ error: err.message }); // invalid status transition
  if (err.code === "23503") return reply.code(404).send({ error: err.message }); // package/facility/driver not found
  if (err.code === "23505") return reply.code(409).send({ error: err.message }); // duplicate (e.g. POD exists)
  if (err.code === "P0001") return reply.code(403).send({ error: err.message }); // e.g. append-only
  app.log.error(err);
  return reply.code(500).send({ error: "Internal server error" });
});

app.get("/health", async () => ({ ok: true }));

// List packages
app.get("/packages", async () => {
  const r = await pool.query(
    `SELECT package_id, order_id, tracking_no, weight_kg, current_status,
            destination_address, destination_city, destination_postal_code
     FROM packages ORDER BY package_id`
  );
  return r.rows;
});

// Track a package: details + event timeline
app.get("/track/:trackingNo", async (req, reply) => {
  const { trackingNo } = z.object({ trackingNo: z.string().min(1) }).parse(req.params);

  const pkg = await pool.query(
    `SELECT package_id, order_id, tracking_no, weight_kg, current_status,
            destination_address, destination_city, destination_postal_code,
            ST_Y(destination_location::geometry) AS dest_lat,
            ST_X(destination_location::geometry) AS dest_lng
     FROM packages WHERE tracking_no = $1`,
    [trackingNo]
  );
  if (pkg.rowCount === 0) return reply.code(404).send({ error: "Package not found" });

  const events = await pool.query(
    `SELECT e.event_id, e.event_type, e.remarks, e.event_ts,
            f.name AS facility_name, d.name AS driver_name,
            ST_Y(e.location::geometry) AS lat, ST_X(e.location::geometry) AS lng
     FROM tracking_events e
     LEFT JOIN facilities f ON f.facility_id = e.facility_id
     LEFT JOIN drivers d ON d.driver_id = e.driver_id
     WHERE e.package_id = $1
     ORDER BY e.event_ts DESC, e.event_id DESC`,
    [pkg.rows[0].package_id]
  );
  return { package: pkg.rows[0], events: events.rows };
});

// Create a package for an existing order
app.post("/packages", async (req, reply) => {
  const b = z.object({
    order_id: z.number().int().positive(),
    tracking_no: z.string().min(3),
    weight_kg: z.number().positive(),
    destination_address: z.string().min(1),
    destination_city: z.string().min(1),
    destination_postal_code: z.string().min(1),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
  }).parse(req.body);

  const r = await pool.query(
    `INSERT INTO packages (order_id, tracking_no, weight_kg, destination_address,
        destination_city, destination_postal_code, destination_location)
     VALUES ($1,$2,$3,$4,$5,$6, ST_SetSRID(ST_MakePoint($7::float8,$8::float8),4326)::geography)
     RETURNING package_id, order_id, tracking_no, weight_kg, current_status`,
    [b.order_id, b.tracking_no, b.weight_kg, b.destination_address,
     b.destination_city, b.destination_postal_code, b.lng ?? null, b.lat ?? null]
  );
  return reply.code(201).send(r.rows[0]);
});

// Add a scan event. Your trigger validates the status change and updates the package.
app.post("/packages/:id/events", async (req, reply) => {
  const { id } = idParam.parse(req.params);
  const b = z.object({
    event_type: z.enum(STATUSES),
    facility_id: z.number().int().positive().optional(),
    driver_id: z.number().int().positive().optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    remarks: z.string().optional(),
  }).parse(req.body);

  const r = await pool.query(
    `INSERT INTO tracking_events (package_id, event_type, facility_id, driver_id, location, remarks)
     VALUES ($1,$2,$3,$4, ST_SetSRID(ST_MakePoint($5::float8,$6::float8),4326)::geography, $7)
     RETURNING event_id, package_id, event_type, event_ts`,
    [id, b.event_type, b.facility_id ?? null, b.driver_id ?? null,
     b.lng ?? null, b.lat ?? null, b.remarks ?? null]
  );
  return reply.code(201).send(r.rows[0]);
});

// Mark delivered: event + proof of delivery in ONE transaction
app.post("/packages/:id/deliver", async (req, reply) => {
  const { id } = idParam.parse(req.params);
  const b = z.object({
    recipient_name: z.string().min(1),
    driver_id: z.number().int().positive().optional(),
    stop_id: z.number().int().positive().optional(),
  }).parse(req.body);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO tracking_events (package_id, event_type, driver_id, remarks)
       VALUES ($1,'DELIVERED',$2,'Delivered')`,
      [id, b.driver_id ?? null]
    );
    const pod = await client.query(
      `INSERT INTO proof_of_delivery (package_id, stop_id, recipient_name)
       VALUES ($1,$2,$3) RETURNING *`,
      [id, b.stop_id ?? null, b.recipient_name]
    );
    await client.query("COMMIT");
    return reply.code(201).send(pod.rows[0]);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
});

await app.listen({ port: 3001, host: "0.0.0.0" });