import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { InstructorDashboard } from './InstructorDashboard';
import { StudentDashboard } from './StudentDashboard';
import { BookingPage } from './BookingPage';
import { UserRole, User } from '../types';
import { getInstructors } from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight } from 'lucide-react';

// Compact instructor list for sidebar
const InstructorListSidebar: React.FC = () => {
  const [instructors, setInstructors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const data = await getInstructors();
        setInstructors(data);
      } catch (error) {
        toast.error('Failed to load instructors');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInstructors();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="bg-white animate-pulse h-16 rounded-lg border border-blue-200"></div>
        ))}
      </div>
    );
  }

  if (instructors.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-blue-600">
        <p>No instructors available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {instructors.map((instructor) => (
        <div
          key={instructor.userId}
          onClick={() => navigate(`/book/${instructor.userId}`)}
          className="bg-white rounded-lg border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all duration-200 cursor-pointer group p-4"
        >
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                {instructor.displayName.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                {instructor.displayName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {instructor.email}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null; // Should be handled by protected route, but safe check

  return (
    <div className="max-w-7xl mx-auto">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500">Welcome back, {user.displayName}</p>
        </div>
        
        {user.role === UserRole.INSTRUCTOR ? (
            <InstructorDashboard />
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <StudentDashboard />
                </div>
                <div className="lg:col-span-1">
                    <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
                        <h3 className="text-lg font-bold text-blue-900 mb-2">Need to meet an instructor?</h3>
                        <p className="text-blue-700 text-sm mb-4">Browse available instructors and book a slot that fits your schedule.</p>
                        <InstructorListSidebar />
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};