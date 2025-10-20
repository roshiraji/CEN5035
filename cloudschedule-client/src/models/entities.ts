/**
 * Represents the User entity, matching the database schema 
 * and class diagram.
 */
export interface User {
  userId: string; // UUID in diagram
  displayName: string;
  email: string;
  role: 'INSTRUCTOR' | 'STUDENT';
}

/**
 * Represents the TimeSlot entity.
 */
export interface TimeSlot {
  slotId: string; // UUID
  instructorId: string;
  startTime: string; // ISO 8601 DateTime string
  endTime: string;   // ISO 8601 DateTime string
  location: string;  // Physical or URL [cite: 9]
  isBooked: boolean;
}

/**
 * Represents the Booking entity.
 */
export interface Booking {
  bookingId: string; // UUID
  slotId: string;
  studentId: string;
  createdAt: string; // ISO 8601 DateTime string
  status: 'CONFIRMED' | 'CANCELED';
  notes?: string;
}

/**
 * Represents a "full" booking object, joining user and slot details
 * for display in the instructor dashboard[cite: 57].
 */
export interface DetailedBooking extends Booking {
  student: Pick<User, 'displayName' | 'email'>;
  slot: TimeSlot;
}