# MovieBook — Backend (server)

Express + TypeScript + MongoDB API for the MovieBook ticket booking app.

## Live Deployment

- **Live Backend URL:** `https://your-backend-name.onrender.com`
- **API Base URL:** `https://your-backend-name.onrender.com/api`
- **Health check:** `https://your-backend-name.onrender.com/api/movies` should return JSON with a list of movies.
- **Frontend using this API:** `https://your-site-name.netlify.app`
- **Hosted on:** Render (Web Service, free tier)

> **Note:** hosted on Render's free tier, so the server sleeps after 15 minutes of inactivity. The first request after idle time may take 30-60 seconds to respond while it wakes up.

## Tech Stack

- Node.js + Express (TypeScript)
- MongoDB + Mongoose
- JWT authentication
- Resend (email), Twilio (SMS, optional), TMDB (posters)

## Requirements

- Node.js 18+
- A MongoDB Atlas cluster (or local MongoDB)

## Local Setup

```bash
npm install
```

Create `.env` in this folder (never commit this file — see `.gitignore`):

```env
PORT=5000

MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/movieTicketDB?retryWrites=true&w=majority

JWT_SECRET=your_jwt_secret_here

# Email (Resend — resend.com)
RESEND_API_KEY=re_your_key_here
EMAIL_FROM=MovieBook <onboarding@resend.dev>

# SMS (Twilio — optional; console.twilio.com)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx

# Posters (TMDB — themoviedb.org/settings/api, "API Key (v3 auth)")
TMDB_API_KEY=your_tmdb_v3_key
```

## Seed the database

```bash
npx tsx src/seed.ts               # movies, theaters, showtimes (next 7 days), seats
npx tsx scripts/fetchPosters.ts   # fills in real posters via TMDB — run AFTER seed.ts
```

`seed.ts` **wipes and rebuilds** movies, theaters, showtimes, and seats every time — only run it when you're okay resetting that data. Bookings and user accounts are never touched by it.

## Run Locally

```bash
npm run dev
```

Runs at `http://localhost:5000`.

## Build & Start (production)

```bash
npm run build   # compiles TypeScript -> dist/src/
npm start       # runs node dist/src/server.js
```

## Deployment (Render)

| Setting | Value |
|---|---|
| Service type | Web Service |
| Root Directory | `server` |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Environment variables | Same as the local `.env` above, entered in Render's Environment tab |

`PORT` is provided automatically by Render — the app reads `process.env.PORT` and does not need it set manually.

## Scripts

| Command | What it does |
|---|---|
| `npx tsx src/seed.ts` | Rebuilds movies, theaters, showtimes, and seats from scratch |
| `npx tsx scripts/fetchPosters.ts` | Looks up and saves a real poster for every movie via TMDB (overwrites every run) |
| `npx tsx scripts/addUpcomingShowtimes.ts` | Adds showtimes for the next 7 days, only for movies with none upcoming — safe to re-run, doesn't touch existing bookings |

## API Reference

Base URL: `/api`

| Route | Method | Auth | Description |
|---|---|---|---|
| `/auth/register` | POST | — | Create an account |
| `/auth/login` | POST | — | Log in, returns a JWT |
| `/movies` | GET | — | List movies |
| `/movies/:id` | GET | — | Movie details |
| `/movies/:id/poster` | PATCH | ✓ | Update a movie's poster URL |
| `/showtimes` | GET | — | List showtimes |
| `/showtimes/:id` | GET | — | Showtime details (movie, theater, booked seats) |
| `/bookings` | POST | ✓ | Create a booking (`{ showtimeId, seatNumbers }`) |
| `/bookings/my-bookings` | GET | ✓ | The logged-in user's bookings |
| `/bookings/:id` | GET | ✓ | One booking's full details |
| `/bookings/:id/cancel` | PUT | ✓ | Cancel a booking, release its seats |
| `/bookings/:id/notify` | POST | ✓ | Send booking details by email/SMS (`{ email? , phone? }`) |
| `/payments` | POST | ✓ | Record a mock payment against a booking |

Routes marked **✓ Auth** require a JWT from `/auth/login`, sent as `Authorization: Bearer <token>`. Testable via Postman/Thunder Client, or through the live frontend linked above.

## Project Structure

```
src/
└── server.ts                 # Express app entry point
config/
└── db.ts                     # MongoDB connection
models/                       # Movie, Theater, Showtime, Seat, Booking, User
controllers/                  # movieController, bookingController, authController, ...
routes/                       # movieRoutes, bookingRoutes, authRoutes, ...
services/
├── notificationService.ts    # sendBookingEmail (Resend), sendBookingSms (Twilio)
├── emailServices.ts          # thin wrapper used by paymentController/notificationJob
└── smsService.ts             # thin wrapper used by paymentController/notificationJob
scripts/
├── fetchPosters.ts
└── addUpcomingShowtimes.ts
data/
├── movies.ts                 # seed data — add new movies here
└── theaters.ts                # seed data — add new theaters/cities here
```

## Known Limitations

- **No admin role system.** The poster-update route only requires a logged-in user, not a specific admin account.
- **Resend sandbox limit.** Until a custom domain is verified with Resend, email can only be sent *to* the address you signed up with on Resend.
- **Twilio trial limit.** A trial account can only send SMS to phone numbers verified in the Twilio console.
- **Mock payment only.** `/api/payments` doesn't call a real payment gateway — it simulates success once valid-looking details are submitted.
- **Seat layout is fixed** at 12 rows (A–L) × 12 seats per screen; seat labels outside that range are rejected by the booking controller.
- **Free-tier cold starts.** The Render free tier sleeps after inactivity; expect a 30-60 second delay on the first request after idle time.
