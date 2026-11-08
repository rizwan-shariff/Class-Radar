export type RoomAvailabilityDependencies = {
  slot: {
    findFirst(args: {
      where: { roomId: string; weekday: number; period: number };
    }): Promise<{ id: string } | null>;
  };
  substitution: {
    findFirst(args: {
      where: {
        roomId: string;
        date: Date;
        status: 'CONFIRMED';
        slot: { weekday: number; period: number };
      };
    }): Promise<{ id: string } | null>;
  };
  roomBooking: {
    findUnique(args: {
      where: { roomId_date_period: { roomId: string; date: Date; period: number } };
    }): Promise<{ id: string } | null>;
  };
};

const toUtcDate = (date: Date | string): Date =>
  date instanceof Date ? date : new Date(`${date}T00:00:00.000Z`);

const weekdayOf = (date: Date): number => {
  const weekday = date.getUTCDay();
  return weekday === 0 ? 7 : weekday;
};

export const isRoomFree = async (
  roomId: string,
  date: Date | string,
  period: number,
  dependencies: RoomAvailabilityDependencies,
): Promise<boolean> => {
  const effectiveDate = toUtcDate(date);
  const weekday = weekdayOf(effectiveDate);
  const [slot, substitution, booking] = await Promise.all([
    dependencies.slot.findFirst({ where: { roomId, weekday, period } }),
    dependencies.substitution.findFirst({
      where: {
        roomId,
        date: effectiveDate,
        status: 'CONFIRMED',
        slot: { weekday, period },
      },
    }),
    dependencies.roomBooking.findUnique({
      where: { roomId_date_period: { roomId, date: effectiveDate, period } },
    }),
  ]);

  return !slot && !substitution && !booking;
};
