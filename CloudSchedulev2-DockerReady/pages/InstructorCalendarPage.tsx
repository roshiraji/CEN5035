import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInstructorSlots, bookSlot, getInstructors } from '../services/api';
import { TimeSlot, User } from '../types';
import { useAuth } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import { Button } from '../components/Button';
import { Calendar, MapPin, Clock, ChevronLeft, AlertCircle, CheckCircle } from 'lucide-react';

export const InstructorCalendarPage: React.FC = () => {
  const { instructorId } = useParams<{ instructorId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [instructor, setInstructor] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Booking Modal State
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingReason, setBookingReason] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!instructorId) return;
      try {
        const [instructorsData, slotsData] = await Promise.all([
          getInstructors(),
          getInstructorSlots(instructorId)
        ]);
        
        const currentInstructor = instructorsData.find(i => i.userId === instructorId);
        setInstructor(currentInstructor || null);
        setSlots(slotsData);
      } catch (error) {
        toast.error('Could not load calendar data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [instructorId]);

  const initiateBooking = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setBookingReason('');
  };

  const confirmBooking = async () => {
    if (!user || !selectedSlot) return;
    
    setProcessingId(selectedSlot.slotId);
    try {
      await bookSlot(selectedSlot.slotId, user.userId, bookingReason);
      toast.success('Booking confirmed!');
      // Optimistic update
      setSlots(prev => prev.map(s => s.slotId === selectedSlot.slotId ? { ...s, isBooked: true } : s));
      
      // Close modal immediately
      setSelectedSlot(null);
      
      // Redirect after short delay
      setTimeout(() => navigate('/student-dashboard'), 1000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to book slot');
      setProcessingId(null); // Only clear processing if error, otherwise let redirection happen
    }
  };

  // Group slots by date
  const groupedSlots = slots.reduce((acc, slot) => {
    const dateKey = new Date(slot.startTime).toLocaleDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);

  const sortedDates = Object.keys(groupedSlots).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  if (loading) return <div className="p-10 text-center">Loading calendar...</div>;

  return (
    <div className="space-y-6">
      <Toaster />
      <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/book')} className="p-2 rounded-full hover:bg-gray-200 transition">
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Book with {instructor?.displayName}
              </h2>
              <p className="text-gray-500 text-sm">Select a time slot below to secure your appointment.</p>
          </div>
      </div>

      {sortedDates.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow text-center border border-gray-200">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No Available Slots</h3>
            <p className="text-gray-500">This instructor hasn't posted any availability yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map((date) => (
            <div key={date} className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center">
                <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">
                   {new Date(date).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedSlots[date].map((slot) => {
                    const isPast = new Date(slot.startTime) < new Date();
                    const isAvailable = !slot.isBooked && !isPast;

                    return (
                        <div 
                            key={slot.slotId} 
                            className={`
                                border rounded-lg p-4 transition duration-200 flex flex-col justify-between
                                ${isAvailable ? 'border-gray-200 hover:border-blue-300 hover:shadow-sm bg-white' : 'border-gray-100 bg-gray-50 opacity-70'}
                            `}
                        >
                            <div className="mb-4">
                                <div className="flex items-center text-gray-900 font-semibold text-lg mb-1">
                                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                    {new Date(slot.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                    {slot.location}
                                </div>
                            </div>
                            
                            {isAvailable ? (
                                <Button 
                                    onClick={() => initiateBooking(slot)} 
                                    className="w-full"
                                >
                                    Book Slot
                                </Button>
                            ) : (
                                <button disabled className="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed">
                                    {isPast ? 'Past' : 'Unavailable'}
                                </button>
                            )}
                        </div>
                    );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setSelectedSlot(null)}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                                <CheckCircle className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                    Confirm Booking
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500 mb-4">
                                        You are about to book an office hour slot. Please confirm the details below.
                                    </p>
                                    <div className="bg-gray-50 p-3 rounded-md border border-gray-200 text-sm mb-4">
                                        <div className="grid grid-cols-3 gap-2">
                                            <span className="font-semibold text-gray-600">Instructor:</span>
                                            <span className="col-span-2 text-gray-900">{instructor?.displayName}</span>
                                            
                                            <span className="font-semibold text-gray-600">Time:</span>
                                            <span className="col-span-2 text-gray-900">
                                                {new Date(selectedSlot.startTime).toLocaleDateString()} <br/>
                                                {new Date(selectedSlot.startTime).toLocaleTimeString([],{hour:'2-digit', minute:'2-digit'})} - {new Date(selectedSlot.endTime).toLocaleTimeString([],{hour:'2-digit', minute:'2-digit'})}
                                            </span>

                                            <span className="font-semibold text-gray-600">Location:</span>
                                            <span className="col-span-2 text-gray-900">{selectedSlot.location}</span>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                                            Reason for visit (Optional)
                                        </label>
                                        <textarea
                                            id="reason"
                                            rows={3}
                                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md border p-2"
                                            placeholder="e.g., Discussing Midterm results, Project help..."
                                            value={bookingReason}
                                            onChange={(e) => setBookingReason(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <Button 
                            onClick={confirmBooking}
                            isLoading={!!processingId}
                            className="w-full sm:w-auto sm:ml-3"
                        >
                            Confirm Booking
                        </Button>
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={() => setSelectedSlot(null)}
                            disabled={!!processingId}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};