import { User, UserRole, TimeSlot, Booking, AuthResponse } from '../types';
import { STORAGE_KEYS } from '../constants';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:18081/api';

// Helper to get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
};

// Helper for API requests
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// --- AUTH SERVICES ---

export const register = async (email: string, password: string, displayName: string, role: UserRole): Promise<AuthResponse> => {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName, role }),
  });
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};

// --- USER SERVICES ---
export const getInstructors = async (): Promise<User[]> => {
  return apiRequest<User[]>('/users/instructors');
};

// --- SLOT SERVICES ---

export const createSlots = async (instructorId: string, date: string, startTimeStr: string, endTimeStr: string, location: string): Promise<void> => {
  await apiRequest('/slots', {
    method: 'POST',
    body: JSON.stringify({ date, startTimeStr, endTimeStr, location }),
  });
};

export const getInstructorSlots = async (instructorId: string): Promise<TimeSlot[]> => {
  return apiRequest<TimeSlot[]>(`/slots/instructor/${instructorId}`);
};

export const deleteSlot = async (slotId: string): Promise<void> => {
  await apiRequest(`/slots/${slotId}`, {
    method: 'DELETE',
  });
};

// --- BOOKING SERVICES ---

export const bookSlot = async (slotId: string, studentId: string, reason: string = ''): Promise<Booking> => {
  // Note: studentId is kept for backward compatibility but backend uses token
  return apiRequest<Booking>('/bookings', {
    method: 'POST',
    body: JSON.stringify({ slotId, reason }),
  });
};

export const getStudentBookings = async (studentId: string): Promise<Booking[]> => {
  return apiRequest<Booking[]>(`/bookings/student/${studentId}`);
};

export const getInstructorBookings = async (instructorId: string): Promise<Booking[]> => {
  return apiRequest<Booking[]>(`/bookings/instructor/${instructorId}`);
};

export const updateBookingStatus = async (bookingId: string, status: 'CONFIRMED' | 'CANCELLED', instructorNote: string = ''): Promise<void> => {
  await apiRequest(`/bookings/${bookingId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, instructorNote }),
  });
};

export const cancelBooking = async (bookingId: string): Promise<void> => {
  await apiRequest(`/bookings/${bookingId}`, {
    method: 'DELETE',
  });
};

// --- ADMIN SERVICES ---

export const getAllUsers = async (): Promise<User[]> => {
  return apiRequest<User[]>('/admin');
};

export const deleteUser = async (userId: string): Promise<void> => {
  await apiRequest(`/admin/${userId}`, {
    method: 'DELETE',
  });
};

export const resetUserPassword = async (userId: string, password: string): Promise<void> => {
  await apiRequest(`/admin/${userId}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
};