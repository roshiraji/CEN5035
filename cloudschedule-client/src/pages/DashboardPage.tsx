import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Spinner, Alert } from 'react-bootstrap';
import InstructorDashboard from './InstructorDashboard';
import StudentDashboard from './StudentDashboard';

const DashboardPage: React.FC = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading profile...</span>
        </Spinner>
      </div>
    );
  }

  if (!currentUser) {
    // This can happen if auth succeeded but profile fetch failed
    return (
      <Alert variant="danger">
        Error: Could not load user profile. Please try logging out and back in.
      </Alert>
    );
  }

  // Render the correct dashboard based on the user's role
  if (currentUser.role === 'INSTRUCTOR') {
    return <InstructorDashboard />;
  } else if (currentUser.role === 'STUDENT') {
    return <StudentDashboard />;
  } else {
    // Fallback for any other case
    return <Alert variant="warning">Unknown user role.</Alert>;
  }
};

export default DashboardPage;