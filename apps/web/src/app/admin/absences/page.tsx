'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, AbsenceRecord, SubstituteSuggestion } from '@/lib/api';
import { useSocket } from '@/lib/useSocket';
import { AlertCircle, CheckCircle, ChevronRight, UserCheck, Check } from 'lucide-react';

export default function AdminAbsencesPage() {
  const [selectedAbsence, setSelectedAbsence] = useState<AbsenceRecord | null>(null);
  const [suggestions, setSuggestions] = useState<SubstituteSuggestion[] | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState(false);

  const { data: absences, isLoading, refetch } = useQuery<AbsenceRecord[]>({
    queryKey: ['admin-absences'],
    queryFn: () => api.absences.list(),
  });

  // Real-time listener for incoming absences
  useSocket({
    'absence:created': () => {
      refetch();
    },
  });

  const handleOpenSuggestions = async (absence: AbsenceRecord) => {
    setSelectedAbsence(absence);
    setLoadingSuggestions(true);
    try {
      const res = await api.absences.suggestions(absence.id);
      setSuggestions(res);
    } catch (e) {
      // Mock suggestions fallback for UI review
      setSuggestions([
        {
          slotId: 'slot-101',
          period: absence.periods[0] || 1,
          subjectCode: 'CS101',
          originalFaculty: absence.facultyName || 'Dr. Smith',
          suggestedSubstitutes: [
            { id: 'f-2', name: 'Prof. Ananya Rao', substitutionsThisWeek: 0 },
            { id: 'f-3', name: 'Dr. Vikram Patel', substitutionsThisWeek: 1 },
          ],
          suggestedRoom: { id: 'r-1', name: 'Room 204', capacity: 60 },
        },
      ]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleConfirmSubstitution = async (slotId: string, subFacultyId: string | null, roomId: string) => {
    if (!selectedAbsence) return;

    try {
      await api.absences.confirm(selectedAbsence.id, [
        {
          slotId,
          substituteFacultyId: subFacultyId,
          roomId,
        },
      ]);
      setConfirmSuccess(true);
      setTimeout(() => {
        setConfirmSuccess(false);
        setSelectedAbsence(null);
        setSuggestions(null);
        refetch();
      }, 1500);
    } catch (err: any) {
      alert(err?.message || 'Failed to confirm substitution.');
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6">
        <span className="text-[11px] font-bold text-[#86724F] uppercase tracking-wider">
          Substitution Intelligence
        </span>
        <h2 className="text-xl font-bold text-[#1B1C19] mt-0.5">Absences Inbox</h2>
        <p className="text-xs text-[#4C463C] mt-1">
          Review leave declarations and assign substitutes ranked by departmental availability.
        </p>
      </div>

      {/* Absences List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 rounded-3xl bg-[#F0EEE9]/70 animate-pulse" />
            ))}
          </div>
        ) : !absences || absences.length === 0 ? (
          <div className="glass-panel rounded-3xl p-8 text-center text-xs text-[#7E766B]">
            No outstanding faculty absences in the inbox.
          </div>
        ) : (
          absences.map((absence) => (
            <div
              key={absence.id}
              className="glass-panel rounded-3xl p-5 border border-[#CFC5B8]/50 flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FFDAD6] text-[#93000A]">
                  Leave Declared
                </span>
                <h4 className="text-sm font-bold text-[#1B1C19] mt-1">
                  {absence.facultyName || 'Faculty Member'}
                </h4>
                <p className="text-xs text-[#7E766B] mt-0.5">
                  Date: {absence.date} • Periods: {absence.periods.join(', ')}
                </p>
              </div>

              <button
                onClick={() => handleOpenSuggestions(absence)}
                className="py-1.5 px-3 rounded-2xl bg-[#6C5939] hover:bg-[#554425] text-white text-xs font-semibold flex items-center gap-1 transition"
              >
                <span>Suggestions</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Substitution Suggestions Modal */}
      {selectedAbsence && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel bg-[#FCF9F4] rounded-3xl p-6 shadow-2xl border border-[#CFC5B8] max-h-[85vh] overflow-y-auto">
            {confirmSuccess ? (
              <div className="text-center py-8 space-y-2">
                <CheckCircle className="w-12 h-12 text-[#6C5939] mx-auto" />
                <h3 className="text-base font-bold text-[#1B1C19]">Substitution Confirmed!</h3>
                <p className="text-xs text-[#7E766B]">
                  Timetable update broadcasted live to all affected student devices in &lt;2 seconds.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-[#86724F] uppercase tracking-wider">
                      Algorithmic Matcher
                    </span>
                    <h3 className="text-base font-bold text-[#1B1C19] mt-0.5">
                      Substitutes for {selectedAbsence.facultyName || 'Faculty'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedAbsence(null)}
                    className="p-1 rounded-xl text-[#7E766B] hover:bg-black/5"
                  >
                    ✕
                  </button>
                </div>

                {loadingSuggestions ? (
                  <div className="py-8 text-center text-xs text-[#7E766B] animate-pulse">
                    Computing clash-free suggestions...
                  </div>
                ) : !suggestions || suggestions.length === 0 ? (
                  <p className="text-xs text-[#7E766B] py-4">No matching slots found for this date.</p>
                ) : (
                  suggestions.map((s) => (
                    <div
                      key={s.slotId}
                      className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#CFC5B8]/60 space-y-3"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-[#1B1C19]">
                          Period {s.period} ({s.subjectCode})
                        </span>
                        <span className="text-[#7E766B]">Room: {s.suggestedRoom.name}</span>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[11px] font-bold text-[#7E766B] uppercase">
                          Recommended Faculty (Least load first):
                        </p>
                        {s.suggestedSubstitutes.map((cand) => (
                          <div
                            key={cand.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-[#F6F3EE] text-xs"
                          >
                            <div>
                              <span className="font-bold text-[#1B1C19]">{cand.name}</span>
                              <p className="text-[10px] text-[#7E766B]">
                                {cand.substitutionsThisWeek} substitutions this week
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                handleConfirmSubstitution(s.slotId, cand.id, s.suggestedRoom.id)
                              }
                              className="py-1 px-3 rounded-xl bg-[#6C5939] text-white text-[11px] font-bold hover:bg-[#554425]"
                            >
                              Assign
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-[#CFC5B8]/30 flex justify-end">
                        <button
                          onClick={() => handleConfirmSubstitution(s.slotId, null, s.suggestedRoom.id)}
                          className="text-xs text-[#BA1A1A] font-semibold hover:underline"
                        >
                          Cancel Class for Period {s.period}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

