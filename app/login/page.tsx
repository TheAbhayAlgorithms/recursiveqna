'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  GraduationCap, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  BookOpen, 
  ShieldCheck, 
  Sun, 
  Moon,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useTheme();

  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login';
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);

  // Form states
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (searchParams.get('tab') === 'register') {
      setTab('register');
    }
  }, [searchParams]);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

  const handleLoginSuccess = (userObj: any) => {
    const redirectParam = searchParams.get('redirect');
    if (redirectParam) {
      router.push(redirectParam);
    } else if (userObj?.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/');
    }
    router.refresh();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = { error: `Server error (${res.status} ${res.statusText})` };
      }

      if (!res.ok) {
        setError(data.error || 'Authentication failed. Please check credentials.');
        setLoading(false);
        return;
      }

      handleLoginSuccess(data.user);
    } catch (err: any) {
      console.error('Login error:', err);
      const msg = err?.message || '';
      if (msg.includes('fetch') || msg.includes('Network') || msg.includes('Load failed')) {
        setError('Cannot connect to the RecursiveQnA server. Please ensure the development server is active.');
      } else {
        setError(msg || 'An unexpected network error occurred. Please try again.');
      }
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name,
          password,
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = { error: `Server error (${res.status} ${res.statusText})` };
      }

      if (!res.ok) {
        setError(data.error || 'Registration failed.');
        setLoading(false);
        return;
      }

      handleLoginSuccess(data.user);
    } catch (err: any) {
      console.error('Registration error:', err);
      const msg = err?.message || '';
      if (msg.includes('fetch') || msg.includes('Network') || msg.includes('Load failed')) {
        setError('Cannot connect to the RecursiveQnA server. Please ensure the development server is active.');
      } else {
        setError(msg || 'An unexpected network error occurred. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
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
            <button 
              onClick={toggleTheme} 
              className="btn-icon-only" 
              title={theme === 'light' ? 'Switch to Night Mode' : 'Switch to Day Mode'}
              aria-label="Toggle Day and Night mode"
            >
              {theme === 'light' ? (
                <Moon size={18} style={{ color: 'var(--text-secondary)' }} />
              ) : (
                <Sun size={18} style={{ color: '#f59e0b' }} />
              )}
            </button>
            <Link href="/" className="btn btn-outline" style={{ fontSize: '13px', padding: '6px 14px' }}>
              Back to Questions
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          
          {/* Card */}
          <div className="card" style={{ padding: '32px 28px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
            
            {/* Header info */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                background: 'var(--bg-accent-subtle)', 
                color: 'var(--color-accent)', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: '12px'
              }}>
                <ShieldCheck size={26} />
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {tab === 'login' ? 'Scholarly Authentication' : 'Create Academic Account'}
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {tab === 'login' 
                  ? 'Sign in with your credentials to post questions and verify solutions.'
                  : 'Join the community to collaborate, solve problems, and exchange ideas.'}
              </p>
            </div>

            {/* Current user session alert if already logged in */}
            {currentUser && (
              <div style={{
                marginBottom: '18px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-accent-subtle)',
                border: '1px solid var(--border-color)',
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
                {currentUser.role === 'admin' ? (
                  <Link href="/admin" className="btn btn-primary" style={{ fontSize: '12px', padding: '5px 12px' }}>
                    Admin Panel →
                  </Link>
                ) : (
                  <Link href="/" className="btn btn-outline" style={{ fontSize: '12px', padding: '5px 12px' }}>
                    Home →
                  </Link>
                )}
              </div>
            )}

            {/* Segmented Switcher */}
            <div style={{ 
              display: 'flex', 
              background: 'var(--bg-subtle)', 
              padding: '4px', 
              borderRadius: 'var(--radius-md)', 
              marginBottom: '24px' 
            }}>
              <button
                type="button"
                onClick={() => { setTab('login'); setError(null); }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  background: tab === 'login' ? 'var(--bg-card)' : 'transparent',
                  color: tab === 'login' ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: tab === 'login' ? 'var(--shadow-sm)' : 'none',
                }}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => { setTab('register'); setError(null); }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  background: tab === 'register' ? 'var(--bg-card)' : 'transparent',
                  color: tab === 'register' ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: tab === 'register' ? 'var(--shadow-sm)' : 'none',
                }}
              >
                Register
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '10px', 
                padding: '12px 14px', 
                borderRadius: 'var(--radius-md)', 
                background: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid rgba(239, 68, 68, 0.25)', 
                color: 'var(--color-danger)', 
                fontSize: '13px',
                marginBottom: '20px'
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            {tab === 'login' ? (
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label className="form-label" htmlFor="login-userId">
                    User ID
                  </label>
                  <div style={{ position: 'relative' }}>
                    <UserIcon size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="login-userId"
                      type="text"
                      required
                      placeholder="e.g. admin or alex_student"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: '40px' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="login-password">
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="login-password"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: '40px' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '8px', padding: '12px', justifyContent: 'center' }}
                >
                  {loading ? 'Verifying Credentials...' : 'Sign In'}
                  <ArrowRight size={16} />
                </button>

              </form>
            ) : (
              /* Register Form */
              <form onSubmit={handleRegister}>
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-userId">
                    Choose User ID
                  </label>
                  <div style={{ position: 'relative' }}>
                    <UserIcon size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="reg-userId"
                      type="text"
                      required
                      placeholder="e.g. robert_feynman"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: '40px' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-name">
                    Full Name
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    required
                    placeholder="e.g. Prof. Robert Feynman"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input"
                  />
                </div>


                <div className="form-group">
                  <label className="form-label" htmlFor="reg-password">
                    Password (min 6 characters)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="reg-password"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: '40px' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '8px', padding: '12px', justifyContent: 'center' }}
                >
                  {loading ? 'Creating Account...' : 'Complete Registration'}
                  <ArrowRight size={16} />
                </button>
              </form>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
