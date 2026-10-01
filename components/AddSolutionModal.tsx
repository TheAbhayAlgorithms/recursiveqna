'use client';

import React, { useState, useRef } from 'react';
import { 
  X, 
  Image as ImageIcon, 
  Video, 
  CheckCircle2, 
  AlertCircle, 
  Trash2,
  BookOpen
} from 'lucide-react';

interface AddSolutionModalProps {
  isOpen: boolean;
  questionId: string;
  questionTitle: string;
  onClose: () => void;
  onSolutionAdded: () => void;
}

export default function AddSolutionModal({
  isOpen,
  questionId,
  questionTitle,
  onClose,
  onSolutionAdded,
}: AddSolutionModalProps) {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (file: File, type: 'image' | 'video') => {
    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload media');
      }

      if (type === 'image') {
        setImageUrl(data.url);
      } else {
        setVideoUrl(data.url);
      }
    } catch (err: any) {
      setError(err.message || 'Media upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please provide explanation steps or answer details.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/solutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          content,
          imageUrl,
          videoUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit solution');
      }

      setContent('');
      setImageUrl(null);
      setVideoUrl(null);
      onSolutionAdded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit solution');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '8px', 
              background: 'var(--color-success-bg)', 
              color: 'var(--color-success)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Provide a Solution
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }} className="truncate">
                Replying to: {questionTitle}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon-only" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              fontSize: '13px',
              fontWeight: 500,
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Solution Body */}
          <div className="form-group">
            <label className="form-label">Step-by-Step Explanation / Proof</label>
            <textarea
              className="form-textarea"
              placeholder="Break down your answer step-by-step. Include key theorems, formulas, or logical deductions..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              required
            />
          </div>

          {/* Attachment Controls */}
          <div style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
              Solution Media (Diagram, Handwritten Work, or Video Walkthrough)
            </label>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input
                type="file"
                ref={imageInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'image');
                }}
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="btn btn-secondary"
                disabled={isUploading}
              >
                <ImageIcon size={16} style={{ color: 'var(--color-primary)' }} />
                <span>{imageUrl ? 'Change Photo' : 'Attach Photo / Written Work'}</span>
              </button>

              <input
                type="file"
                ref={videoInputRef}
                accept="video/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'video');
                }}
              />
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="btn btn-secondary"
                disabled={isUploading}
              >
                <Video size={16} style={{ color: 'var(--color-chemistry)' }} />
                <span>{videoUrl ? 'Change Video' : 'Attach Video Solution'}</span>
              </button>
            </div>

            {isUploading && (
              <div style={{ fontSize: '13px', color: 'var(--color-accent)', marginTop: '10px' }}>
                Uploading media attachment, please wait...
              </div>
            )}

            {/* Media Previews */}
            {imageUrl && (
              <div className="media-preview-container" style={{ position: 'relative' }}>
                <img src={imageUrl} alt="Solution preview" className="media-image" />
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '6px',
                    borderRadius: '50%',
                  }}
                  title="Remove image"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}

            {videoUrl && (
              <div className="media-preview-container" style={{ position: 'relative' }}>
                <video src={videoUrl} controls className="media-video" />
                <button
                  type="button"
                  onClick={() => setVideoUrl(null)}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '6px',
                    borderRadius: '50%',
                    zIndex: 10,
                  }}
                  title="Remove video"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          <div style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-light)',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            marginBottom: '24px',
            lineHeight: 1.5
          }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Preservation Notice: </span>
            Solutions cannot be retracted or deleted once submitted, ensuring educational resources remain available. Only administrators can delete solutions if needed.
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || isUploading}>
              {isSubmitting ? 'Submitting Solution...' : 'Post Solution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
