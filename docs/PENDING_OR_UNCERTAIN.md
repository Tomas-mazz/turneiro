# Pending or Uncertain Content

## Resolved Clarifications

### Payment System Configuration
- **RESOLVED**: Payment rules apply equally to all business categories (rubros)
- **Payment Behavior Options** (Only these 2 options):
  - **Option A**: Require payment of a percentage to make a reservation, with the option to pay the full amount if the customer chooses to
  - **Option B**: No payment required to make a reservation, while still offering the option of voluntary full payment

### Business Category/Rubro
- **RESOLVED**: Business category/rubro is permanent setting
- Admin can change it, but this is very rare (category changes almost never happen)
- Category change must always go through admin

### Timezone Configuration
- **RESOLVED**: Timezone configuration will not be implemented
- Deferred for later if the project grows
- Not part of MVP or current roadmap

### Cancellation Rule Enforcement
- **RESOLVED**: Cancellation rules are configured by admin when creating a new client with their rubro (business category) in `/admin` panel
- Admin loads cancellation rules as specified by shop owner when creating the client
- No maximums or minimums - all rules are set manually by admin based on shop owner's requirements

### Payment Processing
- **RESOLVED**: Payment rules are separated by client, not by rubro (business category)
- Each client has their own rubro, conditions, and products configured
- Admin configures payment rules when creating a new client with their specific rubro and conditions
- Configuration done in `/admin` panel

### Registration Before Payment
- **RESOLVED**: Full name and phone number are ALWAYS required before payment
- This is NOT configurable - shop owners cannot decide this
- Name and phone must always be collected before payment step

### Multi-Barber Support
- **RESOLVED**: Multi-barber is a current feature but NOT included in MVP
- Only admin can add multiple barbers (shop owner cannot do this)
- Admin (platform admin, not shop owner) can add multiple barbers within the same barbershop
- Each barber has individual calendar with independent schedules and availability
- Shop owner can view appointments of their employees

### Google Calendar Integration
- **RESOLVED**: Included as main option (not part of Premium MVP)
- Each shop owner with employees can add them, and each employee will have their own Google Calendar
- Not limited to barbershops - applies to all shop owners who have employees and want to add them
- Each employee has their own individual Google Calendar
- Available as a main feature, not premium

### Service Cart Overlay
- **RESOLVED**: Service cart overlay CANNOT be closed/dismissed
- Explanations for products/services appear below the overlay in small text (very small font size)
- If business owner wants to configure cart contents (add/remove products), they must contact admin to make changes

### Cancellation Policy Warning
- **RESOLVED**: Warning ALWAYS appears between name/phone input fields and payment step
- Displayed as small text (small font size)
- Message is dynamically generated from business's configured rules
- Always displayed (not conditional) - appears always
