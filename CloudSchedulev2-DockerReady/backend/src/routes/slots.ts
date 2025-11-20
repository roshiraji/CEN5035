import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Create time slots
router.post('/', authenticate, requireRole(['INSTRUCTOR']), async (req: AuthRequest, res) => {
  try {
    const { date, startTimeStr, endTimeStr, location } = req.body;
    const instructorId = req.userId!;

    if (!date || !startTimeStr || !endTimeStr || !location) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Parse times
    const start = new Date(`${date}T${startTimeStr}`);
    const end = new Date(`${date}T${endTimeStr}`);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date/time format' });
    }

    if (start >= end) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    // Generate 30-minute slots
    const slots = [];
    let current = new Date(start);

    while (current < end) {
      const slotEnd = new Date(current.getTime() + 30 * 60000); // +30 mins
      if (slotEnd > end) break;

      slots.push({
        instructorId,
        startTime: current,
        endTime: slotEnd,
        location
      });

      current = slotEnd;
    }

    // Create slots in database
    const createdSlots = await prisma.timeSlot.createMany({
      data: slots
    });

    res.status(201).json({ message: `Created ${createdSlots.count} slots` });
  } catch (error: any) {
    console.error('Create slots error:', error);
    res.status(500).json({ error: error.message || 'Failed to create slots' });
  }
});

// Get instructor's slots
router.get('/instructor/:instructorId', async (req, res) => {
  try {
    const { instructorId } = req.params;

    const slots = await prisma.timeSlot.findMany({
      where: {
        instructorId
      },
      include: {
        instructor: {
          select: {
            displayName: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    // Format response
    const formattedSlots = slots.map(slot => ({
      slotId: slot.slotId,
      instructorId: slot.instructorId,
      instructorName: slot.instructor.displayName,
      startTime: slot.startTime.toISOString(),
      endTime: slot.endTime.toISOString(),
      isBooked: slot.isBooked,
      location: slot.location
    }));

    res.json(formattedSlots);
  } catch (error: any) {
    console.error('Get instructor slots error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch slots' });
  }
});

// Delete a slot
router.delete('/:slotId', authenticate, requireRole(['INSTRUCTOR']), async (req: AuthRequest, res) => {
  try {
    const { slotId } = req.params;
    const instructorId = req.userId!;

    // Check if slot exists and belongs to instructor
    const slot = await prisma.timeSlot.findUnique({
      where: { slotId }
    });

    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }

    if (slot.instructorId !== instructorId) {
      return res.status(403).json({ error: 'Not authorized to delete this slot' });
    }

    // Check if slot is booked
    if (slot.isBooked) {
      return res.status(400).json({ error: 'Cannot delete a booked slot' });
    }

    await prisma.timeSlot.delete({
      where: { slotId }
    });

    res.json({ message: 'Slot deleted successfully' });
  } catch (error: any) {
    console.error('Delete slot error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete slot' });
  }
});

export default router;

