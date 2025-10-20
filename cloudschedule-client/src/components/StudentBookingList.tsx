import React from 'react';
import { ListGroup, Badge, Button } from 'react-bootstrap';
import { DetailedBooking } from '../models/entities';

interface StudentBookingListProps {
  bookings: DetailedBooking[];
  onCancel: (bookingId: string) => void; // Callback for the "Cancel" button
  onDownloadICS: (bookingId: string, slotTime: string) => void; // New callback
}

const StudentBookingList: React.FC<StudentBookingListProps> = ({ 
  bookings, 
  onCancel, 
  onDownloadICS 
}) => {
  if (bookings.length === 0) {
    return <p>You have no upcoming appointments.</p>;
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
          className="d-flex justify-content-between align-items-center"
        >
          <div className="ms-2 me-auto">
            <div className="fw-bold">
              {formatDateTime(booking.slot.startTime)}
            </div>
            <div>Location: {booking.slot.location}</div>
          </div>
          <div>
            <Badge bg="success" pill className="me-3">
              {booking.status}
            </Badge>
            <Button
              variant="outline-secondary"
              size="sm"
              className="me-2" // Added margin
              onClick={() => onDownloadICS(booking.bookingId, booking.slot.startTime)}
            >
              Download Invite
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => onCancel(booking.bookingId)}
            >
              Cancel
            </Button>
          </div>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
};

export default StudentBookingList;