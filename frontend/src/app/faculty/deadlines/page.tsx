'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, SubmissionDeadline } from '@/lib/api';
import { useSocket } from '@/lib/useSocket';
import {
  FileCheck2,
  Plus,
  Calendar,
  Clock,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  BookOpen,
  Users,
  Timer,
  AlertCircle,
  X,
  FileText
} from 'lucide-react';

export default function FacultyDeadlinesPage() {
  const queryClient = useQueryClient();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [finalizeModalDeadline, setFinalizeModalDeadline] = useState<SubmissionDeadline | null>(null);
  const [editModalDeadline, setEditModalDeadline] = useState<SubmissionDeadline | null>(null);

  // Form states
  const [subjectId, setSubjectId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Edit / Extension form state
  const [editDueDate, setEditDueDate] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [extendReason, setExtendReason] = useState('');

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // Real-time synchronization
  useSocket({
    'deadline:finalized': () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-deadlines'] });
    },
    'deadline:updated': () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-deadlines'] });
    },
  });

  const { data: meta } = useQuery({
    queryKey: ['submissions-meta'],
    queryFn: () => api.submissions.getMeta(),
  });

  const { data: deadlines, isLoading } = useQuery<SubmissionDeadline[]>({
    queryKey: ['faculty-deadlines'],
    queryFn: () => api.submissions.listFaculty(),
  });

  const createMutation = useMutation({
    mutationFn: (data: {
      subjectId: string;
      sectionId: string;
      title: string;
      description?: string | null;
      dueDate: string;
    }) => api.submissions.create(data),
    onSuccess: (newDeadline) => {
      queryClient.invalidateQueries({ queryKey: ['faculty-deadlines'] });
      setCreateModalOpen(false);
      resetCreateForm();
      showToast(`Draft "${newDeadline.title}" created successfully.`);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create submission deadline.');
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: (id: string) => api.submissions.finalize(id),
    onSuccess: (finalized) => {
      queryClient.invalidateQueries({ queryKey: ['faculty-deadlines'] });
      setFinalizeModalDeadline(null);
      showToast(`Deadline for "${finalized.title}" is now locked & published to students!`);
    },
    onError: (err: any) => {
      showToast(`Error: ${err.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.submissions.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-deadlines'] });
      setEditModalDeadline(null);
      showToast('Deadline updated successfully.');
    },
    onError: (err: any) => {
      showToast(`Error: ${err.message}`);
    },
  });

  const resetCreateForm = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setFormError(null);
    if (meta?.sections?.length) setSectionId(meta.sections[0].id);
    if (meta?.subjects?.length) setSubjectId(meta.subjects[0].id);
  };

  const handleOpenCreate = () => {
    resetCreateForm();
    if (meta?.sections?.length) setSectionId(meta.sections[0].id);
    if (meta?.subjects?.length) setSubjectId(meta.subjects[0].id);
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (deadline: SubmissionDeadline) => {
    setEditModalDeadline(deadline);
    setEditTitle(deadline.title);
    setEditDescription(deadline.description || '');
    // format to local datetime string for input
    const d = new Date(deadline.dueDate);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    setEditDueDate(localISOTime);
    setExtendReason('');
  };

  const drafts = (deadlines || []).filter((d) => !d.isFinalized);
  const finalized = (deadlines || []).filter((d) => d.isFinalized);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#1B1C19] text-white text-xs font-semibold shadow-2xl animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#EAE8E3] to-[#F0EEE9] dark:from-[#25262B] dark:to-[#1C1D21] border border-[#CFC5B8]/60 dark:border-white/10 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#6C5939]/10 dark:bg-white/10 text-[#6C5939] dark:text-[#D4AF37]">
                <FileCheck2 className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-[#1B1C19] dark:text-[#E8EAED]">
                Submission Deadlines & Projects
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#7E766B] dark:text-white/60 max-w-2xl">
              Set assignment, mini-project, and lab submission milestones. Draft dates can be freely scheduled, while finalizing locks the official deadline and synchronizes immediately to the student portal.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#6C5939] hover:bg-[#86724F] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Set New Deadline</span>
          </button>
        </div>
      </div>

      {/* Overview Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white/70 dark:bg-[#25262B]/70 border border-[#CFC5B8]/40 dark:border-white/10 backdrop-blur-md">
          <div className="flex items-center justify-between text-[#7E766B] dark:text-white/60 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Active Finalized</span>
            <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-[#1B1C19] dark:text-[#E8EAED]">
            {finalized.filter((f) => f.status !== 'EXPIRED').length}
          </div>
          <p className="text-[11px] text-[#7E766B] dark:text-white/50 mt-1">Locked and live on student timeline</p>
        </div>

        <div className="p-5 rounded-2xl bg-white/70 dark:bg-[#25262B]/70 border border-[#CFC5B8]/40 dark:border-white/10 backdrop-blur-md">
          <div className="flex items-center justify-between text-[#7E766B] dark:text-white/60 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Draft / In Progress</span>
            <Unlock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-[#1B1C19] dark:text-[#E8EAED]">
            {drafts.length}
          </div>
          <p className="text-[11px] text-[#7E766B] dark:text-white/50 mt-1">Pending review & finalization</p>
        </div>

        <div className="p-5 rounded-2xl bg-white/70 dark:bg-[#25262B]/70 border border-[#CFC5B8]/40 dark:border-white/10 backdrop-blur-md">
          <div className="flex items-center justify-between text-[#7E766B] dark:text-white/60 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Archived / Past Due</span>
            <Timer className="w-4 h-4 text-[#7E766B] dark:text-white/60" />
          </div>
          <div className="text-2xl font-bold text-[#1B1C19] dark:text-[#E8EAED]">
            {finalized.filter((f) => f.status === 'EXPIRED').length}
          </div>
          <p className="text-[11px] text-[#7E766B] dark:text-white/50 mt-1">Submission window closed</p>
        </div>
      </div>

      {/* Main Grid: Drafts vs Finalized */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Drafts & Unfinalized */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#1B1C19] dark:text-[#E8EAED] flex items-center gap-2">
              <Unlock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Draft Submissions ({drafts.length})</span>
            </h2>
            <span className="text-[11px] text-[#7E766B] dark:text-white/40">Visible to you only</span>
          </div>

          {drafts.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white/40 dark:bg-white/5 border border-dashed border-[#CFC5B8]/50 dark:border-white/10">
              <FileText className="w-8 h-8 mx-auto text-[#7E766B]/60 dark:text-white/30 mb-2" />
              <p className="text-xs font-semibold text-[#1B1C19] dark:text-[#E8EAED]">No active draft deadlines</p>
              <p className="text-[11px] text-[#7E766B] dark:text-white/50 mt-0.5">Click "Set New Deadline" to draft an assignment timeline.</p>
            </div>
          ) : (
            drafts.map((d) => (
              <div
                key={d.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#25262B] border border-[#CFC5B8]/60 dark:border-white/10 shadow-sm space-y-3 transition-all hover:border-[#6C5939]/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                        Draft / Editable
                      </span>
                      <span className="text-xs font-bold text-[#6C5939] dark:text-[#D4AF37]">
                        {d.subject?.code}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-[#1B1C19] dark:text-[#E8EAED] mt-1.5">{d.title}</h3>
                  </div>

                  <span className="text-[11px] font-semibold text-[#7E766B] dark:text-white/50 px-2 py-1 rounded-lg bg-[#EAE8E3]/60 dark:bg-white/5">
                    {d.section?.name || 'CSE-3F'}
                  </span>
                </div>

                {d.description && (
                  <p className="text-xs text-[#7E766B] dark:text-white/60 line-clamp-2">{d.description}</p>
                )}

                <div className="pt-2 border-t border-[#CFC5B8]/30 dark:border-white/10 flex items-center justify-between text-xs text-[#7E766B] dark:text-white/60">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Due: {new Date(d.dueDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(d)}
                      className="px-3 py-1.5 rounded-xl border border-[#CFC5B8]/60 dark:border-white/10 hover:bg-[#EAE8E3] dark:hover:bg-white/5 text-[11px] font-bold text-[#1B1C19] dark:text-[#E8EAED]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setFinalizeModalDeadline(d)}
                      className="px-3 py-1.5 rounded-xl bg-[#6C5939] hover:bg-[#86724F] text-white text-[11px] font-bold flex items-center gap-1 shadow-sm"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Finalize</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column: Finalized & Locked */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#1B1C19] dark:text-[#E8EAED] flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Finalized Official Deadlines ({finalized.length})</span>
            </h2>
            <span className="text-[11px] text-[#7E766B] dark:text-white/40">Synchronized with Student Portal</span>
          </div>

          {finalized.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white/40 dark:bg-white/5 border border-dashed border-[#CFC5B8]/50 dark:border-white/10">
              <Lock className="w-8 h-8 mx-auto text-[#7E766B]/60 dark:text-white/30 mb-2" />
              <p className="text-xs font-semibold text-[#1B1C19] dark:text-[#E8EAED]">No finalized deadlines yet</p>
              <p className="text-[11px] text-[#7E766B] dark:text-white/50 mt-0.5">Finalize a draft to broadcast the official locked deadline.</p>
            </div>
          ) : (
            finalized.map((d) => {
              const isPast = d.status === 'EXPIRED';
              return (
                <div
                  key={d.id}
                  className={`p-5 rounded-2xl bg-white dark:bg-[#25262B] border shadow-sm space-y-3 transition-all ${
                    isPast
                      ? 'border-[#CFC5B8]/40 dark:border-white/5 opacity-70'
                      : 'border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-500/[0.02]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            isPast
                              ? 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/50'
                              : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {isPast ? 'Past Due' : 'Finalized & Locked'}
                        </span>
                        <span className="text-xs font-bold text-[#6C5939] dark:text-[#D4AF37]">
                          {d.subject?.code}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-[#1B1C19] dark:text-[#E8EAED] mt-1.5">{d.title}</h3>
                    </div>

                    <span className="text-[11px] font-semibold text-[#7E766B] dark:text-white/50 px-2 py-1 rounded-lg bg-[#EAE8E3]/60 dark:bg-white/5">
                      {d.section?.name || 'CSE-3F'}
                    </span>
                  </div>

                  {d.description && (
                    <p className="text-xs text-[#7E766B] dark:text-white/60 line-clamp-2">{d.description}</p>
                  )}

                  <div className="pt-2 border-t border-[#CFC5B8]/30 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#7E766B] dark:text-white/60">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-bold text-[#1B1C19] dark:text-[#E8EAED]">
                        <Calendar className="w-3.5 h-3.5 text-[#6C5939] dark:text-[#D4AF37]" />
                        <span>Deadline: {new Date(d.dueDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                      {d.finalizedAt && (
                        <p className="text-[10px] text-[#7E766B] dark:text-white/40">
                          Finalized on {new Date(d.finalizedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenEdit(d)}
                      className="px-3 py-1.5 rounded-xl border border-[#CFC5B8]/60 dark:border-white/10 hover:bg-[#EAE8E3] dark:hover:bg-white/5 text-[11px] font-bold text-[#6C5939] dark:text-[#D4AF37] self-end sm:self-auto"
                    >
                      Extend Deadline
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── CREATE MODAL ────────────────────────────────────────────── */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#FCF9F4] dark:bg-[#1C1D21] border border-[#CFC5B8]/60 dark:border-white/10 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#CFC5B8]/30 dark:border-white/10">
              <h3 className="font-bold text-base text-[#1B1C19] dark:text-[#E8EAED]">Create Submission Deadline</h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-xl text-[#7E766B] hover:bg-[#EAE8E3] dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setFormError(null);
                if (!dueDate) {
                  setFormError('Please select a due date & time.');
                  return;
                }
                createMutation.mutate({
                  subjectId,
                  sectionId,
                  title,
                  description,
                  dueDate: new Date(dueDate).toISOString(),
                });
              }}
              className="space-y-3.5 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#7E766B] dark:text-white/60 mb-1">Subject</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#CFC5B8]/60 dark:border-white/10 bg-white dark:bg-[#25262B] text-[#1B1C19] dark:text-[#E8EAED]"
                    required
                  >
                    {meta?.subjects
                      ?.filter((s) => !['PROCTOR', 'NSS_PE'].includes(s.code))
                      ?.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.code} - {s.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#7E766B] dark:text-white/60 mb-1">Section</label>
                  <select
                    value={sectionId}
                    onChange={(e) => setSectionId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#CFC5B8]/60 dark:border-white/10 bg-white dark:bg-[#25262B] text-[#1B1C19] dark:text-[#E8EAED]"
                    required
                  >
                    {meta?.sections?.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name} ({sec.department} Sem {sec.semester})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#7E766B] dark:text-white/60 mb-1">Title / Milestone</label>
                <input
                  type="text"
                  placeholder="e.g. Mini-Project Phase 1 Submission"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#CFC5B8]/60 dark:border-white/10 bg-white dark:bg-[#25262B] text-[#1B1C19] dark:text-[#E8EAED]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#7E766B] dark:text-white/60 mb-1">Instructions / Description</label>
                <textarea
                  placeholder="Instructions for students (PDF format, GitHub link, team details, etc.)..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#CFC5B8]/60 dark:border-white/10 bg-white dark:bg-[#25262B] text-[#1B1C19] dark:text-[#E8EAED]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#7E766B] dark:text-white/60 mb-1">Submission Date & Time</label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#CFC5B8]/60 dark:border-white/10 bg-white dark:bg-[#25262B] text-[#1B1C19] dark:text-[#E8EAED]"
                  required
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#CFC5B8]/30 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#CFC5B8]/60 dark:border-white/10 font-bold text-[#7E766B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-[#6C5939] hover:bg-[#86724F] text-white font-bold"
                >
                  {createMutation.isPending ? 'Saving...' : 'Save as Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── FINALIZE CONFIRMATION MODAL ─────────────────────────────── */}
      {finalizeModalDeadline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#FCF9F4] dark:bg-[#1C1D21] border border-[#CFC5B8]/60 dark:border-white/10 p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-[#1B1C19] dark:text-[#E8EAED]">
                Finalize & Lock Submission Date?
              </h3>
              <p className="text-xs text-[#7E766B] dark:text-white/60">
                Finalizing locks the deadline for <span className="font-bold text-[#1B1C19] dark:text-[#E8EAED]">"{finalizeModalDeadline.title}"</span>. It will be immediately published to all enrolled students with live countdown timers.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#EAE8E3]/60 dark:bg-white/5 text-xs text-[#1B1C19] dark:text-[#E8EAED] space-y-1">
              <div><span className="text-[#7E766B] dark:text-white/50">Subject:</span> {finalizeModalDeadline.subject?.code} - {finalizeModalDeadline.subject?.name}</div>
              <div><span className="text-[#7E766B] dark:text-white/50">Section:</span> {finalizeModalDeadline.section?.name}</div>
              <div>
                <span className="text-[#7E766B] dark:text-white/50">Official Due:</span>{' '}
                <span className="font-bold text-[#6C5939] dark:text-[#D4AF37]">
                  {new Date(finalizeModalDeadline.dueDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setFinalizeModalDeadline(null)}
                className="px-4 py-2.5 rounded-xl border border-[#CFC5B8]/60 dark:border-white/10 text-xs font-bold text-[#7E766B]"
              >
                Keep as Draft
              </button>
              <button
                onClick={() => finalizeMutation.mutate(finalizeModalDeadline.id)}
                disabled={finalizeMutation.isPending}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
              >
                {finalizeMutation.isPending ? 'Publishing...' : 'Yes, Finalize Deadline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT / EXTEND MODAL ───────────────────────────────────────── */}
      {editModalDeadline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#FCF9F4] dark:bg-[#1C1D21] border border-[#CFC5B8]/60 dark:border-white/10 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#CFC5B8]/30 dark:border-white/10">
              <h3 className="font-bold text-base text-[#1B1C19] dark:text-[#E8EAED]">
                {editModalDeadline.isFinalized ? 'Extend Finalized Deadline' : 'Edit Draft Deadline'}
              </h3>
              <button
                onClick={() => setEditModalDeadline(null)}
                className="p-1 rounded-xl text-[#7E766B] hover:bg-[#EAE8E3] dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editModalDeadline.isFinalized && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>This deadline is finalized. Modifying the date will broadcast an updated schedule notice to students.</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate({
                  id: editModalDeadline.id,
                  data: {
                    title: editTitle,
                    description: editDescription,
                    dueDate: new Date(editDueDate).toISOString(),
                    extendReason,
                  },
                });
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-bold text-[#7E766B] dark:text-white/60 mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#CFC5B8]/60 dark:border-white/10 bg-white dark:bg-[#25262B] text-[#1B1C19] dark:text-[#E8EAED]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#7E766B] dark:text-white/60 mb-1">Instructions / Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#CFC5B8]/60 dark:border-white/10 bg-white dark:bg-[#25262B] text-[#1B1C19] dark:text-[#E8EAED]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#7E766B] dark:text-white/60 mb-1">Due Date & Time</label>
                <input
                  type="datetime-local"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#CFC5B8]/60 dark:border-white/10 bg-white dark:bg-[#25262B] text-[#1B1C19] dark:text-[#E8EAED]"
                  required
                />
              </div>

              {editModalDeadline.isFinalized && (
                <div>
                  <label className="block font-bold text-[#7E766B] dark:text-white/60 mb-1">Reason for Extension (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Extended by 48h upon class request"
                    value={extendReason}
                    onChange={(e) => setExtendReason(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#CFC5B8]/60 dark:border-white/10 bg-white dark:bg-[#25262B] text-[#1B1C19] dark:text-[#E8EAED]"
                  />
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#CFC5B8]/30 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setEditModalDeadline(null)}
                  className="px-4 py-2.5 rounded-xl border border-[#CFC5B8]/60 dark:border-white/10 font-bold text-[#7E766B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-[#6C5939] hover:bg-[#86724F] text-white font-bold"
                >
                  {updateMutation.isPending ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
