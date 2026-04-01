import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, Lock, Sparkles, Eye, EyeOff, ShieldCheck, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const Signup = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Details, 2: OTP
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [timer, setTimer] = useState(0);

  const { register, verifyOtp, googleLogin } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const validatePassword = (pass) => {
    return {
      length: pass.length >= 8 && pass.length <= 12,
      uppercase: /[A-Z]/.test(pass),
      lowercase: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
      special: /[@$!%*?&]/.test(pass)
    };
  };

  const passStatus = validatePassword(formData.password);
  const isPassValid = Object.values(passStatus).every(Boolean);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!isPassValid) return setError('Please meet all password requirements.');
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

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await googleLogin(credentialResponse.credential);
      navigate('/dashboard');
    } catch (err) {
      setError('Google Signup failed');
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyOtp(formData.email, otp);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 animate-fade-in text-slate-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 mb-4 shadow-glow-violet">
            {step === 1 ? <Sparkles size={28} className="text-white" /> : <ShieldCheck size={28} className="text-white" />}
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-2">
            {step === 1 ? 'Create account' : 'Verify Email'}
          </h1>
          <p className="text-slate-400 text-sm">
            {step === 1 ? 'Start tracking your spends securely' : `Enter the 6-digit code sent to ${formData.email}`}
          </p>
        </div>

        <div className="glass-card p-8">
          {error && (
            <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
              <XCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
              <CheckCircle size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-emerald-400 text-sm">{success}</p>
            </div>
          )}

          {step === 1 ? (
            <>
              <form onSubmit={handleRegisterSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User size={16} className="text-slate-500" />
                    </div>
                    <input name="username" type="text" required className="input-dark" placeholder="Rahul Sharma" onChange={handleChange} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail size={16} className="text-slate-500" />
                    </div>
                    <input name="email" type="email" required className="input-dark" placeholder="rahul@example.com" onChange={handleChange} />
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
                      className="input-dark pr-10"
                      placeholder="8-12 characters"
                      onChange={handleChange}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                    {[
                      { label: '8-12 Characters', met: passStatus.length },
                      { label: 'Uppercase (A-Z)', met: passStatus.uppercase },
                      { label: 'Lowercase (a-z)', met: passStatus.lowercase },
                      { label: 'Number (0-9)', met: passStatus.number },
                      { label: 'Special Symbol', met: passStatus.special },
                    ].map((rule) => (
                      <div key={rule.label} className={`flex items-center gap-1.5 ${rule.met ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {rule.met ? <CheckCircle size={10} /> : <div className="w-2.5 h-2.5 rounded-full border border-slate-600" />}
                        {rule.label}
                      </div>
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={loading || !isPassValid} className="btn-primary w-full mt-2 flex items-center justify-center gap-2">
                  {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Create Account →'}
                </button>
              </form>

              <div className="relative my-6 flex items-center">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Or Securely</span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>

              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google Sign Up Failed')}
                  theme="filled_black"
                  shape="pill"
                  width="100%"
                />
              </div>
            </>
          ) : (
            <form onSubmit={handleVerifySubmit} className="space-y-6">
              <div className="text-center">
                <input
                  type="text"
                  maxLength="6"
                  className="w-full text-center text-3xl font-bold tracking-[0.5em] py-4 bg-slate-900/50 border border-white/10 rounded-xl focus:border-violet-500 outline-none"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />
                <button type="button" disabled={timer > 0} className="mt-4 text-xs text-violet-400 disabled:text-slate-600">
                  {timer > 0 ? `Resend code in ${timer}s` : 'Resend Verification Code'}
                </button>
              </div>
              <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Verify & Sign In'}
              </button>
              <button type="button" onClick={() => setStep(1)} className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-white transition-colors">
                <ArrowLeft size={14} /> Back to details
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-slate-500 text-sm">
              Already have an account? <Link to="/login" className="text-blue-400 font-medium transition-colors">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
