import { test, expect } from "@playwright/test";

test.describe("Sign-in page", () => {
  test("renders without client manifest errors and shows form", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/sign-in", { waitUntil: "networkidle" });
    await expect(page).toHaveTitle(/sign|account/i, { timeout: 10_000 }).catch(() => { /* title may be generic */ });

    // No RSC client manifest errors
    const bad = errors.find((e) =>
      /React Client Manifest|could not find the module/i.test(e)
    );
    expect(bad, `Console errors: \n${errors.join("\n")}`).toBeFalsy();

    // Email/password fields + submit
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in|create account/i })).toBeVisible();
  });

  test("auth card is centered and capped; forgot is a link; no marketing chips", async ({ page }) => {
    await page.goto("/sign-in", { waitUntil: "networkidle" });

    // No marketing chips in header
    await expect(page.locator('header a[href="/create"]')).toHaveCount(0);
    await expect(page.locator('header a[href="/how-it-works"]')).toHaveCount(0);

    // Forgot password is an <a>, not a <button>
    const forgot = page.getByRole("link", { name: /forgot/i });
    await expect(forgot).toBeVisible();

    // Card exists and width <= 520
    const card = page.locator(".auth-card, .card").first();
    const box = await card.boundingBox();
    expect(box).toBeTruthy();
    if (box) expect(box.width).toBeLessThanOrEqual(520);

    // Submit button isn't white (rough check)
    const bgColor = await page.evaluate((el) => {
      const s = getComputedStyle(el as HTMLElement);
      return s.backgroundColor;
    }, await page.getByRole("button", { name: /sign in/i }).elementHandle());

    expect(bgColor).not.toMatch(/^rgb\(255,\s*255,\s*255\)$/);
  });

  test("can sign in (dev credentials) and redirect to /dashboard with session", async ({ page, context }) => {
    await page.goto("/sign-in");

    await page.locator('input[name="email"]').fill("runner@example.com");
    await page.locator('input[name="password"]').fill("devpass");
    await page.getByRole("button", { name: /sign in|create account/i }).click();

    // Redirect to dashboard
    await page.waitForURL(/\/dashboard/i, { timeout: 10_000 });

    // Auth.js session cookie should exist (name may vary)
    const cookies = await context.cookies();
    const hasAuthCookie = cookies.some((c) =>
      /authjs|next-auth|session/i.test(c.name)
    );
    expect(hasAuthCookie).toBeTruthy();

    // Dashboard renders something
    await expect(page.locator("body")).toContainText(/dashboard/i);
  });
});
