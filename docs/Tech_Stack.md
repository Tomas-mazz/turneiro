# Tech Stack & Technical Decisions

## Technical Summary

This document outlines the complete technical architecture, stack choices, and implementation guidelines for building a scalable, multi-tenant, multi-industry appointment booking SaaS platform.

## Core Technology Decisions

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Frontend Framework** | Next.js 14+ (App Router) | Server-side rendering, optimal for SaaS, UI only |
| **Backend Framework** | Express.js | Lightweight, flexible, industry standard for REST APIs |
| **Styling** | Tailwind CSS | Rapid UI development, consistent design system |
| **Language** | TypeScript | Type safety, better DX, reduced bugs |
| **Authentication** | JWT (JSON Web Tokens) | Stateless authentication, works with separated architecture |
| **Database** | PostgreSQL | Relational data, ACID compliance, scalability |
| **ORM** | Prisma | Type-safe queries, migrations, excellent DX |
| **Notifications** | Twilio WhatsApp API | Reliable messaging, global reach |
| **Payments** | Stripe + Mercado Pago | Industry standard, comprehensive API, Latin America support |
| **Frontend Deployment** | Vercel | Optimized for Next.js, automatic scaling |
| **Backend Deployment** | Railway / Render / AWS | Flexible deployment options for Express.js |
| **Version Control** | Git | Standard version control |
| **Package Manager** | npm / pnpm | Dependency management |

## Architecture Overview

The project uses a **separated frontend and backend architecture**:

- **Frontend**: Next.js 14+ (UI only, no API routes)
- **Backend**: Express.js REST API
- **Communication**: HTTP REST API between frontend and backend

## Frontend Architecture

### Next.js (App Router) - UI Only

**Why Next.js App Router:**
- Server Components for improved performance
- Automatic code splitting and optimization
- SEO-friendly with server-side rendering
- File-based routing for intuitive structure
- Excellent developer experience

**Key Features Utilized:**
- Server Components for initial page loads
- Client Components for interactive elements (calendar, forms)
- Client-side API calls to backend (using axios)
- Middleware for route protection (client-side)

**Frontend Project Structure:**
```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── verify-email/
│   ├── (public)/
│   │   └── [business-slug]/
│   │       └── page.tsx          # Public booking page
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   ├── settings/
│   │   │   └── page.tsx
│   │   └── layout.tsx            # Protected layout
│   ├── globals.css
│   └── layout.tsx
├── components/                   # React components
├── lib/
│   ├── api.ts                    # API client (axios)
│   └── auth.ts                   # Auth utilities
└── types/                        # TypeScript types
```

## Backend Architecture

### Express.js REST API

**Why Express.js:**
- Lightweight and flexible
- Large ecosystem and community
- Easy to scale and deploy
- Perfect for REST API architecture
- Works well with TypeScript

**Backend Project Structure:**
```
backend/
├── src/
│   ├── routes/                   # API route definitions
│   ├── controllers/              # Request handlers
│   ├── services/                 # Business logic
│   ├── middleware/               # Auth, validation, etc.
│   ├── lib/                      # Utilities (Prisma, integrations)
│   └── index.ts                  # Express server entry
└── prisma/
    ├── schema.prisma
    └── migrations/
```

**API Communication:**
- Frontend makes HTTP requests to backend API
- Backend runs on separate port (default: 3001)
- CORS configured to allow frontend origin
- JWT tokens for authentication

### Tailwind CSS

**Why Tailwind CSS:**
- Utility-first approach for rapid development
- Responsive design built-in
- Consistent design system
- Small production bundle size (purged unused classes)
- Easy theming with CSS variables

**Configuration:**
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Custom brand colors
        primary: 'var(--color-primary)',
      },
    },
  },
}
```

**Usage Example:**
```tsx
// Booking page component
<div className="container mx-auto px-4 py-8">
  <h1 className="text-3xl font-bold text-gray-900 mb-6">
    Book Your Appointment
  </h1>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* Calendar and time slots */}
  </div>
