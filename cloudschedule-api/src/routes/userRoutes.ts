import { Router, Request, Response } from 'express';
import prisma from '../services/db'; // <-- IMPORT PRISMA

const router = Router();

/**
 * @route   GET /api/users/me
 * @desc    Get the profile for the currently authenticated user
 * @access  Private (protected by authMiddleware)
 */
router.get('/users/me', (req: Request, res: Response) => {
  // The authMiddleware has already run, found/created the user,
  // and attached it to req.user. We just need to send it back.
  
  if (req.user) {
    res.json(req.user);
  } else {
    // This should technically not be reachable if authMiddleware is working
    res.status(401).json({ message: 'User not authenticated' });
  }
});

/**
 * @route   GET /api/users/instructors
 * @desc    Get a list of all instructors
 * @access  Private (protected by authMiddleware)
 */
router.get('/users/instructors', async (req: Request, res: Response) => {
  try {
    const instructors = await prisma.user.findMany({
      where: {
        role: 'INSTRUCTOR', // Find all users with the role 'INSTRUCTOR'
      },
      select: {
        userId: true, // Only select non-sensitive fields
        displayName: true,
        email: true,
      },
    });

    res.json(instructors);
  } catch (error) {
    console.error('Error fetching instructors:', error);
    res.status(500).json({ message: 'Error fetching instructors' });
  }
});

export default router;