'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import {
  ShieldAlert,
  Search,
  Plus,
  Upload,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  AlertTriangle,
  FileText,
  Lock,
} from 'lucide-react';
import { getApiBase } from '@/lib/apiConfig';

export default function AdminPage() {
  const API_URL = getApiBase();
  const [adminToken, setAdminToken] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // Tabs
  const [activeTab, setActiveTab] = useState<'tracks' | 'audit'>('tracks');

  // Track list
  const [tracks, setTracks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // New Track Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    artists: '',
    acceptedAnswers: '',
    languages: 'English',
    categories: 'Bollywood',
    era: '2020s',
    difficulty: 2,
    rightsHolder: '',
    licenseType: 'Direct Permission',
    evidenceReference: '',
    commercialUseAllowed: false,
    gameplayUseAllowed: true,
  });
  const [createError, setCreateError] = useState('');

  // Audio Upload Modal
  const [uploadTrackId, setUploadTrackId] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');

  // Audio Preview Player
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [previewingTrackId, setPreviewingTrackId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    const savedToken = sessionStorage.getItem('tune_clash_admin_token');
    if (savedToken) {
      setAdminToken(savedToken);
      loadTracks(savedToken);
      loadAuditLogs(savedToken);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error?.message || 'Login failed.');
        return;
      }
      setAdminToken(data.token);
      sessionStorage.setItem('tune_clash_admin_token', data.token);
      loadTracks(data.token);
      loadAuditLogs(data.token);
    } catch (err: any) {
      setLoginError('Could not connect to server.');
    }
  };

  const loadTracks = async (token: string) => {
    setIsLoading(true);
    try {
      const url = new URL(`${API_URL}/api/admin/tracks`);
      if (searchQuery) url.searchParams.set('search', searchQuery);
      if (statusFilter) url.searchParams.set('status', statusFilter);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTracks(data.tracks || []);
      }
    } catch (err) {}
    setIsLoading(false);
  };

  const loadAuditLogs = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setAuditLogs(data.logs || []);
      }
    } catch (err) {}
  };

  const handleCreateTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    try {
      const payload = {
        title: formData.title,
        artists: formData.artists.split(',').map((s) => s.trim()).filter(Boolean),
        acceptedAnswers: formData.acceptedAnswers.split(',').map((s) => s.trim()).filter(Boolean),
        languages: [formData.languages],
        categories: [formData.categories],
        era: formData.era,
        difficulty: Number(formData.difficulty),
        rights: {
          rightsHolderOrSubmitter: formData.rightsHolder,
          licenseType: formData.licenseType,
          allowedUses: formData.gameplayUseAllowed ? ['gameplay'] : [],
          territories: ['worldwide'],
          commercialUseAllowed: formData.commercialUseAllowed,
          evidenceReference: formData.evidenceReference,
        },
      };

      const res = await fetch(`${API_URL}/api/admin/tracks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error?.message || 'Failed to create track.');
        return;
      }

      setIsCreateModalOpen(false);
      loadTracks(adminToken);
      loadAuditLogs(adminToken);
    } catch (err: any) {
      setCreateError('Network error creating track.');
    }
  };

  const handleUploadAudio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTrackId || !audioFile) return;

    setUploadError('');
    const form = new FormData();
    form.append('audio', audioFile);

    try {
      const res = await fetch(`${API_URL}/api/admin/tracks/${uploadTrackId}/audio`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error?.message || 'Failed to upload audio.');
        return;
      }

      setUploadTrackId(null);
      setAudioFile(null);
      loadTracks(adminToken);
      loadAuditLogs(adminToken);
    } catch (err: any) {
      setUploadError('Network error uploading audio.');
    }
  };

  const handleApprove = async (trackId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/tracks/${trackId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error?.message || 'Approval failed.');
        return;
      }
      loadTracks(adminToken);
      loadAuditLogs(adminToken);
    } catch (err) {}
  };

  const handleDisable = async (trackId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/tracks/${trackId}/disable`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      loadTracks(adminToken);
      loadAuditLogs(adminToken);
    } catch (err) {}
  };

  const togglePreviewAudio = (track: any) => {
    const storageKey = track.audioAssetId?.storageKey;
    if (!storageKey) return;

    if (previewingTrackId === track._id) {
      audioElement?.pause();
      setPreviewingTrackId(null);
      return;
    }

    if (audioElement) {
      audioElement.pause();
    }

    const audio = new Audio(`${API_URL}/api/assets/audio/${storageKey}`);
    audio.play();
    audio.onended = () => setPreviewingTrackId(null);
    setAudioElement(audio);
    setPreviewingTrackId(track._id);
  };

  if (!adminToken) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-surface rounded-card p-6 max-w-sm w-full border border-border shadow-md">
            <div className="w-10 h-10 rounded-full bg-accent/20 text-accent flex items-center justify-center mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-text-main mb-1">Admin Catalog Login</h1>
            <p className="text-xs text-text-secondary mb-5">
              Enter the administrator password to manage catalog songs and licensing.
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-main mb-1">
                  Admin Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter admin password..."
                  className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-md text-sm text-text-main"
                />
              </div>

              {loginError && <p className="text-xs text-danger font-medium">{loginError}</p>}

              <button
                type="submit"
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-surface font-semibold text-sm rounded-md shadow-xs transition-colors"
              >
                Access Catalog
              </button>
            </form>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border mb-6">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-text-main">Catalog & Rights Administration</h1>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Demo and licensed tracks management with auditable permission verification.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('tracks')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                activeTab === 'tracks' ? 'bg-primary text-surface' : 'bg-surface-muted text-text-secondary'
              }`}
            >
              Tracks ({tracks.length})
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                activeTab === 'audit' ? 'bg-primary text-surface' : 'bg-surface-muted text-text-secondary'
              }`}
            >
              Audit Log ({auditLogs.length})
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-surface text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Track</span>
            </button>
          </div>
        </div>

        {/* Warning Banner required by PRD 3.3 G */}
        <div className="bg-accent-light border border-accent/40 rounded-card p-3 mb-6 flex items-start gap-2.5 text-xs text-text-main">
          <AlertTriangle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <span>
            <strong>Legal Warning:</strong> Filling in license fields is an administrative record and does not independently prove ownership or legal permission. Only upload tracks you have explicit lawful rights to use.
          </span>
        </div>

        {/* TAB 1: TRACKS */}
        {activeTab === 'tracks' && (
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-text-secondary absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadTracks(adminToken)}
                  placeholder="Search tracks or artists..."
                  className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-md text-xs text-text-main"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setTimeout(() => loadTracks(adminToken), 50);
                }}
                className="p-2 bg-surface border border-border rounded-md text-xs text-text-main"
              >
                <option value="">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="pending_review">Pending Review</option>
                <option value="draft">Draft</option>
                <option value="disabled">Disabled</option>
              </select>

              <button
                onClick={() => loadTracks(adminToken)}
                className="px-3 py-2 bg-surface-muted hover:bg-border text-text-main font-semibold text-xs rounded-md"
              >
                Refresh
              </button>
            </div>

            {/* Table */}
            <div className="bg-surface border border-border rounded-card overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-muted border-b border-border text-text-secondary font-semibold">
                    <tr>
                      <th className="py-3 px-4">Title / Artists</th>
                      <th className="py-3 px-4">Languages / Category</th>
                      <th className="py-3 px-4">Audio</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {tracks.map((t) => (
                      <tr key={t._id} className="hover:bg-surface-muted/40">
                        <td className="py-3 px-4">
                          <p className="font-bold text-text-main">{t.title}</p>
                          <p className="text-[11px] text-text-secondary">{t.artists?.join(', ')}</p>
                          {t.acceptedAnswers?.length > 0 && (
                            <p className="text-[10px] text-teal mt-0.5">Aliases: {t.acceptedAnswers.join(' • ')}</p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-text-main">{t.languages?.join(', ')}</span>
                          <span className="text-text-secondary block text-[11px]">{t.categories?.join(', ')} ({t.era})</span>
                        </td>
                        <td className="py-3 px-4">
                          {t.audioAssetId ? (
                            <button
                              onClick={() => togglePreviewAudio(t)}
                              className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                            >
                              {previewingTrackId === t._id ? (
                                <>
                                  <Pause className="w-3.5 h-3.5" /> Stop
                                </>
                              ) : (
                                <>
                                  <Play className="w-3.5 h-3.5" /> Preview
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => setUploadTrackId(t._id)}
                              className="inline-flex items-center gap-1 text-danger hover:underline"
                            >
                              <Upload className="w-3.5 h-3.5" /> Upload Audio
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              t.status === 'approved'
                                ? 'bg-positive-light text-positive'
                                : t.status === 'pending_review'
                                ? 'bg-accent-light text-accent'
                                : 'bg-surface-muted text-text-secondary'
                            }`}
                          >
                            {t.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          {t.status !== 'approved' && (
                            <button
                              onClick={() => handleApprove(t._id)}
                              className="px-2 py-1 bg-positive hover:bg-positive/90 text-surface rounded text-[11px] font-semibold"
                            >
                              Approve
                            </button>
                          )}
                          {t.status === 'approved' && (
                            <button
                              onClick={() => handleDisable(t._id)}
                              className="px-2 py-1 bg-surface-muted hover:bg-border text-danger rounded text-[11px] font-semibold"
                            >
                              Disable
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="bg-surface border border-border rounded-card p-4 shadow-xs">
            <h3 className="font-bold text-sm text-text-main mb-3">Audit Logs</h3>
            <div className="divide-y divide-border text-xs">
              {auditLogs.map((log) => (
                <div key={log._id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-text-main">{log.action}</span>
                    <span className="text-text-secondary ml-2">by {log.actor}</span>
                    {log.details && (
                      <p className="text-[11px] text-text-secondary font-mono mt-0.5">
                        {JSON.stringify(log.details)}
                      </p>
                    )}
                  </div>
                  <span className="text-text-secondary text-[11px] shrink-0">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Create Track Modal */}
      {isCreateModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-text-main/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-surface rounded-card p-6 max-w-lg w-full shadow-lg border border-border my-8 animate-in fade-in">
            <h2 className="text-lg font-bold text-text-main mb-3">Add Track with Rights Review</h2>

            <form onSubmit={handleCreateTrack} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-text-main mb-1">Song Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Neon Horizon"
                  className="w-full p-2 bg-surface border border-border rounded text-text-main"
                />
              </div>

              <div>
                <label className="block font-semibold text-text-main mb-1">Artists (comma-separated) *</label>
                <input
                  type="text"
                  required
                  value={formData.artists}
                  onChange={(e) => setFormData({ ...formData, artists: e.target.value })}
                  placeholder="e.g. Artist One, Artist Two"
                  className="w-full p-2 bg-surface border border-border rounded text-text-main"
                />
              </div>

              <div>
                <label className="block font-semibold text-text-main mb-1">Accepted Aliases / Transliterations</label>
                <input
                  type="text"
                  value={formData.acceptedAnswers}
                  onChange={(e) => setFormData({ ...formData, acceptedAnswers: e.target.value })}
                  placeholder="e.g. Neon Horizon Demo, निऑन होराइजन"
                  className="w-full p-2 bg-surface border border-border rounded text-text-main"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-text-main mb-1">Language</label>
                  <select
                    value={formData.languages}
                    onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                    className="w-full p-2 bg-surface border border-border rounded text-text-main"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Marathi">Marathi</option>
                    <option value="Regional">Regional</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-text-main mb-1">Category</label>
                  <select
                    value={formData.categories}
                    onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                    className="w-full p-2 bg-surface border border-border rounded text-text-main"
                  >
                    <option value="Bollywood">Bollywood</option>
                    <option value="Hollywood">Hollywood</option>
                    <option value="Indie">Indie</option>
                    <option value="Regional">Regional</option>
                  </select>
                </div>
              </div>

              {/* Rights Section */}
              <div className="p-3 bg-surface-muted rounded border border-border space-y-2 mt-3">
                <span className="font-bold text-text-main block">Mandatory Rights & License Info</span>

                <div>
                  <label className="block font-semibold text-text-main mb-1">Rights Holder / Submitter *</label>
                  <input
                    type="text"
                    required
                    value={formData.rightsHolder}
                    onChange={(e) => setFormData({ ...formData, rightsHolder: e.target.value })}
                    placeholder="e.g. Independent Producer"
                    className="w-full p-2 bg-surface border border-border rounded text-text-main"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-text-main mb-1">Evidence / Documentation Reference *</label>
                  <input
                    type="text"
                    required
                    value={formData.evidenceReference}
                    onChange={(e) => setFormData({ ...formData, evidenceReference: e.target.value })}
                    placeholder="e.g. License Agreement Ref #987 or Original Synth"
                    className="w-full p-2 bg-surface border border-border rounded text-text-main"
                  />
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.gameplayUseAllowed}
                      onChange={(e) => setFormData({ ...formData, gameplayUseAllowed: e.target.checked })}
                      className="rounded text-primary"
                    />
                    <span>Gameplay permitted</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.commercialUseAllowed}
                      onChange={(e) => setFormData({ ...formData, commercialUseAllowed: e.target.checked })}
                      className="rounded text-primary"
                    />
                    <span>Commercial use allowed</span>
                  </label>
                </div>
              </div>

              {createError && <p className="text-xs text-danger font-medium">{createError}</p>}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-1/2 py-2 bg-surface-muted hover:bg-border text-text-main font-semibold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-primary hover:bg-primary-hover text-surface font-semibold rounded shadow-xs"
                >
                  Save Track
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audio Upload Modal */}
      {uploadTrackId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-text-main/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-surface rounded-card p-6 max-w-sm w-full shadow-lg border border-border">
            <h2 className="text-base font-bold text-text-main mb-1">Upload Audio File</h2>
            <p className="text-xs text-text-secondary mb-4">WAV, MP3, OGG, or WebM up to 15MB.</p>

            <form onSubmit={handleUploadAudio} className="space-y-4">
              <input
                type="file"
                accept="audio/*"
                required
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-text-main file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-primary file:text-surface file:font-semibold"
              />

              {uploadError && <p className="text-xs text-danger font-medium">{uploadError}</p>}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUploadTrackId(null)}
                  className="w-1/2 py-2 bg-surface-muted hover:bg-border text-text-main text-xs font-semibold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!audioFile}
                  className="w-1/2 py-2 bg-primary hover:bg-primary-hover text-surface text-xs font-semibold rounded shadow-xs disabled:opacity-50"
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
