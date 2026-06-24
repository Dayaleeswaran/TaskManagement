import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Mail, Lock, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

export default function Login() {
  const { login, user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });

  // Get redirection path or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Clear field error when user types
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (fieldErrors.email) {
      setFieldErrors((prev) => ({ ...prev, email: '' }));
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({ email: '', password: '' });

    // Per-field validation
    const errors = { email: '', password: '' };
    let hasErrors = false;

    if (!email.trim()) {
      errors.email = 'Email address is required.';
      hasErrors = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.email = 'Please enter a valid email address.';
        hasErrors = true;
      }
    }

    if (!password) {
      errors.password = 'Password is required.';
      hasErrors = true;
    } else if (password.length < 4) {
      errors.password = 'Password must be at least 4 characters.';
      hasErrors = true;
    }

    if (hasErrors) {
      setFieldErrors(errors);
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      // Success: Navigate to redirected route
      navigate(from, { replace: true });
    } catch (err) {
      const errorMsg = err.message || 'Incorrect email or password. Please try again.';
      setError(errorMsg);
      addToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto py-8 px-4">

      <div className="bg-slate-900 border border-slate-850 rounded-2xl p-8 shadow-md relative overflow-hidden">
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center mb-4 text-slate-500">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Welcome to TaskFlow</h2>
          <p className="text-sm text-slate-500 mt-2">Sign in to your account to continue</p>
        </div>

        {/* Server-level error banner (auth failures only) */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/40 flex items-start space-x-3 text-red-200">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <span className="text-sm font-medium leading-5">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-350 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${fieldErrors.email ? 'text-red-400' : 'text-slate-500'}`}>
                <Mail className="h-5 w-5" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                className={`block w-full pl-11 pr-4 py-3 bg-slate-900 border rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 font-sans ${
                  fieldErrors.email
                    ? 'border-red-500 focus:ring-red-500/50'
                    : 'border-slate-850 focus:ring-slate-400'
                }`}
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>
            {fieldErrors.email && (
              <p className="mt-1.5 text-xs font-medium text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="password" className="text-sm font-semibold text-slate-350">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-slate-500 hover:text-slate-200 transition-colors duration-150"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${fieldErrors.password ? 'text-red-400' : 'text-slate-500'}`}>
                <Lock className="h-5 w-5" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                className={`block w-full pl-11 pr-4 py-3 bg-slate-900 border rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 font-sans ${
                  fieldErrors.password
                    ? 'border-red-500 focus:ring-red-500/50'
                    : 'border-slate-850 focus:ring-slate-400'
                }`}
                placeholder="••••••••"
                disabled={loading}
              />
            </div>
            {fieldErrors.password && (
              <p className="mt-1.5 text-xs font-medium text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {fieldErrors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 mt-2 rounded-xl bg-violet-600 hover:bg-violet-650 active:bg-violet-750 text-white font-semibold shadow-sm transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