</div>
```

## Database

### PostgreSQL + Prisma ORM

**Why PostgreSQL:**
- ACID compliance for data integrity
- Excellent performance for relational data
- Support for complex queries
- JSON columns for flexible data
- Robust transaction support
- Industry-proven scalability

**Why Prisma:**
- Type-safe database access
- Auto-generated TypeScript types
- Database migrations management
- Excellent developer experience
- Query optimization
- Relationship handling

## Notifications System

### Twilio WhatsApp Cloud API

**Why Twilio:**
- Reliable WhatsApp messaging
- Global reach
- Easy API integration
- Webhook support
- Template message support (WhatsApp Business requirement)
- Scalable infrastructure

**Important**: WhatsApp Business API requires pre-approved message templates for all outbound messages. All message templates must be submitted and approved by WhatsApp before they can be used in production.

## Payments Integration

### Stripe Integration

**Payment Configuration (Set by Admin per Business):**
- **Advance Payment Options**:
  - Percentage deposit (e.g., 10%, 20%, 50%) - configured by admin
  - Full payment option - can be enabled by admin
  - Payment can be required or optional per business
- **Registration Before Payment**:
  - Admin sets `requireRegistrationBeforePayment` flag per business
  - If `true`: Client must provide name and phone before payment step
  - If `false`: Client provides name and phone after payment
- **Payment Calculation**:
  - If percentage: `paymentAmount = servicePrice * advancePaymentPercentage`
  - If full payment: `paymentAmount = servicePrice`
- **Payment Requirement**:
  - Admin sets `paymentRequired` flag per business
  - If `true`: Payment must be completed to confirm booking
  - If `false`: Payment step is optional
- **Payment Methods**:
  - **Mercado Pago**: Primary payment processor (especially for Latin America)
  - **Credit/Debit Card**: Supported via Mercado Pago and Stripe
  - Both methods available in payment step

## Google Calendar Integration

**Scope**: MVP, basic subscription (not Premium). All appointments are viewed in Google Calendar; there is no /dashboard/appointments page. Owner dashboard (MVP) allows only: edit service prices, edit service duration, link to view Google Calendar, and cancel appointments; everything else is Admin.

### Overview

**Integration Type**: One-way synchronization (read-only from Google Calendar perspective)
- Appointments created in the platform automatically sync to business owner's Google Calendar
- Business owner can view all appointments in Google Calendar
- Cancellations must be performed from the dashboard to maintain business logic integrity

**Why One-Way Sync:**
- Preserves business rules (mandatory cancellation reasons, refund processing, WhatsApp notifications)
- Prevents conflicts with payment processing (Stripe refunds)
- Ensures data consistency and audit trail
- Maintains platform as single source of truth

**Required Packages:**
```bash
npm install googleapis
```

## Deployment

### Frontend Deployment - Vercel

**Why Vercel:**
- Optimized for Next.js applications
- Automatic deployments from Git
- Edge network for global performance
- Built-in environment variables management
- Preview deployments for branches
- Analytics and monitoring

**Frontend Deployment Configuration:**
```json
// frontend/vercel.json
{
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_URL": "@backend-api-url"
  }
}
```

### Backend Deployment - Railway / Render / AWS

**Deployment Options:**
- **Railway**: Easy deployment, automatic scaling, PostgreSQL included
- **Render**: Free tier available, easy setup
- **AWS**: EC2, ECS, or Lambda (more complex but scalable)

**Backend Environment Variables:**
- Database connection (PostgreSQL)
- JWT secret
- API keys (Stripe, Twilio, Mercado Pago)
- CORS origin (frontend URL)

**Environment Variables:**

**Frontend (.env.local):**
```bash
# Backend API URL
NEXT_PUBLIC_API_URL="http://localhost:3001"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Backend (.env):**
```bash
# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/appointments"

# Authentication
JWT_SECRET="your-jwt-secret-key"

# Twilio WhatsApp
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_AUTH_TOKEN="your-twilio-token"
TWILIO_WHATSAPP_NUMBER="+14155238886"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN="your-mercadopago-access-token"
MERCADOPAGO_PUBLIC_KEY="your-mercadopago-public-key"
MERCADOPAGO_WEBHOOK_SECRET="your-mercadopago-webhook-secret"

# App Configuration
APP_URL="http://localhost:3000"
APP_TIMEZONE="America/New_York"

# Google Calendar Integration (MVP, basic subscription)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/google-calendar/callback"
```

