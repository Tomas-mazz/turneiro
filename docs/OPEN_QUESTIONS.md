# Open Questions & Unresolved Items

## Technical Decisions

### WhatsApp Integration
- **To Define**: Twilio vs WhatsApp Business API direct integration

## Implementation Details

### Testing Locally
1. **Create Test Business Account**
   - Log in as admin and create a business in `/admin` (create-business wizard).
   - Set owner credentials (email/password) when creating the business; there is no public registration.
   - Optionally complete profile (name, cover photo, logo, description) in admin business edit.

2. **Configure Working Hours and Services**
   - Log into dashboard
   - Navigate to Settings
   - Set working hours for each day
   - Add services with prices and durations
   - Configure payment options (free, percentage deposit, or full payment)

3. **Test Booking Flow**
   - Visit `/business-slug` (your business slug)
   - Verify hero section with cover photo, logo, name, and "BOOK APPOINTMENT" button
   - Click button to scroll to booking section
   - Select service (with cart overlay)
   - Select date from calendar
   - Select time slot
   - [If payment required] Process payment
   - Fill form (name, phone - test both international and local formats)
   - Book an appointment
   - Verify WhatsApp confirmation received

4. **Test Cancellation**
   - Click cancellation link from WhatsApp
   - Verify 24-hour rule enforcement
   - Test late cancellation (<24h) - should block cancellation but free slot
   - Confirm slot becomes available for other bookings
   - [If payment was made] Verify automatic refund

5. **Test Business Owner Dashboard**
   - Log into dashboard
   - View appointments list
   - Edit an appointment (change date/time)
   - Cancel an appointment manually
   - Block time slots (specific hours)
   - Block entire days
   - Verify changes reflect on booking page
