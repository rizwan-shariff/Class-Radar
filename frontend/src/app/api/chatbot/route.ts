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

    const systemPrompt = `You are ClassRadar AI Assistant, an institutional academic copilot.
User Info:
- Name: ${user?.name || 'Student/Faculty'}
- Role: ${user?.role || 'STUDENT'}
- Department: ${user?.department || 'CSE'}
- Active Section: ${user?.sectionId ? 'CSE-3F' : 'N/A'}

Live Context:
${context || 'No specific live context.'}

Role Rules:
- If user is STUDENT: They can check schedules, attendance, free rooms, and scan QR. They cannot edit timetables or mark faculty absent.
- If user is FACULTY: They can manage teaching schedules, QR sessions, mark themselves absent, or find free rooms. They cannot edit curriculum slots or import CSVs.
- 75% Rule: Institutional attendance threshold is 75%. If below, advise attending consecutive lectures.

Instructions:
Answer concisely in 2 to 4 sentences. Address the user directly by first name.
Do not output code blocks or markdown tables. Keep it conversational and informative.`;

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

    if (q.includes('attendance') || q.includes('bunk') || q.includes('percentage')) {
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
