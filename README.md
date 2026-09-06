# Malhotra Automobiles

Professional automobile business platform with product requests, service booking, real-time chat, and admin dashboard.

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express + TypeScript
- **Database**: Supabase (PostgreSQL) + Supabase Auth + Storage + Realtime
- **AI**: Google Gemini API
- **Email**: Resend

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase project
- Gemini API key
- Resend API key

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Run database migrations (in Supabase dashboard)
# See server/database/migrations/001_initial_schema.sql

# Start development servers
npm run dev
```

### Project Structure

```
├── server/                 # Node.js/Express backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Auth, error handling, logging
│   │   ├── services/      # Business logic (AI, email)
│   │   ├── types/         # TypeScript types
│   │   └── lib/           # Supabase client
│   └── database/
│       └── migrations/    # SQL migrations
├── client/                # React frontend
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── components/   # Reusable components
│   │   ├── stores/       # Zustand stores
│   │   └── lib/          # Utilities, API client
│   └── public/
└── package.json          # Workspace root
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/products | List products |
| GET | /api/v1/products/:slug | Get product details |
| POST | /api/v1/requests | Submit request |
| GET | /api/v1/services | List services |
| GET | /api/v1/services/:slug/availability | Get available slots |
| POST | /api/v1/chat/conversations | Create conversation |
| POST | /api/v1/ai/chat | AI chat |
| POST | /api/v1/auth/signup | Sign up |
| POST | /api/v1/auth/signin | Sign in |
| GET | /api/v1/admin/* | Admin routes (protected) |

### Database Setup

Run the SQL migration in your Supabase dashboard:
```sql
-- Import server/database/migrations/001_initial_schema.sql
```

This creates all tables, RLS policies, indexes, and triggers.

## Development

```bash
# Start both servers
npm run dev

# Start server only
npm run dev:server

# Start client only
npm run dev:client

# Build for production
npm run build
```

## Deployment

- **Frontend**: Vercel, Netlify, or similar
- **Backend**: Render, Railway, Fly.io, or similar
- **Database**: Supabase

Set environment variables in your deployment platform.

## MVP Features

- [x] Product browsing and cart
- [x] Request submission (no payment)
- [x] Service booking with slot selection
- [x] Admin dashboard
- [x] Real-time chat
- [x] AI assistant (Gemini)
- [x] Email notifications
- [x] Customer authentication
- [x] Mobile-responsive design

## Future Roadmap

**Phase 2**: Customer accounts, vehicle profiles, reviews, service reminders
**Phase 3**: Online payment, inventory, coupons, WhatsApp integration, CRM
