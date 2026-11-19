import { User, api } from './api';

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
   * live timetable/attendance/analytics API data, and available routes.
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
    // CROSS-ROLE SECURITY CHECKS
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
    // COMMON COMMANDS (ALL AUTHENTICATED ROLES)
    // ─────────────────────────────────────────────────────────────
    // 1. Free Rooms / Free Classroom / Available Labs
    if (
      q.includes('free room') ||
      q.includes('empty room') ||
      q.includes('available room') ||
      q.includes('free lab') ||
      q.includes('find room') ||
      q.includes('vacant room')
    ) {
      navigate('/rooms');
      try {
        const rooms = await api.rooms.all();
        const total = rooms.length;
        const labs = rooms.filter((r) => r.type === 'LAB').length;
        const classrooms = total - labs;
        return {
          spokenText: `Navigating to Free Room Finder. Campus has ${total} tracked spaces, including ${classrooms} classrooms and ${labs} computer labs.`,
          displayText: `Navigated to **Free Room Finder**. Campus directory contains ${total} spaces (${classrooms} classrooms, ${labs} labs). Select date and period to check live occupancy.`,
          route: '/rooms',
          actionLabel: 'View Free Rooms',
        };
      } catch {
        return {
          spokenText: 'Navigating to the Free Room Finder.',
          displayText: 'Navigated to **Free Room Finder**.',
          route: '/rooms',
          actionLabel: 'View Free Rooms',
        };
      }
    }

    // ─────────────────────────────────────────────────────────────
    // STUDENT SPECIFIC INTENTS
    // ─────────────────────────────────────────────────────────────
    if (role === 'STUDENT') {
      // A. "When is my next class?" / "What are my classes today?" / "My timetable"
      if (
        q.includes('next class') ||
        q.includes('classes today') ||
        q.includes('class today') ||
        q.includes('schedule today') ||
        q.includes('today schedule') ||
        q.includes('my timetable') ||
        q.includes('weekly timetable') ||
        q.includes('my classes') ||
        q.includes('schedule')
      ) {
        const targetRoute = q.includes('weekly') ? '/student/timetable' : '/student';
        navigate(targetRoute);

        try {
          // Fetch student schedule for today (or fallback date 2026-11-09)
          const todayIso = new Date().toISOString().split('T')[0];
          let slots = await api.timetable.me(todayIso).catch(() => []);
          if (!slots || slots.length === 0) {
            slots = await api.timetable.me('2026-11-09').catch(() => []);
          }

          if (slots.length === 0) {
            return {
              spokenText: 'You have no classes scheduled for today. You can review your weekly timetable or find free study rooms.',
              displayText: '📅 **Today\'s Schedule**: No classes scheduled for today. Enjoy your break or find a vacant study lab!',
              route: targetRoute,
              actionLabel: 'Open Timetable',
            };
          }

          // Format classes aloud
          const sorted = [...slots].sort((a, b) => a.period - b.period);
          const first = sorted[0];
          const summary = sorted
            .slice(0, 3)
            .map((s) => `Period ${s.period}: ${s.subjectCode || 'Class'} in ${s.roomName || 'Room'}`)
            .join(', ');

          const spoken = `You have ${sorted.length} classes scheduled today. First class is Period ${first.period}, ${first.subjectCode || first.subjectName || 'Lecture'} in ${first.roomName || 'Room 406'}. ${summary}.`;

          return {
            spokenText: spoken,
            displayText: `📅 **Today's Classes (${sorted.length} Periods)**:\n` +
              sorted
                .map(
                  (s) =>
                    `• **Period ${s.period}**: ${s.subjectCode} - ${s.subjectName || ''} (${s.roomName || 'Room 406'})`
                )
                .join('\n'),
            route: targetRoute,
            actionLabel: 'View Schedule',
          };
        } catch {
          return {
            spokenText: 'Opening your student timetable.',
            displayText: 'Navigated to your **Student Timetable**.',
            route: targetRoute,
            actionLabel: 'View Schedule',
          };
        }
      }

      // B. "Check my attendance" / "Open dashboard" / "Bunk calculator"
      if (
        q.includes('attendance') ||
        q.includes('bunk') ||
        q.includes('can i bunk') ||
        q.includes('how many classes') ||
        q.includes('dashboard') ||
        q.includes('percentage')
      ) {
        navigate('/student/attendance');
        try {
          const summary = await api.attendance.summary();
          if (!summary || summary.length === 0) {
            return {
              spokenText: 'Navigating to your attendance dashboard. No attendance records found yet.',
              displayText: 'Navigated to **Attendance & Bunk Calculator**.',
              route: '/student/attendance',
              actionLabel: 'View Attendance',
            };
          }

          const totalAttended = summary.reduce((sum, item) => sum + item.attended, 0);
          const totalConducted = summary.reduce((sum, item) => sum + item.total, 0);
          const overallPercent = totalConducted > 0 ? Math.round((totalAttended / totalConducted) * 100) : 100;

          const belowList = summary.filter((s) => s.percent < 75);
          let extraVoice = '';
          if (belowList.length > 0) {
            extraVoice = `Warning: You are below 75% in ${belowList.length} subject${belowList.length > 1 ? 's' : ''}, including ${belowList[0].subjectCode}.`;
          } else {
            extraVoice = 'Great job! You are maintaining above 75% in all your registered subjects.';
          }

          return {
            spokenText: `Navigating to attendance. Your overall attendance is ${overallPercent}%. ${extraVoice}`,
            displayText: `📊 **Attendance Summary**: Overall **${overallPercent}%** (${totalAttended}/${totalConducted} classes attended across ${summary.length} subjects).\n` +
              (belowList.length > 0
                ? `⚠️ **Attention**: Below 75% in ${belowList.map((b) => b.subjectCode).join(', ')}.`
                : `✅ You meet the 75% institutional attendance requirement.`),
            route: '/student/attendance',
            actionLabel: 'View Attendance',
          };
        } catch {
          return {
            spokenText: 'Opening your attendance and bunk calculator.',
            displayText: 'Navigated to **Student Attendance & Bunk Calculator**.',
            route: '/student/attendance',
            actionLabel: 'View Attendance',
          };
        }
      }

      // C. "Scan QR" / "Mark attendance"
      if (q.includes('scan') || q.includes('qr') || q.includes('scanner') || q.includes('camera')) {
        navigate('/student/scan');
        return {
          spokenText: 'Opening anti-proxy optical QR scanner. Align camera with the rotating faculty display.',
          displayText: '📷 **QR Scanner Ready**: Point camera at faculty\'s rotating QR token or enter token code manually.',
          route: '/student/scan',
          actionLabel: 'Open Scanner',
        };
      }
    }

    // ─────────────────────────────────────────────────────────────
    // FACULTY SPECIFIC INTENTS
    // ─────────────────────────────────────────────────────────────
    if (role === 'FACULTY') {
      // A. "When is my next lecture?" / "Show my teaching schedule today"
      if (
        q.includes('next lecture') ||
        q.includes('my lecture') ||
        q.includes('teaching schedule') ||
        q.includes('my classes') ||
        q.includes('schedule today') ||
        q.includes('classes today') ||
        q.includes('schedule')
      ) {
        navigate('/faculty');
        try {
          const todayIso = new Date().toISOString().split('T')[0];
          let slots = await api.timetable.me(todayIso).catch(() => []);
          if (!slots || slots.length === 0) {
            slots = await api.timetable.me('2026-11-09').catch(() => []);
          }

          if (slots.length === 0) {
            return {
              spokenText: 'You have no assigned lectures scheduled for today. You can reserve a free room or inspect past attendance.',
              displayText: '👨‍🏫 **Faculty Schedule**: No lectures scheduled for today.',
              route: '/faculty',
              actionLabel: 'Open Faculty Schedule',
            };
          }

          const sorted = [...slots].sort((a, b) => a.period - b.period);
          const first = sorted[0];
          const spoken = `You have ${sorted.length} teaching sessions today. First session is Period ${first.period} for ${first.subjectCode} in ${first.roomName || 'Room 406'}.`;

          return {
            spokenText: spoken,
            displayText: `👨‍🏫 **Today's Teaching Schedule (${sorted.length} Sessions)**:\n` +
              sorted
                .map(
                  (s) =>
                    `• **Period ${s.period}**: ${s.subjectCode} - ${s.subjectName || ''} (${s.roomName || 'Room 406'})`
                )
                .join('\n'),
            route: '/faculty',
            actionLabel: 'View Schedule',
          };
        } catch {
          return {
            spokenText: 'Opening your faculty teaching schedule.',
            displayText: 'Navigated to **Faculty Dashboard**.',
            route: '/faculty',
            actionLabel: 'View Schedule',
          };
        }
      }

      // B. "Open attendance" / "Mark attendance" / "Start session" / "QR Session"
      if (
        q.includes('qr session') ||
        q.includes('start session') ||
        q.includes('mark attendance') ||
        q.includes('open attendance') ||
        q.includes('take attendance') ||
        q.includes('start attendance')
      ) {
        navigate('/faculty/session');
        return {
          spokenText: 'Opening rotating QR attendance session. Select your lecture slot to broadcast live nonces.',
          displayText: '📲 **Rotating QR Attendance**: Open active lecture session with 10-second anti-proxy rotating QR tokens.',
          route: '/faculty/session',
          actionLabel: 'Launch QR Session',
        };
      }

      // C. "Attendance history" / "Past sessions" / "History"
      if (q.includes('history') || q.includes('past attendance') || q.includes('past sessions')) {
        navigate('/faculty/history');
        return {
          spokenText: 'Opening your verified attendance session history.',
          displayText: '📜 **Session History**: Detailed audit trail of past QR attendance sessions with student breakdowns.',
          route: '/faculty/history',
          actionLabel: 'View History',
        };
      }

      // D. "Mark absent" / "Leave declaration"
      if (q.includes('absent') || q.includes('leave') || q.includes('sick')) {
        navigate('/faculty');
        return {
          spokenText: 'Opening leave declaration drawer on your faculty dashboard. Select unavailable periods and reason.',
          displayText: '✍️ **Mark Me Absent**: Use the quick leave declaration drawer on the dashboard to notify the dean and match substitutes.',
          route: '/faculty',
          actionLabel: 'Mark Absent',
        };
      }
    }

    // ─────────────────────────────────────────────────────────────
    // ADMIN SPECIFIC INTENTS
    // ─────────────────────────────────────────────────────────────
    if (role === 'ADMIN') {
      // A. "Open schedule management" / "Show master timetable" / "Slot editor"
      if (
        q.includes('schedule management') ||
        q.includes('master timetable') ||
        q.includes('slot editor') ||
        q.includes('slots') ||
        q.includes('manage schedule')
      ) {
        navigate('/admin/slots');
        return {
          spokenText: 'Opening curriculum slot editor with real-time clash prevention.',
          displayText: '🛠️ **Curriculum Slot Editor**: Manage section, weekday, period, faculty, and room allocations with atomic clash checking.',
          route: '/admin/slots',
          actionLabel: 'Open Slot Editor',
        };
      }

      // B. "Import CSV" / "Import timetable"
      if (q.includes('import') || q.includes('csv') || q.includes('upload timetable')) {
        navigate('/admin/import');
        return {
          spokenText: 'Opening CSV timetable importer. Drag and drop bulk curriculum schedules for atomic validation.',
          displayText: '📂 **CSV Timetable Importer**: Upload institutional timetable CSV with atomic database transaction safety.',
          route: '/admin/import',
          actionLabel: 'Open CSV Importer',
        };
      }

      // C. "Absence requests" / "Substitutions" / "Absences inbox"
      if (
        q.includes('absence') ||
        q.includes('substitut') ||
        q.includes('inbox') ||
        q.includes('pending leave')
      ) {
        navigate('/admin/absences');
        try {
          const list = await api.absences.list();
          const count = list ? list.length : 0;
          return {
            spokenText: `Navigating to Absences Inbox. There are currently ${count} recorded absence declarations.`,
            displayText: `📬 **Absences Inbox**: ${count} active faculty absence records. Review algorithmic substitute recommendations and confirm room allocations.`,
            route: '/admin/absences',
            actionLabel: 'View Absences',
          };
        } catch {
          return {
            spokenText: 'Opening Absences and Substitution Matching Inbox.',
            displayText: 'Navigated to **Absences Inbox**.',
            route: '/admin/absences',
            actionLabel: 'View Absences',
          };
        }
      }

      // D. "Go to analytics" / "Analytics dashboard" / "Show stats" / "Summary"
      if (
        q.includes('analytics') ||
        q.includes('stats') ||
        q.includes('dashboard') ||
        q.includes('overview') ||
        q.includes('utilization')
      ) {
        navigate('/admin');
        try {
          const [util, lowAtt] = await Promise.all([
            api.analytics.roomUtilization().catch(() => []),
            api.analytics.lowAttendance().catch(() => []),
          ]);
          const roomCount = util.length;
          const lowCount = lowAtt.length;

          const spoken = `Opening Academic Analytics Suite. Tracking ${roomCount} room allocations. ${lowCount} students flagged on low attendance watch list.`;
          return {
            spokenText: spoken,
            displayText: `📈 **Academic Analytics**: Tracking ${roomCount} campus rooms. ${lowCount} students flagged below 75% threshold.`,
            route: '/admin',
            actionLabel: 'View Analytics',
          };
        } catch {
          return {
            spokenText: 'Opening Academic Dean Analytics Suite.',
            displayText: 'Navigated to **Admin Analytics Suite**.',
            route: '/admin',
            actionLabel: 'View Analytics',
          };
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // FALLBACK GENERAL INTELLIGENCE / GREETING
    // ─────────────────────────────────────────────────────────────
    if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('who are you')) {
      const roleName = role.toLowerCase();
      return {
        spokenText: `Hello ${user.name}! I am ClassRadar AI assistant for your ${roleName} portal. How can I help you today?`,
        displayText: `👋 **Hello ${user.name}!** I am your ClassRadar Voice Assistant. You can speak or type to check classes, attendance, find vacant rooms, or navigate anywhere across the ${roleName} portal.`,
      };
    }

    if (q.includes('help') || q.includes('what can you do')) {
      let suggestions = '';
      if (role === 'STUDENT') {
        suggestions = 'Try asking: *"When is my next class?"*, *"Check my attendance"*, *"Scan QR"*, or *"Find free rooms"*';
      } else if (role === 'FACULTY') {
        suggestions = 'Try asking: *"When is my next lecture?"*, *"Open attendance session"*, *"Attendance history"*, or *"Find free rooms"*';
      } else {
        suggestions = 'Try asking: *"Show analytics"*, *"Open schedule management"*, *"Check absences"*, or *"Import CSV"*';
      }

      return {
        spokenText: 'I can help you navigate and query your schedule, attendance, and campus rooms.',
        displayText: `💡 **Assistant Capabilities (${role})**:\n${suggestions}`,
      };
    }

    // ─────────────────────────────────────────────────────────────
    // NVIDIA NIM POWERED CONVERSATIONAL AI REASONING (FALLBACK)
    // ─────────────────────────────────────────────────────────────
    try {
      // Gather relevant live context for the AI
      let liveContext = '';
      if (role === 'STUDENT') {
        const [todaySlots, attendance] = await Promise.all([
          api.timetable.me('2026-11-09').catch(() => []),
          api.attendance.summary().catch(() => []),
        ]);
        liveContext = `
Student Registered Subjects & Attendance:
${attendance.map((a) => `- ${a.subjectCode} (${a.subjectName}): ${a.attended}/${a.total} (${a.percent}%). Can skip: ${a.canSkip}, Must attend: ${a.mustAttend}`).join('\n')}

Student Today's Schedule:
${todaySlots.map((s) => `- Period ${s.period}: ${s.subjectCode} in ${s.roomName || 'Room 406'}`).join('\n')}
`;
      } else if (role === 'FACULTY') {
        const todaySlots = await api.timetable.me('2026-11-09').catch(() => []);
        liveContext = `
Faculty Teaching Schedule:
${todaySlots.map((s) => `- Period ${s.period}: ${s.subjectCode} for section ${s.sectionId || 'CSE-3F'} in ${s.roomName || 'Room 406'}`).join('\n')}
`;
      } else if (role === 'ADMIN') {
        const [util, lowAtt] = await Promise.all([
          api.analytics.roomUtilization().catch(() => []),
          api.analytics.lowAttendance().catch(() => []),
        ]);
        liveContext = `
Admin Live Institutional Metrics:
- Rooms monitored: ${util.length}
- Students with low attendance (<75%): ${lowAtt.length}
`;
      }

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
    } catch (e) {
      console.warn('NVIDIA AI fallback query failed:', e);
    }

    // Default polite response
    return {
      spokenText: `I heard: ${raw}. You can ask about your schedule, attendance, or free rooms.`,
      displayText: `I'm not sure how to handle "${raw}". Try asking about your **schedule**, **attendance**, **free rooms**, or say **"help"** for suggestions.`,
    };
  }
}
