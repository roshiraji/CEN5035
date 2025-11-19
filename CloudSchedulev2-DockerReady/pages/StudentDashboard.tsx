import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getStudentBookings, cancelBooking } from '../services/api';
import { Booking } from '../types';
import { downloadICS } from '../services/ics';
import toast, { Toaster } from 'react-hot-toast';
import { Calendar, MapPin, Download, XCircle, Clock, MessageSquare, AlertCircle, CheckCircle, X } from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBookings = async () => {
    if (user) {
      try {
        const data = await getStudentBookings(user.userId);
        setBookings(data);
      } catch (error) {
        toast.error('Failed to load bookings');
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleCancel = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await cancelBooking(bookingId);
      setBookings(bookings.filter(b => b.bookingId !== bookingId));
      toast.success('Booking cancelled');
    } catch (error) {
      toast.error('Failed to cancel booking');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" /> Confirmed
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <X className="w-3 h-3 mr-1" /> Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Toaster />
      <div className="flex justify-between items-end">
         <h2 className="text-2xl font-bold text-gray-900">My Scheduled Sessions</h2>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
        {isLoading ? (
            <div className="p-12 text-center text-gray-500">Loading bookings...</div>
        ) : bookings.length === 0 ? (
            <div className="p-12 text-center">
                <Calendar className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings yet</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by finding an instructor.</p>
            </div>
        ) : (
            <ul className="divide-y divide-gray-200">
            {bookings.map((booking) => {
                const isPast = new Date(booking.startTime) < new Date();
                const isCancelled = booking.status === 'CANCELLED';
                const isPending = booking.status === 'PENDING';
                
                // Filter out strictly cancelled bookings from this view? 
                // Usually students want to see if something was cancelled by instructor. 
                // But for simplicity, we show them unless user deleted them.
                // The API `cancelBooking` removes them from DB. 
                // `updateBookingStatus` to CANCELLED keeps them.
                
                if (isCancelled && !booking.instructorNote) {
                   // If it was hard-deleted (student cancelled), it won't be here anyway.
                   // If instructor updated status to CANCELLED, it shows here.
                }

                return (
                    <li key={booking.bookingId} className={`p-6 hover:bg-gray-50 transition duration-150 ${isCancelled ? 'bg-gray-50 opacity-75' : ''}`}>
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-start space-x-4">
                                <div className={`rounded-lg p-3 text-center min-w-[70px] ${isCancelled ? 'bg-gray-200 text-gray-500' : 'bg-blue-100 text-blue-800'}`}>
                                    <span className="block text-xs font-bold uppercase tracking-wide">
                                        {new Date(booking.startTime).toLocaleDateString([], {month: 'short'})}
                                    </span>
                                    <span className="block text-2xl font-bold">
                                        {new Date(booking.startTime).getDate()}
                                    </span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-lg font-bold text-gray-900 flex items-center">
                                            {booking.instructorName}
                                        </h4>
                                        {getStatusBadge(booking.status)}
                                        {isPast && <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">Past</span>}
                                    </div>
                                    
                                    <div className="mt-1 flex items-center text-sm text-gray-600">
                                        <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                        {new Date(booking.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} 
                                        {' - '} 
                                        {new Date(booking.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                    </div>
                                    <div className="mt-1 flex items-center text-sm text-gray-600">
                                        <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                        {booking.location}
                                    </div>
                                    
                                    {/* Student's Reason */}
                                    {booking.reason && (
                                        <div className="mt-2 flex items-start text-sm text-gray-600">
                                            <MessageSquare className="flex-shrink-0 mr-1.5 h-4 w-4 text-blue-400 mt-0.5" />
                                            <span className="italic text-gray-500">"{booking.reason}"</span>
                                        </div>
                                    )}

                                    {/* Cancellation Reason */}
                                    {isCancelled && booking.instructorNote && (
                                        <div className="mt-2 flex items-start text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100 max-w-md">
                                            <AlertCircle className="flex-shrink-0 mr-1.5 h-4 w-4 text-red-500 mt-0.5" />
                                            <span><strong>Instructor Note:</strong> {booking.instructorNote}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                                {booking.status === 'CONFIRMED' && (
                                    <button
                                        onClick={() => downloadICS(booking)}
                                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        <Download className="mr-2 h-4 w-4 text-gray-500" />
                                        Add to Calendar
                                    </button>
                                )}
                                {!isPast && !isCancelled && (
                                    <button
                                        onClick={() => handleCancel(booking.bookingId)}
                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    </li>
                );
            })}
            </ul>
        )}
      </div>
    </div>
  );
};