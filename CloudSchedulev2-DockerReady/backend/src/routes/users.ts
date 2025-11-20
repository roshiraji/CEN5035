import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all instructors
router.get('/instructors', async (req, res) => {
  try {
    const instructors = await prisma.user.findMany({
      where: {
        role: 'INSTRUCTOR'
      },
      select: {
        userId: true,
        email: true,
        displayName: true,
        role: true
      }
    });

    res.json(instructors);
  } catch (error: any) {
    console.error('Get instructors error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch instructors' });
  }
});

export default router;

