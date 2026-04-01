import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, Lock, Sparkles, Eye, EyeOff, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react';

const Signup = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Details, 2: OTP
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [timer, setTimer] = useState(0);

  const { register, verifyOtp, resendOtp } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(formData.username, formData.email, formData.password);
      setStep(2);
      setTimer(60);
      setSuccess('Verification code sent to your email!');
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return setError('Please enter a 6-digit code');
    setError('');
    setLoading(true);
    try {
      await verifyOtp(formData.email, otp);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || 'Verification failed. Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setResending(true);
    setError('');
    try {
      await resendOtp(formData.email);
      setSuccess('New code sent!');
      setTimer(60);
    } catch (err) {
      setError('Could not resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 animate-fade-in text-slate-100">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 mb-4 shadow-glow-violet">
            {step === 1 ? <Sparkles size={28} className="text-white" /> : <ShieldCheck size={28} className="text-white" />}
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-2">
            {step === 1 ? 'Create account' : 'Verify Email'}
          </h1>
          <p className="text-slate-400 text-sm">
            {step === 1 ? 'Start tracking your spends in ₹ Rupees' : `Enter the 6-digit code sent to ${formData.email}`}
          </p>
        </div>

        {/* Feature pills (Step 1 only) */}
        {step === 1 && (
          <div className="flex justify-center gap-2 mb-6 flex-wrap">
            {['Free Forever', 'Secure', 'India Made'].map(f => (
              <span key={f} className="text-xs px-3 py-1 rounded-full border border-violet-500/30 text-violet-400 bg-violet-500/10">{f}</span>
            ))}
          </div>
        )}

        {/* Card */}
        <div className="glass-card p-8">
          {error && (
            <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-shake">
              <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-red-400 text-xs font-bold">!</span>
              </div>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && !error && (
            <div className="mb-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-emerald-400 text-xs font-bold">✓</span>
              </div>
              <p className="text-emerald-400 text-sm">{success}</p>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User size={16} className="text-slate-500" />
                  </div>
                  <input
                    name="username"
                    type="text"
                    required
                    className="input-dark"
                    placeholder="Rahul Sharma"
                    value={formData.username}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail size={16} className="text-slate-500" />
                  </div>
                  <input
                    name="email"
                    type="email"
                    required
                    className="input-dark"
                    placeholder="rahul@example.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock size={16} className="text-slate-500" />
                  </div>
                  <input
                    name="password"
                    type={showPass ? 'text' : 'password'}
                    required
                    minLength="6"
                    className="input-dark pr-10"
                    placeholder="Min. 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2 flex items-center justify-center gap-2">
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Sending code...</>
                ) : 'Sign Up →'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifySubmit} className="space-y-6">
              <div className="text-center">
                <div className="flex justify-center gap-3">
                  <input
                    type="text"
                    maxLength="6"
                    className="w-full text-center text-3xl font-bold tracking-[0.5em] py-4 bg-slate-900/50 border border-white/10 rounded-xl focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all outline-none"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    autoFocus
                  />
                </div>
                <p className="mt-4 text-xs text-slate-500">Didn't receive the code?</p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={timer > 0 || resending}
                  className="mt-1 text-sm font-medium text-violet-400 hover:text-violet-300 disabled:text-slate-600 disabled:cursor-not-allowed flex items-center justify-center gap-1 mx-auto"
                >
                  {resending ? <RefreshCw size={14} className="animate-spin" /> : null}
                  {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Verifying...</>
                  ) : 'Verify & Continue'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors py-2"
                >
                  <ArrowLeft size={14} /> Back to details
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-slate-500 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Sign in instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
