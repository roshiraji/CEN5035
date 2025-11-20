import { Booking } from "../types";

export const downloadICS = (booking: Booking) => {
  const formatDate = (dateStr: string) => {
    return dateStr.replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const start = formatDate(booking.startTime);
  const end = formatDate(booking.endTime);
  const now = formatDate(new Date().toISOString());

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CloudSchedule//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
DTSTAMP:${now}
DTSTART:${start}
DTEND:${end}
SUMMARY:Office Hours with ${booking.instructorName}
LOCATION:${booking.location}
DESCRIPTION:Booked via CloudSchedule
STATUS:CONFIRMED
UID:${booking.bookingId}@cloudschedule.com
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `booking-${booking.startTime}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};