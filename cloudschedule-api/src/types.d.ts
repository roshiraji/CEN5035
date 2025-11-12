// This allows us to attach the Prisma User object to the Express request
// and access it in any subsequent route handler.
import { User } from '@prisma/client';

declare global {
  namespace Express {
    export interface Request {
      user?: User;
    }
  }
}