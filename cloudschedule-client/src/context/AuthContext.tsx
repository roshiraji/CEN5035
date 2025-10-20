import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { ClientPrincipal, AuthMeResponse } from '../models/auth';
import { User } from '../models/entities';
import { getMyProfile } from '../services/apiService';

// --- MOCK DATA FOR LOCAL DEVELOPMENT ---
const MOCK_INSTRUCTOR_PRINCIPAL: ClientPrincipal = {
  identityProvider: 'github',
  userId: 'mock-instructor-uuid',
  userDetails: 'instructor@test.com',
  userRoles: ['authenticated'],
};

const MOCK_INSTRUCTOR_USER: User = {
  userId: 'mock-instructor-uuid',
  displayName: 'Dr. Test Instructor',
  email: 'instructor@test.com',
  role: 'INSTRUCTOR',
};

const MOCK_STUDENT_PRINCIPAL: ClientPrincipal = {
  identityProvider: 'github',
  userId: 'mock-student-uuid',
  userDetails: 'student@test.com',
  userRoles: ['authenticated'],
};

const MOCK_STUDENT_USER: User = {
  userId: 'mock-student-uuid',
  displayName: 'Test Student',
  email: 'student@test.com',
  role: 'STUDENT',
};

// Map roles to mock data
const mockData = {
  INSTRUCTOR: {
    principal: MOCK_INSTRUCTOR_PRINCIPAL,
    user: MOCK_INSTRUCTOR_USER,
  },
  STUDENT: {
    principal: MOCK_STUDENT_PRINCIPAL,
    user: MOCK_STUDENT_USER,
  },
};
// --- END MOCK DATA ---


// Define the shape of the context
interface AuthContextType {
  clientPrincipal: ClientPrincipal | null;
  currentUser: User | null;
  loading: boolean;
  setMockRole: (role: 'INSTRUCTOR' | 'STUDENT') => void; // New function
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provider component that wraps the application and manages auth state.
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clientPrincipal, setClientPrincipal] = useState<ClientPrincipal | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // New function to set the mock user
  const setMockRole = (role: 'INSTRUCTOR' | 'STUDENT') => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`--- SWITCHING MOCK ROLE TO: ${role} ---`);
      setClientPrincipal(mockData[role].principal);
      setCurrentUser(mockData[role].user);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      // Check if we are in the local development environment
      if (process.env.NODE_ENV === 'development') {
        console.warn('--- AUTH MOCK ENABLED ---');
        // Default to instructor on first load
        setMockRole('INSTRUCTOR');
        setLoading(false);
        return; // Stop execution
      }

      // --- Production/Azure Logic (runs when not in 'development') ---
      try {
        const res = await fetch('/.auth/me');
        const data: AuthMeResponse = await res.json();
        setClientPrincipal(data.clientPrincipal);

        if (data.clientPrincipal) {
          const userProfile = await getMyProfile();
          setCurrentUser(userProfile);
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ clientPrincipal, currentUser, loading, setMockRole }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to easily consume the AuthContext
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};