import { Router, Request, Response } from 'express';
import prisma from '../services/db';

const router = Router();

/**
 * @route   POST /api/slots
 * @desc    Create new availability slots for an instructor
 * @access  Private (Instructors Only)
 */
router.post('/slots', async (req: Request, res: Response) => { // <-- ROUTE FIXED
  const { userId, role } = req.user!;

  // 1. Authorization: Only instructors can create slots
  if (role !== 'INSTRUCTOR') {
    return res.status(403).json({ message: 'Forbidden: Only instructors can create availability' });
  }

  // 2. Get data from the frontend
  const { startTime, endTime, location } = req.body;

  // 3. Validation
  if (!startTime || !endTime || !location) {
    return res.status(400).json({ message: 'Missing required fields: startTime, endTime, location' });
  }

  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  const slotDuration = 30 * 60 * 1000; // 30 minutes in milliseconds

  if (startDate >= endDate) {
    return res.status(400).json({ message: 'Start time must be before end time' });
  }

  // 4. Slot Generation Logic (Sequence 3)
  const slotsToCreate = [];
  let currentSlotStart = startDate.getTime(); // Use time in milliseconds

  while (currentSlotStart < endDate.getTime()) {
    const currentSlotEnd = new Date(currentSlotStart + slotDuration);

    // Only create the slot if the 30-minute block *ends* at or before the total end time
    if (currentSlotEnd.getTime() <= endDate.getTime()) {
      slotsToCreate.push({
        instructorId: userId,
        startTime: new Date(currentSlotStart),
        endTime: currentSlotEnd,
        location: location,
      });
    }

    // Move to the next 30-minute increment
    currentSlotStart += slotDuration;
  }

  if (slotsToCreate.length === 0) {
    return res.status(400).json({ message: 'No valid 30-minute slots could be generated from the time range' });
  }

  // 5. Database Insertion
  try {
    // We use createMany for efficiency
    await prisma.timeSlot.createMany({
      data: slotsToCreate,
    });

    // The frontend's apiService.createAvailability expects an array of the created slots
    // createMany does not return the created objects, so we return the array we generated.
    res.status(201).json(slotsToCreate);

  } catch (error) {
    console.error('Error creating availability slots:', error);
    res.status(500).json({ message: 'Error creating slots' });
  }
});

export default router;