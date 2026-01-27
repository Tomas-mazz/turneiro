# Design & UX Specification

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

**Interaction**:
- Clicking "RESERVAR TURNO" scrolls to service selection section
- Smooth scroll animation (500ms ease-in-out)

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

#### Service Cart Overlay (Bottom Sheet)
**Purpose**: Confirm selected service and proceed to next step

**Layout**: Fixed bottom overlay (similar to pamp.dk "Din kurv" design)

**Trigger**: Appears automatically when a service is selected

**Important**: Overlay CANNOT be closed/dismissed

**Explanations**: Explanations for products/services appear below the overlay in small text (very small font size)

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

#### Cancellation Policy Warning (Before Payment)
**Purpose**: Display cancellation policy configured by admin before payment step

**Layout**: Small text displayed between name/phone input fields and payment step

**Display**:
- Dynamic message based on business's configured rules
- Example messages:
  - "Se puede cancelar hasta 24 horas antes sin costo. Si cancelas después, se cobrará un 10% de la reserva total ($25.00)"
  - "Se puede cancelar hasta 48 horas antes sin costo. Si cancelas después, no hay reembolso."
  - "Cancelación gratuita hasta 24h antes. Después se retiene el 20% de la reserva ($5.00)"

**Visual Design**:
- Text: Small font size (small text)
- Color: Dark gray (#111827) or medium gray (#6B7280)
- Position: Between name/phone input fields and payment step
- Always displayed (not conditional) - appears always

#### Payment Step
**Purpose**: Process advance payment (percentage or full) as configured by admin

**Layout**: Full-width payment section

**Display**:
- Service name and total price displayed prominently
- Payment amount calculation:
  - If percentage: "Depósito requerido: $X.XX (Y% del total)"
  - If full payment: "Pago completo: $X.XX"
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

## User Flows & Interactions

### Booking Flow

1. **Landing on Booking Page**
   - Hero section visible (full viewport)
   - Smooth fade-in animation
   - "RESERVAR TURNO" button prominent

2. **Click "RESERVAR TURNO"**
   - Smooth scroll to service selection (or barber selection if salon page)
   - Service section becomes visible

3. **Select Service**
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

4. **View Month Calendar**
   - Full month calendar displayed
   - Quick buttons: "Hoy" (Today), "Primera hora disponible" (First available time)
   - Month navigation arrows (left/right)
   - Available days clickable (white text on dark)
   - Sold out days grayed out and disabled
   - Past dates grayed out and disabled
   - Current day highlighted

5. **Select Day**
   - Click on available day
   - Day highlighted (white background, dark text)
   - Barbers and time slots load for selected day
   - Loading spinner while fetching data
   - Sold out days are disabled (grayed out)

6. **View Barbers and Time Slots**
   - All barbers displayed (if multi-barber) or single barber
   - Each barber shows: circular photo, name, available time slots
   - Time slots displayed as small buttons in grid (3-4 per row)
   - If barber has no slots: Shows "No hay turnos disponibles" message
   - Click time slot to select
   - Selected slot highlighted with primary color
   - Next step appears below (slide-down animation)

7. **Fill Client Information Form (Before Payment - ALWAYS REQUIRED)**
   - Form appears after time slot selection
   - Full name input (required, minimum 2 words)
   - Phone number input (required, with country code selector)
   - **ALWAYS required before payment** - This is NOT configurable, shop owners cannot decide this
   - Information message displayed below form
   - **Cancellation Policy Warning**: Displayed as small text between form fields and payment step
   - Real-time validation
   - Phone number formatting as user types
   - "Continuar al pago" button enabled when valid
   - Click button to proceed to payment step

8. **View Cancellation Policy Warning**
   - Warning message ALWAYS appears between name/phone input fields and payment step
   - Displayed as small text (small font size)
   - Example: "Se puede cancelar hasta 24 horas antes sin costo. Si cancelas después, se cobrará un 10% de la reserva total ($25.00)"
   - Message is dynamic based on business's configured rules
   - Always displayed (not conditional) - appears always
   - Non-blocking (user can proceed to payment)

9. **Process Payment**
   - Payment step displays: Service name, total price, payment amount
   - Payment method selection: "Mercado Pago" or "Tarjeta de crédito/débito"
   - If Mercado Pago: Redirect to checkout or embedded form
   - If Credit/Debit Card: Card input fields (number, expiry, CVV, name)
   - Payment processing indicator shown
   - On success: Proceed to next step
   - On failure: Error message, option to retry payment

10. **Submit Booking**
    - Button shows loading state
    - Form disabled during submission
    - Success message appears
    - WhatsApp confirmation notice
    - Booking includes: service, price, duration, payment confirmation

## Dashboard Layout

### Sidebar Navigation
```css
- Width: 256px (desktop), 100% width overlay (mobile)
- Background: White
- Border-right: 1px solid #E5E7EB
- Menu items: 16px padding vertical, 16px padding horizontal
- Active item: Background = primary color at 10%, border-left = 4px solid primary color
- Hover: Background = #F9FAFB
```

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
