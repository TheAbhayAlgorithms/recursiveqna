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
            <GraduationCap size={20} />
          </div>
          <div className="brand-text-wrapper">
            <span className="brand-title">RecursiveQnA</span>
            <span className="brand-subtitle">ACADEMIA Q&A</span>
          </div>
        </Link>

        {/* Right Navigation & Controls */}
        <div className="nav-actions">
          {/* Day / Night Theme Button */}
          <button 
            onClick={toggleTheme} 
            className="btn-icon-only nav-theme-btn" 
            title={theme === 'light' ? 'Switch to Night Mode' : 'Switch to Day Mode'}
            aria-label="Toggle Day and Night mode"
          >
            {theme === 'light' ? (
              <Moon size={17} style={{ color: 'var(--text-secondary)' }} />
            ) : (
              <Sun size={17} style={{ color: '#f59e0b' }} />
            )}
          </button>

          {/* Ask Question CTA */}
          <button 
            onClick={onOpenAskModal}
            className="btn btn-primary nav-ask-btn"
            title="Ask Question"
          >
            <PlusCircle size={16} />
            <span className="nav-btn-full">Ask Question</span>
            <span className="nav-btn-compact">Ask</span>
          </button>

          {/* Admin Dashboard Link (Only visible if Admin) */}
          {user?.role === 'admin' && (
            <Link 
              href="/admin" 
              className="btn btn-secondary nav-admin-btn" 
              style={{ borderColor: 'var(--color-primary)' }}
              title="Admin Panel"
            >
              <ShieldAlert size={16} style={{ color: 'var(--color-primary)' }} />
              <span className="nav-btn-full">Admin Panel</span>
              <span className="nav-btn-compact">Admin</span>
            </Link>
          )}

          {/* User Status / Login Buttons */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div 
                className="nav-user-badge"
                title={`${user.name} (@${user.id})`}
              >
                <div 
                  className="nav-user-avatar"
                  style={{ 
                    background: user.role === 'admin' ? 'var(--color-danger)' : 'var(--color-primary)', 
                    color: 'white'
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="nav-user-info">
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{user.name}</div>
                  <div style={{ fontSize: '10px', color: user.role === 'admin' ? 'var(--color-danger)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {user.role === 'admin' ? 'Administrator' : `@${user.id}`}
                  </div>
                </div>
              </div>

              <button 
                onClick={onLogout} 
                className="btn-icon-only nav-logout-btn" 
                title="Log Out"
                aria-label="Log Out"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div className="nav-auth-buttons">
              <Link href="/login" className="btn btn-outline nav-auth-btn">
                <LogIn size={15} />
                <span>Log In</span>
              </Link>
              <Link href="/login?tab=register" className="btn btn-secondary nav-auth-btn">
                <UserPlus size={15} />
                <span>Register</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
