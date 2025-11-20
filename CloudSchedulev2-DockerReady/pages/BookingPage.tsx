import React, { useEffect, useState } from 'react';
import { getInstructors } from '../services/api';
import { User } from '../types';
import { useNavigate } from 'react-router-dom';
import { UserCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export const BookingPage: React.FC = () => {
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

  return (
    <div className="space-y-6">
      <div className="text-center sm:text-left">
        <h2 className="text-2xl font-bold text-gray-900">Select an Instructor</h2>
        <p className="mt-1 text-gray-500">Choose an instructor to view their available office hours.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
           {[1,2,3].map(i => (
               <div key={i} className="bg-white animate-pulse h-32 rounded-lg shadow border border-gray-200"></div>
           ))}
        </div>
      ) : instructors.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500">No instructors found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {instructors.map((instructor) => (
            <div
              key={instructor.userId}
              className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-300 cursor-pointer group"
              onClick={() => navigate(`/book/${instructor.userId}`)}
            >
              <div className="px-6 py-6 flex items-center space-x-4">
                <div className="flex-shrink-0">
                   <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
                        {instructor.displayName.charAt(0).toUpperCase()}
                   </div>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-lg font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {instructor.displayName}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                        {instructor.email}
                    </p>
                </div>
                <div>
                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500" />
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3">
                <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                   View Availability &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};