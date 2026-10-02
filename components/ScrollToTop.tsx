'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const doc = document.documentElement;
      const totalScrollable = doc.scrollHeight - window.innerHeight;

      // Only show if the page is actually scrollable
      if (totalScrollable < 200) {
        setIsVisible(false);
        return;
      }

      const scrolled = window.scrollY || doc.scrollTop;
      const distanceFromBottom = doc.scrollHeight - (scrolled + window.innerHeight);
      const scrollPercentage = (scrolled / totalScrollable) * 100;

      // Appears when scrolling of complete page is finished (near/at the bottom)
      const isFinished = distanceFromBottom <= 180 || scrollPercentage >= 88;
      setIsVisible(isFinished);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className={`scroll-to-top-btn ${isVisible ? 'visible' : ''}`}
      aria-label="Back to top"
      title="Back to top"
    >
      <ArrowUp size={18} className="scroll-to-top-icon" />
      <span className="scroll-to-top-text">Back to Top</span>
    </button>
  );
}
