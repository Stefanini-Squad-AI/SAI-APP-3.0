import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { useAuth } from '../../../contexts/AuthContext';

// Mock the auth context so we control the auth state in each test
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

const renderProtectedRoute = () =>
  render(
    <MemoryRouter initialEntries={['/admin/dashboard']}>
      <Routes>
        <Route path="/admin/login" element={<div>Login Page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/admin/dashboard" element={<div>Dashboard</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

describe('ProtectedRoute', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows a loading spinner while auth state is being resolved', () => {
    useAuth.mockReturnValue({
      loading: true,
      isAuthenticated: jest.fn().mockReturnValue(false)
    });

    renderProtectedRoute();

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('redirects to /admin/login when the user is not authenticated', () => {
    useAuth.mockReturnValue({
      loading: false,
      isAuthenticated: jest.fn().mockReturnValue(false)
    });

    renderProtectedRoute();

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('renders the child route when the user is authenticated', () => {
    useAuth.mockReturnValue({
      loading: false,
      isAuthenticated: jest.fn().mockReturnValue(true)
    });

    renderProtectedRoute();

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });
});
