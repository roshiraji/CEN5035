import React, { useState } from 'react';
import './App.css';

interface Appointment {
  name: string;
  time: string;
}

const timeSlots = [
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '1:00 PM',
  '1:30 PM',
  '2:00 PM',
  '2:30 PM',
];

function App() {
  const [name, setName] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const handleSchedule = () => {
    if (!name || !selectedTime) {
      alert('Please enter your name and select a time slot.');
      return;
    }

    // Check if time is already taken
    const isTaken = appointments.some(app => app.time === selectedTime);
    if (isTaken) {
      alert('That time slot is already taken.');
      return;
    }

    const newAppointment: Appointment = { name, time: selectedTime };
    setAppointments([...appointments, newAppointment]);
    setName('');
    setSelectedTime('');
  };

  return (
    <div className="App" style={{ maxWidth: 500, margin: 'auto', padding: 20 }}>
      <h1>Office Hours Scheduler</h1>

      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ padding: 8, width: '100%', marginBottom: 10 }}
        />

        <select
          value={selectedTime}
          onChange={e => setSelectedTime(e.target.value)}
          style={{ padding: 8, width: '100%' }}
        >
          <option value="">Select a time slot</option>
          {timeSlots.map(time => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>
      </div>

      <button onClick={handleSchedule} style={{ padding: 10, width: '100%' }}>
        Schedule Appointment
      </button>

      <h2 style={{ marginTop: 30 }}>Scheduled Appointments</h2>
      <ul>
        {appointments.map((appt, index) => (
          <li key={index}>
            {appt.time} — {appt.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
