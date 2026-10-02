'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import QuestionCard from '@/components/QuestionCard';
import AskQuestionModal from '@/components/AskQuestionModal';
import AddSolutionModal from '@/components/AddSolutionModal';
import QuestionViewerModal from '@/components/QuestionViewerModal';
import { 
  Search, 
  Sparkles, 
  BookOpen, 
  CheckCircle, 
  HelpCircle, 
  Layers,
  Filter,
  GraduationCap
} from 'lucide-react';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [selectedField, setSelectedField] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [solutionModalData, setSolutionModalData] = useState<{ isOpen: boolean; questionId: string; title: string }>({
    isOpen: false,
    questionId: '',
    title: '',
  });

  // Dedicated Question Viewer Modal state (Problem, Solutions)
  const [viewerState, setViewerState] = useState<{
    isOpen: boolean;
    questionId: string | null;
    initialTab: 'question' | 'solutions';
  }>({
    isOpen: false,
    questionId: null,
    initialTab: 'question',
  });

  // Load User Session
  const loadUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setUser(data.user);
    } catch {
      setUser(null);
    }
  };

  // Load Questions
  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedField !== 'All') params.set('field', selectedField);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/questions?${params.toString()}`);
      const data = await res.json();
      setQuestions(data.questions || []);
      if (Array.isArray(data.availableFields)) {
        setAvailableFields(data.availableFields);
      }
    } catch (err) {
      console.error('Failed to load questions', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [selectedField, searchQuery]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  const handleAdminDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to permanently delete this question and all its solutions? Only administrators can perform this action.')) {
      return;
    }

    try {
      const res = await fetch(`/api/questions/${questionId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to delete question');
        return;
      }
      loadQuestions();
    } catch (err) {
      alert('Error deleting question');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar 
        user={user} 
        onOpenAskModal={() => {
          if (!user) {
            window.location.href = '/login';
          } else {
            setIsAskModalOpen(true);
          }
        }} 
        onLogout={handleLogout} 
      />

      <main style={{ flex: 1, paddingBottom: '60px' }}>
        {/* Academic Hero Header */}
        <section className="home-hero-section" style={{ 
          background: 'var(--bg-card)', 
          borderBottom: '1px solid var(--border-light)',
          padding: '40px 0 32px 0' 
        }}>
          <div className="app-container">
            <div style={{ maxWidth: '720px' }}>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-accent-subtle)',
                color: 'var(--color-accent)',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '14px'
              }}>
                <Sparkles size={15} style={{ flexShrink: 0 }} />
                <span>Open Scholarly Exchange & Solutions</span>
              </div>
              <h1 className="home-hero-title" style={{ 
                fontSize: '32px', 
                fontWeight: 800, 
                letterSpacing: '-0.03em', 
                color: 'var(--text-primary)',
                lineHeight: 1.25,
                marginBottom: '10px'
              }}>
                Explore Questions, Share Insights, and Verify Academic Solutions.
              </h1>
              <p className="home-hero-desc" style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                A focused, minimalist platform for problem solvers. Ask anything with typed explanations, 
                diagram photos, or video walkthroughs.
              </p>
            </div>

            {/* Quick Filter & Search Bar */}
            <div style={{ 
              marginTop: '24px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '14px' 
            }}>
              {/* Search input */}
              <div className="home-search-wrapper" style={{ position: 'relative', maxWidth: '640px' }}>
                <Search 
                  size={18} 
                  style={{ 
                    position: 'absolute', 
                    left: '16px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: 'var(--text-muted)' 
                  }} 
                />
                <input
                  type="text"
                  placeholder="Search questions by keyword, topic, or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '44px', height: '48px' }}
                />
              </div>

              {/* Subject Field Chips - Dynamically showing only subjects with posted questions */}
              <div className="subject-chips-container" style={{ 
                display: 'flex', 
                gap: '8px', 
                overflowX: 'auto', 
                paddingBottom: '6px',
                WebkitOverflowScrolling: 'touch'
              }}>
                {['All', ...availableFields].map((f) => {
                  const isSelected = selectedField === f;
                  return (
                    <button
                      key={f}
                      onClick={() => setSelectedField(f)}
                      style={{
                        padding: '7px 14px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                        background: isSelected ? 'var(--color-accent)' : 'var(--bg-subtle)',
                        color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                        border: isSelected ? '1px solid var(--color-accent)' : '1px solid var(--border-light)',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}
                    >
                      {f}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Questions Feed Container */}
        <section className="app-container" style={{ marginTop: '32px' }}>
          <div className="questions-feed-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {selectedField === 'All' ? 'Recent Questions' : `${selectedField} Questions`}
            </h2>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
              {questions.length} {questions.length === 1 ? 'question' : 'questions'} available
            </span>
          </div>

          {isLoading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading educational repository...
            </div>
          ) : questions.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
              <div style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                background: 'var(--bg-subtle)', 
                margin: '0 auto 16px auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)'
              }}>
                <BookOpen size={28} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                No questions found in this category
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '440px', margin: '0 auto 20px auto' }}>
                Be the first to post a question or inquiry. Attach photos of textbook problems, handwritten equations, or video explanations.
              </p>
              <button 
                onClick={() => {
                  if (!user) window.location.href = '/login';
                  else setIsAskModalOpen(true);
                }} 
                className="btn btn-primary"
              >
                Post the First Question
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {questions.map((q) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  isAdmin={user?.role === 'admin'}
                  onDelete={handleAdminDeleteQuestion}
                  onViewQuestion={(questionId, initialTab) => {
                    setViewerState({
                      isOpen: true,
                      questionId,
                      initialTab: initialTab || 'question',
                    });
                  }}
                  onAddSolution={(questionId, title) => {
                    if (!user) {
                      window.location.href = '/login';
                    } else {
                      setSolutionModalData({ isOpen: true, questionId, title });
                    }
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Dedicated Question & Solution Viewer Interface */}
      <QuestionViewerModal
        isOpen={viewerState.isOpen}
        questionId={viewerState.questionId}
        initialTab={viewerState.initialTab}
        currentUser={user}
        onClose={() => setViewerState({ isOpen: false, questionId: null, initialTab: 'question' })}
        onQuestionDeleted={loadQuestions}
        onOpenAddSolution={(qId, qTitle) => {
          if (!user) {
            window.location.href = '/login';
          } else {
            setSolutionModalData({ isOpen: true, questionId: qId, title: qTitle });
          }
        }}
      />

      {/* Ask Question Modal */}
      <AskQuestionModal
        isOpen={isAskModalOpen}
        onClose={() => setIsAskModalOpen(false)}
        onQuestionCreated={loadQuestions}
      />

      {/* Add Solution Modal */}
      <AddSolutionModal
        isOpen={solutionModalData.isOpen}
        questionId={solutionModalData.questionId}
        questionTitle={solutionModalData.title}
        onClose={() => {
          setSolutionModalData({ isOpen: false, questionId: '', title: '' });
          loadQuestions();
        }}
        onSolutionAdded={loadQuestions}
      />
    </div>
  );
}
