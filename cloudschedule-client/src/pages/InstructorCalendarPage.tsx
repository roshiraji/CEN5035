import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TimeSlot } from '../models/entities';
import { getInstructorSlots, bookSlot } from '../services/apiService';
import { Spinner, Alert, ListGroup, Button, Modal } from 'react-bootstrap';

const InstructorCalendarPage: React.FC = () => {
  const { instructorId } = useParams<{ instructorId: string }>();
  const navigate = useNavigate();
  
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for confirmation modal
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  const fetchSlots = useCallback(async () => {
    if (!instructorId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await getInstructorSlots(instructorId);
      // Filter for *only* available slots and sort them
      const availableSlots = data
        .filter(slot => !slot.isBooked)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      
      setSlots(availableSlots);
    } catch (err) {
      console.error(err);
      setError('Failed to load available slots.');
    } finally {
      setLoading(false);
    }
  }, [instructorId]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const handleBookSlot = async () => {
    if (!selectedSlot) return;

    setIsBooking(true);
    setError(null);

    try {
      await bookSlot(selectedSlot.slotId);
      // Booking successful
      setSelectedSlot(null);
      setIsBooking(false);
      // Navigate to the student's dashboard to see their new booking
      navigate('/dashboard'); 
    } catch (err) {
      console.error(err);
      setError('Failed to book slot. It may have just been taken. Please refresh.');
      setIsBooking(false);
    }
  };

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString([], {
      dateStyle: 'full',
      timeStyle: 'short',
    });
  };

  const renderContent = () => {
    if (loading) {
      return <div className="text-center"><Spinner animation="border" /></div>;
    }
    if (error) {
      return <Alert variant="danger">{error}</Alert>;
    }
    if (slots.length === 0) {
      return <Alert variant="info">This instructor has no available slots.</Alert>;
    }

    return (
      <ListGroup>
        {slots.map((slot) => (
          <ListGroup.Item
            key={slot.slotId}
            className="d-flex justify-content-between align-items-center"
          >
            <div>
              <div className="fw-bold">{formatDateTime(slot.startTime)}</div>
              <div>Location: {slot.location}</div>
            </div>
            <Button variant="success" onClick={() => setSelectedSlot(slot)}>
              Book
            </Button>
          </ListGroup.Item>
        ))}
      </ListGroup>
    );
  };

  return (
    <>
      <h2>Available Appointments</h2>
      <p>Select a time slot to book.</p>
      {renderContent()}

      {/* Confirmation Modal */}
      <Modal show={selectedSlot !== null} onHide={() => setSelectedSlot(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Booking</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSlot && (
            <>
              <p>Are you sure you want to book this appointment?</p>
              <p><strong>Time:</strong> {formatDateTime(selectedSlot.startTime)}</p>
              <p><strong>Location:</strong> {selectedSlot.location}</p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSelectedSlot(null)} disabled={isBooking}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleBookSlot} disabled={isBooking}>
            {isBooking ? <Spinner as="span" size="sm" animation="border" /> : 'Confirm'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default InstructorCalendarPage;