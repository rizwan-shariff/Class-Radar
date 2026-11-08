Problem. In most colleges the timetable is a static PDF shared on WhatsApp. When a faculty member is absent, students find out late and the slot is wasted. Nobody knows which rooms and labs are free. Paper attendance eats class time and is easy to proxy. Students cannot see how close they are to the 75% attendance cutoff until it is too late.

Solution. ClassRadar is a responsive web app (installable PWA) that keeps the academic schedule live, automates substitution and room allocation, and replaces proxy-prone attendance with rotating, signed QR codes.

Roles
• Student: views own timetable, finds free rooms, scans the attendance QR, sees attendance per subject and the bunk calculator.
• Faculty: views own timetable, marks self absent, starts attendance sessions, books free rooms, watches a live attendance counter.
• Admin: imports the timetable, confirms substitutions, sees analytics.

Features and acceptance criteria
1. F1 Timetable. Admin imports a CSV (department, section, day, period, subject, faculty, room). Students and faculty see a weekly grid and a "today" view. Saving a slot that double-books a faculty member, a room or a section is rejected with a clear error.
2. F2 Absence and substitution. Faculty or admin marks a faculty member absent for a date and one or more periods. The system suggests substitutes (free faculty in the same department, fewest substitutions this week first) and a free room. Admin confirms; affected students see the change live in under 2 seconds, with a banner on their timetable.
3. F3 Free-room finder. Anyone can ask "which rooms are free now, or on day X period Y?", filtered by type (classroom or lab) and capacity. Faculty can book a free room for one period.
4. F4 QR attendance. Faculty starts a session for a slot. The screen shows a QR containing a signed token that rotates every 15 seconds and is accepted for 20 seconds. A student scan is valid only if the signature and expiry check out, the student belongs to that section, the session is open, and the student has not already marked. The faculty screen shows a live counter. Faculty can manually override a student's status.
5. F5 Student attendance and bunk calculator. For each subject show attended, total and percentage. If the student is at or above 75%, show how many classes they can still skip. If below, show how many consecutive classes they must attend to recover.
6. F6 Admin analytics. Room utilization percentage per room per week, students below 75% by subject, and substitution count per faculty.

Business rules
• Week is Monday to Saturday with 8 periods per day (configurable constants).
• Attendance threshold is 75% (environment variable ATTENDANCE_THRESHOLD).
• Bunk calculator with attended a and total t: classes that can be skipped = Floor(4a/3-t); consecutive classes needed to recover = ceil(3t-4a). Both need unit tests.
• QR token: JWT (HS256) with claims sessionId, nonce, exp. One successful scan per student per session.
• All write endpoints enforce role checks on the server; the UI hiding a button is not security.

Non-functional requirements
• Schedule changes reach connected clients in under 2 seconds.
• Everything runs with one command: docker compose up.
• Automated tests for clash detection, substitute suggestion, token verification and the bunk calculator.
• A seed script loads one real department timetable plus about 60 demo students.

Out of scope
Events, fees, exams, grades and native mobile apps. Another team owns campus event management; ClassRadar is only about the core academic schedule and attendance.