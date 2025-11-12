import { Router, Request, Response } from 'express';
import prisma from '../services/db';

const router = Router();

/**
 * @route   GET /api/bookings/me
 * @desc    Get all bookings for the authenticated user (dynamic for student/instructor)
 * @access  Private
 */
router.get('/bookings/me', async (req: Request, res: Response) => {
  // We can safely assert req.user exists because authMiddleware has run
  const { userId, role } = req.user!;
  
  try {
    let bookings;

    if (role === 'INSTRUCTOR') {
      // Instructors: Find bookings linked to *their* time slots
      bookings = await prisma.booking.findMany({
        where: {
          slot: {
            instructorId: userId,
          },
        },
        include: {
          student: { // Include the student's info
            select: { displayName: true, email: true },
          },
          slot: true, // Include the slot info
        },
        orderBy: {
          slot: { startTime: 'asc' },
        },
      });
    } else {
      // Students: Find bookings they created
      bookings = await prisma.booking.findMany({
        where: {
          studentId: userId,
        },
        include: {
          slot: { // Include the slot info
            include: {
              instructor: { // Include the instructor's info
                select: { displayName: true, email: true },
              },
            },
          },
        },
        orderBy: {
          slot: { startTime: 'asc' },
        },
      });
    }
    
    // The frontend expects the 'DetailedBooking' type, which our queries match.
    res.json(bookings);

  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

export default router;