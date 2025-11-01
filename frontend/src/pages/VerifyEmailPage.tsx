import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';

const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.verifyEmail(token);
      
      // Store tokens
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      
      // Redirect to homepage
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired verification token');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResendMessage('');
    setResending(true);

    try {
      const response = await authAPI.resendVerification(email);
      setResendMessage(`Verification email sent! Token: ${response.verificationToken}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white">
          Verify Your Email
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Enter the verification token from your registration
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card py-8 px-4 sm:px-10">
          <form className="space-y-6" onSubmit={handleVerify}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {resendMessage && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                  {resendMessage}
                </p>
              </div>
            )}

            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Verification Token
              </label>
              <div className="mt-1">
                <input
                  id="token"
                  name="token"
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="input-field font-mono text-sm"
                  placeholder="Paste your verification token here"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                The token was shown after registration
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Didn't receive a token? Request a new one:
            </p>
            
            <form onSubmit={handleResend} className="space-y-3">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
              />
              <button
                type="submit"
                disabled={resending}
                className="btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resending ? 'Sending...' : 'Resend Verification'}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Already verified?{' '}
            <Link to="/login" className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
