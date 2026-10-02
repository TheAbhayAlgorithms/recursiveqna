'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { 
  ShieldAlert, 
  HelpCircle, 
  CheckCircle2, 
  MessageSquare, 
  Users, 
  Trash2, 
  ArrowLeft,
  Search,
  AlertTriangle,
  Lock,
  Layers,
  Sparkles,
  ExternalLink,
  KeyRound
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Stats & data
  const [stats, setStats] = useState<any>(null);
  const [fieldBreakdown, setFieldBreakdown] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [solutions, setSolutions] = useState<any[]>([]);
  const [thoughts, setThoughts] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);

  // Active Tab: 'overview' | 'questions' | 'solutions' | 'thoughts' | 'users' | 'security'
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'solutions' | 'thoughts' | 'users' | 'security'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);

  // Authenticate Admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (!data.user || data.user.role !== 'admin') {
          setCurrentUser(null);
        } else {
          setCurrentUser(data.user);
        }
      } catch {
        setCurrentUser(null);
      } finally {
        setAuthChecking(false);
      }
    };
    checkAdmin();
  }, []);

  const loadAdminData = async () => {
    if (!currentUser || currentUser.role !== 'admin') return;
    setIsLoadingData(true);
    try {
      // 1. Fetch Stats & Recent lists
      const statsRes = await fetch('/api/admin/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
        setFieldBreakdown(statsData.fieldBreakdown || []);
        setSolutions(statsData.recentSolutions || []);
        setThoughts(statsData.recentThoughts || []);
      }

      // 2. Fetch all questions
      const qRes = await fetch('/api/questions');
      if (qRes.ok) {
        const qData = await qRes.json();
        setQuestions(qData.questions || []);
      }

      // 3. Fetch users
      const usersRes = await fetch('/api/admin/users');
      if (usersRes.ok) {
        const uData = await usersRes.json();
        setUsersList(uData.users || []);
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      loadAdminData();
    }
  }, [currentUser]);

  // Admin Delete Actions
  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Permanent Action: Are you sure you want to delete this question? All associated solutions and thoughts will be wiped.')) return;
    try {
      const res = await fetch(`/api/questions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadAdminData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete question');
      }
    } catch {
      alert('Network error while deleting question');
    }
  };

  const handleDeleteSolution = async (id: string) => {
    if (!confirm('Permanent Action: Are you sure you want to delete this solution?')) return;
    try {
      const res = await fetch(`/api/solutions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadAdminData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete solution');
      }
    } catch {
      alert('Network error while deleting solution');
    }
  };

  const handleDeleteThought = async (id: string) => {
    if (!confirm('Delete this user thought?')) return;
    try {
      const res = await fetch(`/api/thoughts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadAdminData();
      }
    } catch {
      alert('Error deleting thought');
    }
  };

  const handleToggleRole = async (targetUserId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Change user ${targetUserId} role to ${newRole}?`)) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, newRole }),
      });
      const d = await res.json();
      if (!res.ok) {
        alert(d.error || 'Failed to update role');
        return;
      }
      loadAdminData();
    } catch {
      alert('Error updating user role');
    }
  };

  const handleDeleteUser = async (targetUserId: string) => {
    if (!confirm(`Delete user account @${targetUserId} and all their activity?`)) return;
    try {
      const res = await fetch(`/api/admin/users?id=${targetUserId}`, { method: 'DELETE' });
      const d = await res.json();
      if (!res.ok) {
        alert(d.error || 'Failed to delete user');
        return;
      }
      loadAdminData();
    } catch {
      alert('Error deleting user');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(null);

    if (!currentPassword) {
      setPwdError('Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setPwdError('New password must be at least 4 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match.');
      return;
    }

    setPwdLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwdError(data.error || 'Failed to update password.');
      } else {
        setPwdSuccess('Password changed successfully! Keep your new credentials safe.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPwdError(err.message || 'An unexpected error occurred.');
    } finally {
      setPwdLoading(false);
    }
  };

  if (authChecking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar user={null} />
        <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          Verifying administrative credentials...
        </div>
      </div>
    );
  }

  // Not an admin access block
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar user={currentUser} onLogout={() => setCurrentUser(null)} />
        <div className="app-container-narrow" style={{ padding: '80px 0', textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--color-danger-bg)',
            color: 'var(--color-danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto'
          }}>
            <Lock size={32} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
            Administrative Access Restricted
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 24px auto', fontSize: '15px' }}>
            Only designated platform administrators have permission to access control dashboards and delete educational questions or solutions.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <Link href="/" className="btn btn-primary">
              Return to Platform Home
            </Link>
            <Link href="/login?redirect=/admin" className="btn btn-outline">
              Log in with Admin Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Filtered lists based on search
  const filteredQuestions = questions.filter(q => 
    q.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    q.field.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.user_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSolutions = solutions.filter(s =>
    s.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.user_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = usersList.filter(u =>
    u.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar user={currentUser} onLogout={() => router.push('/')} />

      <main style={{ flex: 1, padding: '32px 0 60px 0' }}>
        <div className="app-container">
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  padding: '4px 10px', 
                  borderRadius: 'var(--radius-full)', 
                  background: 'var(--color-danger-bg)', 
                  color: 'var(--color-danger)', 
                  fontSize: '11px', 
                  fontWeight: 700 
                }}>
                  <ShieldAlert size={14} />
                  <span>ADMIN PRIVILEGES ACTIVE</span>
                </span>
              </div>
              <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Platform Control & Moderation
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                Exclusive authority to remove questions, purge solutions, and moderate community thoughts
              </p>
            </div>

            <Link href="/" className="btn btn-outline btn-sm">
              <ArrowLeft size={16} />
              <span>Back to Public Feed</span>
            </Link>
          </div>

          {/* Stats Bar */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px', 
            marginBottom: '32px' 
          }}>
            <div className="card" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-primary)', marginBottom: '8px' }}>
                <HelpCircle size={18} />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Total Questions</span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {stats?.totalQuestions || 0}
              </div>
            </div>

            <div className="card" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-success)', marginBottom: '8px' }}>
                <CheckCircle2 size={18} />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Total Solutions</span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {stats?.totalSolutions || 0}
              </div>
            </div>

            <div className="card" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-warning)', marginBottom: '8px' }}>
                <MessageSquare size={18} />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Community Thoughts</span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {stats?.totalThoughts || 0}
              </div>
            </div>

            <div className="card" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-chemistry)', marginBottom: '8px' }}>
                <Users size={18} />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Registered Users</span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {stats?.totalUsers || 0}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ 
            display: 'flex', 
            borderBottom: '1px solid var(--border-light)', 
            marginBottom: '24px',
            overflowX: 'auto',
            gap: '8px'
          }}>
            {[
              { id: 'overview', label: 'Overview & Fields', icon: Layers },
              { id: 'questions', label: `Questions (${questions.length})`, icon: HelpCircle },
              { id: 'solutions', label: `Solutions (${solutions.length})`, icon: CheckCircle2 },
              { id: 'thoughts', label: `Thoughts (${thoughts.length})`, icon: MessageSquare },
              { id: 'users', label: `Users (${usersList.length})`, icon: Users },
              { id: 'security', label: 'Security & Password', icon: Lock },
            ].map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 18px',
                    fontSize: '14px',
                    fontWeight: 600,
                    borderBottom: isActive ? '2.5px solid var(--color-accent)' : '2.5px solid transparent',
                    color: isActive ? 'var(--color-accent)' : 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                    background: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <IconComp size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search bar inside admin tabs */}
          {activeTab !== 'overview' && (
            <div style={{ marginBottom: '20px', maxWidth: '400px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '38px', height: '40px', fontSize: '13px' }}
              />
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              {/* Field Distribution */}
              <div className="card">
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
                  Distribution by Academic Field
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {fieldBreakdown.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No questions logged yet</div>
                  ) : (
                    fieldBreakdown.map((item) => (
                      <div key={item.field} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.field}</span>
                        <span style={{ 
                          padding: '2px 8px', 
                          borderRadius: '12px', 
                          background: 'var(--bg-subtle)', 
                          fontWeight: 700,
                          fontSize: '12px',
                          color: 'var(--color-primary)' 
                        }}>
                          {item.count} {item.count === 1 ? 'question' : 'questions'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Administrative Policy & Guarantees */}
              <div className="card" style={{ background: 'var(--bg-subtle)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={18} style={{ color: 'var(--color-primary)' }} />
                  <span>Platform Deletion Policy</span>
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '12px' }}>
                  In accordance with the platform specifications:
                </p>
                <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li>Normal users can post questions and solutions, but <strong>cannot delete</strong> any content once submitted.</li>
                  <li><strong>Only the Single Administrator</strong> account possesses full authority to purge questions, solutions, or comments.</li>
                  <li>Deleting a question automatically cascades and purges all of its answers, discussions, and attachments from storage.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: QUESTIONS MANAGEMENT */}
          {activeTab === 'questions' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-light)' }}>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Question Title</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Field</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Author</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Solutions</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Date</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700, textAlign: 'right' }}>Admin Control</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuestions.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No questions matching query
                        </td>
                      </tr>
                    ) : (
                      filteredQuestions.map((q) => (
                        <tr key={q.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: '14px 20px', fontWeight: 600, maxWidth: '280px' }}>
                            <Link href={`/question/${q.id}`} style={{ color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <span>{q.title}</span>
                              <ExternalLink size={13} style={{ color: 'var(--text-muted)' }} />
                            </Link>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <span className={`field-badge badge-${q.field.replace(/\s+/g, '')}`}>
                              {q.field}
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>
                            {q.user_name}
                          </td>
                          <td style={{ padding: '14px 20px', fontWeight: 600 }}>
                            {q.solutions_count}
                          </td>
                          <td style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-muted)' }}>
                            {new Date(q.created_at).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="btn btn-danger-outline btn-sm"
                              title="Delete Question (Admin Only)"
                            >
                              <Trash2 size={13} />
                              <span>Delete</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: SOLUTIONS MANAGEMENT */}
          {activeTab === 'solutions' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-light)' }}>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Solution Excerpt</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Question Title</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Author</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Status</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700, textAlign: 'right' }}>Admin Control</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSolutions.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No solutions found
                        </td>
                      </tr>
                    ) : (
                      filteredSolutions.map((s) => (
                        <tr key={s.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: '14px 20px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {s.content}
                          </td>
                          <td style={{ padding: '14px 20px', color: 'var(--text-secondary)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <Link href={`/question/${s.question_id}`} style={{ textDecoration: 'underline' }}>
                              {s.question_title || 'View Question'}
                            </Link>
                          </td>
                          <td style={{ padding: '14px 20px', fontWeight: 600 }}>
                            {s.user_name}
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <span style={{ 
                              padding: '2px 8px', 
                              borderRadius: '10px', 
                              fontSize: '11px', 
                              fontWeight: 700,
                              background: s.is_verified === 1 ? 'var(--color-success-bg)' : 'var(--bg-subtle)',
                              color: s.is_verified === 1 ? 'var(--color-success)' : 'var(--text-muted)'
                            }}>
                              {s.is_verified === 1 ? 'Verified' : 'Unverified'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                            <button
                              onClick={() => handleDeleteSolution(s.id)}
                              className="btn btn-danger-outline btn-sm"
                            >
                              <Trash2 size={13} />
                              <span>Delete</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: THOUGHTS / COMMENTS MANAGEMENT */}
          {activeTab === 'thoughts' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-light)' }}>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Thought Content</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Question Title</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Author</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Date</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700, textAlign: 'right' }}>Admin Control</th>
                    </tr>
                  </thead>
                  <tbody>
                    {thoughts.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No community thoughts found
                        </td>
                      </tr>
                    ) : (
                      thoughts.map((t) => (
                        <tr key={t.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: '14px 20px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {t.content}
                          </td>
                          <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>
                            <Link href={`/question/${t.question_id}`} style={{ textDecoration: 'underline' }}>
                              {t.question_title || 'View Question'}
                            </Link>
                          </td>
                          <td style={{ padding: '14px 20px', fontWeight: 600 }}>
                            {t.user_name}
                          </td>
                          <td style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-muted)' }}>
                            {new Date(t.created_at).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                            <button
                              onClick={() => handleDeleteThought(t.id)}
                              className="btn btn-danger-outline btn-sm"
                            >
                              <Trash2 size={13} />
                              <span>Delete</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-light)' }}>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>User ID</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Full Name</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Role</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Field Interest</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Questions</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700 }}>Solutions</th>
                      <th style={{ padding: '14px 20px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontWeight: 700 }}>
                          @{u.id}
                        </td>
                        <td style={{ padding: '14px 20px', fontWeight: 600 }}>
                          {u.name}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ 
                            padding: '3px 8px', 
                            borderRadius: '12px', 
                            fontSize: '11px', 
                            fontWeight: 700,
                            background: u.role === 'admin' ? 'var(--color-danger-bg)' : 'var(--bg-subtle)',
                            color: u.role === 'admin' ? 'var(--color-danger)' : 'var(--text-secondary)'
                          }}>
                            {u.role === 'admin' ? 'ADMIN' : 'STUDENT'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>
                          {u.field_of_interest || 'General'}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          {u.questions_count}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          {u.solutions_count}
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          {u.id !== 'admin' && (
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button
                                onClick={() => handleToggleRole(u.id, u.role)}
                                className="btn btn-secondary btn-sm"
                              >
                                {u.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="btn btn-danger-outline btn-sm"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: SECURITY / CHANGE PASSWORD */}
          {activeTab === 'security' && (
            <div className="card" style={{ maxWidth: '580px', margin: '0 auto', padding: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'var(--color-primary-subtle)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <KeyRound size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    Change Admin Password
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                    Update the root administrator password in your Supabase database.
                  </p>
                </div>
              </div>

              {pwdError && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-danger-bg)',
                  color: 'var(--color-danger)',
                  fontSize: '13px',
                  fontWeight: 500,
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertTriangle size={16} />
                  <span>{pwdError}</span>
                </div>
              )}

              {pwdSuccess && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(34, 197, 94, 0.1)',
                  color: '#16a34a',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CheckCircle2 size={16} />
                  <span>{pwdSuccess}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password (default: admin)"
                    required
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter strong new password"
                    required
                    minLength={4}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    minLength={4}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-light)',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  marginTop: '4px'
                }}>
                  <Lock size={15} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span>
                    This modifies the bcrypt hash in your connected Supabase PostgreSQL database immediately. Quick demo logins have been removed, so please ensure you remember your new password.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="btn btn-primary"
                  style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <KeyRound size={16} />
                  <span>{pwdLoading ? 'Updating Password...' : 'Update Admin Password'}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
