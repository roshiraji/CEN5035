<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# CloudSchedule - Office Hours Booking System

A full-stack application for managing instructor office hours and student bookings.

## Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + Prisma
- **Database**: PostgreSQL
- **Containerization**: Docker + Docker Compose

## Quick Start with Docker

**Prerequisites:** Docker and Docker Compose

1. Clone the repository and navigate to the project directory

2. Build and start all services:
   ```bash
   docker-compose up --build
   ```

3. The application will be available at:
   - Frontend: http://localhost:18080
   - Backend API: http://localhost:18081
   - Database: localhost:5432

4. Seed users are automatically created:
   - Instructor: `instructor@fau.edu` / `123`
   - Student: `student@fau.edu` / `123`

## Development Setup (Without Docker)

### Frontend

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file with:
   ```
   VITE_API_URL=http://localhost:18081/api
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```
   DATABASE_URL="postgresql://cloudschedule:cloudschedule_password@localhost:5432/cloudschedule?schema=public"
   JWT_SECRET="your-secret-key-change-in-production"
   PORT=5000
   FRONTEND_URL="http://localhost:18080"
   ```

4. Set up the database:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   npx tsx src/seed.ts
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
cloudschedule/
├── backend/              # Express API server
│   ├── src/
│   │   ├── routes/      # API route handlers
│   │   ├── middleware/  # Auth middleware
│   │   └── server.ts    # Express app entry point
│   ├── prisma/          # Prisma schema and migrations
│   └── Dockerfile
├── components/          # React components
├── pages/              # React pages
├── services/           # API service layer
├── context/            # React context providers
├── Dockerfile          # Frontend Dockerfile
└── docker-compose.yml  # Docker Compose configuration
```

## API Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/users/instructors` - Get all instructors
- `POST /api/slots` - Create time slots (Instructor only)
- `GET /api/slots/instructor/:instructorId` - Get instructor's slots
- `DELETE /api/slots/:slotId` - Delete a slot (Instructor only)
- `POST /api/bookings` - Book a slot
- `GET /api/bookings/student/:studentId` - Get student's bookings
- `GET /api/bookings/instructor/:instructorId` - Get instructor's bookings
- `PATCH /api/bookings/:bookingId/status` - Update booking status
- `DELETE /api/bookings/:bookingId` - Cancel a booking

## Environment Variables

### Frontend
- `VITE_API_URL` - Backend API URL (default: http://localhost:18081/api)

### Backend
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Server port (default: 5000)
- `FRONTEND_URL` - Frontend URL for CORS

## Docker Commands

- Start services: `docker-compose up`
- Start in background: `docker-compose up -d`
- Stop services: `docker-compose down`
- View logs: `docker-compose logs -f`
- Rebuild: `docker-compose up --build`
- Remove volumes: `docker-compose down -v`
