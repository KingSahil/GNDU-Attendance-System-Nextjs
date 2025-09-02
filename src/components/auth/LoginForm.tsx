'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface LoginFormProps {
  onSuccess?: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password) {
      setMessage({ text: 'Please enter both email and password', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await login(email, password);
      setMessage({ text: '✅ Login successful! Redirecting...', type: 'success' });
      onSuccess?.();
    } catch (error: any) {
      setMessage({ text: `❌ ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 text-center">
            <h1 className="text-2xl font-light mb-2">🔐 Secure Login</h1>
            <p className="text-blue-100">GNDU Attendance System</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 
                         focus:ring-0 transition-colors duration-200 bg-gray-50 focus:bg-white"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 
                         focus:ring-0 transition-colors duration-200 bg-gray-50 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 
                       text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 
                       transform hover:scale-105 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed 
                       disabled:transform-none uppercase tracking-wide"
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>

            {/* Message */}
            {message.text && (
              <div className={`p-4 rounded-lg border-l-4 animate-fade-in ${
                message.type === 'success' 
                  ? 'bg-green-50 border-green-400 text-green-800' 
                  : 'bg-red-50 border-red-400 text-red-800'
              }`}>
                {message.text}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}