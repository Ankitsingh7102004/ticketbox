# TicketBox - Movie & Concert Ticket Booking Platform

A full-stack ticket booking application with interactive seat maps, QR code tickets, waitlist management, and role-based authentication. Built with Next.js 16, TypeScript, Tailwind CSS 4, Prisma ORM, and PostgreSQL.

## Features

- **Event Discovery**: Browse movies and concerts with filtering by type, search, and date
- **Interactive Seat Maps**: Visual seat selection with color-coded categories (Premium, Standard, Economy, VIP, General)
- **Seat Hold with TTL**: Seats are held for 10 minutes during booking to prevent double-booking
- **QR Code Tickets**: Each booking generates a unique QR code ticket with booking reference
- **Waitlist System**: Join waitlists for sold-out shows by seat category; auto-assigned when seats free up
- **Role-Based Auth**: Three roles - Customer, Organiser, Admin - with JWT-based authentication
- **Organiser Dashboard**: Create events, view revenue and booking stats per event
- **Admin Dashboard**: Platform-wide statistics including total events, bookings, users, and revenue
- **Booking Management**: View, track, and cancel bookings with automatic seat release and waitlist trigger
- **Auto-Seeding**: Database auto-populates with sample data on first visit (4 users, 4 events, 26 shows, 3000+ seats)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui |
| Database | PostgreSQL (Neon) |
| ORM | Prisma 6 |
| Auth | JWT (jose), bcryptjs |
| State | Zustand, TanStack Query |
| QR Codes | qrcode (browser) |
| Animations | Framer Motion |
| Deployment | Netlify (@netlify/plugin-nextjs) |

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or cloud via Neon/Supabase)

## Setup Guide

### 1. Clone and Install

```bash
git clone https://github.com/Ankitsingh7102004/ticketbox.git
cd ticketbox
npm install
```

### 2. Configure Environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your database URL and JWT secret:

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
JWT_SECRET="your-random-32-byte-hex-string"
```

Generate a JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The database auto-seeds on first visit.

### 5. Build for Production

```bash
npm run build
npm start
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | No | Secret for JWT signing (defaults to hardcoded value in dev) |

## Test Accounts (Auto-Seeded)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ticketbox.com | admin123 |
| Organiser | organiser@ticketbox.com | org123 |
| Customer | john@example.com | cust123 |
| Customer | jane@example.com | cust123 |

## Database Schema

### Entity Relationship Overview

```
User (1) ──── (N) Event
User (1) ──── (N) Booking
User (1) ──── (N) Waitlist
User (1) ──── (N) Venue

Venue (1) ──── (N) SeatCategory
Venue (1) ──── (N) Event

SeatCategory (1) ──── (N) Seat
SeatCategory (1) ──── (N) EventPricing
SeatCategory (1) ──── (N) Waitlist

Event (1) ──── (N) Show
Event (1) ──── (N) EventPricing

Show (1) ──── (N) Seat
Show (1) ──── (N) Booking
Show (1) ──── (N) Waitlist

Seat (1) ──── (1) BookingSeat
Booking (1) ──── (N) BookingSeat
```

### Models

| Model | Description | Key Fields |
|-------|-------------|------------|
| **User** | Platform users | email (unique), name, password (bcrypt hash), role (CUSTOMER/ORGANISER/ADMIN) |
| **Venue** | Physical venues | name, location, totalRows, seatsPerRow, layout (JSON) |
| **SeatCategory** | Tiered seating zones | name (Premium/Standard/Economy/VIP/General), color, startRow, endRow, priceMultiplier |
| **Event** | Movies and concerts | title, description, type (MOVIE/CONCERT), image, venueId, organiserId |
| **EventPricing** | Per-category pricing | eventId + seatCategoryId (unique), price |
| **Show** | Event showtimes | date (ISO), time (HH:mm), status (ACTIVE/SOLD_OUT/CANCELLED) |
| **Seat** | Individual seats | row, number, status (AVAILABLE/HELD/BOOKED), heldBy, heldAt, bookedBy |
| **Booking** | Confirmed reservations | userId, showId, totalAmount, status (CONFIRMED/CANCELLED), bookingRef (unique) |
| **BookingSeat** | Booking-seat junction | bookingId, seatId, price |
| **Waitlist** | Waitlist entries | userId, showId, seatCategoryId, status (WAITING/OFFERED/EXPIRED/FULFILLED), offeredAt |

