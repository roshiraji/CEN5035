export enum UserRole {
  INSTRUCTOR = 'INSTRUCTOR',
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN',
}

export interface User {
  userId: string;
  email: string;
  displayName: string;
  role: UserRole;
  token?: string; // JWT simulation
}

export interface TimeSlot {
  slotId: string;
  instructorId: string;
  instructorName?: string; // For display convenience
  startTime: string; // ISO Date String
  endTime: string; // ISO Date String
  isBooked: boolean;
  location: string;
}

export interface Booking {
  bookingId: string;
  slotId: string;
  studentId: string;
  studentName: string; // Added for instructor view
  instructorName: string;
  startTime: string;
  endTime: string;
  location: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  reason?: string; // Reason student wants to meet
  instructorNote?: string; // Reason for cancellation/rejection
}

export interface AuthResponse {
  user: User;
  token: string;
}