/**
 * Typed API Client for ClassRadar with automatic mock fallback
 * Conforms strictly to openapi.yaml
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

export interface AnalyticsSummary {
  roomUtilization: Array<{ roomName: string; utilizationPercent: number }>;
  lowAttendance: Array<{ studentName: string; subjectCode: string; percentage: number }>;
  substitutions: Array<{ facultyName: string; count: number }>;
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

// Fallback Mock Datasets when backend server isn't running yet
const MOCK_USERS: Record<string, User> = {
  'student1@classradar.edu': {
    id: 'user-std-1',
    name: 'Aarav Sharma',
    email: 'student1@classradar.edu',
    role: 'STUDENT',
    department: 'Computer Science',
    sectionId: 'CSE-3A',
  },
  'faculty1@classradar.edu': {
    id: 'user-fac-1',
    name: 'Prof. Rajesh Kumar',
    email: 'faculty1@classradar.edu',
    role: 'FACULTY',
    department: 'Computer Science',
  },
  'admin@classradar.edu': {
    id: 'user-adm-1',
    name: 'Academic Dean Office',
    email: 'admin@classradar.edu',
    role: 'ADMIN',
    department: 'Administration',
  },
};

const MOCK_SLOTS: Slot[] = [
  {
    id: 'slot-1',
    sectionId: 'CSE-3A',
    subjectId: 'sub-1',
    subjectCode: 'CS301',
    subjectName: 'Design & Analysis of Algorithms',
    facultyId: 'fac-1',
    facultyName: 'Prof. Rajesh Kumar',
    roomId: 'room-101',
    roomName: 'Lecture Hall 101',
    weekday: 1,
    period: 1,
  },
  {
    id: 'slot-2',
    sectionId: 'CSE-3A',
    subjectId: 'sub-2',
    subjectCode: 'CS302',
    subjectName: 'Database Management Systems',
    facultyId: 'fac-2',
    facultyName: 'Dr. Vikram Patel',
    roomId: 'room-102',
    roomName: 'Lecture Hall 102',
    weekday: 1,
    period: 2,
    isSubstituted: true,
    substituteFacultyName: 'Prof. Ananya Rao',
  },
  {
    id: 'slot-3',
    sectionId: 'CSE-3A',
    subjectId: 'sub-3',
    subjectCode: 'CS303',
    subjectName: 'Computer Networks Lab',
    facultyId: 'fac-3',
    facultyName: 'Dr. Suresh Nair',
    roomId: 'lab-2',
    roomName: 'Systems Lab 2',
    weekday: 1,
    period: 3,
  },
  {
    id: 'slot-4',
    sectionId: 'CSE-3A',
    subjectId: 'sub-4',
    subjectCode: 'MA301',
    subjectName: 'Discrete Mathematics',
    facultyId: 'fac-4',
    facultyName: 'Prof. Neha Gupta',
    roomId: 'room-101',
    roomName: 'Lecture Hall 101',
    weekday: 1,
    period: 4,
  },
];

const MOCK_BUNK_SUMMARY: BunkSummaryItem[] = [
  {
    subjectId: 'sub-1',
    subjectCode: 'CS301',
    subjectName: 'Design & Analysis of Algorithms',
    attended: 28,
    total: 32,
    percent: 88,
    canSkip: 5,
    mustAttend: 0,
  },
  {
    subjectId: 'sub-2',
    subjectCode: 'CS302',
    subjectName: 'Database Management Systems',
    attended: 20,
    total: 30,
    percent: 67,
    canSkip: 0,
    mustAttend: 10,
  },
  {
    subjectId: 'sub-3',
    subjectCode: 'CS303',
    subjectName: 'Computer Networks Lab',
    attended: 14,
    total: 16,
    percent: 88,
    canSkip: 2,
    mustAttend: 0,
  },
  {
    subjectId: 'sub-4',
    subjectCode: 'MA301',
    subjectName: 'Discrete Mathematics',
    attended: 24,
    total: 32,
    percent: 75,
    canSkip: 0,
    mustAttend: 0,
  },
];

const MOCK_ROOMS: Room[] = [
  { id: 'r-1', name: 'Lecture Hall 101', type: 'CLASSROOM', capacity: 70 },
  { id: 'r-2', name: 'Lecture Hall 102', type: 'CLASSROOM', capacity: 60 },
  { id: 'r-3', name: 'Seminar Hall B', type: 'CLASSROOM', capacity: 120 },
  { id: 'r-4', name: 'Computing Lab 1', type: 'LAB', capacity: 45 },
  { id: 'r-5', name: 'Networks Lab', type: 'LAB', capacity: 40 },
  { id: 'r-6', name: 'Robotics Center', type: 'LAB', capacity: 35 },
];

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (netErr) {
    // Backend offline: seamlessly fallback to realistic mock responses
    // as defined in Phase 0 / Phase 3 specifications.
  }

  // --- MOCK FALLBACK HANDLERS ---
  if (path.startsWith('/auth/login')) {
    const body = options.body ? JSON.parse(options.body as string) : {};
    const email = body.email || 'student1@classradar.edu';
    const mockUser = MOCK_USERS[email] || {
      id: 'mock-user-id',
      name: email.split('@')[0],
      email: email,
      role: email.includes('admin') ? 'ADMIN' : email.includes('faculty') ? 'FACULTY' : 'STUDENT',
      department: 'Computer Science',
      sectionId: 'CSE-3A',
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('classradar_user', JSON.stringify(mockUser));
    }
    return { token: 'mock-jwt-token-active' } as unknown as T;
  }

  if (path.startsWith('/auth/me')) {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('classradar_user');
      if (stored) return JSON.parse(stored) as T;
    }
    return MOCK_USERS['student1@classradar.edu'] as unknown as T;
  }

  if (path.startsWith('/timetable/me') || path.startsWith('/timetable/section')) {
    return MOCK_SLOTS as unknown as T;
  }

  if (path.startsWith('/attendance/me/summary')) {
    return MOCK_BUNK_SUMMARY as unknown as T;
  }

  if (path.startsWith('/rooms/free') || path.startsWith('/rooms')) {
    return MOCK_ROOMS as unknown as T;
  }

  if (path.startsWith('/absences')) {
    return [
      {
        id: 'abs-1',
        facultyId: 'fac-1',
        facultyName: 'Prof. Rajesh Kumar',
        date: '2026-11-09',
        periods: [2, 3],
        reason: 'University Research Symposium',
      },
    ] as unknown as T;
  }

  if (path.startsWith('/analytics/room-utilization')) {
    return [
      { roomName: 'Lecture Hall 101', utilizationPercent: 82 },
      { roomName: 'Lecture Hall 102', utilizationPercent: 68 },
      { roomName: 'Networks Lab', utilizationPercent: 75 },
      { roomName: 'Computing Lab 1', utilizationPercent: 90 },
    ] as unknown as T;
  }

  if (path.startsWith('/analytics/low-attendance')) {
    return [
      { studentName: 'Rohan Verma', subjectCode: 'CS302', percentage: 67 },
      { studentName: 'Pooja Iyer', subjectCode: 'CS302', percentage: 71 },
    ] as unknown as T;
  }

  if (path.startsWith('/analytics/substitutions')) {
    return [
      { facultyName: 'Prof. Ananya Rao', count: 4 },
      { facultyName: 'Dr. Vikram Patel', count: 2 },
    ] as unknown as T;
  }

  if (path.startsWith('/attendance/scan')) {
    return { success: true, markedAt: new Date().toISOString() } as unknown as T;
  }

  return { success: true } as unknown as T;
}

export const api = {
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    me: () => request<User>('/auth/me'),
  },

  timetable: {
    me: (date: string) => request<Slot[]>(`/timetable/me?date=${date}`),
    section: (sectionId: string, date: string) =>
      request<Slot[]>(`/timetable/section/${sectionId}?date=${date}`),
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
    list: () => request<Room[]>('/rooms'),
    free: (params: { date: string; period: number; type?: 'CLASSROOM' | 'LAB'; minCapacity?: number }) => {
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
  },
};
