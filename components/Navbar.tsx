'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from './ThemeProvider';
import { 
  Sun, 
  Moon, 
  PlusCircle, 
  ShieldAlert, 
  GraduationCap, 
  LogOut, 
  LogIn, 
  UserPlus,
  BookOpen
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  role: 'admin' | 'user';
  field_of_interest?: string;
}

interface NavbarProps {
  user: User | null;
  onOpenAskModal?: () => void;
  onLogout?: () => void;
}

export default function Navbar({ user, onOpenAskModal, onLogout }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="nav-header">
      <div className="app-container nav-inner">
        {/* Brand */}
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

        {/* Right Navigation & Controls */}
        <div className="nav-actions">
          {/* Day / Night Theme Button */}
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

          {/* Ask Question CTA */}
          <button 
            onClick={onOpenAskModal}
            className="btn btn-primary"
            style={{ fontWeight: 600 }}
          >
            <PlusCircle size={18} />
            <span>Ask Question</span>
          </button>

          {/* Admin Dashboard Link (Only visible if Admin) */}
          {user?.role === 'admin' && (
            <Link href="/admin" className="btn btn-secondary" style={{ borderColor: 'var(--color-primary)' }}>
              <ShieldAlert size={17} style={{ color: 'var(--color-primary)' }} />
              <span>Admin Panel</span>
            </Link>
          )}

          {/* User Status / Login Buttons */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  padding: '6px 12px',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  fontSize: '13px'
                }}
              >
                <div 
                  style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    background: user.role === 'admin' ? 'var(--color-danger)' : 'var(--color-primary)', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '11px'
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</div>
                  <div style={{ fontSize: '10px', color: user.role === 'admin' ? 'var(--color-danger)' : 'var(--text-muted)' }}>
                    {user.role === 'admin' ? 'Administrator' : `@${user.id}`}
                  </div>
                </div>
              </div>

              <button 
                onClick={onLogout} 
                className="btn-icon-only" 
                title="Log Out"
                aria-label="Log Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link href="/login" className="btn btn-outline">
                <LogIn size={16} />
                <span>Log In</span>
              </Link>
              <Link href="/login?tab=register" className="btn btn-secondary">
                <UserPlus size={16} />
                <span>Register</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
