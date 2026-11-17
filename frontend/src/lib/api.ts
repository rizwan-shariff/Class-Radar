/**
 * Typed API Client for ClassRadar
 * Directly connected to Fastify backend API & Real Database
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'FACULTY' | 'ADMIN';
  department?: string;
  sectionId?: string;
}

export interface Room {
  id: string;
  name: string;
  type: 'CLASSROOM' | 'LAB';
  capacity: number;
}

export interface Slot {
  id: string;
  sectionId: string;
  subjectId: string;
  subjectCode?: string;
  subjectName?: string;
  facultyId: string;
  facultyName?: string;
  roomId: string;
  roomName?: string;
  weekday: number;
  period: number;
  startTime?: string;
  endTime?: string;
  isSubstituted?: boolean;
  isCancelled?: boolean;
  substituteFacultyName?: string;
}

export interface BunkSummaryItem {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  attended: number;
  total: number;
  percent: number;
  canSkip: number;
  mustAttend: number;
}

export interface AbsenceRecord {
  id: string;
  facultyId: string;
  facultyName?: string;
  date: string;
  periods: number[];
  reason?: string;
}

export interface SubstituteSuggestion {
  slotId: string;
  period: number;
  subjectCode: string;
  originalFaculty: string;
  suggestedSubstitutes: Array<{ id: string; name: string; substitutionsThisWeek: number }>;
  suggestedRoom: { id: string; name: string; capacity: number };
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('classradar_token');
}

export function setToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('classradar_token', token);
  }
}

export function clearToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('classradar_token');
    localStorage.removeItem('classradar_user');
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearToken();
    }
    let errMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.error) {
        errMessage = typeof errJson.error === 'string' ? errJson.error : errJson.error.message || JSON.stringify(errJson.error);
      }
    } catch {
      // non-JSON error
    }
    throw new Error(errMessage);
  }

  return await response.json();
}

function normalizeSlot(s: any): Slot {
  return {
    ...s,
    subjectCode: s.subject?.code || s.subjectCode,
    subjectName: s.subject?.name || s.subjectName,
    facultyName: s.faculty?.name || s.facultyName,
    roomName: s.room?.name || s.roomName,
    isSubstituted: s.cancelled ? false : !!s.substitution,
    isCancelled: !!s.cancelled,
    substituteFacultyName: s.substitution?.substituteFaculty?.name || s.substituteFacultyName,
  };
}

export const api = {
  setAuthToken: (token: string) => {
    setToken(token);
  },
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    me: () => request<User>('/auth/me'),
  },

  timetable: {
    me: async (date: string) => {
      const data = await request<any[]>(`/timetable/me?date=${date}`);
      return (data || []).map(normalizeSlot);
    },
    section: async (sectionId: string, date: string) => {
      const data = await request<any[]>(`/timetable/section/${sectionId}?date=${date}`);
      return (data || []).map(normalizeSlot);
    },
    importCsv: (formData: FormData) =>
      request<{ success: boolean; rowsImported?: number }>('/timetable/import', {
        method: 'POST',
        body: formData,
      }),
    createSlot: (data: Partial<Slot>) =>
      request<Slot>('/timetable/slots', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateSlot: (id: string, data: Partial<Slot>) =>
      request<Slot>(`/timetable/slots/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    deleteSlot: (id: string) =>
      request<{ success: boolean }>(`/timetable/slots/${id}`, {
        method: 'DELETE',
      }),
  },

  rooms: {
    all: () => request<Room[]>('/rooms'),
    free: (params: { date: string; period: number; type?: string; minCapacity?: number }) => {
      const query = new URLSearchParams({
        date: params.date,
        period: params.period.toString(),
      });
      if (params.type) query.set('type', params.type);
      if (params.minCapacity) query.set('minCapacity', params.minCapacity.toString());
      return request<Room[]>(`/rooms/free?${query.toString()}`);
    },
    book: (data: { roomId: string; date: string; period: number; purpose: string }) =>
      request<{ id: string }>('/bookings', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    deleteBooking: (id: string) =>
      request<{ success: boolean }>(`/bookings/${id}`, {
        method: 'DELETE',
      }),
  },

  absences: {
    create: (data: { facultyId?: string; date: string; periods: number[]; reason?: string }) =>
      request<{ id: string }>('/absences', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    list: (date?: string) =>
      request<AbsenceRecord[]>(date ? `/absences?date=${date}` : '/absences'),
    suggestions: (id: string) =>
      request<SubstituteSuggestion[]>(`/absences/${id}/suggestions`),
    confirm: (id: string, choices: Array<{ slotId: string; substituteFacultyId: string | null; roomId: string }>) =>
      request<{ success: boolean }>(`/absences/${id}/confirm`, {
        method: 'POST',
        body: JSON.stringify({ choices }),
      }),
  },

  analytics: {
    roomUtilization: () => request<any[]>('/analytics/room-utilization'),
    lowAttendance: () => request<any[]>('/analytics/low-attendance'),
    substitutions: () => request<any[]>('/analytics/substitutions'),
  },

  attendance: {
    startSession: (data: { slotId: string; date: string }) =>
      request<{ id: string; slotId: string; status: 'OPEN' }>('/attendance/sessions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    closeSession: (sessionId: string) =>
      request<{ success: boolean }>(`/attendance/sessions/${sessionId}/close`, {
        method: 'POST',
      }),
    getToken: (sessionId: string) =>
      request<{ token: string; expiresAt: string }>(`/attendance/sessions/${sessionId}/token`),
    scan: (token: string) =>
      request<{ success: boolean; markedAt: string }>('/attendance/scan', {
        method: 'POST',
        body: JSON.stringify({ token }),
      }),
    override: (recordId: string, status: 'PRESENT' | 'ABSENT') =>
      request<{ success: boolean }>(`/attendance/records/${recordId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    summary: () => request<BunkSummaryItem[]>('/attendance/me/summary'),
    checkActiveSession: () =>
      request<{
        active: boolean;
        session: {
          id: string;
          slotId: string;
          startedAt: string;
          subjectCode?: string;
          subjectName?: string;
          facultyName?: string;
          roomName?: string;
        } | null;
      }>('/attendance/active-session'),
    studentHistory: (subjectId?: string) =>
      request<any[]>(subjectId ? `/attendance/student-history?subjectId=${subjectId}` : '/attendance/student-history'),
    facultyMatrix: () =>
      request<
        Array<{
          studentId: string;
          studentName: string;
          studentEmail: string;
          attended: number;
          total: number;
          percentage: number;
          records: Array<{ date: string; status: string; subjectCode?: string }>;
        }>
      >('/attendance/faculty-matrix'),
  },
};
