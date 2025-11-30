import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin, register as apiRegister } from '../services/api';
import { UserRole } from '../types';
import toast, { Toaster } from 'react-hot-toast';
import { Calendar, CheckCircle, Info, Shield } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = isLogin
        ? await apiLogin(email, password)
        : await apiRegister(email, password, displayName, role);

      login(response.user, response.token);
      toast.success(`Welcome back, ${response.user.displayName}!`);

      if (response.user.role === UserRole.ADMIN) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8 py-12 relative">
      <div className="absolute top-4 right-4">
        <button
          onClick={() => {
            setIsLogin(true);
            toast('Please log in with your admin credentials to access the portal.', {
              icon: '🛡️',
            });
          }}
          className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-2"
        >
          <Shield className="w-4 h-4" />
          Admin Portal
        </button>
      </div>
      <Toaster position="top-center" />
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
            >
              {isLogin ? 'register now' : 'sign in to existing account'}
            </button>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            {!isLogin && (
              <div>
                <label htmlFor="displayName" className="sr-only">Full Name</label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Full Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            )}
            <div>
              <label htmlFor="email-address" className="sr-only">Email address or Username</label>
              <input
                id="email-address"
                name="email"
                type="text"
                autoComplete="username"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${isLogin ? 'rounded-t-md' : ''}`}
                placeholder="Email address or Username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">I am a:</label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setRole(UserRole.STUDENT)}
                  className={`flex-1 py-2 px-4 border rounded-md flex items-center justify-center space-x-2 ${role === UserRole.STUDENT ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  {role === UserRole.STUDENT && <CheckCircle className="h-4 w-4" />}
                  <span>Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole(UserRole.INSTRUCTOR)}
                  className={`flex-1 py-2 px-4 border rounded-md flex items-center justify-center space-x-2 ${role === UserRole.INSTRUCTOR ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  {role === UserRole.INSTRUCTOR && <CheckCircle className="h-4 w-4" />}
                  <span>Instructor</span>
                </button>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : (isLogin ? 'Sign in' : 'Create Account')}
            </button>
          </div>
        </form>

        {/* Demo Credentials Box */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4 text-xs text-gray-600 border border-gray-200">
          <div className="flex items-center mb-2 font-semibold text-gray-700">
            <Info className="w-3 h-3 mr-1.5" />
            Demo Credentials
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block font-medium text-gray-900">Instructor:</span>
              <code className="block bg-gray-100 p-1 rounded mt-0.5">instructor@fau.edu</code>
              <code className="block bg-gray-100 p-1 rounded mt-0.5">123</code>
            </div>
            <div>
              <span className="block font-medium text-gray-900">Student:</span>
              <code className="block bg-gray-100 p-1 rounded mt-0.5">student@fau.edu</code>
              <code className="block bg-gray-100 p-1 rounded mt-0.5">123</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};