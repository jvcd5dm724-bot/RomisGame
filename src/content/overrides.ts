import type { HebrewHint } from "./types";
import { getState } from "../state/app-store";

/** Merges a parent's on-device approval/edit on top of the bundled Hebrew text. */
export function withHintOverride<T extends HebrewHint & { id: string }>(item: T): T {
  const override = getState().hintOverrides[item.id];
  if (!override) return item;
  return {
    ...item,
    he: override.he ?? item.he,
    he_help: override.he_help ?? item.he_help,
    he_reviewed: override.he_reviewed,
  };
}
