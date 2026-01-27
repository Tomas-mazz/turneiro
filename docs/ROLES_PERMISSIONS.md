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

## Platform Admin (Central Admin Panel - for You)
**Can do:**
- **Manage Clients:**
  - Create new clients (Business Name, Industry, Photo, Colors, Working Hours)
  - Generate credentials (User/Pass) for the Client Panel
  - Edit any client's data
  - **Change business category/rubro**: Admin can change category, but this is very rare (category changes almost never happen). Change must always go through admin.
  - View all clients and their configured services
- **Configure Payment & Cancellation Rules (Per Client)**:
  - **When creating new client with their rubro**: Admin loads cancellation rules as specified by shop owner in `/admin` panel when creating the client
  - **Payment Configuration**: Payment rules are separated by client, not by rubro. Each client has their own rubro, conditions, and products configured. Admin configures payment rules when creating a new client with their specific rubro and conditions. Payment rules apply equally to all business categories (rubros).
  - **No Limits**: No maximums or minimums - all rules are set manually by admin based on shop owner's requirements
- **Manage Multi-Barber Support:**
  - Add multiple barbers within the same barbershop
  - Set up working hours for each barber
  - Configure individual calendars and schedules per barber
  - **Note**: Shop owner must contact admin to add new barbers (not self-service in MVP)
  - **Shop Owner Visibility**: Shop owner can view appointments of their employees
- **Manage Services:**
  - Create services for any client (Haircut, Esthetics, Massage, etc.)
  - Edit existing services: price, duration, activate/deactivate
  - Assign predefined services to clients based on their industry (rubro)
- **Manage Appointments (Turns):**
  - Visualize all turns from all clients in a centralized view
  - Cancel any turn (Mandatory reason entry)
  - Change turn status (Confirmed / Cancelled)
  - Consult cancellation history and reasons
- **Manage Blocks:**
  - Create schedule/day blocks for any client
  - Edit or delete existing blocks
- **Security:**
  - All actions are validated to prevent errors in pricing, duration, and schedules.
  - No direct database access (all via panel).

## Business Owner (Client Panel - Limited Access)
**Can do:**
- **Manage Services:**
  - Change price and duration of their own services
  - Activate/deactivate their own services
- **Manage Appointments (Turns):**
  - View their own business calendar and turns
  - Cancel their own turns (Mandatory reason entry)
  - View appointments in Google Calendar (if connected)
  - Access dashboard via link from Google Calendar event or direct login
- **Manage Blocks:**
  - Block specific hours or full days for their own business
- **Visual Configuration:**
  - Change business photo/cover
  - Change business primary colors
- **Google Calendar Integration:**
  - Each shop owner with employees can add them, and each employee will have their own Google Calendar
  - Not limited to barbershops - applies to all shop owners who have employees and want to add them
  - Each employee has their own individual Google Calendar
  - Connect Google Calendar account (OAuth)
  - View all appointments synchronized to Google Calendar
  - Access dashboard for appointment management via event link
- **Communication:**
  - When cancelling a turn, the mandatory reason is automatically sent to the end client via WhatsApp.

**Cannot do:**
- Create or delete services (only activate/deactivate or edit price/duration)
- Change service names
- Access other businesses' data, turns, or schedules
- Affect schedules or blocks of other businesses

## Panel Comparison Summary

| Function | Admin Panel (You) | Client Panel (Owner) |
| :--- | :--- | :--- |
| Create Clients | ✅ | ❌ |
| Create Services | ✅ | ❌ |
| Edit Services | ✅ (Full) | ✅ (Price, Duration, Status only) |
| Configure Payment Rules | ✅ (Per business) | ❌ |
| Configure Cancellation Rules | ✅ (Per business) | ❌ |
| Cancel Turns | ✅ (With Reason + WhatsApp) | ✅ (Own business, with Reason + WhatsApp) |
| Block Hours/Days | ✅ (Full control) | ✅ (Own business only) |
| Visual Configuration | ✅ (Full control) | ✅ (Own business only) |
| Access Other Businesses | ✅ | ❌ |
| Direct DB Access | ❌ (Via Panel only) | ❌ (Via Panel only) |
