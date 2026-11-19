import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt, user, context } = await req.json();

    const apiKey =
      process.env.NVIDIA_API_KEY ||
      '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';
    const model =
      process.env.NEXT_PUBLIC_NVIDIA_MODEL || 'nvidia/nemotron-3.5-lightning-30b-a3b';

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const systemPrompt = `You are ClassRadar AI Assistant, an institutional academic copilot with full access to institutional academic data.
User Info:
- Name: ${user?.name || 'Student/Faculty'}
- Role: ${user?.role || 'STUDENT'}
- Department: ${user?.department || 'CSE'}
- Active Section: ${user?.sectionId ? 'CSE-3F' : 'N/A'}

Live Context & Academic Data:
${context || 'No specific live context.'}

Role Capabilities & Permissions:
- If user is STUDENT: They can check schedules, live attendance percentages, bunk limits, upcoming assignment & project submission deadlines, free campus rooms, and launch the QR scanner. If they ask about submissions or deadlines, explain their exact deadlines, due dates, subjects, urgency status, and remind them that they can view/open their submissions directly.
- If user is FACULTY: They can manage teaching schedules, launch QR sessions, mark absences, find free rooms, and manage/finalize/extend assignment & project submission deadlines.
- 75% Rule: Institutional attendance threshold is 75%. If below, advise attending consecutive lectures.

Instructions:
Answer accurately, helpfully, and concisely in 2 to 4 sentences using the provided Live Context data. Address the user directly by first name.
Do not output code blocks or markdown tables. Keep it conversational, confident, and informative.`;

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('NVIDIA NIM API Error:', errText);
      return NextResponse.json(
        { error: `NVIDIA NIM Error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Route detection based on keywords in user prompt
    const q = prompt.toLowerCase();
    let detectedRoute: string | null = null;
    let detectedLabel: string | null = null;

    if (
      q.includes('deadline') ||
      q.includes('submission') ||
      q.includes('assignment') ||
      q.includes('project') ||
      q.includes('homework') ||
      q.includes('due date')
    ) {
      detectedRoute = user?.role === 'FACULTY' ? '/faculty/deadlines' : '/student/deadlines';
      detectedLabel = user?.role === 'FACULTY' ? 'Manage Deadlines' : 'View Deadlines';
    } else if (q.includes('attendance') || q.includes('bunk') || q.includes('percentage')) {
      detectedRoute = user?.role === 'FACULTY' ? '/faculty/history' : '/student/attendance';
      detectedLabel = user?.role === 'FACULTY' ? 'View Attendance History' : 'View Attendance';
    } else if (q.includes('room') || q.includes('lab') || q.includes('empty') || q.includes('vacant')) {
      detectedRoute = '/rooms';
      detectedLabel = 'Find Free Rooms';
    } else if (q.includes('scan') || q.includes('qr')) {
      detectedRoute = user?.role === 'FACULTY' ? '/faculty/session' : '/student/scan';
      detectedLabel = user?.role === 'FACULTY' ? 'Launch QR Session' : 'Open Scanner';
    } else if (q.includes('schedule') || q.includes('class') || q.includes('lecture') || q.includes('timetable')) {
      detectedRoute = user?.role === 'FACULTY' ? '/faculty' : '/student';
      detectedLabel = 'View Timetable';
    } else if (user?.role === 'ADMIN' && (q.includes('analytic') || q.includes('stat'))) {
      detectedRoute = '/admin';
      detectedLabel = 'View Analytics';
    } else if (user?.role === 'ADMIN' && q.includes('slot')) {
      detectedRoute = '/admin/slots';
      detectedLabel = 'Open Slot Editor';
    } else if (user?.role === 'ADMIN' && q.includes('absence')) {
      detectedRoute = '/admin/absences';
      detectedLabel = 'View Absences';
    }

    const cleanSpoken = content
      .replace(/[*_#`[\]()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return NextResponse.json({
      displayText: content || 'I have analyzed your academic query.',
      spokenText: cleanSpoken || 'I have analyzed your academic query.',
      route: detectedRoute,
      actionLabel: detectedLabel,
    });
  } catch (error: any) {
    console.error('Chatbot API route error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
