import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { createAvailability } from '../services/apiService';

interface CreateAvailabilityFormProps {
  onAvailabilityCreated: () => void; // Callback to refresh data on the parent
}

const CreateAvailabilityForm: React.FC<CreateAvailabilityFormProps> = ({ onAvailabilityCreated }) => {
  // Note: We use datetime-local which requires a string in 'YYYY-MM-DDTHH:MM' format
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // This line was corrected
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Basic validation
    if (!startTime || !endTime || !location) {
      setError('All fields are required.');
      return;
    }
    if (new Date(startTime) >= new Date(endTime)) {
      setError('End time must be after start time.');
      return;
    }

    try {
      // Convert to ISO 8601 strings, which the backend expects
      const isoStartTime = new Date(startTime).toISOString();
      const isoEndTime = new Date(endTime).toISOString();
      
      await createAvailability(isoStartTime, isoEndTime, location);
      
      setSuccess('Availability created successfully. The system generated 30-minute slots.');
      // Reset form
      setStartTime('');
      setEndTime('');
      setLocation('');
      // Notify parent component to refetch data
      onAvailabilityCreated();
    } catch (err) {
      console.error(err);
      setError('Failed to create availability. Please try again.');
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Form.Group className="mb-3" controlId="formStartTime">
        <Form.Label>Start Time</Form.Label>
        <Form.Control
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="formEndTime">
        <Form.Label>End Time</Form.Label>
        <Form.Control
          type="datetime-local"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="formLocation">
        <Form.Label>Location (or Zoom/Teams Link)</Form.Label>
        <Form.Control
          type="text"
          placeholder="e.g., 'https://zoom.us/j/12345' or 'Bldg 1, Room 203'"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </Form.Group>

      <Button variant="primary" type="submit">
        Create Slots
      </Button>
    </Form>
  );
};

export default CreateAvailabilityForm;