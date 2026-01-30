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
**Can do (everything the owner cannot):**
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
   - **MVP scope:** All appointments sync to owner's calendar.
   - **Post-MVP:** When multi-employee is implemented, each employee will have their own calendar; owner can view all or link to their own.
4. **Cancel appointments** – Cancel appointments within their own business by entering appointment ID.
   - Can cancel appointments assigned to any employee within their business.
   - **Cannot** cancel appointments from other businesses (enforced by `requireBusinessOwner` middleware).
   - Mandatory reason required.
   - Automatically processes refunds if payment was made.
   - Automatically deletes event from Google Calendar (owner's in MVP; assigned employee's in post-MVP).

**Everything else is done by Admin:**
- Create/edit/delete services, service names, activate/deactivate → Admin
- Working hours, blocks, branding, payment rules, cancellation rules → Admin
- View appointments (owner sees them in Google Calendar) → link to GC
- Multi-employee, employee profiles, employee Google Calendar setup → Admin (not in MVP; planned for post-MVP)

**Cannot do (MVP):**
- Create or delete services
- Change service names
- Configure working hours or blocks
- Change branding (photo, colors, texts)
- Configure payment or cancellation rules
- Access admin panel
- Cancel appointments from other businesses (can only cancel within own business)
- Add/remove employees (must contact admin)

## Employee (Staff – Post-MVP Only)

**Note:** Employee role is not implemented in MVP. This is the planned architecture for post-MVP.

**Will be able to do (Post-MVP):**
- View their own Google Calendar with assigned appointments
- See their schedule and upcoming appointments
- Connect their personal Google Calendar via OAuth

**Cannot do:**
- Cancel appointments (must ask owner to cancel via appointment ID)
- Edit services or prices
- Access owner dashboard
- View or cancel appointments from other employees

## Panel Comparison Summary (MVP)

| Function | Admin Panel | Owner Dashboard (MVP) | Employee (Post-MVP) |
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
| Connect Google Calendar OAuth | N/A | ✅ | ✅ (post-MVP) |
| Cancel business appointments by ID | ✅ | ✅ (own business only) | ❌ |
| View appointments (centralized list) | ✅ | ❌ (sees in GC only) | ❌ (sees in own GC) |
| Add/remove employees | ✅ | ❌ (must contact admin) | ❌ |

## Multi-Employee Cancellation Flow (Post-MVP)

When multi-employee is implemented:

**Scenario: Owner wants to cancel employee's appointment**
1. Employee tells owner the appointment ID (e.g., last 8 chars shown in their calendar event)
2. Owner enters appointment ID in dashboard
3. System verifies `appointment.businessId === owner.businessId`
4. If yes: cancels appointment, processes refund, deletes event from **employee's Google Calendar** (not owner's)
5. If no: shows error "Cita no encontrada o no pertenece a tu negocio"

**Security:** Owner can only cancel appointments within their own business, enforced by `requireBusinessOwner` middleware which checks `user.businessId`.
