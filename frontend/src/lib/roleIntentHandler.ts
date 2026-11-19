import { User, api, SubmissionDeadline } from './api';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  action?: {
    type: 'NAVIGATE' | 'INFO';
    route?: string;
    label?: string;
  };
}

export interface IntentResponse {
  spokenText: string;
  displayText: string;
  route?: string;
  actionLabel?: string;
}

export class RoleIntentHandler {
  /**
   * Process an incoming text/voice prompt against role policies,
   * live timetable/attendance/analytics API data, powered by NVIDIA NIM AI.
   */
  public static async processPrompt(
    prompt: string,
    user: User | null,
    navigate: (route: string) => void
  ): Promise<IntentResponse> {
    const raw = prompt.trim();
    const q = raw.toLowerCase();

    if (!user) {
      return {
        spokenText: 'Please log in to your portal to use the ClassRadar assistant.',
        displayText: 'Please log in to your portal to access personalized academic services.',
        route: '/login',
        actionLabel: 'Go to Login',
      };
    }

    const role = user.role;

    // ─────────────────────────────────────────────────────────────
    // 1. STRICT CROSS-ROLE SECURITY CHECKS
    // ─────────────────────────────────────────────────────────────
    if (role === 'STUDENT') {
      if (
        q.includes('admin') ||
        q.includes('import timetable') ||
        q.includes('import csv') ||
        q.includes('substitute suggestion') ||
        q.includes('mark absence') ||
        q.includes('mark me absent') ||
        q.includes('start session') ||
        q.includes('qr session') ||
        q.includes('teaching schedule')
      ) {
        return {
          spokenText: 'Access restricted. You do not have permissions for faculty or administrative actions.',
          displayText: '🔒 **Access Restricted**: This action requires Faculty or Administrative privileges.',
        };
      }
    }

    if (role === 'FACULTY') {
      if (
        q.includes('admin') ||
        q.includes('import timetable') ||
        q.includes('import csv') ||
        q.includes('slot editor') ||
        q.includes('master timetable')
      ) {
        return {
          spokenText: 'Access restricted. Timetable editing and CSV importing are reserved for Academic Administrators.',
          displayText: '🔒 **Access Restricted**: Timetable structure and CSV imports are reserved for Academic Deans and Admins.',
        };
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 2. IMMEDIATE ACTION ROUTING (ONE-CLICK HARDWARE/NAVIGATION)
    // ─────────────────────────────────────────────────────────────
    // Fast QR camera scanner trigger
    if (q === 'scan' || q === 'scan qr' || q === 'qr scanner' || q === 'open scanner') {
      const target = role === 'FACULTY' ? '/faculty/session' : '/student/scan';
      navigate(target);
      return {
        spokenText: role === 'FACULTY' ? 'Opening QR session launcher.' : 'Opening QR camera scanner.',
        displayText: role === 'FACULTY' ? '📲 **Launching QR Session**' : '📷 **Opening QR Scanner**',
        route: target,
        actionLabel: role === 'FACULTY' ? 'Launch Session' : 'Open Scanner',
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 3. GATHER LIVE CONTEXT & SEND TO NVIDIA NIM LLM
    // ─────────────────────────────────────────────────────────────
    try {
      let liveContext = '';

      if (role === 'STUDENT') {
        const [todaySlots, attendance, allRooms, deadlines] = await Promise.all([
          api.timetable.me('2026-11-09').catch(() => []),
          api.attendance.summary().catch(() => []),
          api.rooms.all().catch(() => []),
          api.submissions.listStudent().catch(() => []),
        ]);

        liveContext = `
STUDENT LIVE SUBMISSION DEADLINES & ASSIGNMENTS:
${
  deadlines && deadlines.length > 0
    ? deadlines
        .map(
          (d) =>
            `- [${d.subject?.code || 'Course'} - ${d.subject?.name || 'Subject'}] "${d.title}": Due on ${new Date(
              d.dueDate
            ).toLocaleString('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })} | Status: ${d.urgency || 'NORMAL'} | Countdown: ${d.countdown || 'Upcoming'} | Finalized: ${
              d.isFinalized ? 'Yes (Official)' : 'No'
            } | Instructions: ${d.description || 'None'}`
        )
        .join('\n')
    : 'No upcoming submission deadlines currently posted for your section.'
}

STUDENT LIVE ATTENDANCE SUMMARY (75% minimum institutional rule):
${
  attendance.length > 0
    ? attendance
        .map(
          (a) =>
            `- ${a.subjectCode} (${a.subjectName}): ${a.attended}/${a.total} classes (${a.percent}%). ` +
            (a.percent >= 75 ? `Can skip ${a.canSkip} classes.` : `Below 75%! Must attend ${a.mustAttend} consecutive classes.`)
        )
        .join('\n')
    : 'No attendance data yet.'
}

STUDENT TODAY'S TIMETABLE (6-8 Periods):
${
  todaySlots.length > 0
    ? todaySlots
        .sort((a, b) => a.period - b.period)
        .map((s) => `- Period ${s.period}: ${s.subjectCode} (${s.subjectName || ''}) in ${s.roomName || 'Room 406'}`)
        .join('\n')
    : 'No classes scheduled.'
}

CAMPUS ROOMS:
${allRooms.length} rooms tracked (${allRooms.filter((r) => r.type === 'LAB').length} computer labs, ${allRooms.filter((r) => r.type === 'CLASSROOM').length} classrooms).
`;
      } else if (role === 'FACULTY') {
        const [todaySlots, allRooms, facultyDeadlines] = await Promise.all([
          api.timetable.me('2026-11-09').catch(() => []),
          api.rooms.all().catch(() => []),
          api.submissions.listFaculty().catch(() => [] as SubmissionDeadline[]),
        ]);

        const allDeadlinesList = Array.isArray(facultyDeadlines) ? facultyDeadlines : [];

        liveContext = `
FACULTY MANAGED SUBMISSION DEADLINES:
${
  allDeadlinesList.length > 0
    ? allDeadlinesList
        .map(
          (d) =>
            `- [Section ${d.section?.name || ''}] ${d.subject?.code}: "${d.title}" due ${new Date(
              d.dueDate
            ).toLocaleDateString()} (${d.isFinalized ? 'Finalized/Official' : 'Draft/Editable'})`
        )
        .join('\n')
    : 'No deadlines created yet.'
}

FACULTY TEACHING SCHEDULE:
${
  todaySlots.length > 0
    ? todaySlots
        .sort((a, b) => a.period - b.period)
        .map((s) => `- Period ${s.period}: ${s.subjectCode} (${s.subjectName || ''}) in ${s.roomName || 'Room 406'}`)
        .join('\n')
    : 'No teaching lectures scheduled today.'
}

CAMPUS ROOMS:
${allRooms.length} rooms available for on-demand booking.
`;
      } else if (role === 'ADMIN') {
        const [util, lowAtt, absences] = await Promise.all([
          api.analytics.roomUtilization().catch(() => []),
          api.analytics.lowAttendance().catch(() => []),
          api.absences.list().catch(() => []),
        ]);

        liveContext = `
INSTITUTIONAL METRICS:
- Monitored rooms: ${util.length}
- Students on low attendance watch list (<75%): ${lowAtt.length}
- Faculty absences declared: ${absences.length}
`;
      }

      // Query the NVIDIA NIM API route
      const aiResponse = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: raw,
          user,
          context: liveContext,
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        if (aiData.route) {
          navigate(aiData.route);
        }
        return {
          spokenText: aiData.spokenText || aiData.displayText,
          displayText: aiData.displayText,
          route: aiData.route || undefined,
          actionLabel: aiData.actionLabel || undefined,
        };
      }
    } catch (err) {
      console.warn('NVIDIA NIM query failed, falling back to local handler:', err);
    }

    // ─────────────────────────────────────────────────────────────
    // 4. OFFLINE / FALLBACK INTENT HANDLER
    // ─────────────────────────────────────────────────────────────
    if (
      q.includes('deadline') ||
      q.includes('submission') ||
      q.includes('assignment') ||
      q.includes('project') ||
      q.includes('homework')
    ) {
      const target = role === 'FACULTY' ? '/faculty/deadlines' : '/student/deadlines';
      navigate(target);
      return {
        spokenText:
          role === 'FACULTY'
            ? 'Navigating to Faculty Submission Deadlines.'
            : 'Navigating to your Submission Deadlines.',
        displayText:
          role === 'FACULTY'
            ? 'Navigated to **Faculty Submission Deadlines**. Manage and finalize assignment due dates.'
            : 'Navigated to **Submission Deadlines**. View and check your upcoming assignments.',
        route: target,
        actionLabel: role === 'FACULTY' ? 'Manage Deadlines' : 'View Deadlines',
      };
    }

    if (q.includes('free room') || q.includes('empty room') || q.includes('room')) {
      navigate('/rooms');
      return {
        spokenText: 'Navigating to the Free Room Finder.',
        displayText: 'Navigated to **Free Room Finder**. Check period occupancy across campus.',
        route: '/rooms',
        actionLabel: 'View Free Rooms',
      };
    }

    if (q.includes('attendance') || q.includes('bunk')) {
      const target = role === 'FACULTY' ? '/faculty/history' : '/student/attendance';
      navigate(target);
      return {
        spokenText: 'Navigating to attendance records.',
        displayText: 'Navigated to **Attendance Records**.',
        route: target,
        actionLabel: 'View Attendance',
      };
    }

    const defaultRoute = role === 'STUDENT' ? '/student' : role === 'FACULTY' ? '/faculty' : '/admin';
    return {
      spokenText: `I heard: ${raw}. Navigating to your ${role.toLowerCase()} dashboard.`,
      displayText: `Showing results for "${raw}".`,
      route: defaultRoute,
      actionLabel: 'Go to Dashboard',
    };
  }
}
