import React, { useState } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { createUser } from '../services/apiService';
import { User } from '../models/entities';

interface Props {
  onCreated?: (user: User) => void;
}

const CreateUserForm: React.FC<Props> = ({ onCreated }) => {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email) {
      setError('Email is required');
      return;
    }

    try {
      setLoading(true);
      const user = await createUser(email, displayName || undefined, role);
      setSuccess(`Created user ${user.displayName} (${user.email})`);
      setEmail('');
      setDisplayName('');
      setRole('STUDENT');
      onCreated && onCreated(user);
    } catch (err: any) {
      console.error('Create user error', err);
      if (err?.response?.data?.message) setError(err.response.data.message);
      else setError('Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>Create User</h3>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-2" controlId="email">
          <Form.Label>Email</Form.Label>
          <Form.Control type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="user@example.com" />
        </Form.Group>

        <Form.Group className="mb-2" controlId="displayName">
          <Form.Label>Display Name (optional)</Form.Label>
          <Form.Control value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Display Name" />
        </Form.Group>

        <Form.Group className="mb-3" controlId="role">
          <Form.Label>Role</Form.Label>
          <Form.Select value={role} onChange={e => setRole(e.target.value)}>
            <option value="STUDENT">Student</option>
            <option value="INSTRUCTOR">Instructor</option>
          </Form.Select>
        </Form.Group>

        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? <><Spinner animation="border" size="sm" /> Creating...</> : 'Create User'}
        </Button>
      </Form>
    </div>
  );
};

export default CreateUserForm;
