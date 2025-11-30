import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to ensure user is authenticated and is an admin
router.use(authenticate, requireRole(['ADMIN']));

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                userId: true,
                email: true,
                displayName: true,
                role: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(users);
    } catch (error: any) {
        console.error('Get users error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch users' });
    }
});

// Delete user
router.delete('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Prevent deleting self (optional, but good practice)
        // We would need access to req.userId from auth middleware
        // but for now let's just allow it or check if it matches

        await prisma.user.delete({
            where: { userId }
        });

        res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: error.message || 'Failed to delete user' });
    }
});

// Reset password
router.post('/:userId/reset-password', async (req, res) => {
    try {
        const { userId } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: 'New password is required' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { userId },
            data: {
                password: hashedPassword
            }
        });

        res.json({ message: 'Password reset successfully' });
    } catch (error: any) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: error.message || 'Failed to reset password' });
    }
});

export default router;
