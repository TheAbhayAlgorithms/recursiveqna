'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  GraduationCap, 
  Lock, 
  User as UserIcon,
  AlertCircle, 
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { getSupabase } from '@/lib/supabase';

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.27-2.09 3.67-5.17 3.67-9.15z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.15C3.25 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.28C.46 8.23 0 10.06 0 12s.46 3.77 1.28 5.39l3.99-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.28 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
      />
    </svg>
  );
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect') || '/';

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [showSupabaseSetup, setShowSupabaseSetup] = useState(false);
  const [copied, setCopied] = useState(false);

  // Admin password credentials
  const [adminUserId, setAdminUserId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const projectRef = supabaseUrl ? supabaseUrl.replace('https://', '').split('.')[0] : 'huadrmmnlvzdmtqkyldc';
  const supabaseDashboardUrl = `https://supabase.com/dashboard/project/${projectRef}/auth/providers`;
  const supabaseCallbackUrl = `https://${projectRef}.supabase.co/auth/v1/callback`;

  // Check existing session
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

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

  // Google Sign-In Handler via Supabase OAuth
  const handleGoogleSignIn = async () => {
    if (loading) return;
    setError(null);
    setShowSupabaseSetup(false);
    setLoading(true);

    try {
      const supabase = getSupabase();
      if (!supabase) {
        throw new Error('Supabase client is not configured.');
      }

      const callbackUrl = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectParam)}`;
      
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account', // Forces Google to show the account picker
          },
        },
      });

      if (oauthError) {
        const msg = oauthError.message || '';
        if (msg.toLowerCase().includes('not enabled') || msg.toLowerCase().includes('unsupported provider')) {
          setShowSupabaseSetup(true);
          setLoading(false);
          return;
        }
        throw oauthError;
      }

      // If data.url is returned, navigate to Google auth
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setError(err?.message || 'Failed to initiate Google sign in. Please try again.');
      setLoading(false);
    }
  };

  const handleCopyCallbackUrl = () => {
    navigator.clipboard.writeText(supabaseCallbackUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Administrator Password Login
  const handleAdminPasswordLogin = async (e: React.FormEvent) => {
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
    } catch {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
      {/* Header */}
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
          <div className="card" style={{ padding: '36px 32px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-md)', borderRadius: 'var(--radius-lg)' }}>
            
            {/* Header info */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{ 
                width: '56px', 
                height: '56px', 
                borderRadius: '16px', 
                background: 'var(--bg-accent-subtle)', 
                color: 'var(--color-accent)', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: '16px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.15)'
              }}>
                {showPasswordLogin ? <Lock size={26} /> : <ShieldCheck size={28} />}
              </div>

              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                {showPasswordLogin ? 'Administrator Sign In' : 'Sign in with Google'}
              </h1>

              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                {showPasswordLogin 
                  ? 'Sign in using your administrator username and master password.'
                  : 'Access academic discussions, post questions, and share solutions with your Google account.'}
              </p>
            </div>

            {/* Currently authenticated notice */}
            {currentUser && !showPasswordLogin && (
              <div style={{
                marginBottom: '22px',
                padding: '14px 16px',
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
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Currently signed in:</div>
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

            {/* Error Banner */}
            {error && !showSupabaseSetup && (
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

            {/* Supabase Provider Setup Guide (Shown only if Google provider is toggled OFF in Supabase) */}
            {showSupabaseSetup && !showPasswordLogin && (
              <div style={{
                marginBottom: '20px',
                padding: '18px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-accent-subtle)',
                border: '1px solid var(--border-medium)',
                fontSize: '13px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-accent)', fontWeight: 700, marginBottom: '8px' }}>
                  <AlertCircle size={18} />
                  <span>One-Time Supabase Setup Required</span>
                </div>
                
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 12px 0' }}>
                  To redirect to the Google account selection page, enable the <strong>Google provider</strong> in your Supabase Dashboard:
                </p>

                <ol style={{ paddingLeft: '18px', margin: '0 0 14px 0', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <li>Open the Supabase Providers dashboard.</li>
                  <li>Toggle <strong>Google</strong> to <strong>Enabled</strong>.</li>
                  <li>Paste your Google OAuth <strong>Client ID</strong> and <strong>Secret</strong>.</li>
                </ol>

                <div style={{ background: 'var(--bg-card)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-light)', marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Google Cloud Authorized Redirect URI:
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <code style={{ fontSize: '11.5px', wordBreak: 'break-all', color: 'var(--text-primary)' }}>
                      {supabaseCallbackUrl}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyCallbackUrl}
                      title="Copy URI"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: copied ? 'var(--color-success)' : 'var(--color-accent)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <a
                    href={supabaseDashboardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{
                      flex: 1,
                      height: '38px',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      textDecoration: 'none'
                    }}
                  >
                    <span>Open Supabase Dashboard</span>
                    <ExternalLink size={14} />
                  </a>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="btn btn-outline"
                    style={{ height: '38px', fontSize: '13px', padding: '0 14px' }}
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* Main Google Sign-In Action */}
            {!showPasswordLogin && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    width: '100%',
                    height: '52px',
                    padding: '0 20px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: loading ? 'default' : 'pointer',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                    transition: 'all var(--transition-fast)',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.boxShadow = '0 3px 8px rgba(0, 0, 0, 0.12)';
                      e.currentTarget.style.borderColor = 'var(--color-accent)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.08)';
                    e.currentTarget.style.borderColor = 'var(--border-medium)';
                  }}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={18} style={{ animation: 'spin 1.2s linear infinite', color: 'var(--color-accent)' }} />
                      <span>Opening Google...</span>
                    </>
                  ) : (
                    <>
                      <GoogleIcon />
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>

                <div style={{ textAlign: 'center', marginTop: '14px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
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
              </div>
            )}

            {/* Fallback: Admin Username & Password Login */}
            {showPasswordLogin && (
              <form onSubmit={handleAdminPasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                      autoFocus
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
                    ← Back to Google sign in
                  </button>
                </div>
              </form>
            )}

          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
            <span>Protected by Google Single Sign-On and cryptographic session tokens.</span>
          </div>

        </div>
      </main>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
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