## API Documentation

### Authentication

All authenticated endpoints require a valid JWT token in the `auth-token` httpOnly cookie.

#### POST `/api/auth/register`

Register a new customer account.

**Request Body:**
```json
{ "email": "user@example.com", "name": "John Smith", "password": "secret123" }
```

**Response (201):** `{ "user": { "id", "email", "name", "role", "createdAt" }, "token": "..." }`

#### POST `/api/auth/login`

Authenticate and receive a JWT token.

**Request Body:**
```json
{ "email": "user@example.com", "password": "secret123" }
```

**Response (200):** `{ "user": { ... }, "token": "..." }`

#### GET `/api/auth/me`

Get current authenticated user. **Requires auth.**

**Response (200):** `{ "user": { "id", "email", "name", "role" } }`

#### POST `/api/auth/logout`

Clear auth cookie.

**Response (200):** `{ "success": true }`

---

### Events

#### GET `/api/events`

List all events with upcoming shows and available seat counts. Auto-seeds database on first call.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `type` | string | Filter by type: `MOVIE`, `CONCERT`, or `ALL` |
| `search` | string | Search by title (case-insensitive contains) |
| `date` | string | Filter shows from this date onward (YYYY-MM-DD) |

**Response (200):** `{ "events": [...] }`

#### GET `/api/events/[id]`

Get event details with venue, shows, seat availability, and pricing.

**Response (200):** `{ "event": { ... } }`

#### POST `/api/events`

Create a new event. **Requires ORGANISER or ADMIN role.**

**Request Body:**
```json
{ "title": "Event Name", "description": "...", "type": "MOVIE", "image": "/poster.jpg", "venueId": "..." }
```

**Response (201):** `{ "event": { ... } }`

---

### Shows & Seats

#### GET `/api/shows/[showId]/seats`

Get all seats for a show with their categories and statuses. Used to render the seat map.

**Response (200):** `{ "show": { ... }, "seats": [...] }`

#### POST `/api/seats/hold`

Hold selected seats for 10 minutes. **Requires auth.** Releases expired holds first.

**Request Body:**
```json
{ "seatIds": ["seat_id_1", "seat_id_2"], "showId": "show_id" }
```

**Response (200):** `{ "success": true, "seats": [...] }`

**Error (409):** `{ "error": "2 seat(s) are no longer available..." }` - returned if some seats were taken between selection and hold.

#### POST `/api/seats/release`

Release held seats back to AVAILABLE. **Requires auth.** Only releases seats held by the current user.

**Request Body:**
```json
{ "seatIds": ["seat_id_1", "seat_id_2"] }
```

**Response (200):** `{ "success": true }`

---

### Bookings

#### GET `/api/bookings`

List current user's bookings with show, event, venue, and seat details. **Requires auth.**

**Response (200):** `{ "bookings": [...] }`

#### POST `/api/bookings`

Confirm booking for held seats. Calculates total from EventPricing. **Requires auth.**

**Request Body:**
```json
{ "seatIds": ["seat_id_1", "seat_id_2"], "showId": "show_id" }
```

**Response (201):** `{ "booking": { "id", "bookingRef", "totalAmount", "status", ... } }`

#### POST `/api/bookings/[id]/cancel`

Cancel a booking. Releases seats back, checks waitlist, and reactivates show if seats available. **Requires auth.**

**Response (200):** `{ "success": true, "message": "Booking cancelled successfully" }`

---

### Waitlist

#### GET `/api/waitlist`

List current user's waitlist entries with show and category details. **Requires auth.**

**Response (200):** `{ "waitlists": [...] }`

#### POST `/api/waitlist`

Join waitlist for a specific show and seat category. **Requires auth.**

**Request Body:**
```json
{ "showId": "show_id", "seatCategoryId": "category_id" }
```

