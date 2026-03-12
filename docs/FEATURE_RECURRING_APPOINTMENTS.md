# FEATURE – Turnos Fijos (Recurring Appointments)

## Context

This feature allows clients (USER role) to request a **fixed/recurring appointment slot** with a specific employee. For example: "Every Friday at 14:00" or "Every 2 weeks on Monday at 10:00".

The business owner/staff can approve or reject the request. Once approved, appointments are automatically created on a monthly basis.

---

## User Stories

### Client (USER)
- As a client, I want to request a fixed slot so I always have my preferred time reserved.
- As a client, I want to choose the day, time, frequency, and employee for my fixed slot.
- As a client, I want to receive an email when my request is approved or rejected.
- As a client, I want to cancel a specific occurrence without canceling the entire recurring appointment.
- As a client, I want to see my active fixed slots in my account page.

### Owner/Staff
- As an owner/staff, I want to see pending fixed slot requests in my dashboard.
- As an owner/staff, I want to approve or reject requests.
- As an owner/staff, I want to see all active fixed slots assigned to me (or my business).
- As an owner/staff, I want to pause or cancel a fixed slot entirely.
- As an owner/staff, I want the system to automatically create appointments monthly.

---

## Functional Requirements

### 1. Request Fixed Slot (Client)

**Location:** `/account` page → New section "Solicitar Turno Fijo"

**Form fields:**
- Service (dropdown)
- Employee (dropdown, optional based on business config)
- Day of week (Monday–Sunday)
- Time (based on employee/business availability)
- Frequency:
  - Weekly (every week)
  - Biweekly (every 2 weeks)
  - Monthly (same day of month, e.g., first Friday)

**Validation:**
- Client must be logged in (USER role).
- Selected time must be within employee's working hours.

### 2. Manage Requests (Owner/Staff Dashboard)

**Location:** `/setting` → New section "Turnos Fijos Solicitados"

**Features:**
- List of pending requests showing:
  - Client name, phone
  - Service
  - Day + time + frequency
  - Employee (if selected)
- Actions: **Approve** or **Reject**
- On reject: optionally send reason via email

### 3. Active Fixed Slots (Owner/Staff Dashboard)

**Location:** `/setting` → Below requests, section "Turnos Fijos Activos"

**Features:**
- List of approved recurring appointments
- Show: client, service, schedule (e.g., "Fridays 14:00, weekly")
- Actions:
  - **Pause** (temporarily stop creating new appointments)
  - **Cancel** (end the recurring appointment entirely)

### 4. Automatic Appointment Creation

**Logic:**
- Appointments are created **month by month**.
- **1 week before the end of the current month**, the system creates all appointments for the next month.
- Example: On Jan 24th, create all February appointments for active fixed slots.

