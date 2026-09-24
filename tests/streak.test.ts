import { describe, expect, it } from "vitest";
import { initialStreakState, recordDailyActivity } from "../src/progress/streak";

describe("daily streak", () => {
  it("starts the streak at 1 on the first play", () => {
    const state = recordDailyActivity(initialStreakState, "2026-01-01");
    expect(state.currentStreak).toBe(1);
  });

  it("does not double-count playing twice on the same day", () => {
    let state = recordDailyActivity(initialStreakState, "2026-01-01");
    state = recordDailyActivity(state, "2026-01-01");
    expect(state.currentStreak).toBe(1);
  });

  it("increments the streak on consecutive days", () => {
    let state = recordDailyActivity(initialStreakState, "2026-01-01");
    state = recordDailyActivity(state, "2026-01-02");
    state = recordDailyActivity(state, "2026-01-03");
    expect(state.currentStreak).toBe(3);
  });

  it("bridges one missed day per week with a free rest day", () => {
    let state = recordDailyActivity(initialStreakState, "2026-01-05"); // Monday
    state = recordDailyActivity(state, "2026-01-07"); // missed Tuesday, rest day used
    expect(state.currentStreak).toBe(2);
  });

  it("resets (never below 1) after missing the rest day too", () => {
    let state = recordDailyActivity(initialStreakState, "2026-01-05");
    state = recordDailyActivity(state, "2026-01-07"); // rest day used this week
    state = recordDailyActivity(state, "2026-01-10"); // another gap, same week, no rest day left
    expect(state.currentStreak).toBe(1);
  });

  it("grants a fresh rest day the following week", () => {
    let state = recordDailyActivity(initialStreakState, "2026-01-05"); // Mon wk1
    state = recordDailyActivity(state, "2026-01-07"); // rest day wk1 used, streak 2
    // Big gap into week 2 resets the streak, but that week's rest day is unused.
    state = recordDailyActivity(state, "2026-01-13"); // Tue wk2, streak resets to 1
    state = recordDailyActivity(state, "2026-01-15"); // gap 2, fresh rest day for wk2
    expect(state.currentStreak).toBe(2);
  });
});
