import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authMiddleware } from './middleware/auth';
import userRoutes from './routes/userRoutes';
import bookingRoutes from './routes/bookingRoutes';
import timeslotRoutes from './routes/timeslotRoutes'; // <-- 1. IMPORT NEW ROUTER

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// --- Global Middleware ---
app.use(cors({
  origin: 'http://localhost:3000'
}));
app.use(express.json());

// --- API Routes ---
const apiRouter = express.Router();

// Apply the authentication middleware to ALL /api routes
apiRouter.use(authMiddleware);

// --- Register all routes ---
apiRouter.use(userRoutes);
apiRouter.use(bookingRoutes);
apiRouter.use(timeslotRoutes); // <-- 2. USE THE TIMESLOT ROUTER

// Register the main API router
app.use('/api', apiRouter);

// --- Server Startup ---
app.listen(PORT, () => {
  console.log(`[CloudSchedule API] Server running on http://localhost:${PORT}`);
  console.log(`[CloudSchedule API] Current environment: ${process.env.NODE_ENV || 'development'}`);
});