**Response (201):** `{ "waitlist": { "id", "status": "WAITING", ... } }`

---

### Admin

#### GET `/api/admin/summary`

Get platform-wide statistics. **Requires ADMIN role.**

**Response (200):**
```json
{
  "stats": { "totalEvents": 4, "totalBookings": 2, "totalUsers": 4, "totalRevenue": 1050 },
  "recentBookings": [...]
}
```

### Organiser

#### GET `/api/organiser/events`

List events created by the current organiser (or all events for admins) with revenue and booking counts. **Requires ORGANISER or ADMIN role.**

**Response (200):** `{ "events": [...] }`

---

## Seat Hold and TTL Mechanism

When a user selects seats, the system places a temporary "HOLD" on them:

1. **Hold Request**: `POST /api/seats/hold` receives seat IDs and show ID
2. **Expired Hold Cleanup**: Before processing, the API releases all holds older than 10 minutes (`HOLD_TTL_MS = 10 * 60 * 1000`) back to `AVAILABLE`
3. **Availability Check**: Queries only `AVAILABLE` seats matching the requested IDs
4. **Atomic Update**: Uses `updateMany` with a double-check WHERE clause (`status: 'AVAILABLE'`) to prevent race conditions
5. **Count Verification**: Compares `result.count` with requested count - if they differ, another user grabbed a seat between the check and update
6. **Seat Release**: `POST /api/seats/release` allows users to release their own held seats, or holds expire automatically after 10 minutes when the next hold request triggers cleanup

## Waitlist Logic

1. **Joining**: Users join the waitlist per show per seat category (e.g., Premium for Show A)
2. **Trigger**: When a booking is cancelled, seats are released and the system checks for waiting users per seat category
3. **Auto-Assignment**: The first `WAITING` user (oldest `createdAt`) for each category is marked `OFFERED` with a timestamp. An available seat in that category is auto-held for them
4. **Show Reactivation**: If any seats become available, the show status changes from `SOLD_OUT` back to `ACTIVE`

## Deployment

### Netlify Deployment

1. Push code to GitHub
2. Connect repository in Netlify
3. Set environment variables in **Site settings > Environment variables**:
   - `DATABASE_URL` - Your PostgreSQL connection string (Neon recommended)
   - `JWT_SECRET` - A random 32+ character string
4. Netlify auto-builds using the command in `netlify.toml`:
   ```toml
   [build]
     command = "npx prisma generate && npm run build"
   [[plugins]]
     package = "@netlify/plugin-nextjs"
   ```
5. Database auto-seeds on the first API call to `/api/events`

## Project Structure

```
ticketbox/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Manual seed script
├── public/                    # Static assets (event images, logo)
├── src/
│   ├── app/
│   │   ├── api/               # API route handlers
│   │   │   ├── auth/          # Login, register, logout, me
│   │   │   ├── events/        # Event CRUD + detail
│   │   │   ├── shows/         # Seat map data
│   │   │   ├── seats/         # Hold & release
│   │   │   ├── bookings/      # Create, list, cancel
│   │   │   ├── waitlist/      # Join & list
│   │   │   ├── admin/         # Admin summary
│   │   │   ├── organiser/     # Organiser events
│   │   │   └── seed/          # Manual seed trigger
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── layout/            # Header, Footer, AuthDialogs
│   │   ├── views/             # Page-level view components
│   │   ├── ui/                # shadcn/ui components
│   │   └── QRTicket.tsx       # QR code ticket generator
│   ├── hooks/                 # Custom React hooks
│   └── lib/
│       ├── api.ts             # API client (TanStack Query)
│       ├── auth.ts            # JWT auth utilities
│       ├── auto-seed.ts       # Auto-seed on first visit
│       ├── db.ts              # Prisma client singleton
│       ├── store.ts           # Zustand global store
│       └── utils.ts           # Utility functions
├── netlify.toml               # Netlify build config
├── next.config.ts             # Next.js config
├── package.json
├── tsconfig.json
└── .env.example               # Environment variable template
```

## License

MIT