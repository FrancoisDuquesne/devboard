import { spawn } from "node:child_process";
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const PORT = 3099;
const BASE = `http://localhost:${PORT}`;
const WORK_DIR = join(import.meta.dirname, "screenshots");
const OUT_DIR = join(import.meta.dirname, "..", "docs", "screenshots");
const VIEWPORT = { width: 1440, height: 900 };
const SETTLE_MS = 2500;

mkdirSync(WORK_DIR, { recursive: true });

// ── Start dev server ─────────────────────────────────────────────
console.log("Starting dev server on port", PORT);

const server = spawn("npx", ["nuxt", "dev", "--no-fork", "--port", String(PORT)], {
  env: { ...process.env, DEMO_MODE: "true" },
  stdio: ["ignore", "pipe", "pipe"],
  cwd: join(import.meta.dirname, ".."),
});

function cleanup() {
  server.kill();
}

process.on("SIGINT", () => {
  cleanup();
  process.exit(130);
});
process.on("SIGTERM", () => {
  cleanup();
  process.exit(143);
});

async function waitForServer(url: string, timeout = 60_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Server did not start within ${timeout}ms`);
}

async function run() {
  await waitForServer(`${BASE}/api/gitlab/status`);
  console.log("Server ready");

  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: VIEWPORT });

    async function screenshot(
      name: string,
      setup: (p: Awaited<ReturnType<typeof context.newPage>>) => Promise<void>,
    ) {
      const page = await context.newPage();
      await setup(page);
      await page.screenshot({ path: join(WORK_DIR, name), fullPage: false });
      console.log(`  ✓ ${name}`);
      await page.close();
    }

    // Helper: set localStorage before navigating
    async function navigate(
      page: Awaited<ReturnType<typeof context.newPage>>,
      opts: { theme: "dark" | "light" },
    ) {
      await page.goto(BASE, { waitUntil: "domcontentloaded" });
      await page.evaluate((theme) => {
        localStorage.setItem("nuxt-color-mode", theme);
        localStorage.setItem("devboard:has-seen-welcome", "true");
        localStorage.setItem("devboard:worktrees-enabled", "true");
      }, opts.theme);
      await page.goto(BASE, { waitUntil: "networkidle" });
    }

    async function waitForGraph(page: Awaited<ReturnType<typeof context.newPage>>) {
      await page.waitForSelector(".vue-flow__node", { timeout: 15_000 });
      await page.waitForTimeout(SETTLE_MS);
    }

    // ── Scene 1: Graph (dark) — hero image ───────────────────────
    console.log("Capturing scenes...");

    await screenshot("graph-dark.png", async (page) => {
      await navigate(page, { theme: "dark" });
      await waitForGraph(page);
    });

    // ── Scene 2: Graph (light) ───────────────────────────────────
    await screenshot("graph-light.png", async (page) => {
      await navigate(page, { theme: "light" });
      await waitForGraph(page);
    });

    // ── Scene 3: Detail drawer — click MR !42 node ──────────────
    await screenshot("drawer-open.png", async (page) => {
      await navigate(page, { theme: "dark" });
      await waitForGraph(page);
      const node = page.locator('[data-id="1042"]');
      if (!(await node.count())) {
        throw new Error("MR node [data-id=\"1042\"] not found — drawer screenshot will be wrong");
      }
      await node.click();
      await page.waitForTimeout(800);
    });

    // ── Scene 4: Search palette ──────────────────────────────────
    await screenshot("search-open.png", async (page) => {
      await navigate(page, { theme: "dark" });
      await waitForGraph(page);
      await page.keyboard.press("Control+k");
      await page.waitForTimeout(500);
      await page.keyboard.type("graphql", { delay: 80 });
      await page.waitForTimeout(400);
    });

    // ── Scene 5: Todo panel ──────────────────────────────────────
    await screenshot("todo-panel.png", async (page) => {
      await navigate(page, { theme: "dark" });
      await waitForGraph(page);
      await page.keyboard.press("t");
      await page.waitForTimeout(800);
    });

    // ── Scene 6: Worktree panel ──────────────────────────────────
    await screenshot("worktree-panel.png", async (page) => {
      await navigate(page, { theme: "dark" });
      await waitForGraph(page);
      await page.keyboard.press("w");
      await page.waitForTimeout(800);
    });

    // ── Scene 7: Help modal ──────────────────────────────────────
    await screenshot("help.png", async (page) => {
      await navigate(page, { theme: "dark" });
      await waitForGraph(page);
      await page.keyboard.press("?");
      await page.waitForTimeout(600);
    });

    // ── Scene 8: Annotation toolbar with a sticky note ──────────
    await screenshot("annotations.png", async (page) => {
      await navigate(page, { theme: "dark" });
      await waitForGraph(page);
      // Select sticky note tool via keyboard
      await page.keyboard.press("n");
      await page.waitForTimeout(300);
      // Click on the graph pane to place a sticky note
      await page.mouse.click(700, 400);
      await page.waitForTimeout(500);
      // Double-click to edit, type some markdown
      const sticky = page.locator(".vue-flow__node [class*=group\\/sticky]").first();
      if (await sticky.count()) {
        await sticky.dblclick();
        await page.waitForTimeout(200);
        await page.keyboard.type("## Sprint goal\n- Ship subscriptions API\n- Fix pipeline", { delay: 30 });
        // Click away to finish editing
        await page.mouse.click(400, 200);
        await page.waitForTimeout(300);
      }
      // Switch to freehand tool to show the toolbar active
      await page.keyboard.press("p");
      await page.waitForTimeout(400);
    });
  } finally {
    await browser.close();
  }

  // Clean output dir and copy fresh screenshots
  rmSync(OUT_DIR, { recursive: true, force: true });
  cpSync(WORK_DIR, OUT_DIR, { recursive: true });
  console.log(`\nAll screenshots saved to ${OUT_DIR}`);
}

run()
  .catch((err) => {
    console.error("Screenshot capture failed:", err);
    process.exitCode = 1;
  })
  .finally(() => {
    cleanup();
  });