**Conflict handling:**
- If a slot conflicts with an existing appointment, **skip that occurrence** (don't create it).
- Optionally: notify the client that a specific date was skipped due to conflict.

### 5. Reminders

**2 days before each appointment:**
- Send email to client with:
  - Appointment details (date, time, service, employee)
  - Button to **confirm** attendance
  - Button to **cancel this occurrence only**

### 6. Cancellations

**Client cancels a single occurrence:**
- The recurring appointment remains active.
- Only that specific date is cancelled.
- Follow existing cancellation flow (refund if applicable).

**Owner/Staff cancels entire fixed slot:**
- All future appointments are cancelled.
- Client receives email notification.

**Owner/Staff pauses fixed slot:**
- No new appointments are created.
- Existing appointments remain.
- Can be resumed later.

### 7. Employee/Schedule Changes

**If employee's working hours change or employee is removed:**
- Send email to affected clients.
- Message: "Your fixed slot is no longer available due to schedule changes. Please request a new fixed slot."
- Automatically pause or cancel the affected recurring appointments.

---

## Data Model

```prisma
model RecurringAppointment {
  id              String    @id @default(cuid())
  businessId      String
  clientUserId    String
  employeeId      String?
  serviceId       String
  
  dayOfWeek       Int       // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  time            String    // "14:00" (HH:MM format)
  frequency       String    // "WEEKLY", "BIWEEKLY", "MONTHLY"
  
  status          String    // "PENDING", "APPROVED", "REJECTED", "PAUSED", "CANCELLED"
  rejectionReason String?   // Optional reason when rejected
  
  startDate       DateTime  // When the recurring appointment starts
  endDate         DateTime? // Optional end date (null = indefinite)
  lastGeneratedMonth DateTime? // Track last month appointments were generated for
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  business   Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  clientUser User      @relation(fields: [clientUserId], references: [id], onDelete: Cascade)
  employee   Employee? @relation(fields: [employeeId], references: [id], onDelete: SetNull)
  service    Service   @relation(fields: [serviceId], references: [id], onDelete: Cascade)

  @@index([businessId])
  @@index([clientUserId])
  @@index([employeeId])
  @@index([status])
}
```

**Changes to existing models:**

```prisma
model Appointment {
  // ... existing fields ...
  recurringAppointmentId String? // Link to parent recurring appointment
  recurringAppointment   RecurringAppointment? @relation(fields: [recurringAppointmentId], references: [id], onDelete: SetNull)
}
```

---

## API Endpoints

### Client endpoints (public, requires USER auth)
- `POST /recurring-appointments` – Create request
- `GET /recurring-appointments/mine` – List client's recurring appointments
- `DELETE /recurring-appointments/:id` – Cancel own recurring appointment

### Owner/Staff endpoints (requires OWNER/STAFF auth)
- `GET /recurring-appointments` – List all for business (filtered by status)
- `PATCH /recurring-appointments/:id/approve` – Approve request
- `PATCH /recurring-appointments/:id/reject` – Reject request (with optional reason)
- `PATCH /recurring-appointments/:id/pause` – Pause recurring appointment
- `PATCH /recurring-appointments/:id/resume` – Resume paused appointment
- `DELETE /recurring-appointments/:id` – Cancel recurring appointment

---

## Email Notifications

### To Client
1. **Request submitted** – Confirmation that request is pending review
2. **Request approved** – Fixed slot confirmed, first appointments created
3. **Request rejected** – With optional reason
4. **Reminder (2 days before)** – Appointment details + confirm/cancel buttons
5. **Fixed slot cancelled by business** – Notification with reason
6. **Schedule conflict** – Notification when specific date skipped

### To Owner/Staff
1. **New request received** – Client wants a fixed slot
2. **Client cancelled occurrence** – Notification that client cancelled a specific date

---

## UI Components

### Client Account Page (`/account`)
- New section: "Mis Turnos Fijos"
  - List of active/pending recurring appointments
  - Status badge (Pendiente, Aprobado, Rechazado, Pausado)
- New button: "Solicitar Turno Fijo" → Opens form/modal

### Owner/Staff Dashboard (`/setting`)
- New section: "Turnos Fijos Solicitados" (pending requests)
- New section: "Turnos Fijos Activos" (approved, with pause/cancel actions)

---

## Cron Jobs / Background Tasks

Using existing `queue.service.ts` (BullMQ):

1. **Monthly appointment generator** (runs daily or weekly)
   - Check if we're within 1 week of month end
   - For each active recurring appointment, generate next month's appointments
   - Skip dates with conflicts

2. **Reminder sender** (runs daily)
   - Find appointments 2 days away that are from recurring appointments
   - Send reminder emails

---

## Implementation Phases

### Phase 1 – MVP
- [ ] Prisma schema: Add `RecurringAppointment` model
- [ ] Backend: CRUD endpoints for recurring appointments
- [ ] Backend: Approve/reject logic
- [ ] Frontend: Client form to request fixed slot
- [ ] Frontend: Owner/Staff view pending requests
- [ ] Frontend: Owner/Staff approve/reject
- [ ] Email: Request approved/rejected notifications

### Phase 2 – Automation
- [ ] Cron job: Monthly appointment generation
- [ ] Conflict detection and skip logic
- [ ] Email: Reminders 2 days before

### Phase 3 – Full Features
- [ ] Pause/resume functionality
- [ ] Biweekly and monthly frequencies
- [ ] Handle employee schedule changes
- [ ] Client cancel single occurrence vs entire series
- [ ] History/log of generated appointments

---

## Open Questions

1. Should biweekly appointments start from a specific date or align to calendar weeks?
2. What happens if service price changes? Apply new price to future appointments?
3. Should there be a limit on how many fixed slots a client can have?
4. Should the system auto-generate appointments further ahead (e.g., 2-3 months)?

---

## Rules for keeping this file up to date

1. **When starting a task**, mark the relevant checklist item with `[IN PROGRESS]`.
2. **When completing a task**, change to `[X]` and add a brief note if needed.
3. **When decisions change**, update the relevant section and add a note with the date.
4. **Before merging**, ensure all checklists match the actual implementation.
