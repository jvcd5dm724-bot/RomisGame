import { test, expect } from "@playwright/test";

test.describe("Episode 2 — reading, case file, translate", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Fast-forward: mark episode-01 completed so Mystery Channel opens episode-02.
    await page.evaluate(() => {
      const raw = localStorage.getItem("romi-progress-v1");
      const state = raw ? JSON.parse(raw) : {};
      state.episodeProgress = { "episode-01": { completed: true, currentStepIndex: -1 } };
      localStorage.setItem("romi-progress-v1", JSON.stringify(state));
    });
    await page.reload();
    await page.getByLabel("Mystery Channel").click();
  });

  test("collects clues into the visible case file as she progresses", async ({ page }) => {
    await expect(page.locator(".word-target")).toHaveText("dog");
    await expect(page.locator(".case-file-chip")).toHaveCount(0);

    await page.getByRole("button", { name: "Continue ▶" }).click();
    await expect(page.locator(".case-file-chip")).toHaveCount(1);
    await expect(page.locator(".case-file-chip").first()).toContainText("dog");
  });

  test("reading step shows the sentence and a working Hebrew translate toggle", async ({ page }) => {
    await page.getByRole("button", { name: "Continue ▶" }).click(); // -> blue
    await page.getByRole("button", { name: "Continue ▶" }).click(); // -> ball
    await page.getByRole("button", { name: "Continue ▶" }).click(); // -> reading step

    await expect(page.locator(".reading-sentence")).toHaveText("I have a blue ball.");
    await expect(page.locator(".reading-translation")).toBeHidden();

    await page.getByRole("button", { name: "🔤 Translate" }).click();
    await expect(page.locator(".reading-translation")).toBeVisible();
    await expect(page.locator(".reading-translation")).toContainText("כדור");
  });
});
