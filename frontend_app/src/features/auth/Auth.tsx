import { useState } from 'react';
import { ApiError, fetchWithAuth, setCsrfToken } from '../../utils/api';

interface AuthProps {
  onLogin: () => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLoginMode) {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await fetchWithAuth('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData,
          credentials: 'include',
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Login failed');
        
        if (data.csrf_token) {
          setCsrfToken(data.csrf_token);
        }
        
        onLogin();
      } else {
        const response = await fetchWithAuth('/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password }), 
          credentials: 'include',
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Registration failed');

        setIsLoginMode(true);
        setError('Registration successful! Please log in.');
        setPassword('');
        setEmail('');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.detail);
        return;
      }
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-8">
        <h2 className="text-3xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400 mb-8">
          {isLoginMode ? 'Tavern Login' : 'New User'}
        </h2>

        {error && (
          <div className={`p-3 rounded-lg mb-6 text-sm ${error.includes('successful') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-200 outline-none transition-all"
              placeholder="e.g., Esmeralda"
            />
          </div>

          {!isLoginMode && (
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-200 outline-none transition-all"
                placeholder="your@email.com"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-200 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-bold rounded-lg shadow-lg transform transition-all active:scale-95 disabled:opacity-70"
          >
            {isLoading ? 'Loading...' : (isLoginMode ? 'Log In' : 'Sign Up')}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-400 text-sm">
          {isLoginMode ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setError('');
              setEmail('');
            }}
            className="text-orange-400 hover:text-orange-300 font-semibold transition-colors"
          >
            {isLoginMode ? 'Create an account' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}