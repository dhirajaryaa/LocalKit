import { copyFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const jobs: Array<[string, string]> = [
  ["node_modules/pdfjs-dist/build/pdf.worker.min.mjs", "public/pdf.worker.min.mjs"],
  ["node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.js", "public/ffmpeg/ffmpeg-core.js"],
  ["node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.wasm", "public/ffmpeg/ffmpeg-core.wasm"],
  ["node_modules/@ffmpeg/ffmpeg/dist/esm/worker.js", "public/ffmpeg/ffmpeg-worker.js"],
  ["node_modules/@ffmpeg/ffmpeg/dist/esm/const.js", "public/ffmpeg/const.js"],
  ["node_modules/@ffmpeg/ffmpeg/dist/esm/errors.js", "public/ffmpeg/errors.js"],
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
