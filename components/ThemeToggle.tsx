'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={toggleTheme}
      className={`theme-toggle-switch ${isDark ? 'dark' : 'light'} ${className}`}
      title={isDark ? 'Switch to Day Mode' : 'Switch to Night Mode'}
      aria-label="Toggle Day and Night mode"
    >
      <span className="theme-toggle-track">
        <Sun size={11} className="theme-track-icon theme-track-sun" aria-hidden="true" />
        <Moon size={11} className="theme-track-icon theme-track-moon" aria-hidden="true" />
        <span className="theme-toggle-thumb" aria-hidden="true">
          {isDark ? (
            <Moon size={11} className="theme-thumb-icon moon" />
          ) : (
            <Sun size={11} className="theme-thumb-icon sun" />
          )}
        </span>
      </span>
    </button>
  );
}
