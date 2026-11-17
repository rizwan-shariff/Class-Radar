import { describe, expect, it } from 'vitest';

import { detectSlotClashes, type SlotInput } from './timetable.js';

const slot = (overrides: Partial<SlotInput> = {}): SlotInput => ({
  sectionId: 'section-1',
  subjectId: 'subject-1',
  facultyId: 'faculty-1',
  roomId: 'room-1',
  weekday: 1,
  period: 1,
  ...overrides,
});

describe('detectSlotClashes', () => {
  it('detects faculty, room, and section clashes at the same time', () => {
    const errors = detectSlotClashes(
      [
        slot({ facultyId: 'faculty-1' }),
        slot({ sectionId: 'section-2', roomId: 'room-2' }),
        slot({ sectionId: 'section-3', facultyId: 'faculty-3', roomId: 'room-1' }),
      ],
      slot({ sectionId: 'section-4', facultyId: 'faculty-1', roomId: 'room-1' }),
    );

    expect(errors).toHaveLength(2);
    expect(errors.join(' ')).toContain('Faculty');
    expect(errors.join(' ')).toContain('Room');
  });

  it('ignores slots at another weekday or period', () => {
    expect(
      detectSlotClashes(
        [slot({ weekday: 2 }), slot({ period: 2 })],
        slot(),
      ),
    ).toEqual([]);
  });
});
