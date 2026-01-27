# UI Design Specification – Barber Appointment SaaS

## Project Language Rules

**IMPORTANT**: All project content must be in English:
- Code comments
- Git commits
- README files
- Documentation
- Variable names and function names
- User-facing text (with i18n support for English/Spanish)
- API documentation
- Error messages

---

## Design Philosophy

### Design Style
- **Minimalist**: Clean, uncluttered interface with focus on essential elements
- **Professional**: Modern and trustworthy appearance
- **Accessible**: WCAG 2.1 AA compliance
- **Mobile-First**: Optimized for mobile devices, enhanced for desktop

### Design Principles
1. **Simplicity**: Remove unnecessary elements, focus on core actions
2. **Consistency**: Uniform patterns across all pages
3. **Clarity**: Clear visual hierarchy and intuitive navigation
4. **Brand Flexibility**: Each barber can customize their primary color while maintaining system consistency

---

## Color System

### Base Colors
- **Background**: White (#FFFFFF) or light gray (#F9FAFB)
- **Text Primary**: Dark gray (#111827)
- **Text Secondary**: Medium gray (#6B7280)
- **Borders**: Light gray (#E5E7EB)
- **Success**: Green (#10B981)
- **Error**: Red (#EF4444)
- **Warning**: Amber (#F59E0B)
- **Info**: Blue (#3B82F6)

### Barber Customization
- Each barber can set a **Primary Color** (custom hex value)
- Primary color is used for:
  - Call-to-action buttons
  - Active states
  - Links and interactive elements
  - Accent highlights
- System ensures sufficient contrast ratio (WCAG AA minimum)

### Color Usage Examples
```css
/* Barber's custom primary color applied to */
- Reserve button background
- Selected date indicator
- Active time slot border
- Loading spinner
- Success checkmarks
```

---

## Typography

### Font Stack
- **Primary Font**: System font stack (San Francisco, Segoe UI, Roboto, sans-serif)
- **Fallback**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`

### Type Scale
- **Heading 1**: 2.25rem (36px) - Page titles
- **Heading 2**: 1.875rem (30px) - Section titles
- **Heading 3**: 1.5rem (24px) - Subsection titles
- **Body Large**: 1.125rem (18px) - Important body text
- **Body**: 1rem (16px) - Default body text
- **Body Small**: 0.875rem (14px) - Secondary information
- **Caption**: 0.75rem (12px) - Labels, timestamps

### Font Weights
- **Regular**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

---

## Layout & Spacing

### Container Widths
- **Mobile**: Full width with 16px padding
- **Tablet**: Max-width 768px, centered
- **Desktop**: Max-width 1200px, centered

### Spacing Scale
- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **2xl**: 48px
- **3xl**: 64px

### Grid System
- 12-column grid on desktop
- Single column on mobile
- Responsive breakpoints:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

---

## Page: Public Booking Page (`/barber-name`)

### Layout Structure

#### Hero Section (First Tab/View)
**Purpose**: First impression, brand showcase, call-to-action

**Components**:
1. **Full-Screen Image/Background**
   - Barber's photo or branded background image
   - Overlay gradient for text readability (if needed)
   - Height: 100vh on mobile, 80vh on desktop
   - Object-fit: cover

2. **Barber Logo/Name**
   - Position: Centered, middle of hero section
   - Logo: Max-width 200px, max-height 200px
   - Name: Large heading (H1), white or dark text depending on background
   - Optional tagline/subtitle below name

3. **Reserve Button**
   - Text: "RESERVAR TURNO" (Spanish) / "BOOK APPOINTMENT" (English)
   - Style: Large, prominent button
   - Size: Min-width 200px, height 56px
   - Color: Barber's primary color
   - Position: Below logo/name, centered
   - Animation: Subtle hover effect (scale 1.05)
   - Icon: Optional calendar icon

**Visual Example**:
```
┌─────────────────────────────────┐
│                                 │
│      [Barber Background]        │
│                                 │
│         [Logo/Name]             │
│      "John's Barber Shop"       │
│                                 │
│    [RESERVAR TURNO Button]      │
│                                 │
│                                 │
└─────────────────────────────────┘
```

**Interaction**:
- Clicking "RESERVAR TURNO" scrolls to service selection section
- Smooth scroll animation (500ms ease-in-out)

#### Multi-Barber Selection (If Applicable)
**Purpose**: Allow client to select barber when on salon page

**Layout**: Grid of barber cards (2-3 columns on desktop, 1 column on mobile)

**Barber Card**:
- Barber photo/avatar
- Barber name
- Optional: Brief description or specialties
- Click to select barber
- Selected state: Border with primary color

**Display**: Only shown if salon has multiple barbers and salon page is enabled

#### Service Selection Section
**Purpose**: Display services with prices for client selection

**Layout**: Vertical list of service items (similar to pamp.dk design)

**Service Item**:
- Radio button (empty circle) on the left
- Service name (e.g., "Corte", "Corte + Barba", "Barba")
- Duration and "Leer más" / "Read more" link below name (optional)
- Price on the right (e.g., "$25", "$35", "$15")
- Click anywhere on item to select
- Selected state: Radio button shows checkmark (filled circle with checkmark)
- Full-width item, padding: 16px vertical, 16px horizontal
- Spacing: 8px between items

**Display**: Shown immediately after clicking "RESERVAR TURNO" button

#### Service Cart Overlay (Bottom Sheet)
**Purpose**: Confirm selected service and proceed to next step

**Layout**: Fixed bottom overlay (similar to pamp.dk "Din kurv" design)

**Trigger**: Appears automatically when a service is selected

**Cart Overlay Design**:
- Dark grey/black background overlay
- Position: Fixed at bottom of screen
- Height: Auto (expands to fit content)
- Border-radius: 16px top-left, 16px top-right
- Padding: 16px
- Shadow: Elevated above content

**Cart Header**:
- Title: "Tu selección" / "Your selection" (left side)
- **No close button** - overlay cannot be dismissed
- Explanations for products/services appear below the overlay in small text (very small font size)
- Spacing: 16px between title and content

**Cart Item**:
- Remove button: Small "X" icon on left (optional, to remove selection)
- Service name: "Corte", "Corte + Barba", etc.
- Price: Displayed on right (e.g., "$25")
- Layout: Horizontal, full width
- Padding: 12px vertical

**Continue Button**:
- Large, prominent button at bottom of overlay
- Text: "Continuar $25" / "Continue $25" (includes total price)
- Background: White or primary color
- Text color: Dark (if white background) or white (if primary color)
- Arrow icon on right side of button
- Full width of overlay
- Height: 56px
- Border-radius: 8px
- Position: Bottom of cart overlay

**Behavior**:
- Appears with slide-up animation when service is selected
- Can be dismissed by clicking outside or close button (optional)
- Clicking "Continuar" proceeds to calendar view
- Updates dynamically if service selection changes

#### Month Calendar Section
**Purpose**: Display month calendar with date selection (similar to pamp.dk design)

**Layout**: Full month calendar view

**Service Title Display**:
- Shows selected service name at top (e.g., "Corte", "Corte + Barba", "Barba")
- Large, bold text
- Back arrow button on left

**Quick Navigation Buttons**:
- "Hoy" / "Today" button
- "Primera hora disponible" / "First available time" button
- Left/right arrow buttons for month navigation

**Month Header**:
- Displays month name and year (e.g., "Enero 2026" / "January 2026")
- Large, prominent text

**Day Cards**:
- Display format: Day number + abbreviated day name (e.g., "27 Mar", "28 Mié")
- Layout: Horizontal row of days (typically 7 days visible, scrollable on mobile)
- Available days: White text on dark background, clickable
- Selected day: White background, dark text (inverted), with border
- Sold out days (no slots): Grayed out (#6B7280), disabled, not clickable
- Past dates: Grayed out, disabled
- Current day: Additional visual indicator (border or highlight)

**Navigation**:
- Left arrow: Previous month
- Right arrow: Next month
- Month/year indicator updates

**Responsive**:
- Mobile: Horizontal scroll for days, full width calendar
- Desktop: All days of month visible, grid layout

#### Barbers and Time Slots Section
**Purpose**: Display all barbers with their available time slots for selected day

**Layout**: Vertical list of barber sections

**Barber Section**:
- Profile photo: Circular, left-aligned (60px diameter)
- Barber name: Next to photo, bold text
- Spacing: 16px between barber sections

**Time Slots Grid**:
- Layout: Grid of small rectangular buttons
- Grid columns: 3-4 per row (responsive)
- Time format: "09:00", "11:30", "14:00" (24-hour) or "9:00 AM", "11:30 AM" (12-hour)
- Button style:
  - Small rectangular buttons
  - Dark background with white text (or light background with dark text)
  - Border-radius: 4px
  - Padding: 8px 12px
  - Height: 36px
  - Spacing: 8px between buttons
- Selected state: Primary color background, white text
- Hover state: Slight opacity change

**Empty State (No Available Slots)**:
- Gray rectangular box
- Message: "No hay turnos disponibles" / "No available slots"
- Centered text, gray color
- Full width of barber section
- Height: 48px

**Display Logic**:
- Shows all barbers (if multi-barber salon) or single barber
- Only displays available time slots (booked slots hidden)
- If barber has no slots, shows empty state message
- Time slots respect selected service duration
- Slots update when day or service changes

#### Cancellation Policy Warning (Before Payment)
**Purpose**: Display cancellation policy configured by admin before payment step

**Layout**: Small text displayed between name/phone input fields and payment step

**Display**:
- ALWAYS appears between name/phone input fields and payment step
- Dynamic message based on business's configured rules
- Displayed as small text (small font size)
- Always displayed (not conditional) - appears always
- Example messages:
  - "Se puede cancelar hasta 24 horas antes sin costo. Si cancelas después, se cobrará un 10% de la reserva total ($25.00)"
  - "Se puede cancelar hasta 48 horas antes sin costo. Si cancelas después, no hay reembolso."
  - "Cancelación gratuita hasta 24h antes. Después se retiene el 20% de la reserva ($5.00)"

**Visual Design**:
- Warning icon (info or alert icon)
- Background: Light yellow/amber (#FEF3C7) or light blue (#DBEAFE)
- Border: 1px solid warning color
- Text: Dark gray (#111827)
- Padding: 16px
- Border-radius: 8px
- Position: Above payment step, full width

**Message Generation Logic**:
- If `freeCancellationHours` = 24: "hasta 24 horas antes"
- If `cancellationHasCost` = true and `lateCancellationFeePercentage` = 0.10: "se cobrará un 10%"
- If `refundPolicy` = NO_REFUND_AFTER_WINDOW: "no hay reembolso"
- Service price displayed dynamically: "$[valor]"

**Behavior**:
- Always displayed before payment step
- Message updates if service selection changes (price changes)
- Non-blocking (user can proceed to payment)

#### Payment Step
**Purpose**: Process advance payment (percentage or full) as configured by admin

**Layout**: Full-width payment section

**Display**:
- Service name and total price displayed prominently
- Payment amount calculation:
  - If percentage: "Depósito requerido: $X.XX (Y% del total)"
  - If full payment: "Pago completo: $X.XX"
  - Example: "Servicio: Corte - $25.00" → "Depósito: $2.50 (10%)" or "Pago completo: $25.00"
- **Payment Method Selection**:
  - Radio buttons or tabs: "Mercado Pago" / "Tarjeta de crédito/débito"
  - Mercado Pago: Primary option (especially for Latin America)
  - Credit/Debit Card: Via Stripe or Mercado Pago
  - Both methods show secure payment badges
- **Payment Form**:
  - If Mercado Pago: Redirect to Mercado Pago checkout or embedded form
  - If Credit/Debit Card: Card input fields (number, expiry, CVV, name)
  - Secure payment processing
- Processing indicator during payment
- Success confirmation before proceeding

**Visual Design**:
- Clear breakdown: Service price → Payment amount
- Primary color used for payment button
- Security badges/icons (SSL, Mercado Pago logo, Stripe logo)
- Error handling for failed payments
- Success confirmation before proceeding

**Behavior**:
- Payment step appears after:
  - Time slot selection AND client information form (if `requireRegistrationBeforePayment = true`)
  - OR after time slot selection (if `requireRegistrationBeforePayment = false`)
- If `paymentRequired` = true: Booking cannot proceed without successful payment
- If `paymentRequired` = false: Payment step is optional, can skip
- If payment fails, user can retry without losing selected time slot or form data

#### Client Information Form Section (Before Payment)
**Purpose**: Collect client details before payment step

**Layout**: Vertical form

**Form Fields**:
- **Full Name Input** (required):
  - Label: "Nombre completo" / "Full Name"
  - Placeholder: "Juan Pérez" / "John Doe"
  - Validation: Minimum 2 words, max 100 characters
- **Phone Number Input** (required):
  - Label: "Número de teléfono" / "Phone Number"
  - Supports both international (+1234567890) and local formats
  - Country code selector
  - Format validation on blur
- **Information Message** (below form fields):
  - Text: "Estos datos son obligatorios para la reserva así obtienes la confirmación, recordatorios y el link para poder cancelar tu reserva."
  - English: "These details are required for the reservation so you receive confirmation, reminders, and the link to cancel your reservation."
  - Style: Info icon, light blue background (#DBEAFE), dark text (#1E40AF)
  - Padding: 12px
  - Border-radius: 8px
  - Margin-top: 16px
- **Submit Button**: 
  - Text: "Continuar al pago" / "Continue to Payment"
  - Primary color, full width on mobile
  - Disabled until form is valid

**Validation**:
- Real-time validation
- Error messages below fields
- Submit button disabled until valid
- Phone number format validation

**Behavior**:
- Form appears after time slot selection
- If `requireRegistrationBeforePayment = false`: This step appears after payment
- If `requireRegistrationBeforePayment = true`: This step appears before payment (default)
- Form data is stored temporarily until booking confirmation

---

## Component Specifications

### Buttons

#### Primary Button
```css
- Background: Barber's primary color
- Text: White (#FFFFFF)
- Padding: 12px 24px
- Border-radius: 8px
- Font-weight: 600
- Font-size: 16px
- Hover: Slight darken (10% opacity overlay)
- Active: Scale 0.98
- Disabled: 50% opacity, cursor not-allowed
```

#### Secondary Button
```css
- Background: Transparent
- Text: Primary color
- Border: 2px solid primary color
- Padding: 12px 24px
- Border-radius: 8px
- Hover: Background primary color at 10% opacity
```

### Service Cart Overlay Component

#### Cart Overlay Container
```css
- Position: Fixed at bottom
- Background: Dark grey/black (#1F2937 or #111827)
- Border-radius: 16px 16px 0 0 (top corners rounded)
- Padding: 16px
- Width: 100%
- Max-height: 40vh
- Box-shadow: 0 -4px 6px rgba(0, 0, 0, 0.1)
- Z-index: 1000 (above content)
- Animation: Slide up from bottom (300ms ease-out)
```

#### Cart Header
```css
- Display: Flex, space-between
- Padding-bottom: 12px
- Border-bottom: 1px solid rgba(255, 255, 255, 0.1)
- Title: "Tu selección" / "Your selection"
  - Font-size: 18px
  - Font-weight: 600
  - Color: White
- Close button (optional):
  - Icon: "X" in circle
  - Size: 32px x 32px
  - Background: rgba(255, 255, 255, 0.1)
  - Border-radius: 50%
  - Color: White
```

#### Cart Item
```css
- Display: Flex, space-between, align-center
- Padding: 12px 0
- Remove button (optional):
  - Icon: Small "X"
  - Size: 20px x 20px
  - Color: #9CA3AF
  - Margin-right: 12px
- Service name:
  - Font-size: 16px
  - Color: White
  - Flex: 1
- Price:
  - Font-size: 16px
  - Font-weight: 600
  - Color: White
  - Margin-left: 12px
```

#### Continue Button
```css
- Width: 100%
- Height: 56px
- Background: White (or primary color)
- Color: Dark (#111827) if white background, White if primary color
- Border-radius: 8px
- Font-size: 16px
- Font-weight: 600
- Display: Flex, center, space-between
- Padding: 0 24px
- Arrow icon: Right side, size 20px
- Hover: Slight opacity change (0.9)
- Active: Scale 0.98
```

### Input Fields

#### Text Input
```css
- Border: 1px solid #E5E7EB
- Border-radius: 8px
- Padding: 12px 16px
- Font-size: 16px
- Focus: Border color = primary color, outline: 2px solid primary color at 20% opacity
- Error state: Border color = #EF4444
- Placeholder: #9CA3AF
```

#### Phone Input
- Country code dropdown (flag + code)
- Format validation on blur
- Accepts both formats:
  - International: +1234567890
  - Local: (123) 456-7890 or 123-456-7890

### Month Calendar Component

#### Day Card
```css
- Width: Auto (flexible), min-width: 60px (mobile), 70px (desktop)
- Height: 60px (mobile), 70px (desktop)
- Border-radius: 8px
- Text-align: center
- Padding: 8px
- Available: Dark background, white text, clickable
- Selected: White background, dark text (#111827), border 2px solid primary color
- Current day: Additional border or highlight indicator
- Sold out (no slots): Gray background (#6B7280), gray text (#9CA3AF), cursor not-allowed, opacity 0.5
- Past dates: Gray background (#6B7280), gray text (#9CA3AF), cursor not-allowed, opacity 0.5
- Display format: Day number + abbreviated day name (e.g., "27 Mar")
```

#### Month Navigation
```css
- Arrow buttons: 40px x 40px
- Icon: Chevron left/right
- Color: White or primary color
- Position: Left and right of month header
- Month header: Large text, displays "Enero 2026" / "January 2026"
```

#### Quick Navigation Buttons
```css
- "Hoy" / "Today" button: Secondary button style
- "Primera hora disponible" / "First available time" button: Primary button style (when active)
- Padding: 8px 16px
- Border-radius: 6px
- Spacing: 8px between buttons
```

### Calendar Component (Legacy - for reference)

#### Date Cell (Old Month View - Not Used)
```css
- Size: 40px x 40px (mobile), 48px x 48px (desktop)
- Border-radius: 8px
- Text-align: center
- Available: White background, hover: primary color at 10%
- Selected: Primary color background, white text
- Unavailable: Gray background (#F3F4F6), gray text (#9CA3AF)
- Today: Border 2px solid primary color
```

#### Time Slot
```css
- Padding: 12px 16px
- Border: 2px solid #E5E7EB
- Border-radius: 8px
- Background: White
- Available: Border color = primary color on hover
- Selected: Background = primary color, text = white
- Booked: Background = #F3F4F6, text = #9CA3AF, cursor not-allowed
```

### Loading States

#### Spinner
- Color: Primary color
- Size: 24px
- Animation: Rotate 360deg, 1s linear infinite

#### Skeleton Loader
- Background: #F3F4F6
- Shimmer animation: Gradient moving left to right
- Use for: Calendar, time slots, appointment list

### Empty States

#### No Appointments
- Icon: Calendar icon (gray)
- Text: "No appointments scheduled"
- Optional: Call-to-action button

#### No Available Slots
- Icon: Clock icon (gray)
- Text: "No available slots for this date"
- Suggestion: "Try selecting another date"

### Error States

#### Form Errors
- Red text below input field
- Icon: Alert circle
- Message: Clear, actionable error text

#### Booking Errors
- Toast notification or inline message
- Background: #FEE2E2 (light red)
- Border: #EF4444
- Text: #991B1B
- Auto-dismiss: 5 seconds

### Success States

#### Booking Confirmation
- Green checkmark icon
- Success message: "Appointment booked successfully!"
- WhatsApp confirmation notice
- Show appointment details

---

## Responsive Breakpoints

### Mobile (< 640px)
- Single column layout
- Full-width buttons
- Stacked form fields
- Touch-friendly targets (min 44px height)
- Reduced spacing (16px padding)
- Smaller font sizes (scale down by 10%)

### Tablet (640px - 1024px)
- Two-column layout for calendar and time slots
- Medium-sized buttons
- Standard spacing
- Full font sizes

### Desktop (> 1024px)
- Full layout with optimal spacing
- Hover states enabled
- Larger touch targets
- Maximum content width: 1200px

---

## Dashboard Panels

### 1. Platform Admin Panel (Central)
**Purpose**: Centralized control of the entire SaaS platform.

**Key Views**:
- **Clients Management**: List of all businesses, create new client (industry, branding, credentials).
- **Global Services**: Create and assign services to businesses, category-based templates.
- **Global Calendar**: View all appointments from all businesses, filtering by business.
- **Global Blocks**: Manage schedule blocks for any business.
- **Payment & Cancellation Rules**: Configure payment and cancellation policies per client. Payment rules apply equally to all business categories (rubros). Admin configures rules when creating a new client with their specific rubro and conditions.

#### Payment & Cancellation Rules Configuration
**Location**: `/admin/businesses/[businessId]/settings/payment-rules`

**Layout**: Form with two main sections

**Payment Configuration Section**:
- **Payment Required Toggle**: Enable/disable payment requirement
- **Payment Type Selector**:
  - Radio buttons: "Percentage Deposit" / "Full Payment"
  - If "Percentage Deposit": Number input for percentage (10%, 20%, 50%, etc.)
  - If "Full Payment": Checkbox to enable full payment option
- **Registration Before Payment Toggle**:
  - Label: "Requerir datos del cliente antes del pago" / "Require client data before payment"
  - If enabled: Client must provide name and phone before payment step
  - If disabled: Client provides name and phone after payment step
  - Help text: "Si está activado, el cliente debe ingresar su nombre y teléfono antes de pagar. Si está desactivado, los datos se solicitan después del pago."
- **Visual**: Clear labels, help text explaining each option

**Cancellation Rules Section**:
- **Free Cancellation Window**: 
  - Number input: Hours before appointment (e.g., 24, 48)
  - Label: "Cancelación gratuita hasta X horas antes"
- **Cancellation Cost Toggle**: 
  - Enable/disable late cancellation fee
  - If enabled: Number input for fee percentage
- **Refund Policy Selector**:
  - Dropdown with options:
    - "Reembolso completo si cancela dentro de la ventana, ninguno después"
    - "Reembolso parcial si cancela después de la ventana"
    - "Sin reembolso si cancela después de la ventana"
    - "Siempre reembolso completo"
- **Preview Message**: 
  - Shows generated warning message that will appear on booking page
  - Updates dynamically as admin changes settings
  - Example: "Se puede cancelar hasta 24 horas antes sin costo. Si cancelas después, se cobrará un 10% de la reserva total ($25.00)"

**Save Button**: 
- Primary color, saves all settings
- Success message on save
- Settings apply immediately to future appointments

### 2. Business Owner Panel (Client)
**Purpose**: Individual management for each service provider.

**Key Views**:
- **Own Services**: Edit price, duration, and status (Activate/Deactivate).
- **Own Calendar**: View and manage appointments for their business only.
- **Own Blocks**: Manage business-specific schedule blocks.
- **Visual Config**: Update photo, colors, and business description.
- **Google Calendar Integration**: Connect Google Calendar to view all appointments. Cancellations must be performed from dashboard to maintain business logic (refunds, mandatory reasons, WhatsApp notifications).

---

## Dashboard Layout
- **Sidebar Navigation**: Left side, collapsible on mobile
- **Main Content Area**: Right side, scrollable
- **Header**: Top bar with user name/role, notifications, logout

### Sidebar Navigation
```css
- Width: 256px (desktop), 100% width overlay (mobile)
- Background: White
- Border-right: 1px solid #E5E7EB
- Menu items: 16px padding vertical, 16px padding horizontal
- Active item: Background = primary color at 10%, border-left = 4px solid primary color
- Hover: Background = #F9FAFB
```

### Dashboard Pages

#### Appointments List
- **View Options**: List view, calendar view (toggle)
- **Filters**: Date range, status (upcoming, past, cancelled)
- **List Item**:
  - Client name
  - Date and time
  - Status badge
  - Google Calendar sync indicator (if connected)
  - Actions: Edit, Cancel, View details
- **Cancellation Dialog**:
  - Mandatory reason text area (required)
  - Notification alert: "Reason will be sent via WhatsApp"
  - Note: "This appointment is synced to Google Calendar. Cancellation will update the calendar event."
- **Empty State**: "No appointments scheduled"
- **Google Calendar Note**: 
  - If Google Calendar is connected, show info banner: "Your appointments are synced to Google Calendar. To cancel, use this dashboard (link included in calendar event)."

#### Settings
- **Tabs**: Profile, Working Hours, Branding, Notifications, Integrations
- **Form Layout**: Two-column on desktop, stacked on mobile
- **Save Button**: Sticky at bottom on mobile, inline on desktop

#### Google Calendar Integration Settings
- **Location**: Settings > Integrations tab
- **Connection Status**:
  - If not connected: "Connect Google Calendar" button (primary color)
  - If connected: Green checkmark icon + "Connected" status
  - Disconnect button (secondary style)
- **Connection Flow**:
  1. User clicks "Connect Google Calendar"
  2. Redirects to Google OAuth consent screen
  3. User grants calendar permissions
  4. Redirects back to dashboard with success message
  5. Status updates to "Connected"
- **Information Display**:
  - Explanation text: "View all your appointments in Google Calendar. To cancel or edit appointments, use the dashboard."
  - Link in event description: Each Google Calendar event includes direct link to dashboard
- **Visual Design**:
  - Card layout with Google Calendar icon
  - Connection status badge (green if connected, gray if not)
  - Clear call-to-action button
  - Help text explaining read-only sync behavior

#### Working Hours Configuration
- **Day Cards**: One card per day of week
- **Toggle**: Open/Closed switch
- **Time Pickers**: Start time, end time, lunch break (optional)
- **Visual**: Clock icons, time input fields

#### Branding Settings
- **Logo Upload**: Drag-and-drop area, preview
- **Color Picker**: Hex input + color picker widget
- **Text Fields**: Welcome message, confirmation message template
- **Preview**: Live preview of booking page

---

## Internationalization (i18n)

### Supported Languages
- English (default)
- Spanish

### Language Switcher
- **Location**: Top-right corner of booking page
- **Style**: Small button with flag icon or "EN/ES" text
- **Behavior**: Toggle between languages, persist preference in localStorage

### Translation Keys Structure
```
en/
  common.json
  booking.json
  dashboard.json
  errors.json

es/
  common.json
  booking.json
  dashboard.json
  errors.json
```

### Key Translations

#### English
- "BOOK APPOINTMENT" → "RESERVAR TURNO" (Spanish)
- "Select Date" → "Seleccionar Fecha"
- "Select Time" → "Seleccionar Hora"
- "Your Name" → "Tu Nombre"
- "Phone Number" → "Número de Teléfono"
- "Confirm Booking" → "Confirmar Reserva"
- "Appointment Confirmed" → "Cita Confirmada"
- "Cancel Appointment" → "Cancelar Cita"

---

## User Flows & Interactions

### Booking Flow

1. **Landing on Booking Page**
   - Hero section visible (full viewport)
   - Smooth fade-in animation
   - "RESERVAR TURNO" button prominent

2. **Click "RESERVAR TURNO"**
   - Smooth scroll to service selection (or barber selection if salon page)
   - Service section becomes visible

3. **[If Salon Page] Select Barber**
   - Grid of barber cards displayed
   - Click barber card to select
   - Selected barber highlighted
   - Service selection appears

4. **Select Service**
   - Service list displayed with radio buttons and prices
   - Click service item to select
   - Selected service shows checkmark in radio button
   - **Service Cart Overlay appears at bottom**:
     - Shows selected service name and price
     - "Continuar [price]" / "Continue [price]" button with arrow
     - Slide-up animation
     - **Overlay CANNOT be closed/dismissed**
     - Explanations for products/services appear below the overlay in small text (very small font size)
   - Click "Continuar" to proceed to calendar

5. **View Month Calendar**
   - Full month calendar displayed
   - Quick buttons: "Hoy" (Today), "Primera hora disponible" (First available time)
   - Month navigation arrows (left/right)
   - Available days clickable (white text on dark)
   - Sold out days grayed out and disabled
   - Past dates grayed out and disabled
   - Current day highlighted

6. **Navigate Months (Optional)**
   - Click left/right arrows to change month
   - Month header updates
   - Calendar refreshes with new month

7. **Select Day**
   - Click on available day
   - Day highlighted (white background, dark text)
   - Barbers and time slots load for selected day
   - Loading spinner while fetching data
   - Sold out days are disabled (grayed out)

8. **View Barbers and Time Slots**
   - All barbers displayed (if multi-barber) or single barber
   - Each barber shows: circular photo, name, available time slots
   - Time slots displayed as small buttons in grid (3-4 per row)
   - If barber has no slots: Shows "No hay turnos disponibles" message
   - Click time slot to select
   - Selected slot highlighted with primary color
   - Next step appears below (slide-down animation)

9. **[If requireRegistrationBeforePayment = true] Fill Client Information Form (Before Payment)**
   - Form appears after time slot selection
   - Full name input (required, minimum 2 words)
   - Phone number input (required, with country code selector)
   - Information message displayed below form:
     - "Estos datos son obligatorios para la reserva así obtienes la confirmación, recordatorios y el link para poder cancelar tu reserva."
   - Real-time validation
   - Phone number formatting as user types
   - "Continuar al pago" button enabled when valid
   - Click button to proceed to payment step

10. **View Cancellation Policy Warning**
    - Warning message appears before payment step
    - Example: "Se puede cancelar hasta 24 horas antes sin costo. Si cancelas después, se cobrará un 10% de la reserva total ($25.00)"
    - Message is dynamic based on business's configured rules
    - Non-blocking (user can proceed to payment)

11. **Process Payment**
    - Payment step displays: Service name, total price, payment amount
    - Example: "Corte - $25.00" → "Depósito: $2.50 (10%)" or "Pago completo: $25.00"
    - Payment method selection: "Mercado Pago" or "Tarjeta de crédito/débito"
    - If Mercado Pago: Redirect to checkout or embedded form
    - If Credit/Debit Card: Card input fields (number, expiry, CVV, name)
    - Payment processing indicator shown
    - On success: Proceed to next step
    - On failure: Error message, option to retry payment
    - [If requireRegistrationBeforePayment = false]: Proceed to client information form
    - [If requireRegistrationBeforePayment = true]: Proceed to booking confirmation

12. **[If requireRegistrationBeforePayment = false] Fill Client Information Form (After Payment)**
    - Form appears after successful payment
    - Full name input (required)
    - Phone number input (required)
    - Information message displayed below form
    - Real-time validation
    - Submit button enabled when valid

13. **Submit Booking**
    - Button shows loading state
    - Form disabled during submission
    - Success message appears
    - WhatsApp confirmation notice
    - Booking includes: service, price, duration, payment confirmation

11. **Cancellation Flow**
    - Click cancellation link
    - Confirmation modal
    - Success message
    - Slot becomes available (if >24h before)

### Dashboard Interactions

1. **View Appointments**
   - Default: Upcoming appointments
   - Filter by date range
   - Click appointment for details

2. **Edit Appointment**
   - Modal or inline edit
   - Date/time picker
   - Save/Cancel buttons

3. **Cancel Appointment**
   - Confirmation dialog
   - Reason field (optional)
   - Status updated immediately

---

## Accessibility (A11y)

### WCAG 2.1 AA Compliance

#### Keyboard Navigation
- All interactive elements keyboard accessible
- Tab order logical and intuitive
- Focus indicators visible (2px outline, primary color)
- Skip links for main content

#### Screen Readers
- Semantic HTML elements
- ARIA labels for icons and buttons
- Alt text for images
- Form labels associated with inputs
- Error messages announced

#### Color Contrast
- Text on background: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: 3:1 minimum

#### Visual Indicators
- Icons accompanied by text labels
- Error states: Color + icon + text
- Loading states: Spinner + text

---

## Animation & Transitions

### Principles
- **Subtle**: Enhance UX without distraction
- **Fast**: Transitions < 300ms
- **Purposeful**: Guide user attention

### Transitions

#### Page Transitions
- Fade in: 200ms ease-out
- Slide: 300ms ease-in-out

#### Button Interactions
- Hover: Scale 1.05, 150ms ease
- Active: Scale 0.98, 100ms ease
- Disabled: Fade to 50% opacity, 200ms

#### Form Interactions
- Input focus: Border color change, 200ms
- Error appearance: Slide down + fade in, 300ms
- Success message: Fade in, 400ms

#### Calendar
- Date selection: Scale animation, 200ms
- Month change: Slide animation, 300ms

---

## Design Assets

### Icons
- **Library**: Heroicons or Lucide React
- **Style**: Outline style (24px default)
- **Color**: Inherit from text color or primary color

### Images
- **Logo**: SVG preferred, PNG fallback
- **Barber Photo**: JPG/WebP, optimized
- **Max Sizes**:
  - Logo: 200px x 200px
  - Hero image: 1920px x 1080px (desktop), 800px x 1200px (mobile)

### Illustrations
- Empty states: Simple, minimalist illustrations
- Error states: Friendly, non-intimidating
- Success states: Positive, celebratory

---

## Component Library Structure

### Reusable Components

```
components/
  ├── ui/
  │   ├── Button.tsx
  │   ├── Input.tsx
  │   ├── Calendar.tsx
  │   ├── TimeSlot.tsx
  │   ├── Modal.tsx
  │   ├── Toast.tsx
  │   ├── Spinner.tsx
  │   └── Badge.tsx
  ├── booking/
  │   ├── HeroSection.tsx
  │   ├── BookingCalendar.tsx
  │   ├── TimeSlotList.tsx
  │   ├── BookingForm.tsx
  │   └── BookingConfirmation.tsx
  └── dashboard/
      ├── Sidebar.tsx
      ├── AppointmentsList.tsx
      ├── SettingsForm.tsx
      └── WorkingHoursEditor.tsx
```

---

## Design Tokens

### Tailwind Configuration Example

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: 'var(--barber-primary-color)',
        // Base colors defined above
      },
      spacing: {
        // Spacing scale defined above
      },
      borderRadius: {
        'button': '8px',
        'input': '8px',
        'card': '12px',
      },
      fontSize: {
        // Type scale defined above
      },
    },
  },
}
```

### CSS Variables for Dynamic Colors

```css
:root {
  --barber-primary-color: #3B82F6; /* Default, overridden per barber */
}

[data-barber-color] {
  --barber-primary-color: attr(data-barber-color);
}
```

---

## Implementation Notes

### Performance
- Lazy load images (Next.js Image component)
- Code splitting for dashboard components
- Optimize calendar rendering (virtual scrolling if needed)
- Debounce form inputs

### Browser Support
- Modern browsers (last 2 versions)
- Mobile: iOS Safari 14+, Chrome Android
- Desktop: Chrome, Firefox, Safari, Edge

### Testing Considerations
- Visual regression testing
- Responsive design testing
- Accessibility testing (axe-core)
- Cross-browser testing

---

This design specification provides a comprehensive guide for implementing a minimalist, professional, and user-friendly booking interface that maintains brand flexibility while ensuring consistency across all barber profiles.

