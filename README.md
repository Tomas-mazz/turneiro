# Appointments - Booking SaaS Platform

Multi-tenant appointment booking platform for businesses (barbershops, salons, spas, etc.).

## Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios

### Backend
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT

### Integrations
- **Payments**: Stripe + Mercado Pago
- **Notifications**: Twilio WhatsApp API
- **Calendar**: Google Calendar API

## Project Structure

```
Appointments/
├── frontend/          # Next.js Frontend (UI only)
├── backend/           # Express.js Backend (REST API)
└── docs/              # Project documentation
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or pnpm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Appointments
```

2. Install all dependencies:
```bash
npm run install:all
```

3. Set up environment variables:
   - Copy `frontend/.env.example` to `frontend/.env.local`
   - Copy `backend/.env.example` to `backend/.env`
   - Configure your database and API keys

4. Set up database:
```bash
npm run db:migrate
npm run db:generate
```

5. (Optional) Seed demo data so you can log in and use the dashboard. **Run from the project root** (so the backend can load `.env` and connect to the DB):
```bash
npm run db:seed
```
This creates a demo business, an owner user, a service, and working hours. **Use exactly:**
- **Email:** `owner@demo.com`
- **Password:** `demo123`

If login fails or you see "No tienes un negocio asignado": (1) Run the seed again from the root: `npm run db:seed`. (2) Log in with **owner@demo.com** / **demo123** (exact spelling). (3) Ensure `backend/.env` has a valid `DATABASE_URL` and `frontend/.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:3001` so the frontend can reach the backend.

6. Start development servers:
```bash
npm run dev
```

This will start:
- Frontend on `http://localhost:3000`
- Backend on `http://localhost:3001`

**To see the dashboard:** Open `http://localhost:3000/login`, sign in with `owner@demo.com` / `demo123`, then go to Dashboard or Settings. The public booking page is at `http://localhost:3000/barberia-demo`.

## Available Scripts

- `npm run dev` - Start both frontend and backend
- `npm run build` - Build both projects
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## Development

All development commands are run from the root directory. The Git repository is at the root level.

## License

Private project
