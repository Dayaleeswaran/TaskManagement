import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailError) setEmailError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEmailError('');

    // Per-field validation
    if (!email.trim()) {
      setEmailError('Email address is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      await forgotPassword(email);
      setIsSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to request password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto py-12 px-4">
      <div className="bg-slate-900 border border-slate-850 rounded-2xl p-8 shadow-md relative overflow-hidden">
        {!isSubmitted ? (
          <>
            <div className="text-center mb-8">
              <div className="mx-auto h-12 w-12 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center mb-4 text-slate-500">
                <Mail className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Forgot Password?</h2>
              <p className="text-sm text-slate-500 mt-2">
                Enter your email address and we will generate a password reset link for you.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/40 flex items-start space-x-3 text-red-200">
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <span className="text-sm font-medium leading-5">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-350 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${emailError ? 'text-red-400' : 'text-slate-500'}`}>
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    className={`block w-full pl-11 pr-4 py-3 bg-slate-900 border rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 font-sans ${
                      emailError
                        ? 'border-red-500 focus:ring-red-500/50'
                        : 'border-slate-850 focus:ring-slate-400'
                    }`}
                    placeholder="e.g. admin@taskflow.com"
                    disabled={loading}
                  />
                </div>
                {emailError && (
                  <p className="mt-1.5 text-xs font-medium text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {emailError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-650 active:bg-violet-750 text-white font-semibold shadow-sm transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors duration-200 space-x-2 group"
              >
                <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform duration-200" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-slate-950 border border-slate-850 flex items-center justify-center mb-6 text-emerald-500">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Simulated Email Sent!</h2>
            <p className="text-sm text-slate-500 mt-3 leading-relaxed">
              We have generated a mock password reset link. Please click on the link displayed in the
              <strong> server alerts</strong> banner at the top of the screen to proceed to the reset screen.
            </p>
            <div className="mt-8 pt-6 border-t border-slate-850">
              <Link
                to="/login"
                className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-200 transition-colors duration-200 space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
