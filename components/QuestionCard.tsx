'use client';

import React from 'react';
import Link from 'next/link';
import { 
  MessageSquare, 
  CheckCircle2, 
  Image as ImageIcon, 
  Video, 
  Trash2, 
  Clock, 
  User,
  ShieldCheck,
  ChevronRight,
  BookOpen,
  PlusCircle,
  Eye
} from 'lucide-react';

interface Question {
  id: string;
  user_id: string;
  user_name: string;
  title: string;
  content: string;
  field: string;
  image_url: string | null;
  video_url: string | null;
  created_at: number;
  user_role?: 'admin' | 'user';
  solutions_count: number;
  thoughts_count: number;
  verified_solutions_count?: number;
}

interface QuestionCardProps {
  question: Question;
  isAdmin?: boolean;
  onDelete?: (questionId: string) => void;
  onAddSolution?: (questionId: string, title: string) => void;
  onViewQuestion?: (questionId: string, initialTab?: 'question' | 'solutions') => void;
}

export default function QuestionCard({ 
  question, 
  isAdmin, 
  onDelete,
  onAddSolution,
  onViewQuestion
}: QuestionCardProps) {
  const formattedDate = new Date(question.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const getBadgeClass = (field: string) => {
    const clean = field.replace(/\s+/g, '');
    return `field-badge badge-${clean}`;
  };

  const handleOpenViewer = (tab: 'question' | 'solutions' = 'question') => {
    if (onViewQuestion) {
      onViewQuestion(question.id, tab);
    }
  };

  return (
    <article className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className={getBadgeClass(question.field)}>
            {question.field}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
            <Clock size={14} />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Admin Delete Action (Exclusive to Admin) */}
        {isAdmin && onDelete && (
          <button
            onClick={() => onDelete(question.id)}
            className="btn btn-danger-outline btn-sm"
            title="Admin deletion - permanently purge this question"
          >
            <Trash2 size={14} />
            <span>Delete (Admin)</span>
          </button>
        )}
      </div>

      {/* Question Title & Content */}
      <div>
        <h3 
          onClick={() => handleOpenViewer('question')}
          style={{ 
            fontSize: '18px', 
            fontWeight: 700, 
            color: 'var(--text-primary)', 
            marginBottom: '8px',
            lineHeight: 1.4,
            cursor: 'pointer',
            transition: 'color var(--transition-fast)'
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
          onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
        >
          {question.title}
        </h3>

        <p 
          onClick={() => handleOpenViewer('question')}
          style={{ 
            fontSize: '14px', 
            color: 'var(--text-secondary)', 
            lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            cursor: 'pointer'
          }}
        >
          {question.content}
        </p>
      </div>

      {/* Media Badges / Previews if present */}
      {(question.image_url || question.video_url) && (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {question.image_url && (
            <button
              type="button"
              onClick={() => handleOpenViewer('question')}
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                fontSize: '12px', 
                padding: '4px 10px', 
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-subtle)',
                color: 'var(--color-primary)',
                fontWeight: 600,
                border: '1px solid var(--border-light)',
                cursor: 'pointer'
              }}
            >
              <ImageIcon size={14} />
              <span>Diagram / Photo Attached</span>
            </button>
          )}
          {question.video_url && (
            <button
              type="button"
              onClick={() => handleOpenViewer('question')}
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                fontSize: '12px', 
                padding: '4px 10px', 
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-subtle)',
                color: 'var(--color-chemistry)',
                fontWeight: 600,
                border: '1px solid var(--border-light)',
                cursor: 'pointer'
              }}
            >
              <Video size={14} />
              <span>Video Walkthrough Attached</span>
            </button>
          )}
        </div>
      )}

      {/* Footer: Author, Solutions, Thoughts, and Action Buttons */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border-light)',
          paddingTop: '14px',
          marginTop: '4px',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        {/* Author info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <div style={{ 
            width: '24px', 
            height: '24px', 
            borderRadius: '50%', 
            background: question.user_role === 'admin' ? 'var(--color-danger)' : 'var(--bg-subtle)',
            color: question.user_role === 'admin' ? 'white' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 700
          }}>
            {question.user_name.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{question.user_name}</span>
          {question.user_role === 'admin' && (
            <span style={{ 
              fontSize: '10px', 
              background: 'var(--color-danger-bg)', 
              color: 'var(--color-danger)', 
              padding: '2px 6px', 
              borderRadius: '4px',
              fontWeight: 700
            }}>
              Admin
            </span>
          )}
        </div>

        {/* Action Controls: strictly the 3 options requested */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          
          {/* Option 1: Number of solutions showing */}
          <div 
            className={`solutions-count-badge ${(question.verified_solutions_count || 0) > 0 ? 'has-verified' : ''}`}
            title={`${question.solutions_count} solutions recorded`}
          >
            <CheckCircle2 size={14} />
            <span>{question.solutions_count} {question.solutions_count === 1 ? 'Solution' : 'Solutions'}</span>
          </div>

          {/* Option 2: View Solution */}
          <button 
            type="button"
            onClick={() => handleOpenViewer('solutions')}
            className="btn btn-secondary btn-sm"
            title="View submitted solutions for this question"
          >
            <Eye size={14} />
            <span>View Solution</span>
          </button>

          {/* Option 3: Add Solution */}
          {onAddSolution && (
            <button
              type="button"
              onClick={() => onAddSolution(question.id, question.title)}
              className="btn btn-primary btn-sm"
              title="Add a solution"
            >
              <PlusCircle size={14} />
              <span>Add Solution</span>
            </button>
          )}

        </div>
      </div>
    </article>
  );
}
