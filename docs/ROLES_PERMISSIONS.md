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
  - Create new clients (Business Name, Industry, Photo, Colors, Working Hours)
  - Generate credentials (User/Pass) for the Client Panel
  - Edit any client's data
  - Change business category/rubro (rare; change must go through admin)
  - View all clients and their configured services
- **Configure Payment & Cancellation Rules (Per Client):**
  - Payment rules per client (required, type, percentage, etc.)
  - Cancellation rules (free window, fees, refund policy)
  - All rules set manually by admin based on shop owner's requirements
- **Manage Multi-Barber Support:**
  - Add multiple barbers within the same barbershop
  - Set up working hours per barber
  - Shop owner must contact admin to add new barbers (not self-service in MVP)
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
4. **Cancel appointments** – Cancel their own business’s appointments (e.g. from dashboard or via link; mandatory reason as per business rules).

**Everything else is done by Admin:**
- Create/edit/delete services, service names, activate/deactivate → Admin
- Working hours, blocks, branding, payment rules, cancellation rules → Admin
- View appointments (owner sees them in Google Calendar) → link to GC
- Multi-barber, barber profiles → Admin

**Cannot do (MVP):**
- Create or delete services
- Change service names
- Configure working hours or blocks
- Change branding (photo, colors, texts)
- Configure payment or cancellation rules
- Access admin panel or other businesses' data

## Panel Comparison Summary (MVP)

| Function | Admin Panel | Owner Dashboard (MVP) |
| :--- | :--- | :--- |
| Create/delete clients | ✅ | ❌ |
| Create/delete services | ✅ | ❌ |
| Edit service **price** | ✅ | ✅ (own only) |
| Edit service **duration** | ✅ | ✅ (own only) |
| Edit service name / activate-deactivate | ✅ | ❌ |
| Working hours, blocks | ✅ | ❌ |
| Branding (photo, colors, texts) | ✅ | ❌ |
| Payment / cancellation rules | ✅ | ❌ |
| Link to view Google Calendar | N/A | ✅ |
| Cancel own business turns | ✅ | ✅ (owner can cancel) |
| View turns (centralized list) | ✅ | ❌ (owner sees in GC only) |
