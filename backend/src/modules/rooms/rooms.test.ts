import { describe, expect, it } from 'vitest';

import { isRoomFree } from './rooms.js';

describe('isRoomFree', () => {
  it('returns false for each busy source', async () => {
    const base = {
      slot: { findFirst: async () => null as { id: string } | null },
      substitution: { findFirst: async () => null as { id: string } | null },
      roomBooking: { findUnique: async () => null as { id: string } | null },
    };

    expect(await isRoomFree('room-1', '2026-11-11', 2, {
      ...base,
      slot: { findFirst: async () => ({ id: 'slot-1' }) },
    })).toBe(false);
    expect(await isRoomFree('room-1', '2026-11-11', 2, {
      ...base,
      substitution: { findFirst: async () => ({ id: 'sub-1' }) },
    })).toBe(false);
    expect(await isRoomFree('room-1', '2026-11-11', 2, {
      ...base,
      roomBooking: { findUnique: async () => ({ id: 'booking-1' }) },
    })).toBe(false);
  });

  it('returns true when no source reports a conflict', async () => {
    expect(await isRoomFree('room-1', '2026-11-11', 2, {
      slot: { findFirst: async () => null },
      substitution: { findFirst: async () => null },
      roomBooking: { findUnique: async () => null },
    })).toBe(true);
  });
});
