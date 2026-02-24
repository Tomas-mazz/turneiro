# Roles & Permissions

## Client (End User)
**Can do:**
- View business's public booking page
- Book available appointment slots
- Cancel own appointments (with 24-hour rule)
- Receive WhatsApp confirmations and reminders
- Access cancellation link from confirmation

**Cannot do:**
- View other clients' appointments
- Access any dashboard
- Modify business settings or schedules

## Platform Admin (Central Admin Panel)

**Who:** The admin is the **owner of the platform/project**. They are the one who creates new businesses (shops), assigns login credentials to each business owner, and manages everything. Each business owner only has access to their own shop's dashboard; they cannot create other businesses or access the admin panel.

**Can do (everything the business owner cannot):**
- **Manage Clients/Businesses:**
  - Create new clients (Business Name, Industry/Rubro, Photo, Colors, Working Hours)
  - Generate credentials (User/Pass) for the Client Panel
  - Edit any client's data
  - Change business category/rubro (rare; change must go through admin)
  - View all clients and their configured services
- **Configure Payment & Cancellation Rules (Per Client):**
  - Payment rules per client (required, type, percentage, etc.)
  - Cancellation rules (free window, fees, refund policy)
  - All rules set manually by admin based on business owner's requirements
- **Manage Multi-Employee Support:**
  - Add multiple employees within the same business (applies to all rubros: barbers, manicurists, masseuses, etc.)
  - Set up working hours per employee
  - Assign services that each employee can provide
  - Business owner must contact admin to add new employees (not self-service in MVP)
  - **Note:** "Multi-employee" is the correct term (not just "multi-barber"), as this applies to all business categories
  - **Post-MVP:** Set up Google Calendar OAuth for each employee so they have individual calendars
- **Manage Services:**
  - Create and delete services for any client
  - Edit service name, price, duration, activate/deactivate
  - Assign services to clients
- **Manage Appointments (Turns):**
  - View all turns from all clients
  - Cancel any turn (with mandatory reason)
  - Change turn status
  - Consult cancellation history
- **Manage Blocks:**
  - Create schedule/day blocks for any client
  - Edit or delete existing blocks
- **Manage Branding & Working Hours:**
  - Edit business photo, cover, primary colors, texts
  - Configure working hours per day (and lunch breaks)
- **Security:**
  - All actions validated via panel; no direct database access.

## Business Owner (Client Panel – MVP Dashboard Only)
**In the MVP, the owner dashboard allows ONLY:**

1. **Edit service prices** – Change the price of each product/service of their business.
2. **Edit service duration** – Change the duration (e.g. 15–120 min) of each product/service.
3. **Link to view Google Calendar** – Access the link to open/view their Google Calendar (where appointments are synced).
   - Appointments assigned to an employee sync to that employee's calendar (if they have Google connected); otherwise to owner's calendar.
4. **Cancel appointments** – Cancel appointments within their own business (by phone lookup).
   - Can cancel appointments assigned to any employee within their business.
   - **Cannot** cancel appointments from other businesses (enforced by `requireBusinessOwner` middleware).
   - Mandatory reason required.
   - Automatically processes refunds if payment was made.
   - Automatically deletes event from the correct Google Calendar (owner's or assigned employee's).

**Everything else is done by Admin:**
- Create/edit/delete services, service names, activate/deactivate → Admin
- Working hours, blocks, branding, payment rules, cancellation rules → Admin
- View appointments (owner sees them in Google Calendar) → link to GC
- Multi-employee, employee profiles, staff credentials (Employee–User link) → Admin

**Cannot do (MVP):**
- Create or delete services
- Change service names
- Configure working hours or blocks
- Change branding (photo, colors, texts)
- Configure payment or cancellation rules
- Access admin panel
- Cancel appointments from other businesses (can only cancel within own business)
- Add/remove employees (must contact admin)

## Employee (Staff – Dashboard)

Staff are employees who have login credentials (email/password) created by Admin when adding the employee. They access the same `/dashboard` as the owner but with a reduced scope.

**Can do:**
- **Connect their own Google Calendar** – OAuth link; appointments booked with them sync to their calendar (so they see only their reservations).
- **Block days or time slots** – Same as owner (business-wide or per-employee depending on backend support).
- **Cancel their own appointments** – Lookup by client phone; they only see and can cancel appointments assigned to them (`appointment.employeeId` = their linked employee). Mandatory reason; refund and calendar delete as for owner.

**Cannot do:**
- Edit service prices or duration (only owner can).
- See or cancel appointments assigned to other employees or unassigned.
- Access admin panel.

**Technical:** Each staff user is linked to one `Employee` via `Employee.userId`. Lookup and cancel APIs filter by this employee when the user role is STAFF.

## Panel Comparison Summary

| Function | Admin Panel | Owner Dashboard | Staff Dashboard |
| :--- | :--- | :--- | :--- |
| Create/delete clients | ✅ | ❌ | ❌ |
| Create/delete services | ✅ | ❌ | ❌ |
| Edit service **price** | ✅ | ✅ (own only) | ❌ |
| Edit service **duration** | ✅ | ✅ (own only) | ❌ |
| Edit service name / activate-deactivate | ✅ | ❌ | ❌ |
| Working hours, blocks | ✅ | ❌ | ❌ (admin sets) |
| Branding (photo, colors, texts) | ✅ | ❌ | ❌ |
| Payment / cancellation rules | ✅ | ❌ | ❌ |
| Link to view Google Calendar | N/A | ✅ | ✅ (own only) |
| Connect Google Calendar OAuth | N/A | ✅ | ✅ |
| Cancel appointments (by phone) | ✅ | ✅ (own business, any) | ✅ (own only) |
| View appointments (centralized list) | ✅ | ❌ (sees in GC) | ❌ (sees in own GC) |
| Add/remove employees | ✅ | ❌ (contact admin) | ❌ |

## Cancellation and calendar flow (current)

**Owner cancels any appointment in the business**
1. Owner looks up by client phone, selects appointment, enters reason.
2. System verifies `appointment.businessId === owner.businessId`.
3. Cancels, processes refund, deletes event from the calendar it was synced to (owner's or employee's per `syncedToUserId`).

**Staff cancels their own appointment**
1. Staff looks up by client phone; API returns only appointments where `appointment.employeeId` matches their linked employee.
2. They select and enter reason; backend verifies again that the appointment is assigned to them.
3. If not assigned to them: error "No podés cancelar esta cita. Solo podés cancelar turnos asignados a vos."
4. If yes: cancels, refund, deletes from that employee's Google Calendar.

**Google Calendar sync:** On create, if the appointment has an `employeeId` and that employee has a linked User with Google Calendar connected, the event is created on that user's calendar; otherwise on the owner's. `Appointment.syncedToUserId` stores which user's calendar was used so cancellation deletes from the correct calendar.
