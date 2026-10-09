import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
const browser = await chromium.launch({ headless: true });
await mkdir("screenshots", { recursive: true });
for (const [name, width, height] of [
  ["desktop", 1448, 1086],
  ["mobile", 390, 844],
  ["small", 320, 740],
]) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", () => errors.push("pageerror"));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text().slice(0, 160));
  });
  await page.goto(process.argv[2] || "http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "screenshots/" + name + ".png", fullPage: true });
  console.log(
    JSON.stringify({
      name,
      title: await page.title(),
      overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      errors,
    }),
  );
  await page.close();
}
await browser.close();
