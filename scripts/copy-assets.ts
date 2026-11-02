import { copyFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const jobs: Array<[string, string]> = [
  ["node_modules/pdfjs-dist/build/pdf.worker.min.mjs", "public/pdf.worker.min.mjs"],
  ["node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.js", "public/ffmpeg/ffmpeg-core.js"],
  ["node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.wasm", "public/ffmpeg/ffmpeg-core.wasm"],
];

for (const [from, to] of jobs) {
  const source = join(root, from);
  const target = join(root, to);
  if (!existsSync(source)) {
    console.warn(`[assets] missing ${from}`);
    continue;
  }
  await mkdir(join(target, ".."), { recursive: true });
  await copyFile(source, target);
  console.log(`[assets] ${from} -> ${to}`);
}
