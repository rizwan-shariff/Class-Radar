ClassRadar Person 2 - Implementation Plan
Modules to Build
Task 1: Realtime (src/modules/realtime/)
realtime.ts - Socket.IO setup with Redis adapter, JWT auth, room auto-join, event handlers, emitToRoom export
realtime.test.ts - Tests with socket.io-client
Task 2: Absence API (src/modules/absence/)
absence.ts - POST /absences, GET /absences?date= routes
absence.test.ts - Tests
Task 3: Suggestions (src/modules/substitution/)
substitution.ts - suggestSubstitutes() pure function + GET /absences/:id/suggestions route
substitution.test.ts - Unit tests for ranking logic
Task 4: Confirm Substitution (src/modules/substitution/)
POST /absences/:id/confirm route in substitution.ts
Task 5: Bookings (src/modules/booking/)
booking.ts - POST /bookings, DELETE /bookings/:id routes
booking.test.ts - Tests
Task 6: Analytics (src/modules/analytics/)
analytics.ts - GET /analytics/room-utilization, /analytics/low-attendance, /analytics/substitutions
analytics.test.ts - Tests
Task 7: Comprehensive tests for all edge cases
Key Types from Schema
User: id, role (STUDENT|FACULTY|ADMIN), department, sectionId
Absence: id, facultyId, date, periods[], reason, createdById
Substitution: id, absenceId, slotId, date, substituteFacultyId?, roomId, status (SUGGESTED|CONFIRMED)
Slot: id, sectionId, subjectId, facultyId, roomId, weekday(1-6), period(1-8)
RoomBooking: id, roomId, date, period, bookedById, purpose
Socket Events (from SPEC)
Server→Client: absence:created, timetable:changed, rooms:changed
Client→Server: join:rooms, join:session (faculty only)
Rooms
Auto-join: user:<id>, section:<sectionId> (students), admin (admins)
Faculty join: join:rooms → join rooms channel; join:session → join session channel