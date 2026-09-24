/**
 * A forgiving daily streak: one free "rest day" per week. A missed day
 * never erases progress or shames her — it just resets the streak count,
 * unless a rest day is available to bridge the gap.
 */
export interface StreakState {
  lastActiveDate: string | null; // "YYYY-MM-DD"
  currentStreak: number;
  restDayUsedInWeek: string | null; // ISO week key, e.g. "2026-W07"
}

export const initialStreakState: StreakState = {
  lastActiveDate: null,
  currentStreak: 0,
  restDayUsedInWeek: null,
};

function toDate(iso: string): Date {
  const d = new Date(`${iso}T00:00:00Z`);
  return d;
}

function daysBetween(a: string, b: string): number {
  const ms = toDate(b).getTime() - toDate(a).getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

/** ISO 8601 week key, used to allow one rest day per calendar week. */
export function isoWeekKey(iso: string): string {
  const date = toDate(iso);
  const target = new Date(date.getTime());
  target.setUTCDate(target.getUTCDate() + 3 - ((target.getUTCDay() + 6) % 7));
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((target.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7,
    );
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function recordDailyActivity(state: StreakState, todayIso: string): StreakState {
  if (state.lastActiveDate === todayIso) {
    return state; // already recorded today
  }

  if (state.lastActiveDate === null) {
    return { lastActiveDate: todayIso, currentStreak: 1, restDayUsedInWeek: state.restDayUsedInWeek };
  }

  const gap = daysBetween(state.lastActiveDate, todayIso);
  const week = isoWeekKey(todayIso);

  if (gap === 1) {
    return { lastActiveDate: todayIso, currentStreak: state.currentStreak + 1, restDayUsedInWeek: state.restDayUsedInWeek };
  }

  if (gap === 2 && state.restDayUsedInWeek !== week) {
    // Bridge the missed day with this week's free rest day.
    return { lastActiveDate: todayIso, currentStreak: state.currentStreak + 1, restDayUsedInWeek: week };
  }

  // Bigger gap, or the rest day is already spent this week: streak restarts,
  // but nothing else about her progress is touched.
  return { lastActiveDate: todayIso, currentStreak: 1, restDayUsedInWeek: state.restDayUsedInWeek };
}
