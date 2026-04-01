import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { User, Lock, Key, CheckCircle, XCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';

const Profile = () => {
  const { user, changePassword, deleteAccount } = useContext(AuthContext);
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState({ old: false, new: false });

  const validatePassword = (pass) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,12}$/;
    return regex.test(pass);
  };

  const handleChange = (e) => setPasswords({ ...passwords, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) return setError('Passwords do not match');
    if (!validatePassword(passwords.newPassword)) return setError('New password must be 8-12 characters long with uppercase, lowercase, number, and special character.');

    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await changePassword(passwords.oldPassword, passwords.newPassword);
      setSuccess('Password updated successfully!');
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update password. Incorrect old password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 animate-fade-in text-slate-100">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Side: Info */}
        <div className="flex-1">
          <div className="glass-card p-8 h-full bg-gradient-to-br from-white/10 to-transparent">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-3xl font-bold mb-6 shadow-glow-blue mx-auto md:mx-0">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-3xl font-bold font-display mb-2 text-center md:text-left">{user?.username}</h1>
            <p className="text-slate-400 mb-8 text-center md:text-left break-all">{user?.email}</p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Account Status</p>
                  <p className="text-sm font-medium text-emerald-400 italic">Verified & Secured</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Member Since</p>
                  <p className="text-sm font-medium text-slate-300">April 2026</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Change Password Form */}
        <div className="flex-[1.5]">
          <div className="glass-card p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-violet-500/10 rounded-xl text-violet-400">
                <Key size={24} />
              </div>
              <h2 className="text-2xl font-bold font-display">Security Settings</h2>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                <XCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                <CheckCircle size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-emerald-400 text-sm">{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Current Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock size={16} />
                  </div>
                  <input
                    name="oldPassword"
                    type={showPass.old ? 'text' : 'password'}
                    required
                    className="input-dark pr-12 h-12"
                    placeholder="Enter current password"
                    value={passwords.oldPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass({...showPass, old: !showPass.old})}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showPass.old ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="h-px bg-white/5 my-2"></div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock size={16} />
                  </div>
                  <input
                    name="newPassword"
                    type={showPass.new ? 'text' : 'password'}
                    required
                    className="input-dark pr-12 h-12"
                    placeholder="Min. 8 characters"
                    value={passwords.newPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass({...showPass, new: !showPass.new})}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showPass.new ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Confirm New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock size={16} />
                  </div>
                  <input
                    name="confirmPassword"
                    type="password"
                    required
                    className="input-dark h-12"
                    placeholder="Repeat new password"
                    value={passwords.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-amber-300/80 text-xs leading-relaxed">
                  Tip: A strong password includes uppercase, lowercase, numbers, and symbols. 8-12 characters required.
                </p>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full h-12 flex items-center justify-center gap-2">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Update Security Credentials'
                )}
              </button>
            </form>

            <div className="mt-12 pt-8 border-t border-white/5">
              <h3 className="text-red-400 font-bold mb-4 flex items-center gap-2">
                <AlertTriangle size={18} /> Danger Zone
              </h3>
              <p className="text-slate-500 text-sm mb-6">
                Once you delete your account, there is no going back. All your expenses, reports, and personal data will be wiped from our servers forever.
              </p>
              <button
                onClick={() => {
                  if (window.confirm('CRITICAL: Are you absolutely sure? This will delete ALL your expenses and your profile permanently.')) {
                    deleteAccount();
                  }
                }}
                className="w-full h-12 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all font-medium"
              >
                Permanently Delete My Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
