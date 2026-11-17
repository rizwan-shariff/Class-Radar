import { describe, expect, it } from 'vitest';

import { getEffectiveTimetable } from './timetable.js';

describe('getEffectiveTimetable', () => {
  it('applies a confirmed substitution and preserves cancellations', async () => {
    const dependencies = {
      slot: {
        findMany: async () => [
          {
            id: 'slot-1',
            sectionId: 'section-1',
            subjectId: 'subject-1',
            facultyId: 'faculty-1',
            roomId: 'room-1',
            weekday: 3,
            period: 2,
          },
          {
            id: 'slot-2',
            sectionId: 'section-1',
            subjectId: 'subject-2',
            facultyId: 'faculty-2',
            roomId: 'room-2',
            weekday: 3,
            period: 3,
          },
        ],
      },
      substitution: {
        findMany: async () => [
          {
            slotId: 'slot-1',
            date: new Date('2026-11-11T00:00:00.000Z'),
            substituteFacultyId: 'faculty-3',
            roomId: 'room-3',
            status: 'CONFIRMED' as const,
          },
          {
            slotId: 'slot-2',
            date: new Date('2026-11-11T00:00:00.000Z'),
            substituteFacultyId: null,
            roomId: 'room-2',
            status: 'CONFIRMED' as const,
          },
        ],
      },
    };

    const timetable = await getEffectiveTimetable(
      'section-1',
      '2026-11-11',
      dependencies,
    );

    expect(timetable[0]).toMatchObject({
      facultyId: 'faculty-3',
      roomId: 'room-3',
    });
    expect(timetable[1]).toMatchObject({
      facultyId: 'faculty-2',
      cancelled: true,
    });
  });
});
