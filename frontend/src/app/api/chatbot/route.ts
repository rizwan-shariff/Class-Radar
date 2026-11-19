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

    const systemPrompt = `You are ClassRadar AI Assistant, an institutional academic copilot for NIE North Campus with complete, real-time access to the student and faculty academic database.
User Info:
- Name: ${user?.name && user.name !== 'PRITAM' ? user.name : 'Student'}
- Role: ${user?.role || 'STUDENT'}
- Department: ${user?.department || 'CSE'}
- Active Section: ${user?.sectionId ? 'CSE-3F' : 'N/A'}

Live Institutional Academic Context & Timetable Data:
${context || 'No specific live context available.'}

Critical Instructions:
1. NEVER output generic brush-offs like "Here is the academic information you requested".
2. When the user asks about timetable, schedules, today's or tomorrow's classes, attendance, deadlines, or free rooms, you MUST inspect the Live Institutional Academic Context provided above and list out the exact details:
   - For classes/timetable: State the exact Period, Subject Code, Subject Name, and Room (e.g. "Period 1: 1BMAT301 in Room 406").
   - For attendance: State their exact attendance percentage, classes attended/total, and exact bunk headroom or classes they must attend.
   - For deadlines: State the course, assignment title, and exact due date.
   - For rooms: State the list of currently vacant rooms and labs.
3. Be direct, comprehensive, and helpful in 2 to 4 informative sentences. Do not hide the data.
4. Do not output markdown code blocks. Keep it conversational, confident, and direct.`;

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
        temperature: 0.2,
        max_tokens: 2048,
        chat_template_kwargs: { thinking: false },
      }),
    });

    console.log('NVIDIA NIM Response Status:', response.status);

    if (!response.ok) {
      const errText = await response.text();
      console.error('NVIDIA NIM API Error:', errText);
      return NextResponse.json(
        { error: `NVIDIA NIM Error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('NVIDIA NIM Raw Output:', JSON.stringify(data.choices?.[0]?.message));
    
    // Extract clean content (NEVER expose internal thinking/reasoning traces to the user)
    let content = data.choices?.[0]?.message?.content || '';

    // If content is empty or contains reasoning prefix artifacts, clean it thoroughly
    if (!content && data.choices?.[0]?.message?.reasoning_content) {
      // Strip any "Here's a thinking process:" chain-of-thought blocks
      const rawReasoning = data.choices[0].message.reasoning_content;
      const stripped = rawReasoning
        .replace(/Here's a thinking process:[\s\S]*?(Draft:|Response:|Output:|$)/i, '')
        .replace(/^[\s\S]*?(Draft:|Response:|Output:)/i, '')
        .trim();
      content = stripped;
    }

    // Double safety check: strip any remaining thinking process text
    if (content.includes("Here's a thinking process:")) {
      content = content.replace(/Here's a thinking process:[\s\S]*?\n\n/i, '').trim();
    }

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
    } else if (q.includes('schedule') || q.includes('class') || q.includes('lecture') || q.includes('timetable') || q.includes('tomorrow') || q.includes('today')) {
      detectedRoute = user?.role === 'FACULTY' ? '/faculty' : '/student/timetable';
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
      displayText: content || 'Here is the academic information you requested.',
      spokenText: cleanSpoken || 'Here is the academic information you requested.',
      route: detectedRoute,
      actionLabel: detectedLabel,
    });
  } catch (error: any) {
    console.error('Chatbot API route error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
