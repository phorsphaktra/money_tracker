import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface SignUpScreenProps {
  onSwitchToLogin: () => void;
}

export const SignUpScreen = ({ onSwitchToLogin }: SignUpScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const { signup, isLoading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signup(email, password, name);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-center text-gray-900">
            Create Account
          </h2>
          <p className="text-center text-sm text-gray-600">
            Sign up to start tracking your money
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-sm border-l-4 border-red-500 p-4 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              required
              placeholder="Enter your full name"
              className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm 
                       placeholder-gray-400 focus:outline-none focus:ring-2 
                       focus:ring-indigo-500 focus:border-transparent text-gray-900 text-base"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="Enter your email"
              className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm 
                       placeholder-gray-400 focus:outline-none focus:ring-2 
                       focus:ring-indigo-500 focus:border-transparent text-gray-900 text-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              placeholder="Create a password"
              className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm 
                       placeholder-gray-400 focus:outline-none focus:ring-2 
                       focus:ring-indigo-500 focus:border-transparent text-gray-900 text-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center items-center py-3 px-4 
                     rounded-lg text-base font-medium text-white transition-colors
                     ${isLoading 
                       ? 'bg-indigo-400 cursor-not-allowed' 
                       : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                     }`}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              'Sign up'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};
