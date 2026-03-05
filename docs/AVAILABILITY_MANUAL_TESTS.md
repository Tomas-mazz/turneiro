## Availability manual test checklist

Use this checklist to validate `getAvailabilityService` and related flows.

All examples assume:
- Business has at least one active service with duration in the 30–60 min range.
- Default `slotIntervalMinutes` is 15 unless stated otherwise.

### 1. Simple working hours (no breaks, no blocks)

- **Setup**
  - Set working hours for a given day (e.g. Monday) to `09:00–12:00`, `isClosed = false`, without lunch break.
  - Ensure there are **no blocked slots** created for that date.
  - Ensure there are **no appointments** on that date.
- **Expected**
  - On the public booking page, selecting that date shows a continuous list of slots inside `09:00–12:00`, spaced by `slotIntervalMinutes`.
  - No slots appear **before** `09:00` or **after** `12:00`.

### 2. Working hours with a break (e.g. lunch)

- **Setup**
  - For a given day, configure working hours `09:00–21:00`.
  - Set a lunch break with `lunchStart = 10:00`, `lunchEnd = 13:00`.
  - No blocked slots and no appointments on that date.
- **Expected**
  - Public booking shows slots only in the ranges:
    - `09:00–10:00`
    - `13:00–21:00`
  - No slots appear inside the break (`10:00–13:00`).

### 3. Business-wide blocks vs per-employee blocks

**Scenario A – Business-wide block**
- **Setup**
  - Business with multiple employees.
  - For a given date, create a `FULL_DAY` block with scope “Toda la tienda” (business-wide).
- **Expected**
  - In the public booking flow, that date should show **no available slots** for any employee.
  - On the dashboard, the date appears in the “Bloqueos próximos (60 días)” list.

**Scenario B – Per-employee full-day block**
- **Setup**
  - Same business, at least 2 employees.
  - Owner/staff creates a `FULL_DAY` block with scope “Solo mi calendario” for **Employee A** only.
- **Expected**
  - On the dashboard, “Bloqueos próximos (60 días)” shows the block with the configured date.
  - In the public booking flow:
    - Employee A: shows **no slots** for that date.
    - Employee B (and others): still show slots for that date (respecting working hours).
  - The weekly strip still marks the date as available if at least one employee has slots.

**Scenario C – Per-employee time-range block**
- **Setup**
  - For a given date with normal working hours (e.g. `09:00–18:00`), owner/staff creates a `TIME_SLOT` block `10:00–12:00` with scope “Solo mi calendario” for Employee A.
- **Expected**
  - Public booking, per-employee view:
    - Employee A: has no slots in `10:00–12:00` but has slots before and after (respecting service duration).
    - Other employees: can still offer slots in `10:00–12:00`.

### 4. Existing appointments vs changes in hours and blocks

- **Setup**
  - Create an appointment for a given day at a specific time (e.g. `09:30–10:00`) for an employee or the single-resource business.
  - After it is created, change working hours or add blocks.

**Case A – Change working hours**
- Change the day’s working hours so that the appointment is:
  - Completely inside the new range.
  - Completely outside the new range (e.g. move hours to evening).
- **Expected**
  - The appointment remains visible in the dashboard appointment list (no cancellation, no data loss).
  - Availability for that date:
    - Only new free slots are affected by the new working hours.
    - The booked slot does **not** reappear as available.

**Case B – Add blocks that overlap existing appointments**
- Add a `TIME_SLOT` block or `FULL_DAY` block that overlaps the existing appointment.
- **Expected**
  - The existing appointment remains UPCOMING (not automatically cancelled).
  - Availability for that date no longer offers new bookings that would overlap the blocked range.

### 5. Changes to `slotIntervalMinutes`

- **Setup**
  - Note the current `slotIntervalMinutes` in `BusinessSettings`.
  - For a given day with no appointments:
    - Observe the slots shown in the public booking flow.
  - Change `slotIntervalMinutes` (e.g. from 15 → 30).
- **Expected**
  - After the change, reload availability:
    - New availability uses the new interval (e.g. `09:00`, `09:30`, `10:00`, ...).
  - Any pre-existing appointments (created before the change) keep their original start/end times.
  - Those existing appointments still mark their times as unavailable for new bookings.

