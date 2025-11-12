import axios from 'axios';
import { TimeSlot, Booking, DetailedBooking, User } from '../models/entities';

// Create an axios instance configured for our API
// --- CHANGE: Added 'export' to const apiClient ---
export const apiClient = axios.create({
  baseURL: '/api', // This will now be proxied to http://localhost:8080
  headers: {
    'Content-Type': 'application/json',
  },
});

//
// --- WE HAVE REMOVED THE localStorage INTERCEPTOR BLOCK ---
// The AuthContext will now handle setting the mock header.
//

/**
 * Fetches available time slots for a specific instructor.
 * Implements Sequence 1.
 */
export const getInstructorSlots = (instructorId: string): Promise<TimeSlot[]> => {
  return apiClient.get(`/slots/${instructorId}`).then(res => res.data);
};

/**
 * Books a time slot for the currently authenticated student.
 * Implements Sequence 2.
 * @returns The newly created Booking object.
 */
export const bookSlot = (slotId: string): Promise<Booking> => {
  return apiClient.post('/bookings', { slotId }).then(res => res.data);
};

/**
 * Creates a range of availability for the currently authenticated instructor.
 * Implements Sequence 3.
 * @returns A list of the newly created TimeSlot objects.
 */
export const createAvailability = (
  startTime: string,
  endTime: string,
  location: string
): Promise<TimeSlot[]> => {
  const payload = { startTime, endTime, location };
  return apiClient.post('/slots', payload).then(res => res.data);
};

/**
 * Cancels a booking.
 * Implements "Cancel Booking" use case.
 */
export const cancelBooking = (bookingId: string): Promise<void> => {
  return apiClient.delete(`/bookings/${bookingId}`).then(res => res.data);
};

/**
 * Fetches all bookings for the authenticated user (student or instructor).
 */
export const getMyBookings = (): Promise<DetailedBooking[]> => {
  return apiClient.get('/bookings/me').then(res => res.data);
};

/**
 * Fetches the internal user profile for the currently authenticated user.
 */
export const getMyProfile = (): Promise<User> => {
  return apiClient.get('/users/me').then(res => res.data);
};

/**
 * Fetches a list of all users with the 'INSTRUCTOR' role.
 */
export const getInstructors = (): Promise<User[]> => {
  return apiClient.get('/users/instructors').then(res => res.data);
};

/**
 * Fetches a .ics calendar file for a specific booking.
 */
export const getBookingICS = (bookingId: string): Promise<Blob> => {
  return apiClient.get(`/bookings/${bookingId}/ics`, {
    responseType: 'blob', // Tell axios to expect a file blob
  }).then(res => res.data);
};