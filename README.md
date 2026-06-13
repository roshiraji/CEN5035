# CloudSchedule

CloudSchedule is a full-stack office hours booking system created for CEN5035. The application allows instructors to create available office hour time slots and allows students to book, view, and manage appointments.

## Features

- User registration and login
- Student and instructor roles
- Instructor time slot creation
- Student office hour booking
- Booking status management
- Appointment cancellation
- Dockerized frontend, backend, and database setup

## Tech Stack

- React
- TypeScript
- Vite
- Node.js
- Express
- Prisma
- PostgreSQL
- Docker
- Docker Compose

## Project Structure

```text
CloudSchedulev2-DockerReady/
├── backend/              # Express API server
│   ├── src/              # Backend source code
│   ├── prisma/           # Prisma schema and migrations
│   └── Dockerfile
├── components/           # React components
├── context/              # React context providers
├── pages/                # Application pages
├── services/             # API service layer
├── App.tsx               # Main React app
├── docker-compose.yml    # Multi-container setup
├── Dockerfile            # Frontend Dockerfile
└── README.md
```

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js
- npm
- Docker
- Docker Compose

## Run with Docker

From the `CloudSchedulev2-DockerReady` folder, run:

```bash
docker-compose up --build
```

The application will be available at:

- Frontend: `http://localhost:18080`
- Backend API: `http://localhost:18081`
- PostgreSQL: `localhost:5432`

## Seed Accounts

The project includes sample users for testing:

```text
Instructor: instructor@fau.edu / 123
Student: student@fau.edu / 123
```

## Run Locally Without Docker

### Frontend

```bash
npm install
npm run dev
```

Create a `.env.local` file:

```env
VITE_API_URL=http://localhost:18081/api
```

### Backend

```bash
cd backend
npm install
```

Create a `.env` file:

```env
DATABASE_URL="postgresql://cloudschedule:cloudschedule_password@localhost:5432/cloudschedule?schema=public"
JWT_SECRET="your-secret-key-change-in-production"
PORT=5000
FRONTEND_URL="http://localhost:18080"
```

Set up Prisma and seed the database:

```bash
npx prisma generate
npx prisma migrate dev
npx tsx src/seed.ts
npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/users/instructors` | Get all instructors |
| POST | `/api/slots` | Create instructor time slots |
| GET | `/api/slots/instructor/:instructorId` | Get instructor slots |
| DELETE | `/api/slots/:slotId` | Delete a time slot |
| POST | `/api/bookings` | Book a time slot |
| GET | `/api/bookings/student/:studentId` | Get student bookings |
| GET | `/api/bookings/instructor/:instructorId` | Get instructor bookings |
| PATCH | `/api/bookings/:bookingId/status` | Update booking status |
| DELETE | `/api/bookings/:bookingId` | Cancel a booking |

## Course Information

Created for **CEN5035** as a course project.

## Author

Roshini Rajimon and Daniel Torres
