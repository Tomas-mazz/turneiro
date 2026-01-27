# Future Ideas & Roadmap

## Paid Extras / Future Roadmap

### Appointment and Revenue Statistics
- **Dashboard Metrics**:
  - Total appointments (this week, month, year)
  - Revenue tracking (if deposits enabled)
  - Peak booking times
  - Cancellation rate
  - Average appointments per day/week
- **Charts and Graphs**: 
  - Appointment trends over time
  - Day-of-week booking patterns
  - Revenue charts
  - Client retention metrics

### Frequent Client Tracking and Ranking
- **Client Database**: Track all clients who have booked
- **Booking History**: View all appointments per client
- **Ranking System**: Identify top clients by appointment frequency
- **Client Notes**: Add private notes about clients
- **Contact Information**: Stored phone numbers for easy access

### Client Blocking
- **Block Specific Clients**: Prevent certain clients from booking
- **Block Reason**: Optional reason for blocking (for barber reference)
- **Temporary Blocks**: Time-limited blocks (e.g., 30 days)
- **Unblock Functionality**: Ability to unblock clients later

### Multi-Barber Support per Salon (Future - Not in MVP)
- **Note**: Multi-barber is a current feature but NOT included in MVP
- **Current Implementation**: Admin (platform admin, not shop owner) can add multiple barbers within the same barbershop. Each barber has individual calendar with independent schedules and availability. Shop owner must contact admin to add a new barber/employee.
- **Shop Owner Visibility**: Shop owner can view appointments of their employees
- **Future Self-Service Features**:
  - Salon Management: Shop owner can create salon profile with multiple barbers (self-service)
  - Barber Profiles: Each barber has individual schedule and settings
  - Cross-Scheduling: View all barbers' appointments in one calendar
  - Assignment: Assign appointments to specific barbers
  - Barber Availability: Per-barber working hours and days off
  - Owner Dashboard: Salon-wide statistics and management

### Marketing / Promotions
- **Promotional Codes**: Discount codes for appointments
- **Referral System**: Track referrals and reward clients
- **Email Marketing**: Send promotions to client list
- **SMS/WhatsApp Marketing**: Promotional messages to clients
- **Social Media Integration**: Share booking page on social platforms

### Custom Domain
- **Domain Mapping**: Use own domain (e.g., `book.johnbarber.com`)
- **SSL Certificate**: Automatic SSL setup
- **Branding Consistency**: Full control over booking page URL

### Google Calendar Integration
- **Note**: Included as main option (not part of Premium MVP)
- **Scope**: Each employee has their own individual Google Calendar
- **Implementation**: Each shop owner with employees can add them, and each employee will have their own Google Calendar. Not limited to barbershops - applies to all shop owners who have employees and want to add them.
- **Read-Only Synchronization**: All appointments automatically sync to each employee's Google Calendar
- **One-Way Sync**: Appointments created in the platform appear in Google Calendar immediately
- **Event Details**: Each Google Calendar event includes:
  - Client name and service type
  - Client phone number
  - Direct link to dashboard for cancellation/editing
- **Cancellation Workflow**: 
  - Business owner can view all appointments in Google Calendar
  - To cancel an appointment, owner must use the dashboard (via link in event or direct login)
  - Cancellation from dashboard ensures:
    - Mandatory cancellation reason is captured
    - Automatic refund processing (if payment was collected)
    - WhatsApp notification sent to client with cancellation reason
- **Authentication**: Business owner connects Google Calendar account via OAuth
- **Dashboard Access**: Owner can access dashboard with email/password to manage appointments
- **Benefits**: 
  - View appointments in familiar calendar interface
  - Receive Google Calendar notifications for appointments
  - Quick access to dashboard via event link for management actions
- **Note**: Cancellations cannot be performed directly from Google Calendar to maintain business logic integrity (payment refunds, mandatory reasons, WhatsApp notifications)

### Advanced Branding and Message Customization
- **Full Theme Customization**: Multiple colors, fonts, layout options
- **Custom CSS**: Advanced styling options
- **Message Templates**: Extensive customization of all WhatsApp/email messages
- **Multiple Languages**: Support for different languages
- **Booking Page Layout**: Different layout options and templates

## Future Features (From Decisions Summary)

### Users

#### Registration and Access
- **Future**: Optional end client accounts for booking history
- **Future**: OAuth integration (Google, Facebook)

#### User Roles
- **Future**: Business staff role (STAFF) - limited permissions

### Appointments

#### Time Management
- **Future**: Recurring appointments support

#### Appointment Information
- **Future**: Additional service types (hair coloring, styling, etc.)
- **Future**: Notes/special requests field

### Cancellations

#### Cancellation Rules
- **Future**: Cancellation fees for late cancellations

### Notifications

#### WhatsApp Integration
- **Future**: WhatsApp reminder 2 hours before
- **Future**: Email notifications as backup

#### Notification Content
- **Future**: Include service type and pricing

### Statistics

#### Analytics and Reporting
- **Future**: Appointment statistics (count, trends)
- **Future**: Revenue statistics (if payments enabled)
- **Future**: Peak booking times analysis
- **Future**: Cancellation rate tracking
- **Future**: Client retention metrics
- **Future**: Export data to CSV/PDF

### Plans

#### Subscription Tiers
- **Future**: Premium plan with statistics
- **Future**: Multi-barber plan
- **Future**: Transaction fees for payment processing

### Business Owner Panel

#### Dashboard Features
- **Future**: Client management and notes
- **Future**: Client blocking functionality

#### Profile Management
- **Future**: Multiple logo/color themes
- **Future**: Custom domain configuration

### Scalability

#### Multi-Tenant Architecture
- **Future**: Multi-provider support within same business
- **Future**: Shared resources (e.g., client database) across providers in same business

#### Performance and Limits
- **Future**: Rate limiting for bookings
- **Future**: Caching for booking pages
- **Future**: CDN for static assets

#### Internationalization
- **Future**: Additional languages
- **Future**: Per-barber timezone configuration
- **Future**: Currency support (for payments)

## Additional Considerations

### Data Privacy
- **GDPR Compliance**: Client data stored securely
- **Data Retention**: Define retention period for cancelled appointments
- **Right to Deletion**: Allow barbers to delete their data
- **Phone Number Privacy**: Hash or encrypt phone numbers

### Security
- **HTTPS**: All pages served over HTTPS
- **Input Validation**: Sanitize all user inputs
- **SQL Injection Prevention**: Use parameterized queries (Prisma)
- **Rate Limiting**: Prevent booking spam
- **Unique Links**: Cryptographically secure cancellation links

### Accessibility
- **WCAG Compliance**: Ensure booking page is accessible
- **Keyboard Navigation**: Support keyboard-only navigation
- **Screen Reader Support**: Proper ARIA labels
- **Color Contrast**: Meet contrast requirements

### Mobile Experience
- **Responsive Design**: Optimize for mobile devices
- **Touch-Friendly**: Large tap targets for time slots
- **Fast Loading**: Optimize for slower connections
- **Offline Support**: Future consideration for offline viewing
