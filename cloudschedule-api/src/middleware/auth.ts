import { Request, Response, NextFunction } from 'express';
import { User } from '@prisma/client';
import prisma from '../services/db';

// This is the shape of the x-ms-client-principal header
interface ClientPrincipal {
  identityProvider: string;
  userId: string;
  userDetails: string; // This is the user's email
  userRoles: string[];
}

/**
 * Finds a user by email. If they don't exist, creates them.
 * This implements the "getOrCreateFromOauth" logic.
 */
//
// --- THIS IS THE FIX ---
// The 'displayName' parameter is now correctly typed as 'string | undefined'
//
async function getOrCreateUser(email: string, displayName?: string, role?: string): Promise<User> {
  if (!email) {
    throw new Error('Email is null or undefined. Cannot get or create user.');
  }

  // Build the update object dynamically so we don't write undefined fields
  const updateData: Partial<User> = {};
  if (displayName) updateData.displayName = displayName;
  if (role) updateData.role = role;

  // Use upsert so that repeated sign-ins will update displayName/role when provided
  const user = await prisma.user.upsert({
    where: { email },
    update: updateData,
    create: {
      email,
      displayName: displayName || email.split('@')[0],
      role: role || 'STUDENT',
    },
  });

  return user;
}

/**
 * Express middleware to handle authentication for both
 * local development (x-mock-email) and Azure (x-ms-client-principal).
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let userEmail: string | undefined = undefined;
    let userDisplayName: string | undefined = undefined;

    // 1. Check for development mock header
    if (process.env.NODE_ENV === 'development') {
      const mockEmail = req.header('x-mock-email');
      if (mockEmail) {
        console.log(`AUTH: Dev mock user: ${mockEmail}`);
        userEmail = mockEmail;
        userDisplayName = mockEmail.split('@')[0];
      }
    }

    // 2. If no dev header, check for Azure Easy Auth header
    if (!userEmail) {
      const header = req.header('x-ms-client-principal');
      if (header) {
        const decoded = Buffer.from(header, 'base64').toString('ascii');
        const clientPrincipal: ClientPrincipal = JSON.parse(decoded);

        userEmail = clientPrincipal.userDetails;
        userDisplayName = clientPrincipal.userDetails; // Azure Easy Auth often just provides email

        // Map any Easy Auth roles to our internal role. If the incoming roles contain
        // 'Instructor' (case-insensitive) we'll promote them to INSTRUCTOR in our DB.
        const incomingRoles = (clientPrincipal.userRoles || []).map(r => r.toLowerCase());
        if (incomingRoles.includes('instructor') || incomingRoles.includes('instructors')) {
          // We'll pass this to getOrCreateUser which will upsert the role
          // to INSTRUCTOR on new user or update existing user if role differs.
          // Note: we don't allow Easy Auth to set arbitrary roles; we currently
          // only recognize Instructor.
          (req as any)._detectedRole = 'INSTRUCTOR';
        }
      }
    }

    // 3. If no auth info is found, block the request.
    if (!userEmail) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    // 4. Get or create the user and attach them to the request object
    // This line (approx. 80) will no longer have an error
  const detectedRole = (req as any)._detectedRole as string | undefined;
  const user = await getOrCreateUser(userEmail, userDisplayName, detectedRole);
    req.user = user;
    
    next();

  } catch (error) {
    console.error('Error in auth middleware:', error);
    return res.status(500).json({ message: 'Authentication error.' });
  }
};