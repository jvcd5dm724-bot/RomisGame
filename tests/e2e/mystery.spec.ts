import { test, expect } from "@playwright/test";

test.describe("Romi's English Adventure — smoke test", () => {
  test("home screen shows the TV with the Mystery Channel active", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Pick a channel!")).toBeVisible();
    await expect(page.getByLabel("Mystery Channel")).toBeVisible();
    await page.screenshot({ path: "test-results/screenshots/home.png" });
  });

  test("Mystery Channel plays the first episode step", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Mystery Channel").click();
    await expect(page.locator(".word-target")).toHaveText("cookie");
    await page.screenshot({ path: "test-results/screenshots/mystery-intro-step.png" });

    await page.getByRole("button", { name: "Continue ▶" }).click();
    await expect(page.locator(".word-target")).toHaveText("red");
  });

  test("hint button cycles through Hebrew meaning and help", async ({ page }) => {
    await page.goto("/#/mystery");
    const hint = page.getByLabel("עזרה בעברית");
    await expect(hint).toBeVisible();
    await hint.click();
    await expect(page.locator(".hint-panel")).toBeVisible();
    await page.screenshot({ path: "test-results/screenshots/hint-open.png" });
  });
});
