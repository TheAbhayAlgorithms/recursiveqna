'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, AlertCircle, RefreshCw } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect') || '/';
  const urlError = searchParams.get('error_description') || searchParams.get('error');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(urlError || null);

  useEffect(() => {
    if (urlError) {
      setStatus('error');
      setErrorMessage(decodeURIComponent(urlError));
      return;
    }

    let isMounted = true;

    async function handleAuth() {
      try {
        const supabase = getSupabase();
        if (!supabase) {
          if (!isMounted) return;
          setStatus('error');
          setErrorMessage('Supabase client is not configured.');
          return;
        }

        // 1. Check if Supabase already has the session (from PKCE exchange or hash)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (session && session.user) {
          await exchangeWithBackend(session.access_token, session.user);
          return;
        }

        // 2. Set up listener in case PKCE exchange is still completing
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && currentSession?.user) {
            await exchangeWithBackend(currentSession.access_token, currentSession.user);
          }
        });

        // Timeout fallback after 6 seconds if no session is received
        const timer = setTimeout(() => {
          if (isMounted && status === 'loading') {
            setStatus('error');
            setErrorMessage('Authentication timed out or was cancelled. Please try signing in again.');
          }
        }, 6000);

        return () => {
          authListener?.subscription.unsubscribe();
          clearTimeout(timer);
        };
      } catch (err: any) {
        if (!isMounted) return;
        setStatus('error');
        setErrorMessage(err?.message || 'Failed to complete Google authentication.');
      }
    }

    async function exchangeWithBackend(accessToken: string, user: any) {
      try {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supabaseAccessToken: accessToken,
            email: user.email,
            name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.error || 'Failed to establish application session.');
        }

        if (!isMounted) return;
        setStatus('success');

        const destination = redirectParam && redirectParam !== '/' ? redirectParam : (data.user?.role === 'admin' ? '/admin' : '/');
        router.push(destination);
        router.refresh();
      } catch (err: any) {
        if (!isMounted) return;
        setStatus('error');
        setErrorMessage(err?.message || 'Error communicating with scholar database.');
      }
    }

    handleAuth();

    return () => {
      isMounted = false;
    };
  }, [router, redirectParam, urlError]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
      {/* Header */}
      <header style={{ height: '68px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center' }}>
        <div className="app-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Link href="/" className="brand-logo">
            <div className="brand-icon">
              <GraduationCap size={22} />
            </div>
            <div>
              <span>RecursiveQnA</span>
              <span style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                ACADEMIA Q&A
              </span>
            </div>
          </Link>
        </div>
      </header>

      {/* Main card */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          <div className="card" style={{ padding: '36px 30px', textAlign: 'center', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-md)', borderRadius: 'var(--radius-lg)' }}>
            
            {status === 'loading' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'var(--bg-accent-subtle)',
                  color: 'var(--color-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <RefreshCw size={24} className="animate-spin" style={{ animation: 'spin 1.2s linear infinite' }} />
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Authenticating with Google...
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                  Connecting your academic profile. Just a moment.
                </p>
              </div>
            )}

            {status === 'success' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--color-success)' }}>
                  Sign in Successful!
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                  Redirecting to your workspace...
                </p>
              </div>
            )}

            {status === 'error' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'var(--color-danger-bg)',
                  color: 'var(--color-danger)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <AlertCircle size={26} />
                </div>
                <div>
                  <h2 style={{ fontSize: '19px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
                    Authentication Incomplete
                  </h2>
                  <p style={{ fontSize: '13.5px', color: 'var(--color-danger)', margin: 0, lineHeight: 1.4 }}>
                    {errorMessage || 'Unable to complete sign in.'}
                  </p>
                </div>
                <Link
                  href={`/login${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ''}`}
                  className="btn btn-primary"
                  style={{ width: '100%', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600 }}
                >
                  Return to Sign In
                </Link>
              </div>
            )}

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

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Processing authentication...</div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
