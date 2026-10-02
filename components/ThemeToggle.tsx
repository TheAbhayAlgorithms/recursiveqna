'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`btn-icon-only nav-theme-btn ${className}`}
      title={theme === 'light' ? 'Switch to Night Mode' : 'Switch to Day Mode'}
      aria-label="Toggle Day and Night mode"
    >
      {theme === 'light' ? (
        <Moon size={18} className="theme-btn-icon moon" />
      ) : (
        <Sun size={18} className="theme-btn-icon sun" />
      )}
    </button>
  );
}
