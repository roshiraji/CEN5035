import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { DetailedBooking } from '../models/entities';
import { getMyBookings } from '../services/apiService';
import CreateAvailabilityForm from '../components/CreateAvailabilityForm';
import CreateUserForm from '../components/CreateUserForm';
import InstructorBookingList from '../components/InstructorBookingList';

const InstructorDashboard: React.FC = () => {
  const [bookings, setBookings] = useState<DetailedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Define a fetch function we can call on load and after creation
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyBookings();
      // Filter for only confirmed bookings and sort by start time
      const sortedBookings = data
        .filter(b => b.status === 'CONFIRMED')
        .sort((a, b) => new Date(a.slot.startTime).getTime() - new Date(b.slot.startTime).getTime());
      
      setBookings(sortedBookings);
    } catch (err) {
      console.error(err);
      setError('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch bookings on initial component mount
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // This function will be passed as a prop to the form
  const handleAvailabilityCreated = () => {
    // For now, we just refetch the bookings.
    // In a more complex app, we might just update the availability list.
    fetchBookings();
  };

  const renderBookings = () => {
    if (loading) {
      return (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      );
    }
    if (error) {
      return <Alert variant="danger">{error}</Alert>;
    }
    return <InstructorBookingList bookings={bookings} />;
  };

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1>Instructor Dashboard</h1>
          <p>Manage your availability and view upcoming appointments.</p>
        </Col>
      </Row>
      <Row>
        <Col md={6} className="mb-4">
          <h2>Create Availability</h2>
          <CreateAvailabilityForm onAvailabilityCreated={handleAvailabilityCreated} />
          <div className="mt-4">
            <CreateUserForm />
          </div>
        </Col>
        <Col md={6}>
          <h2>Your Booked Appointments</h2>
          {renderBookings()}
        </Col>
      </Row>
    </Container>
  );
};

export default InstructorDashboard;