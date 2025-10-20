import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Spinner, Alert, Modal, Button } from 'react-bootstrap';
import { DetailedBooking } from '../models/entities';
import { getMyBookings, cancelBooking, getBookingICS } from '../services/apiService'; // Import getBookingICS
import StudentBookingList from '../components/StudentBookingList';

const StudentDashboard: React.FC = () => {
  const [bookings, setBookings] = useState<DetailedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for cancellation modal
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);

  // Helper function to trigger a file download from a Blob
  const triggerFileDownload = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a); // Required for Firefox
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyBookings();
      const sortedBookings = data
        .filter(b => b.status === 'CONFIRMED')
        .sort((a, b) => new Date(a.slot.startTime).getTime() - new Date(b.slot.startTime).getTime());
      
      setBookings(sortedBookings);
    } catch (err) {
      console.error(err);
      setError('Failed to load your bookings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancelClick = (bookingId: string) => {
    setBookingToCancel(bookingId);
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;

    setIsCanceling(true);
    setError(null);

    try {
      await cancelBooking(bookingToCancel);
      setBookingToCancel(null);
      await fetchBookings(); 
    } catch (err) {
      console.error(err);
      setError('Failed to cancel the booking. Please try again.');
    } finally {
      setIsCanceling(false);
    }
  };

  // New handler for downloading the .ics file
  const handleDownloadICS = async (bookingId: string, slotTime: string) => {
    setError(null);
    try {
      const blob = await getBookingICS(bookingId);
      // Create a user-friendly filename
      const fileName = `CloudSchedule_Appointment_${new Date(slotTime).toISOString().split('T')[0]}.ics`;
      triggerFileDownload(blob, fileName);
    } catch (err) {
      console.error('Failed to download ICS file', err);
      setError('Failed to download .ics file. Please try again.');
    }
  };

  const renderBookings = () => {
    if (loading) {
      return (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      );
    }
    // Show general errors
    if (error && !isCanceling) {
      return <Alert variant="danger">{error}</Alert>;
    }
    return (
      <StudentBookingList 
        bookings={bookings} 
        onCancel={handleCancelClick}
        onDownloadICS={handleDownloadICS} // Pass the new handler
      />
    );
  };

  return (
    <>
      <Container>
        <Row className="mb-4">
          <Col>
            <h1>Student Dashboard</h1>
            <p>View and manage your upcoming appointments.</p>
          </Col>
        </Row>
        <Row>
          <Col>
            <h2>My Bookings</h2>
            {/* Show action-specific errors here */}
            {error && (isCanceling || error.includes('.ics')) && (
              <Alert variant="danger">{error}</Alert>
            )}
            {renderBookings()}
          </Col>
        </Row>
      </Container>

      {/* Cancellation Confirmation Modal */}
      <Modal show={bookingToCancel !== null} onHide={() => setBookingToCancel(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Cancellation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to cancel this appointment? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setBookingToCancel(null)} 
            disabled={isCanceling}
          >
            Back
          </Button>
          <Button 
            variant="danger" 
            onClick={handleConfirmCancel} 
            disabled={isCanceling}
          >
            {isCanceling ? <Spinner as="span" size="sm" animation="border" /> : 'Confirm Cancel'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default StudentDashboard;