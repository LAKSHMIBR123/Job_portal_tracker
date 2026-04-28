import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import StatusMessage from '../components/StatusMessage';
import { verifyOtp, resendOtp, clearAuthError } from '../features/authSlice';

const OTP_LENGTH = 6;
const TIMER_SECONDS = 10 * 60; // 10 minutes

function VerifyEmail() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pendingEmail, otpLoading, error } = useSelector((state) => state.auth);

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [secondsLeft, setSecondsLeft] = useState(TIMER_SECONDS);
  const [resendMsg, setResendMsg] = useState('');
  const [resendError, setResendError] = useState('');
  const inputRefs = useRef([]);
  const timerRef = useRef(null);

  // Redirect away if there is no pending email (came here by mistake)
  useEffect(() => {
    if (!pendingEmail) {
      navigate('/signup', { replace: true });
    }
  }, [pendingEmail, navigate]);

  // Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Clear Redux error when component unmounts
  useEffect(() => () => dispatch(clearAuthError()), [dispatch]);

  const formatTime = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleDigitChange = (index, value) => {
    // Accept only digits
    const digit = value.replace(/\D/g, '').slice(-1);
    const updated = [...digits];
    updated[index] = digit;
    setDigits(updated);

    // Auto-advance focus
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // Allow paste on any box
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const updated = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((ch, i) => { updated[i] = ch; });
    setDigits(updated);
    const nextIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[nextIdx]?.focus();
  };

  const otp = digits.join('');
  const isComplete = otp.length === OTP_LENGTH;

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!isComplete || otpLoading) return;
    dispatch(clearAuthError());

    try {
      await dispatch(verifyOtp({ email: pendingEmail, otp })).unwrap();
      toast.success('Email verified successfully! Please log in.');
      navigate('/login', {
        replace: true,
        state: { message: 'Email verified! You can now log in.' },
      });
    } catch {
      // Error shown via Redux state
    }
  }, [dispatch, navigate, otp, otpLoading, isComplete, pendingEmail]);

  const handleResend = useCallback(async () => {
    if (otpLoading || secondsLeft > 0) return;
    setResendMsg('');
    setResendError('');
    dispatch(clearAuthError());

    try {
      await dispatch(resendOtp({ email: pendingEmail })).unwrap();
      setResendMsg('A new OTP has been sent to your email.');
      setDigits(Array(OTP_LENGTH).fill(''));
      setSecondsLeft(TIMER_SECONDS);
      inputRefs.current[0]?.focus();
      // Restart timer
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) { clearInterval(timerRef.current); return 0; }
          return s - 1;
        });
      }, 1000);
    } catch (err) {
      setResendError(typeof err === 'string' ? err : 'Failed to resend OTP.');
    }
  }, [dispatch, pendingEmail, otpLoading, secondsLeft]);

  const maskedEmail = pendingEmail
    ? pendingEmail.replace(/(.{2}).+(@.+)/, '$1•••$2')
    : '';

  return (
    <section className="auth-page">
      <div className="auth-card verify-email-card">
        {/* Icon */}
        <div className="verify-icon">✉️</div>

        <p className="auth-kicker">Email Verification</p>
        <h2>Enter your OTP</h2>
        <p className="auth-subtitle">
          We sent a 6-digit code to{' '}
          <strong className="verify-email-address">{maskedEmail}</strong>.
          <br />
          It expires in 10 minutes.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* OTP Digit Inputs */}
          <div className="otp-inputs" onPaste={handlePaste}>
            {digits.map((digit, i) => (
              <input
                key={i}
                id={`otp-digit-${i}`}
                ref={(el) => (inputRefs.current[i] = el)}
                className={`otp-box${digit ? ' otp-box--filled' : ''}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                autoComplete="one-time-code"
                autoFocus={i === 0}
              />
            ))}
          </div>

          {/* Countdown Timer */}
          <div className={`otp-timer${secondsLeft === 0 ? ' otp-timer--expired' : ''}`}>
            {secondsLeft > 0 ? (
              <>
                <span className="otp-timer-icon">⏱</span>
                Code expires in{' '}
                <span className="otp-timer-value">{formatTime(secondsLeft)}</span>
              </>
            ) : (
              <span className="otp-timer-expired-text">Code has expired. Resend a new one below.</span>
            )}
          </div>

          <button
            id="verify-otp-submit"
            className="auth-button"
            type="submit"
            disabled={!isComplete || otpLoading}
          >
            {otpLoading ? 'Verifying…' : 'Verify Email'}
          </button>
        </form>

        {/* Status messages */}
        {error && typeof error === 'string' && (
          <StatusMessage message={error} variant="error" />
        )}
        {resendMsg && <StatusMessage message={resendMsg} variant="success" />}
        {resendError && <StatusMessage message={resendError} variant="error" />}

        {/* Resend button */}
        <div className="otp-resend">
          <span className="otp-resend-label">Didn&apos;t receive a code?</span>
          <button
            id="verify-otp-resend"
            className={`otp-resend-btn${secondsLeft > 0 ? ' otp-resend-btn--disabled' : ''}`}
            type="button"
            onClick={handleResend}
            disabled={secondsLeft > 0 || otpLoading}
          >
            {otpLoading ? 'Sending…' : secondsLeft > 0 ? `Resend in ${formatTime(secondsLeft)}` : 'Resend OTP'}
          </button>
        </div>

        <p className="auth-footer">
          Wrong email?{' '}
          <a
            href="/signup"
            onClick={(e) => { e.preventDefault(); navigate('/signup'); }}
          >
            Register again
          </a>
        </p>
      </div>
    </section>
  );
}

export default VerifyEmail;
