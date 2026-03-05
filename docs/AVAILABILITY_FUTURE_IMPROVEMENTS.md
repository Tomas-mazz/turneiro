## Availability – Future Improvements and Recommendations

This document captures optional, non-blocking improvements around the availability engine and related UX. It is meant as a guide for future iterations, not as required work for the current milestone.

---

### 1. Automated tests for `getAvailabilityService`

**Goal:** Replace the current manual-only verification with a small but robust automated test suite that protects availability rules over time.

- **Recommended scope for tests**
  - **Simple working hours (no breaks)**  
    - Given working hours `09:00–12:00`, no blocks, no appointments.  
    - Assert that generated slots are inside that range and respect `slotIntervalMinutes`.
  - **Working hours with break (lunch)**  
    - Given working hours `09:00–21:00` and lunch break `10:00–13:00`.  
    - Assert that generated slots exist only in `09:00–10:00` and `13:00–21:00`.
  - **Business-wide vs per-employee blocks**  
    - `FULL_DAY` + `TIME_SLOT` blocks with `employeeId = null` and with a specific `employeeId`.  
    - Assert:
      - Business-wide blocks affect all employees and non-employee-scoped queries.  
      - Per-employee blocks only affect that employee (unless the block is global).
  - **Existing appointments vs new availability**  
    - Create appointments that fall:
      - Fully inside working hours.  
      - Across lunch break.  
    - Assert:
      - Those intervals are never generated as free slots.  
      - Changing working hours does not make old appointments reappear as free.
  - **Changes in `slotIntervalMinutes`**  
    - Create appointments with a given interval (e.g. 15 minutes).  
    - Change `slotIntervalMinutes` (e.g. to 30).  
    - Assert:
      - New free slots reflect the new interval.  
      - Existing appointments remain untouched and still block their time windows.

- **Implementation notes**
  - Use an in-memory or test-specific database (separate schema) with Prisma migrations.  
  - Seed only the minimum data needed: `Business`, `BusinessSettings`, `WorkingHours`, `Employees`, `BlockedSlot`, `Appointment`.  
  - Prefer **service-level tests** (calling `getAvailabilityService` directly) instead of hitting HTTP endpoints.

---

### 2. Monitoring and observability around availability

**Goal:** Detect and debug availability issues quickly in real environments (staging/production).

- **Suggested metrics / logs**
  - Log structured entries for calls to `/api/availability` and `/api/availability/week`:
    - `businessId`, `businessSlug`, `serviceId`, `employeeId` (if any), `date`, `slotsReturned`.  
    - Optionally, flags like `hasWorkingHours`, `hasBusinessBlocks`, `hasEmployeeBlocks`, `appointmentsCount`.
  - Track anomalies:
    - Days with **zero** slots while working hours are configured and no obvious blocks exist.  
    - Extremely high slot counts for a single day (might indicate misconfigured working hours or intervals).
  - Aggregate metrics (via logs or external tooling):
    - Average number of slots per day per business.  
    - Percentage of days with any availability vs closed days.

- **Debugging workflow suggestion**
  - When an owner reports “no slots available”:
    1. Check logs for that `businessSlug` and date.  
    2. Inspect whether working hours are set, which blocks apply, and whether appointments occupy the day.  
    3. Manually re-run the same `getAvailabilityService` call in a dev environment with the same inputs.

---

### 3. Product documentation for owners and staff

**Goal:** Make the rules of availability, working hours, and blocks understandable to non-technical users (owners and staff).

- **Key concepts to document (business-facing)**
  - **Working hours vs breaks**  
    - Working hours define when the business can offer appointments.  
    - Breaks (e.g. lunch) are “holes” inside the day where no slots are offered.
  - **Business-wide blocks vs personal (calendar) blocks**  
    - Business-wide:
      - Hide the full day or range for **all** employees on the booking page.  
      - Used for holidays, maintenance, etc.  
    - Personal:
      - Hide only one person’s calendar (owner or staff), without affecting the rest.  
      - Used for vacations or personal commitments.
  - **Existing appointments**  
    - Do not disappear when working hours change or new blocks are created.  
    - Still appear in the dashboard and remain valid until manually cancelled.
  - **Slot interval**  
    - Controls how dense the available time grid is (e.g. every 15, 20, 30 minutes).  
    - Changing this affects only **new** availability, not old bookings.

- **Recommended formats**
  - A short “Availability rules” section in an internal docs page or help center article.  
  - Tooltips or inline help in the dashboard near:
    - “Horarios de apertura” section.  
    - “Bloquear días u horarios” section (explaining BUSINESS vs SELF).

---

### 4. Future evolution ideas

These are not required now, but may be useful as the product grows:

- **Per-service or per-employee overrides**  
  - Different slot intervals or availability patterns per service or per employee.
- **Time-zone awareness**  
  - Introduce a business-level timezone and ensure all availability logic is based on it.  
  - Expose this clearly in the UI to avoid confusion for owners and clients.
- **Rate limiting and abuse prevention**  
  - Apply rate limiting on `/api/availability` endpoints to avoid scraping or accidental overload from UIs polling too often.

