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
async function getOrCreateUser(email: string, displayName: string | undefined): Promise<User> {
  if (!email) {
    throw new Error('Email is null or undefined. Cannot get or create user.');
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return existingUser;
  }

  // User does not exist. Create them.
  // Note: We default the role to STUDENT.
  const newUser = await prisma.user.create({
    data: {
      email: email,
      // This logic already handles an undefined displayName, so the type signature was the only error
      displayName: displayName || email.split('@')[0], // Use email prefix as default display name
      role: 'STUDENT', // Default all new signups to STUDENT
    },
  });

  return newUser;
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
      }
    }

    // 3. If no auth info is found, block the request.
    if (!userEmail) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    // 4. Get or create the user and attach them to the request object
    // This line (approx. 80) will no longer have an error
    const user = await getOrCreateUser(userEmail, userDisplayName);
    req.user = user;
    
    next();

  } catch (error) {
    console.error('Error in auth middleware:', error);
    return res.status(500).json({ message: 'Authentication error.' });
  }
};