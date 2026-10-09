import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("form, privacy and no false sending", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("a little bird");
  await expect(page.getByLabel("Recipient 1 email")).toBeVisible();
  await page.getByLabel("Recipient 1 email").fill("test@example.com");
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: "+ add another" }).click();
  await expect(page.locator('input[type="email"]')).toHaveCount(5);
  await expect(page.getByRole("button", { name: "+ add another" })).toHaveCount(0);
  await page.getByRole("button", { name: "Remove recipient 5" }).click();
  await expect(page.locator('input[type="email"]')).toHaveCount(4);
  await page.getByLabel("what would you like to say?").fill("🌿".repeat(1001));
  await expect(page.getByLabel("what would you like to say?")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.getByRole("button", { name: "let it fly" })).toBeDisabled();
  await expect(page.getByText("Sending isn’t available just yet.")).toBeVisible();
  await expect(page.getByRole("link", { name: "read a message" })).toHaveCount(0);
});
test("mobile controls reflow with five recipients", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: "+ add another" }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByLabel("Recipient 5 email")).toBeVisible();
  await expect(page.getByLabel("what would you like to say?")).toBeVisible();
});
test("recipient links do not mutate on GET", async ({ page, request }) => {
  const posts: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") posts.push(r.url());
  });
  await page.goto("/opt-out#token=invalid");
  await expect(page.getByRole("button", { name: "Stop future emails", exact: true })).toBeVisible();
  await expect(page).not.toHaveURL(/token/);
  expect(posts).toEqual([]);
  await page.getByRole("button", { name: "Stop future emails", exact: true }).click();
  await expect(page.getByText("That link isn't valid.", { exact: false })).toBeVisible();
  expect((await request.get("/read")).status()).toBe(404);
  const response = await request.post("/api/send", { data: { message: "no" } });
  expect(response.status()).toBe(503);
});
test("automated accessibility", async ({ page }) => {
  await page.goto("/");
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(result.violations).toEqual([]);
});
