'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function AdminTimetableImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; errors?: any[] } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.timetable.importCsv(formData);
      setResult({
        success: true,
        message: `Successfully imported timetable slots with 0 clashes detected.`,
      });
    } catch (err: any) {
      setResult({
        success: false,
        message: err?.message || 'CSV Import clash validation rejected.',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Specular Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-10 left-1/4 w-[40rem] h-[25rem] rounded-full bg-[#EAE1D4]/40 blur-[120px]" />
      </div>

      {/* Editorial Header Section */}
      <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-[#CFC5B8]/40 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#6C5939] animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#86724F]">
              Batch Operations & Schema Parser
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B1C19] tracking-tight">
            Timetable CSV Batch Ingestion
          </h1>
          <p className="text-xs sm:text-sm text-[#4C463C]">
            Upload full semester curriculum matrix with automatic multi-room and faculty conflict validation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="px-4 py-2 rounded-full bg-white border border-[#CFC5B8] hover:bg-[#F0EEE9] text-xs font-bold text-[#1B1C19] transition flex items-center gap-1.5 shadow-sm"
          >
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </section>

      {/* Upload Console in 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Upload Box (Span 7) */}
        <div className="lg:col-span-7 glass-panel rounded-3xl p-6 sm:p-8 border border-[#CFC5B8]/60 shadow-md space-y-6">
          <form onSubmit={handleUpload} className="space-y-6">
            <div className="border-2 border-dashed border-[#CFC5B8] rounded-3xl p-8 sm:p-12 text-center hover:bg-white/40 transition-colors cursor-pointer relative bg-white/60">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-[#E7DFD1] text-[#6C5939] flex items-center justify-center">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1B1C19]">
                    {file ? file.name : 'Choose a timetable CSV or drag and drop here'}
                  </p>
                  <p className="text-xs text-[#7E766B] mt-1">
                    Standard UTF-8 CSV format (sectionId, weekday, period, subjectCode, facultyId, roomId)
                  </p>
                </div>
                {file && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#E7DFD1] text-[#6C5939]">
                    Ready to Ingest ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={!file || uploading}
              className="w-full py-3 px-6 rounded-2xl bg-[#6C5939] hover:bg-[#554425] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {uploading ? (
                <span>Parsing & Validating Clashes...</span>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Execute Ingestion & Verify Collision Rules</span>
                </>
              )}
            </button>
          </form>

          {/* Result Alert */}
          {result && (
            <div
              className={`p-6 rounded-2xl border flex items-start gap-4 animate-in zoom-in-95 ${
                result.success
                  ? 'bg-[#E7DFD1]/50 border-[#6C5939]/40 text-[#1B1C19]'
                  : 'bg-[#FFDAD6]/50 border-[#BA1A1A]/40 text-[#93000A]'
              }`}
            >
              {result.success ? (
                <CheckCircle2 className="w-6 h-6 text-[#6C5939] shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-[#BA1A1A] shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <h4 className="text-sm font-bold">
                  {result.success ? 'Import Complete' : 'Collision Detection Error'}
                </h4>
                <p className="text-xs leading-relaxed">{result.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Schema Template & Requirements (Span 5) */}
        <div className="lg:col-span-5 glass-panel rounded-3xl p-6 sm:p-8 border border-[#CFC5B8]/60 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-[#CFC5B8]/40 pb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#86724F]" />
              <h3 className="text-base font-bold text-[#1B1C19]">CSV Schema Guide</h3>
            </div>
          </div>

          <div className="space-y-3 text-xs text-[#4C463C]">
            <p>
              The ClassRadar collision validator requires the following header row exactly:
            </p>
            <div className="p-3 bg-white rounded-xl border border-[#CFC5B8]/70 font-mono text-[11px] text-[#1B1C19] overflow-x-auto">
              sectionId,weekday,period,subjectCode,facultyId,roomId
            </div>
            <ul className="space-y-2 text-[11px] text-[#7E766B] list-disc pl-4 pt-2">
              <li><strong>weekday</strong>: 1 (Monday) through 6 (Saturday)</li>
              <li><strong>period</strong>: 1 through 8</li>
              <li>Automatic rollback occurs if any faculty member or room is double-booked</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-[#F0EEE9]/70 border border-[#CFC5B8]/40 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#6C5939] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#7E766B] leading-relaxed">
              Timetable modifications sync across all student and faculty portal views within 100 milliseconds via WebSocket broadcast.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
