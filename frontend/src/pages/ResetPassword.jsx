import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CheckCircle2, AlertCircle, Loader2, Lock, ArrowLeft, Check, X, Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || '';
  const code = location.state?.code || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ password: '', confirmPassword: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redirect to login after 3 seconds on success
  useEffect(() => {
    let timer;
    if (isSubmitted) {
      timer = setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [isSubmitted, navigate]);

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: '' }));
    }
    if (error) setError('');
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    if (fieldErrors.confirmPassword) {
      setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
    }
    if (error) setError('');
  };

  // Real-time requirement matching
  const requirements = [
    { id: 'length', label: 'At least 8 characters', met: password.length >= 8 },
    { id: 'uppercase', label: 'One uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
    { id: 'number', label: 'One number (0-9)', met: /[0-9]/.test(password) },
    { id: 'special', label: 'One special character (!@#$...)', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({ password: '', confirmPassword: '' });

    if (!email || !code) {
      setError('Missing reset session context. Please request a new code.');
      return;
    }

    const allMet = requirements.every((r) => r.met);
    if (!allMet) {
      setFieldErrors((prev) => ({
        ...prev,
        password: 'Password does not meet all complexity requirements listed below.',
      }));
      return;
    }

    if (!confirmPassword) {
      setFieldErrors((prev) => ({ ...prev, confirmPassword: 'Please confirm your password.' }));
      return;
    }

    if (password !== confirmPassword) {
      setFieldErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match.' }));
      return;
    }

    try {
      setLoading(true);
      await resetPassword(email, code, password);
      setIsSubmitted(true);
      addToast('Password reset successfully!', 'success');
    } catch (err) {
      const apiError = err.message || 'Failed to reset password. The verification code might be expired.';
      setError(apiError);
      addToast(apiError, 'error');
    } finally {
      setLoading(false);
    }
  };

  const hasSession = email && code;

  return (
    <div className="max-w-md w-full mx-auto py-12 px-4">
      <div className="bg-slate-950 bg-opacity-60 backdrop-filter backdrop-blur-md border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Top subtle decorative gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600"></div>

        {!hasSession ? (
          <div className="text-center py-4">
            <div className="mx-auto h-12 w-12 rounded-xl bg-red-950/30 border border-red-500/20 flex items-center justify-center mb-4 text-red-400">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Session Expired</h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              We couldn't find a valid verification session. To protect your account, please request a new password reset code first.
            </p>
            <div className="mt-8 pt-6 border-t border-slate-850">
              <Link
                to="/forgot-password"
                className="w-full py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-650 active:bg-violet-750 text-white font-semibold shadow-sm transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Request Verification Code</span>
              </Link>
            </div>
          </div>
        ) : !isSubmitted ? (
          <>
            <div className="text-center mb-8">
              <div className="mx-auto h-12 w-12 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mb-4 text-violet-400">
                <Lock className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Create New Password</h2>
              <p className="text-sm text-slate-400 mt-2">
                Set a strong password for <strong className="text-slate-350">{email}</strong>.
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
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={handlePasswordChange}
                    className={`block w-full pl-11 pr-11 py-3 bg-slate-900 border rounded-xl text-slate-100 placeholder-slate-550 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 font-sans ${
                      fieldErrors.password
                        ? 'border-red-500 focus:ring-red-500/50'
                        : 'border-slate-800 focus:ring-violet-500'
                    }`}
                    placeholder="Enter new password"
                    disabled={loading}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-350 cursor-pointer z-10"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1.5 text-xs font-medium text-red-400 leading-normal flex items-start gap-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>{fieldErrors.password}</span>
                  </p>
                )}

                {/* Password requirement indicator grid */}
                <div className="mt-3 space-y-2 rounded-xl bg-slate-950/40 p-4 border border-slate-800/60">
                  <p className="text-xs font-semibold text-slate-450 uppercase tracking-wider mb-1">Complexity Checklist</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {requirements.map((req) => (
                      <div key={req.id} className="flex items-center space-x-2 text-xs">
                        {req.met ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <X className="h-3.5 w-3.5 text-slate-650 shrink-0" />
                        )}
                        <span className={req.met ? 'text-emerald-350 font-medium' : 'text-slate-500'}>
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
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
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    className={`block w-full pl-11 pr-11 py-3 bg-slate-900 border rounded-xl text-slate-100 placeholder-slate-550 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 font-sans ${
                      fieldErrors.confirmPassword
                        ? 'border-red-500 focus:ring-red-500/50'
                        : 'border-slate-800 focus:ring-violet-500'
                    }`}
                    placeholder="Repeat password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-350 cursor-pointer z-10"
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="mt-1.5 text-xs font-medium text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{fieldErrors.confirmPassword}</span>
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
              Your password has been successfully updated. You can now log in using your new credentials. Redirecting you to login...
            </p>
            <div className="mt-8 pt-6 border-t border-slate-800">
              <Link
                to="/login"
                className="w-full py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-650 active:bg-violet-750 text-white font-semibold shadow-sm transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer"
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
