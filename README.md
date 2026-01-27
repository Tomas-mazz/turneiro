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

5. Start development servers:
```bash
npm run dev
```

This will start:
- Frontend on `http://localhost:3000`
- Backend on `http://localhost:3001`

## Available Scripts

- `npm run dev` - Start both frontend and backend
- `npm run build` - Build both projects
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## Development

All development commands are run from the root directory. The Git repository is at the root level.

## License

Private project
