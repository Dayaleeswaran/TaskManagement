import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { KeyRound, CheckCircle2, AlertCircle, Loader2, Lock } from 'lucide-react';

export default function ChangePassword() {
  const { changePassword } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

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

    // Client-side validation matching backend Zod Schema rules
    const errors = { password: '', confirmPassword: '' };
    let hasErrors = false;

    if (!password) {
      errors.password = 'Please enter a new password.';
      hasErrors = true;
    } else {
      const hasMinLength = password.length >= 8;
      const hasUppercase = /[A-Z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

      if (!hasMinLength || !hasUppercase || !hasNumber || !hasSpecialChar) {
        errors.password = 'Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 number, and 1 special character.';
        hasErrors = true;
      }
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
      await changePassword(password);
      setIsSubmitted(true);
      addToast('Password changed successfully!', 'success');
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1500);
    } catch (err) {
      const apiError = err.response?.data?.message || err.message || 'Failed to update password.';
      setError(apiError);
      addToast(apiError, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto py-12 px-4">
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
        {/* Top subtle decorative gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600"></div>

        {!isSubmitted ? (
          <>
            <div className="text-center mb-8">
              <div className="mx-auto h-12 w-12 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mb-4 text-violet-400">
                <KeyRound className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Mandatory Password Reset</h2>
              <p className="text-sm text-slate-400 mt-2">
                This is your first login. To protect your account, you must choose a secure password before proceeding.
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
                    autoComplete="new-password"
                    value={password}
                    onChange={handlePasswordChange}
                    className={`block w-full pl-11 pr-4 py-3 bg-slate-900 border rounded-xl text-slate-100 placeholder-slate-550 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 font-sans ${
                      fieldErrors.password
                        ? 'border-red-500 focus:ring-red-500/50'
                        : 'border-slate-800 focus:ring-violet-500'
                    }`}
                    placeholder="Min 8 chars, 1 upper, 1 num, 1 symbol"
                    disabled={loading}
                  />
                </div>
                {fieldErrors.password && (
                  <p className="mt-1.5 text-xs font-medium text-red-400 leading-normal flex items-start gap-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>{fieldErrors.password}</span>
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
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    className={`block w-full pl-11 pr-4 py-3 bg-slate-900 border rounded-xl text-slate-100 placeholder-slate-550 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 font-sans ${
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
                    <span>Saving password...</span>
                  </>
                ) : (
                  <span>Save Password & Continue</span>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-950/30 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-400">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Security Setup Complete!</h2>
            <p className="text-sm text-slate-400 mt-3 leading-relaxed">
              Your password has been successfully updated. We are preparing your secure session...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
