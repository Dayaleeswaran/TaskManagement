import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound, ArrowLeft, CheckCircle2, AlertCircle, Loader2, Lock } from 'lucide-react';

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ password: '', confirmPassword: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: '' }));
    }
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    if (fieldErrors.confirmPassword) {
      setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({ password: '', confirmPassword: '' });

    if (!token) {
      setError('Missing reset token. Please request a new link.');
      return;
    }

    // Per-field validation
    const errors = { password: '', confirmPassword: '' };
    let hasErrors = false;

    if (!password) {
      errors.password = 'Please enter a new password.';
      hasErrors = true;
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters long.';
      hasErrors = true;
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
      hasErrors = true;
    } else if (password && confirmPassword && password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
      hasErrors = true;
    }

    if (hasErrors) {
      setFieldErrors(errors);
      return;
    }

    try {
      setLoading(true);
      await resetPassword(token, password);
      setIsSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link might be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto py-12 px-4">
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
        {/* Top subtle decorative gradient */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600"></div>

        {!token ? (
          <div className="text-center py-4">
            <div className="mx-auto h-12 w-12 rounded-xl bg-red-950/30 border border-red-500/20 flex items-center justify-center mb-4 text-red-400">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Invalid Link</h2>
            <p className="text-sm text-slate-400 mt-2">
              The reset token is missing. Please go back and request a new password reset link.
            </p>
            <div className="mt-8 pt-6 border-t border-slate-800/80">
              <Link
                to="/forgot-password"
                className="inline-flex items-center text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors duration-200 space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Forgot Password</span>
              </Link>
            </div>
          </div>
        ) : !isSubmitted ? (
          <>
            <div className="text-center mb-8">
              <div className="mx-auto h-12 w-12 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mb-4 text-violet-400">
                <KeyRound className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Reset Password</h2>
              <p className="text-sm text-slate-400 mt-2">
                Create a secure password for your TaskFlow account.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/40 flex items-start space-x-3 text-red-200">
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <span className="text-sm font-medium leading-5">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-200 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${fieldErrors.password ? 'text-red-400' : 'text-slate-500'}`}>
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={handlePasswordChange}
                    className={`block w-full pl-11 pr-4 py-3 bg-slate-900 border rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 font-sans ${
                      fieldErrors.password
                        ? 'border-red-500 focus:ring-red-500/50'
                        : 'border-slate-800 focus:ring-violet-500'
                    }`}
                    placeholder="At least 6 characters"
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

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-200 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${fieldErrors.confirmPassword ? 'text-red-400' : 'text-slate-500'}`}>
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    className={`block w-full pl-11 pr-4 py-3 bg-slate-900 border rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 font-sans ${
                      fieldErrors.confirmPassword
                        ? 'border-red-500 focus:ring-red-500/50'
                        : 'border-slate-800 focus:ring-violet-500'
                    }`}
                    placeholder="Repeat password"
                    disabled={loading}
                  />
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="mt-1.5 text-xs font-medium text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 active:from-violet-700 active:to-fuchsia-700 text-white font-semibold shadow-lg shadow-violet-600/15 hover:shadow-violet-600/25 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Resetting Password...</span>
                  </>
                ) : (
                  <span>Reset Password</span>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-950/30 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-400">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Password Reset Complete!</h2>
            <p className="text-sm text-slate-400 mt-3 leading-relaxed">
              Your password has been successfully updated. You can now log in using your new credentials.
            </p>
            <div className="mt-8 pt-6 border-t border-slate-800/80">
              <Link
                to="/login"
                className="w-full py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-semibold shadow-md shadow-violet-600/15 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <span>Go to Sign In</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
