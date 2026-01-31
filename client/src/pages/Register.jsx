import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { register, verifyOtp, resendOtp, isAuthenticated } = useAuth();

  // Steps: REGISTER, VERIFY
  const [step, setStep] = useState('REGISTER');

  const [formData, setFormData] = useState({
    fullName: '',
    emailId: '',
    password: '',
    confirmPassword: ''
  });

  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Password Strength Meter Logic
  const calculatePasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    return score; // 0-5 scale
  };

  const getPasswordStrengthLabel = (score) => {
    if (score <= 1) return { label: 'Weak', color: 'bg-red-500', width: 'w-1/4' };
    if (score <= 3) return { label: 'Medium', color: 'bg-yellow-500', width: 'w-2/4' };
    return { label: 'Strong', color: 'bg-emerald-500', width: 'w-full' };
  };

  const passwordStrength = calculatePasswordStrength(formData.password);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/portfolio');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Name too short. We need your full name for your certificate.';
    else if (formData.fullName.trim().length < 2) newErrors.fullName = 'Name too short. Please enter at least 2 characters (e.g., "Jo").';

    // Strict Email Domain Whitelist - Shield Protocol 🛡️
    const trustedDomains = ['gmail.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'yahoo.com', 'proton.me', 'protonmail.com', 'zoho.com', 'aol.com', 'rediffmail.com'];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailDomain = formData.emailId.split('@')[1]?.toLowerCase();

    if (!formData.emailId.trim()) {
      newErrors.emailId = 'Email format incorrect. The address looks incomplete.';
    } else if (!emailRegex.test(formData.emailId)) {
      newErrors.emailId = 'Email format incorrect. Enter a valid format like name@example.com.';
    } else if (!trustedDomains.includes(emailDomain)) {
      newErrors.emailId = "Shield Active 🛡️ Spam-free experience guaranteed. We're only accepting signups from well-known email domains to help keep our platform spam-free";
    }

    if (!formData.password) newErrors.password = 'Password too weak. For your security, we require stronger keys.';
    else if (formData.password.length < 8) newErrors.password = 'Password too weak. Use at least 8 characters.';

    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords mismatch. Please re-type to confirm.';

    return newErrors;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    const result = await register({
      fullName: formData.fullName.trim(),
      emailId: formData.emailId.trim().toLowerCase(),
      password: formData.password
    });
    setLoading(false);

    if (result.success) {
      if (result.step === 'VERIFICATION_REQUIRED') {
        setStep('VERIFY');
        setResendTimer(60); // 60s cooldown
      } else {
        navigate('/portfolio');
      }
    } else {
      setErrors({ general: result.error || 'Registration failed' });
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setErrors({ otp: 'OTP format issue. The code should be exactly 6 numbers. Check your email and type again.' });
      return;
    }

    setLoading(true);
    const result = await verifyOtp(formData.emailId.trim().toLowerCase(), otp);
    setLoading(false);

    if (result.success) {
      navigate('/portfolio');
    } else {
      setErrors({ otp: result.error || 'Verification failed. Try again.' });
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    const result = await resendOtp(formData.emailId.trim().toLowerCase());
    setLoading(false);

    if (result.success) {
      setResendTimer(60);
      setErrors({ success: 'OTP resent successfully!' }); // Abuse errors object for success msg momentarily
      setTimeout(() => setErrors({}), 3000);
    } else {
      setErrors({ general: result.error || 'Failed to resend OTP' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Left Side (Marketing) - Enhanced UI/UX Pro Max */}
        <div className="hidden lg:flex flex-col justify-center space-y-6">
          {/* Hero Card - Master the Markets */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 shadow-2xl text-white">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl"></div>

            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/10">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold mb-3 leading-tight">Master the Markets Risk-Free</h2>
              <p className="text-emerald-100 text-lg leading-relaxed mb-6">
                Experience the thrill of real-time Investment with zero financial loss. Build confidence before you trade with real money.
              </p>
              <div className="flex items-center gap-3 text-sm font-medium bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 w-fit">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                ₹1 Cr Demo Balance Active
              </div>
            </div>
          </div>

          {/* Feature Grid - Gain Deep Insights */}
          <div className="grid grid-cols-2 gap-4">
            {/* Card 1 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-emerald-50 hover:shadow-2xl transition-all duration-300">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Gain Deep Insights</h3>
              <p className="text-xs text-gray-500">Analyze real market trends with advanced charts.</p>
            </div>

            {/* Card 2 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-emerald-50 hover:shadow-2xl transition-all duration-300">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Smart Analytics</h3>
              <p className="text-xs text-gray-500">Track portfolio health and risk metrics in real-time.</p>
            </div>
          </div>

          {/* Social Proof Footer */}
          <div className="flex items-center justify-center gap-6 bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-100">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500 overflow-hidden`}>
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="User" />
                </div>
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-[10px] font-bold text-white">
                +2k
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600">Joined by <span className="text-emerald-700 font-bold">2,000+</span> Learners</p>
          </div>
        </div>

        {/* Mobile Value Banner - Visible only on mobile */}
        <div className="lg:hidden bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-4 text-white text-center mb-4">
          <p className="font-bold text-lg">₹1 Cr Demo Balance</p>
          <p className="text-sm opacity-90">Practice investing risk-free</p>
        </div>

        {/* Right Side - Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-100 p-8 md:p-10">

            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {step === 'REGISTER' ? 'Create Account' : 'Verify Email'}
              </h2>
              <p className="text-gray-600">
                {step === 'REGISTER'
                  ? 'Start with ₹1,00,00,000 demo balance'
                  : `Enter the code sent to ${formData.emailId}`}
              </p>
            </div>

            {/* Error/Success Messages */}
            {(errors.general || errors.success) && (
              <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${errors.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}>
                {errors.success ? (
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
                <span className="text-sm font-medium">{errors.general || errors.success}</span>
              </div>
            )}

            {step === 'REGISTER' ? (
              <form className="space-y-5" onSubmit={handleRegister}>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      name="fullName"
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-4 py-3 border ${errors.fullName ? 'border-red-300' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all`}
                      placeholder="Enter full name"
                    />
                  </div>
                  {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      name="emailId"
                      type="email"
                      required
                      value={formData.emailId}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-4 py-3 border ${errors.emailId ? 'border-red-300' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all`}
                      placeholder="you@example.com"
                    />
                  </div>
                  {errors.emailId && <p className="mt-1 text-xs text-red-600">{errors.emailId}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-4 py-3 border ${errors.password ? 'border-red-300' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all`}
                      placeholder="Min 8 characters"
                    />
                  </div>
                  {/* Password Strength Meter */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-300 ${getPasswordStrengthLabel(passwordStrength).color} ${getPasswordStrengthLabel(passwordStrength).width}`}></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Strength: {getPasswordStrengthLabel(passwordStrength).label}</p>
                    </div>
                  )}
                  {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      name="confirmPassword"
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-4 py-3 border ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all`}
                      placeholder="Confirm password"
                    />
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center items-center py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <svg className="ml-2 -mr-1 w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form className="space-y-6" onSubmit={handleVerify}>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Verification Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setOtp(val);
                      if (errors.otp) setErrors({});
                    }}
                    className={`block w-full px-4 py-3 text-center text-2xl tracking-[0.5em] font-bold border ${errors.otp ? 'border-red-300' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all`}
                    placeholder="000000"
                  />
                  {errors.otp && <p className="mt-1 text-center text-sm text-red-600">{errors.otp}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="group relative w-full flex justify-center items-center py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none"
                >
                  {loading ? 'Verifying...' : (
                    <>
                      Verify Email
                      <svg className="ml-2 -mr-1 w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => setStep('REGISTER')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Change Email
                  </button>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendTimer > 0 || loading}
                    className={`font-medium ${resendTimer > 0 ? 'text-gray-400' : 'text-emerald-600 hover:text-emerald-700'}`}
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                  </button>
                </div>
              </form>
            )}

            <div className="relative mt-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">Already have an account?</span>
              </div>
            </div>

            <div className="text-center mt-6">
              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full py-3 px-4 border-2 border-emerald-500 rounded-xl text-base font-semibold text-emerald-600 bg-white hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 transform hover:scale-[1.02] active:scale-95"
              >
                Sign In
                <svg className="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Secure Signup</span>
                </div>
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Data Encrypted</span>
                </div>
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>No Spam</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
