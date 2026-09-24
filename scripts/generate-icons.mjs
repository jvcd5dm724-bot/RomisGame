// One-off dev utility: renders app icons (Streetwear Pop themed) as PNGs
// using the pre-installed Chromium, since no image editor is available here.
// Uses the real raccoon illustration (src/assets/images/raccoon.svg,
// OpenMoji CC BY-SA 4.0 — see README Credits) rather than a text emoji, so
// the home-screen icon renders consistently instead of depending on the
// device's own emoji font.
import { chromium } from "@playwright/test";
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";

const OUT_DIR = new URL("../public/icons/", import.meta.url);
mkdirSync(OUT_DIR, { recursive: true });

const raccoonSvg = readFileSync(new URL("../src/assets/images/raccoon.svg", import.meta.url), "utf8");
const raccoonDataUri = `data:image/svg+xml;base64,${Buffer.from(raccoonSvg).toString("base64")}`;

function iconHtml(size, maskable) {
  const pad = maskable ? Math.round(size * 0.22) : Math.round(size * 0.1);
  return `<!doctype html><html><head><style>
    html,body{margin:0;padding:0;}
    .icon{width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;
      background:linear-gradient(135deg,#8b5cf6,#ff3d81);
      ${maskable ? "" : `border-radius:${Math.round(size * 0.22)}px;`}
    }
    img{width:${size - pad * 2}px;height:${size - pad * 2}px;}
  </style></head><body>
    <div class="icon"><img src="${raccoonDataUri}"></div>
  </body></html>`;
}

const targets = [
  { file: "icon-192.png", size: 192, maskable: false },
  { file: "icon-512.png", size: 512, maskable: false },
  { file: "icon-512-maskable.png", size: 512, maskable: true },
];

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage();

for (const t of targets) {
  await page.setViewportSize({ width: t.size, height: t.size });
  await page.setContent(iconHtml(t.size, t.maskable));
  const buf = await page.screenshot({ omitBackground: false });
  writeFileSync(new URL(t.file, OUT_DIR), buf);
  console.log(`wrote ${t.file}`);
}

await browser.close();
