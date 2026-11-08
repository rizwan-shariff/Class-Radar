export type EffectiveTimetableDependencies = {
  slot: {
    findMany(args: {
      where: { sectionId: string; weekday: number };
      include?: object;
    }): Promise<EffectiveSlot[]>;
  };
  substitution: {
    findMany(args: {
      where: { slot: { sectionId: string }; date: Date; status: 'CONFIRMED' };
      include?: object;
    }): Promise<EffectiveSubstitution[]>;
  };
};

export type EffectiveSlot = {
  id: string;
  sectionId: string;
  subjectId: string;
  facultyId: string;
  roomId: string;
  weekday: number;
  period: number;
  [key: string]: unknown;
};

export type EffectiveSubstitution = {
  slotId: string;
  date: Date;
  substituteFacultyId: string | null;
  roomId: string;
  status: 'CONFIRMED';
  [key: string]: unknown;
};

const toUtcDate = (date: Date | string): Date =>
  date instanceof Date ? date : new Date(`${date}T00:00:00.000Z`);

const weekdayOf = (date: Date): number => {
  const weekday = date.getUTCDay();
  return weekday === 0 ? 7 : weekday;
};

export const getEffectiveTimetable = async (
  sectionId: string,
  date: Date | string,
  dependencies: EffectiveTimetableDependencies,
): Promise<EffectiveSlot[]> => {
  const effectiveDate = toUtcDate(date);
  const slots = await dependencies.slot.findMany({
    where: { sectionId, weekday: weekdayOf(effectiveDate) },
    include: { subject: true, faculty: true, room: true },
  });
  const substitutions = await dependencies.substitution.findMany({
    where: { slot: { sectionId }, date: effectiveDate, status: 'CONFIRMED' },
    include: { slot: true, substituteFaculty: true, room: true },
  });
  const substitutionsBySlot = new Map(
    substitutions.map((substitution) => [substitution.slotId, substitution]),
  );

  return slots.map((slot) => {
    const substitution = substitutionsBySlot.get(slot.id);
    if (!substitution) return slot;

    return {
      ...slot,
      facultyId: substitution.substituteFacultyId ?? slot.facultyId,
      roomId: substitution.roomId,
      cancelled: substitution.substituteFacultyId === null,
      substitution,
    };
  });
};
