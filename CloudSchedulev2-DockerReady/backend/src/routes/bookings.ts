import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Book a slot
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { slotId, reason } = req.body;
    const studentId = req.userId!;

    if (!slotId) {
      return res.status(400).json({ error: 'Slot ID is required' });
    }

    // Check if slot exists and is available
    const slot = await prisma.timeSlot.findUnique({
      where: { slotId },
      include: {
        instructor: {
          select: {
            displayName: true
          }
        },
        booking: true
      }
    });

    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }

    if (slot.isBooked || slot.booking) {
      return res.status(400).json({ error: 'Slot already booked' });
    }

    // Get student info
    const student = await prisma.user.findUnique({
      where: { userId: studentId },
      select: {
        displayName: true
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Create booking and update slot in a transaction
    const booking = await prisma.$transaction(async (tx) => {
      // Mark slot as booked
      await tx.timeSlot.update({
        where: { slotId },
        data: { isBooked: true }
      });

      // Create booking
      return await tx.booking.create({
        data: {
          slotId,
          studentId,
          startTime: slot.startTime,
          endTime: slot.endTime,
          location: slot.location,
          reason: reason || null,
          status: 'PENDING'
        },
        include: {
          student: {
            select: {
              displayName: true
            }
          },
          slot: {
            include: {
              instructor: {
                select: {
                  displayName: true
                }
              }
            }
          }
        }
      });
    });

    // Format response
    const formattedBooking = {
      bookingId: booking.bookingId,
      slotId: booking.slotId,
      studentId: booking.studentId,
      studentName: booking.student.displayName,
      instructorName: booking.slot.instructor.displayName,
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      location: booking.location,
      status: booking.status,
      createdAt: booking.createdAt.toISOString(),
      reason: booking.reason || undefined,
      instructorNote: booking.instructorNote || undefined
    };

    res.status(201).json(formattedBooking);
  } catch (error: any) {
    console.error('Book slot error:', error);
    res.status(500).json({ error: error.message || 'Failed to book slot' });
  }
});

// Get student bookings
router.get('/student/:studentId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { studentId } = req.params;
    const userId = req.userId!;

    // Verify user can only see their own bookings
    if (studentId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        studentId
      },
      include: {
        student: {
          select: {
            displayName: true
          }
        },
        slot: {
          include: {
            instructor: {
              select: {
                displayName: true
              }
            }
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    // Format response
    const formattedBookings = bookings.map(booking => ({
      bookingId: booking.bookingId,
      slotId: booking.slotId,
      studentId: booking.studentId,
      studentName: booking.student.displayName,
      instructorName: booking.slot.instructor.displayName,
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      location: booking.location,
      status: booking.status,
      createdAt: booking.createdAt.toISOString(),
      reason: booking.reason || undefined,
      instructorNote: booking.instructorNote || undefined
    }));

    res.json(formattedBookings);
  } catch (error: any) {
    console.error('Get student bookings error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch bookings' });
  }
});

// Get instructor bookings
router.get('/instructor/:instructorId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { instructorId } = req.params;
    const userId = req.userId!;

    // Verify user can only see their own bookings
    if (instructorId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Get all slots for this instructor
    const slots = await prisma.timeSlot.findMany({
      where: {
        instructorId
      },
      select: {
        slotId: true
      }
    });

    const slotIds = slots.map(s => s.slotId);

    // Get bookings for these slots
    const bookings = await prisma.booking.findMany({
      where: {
        slotId: {
          in: slotIds
        }
      },
      include: {
        student: {
          select: {
            displayName: true
          }
        },
        slot: {
          include: {
            instructor: {
              select: {
                displayName: true
              }
            }
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    // Format response
    const formattedBookings = bookings.map(booking => ({
      bookingId: booking.bookingId,
      slotId: booking.slotId,
      studentId: booking.studentId,
      studentName: booking.student.displayName,
      instructorName: booking.slot.instructor.displayName,
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      location: booking.location,
      status: booking.status,
      createdAt: booking.createdAt.toISOString(),
      reason: booking.reason || undefined,
      instructorNote: booking.instructorNote || undefined
    }));

    res.json(formattedBookings);
  } catch (error: any) {
    console.error('Get instructor bookings error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch bookings' });
  }
});

// Update booking status (confirm/cancel)
router.patch('/:bookingId/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const { bookingId } = req.params;
    const { status, instructorNote } = req.body;
    const userId = req.userId!;

    if (!status || !['CONFIRMED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required' });
    }

    // Get booking with slot info
    const booking = await prisma.booking.findUnique({
      where: { bookingId },
      include: {
        slot: {
          include: {
            instructor: true
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Verify instructor owns the slot
    if (booking.slot.instructorId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Update booking and potentially free slot
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { bookingId },
        data: {
          status,
          instructorNote: instructorNote || null
        }
      });

      // If cancelled, free up the slot
      if (status === 'CANCELLED') {
        await tx.timeSlot.update({
          where: { slotId: booking.slotId },
          data: { isBooked: false }
        });
      }
    });

    res.json({ message: 'Booking status updated successfully' });
  } catch (error: any) {
    console.error('Update booking status error:', error);
    res.status(500).json({ error: error.message || 'Failed to update booking status' });
  }
});

// Cancel booking (student can cancel)
router.delete('/:bookingId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.userId!;

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { bookingId },
      include: {
        slot: true
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Verify student owns the booking
    if (booking.studentId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Delete booking and free slot in transaction
    await prisma.$transaction(async (tx) => {
      await tx.booking.delete({
        where: { bookingId }
      });

      await tx.timeSlot.update({
        where: { slotId: booking.slotId },
        data: { isBooked: false }
      });
    });

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error: any) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel booking' });
  }
});

export default router;

