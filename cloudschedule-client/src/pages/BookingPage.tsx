import React, { useState, useEffect } from 'react';
import { User } from '../models/entities';
import { getInstructors } from '../services/apiService';
import { Link } from 'react-router-dom';
import { ListGroup, Spinner, Alert, Container, Row, Col } from 'react-bootstrap';

const BookingPage: React.FC = () => {
  const [instructors, setInstructors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const data = await getInstructors();
        setInstructors(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load instructors. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchInstructors();
  }, []);

  const renderContent = () => {
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

    if (instructors.length === 0) {
      return <Alert variant="info">No instructors are available for booking at this time.</Alert>;
    }

    return (
      <ListGroup>
        {instructors.map((instructor) => (
          <ListGroup.Item
            action
            as={Link}
            to={`/book/${instructor.userId}`} // Dynamic route to instructor's calendar
            key={instructor.userId}
          >
            <div className="fw-bold">{instructor.displayName}</div>
            {instructor.email}
          </ListGroup.Item>
        ))}
      </ListGroup>
    );
  };

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1>Book an Appointment</h1>
          <p>Please select an instructor to view their availability.</p>
        </Col>
      </Row>
      <Row>
        <Col md={8} lg={6}>
          {renderContent()}
        </Col>
      </Row>
    </Container>
  );
};

export default BookingPage;