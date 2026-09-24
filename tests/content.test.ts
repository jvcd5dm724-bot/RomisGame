import { describe, expect, it } from "vitest";
import { validateContent } from "../src/content/validate";

describe("content validation", () => {
  it("has no missing Hebrew hints", () => {
    expect(validateContent()).toEqual([]);
  });
});