## Development Instructions

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- npm or pnpm package manager
- Git for version control
- Twilio account (for WhatsApp)
- Stripe account (for credit/debit card payments)
- Mercado Pago account (for payments, especially Latin America)
- Vercel account (for deployment)

### Initial Setup

**Important**: Git repository is at the root level (`Appointments/`), and development commands are run from the root directory.

1. **Clone Repository**
```bash
git clone <repository-url>
cd Appointments
```

2. **Install Dependencies (Root Level)**

```bash
# Install root dependencies (for workspace management)
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

3. **Set Up Environment Variables**

**Backend:**
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
cd ..
```

**Frontend:**
```bash
cd frontend
cp .env.example .env.local
# Edit .env.local with your configuration
# Set NEXT_PUBLIC_API_URL=http://localhost:3001
cd ..
```

4. **Set Up Database**

```bash
cd backend
npx prisma migrate dev
npx prisma generate
cd ..
```

5. **Seed Database (Optional)**
```bash
cd backend
npm run db:seed
cd ..
```

6. **Start Development Servers**

**From the root directory (`Appointments/`):**
```bash
npm run dev
```

This command starts both frontend and backend servers simultaneously:
- Frontend runs on `http://localhost:3000`
- Backend runs on `http://localhost:3001`

**Note**: The root `package.json` contains scripts to manage both projects. See "Root Package.json Configuration" section below.

### Available Scripts

**Root Package.json (Appointments/package.json):**

The root `package.json` manages both frontend and backend projects. Run all commands from the root directory.

```json
{
  "name": "appointments",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run dev",
    "build": "npm run build:backend && npm run build:frontend",
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && npm run build",
    "install:all": "npm install && cd frontend && npm install && cd ../backend && npm install",
    "db:migrate": "cd backend && npm run db:migrate",
    "db:generate": "cd backend && npm run db:generate",
    "db:studio": "cd backend && npm run db:studio",
    "db:seed": "cd backend && npm run db:seed"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

**Frontend (frontend/package.json):**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  }
}
```

**Backend (backend/package.json):**
```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint src --ext .ts",
    "type-check": "tsc --noEmit",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

**Usage:**
- `npm run dev` (from root) - Starts both frontend and backend
- `npm run dev:frontend` (from root) - Starts only frontend
- `npm run dev:backend` (from root) - Starts only backend
- `npm run build` (from root) - Builds both projects
- `npm run db:migrate` (from root) - Runs database migrations

### Database Migrations

**Run from root directory:**
```bash
# Create a new migration
npm run db:migrate -- --name migration_name

# Or from backend directory
cd backend
npx prisma migrate dev --name migration_name
cd ..

# Apply migrations in production
cd backend
npx prisma migrate deploy
cd ..

# Reset database (development only)
cd backend
npx prisma migrate reset
cd ..
```

### Prisma Studio

View and edit database data:
```bash
# From root
npm run db:studio

# Or from backend directory
cd backend
npx prisma studio
cd ..
```

## Git Repository Structure

**Important**: The Git repository is located at the root level (`Appointments/`), not in individual frontend/backend folders.

```
Appointments/              # Git repository root
├── .git/                  # Git configuration
├── .gitignore            # Git ignore rules
├── package.json          # Root package.json (manages both projects)
├── README.md             # Root README
├── frontend/             # Frontend project (no separate git repo)
│   ├── package.json
│   └── ...
├── backend/              # Backend project (no separate git repo)
│   ├── package.json
│   └── ...
└── docs/                 # Documentation
```

**Git Workflow:**
- All commits are made from the root directory
- Both frontend and backend changes are tracked in the same repository
- Use `.gitignore` to exclude `node_modules/`, `.env*`, and build artifacts from both projects

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [JWT Authentication](https://jwt.io/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp)
- [Stripe Documentation](https://stripe.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app/)
