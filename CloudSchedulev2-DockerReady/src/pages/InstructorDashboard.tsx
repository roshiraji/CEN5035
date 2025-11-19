import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createSlots, getInstructorSlots, deleteSlot } from '../services/api';
import { TimeSlot } from '../types';
import { Button } from '../components/Button';
import toast, { Toaster } from 'react-hot-toast';
import { Trash2, Clock, MapPin, CalendarPlus, Zap, Video, Building, Coffee } from 'lucide-react';

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

export const InstructorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState(60); // minutes
  const [location, setLocation] = useState('');

  const fetchSlots = async () => {
    if (user) {
      try {
        const data = await getInstructorSlots(user.userId);
        setSlots(data);
      } catch (error) {
        toast.error('Failed to load slots');
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const calculateEndTime = (start: string, durationMins: number) => {
    const [h, m] = start.split(':').map(Number);
    const totalMins = h * 60 + m + durationMins;
    const newH = Math.floor(totalMins / 60);
    const newM = totalMins % 60;
    return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
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
      await createSlots(user.userId, date, startTime, endTime, location);
      toast.success('Availability generated successfully!');
      await fetchSlots();
    } catch (error) {
      toast.error('Failed to create slots');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (slotId: string) => {
    if (!window.confirm('Are you sure you want to remove this slot?')) return;
    try {
      await deleteSlot(slotId);
      setSlots(slots.filter(s => s.slotId !== slotId));
      toast.success('Slot removed');
    } catch (error) {
      toast.error('Failed to remove slot');
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
        setDuration(180); // 3 hours
        break;
      case 'afternoon':
        setDate(formatDate(today));
        setStartTime('13:00');
        setDuration(240); // 4 hours
        break;
      case 'tomorrow_morning':
        setDate(formatDate(tomorrow));
        setStartTime('09:00');
        setDuration(180);
        break;
    }
    if(!location) setLocation('Zoom');
    toast.success("Preset applied! Click 'Generate' to confirm.");
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-center" />
      
      {/* Quick Actions & Form */}
      <div className="bg-white shadow rounded-xl overflow-hidden border border-gray-200">
        <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex justify-between items-center flex-wrap gap-2">
           <div className="flex items-center text-blue-900 font-medium">
              <CalendarPlus className="mr-2 h-5 w-5" />
              Create Availability
           </div>
           <div className="flex space-x-2">
              <span className="text-xs font-medium text-blue-600 uppercase tracking-wider self-center mr-2 hidden sm:block">Quick Presets:</span>
              <button onClick={() => applyPreset('morning')} className="px-3 py-1 bg-white text-blue-700 text-xs rounded-full shadow-sm border border-blue-200 hover:bg-blue-50 transition flex items-center">
                <Zap className="w-3 h-3 mr-1" /> Today Morning
              </button>
              <button onClick={() => applyPreset('afternoon')} className="px-3 py-1 bg-white text-blue-700 text-xs rounded-full shadow-sm border border-blue-200 hover:bg-blue-50 transition flex items-center">
                <Zap className="w-3 h-3 mr-1" /> Today Afternoon
              </button>
              <button onClick={() => applyPreset('tomorrow_morning')} className="px-3 py-1 bg-white text-blue-700 text-xs rounded-full shadow-sm border border-blue-200 hover:bg-blue-50 transition flex items-center">
                <Zap className="w-3 h-3 mr-1" /> Tomorrow AM
              </button>
           </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              {/* Start Time Selection */}
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

              {/* Duration Selection */}
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

            {/* Location Selection */}
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
                  placeholder="Enter custom location or select above..."
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-2.5"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" isLoading={isCreating} className="w-full sm:w-auto">
                Generate Availability Slots
              </Button>
              <span className="ml-4 text-sm text-gray-500">
                Creates {Math.floor(duration / 30)} slot(s) of 30 minutes each.
              </span>
            </div>
          </form>
        </div>
      </div>

      {/* Slot List */}
      <div className="bg-white shadow rounded-xl overflow-hidden border border-gray-200">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Your Active Slots</h3>
          <span className="bg-gray-100 text-gray-600 py-1 px-2.5 rounded-full text-xs font-medium">
            {slots.length} Total
          </span>
        </div>
        <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading slots...</div>
          ) : slots.length === 0 ? (
            <div className="p-12 text-center">
               <div className="mx-auto h-12 w-12 text-gray-300 mb-3">
                  <Clock className="h-full w-full" />
               </div>
               <p className="text-gray-500 text-sm">No availability slots active.</p>
               <p className="text-gray-400 text-xs mt-1">Use the form above to start accepting bookings.</p>
            </div>
          ) : (
            slots.map((slot) => (
              <div key={slot.slotId} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition group">
                <div className="flex items-center space-x-4">
                   <div className="bg-blue-50 text-blue-700 p-2 rounded-lg text-center min-w-[60px] border border-blue-100">
                        <div className="text-xs font-bold uppercase tracking-wide">{new Date(slot.startTime).toLocaleDateString([], {month:'short'})}</div>
                        <div className="text-xl font-bold leading-none mt-0.5">{new Date(slot.startTime).getDate()}</div>
                   </div>
                   <div>
                        <p className="text-sm font-semibold text-gray-900 flex items-center">
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                        </p>
                        <div className="flex items-center mt-1">
                            <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" />
                            <span className="text-sm text-gray-500">{slot.location}</span>
                        </div>
                   </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full ${slot.isBooked ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {slot.isBooked ? 'BOOKED' : 'AVAILABLE'}
                  </span>
                  {!slot.isBooked && (
                    <button
                      onClick={() => handleDelete(slot.slotId)}
                      className="text-gray-400 hover:text-red-600 transition p-2 rounded-full hover:bg-red-50"
                      title="Delete Slot"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
