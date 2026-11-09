'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { UploadCloud, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

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
    <div className="max-w-xl mx-auto px-4 py-4 space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6">
        <span className="text-[11px] font-bold text-[#86724F] uppercase tracking-wider">
          Batch Operations
        </span>
        <h2 className="text-xl font-bold text-[#1B1C19] mt-0.5">CSV Timetable Importer</h2>
        <p className="text-xs text-[#4C463C] mt-1">
          Upload department schedule CSV. Atomic import: any room, section, or faculty double-booking rejects the file.
        </p>
      </div>

      {/* Upload Box */}
      <div className="glass-panel rounded-3xl p-8 border-2 border-dashed border-[#CFC5B8] flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#E7DFD1] text-[#6C5939] flex items-center justify-center">
          <UploadCloud className="w-7 h-7" />
        </div>

        <div>
          <h3 className="text-sm font-bold text-[#1B1C19]">
            {file ? file.name : 'Choose CSV Schedule File'}
          </h3>
          <p className="text-[11px] text-[#7E766B] mt-0.5">
            Expected headers: department, section, weekday, period, subject_code, faculty_email, room
          </p>
        </div>

        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          id="csv-file-input"
          className="hidden"
        />

        <label
          htmlFor="csv-file-input"
          className="py-2 px-4 rounded-2xl bg-[#FFFFFF] border border-[#CFC5B8] text-xs font-semibold text-[#1B1C19] hover:bg-[#F0EEE9] cursor-pointer transition shadow-sm"
        >
          {file ? 'Change File' : 'Browse Files'}
        </label>
      </div>

      {file && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full py-3 rounded-2xl bg-[#6C5939] hover:bg-[#554425] text-white text-xs font-bold transition shadow-md shadow-[#6C5939]/20 disabled:opacity-50"
        >
          {uploading ? 'Validating & Importing...' : 'Execute Import & Clash Detection'}
        </button>
      )}

      {/* Outcome notification */}
      {result && (
        <div
          className={`p-4 rounded-3xl border flex items-start gap-3 ${
            result.success
              ? 'bg-[#E7DFD1]/50 border-[#6C5939]/30 text-[#6C5939]'
              : 'bg-[#FFDAD6]/50 border-[#BA1A1A]/30 text-[#93000A]'
          }`}
        >
          {result.success ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-[#BA1A1A]" />
          )}
          <div className="text-xs">
            <h4 className="font-bold">{result.success ? 'Import Complete' : 'Clash Error Detected'}</h4>
            <p className="mt-0.5">{result.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}

