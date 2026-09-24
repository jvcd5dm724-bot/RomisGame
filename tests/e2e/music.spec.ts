import { test, expect } from "@playwright/test";

test.describe("background music toggle", () => {
  test("is on by default, mutes on tap, and remembers the choice on reload", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByLabel("Music on/off");
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveText("🔊");

    await toggle.click();
    await expect(toggle).toHaveText("🔇");
    await page.screenshot({ path: "test-results/screenshots/music-toggle-muted.png" });

    await page.reload();
    await expect(page.getByLabel("Music on/off")).toHaveText("🔇");
  });
});
