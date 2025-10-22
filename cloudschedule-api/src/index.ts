import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authMiddleware } from './middleware/auth';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// --- Global Middleware ---

// Enable CORS for the React client (running on port 3000)
app.use(cors({
  origin: 'http://localhost:3000'
}));

// Enable JSON body parsing
app.use(express.json());


// --- API Routes ---

// This is a simple test route to verify authentication is working.
// It will be protected by the authMiddleware.
const apiRouter = express.Router();

// Apply the authentication middleware to ALL /api routes
apiRouter.use(authMiddleware);

// Test route
apiRouter.get('/test', (req, res) => {
  // If authMiddleware succeeded, req.user will be populated
  res.json({
    message: 'API is working!',
    user: req.user 
  });
});

// Register the API router
app.use('/api', apiRouter);


// --- Server Startup ---
app.listen(PORT, () => {
  console.log(`[CloudSchedule API] Server running on http://localhost:${PORT}`);
  console.log(`[CloudSchedule API] Current environment: ${process.env.NODE_ENV || 'development'}`);
});