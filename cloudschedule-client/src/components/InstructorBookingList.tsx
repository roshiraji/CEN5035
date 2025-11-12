import React from 'react';
import { ListGroup, Badge } from 'react-bootstrap';
import { DetailedBooking } from '../models/entities';

interface InstructorBookingListProps {
  bookings: DetailedBooking[];
}

const InstructorBookingList: React.FC<InstructorBookingListProps> = ({ bookings }) => {
  if (bookings.length === 0) {
    return <p>You have no upcoming booked appointments.</p>;
  }

  // Helper function to format dates
  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <ListGroup>
      {bookings.map((booking) => (
        <ListGroup.Item
          key={booking.bookingId}
          className="d-flex justify-content-between align-items-start"
        >
          <div className="ms-2 me-auto">
            <div className="fw-bold">
              {formatDateTime(booking.slot.startTime)}
            </div>
            Booked by: {booking.student.displayName} ({booking.student.email})
            <br />
            Location: {booking.slot.location}
          </div>
          <Badge bg="success" pill>
            {booking.status}
          </Badge>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
};

export default InstructorBookingList;