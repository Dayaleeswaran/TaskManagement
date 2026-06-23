import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function VerifyResetCode() {
  const { verifyResetCode } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || '';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [codeError, setCodeError] = useState('');

  useEffect(() => {
    if (!email) {
      addToast('Missing email context. Please request a new verification code.', 'error');
      navigate('/forgot-password', { replace: true });
    }
  }, [email, navigate, addToast]);

  const handleCodeChange = (e) => {
    // Only allow numeric digits up to 6 characters
    const value = e.target.value.replace(/\D/g, '').substring(0, 6);
    setCode(value);
    if (codeError) setCodeError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCodeError('');

    if (code.length !== 6) {
      setCodeError('Please enter the 6-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      await verifyResetCode(email, code);
      addToast('Verification code verified successfully!', 'success');
      // Redirect to reset password page and pass code + email context
      navigate('/reset-password', { state: { email, code } });
    } catch (err) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto py-12 px-4">
      <div className="bg-slate-900 border border-slate-850 rounded-2xl p-8 shadow-md relative overflow-hidden">
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center mb-4 text-slate-500">
            <KeyRound className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Enter Verification Code</h2>
          <p className="text-sm text-slate-500 mt-2">
            We sent a 6-digit code to <strong className="text-slate-300">{email}</strong>. This code expires in 10 minutes.
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
            <label htmlFor="code" className="block text-sm font-semibold text-slate-350 mb-2">
              Verification Code
            </label>
            <div className="relative">
              <input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength="6"
                value={code}
                onChange={handleCodeChange}
                className={`block w-full text-center tracking-[12px] text-lg font-bold py-3 bg-slate-905 border rounded-xl text-slate-100 placeholder-slate-650 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                  codeError
                    ? 'border-red-500 focus:ring-red-500/50'
                    : 'border-slate-850 focus:ring-slate-400'
                }`}
                placeholder="000000"
                disabled={loading}
                autoFocus
              />
            </div>
            {codeError && (
              <p className="mt-1.5 text-xs font-medium text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {codeError}
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
                <span>Verifying Code...</span>
              </>
            ) : (
              <span>Verify Code</span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center flex flex-col items-center justify-center space-y-4">
          <Link
            to="/forgot-password"
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Resend Verification Code
          </Link>
          
          <Link
            to="/login"
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-200 transition-colors duration-200 space-x-2 group"
          >
            <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform duration-200" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
