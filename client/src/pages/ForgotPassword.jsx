import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import useErrorFocus from '../hooks/useErrorFocus';

export default function ForgotPassword() {
    const navigate = useNavigate();

    // Steps: REQUEST, VERIFY, RESET
    const [step, setStep] = useState('REQUEST');

    const [emailId, setEmailId] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [successMsg, setSuccessMsg] = useState('');
    const [resendTimer, setResendTimer] = useState(0);

    // Scroll to first error field when errors change
    useErrorFocus(errors);

    // Timer logic
    useEffect(() => {
        let interval;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    // STAGE 1: Request OTP
    const handleRequestOtp = async (e) => {
        e.preventDefault();
        if (!emailId || !emailId.includes('@')) {
            setErrors({ emailId: 'Please enter a valid email address' });
            return;
        }

        setLoading(true);
        setErrors({});
        setSuccessMsg('');

        try {
            await authApi.forgotPassword(emailId);
            setStep('VERIFY');
            setResendTimer(60);
            setSuccessMsg(`OTP sent to ${emailId}`);
        } catch (err) {
            setErrors({ general: err.message || 'Failed to send OTP' });
        } finally {
            setLoading(false);
        }
    };

    // STAGE 2: Verify OTP
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!otp || otp.length !== 6) {
            setErrors({ otp: 'Please enter a valid 6-digit OTP' });
            return;
        }

        setLoading(true);
        setErrors({});
        setSuccessMsg('');

        try {
            await authApi.verifyResetOtp({ emailId, otp });
            setStep('RESET');
            setSuccessMsg('OTP verified. Please set a new password.');
        } catch (err) {
            setErrors({ otp: err.message || 'Invalid OTP' });
        } finally {
            setLoading(false);
        }
    };

    // STAGE 3: Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();

        // Validation
        if (password.length < 8) {
            setErrors({ password: 'Password must be at least 8 characters' });
            return;
        }
        if (password !== confirmPassword) {
            setErrors({ confirmPassword: 'Passwords do not match' });
            return;
        }

        setLoading(true);
        setErrors({});
        setSuccessMsg('');

        try {
            await authApi.resetPassword({ emailId, otp, newPassword: password });
            setSuccessMsg('Password reset successfully! Redirecting to login...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setErrors({ general: err.message || 'Failed to reset password' });
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendTimer > 0) return;

        setLoading(true);
        try {
            await authApi.forgotPassword(emailId); // Reuse endpoint logic
            setResendTimer(60);
            setSuccessMsg('OTP resent successfully');
        } catch (err) {
            setErrors({ general: 'Failed to resend OTP' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundImage: 'url(/background.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>

            <div className="flex-grow flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-md mx-auto">
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-100 p-8 md:p-10">

                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-4 shadow-lg">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                {step === 'REQUEST' && 'Forgot Password?'}
                                {step === 'VERIFY' && 'Verify Email'}
                                {step === 'RESET' && 'Reset Password'}
                            </h2>
                            <p className="text-gray-600">
                                {step === 'REQUEST' && 'Enter your email to receive a reset code'}
                                {step === 'VERIFY' && `Enter the code sent to ${emailId}`}
                                {step === 'RESET' && 'Create a new secure password'}
                            </p>
                        </div>

                        {/* Alerts */}
                        {(errors.general || successMsg) && (
                            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${successMsg ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                {successMsg ? (
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                ) : (
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                )}
                                <span className="text-sm font-medium">{errors.general || successMsg}</span>
                            </div>
                        )}

                        {/* STEP 1: REQUEST */}
                        {step === 'REQUEST' && (
                            <form onSubmit={handleRequestOtp} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={emailId}
                                        onChange={(e) => setEmailId(e.target.value)}
                                        className={`block w-full px-4 py-3 border ${errors.emailId ? 'border-red-300' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none`}
                                        placeholder="you@example.com"
                                    />
                                    {errors.emailId && <p className="mt-1 text-xs text-red-600">{errors.emailId}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Sending...' : 'Send Reset Code'}
                                </button>
                            </form>
                        )}

                        {/* STEP 2: VERIFY */}
                        {step === 'VERIFY' && (
                            <form onSubmit={handleVerifyOtp} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Verification Code</label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        className={`block w-full px-4 py-3 text-center text-2xl tracking-[0.5em] font-bold border ${errors.otp ? 'border-red-300' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none`}
                                        placeholder="000000"
                                    />
                                    {errors.otp && <p className="mt-1 text-center text-sm text-red-600">{errors.otp}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || otp.length !== 6}
                                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Verifying...' : 'Verify Code'}
                                </button>

                                <div className="flex items-center justify-between text-sm mt-4">
                                    <button type="button" onClick={() => setStep('REQUEST')} className="text-gray-500 hover:text-gray-700">Change Email</button>
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

                        {/* STEP 3: RESET */}
                        {step === 'RESET' && (
                            <form onSubmit={handleResetPassword} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                                        placeholder="Min 8 characters"
                                    />
                                    {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm New Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                                        placeholder="Confirm password"
                                    />
                                    {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </form>
                        )}

                        {/* Footer */}
                        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                            <Link to="/login" className="text-emerald-600 font-semibold hover:text-emerald-700">
                                Back to Login
                            </Link>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
