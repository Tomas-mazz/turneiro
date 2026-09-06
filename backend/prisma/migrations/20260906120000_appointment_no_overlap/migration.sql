-- Prevent double booking at the database level.
--
-- Availability is computed by reading working hours, blocks and existing appointments, then
-- inserting. Two concurrent requests for the same slot can both pass that read before either
-- commits, so overlap prevention cannot be guaranteed in application code alone. This constraint
-- is the backstop; appointments.service.ts still checks availability first to return a friendly
-- error rather than relying on a constraint violation for the common case.
--
-- Notes:
--  * btree_gist is required to mix equality operators (=) with a range overlap operator (&&).
--  * "employeeId" is nullable and in SQL `NULL WITH =` never conflicts, so business-wide bookings
--    with no assigned employee would be unprotected. COALESCE to '' collapses them into one
--    comparable group. Empty string is safe: ids are cuids and never empty.
--  * startTime/endTime are TIMESTAMP(3) without time zone, so tsrange (not tstzrange) is correct.
--  * '[)' makes ranges half-open: a booking ending at 10:00 does not conflict with one starting
--    at 10:00.
--  * CANCELLED appointments free their slot and must not block new bookings.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Appointment"
  ADD CONSTRAINT "appointment_no_overlap"
  EXCLUDE USING gist (
    "businessId" WITH =,
    (COALESCE("employeeId", '')) WITH =,
    (tsrange("startTime", "endTime", '[)')) WITH &&
  )
  WHERE ("status" <> 'CANCELLED');
