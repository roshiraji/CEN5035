import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createSlots, getInstructorSlots, deleteSlot, getInstructorBookings, updateBookingStatus } from '../services/api';
import { TimeSlot, Booking } from '../types';
import { Button } from '../components/Button';
import toast, { Toaster } from 'react-hot-toast';
import { Trash2, Clock, MapPin, CalendarPlus, Zap, Video, Building, Coffee, Repeat, User, Check, X, AlertTriangle } from 'lucide-react';

// --- Helpers ---
const GENERATED_TIMES = [];
for (let i = 7; i <= 20; i++) {
  const hour = i.toString().padStart(2, '0');
  GENERATED_TIMES.push(`${hour}:00`);
  GENERATED_TIMES.push(`${hour}:30`);
}

const DURATIONS = [
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '1.5 hours', value: 90 },
  { label: '2 hours', value: 120 },
  { label: '3 hours', value: 180 },
  { label: '4 hours', value: 240 },
];

const LOCATION_PRESETS = [
  { label: 'Zoom', icon: Video },
  { label: 'Google Meet', icon: Video },
  { label: 'Office 304', icon: Building },
  { label: 'Cafeteria', icon: Coffee },
];

const DAYS_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const InstructorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Cancellation Modal State
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState(60); // minutes
  const [location, setLocation] = useState('');

  // Recurring State
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState<number[]>([]); 
  const [recurringEndDate, setRecurringEndDate] = useState('');

  const fetchData = async () => {
    if (user) {
      try {
        const [slotsData, bookingsData] = await Promise.all([
          getInstructorSlots(user.userId),
          getInstructorBookings(user.userId)
        ]);
        setSlots(slotsData);
        setBookings(bookingsData.filter(b => b.status !== 'CANCELLED')); // Don't show cancelled history in main view
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const calculateEndTime = (start: string, durationMins: number) => {
    const [h, m] = start.split(':').map(Number);
    const totalMins = h * 60 + m + durationMins;
    const newH = Math.floor(totalMins / 60);
    const newM = totalMins % 60;
    return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
  };

  const handleRecurringToggle = () => {
    const newState = !isRecurring;
    setIsRecurring(newState);
    
    if (newState) {
      const current = new Date(date);
      if (recurringDays.length === 0) {
         setRecurringDays([current.getDay()]);
      }
      if (!recurringEndDate) {
         const nextMonth = new Date(current);
         nextMonth.setMonth(nextMonth.getMonth() + 1);
         setRecurringEndDate(nextMonth.toISOString().split('T')[0]);
      }
    }
  };

  const toggleDay = (dayIndex: number) => {
    if (recurringDays.includes(dayIndex)) {
      setRecurringDays(recurringDays.filter(d => d !== dayIndex));
    } else {
      setRecurringDays([...recurringDays, dayIndex].sort());
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!location.trim()) {
      toast.error("Please specify a location");
      return;
    }
    
    const endTime = calculateEndTime(startTime, duration);
    setIsCreating(true);

    try {
      if (isRecurring) {
         const start = new Date(date);
         const end = new Date(recurringEndDate);
         
         if (!recurringEndDate || end <= start) {
             toast.error("Invalid end date");
             setIsCreating(false);
             return;
         }
         
         if (recurringDays.length === 0) {
             toast.error("Select at least one day.");
             setIsCreating(false);
             return;
         }

         let current = new Date(start);
         let createdCount = 0;
         let loopCount = 0;

         while (current <= end && loopCount < 120) {
            if (recurringDays.includes(current.getDay())) {
                const year = current.getFullYear();
                const month = String(current.getMonth() + 1).padStart(2, '0');
                const day = String(current.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;

                await createSlots(user.userId, dateStr, startTime, endTime, location);
                createdCount++;
            }
            current.setDate(current.getDate() + 1);
            loopCount++;
         }
         toast.success(`Created ${createdCount} slots.`);
      } else {
         await createSlots(user.userId, date, startTime, endTime, location);
         toast.success('Slot created!');
      }
      
      await fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to create slots');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!window.confirm('Remove this available slot?')) return;
    try {
      await deleteSlot(slotId);
      setSlots(slots.filter(s => s.slotId !== slotId));
      toast.success('Slot removed');
    } catch (error) {
      toast.error('Failed to remove slot');
    }
  };

  const handleConfirmBooking = async (booking: Booking) => {
    try {
        await updateBookingStatus(booking.bookingId, 'CONFIRMED');
        toast.success('Booking Confirmed');
        fetchData();
    } catch (error) {
        toast.error('Failed to confirm');
    }
  };

  const initiateCancel = (booking: Booking) => {
    setBookingToCancel(booking);
    setCancelReason('');
  };

  const submitCancellation = async () => {
    if (!bookingToCancel) return;
    if (!cancelReason.trim()) {
        toast.error("Please provide a reason for cancellation");
        return;
    }

    try {
        await updateBookingStatus(bookingToCancel.bookingId, 'CANCELLED', cancelReason);
        toast.success('Booking rejected/cancelled');
        setBookingToCancel(null);
        fetchData();
    } catch (error) {
        toast.error('Failed to cancel');
    }
  };

  const applyPreset = (type: 'morning' | 'afternoon' | 'tomorrow_morning') => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    switch (type) {
      case 'morning':
        setDate(formatDate(today));
        setStartTime('09:00');
        setDuration(180);
        break;
      case 'afternoon':
        setDate(formatDate(today));
        setStartTime('13:00');
        setDuration(240);
        break;
      case 'tomorrow_morning':
        setDate(formatDate(tomorrow));
        setStartTime('09:00');
        setDuration(180);
        break;
    }
    if(!location) setLocation('Zoom');
    setIsRecurring(false);
    toast.success("Preset applied!");
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-8">
      <Toaster position="top-center" />
      
      {/* --- SECTION 1: INCOMING BOOKINGS --- */}
      <div className="space-y-4">
         <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Incoming Requests & Appointments</h2>
         </div>
         
         {isLoading ? (
             <div className="h-32 bg-gray-100 rounded animate-pulse"></div>
         ) : bookings.length === 0 ? (
             <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                 <div className="mx-auto h-12 w-12 text-gray-300 mb-2 bg-gray-50 rounded-full flex items-center justify-center">
                     <User className="h-6 w-6" />
                 </div>
                 <p className="text-gray-500">No upcoming appointments or requests.</p>
             </div>
         ) : (
             <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                 {bookings.map(booking => {
                     const isPending = booking.status === 'PENDING';
                     return (
                         <div key={booking.bookingId} className={`bg-white rounded-xl p-5 border shadow-sm relative ${isPending ? 'border-yellow-300 ring-1 ring-yellow-100' : 'border-gray-200'}`}>
                             {isPending && (
                                 <span className="absolute top-0 right-0 bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg">
                                     PENDING REQUEST
                                 </span>
                             )}
                             {!isPending && (
                                 <span className="absolute top-0 right-0 bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg">
                                     CONFIRMED
                                 </span>
                             )}
                             
                             <div className="flex items-start mb-3 mt-2">
                                 <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold mr-3">
                                     {booking.studentName.charAt(0)}
                                 </div>
                                 <div>
                                     <h3 className="font-bold text-gray-900">{booking.studentName}</h3>
                                     <p className="text-xs text-gray-500">Student</p>
                                 </div>
                             </div>
                             
                             <div className="space-y-2 text-sm text-gray-600 mb-4">
                                 <div className="flex items-center">
                                     <CalendarPlus className="w-4 h-4 mr-2 text-gray-400" />
                                     {new Date(booking.startTime).toLocaleDateString([], {weekday:'short', month:'short', day:'numeric'})}
                                 </div>
                                 <div className="flex items-center">
                                     <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                     {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                                 </div>
                                 {booking.reason && (
                                    <div className="bg-gray-50 p-2 rounded text-xs italic border border-gray-100">
                                        "{booking.reason}"
                                    </div>
                                 )}
                             </div>

                             <div className="flex space-x-2 pt-2 border-t border-gray-100">
                                 {isPending && (
                                     <button 
                                        onClick={() => handleConfirmBooking(booking)}
                                        className="flex-1 bg-green-600 text-white text-sm py-2 rounded hover:bg-green-700 flex items-center justify-center font-medium"
                                     >
                                         <Check className="w-4 h-4 mr-1" /> Confirm
                                     </button>
                                 )}
                                 <button 
                                    onClick={() => initiateCancel(booking)}
                                    className={`flex-1 border border-gray-300 text-gray-700 text-sm py-2 rounded hover:bg-gray-50 flex items-center justify-center font-medium ${!isPending ? 'w-full' : ''}`}
                                 >
                                     <X className="w-4 h-4 mr-1" /> {isPending ? 'Reject' : 'Cancel'}
                                 </button>
                             </div>
                         </div>
                     );
                 })}
             </div>
         )}
      </div>

      <div className="border-t border-gray-200 my-8"></div>

      {/* --- SECTION 2: MANAGE AVAILABILITY (EXISTING FORM) --- */}
      <div className="bg-white shadow rounded-xl overflow-hidden border border-gray-200">
        <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex justify-between items-center flex-wrap gap-2">
           <div className="flex items-center text-blue-900 font-medium">
              <CalendarPlus className="mr-2 h-5 w-5" />
              Create Availability
           </div>
           <div className="flex space-x-2">
              <span className="text-xs font-medium text-blue-600 uppercase tracking-wider self-center mr-2 hidden sm:block">Quick Presets:</span>
              <button onClick={() => applyPreset('morning')} className="px-3 py-1 bg-white text-blue-700 text-xs rounded-full shadow-sm border border-blue-200 hover:bg-blue-50 transition flex items-center">
                <Zap className="w-3 h-3 mr-1" /> Today AM
              </button>
              <button onClick={() => applyPreset('afternoon')} className="px-3 py-1 bg-white text-blue-700 text-xs rounded-full shadow-sm border border-blue-200 hover:bg-blue-50 transition flex items-center">
                <Zap className="w-3 h-3 mr-1" /> Today PM
              </button>
              <button onClick={() => applyPreset('tomorrow_morning')} className="px-3 py-1 bg-white text-blue-700 text-xs rounded-full shadow-sm border border-blue-200 hover:bg-blue-50 transition flex items-center">
                <Zap className="w-3 h-3 mr-1" /> Tmrw AM
              </button>
           </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                   {isRecurring ? 'Start Date' : 'Date'}
                </label>
                <input
                  type="date"
                  required
                  className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <div className="relative">
                  <select
                    className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm appearance-none"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  >
                    {GENERATED_TIMES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <Clock className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <select
                  className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                >
                  {DURATIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label} (Ends {calculateEndTime(startTime, d.value)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t border-b border-gray-100 py-4 my-2">
                <div className="flex items-center mb-3">
                  <button
                    type="button"
                    onClick={handleRecurringToggle}
                    className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isRecurring ? 'bg-blue-600' : 'bg-gray-200'}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${isRecurring ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                  <span className="ml-3 text-sm font-medium text-gray-900 flex items-center">
                    <Repeat className="w-4 h-4 mr-1.5 text-gray-500" />
                    Recurring Availability
                  </span>
                </div>

                {isRecurring && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Repeat On</label>
                            <div className="flex space-x-2">
                                {DAYS_LABELS.map((dayLabel, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => toggleDay(idx)}
                                        className={`w-9 h-9 rounded-full text-sm font-bold flex items-center justify-center transition-all duration-200
                                            ${recurringDays.includes(idx) 
                                                ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-200 transform scale-105' 
                                                : 'bg-white text-gray-400 border border-gray-200 hover:bg-gray-100 hover:text-gray-600'
                                            }`}
                                    >
                                        {dayLabel}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Until Date</label>
                             <input 
                                type="date" 
                                required={isRecurring}
                                className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                value={recurringEndDate}
                                onChange={(e) => setRecurringEndDate(e.target.value)}
                                min={date}
                             />
                        </div>
                    </div>
                  </div>
                )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                {LOCATION_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setLocation(p.label)}
                    className={`flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition
                      ${location === p.label 
                        ? 'bg-blue-100 text-blue-800 border-blue-300 ring-2 ring-blue-500 ring-offset-1' 
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                  >
                    <p.icon className="w-3 h-3 mr-1.5" />
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Enter custom location..."
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-2.5"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" isLoading={isCreating} className="w-full sm:w-auto">
                {isCreating ? 'Generating...' : isRecurring ? 'Generate Recurring Slots' : 'Generate Availability'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Slot List */}
      <div className="bg-white shadow rounded-xl overflow-hidden border border-gray-200">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Active Unbooked Slots</h3>
          <span className="bg-gray-100 text-gray-600 py-1 px-2.5 rounded-full text-xs font-medium">
            {slots.filter(s => !s.isBooked).length} Available
          </span>
        </div>
        <div className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
            {slots.filter(s => !s.isBooked).length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">No open slots. Use the form to add some.</div>
            ) : (
                slots.filter(s => !s.isBooked).map((slot) => (
                <div key={slot.slotId} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition">
                    <div className="flex items-center space-x-4">
                        <div className="bg-gray-100 text-gray-600 p-2 rounded-lg text-center min-w-[60px] border border-gray-200">
                            <div className="text-xs font-bold uppercase">{new Date(slot.startTime).toLocaleDateString([], {month:'short'})}</div>
                            <div className="text-xl font-bold leading-none mt-0.5">{new Date(slot.startTime).getDate()}</div>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">
                                {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                            </p>
                            <div className="flex items-center mt-1 text-xs text-gray-500">
                                <MapPin className="w-3 h-3 mr-1" /> {slot.location}
                            </div>
                        </div>
                    </div>
                    <button onClick={() => handleDeleteSlot(slot.slotId)} className="text-gray-400 hover:text-red-600 p-2">
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
                ))
            )}
        </div>
      </div>

      {/* Cancel Modal */}
      {bookingToCancel && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setBookingToCancel(null)}></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    {bookingToCancel.status === 'PENDING' ? 'Reject Request' : 'Cancel Appointment'}
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500 mb-4">
                                        Please provide a reason for the student. This action cannot be undone and the slot will be opened again.
                                    </p>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                                    <textarea 
                                        className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        rows={3}
                                        placeholder="e.g., Urgent meeting conflict, Personal emergency..."
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button 
                            type="button"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={submitCancellation}
                        >
                            Confirm {bookingToCancel.status === 'PENDING' ? 'Rejection' : 'Cancellation'}
                        </button>
                        <button 
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={() => setBookingToCancel(null)}
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};