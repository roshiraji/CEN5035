import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Container, Navbar, Nav, Spinner, NavDropdown } from 'react-bootstrap';
import DashboardPage from './pages/DashboardPage';
import BookingPage from './pages/BookingPage';
import InstructorCalendarPage from './pages/InstructorCalendarPage';

// Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';

/**
 * Renders the new role-switching dropdown, ONLY in development.
 */
const DevRoleSwitcher: React.FC = () => {
  const { setMockRole, currentUser } = useAuth();
  
  if (process.env.NODE_ENV !== 'development') {
    return null; // Don't render in production
  }

  return (
    <NavDropdown 
      title={`Test Role: ${currentUser?.role || 'None'}`} 
      id="dev-role-switcher"
    >
      <NavDropdown.Item onClick={() => setMockRole('INSTRUCTOR')}>
        Test as Instructor
      </NavDropdown.Item>
      <NavDropdown.Item onClick={() => setMockRole('STUDENT')}>
        Test as Student
      </NavDropdown.Item>
    </NavDropdown>
  );
};

/**
 * A component to render the main application content or login links.
 */
const AppContent: React.FC = () => {
  const { clientPrincipal, loading } = useAuth(); 

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Router>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/">CloudSchedule</Navbar.Brand>
          <Nav className="ms-auto">
            {clientPrincipal ? (
              // User is logged in
              <>
                <DevRoleSwitcher />
                <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
                <Nav.Link as={Link} to="/book">Book Appointment</Nav.Link>
                <Nav.Link href="/.auth/logout?post_logout_redirect_uri=/">
                  Logout ({clientPrincipal.userDetails})
                </Nav.Link>
              </>
            ) : (
              // User is not logged in, show login providers
              <>
                <Nav.Link href="/.auth/login/github">Login with GitHub</Nav.Link>
                <Nav.Link href="/.auth/login/aad">Login with Microsoft</Nav.Link>
              </>
            )}
          </Nav>
        </Container>
      </Navbar>

      <Container className="mt-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/book" element={
            <ProtectedRoute>
              <BookingPage />
            </ProtectedRoute>
          } />
          <Route path="/book/:instructorId" element={
            <ProtectedRoute>
              <InstructorCalendarPage />
            </ProtectedRoute>
          } />
        </Routes>
      </Container>
    </Router>
  );
};

/**
 * Placeholder Home Page
 */
const HomePage: React.FC = () => {
  // This line was corrected (extra '.' removed)
  const { clientPrincipal } = useAuth(); 
  return (
    <div>
      <h1>Welcome to CloudSchedule</h1>
      {clientPrincipal ? (
        <p>You are logged in.</p>
      ) : (
        <p>Please log in to manage or book appointments.</p>
      )}
    </div>
  );
};

/**
 * A simple component to protect routes.
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { clientPrincipal, loading } = useAuth();
  
  if (loading) return <Spinner animation="border" />;
  
  if (!clientPrincipal) {
    return <div>Please <a href="/.auth/login/github">log in</a> to access this page.</div>;
  }
  
  return <>{children}</>; 
};


/**
 * Main App component.
 */
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;