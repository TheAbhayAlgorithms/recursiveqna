'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  GraduationCap, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  RotateCcw, 
  Phone, 
  Lock, 
  User as UserIcon,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

type AuthStep = 'EMAIL' | 'OTP' | 'OPTIONAL_PHONE';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect') || '/';

  // Step state
  const [step, setStep] = useState<AuthStep>('EMAIL');

  // Input states
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [phone, setPhone] = useState('');

  // Admin password login fallback state
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [adminUserId, setAdminUserId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // UI status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // References for OTP 6-box input
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check if already authenticated
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  // Resend cooldown timer countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleFinishLogin = (userObj: any) => {
    if (redirectParam && redirectParam !== '/') {
      router.push(redirectParam);
    } else if (userObj?.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/');
    }
    router.refresh();
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Failed to send verification code. Please try again.');
        if (data.cooldownRemaining) {
          setResendCooldown(data.cooldownRemaining);
        }
        setLoading(false);
        return;
      }

      setSuccessMessage(data.message || 'Verification code sent to your email.');
      setStep('OTP');
      setResendCooldown(30);
      setOtpDigits(['', '', '', '', '', '']);

      // Focus first digit box after transition
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      console.error('Send OTP error:', err);
      setError('Network error. Unable to connect to authentication service.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Failed to resend verification code.');
        if (data.cooldownRemaining) {
          setResendCooldown(data.cooldownRemaining);
        }
        return;
      }

      setSuccessMessage(data.message || 'A fresh verification code was sent to your email.');
      setResendCooldown(30);
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify OTP code
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const fullCode = codeToVerify || otpDigits.join('');
    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: fullCode,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Invalid verification code. Please check and try again.');
        setLoading(false);
        // If code failed, clear boxes and focus first
        if (data.status === 'EXPIRED' || data.status === 'TOO_MANY_ATTEMPTS') {
          setOtpDigits(['', '', '', '', '', '']);
        }
        inputRefs.current[0]?.focus();
        return;
      }

      // If this is user's first login or they have no mobile number, offer optional phone setup
      if (data.isFirstLogin && !data.user?.phone) {
        setCurrentUser(data.user);
        setStep('OPTIONAL_PHONE');
        setLoading(false);
      } else {
        handleFinishLogin(data.user);
      }
    } catch (err) {
      console.error('Verify error:', err);
      setError('Network error during verification. Please try again.');
      setLoading(false);
    }
  };

  // Handle OTP Box Input Change
  const handleDigitChange = (index: number, value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');

    // Handle single digit entry
    const newDigits = [...otpDigits];
    newDigits[index] = cleaned.slice(-1); // Take only the latest digit
    setOtpDigits(newDigits);
    setError(null);

    // Auto-advance focus to next input
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 digits are filled
    const combined = newDigits.join('');
    if (combined.length === 6) {
      handleVerifyOtp(combined);
    }
  };

  // Handle backspace navigation
  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const newDigits = [...otpDigits];
        newDigits[index - 1] = '';
        setOtpDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste of 6-digit code
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setOtpDigits(newDigits);

    if (pasted.length === 6) {
      inputRefs.current[5]?.focus();
      handleVerifyOtp(pasted);
    } else {
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  // Step 3: Save Optional Phone
  const handleSavePhone = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      const cleanPhone = phone.trim();
      if (cleanPhone) {
        await fetch('/api/auth/update-phone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: cleanPhone }),
        });
      }
      handleFinishLogin(currentUser);
    } catch {
      handleFinishLogin(currentUser);
    }
  };

  // Legacy fallback password login (for root administrator)
  const handleLegacyPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: adminUserId, password: adminPassword }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Authentication failed. Please verify credentials.');
        setLoading(false);
        return;
      }

      handleFinishLogin(data.user);
    } catch (err) {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
      {/* Top minimal header */}
      <header style={{ 
        height: '68px', 
        borderBottom: '1px solid var(--border-light)', 
        background: 'var(--bg-card)', 
        display: 'flex', 
        alignItems: 'center' 
      }}>
        <div className="app-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Link href="/" className="brand-logo">
            <div className="brand-icon">
              <GraduationCap size={22} />
            </div>
            <div>
              <span>RecursiveQnA</span>
              <span style={{ 
                display: 'block', 
                fontSize: '11px', 
                fontWeight: 500, 
                color: 'var(--text-muted)', 
                letterSpacing: '0.04em' 
              }}>
                ACADEMIA Q&A
              </span>
            </div>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ThemeToggle />
            <Link href="/" className="btn btn-outline" style={{ fontSize: '13px', padding: '6px 14px' }}>
              Back to Questions
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <div style={{ width: '100%', maxWidth: '460px' }}>
          
          {/* Card */}
          <div className="card" style={{ padding: '36px 30px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-md)', borderRadius: 'var(--radius-lg)' }}>
            
            {/* Header info */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ 
                width: '52px', 
                height: '52px', 
                borderRadius: '14px', 
                background: 'var(--bg-accent-subtle)', 
                color: 'var(--color-accent)', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: '14px',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)'
              }}>
                {step === 'OPTIONAL_PHONE' ? (
                  <Phone size={26} />
                ) : (
                  <ShieldCheck size={28} />
                )}
              </div>

              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                {step === 'EMAIL' && (showPasswordLogin ? 'Administrator Sign In' : 'Sign in with Email')}
                {step === 'OTP' && 'Verify Your Email'}
                {step === 'OPTIONAL_PHONE' && 'Add Mobile Number'}
              </h1>

              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                {step === 'EMAIL' && !showPasswordLogin && (
                  'Enter your email address to receive a secure 6-digit one-time code. No password needed.'
                )}
                {step === 'EMAIL' && showPasswordLogin && (
                  'Sign in using your administrator username and master password.'
                )}
                {step === 'OTP' && (
                  <>
                    Enter the 6-digit code sent to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
                  </>
                )}
                {step === 'OPTIONAL_PHONE' && (
                  'Optionally add your mobile number to your scholar profile for recovery and notifications.'
                )}
              </p>
            </div>

            {/* Current user session alert if already logged in */}
            {currentUser && step === 'EMAIL' && (
              <div style={{
                marginBottom: '20px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-accent-subtle)',
                border: '1px solid var(--border-light)',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Currently authenticated:</div>
                  <strong style={{ color: 'var(--text-primary)' }}>{currentUser.name}</strong>{' '}
                  <span style={{ fontSize: '11px', color: currentUser.role === 'admin' ? 'var(--color-danger)' : 'var(--text-muted)' }}>
                    ({currentUser.role === 'admin' ? 'Admin' : `@${currentUser.id}`})
                  </span>
                </div>
                <button 
                  onClick={() => handleFinishLogin(currentUser)}
                  className="btn btn-primary" 
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  Continue →
                </button>
              </div>
            )}

            {/* Error Message Alert */}
            {error && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '10px', 
                padding: '12px 14px', 
                borderRadius: 'var(--radius-md)', 
                background: 'var(--color-danger-bg)', 
                color: 'var(--color-danger)', 
                fontSize: '13px', 
                marginBottom: '20px',
                border: '1px solid rgba(220, 38, 38, 0.2)'
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ lineHeight: 1.4 }}>{error}</span>
              </div>
            )}

            {/* Success Message Alert */}
            {successMessage && !error && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '10px', 
                padding: '12px 14px', 
                borderRadius: 'var(--radius-md)', 
                background: 'var(--color-success-bg)', 
                color: 'var(--color-success)', 
                fontSize: '13px', 
                marginBottom: '20px',
                border: '1px solid rgba(5, 150, 105, 0.2)'
              }}>
                <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ lineHeight: 1.4 }}>{successMessage}</span>
              </div>
            )}

            {/* ---------------- STEP 1: EMAIL INPUT ---------------- */}
            {step === 'EMAIL' && !showPasswordLogin && (
              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="email-input">
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail 
                      size={18} 
                      style={{ 
                        position: 'absolute', 
                        left: '14px', 
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        color: 'var(--text-muted)' 
                      }} 
                    />
                    <input
                      id="email-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.com"
                      required
                      autoFocus
                      autoComplete="email"
                      className="form-input"
                      style={{ paddingLeft: '44px', height: '48px', fontSize: '15px' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="btn btn-primary"
                  style={{ 
                    height: '48px', 
                    fontSize: '15px', 
                    fontWeight: 700, 
                    display: 'flex', 
                    justifyContent: 'center', 
                    gap: '8px',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  {loading ? (
                    'Sending Code...'
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => { setShowPasswordLogin(true); setError(null); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '13px',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Admin password login
                  </button>
                </div>
              </form>
            )}

            {/* ---------------- FALLBACK: ADMIN PASSWORD LOGIN ---------------- */}
            {step === 'EMAIL' && showPasswordLogin && (
              <form onSubmit={handleLegacyPasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="admin-userid">Admin Username</label>
                  <div style={{ position: 'relative' }}>
                    <UserIcon size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="admin-userid"
                      type="text"
                      value={adminUserId}
                      onChange={(e) => setAdminUserId(e.target.value)}
                      placeholder="admin"
                      required
                      className="form-input"
                      style={{ paddingLeft: '44px', height: '46px' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="admin-password">Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="admin-password"
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="form-input"
                      style={{ paddingLeft: '44px', height: '46px' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !adminUserId || !adminPassword}
                  className="btn btn-primary"
                  style={{ height: '46px', fontSize: '14px', fontWeight: 700 }}
                >
                  {loading ? 'Authenticating...' : 'Sign In as Admin'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => { setShowPasswordLogin(false); setError(null); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-accent)',
                      fontSize: '13px',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    ← Back to Email OTP login
                  </button>
                </div>
              </form>
            )}

            {/* ---------------- STEP 2: 6-DIGIT OTP BOXES ---------------- */}
            {step === 'OTP' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* 6 Digit Input Group */}
                <div>
                  <label className="form-label" style={{ display: 'block', textAlign: 'center', marginBottom: '12px' }}>
                    Enter 6-Digit Code
                  </label>
                  <div 
                    style={{ 
                      display: 'flex', 
                      gap: '8px', 
                      justifyContent: 'center',
                      direction: 'ltr'
                    }}
                    onPaste={handlePaste}
                  >
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => { inputRefs.current[idx] = el; }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        autoComplete="one-time-code"
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                        className="form-input"
                        style={{
                          width: '48px',
                          height: '56px',
                          textAlign: 'center',
                          fontSize: '22px',
                          fontWeight: 700,
                          borderRadius: 'var(--radius-md)',
                          border: digit ? '2px solid var(--color-accent)' : '1px solid var(--border-medium)',
                          background: digit ? 'var(--bg-accent-subtle)' : 'var(--bg-input)',
                          color: 'var(--text-primary)',
                          transition: 'all var(--transition-fast)'
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Verify Submit Button */}
                <button
                  type="button"
                  onClick={() => handleVerifyOtp()}
                  disabled={loading || otpDigits.join('').length !== 6}
                  className="btn btn-primary"
                  style={{ 
                    height: '48px', 
                    fontSize: '15px', 
                    fontWeight: 700, 
                    display: 'flex', 
                    justifyContent: 'center', 
                    gap: '8px',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  {loading ? 'Verifying Code...' : 'Verify & Continue'}
                </button>

                {/* Resend & Change Email Navigation */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-light)',
                  fontSize: '13px'
                }}>
                  <button
                    type="button"
                    onClick={() => { setStep('EMAIL'); setError(null); setSuccessMessage(null); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    ← Change email
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || loading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--color-accent)',
                      fontWeight: 600,
                      cursor: resendCooldown > 0 ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0
                    }}
                  >
                    <RotateCcw size={13} />
                    <span>
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* ---------------- STEP 3: OPTIONAL MOBILE NUMBER ---------------- */}
            {step === 'OPTIONAL_PHONE' && (
              <form onSubmit={handleSavePhone} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-accent-subtle)',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '13px',
                  color: 'var(--color-accent)'
                }}>
                  <Sparkles size={18} style={{ flexShrink: 0 }} />
                  <span>Welcome! Your academic account has been verified.</span>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" htmlFor="phone-input" style={{ margin: 0 }}>
                      Mobile Number
                    </label>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Optional</span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Phone 
                      size={18} 
                      style={{ 
                        position: 'absolute', 
                        left: '14px', 
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        color: 'var(--text-muted)' 
                      }} 
                    />
                    <input
                      id="phone-input"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      autoFocus
                      autoComplete="tel"
                      className="form-input"
                      style={{ paddingLeft: '44px', height: '48px', fontSize: '15px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ 
                      height: '48px', 
                      fontSize: '15px', 
                      fontWeight: 700, 
                      display: 'flex', 
                      justifyContent: 'center',
                      borderRadius: 'var(--radius-md)'
                    }}
                  >
                    {phone.trim() ? 'Save and Continue' : 'Continue'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFinishLogin(currentUser)}
                    className="btn btn-outline"
                    style={{ 
                      height: '42px', 
                      fontSize: '14px', 
                      fontWeight: 600, 
                      color: 'var(--text-muted)',
                      borderRadius: 'var(--radius-md)'
                    }}
                  >
                    Skip for now
                  </button>
                </div>
              </form>
            )}

          </div>

          {/* Security Note Footer */}
          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
            <span>Protected by cryptographic one-time verification. Codes expire in 5 minutes.</span>
          </div>

        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Loading authentication...</div>
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}
