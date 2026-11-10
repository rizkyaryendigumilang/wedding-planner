/**
 * Programmatic Remotion Renderer
 * Renders:
 * 1. 2 Full Live-Browser Overview Videos (9:16 Reels & 4:5 Feed MP4, 40s / 1200 frames) -> marketing/out/
 * 2. 24 Clean Modular Scene Clips (12 Reels + 12 Feed without burned-in headline) -> marketing/concat-assets/
 *    so the user can edit text titles, reorder, trim, remove, or add clips manually inside Concat!
 */
import path from "node:path";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { VIDEO_SCENES } from "./remotion/data.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const entryPoint = path.join(__dirname, "remotion", "index.js");
const outDir = path.join(__dirname, "out");
const concatAssetsDir = path.join(__dirname, "concat-assets");
const publicDir = path.join(projectRoot, "public");
const ffmpegBin = path.join(
  projectRoot,
  "node_modules",
  "@remotion",
  "compositor-win32-x64-msvc",
  "ffmpeg.exe"
);

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(concatAssetsDir, { recursive: true });

const STILLS = process.env.RENDER_STILLS
  ? [
      "ig-01-cover",
      "ig-02-dasbor",
      "ig-03-anggaran",
      "ig-04-tamu",
      "ig-05-resepsi",
      "ig-06-rundown",
      "ig-07-vendor",
      "ig-08-admin-seserahan",
      "ig-09-kado-privasi",
      "ig-10-cta",
      "story-01-cover",
      "story-10-cta",
      "square-01-cover",
    ]
  : [];

const VIDEOS = [
  { id: "OverviewReels", file: "overview-reels-9x16.mp4", dir: outDir },
  { id: "OverviewFeed", file: "overview-feed-4x5.mp4", dir: outDir },
  { id: "OverviewReelsClean", file: "_clean_master_reels.mp4", dir: concatAssetsDir },
  { id: "OverviewFeedClean", file: "_clean_master_feed.mp4", dir: concatAssetsDir },
];

function sliceScenesFromMaster(masterPath, prefix) {
  let cursorFrames = 0;
  VIDEO_SCENES.forEach((scene, idx) => {
    const startSec = cursorFrames / 30;
    const durSec = scene.durationInFrames / 30;
    cursorFrames += scene.durationInFrames;
    const outName = `${prefix}-scene-${String(idx + 1).padStart(2, "0")}-${scene.id}.mp4`;
    const outPath = path.join(concatAssetsDir, outName);
    execFileSync(
      ffmpegBin,
      [
        "-y",
        "-ss",
        startSec.toFixed(4),
        "-t",
        durSec.toFixed(4),
        "-i",
        masterPath,
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        "-an",
        outPath,
      ],
      { stdio: "ignore" }
    );
    const mb = (fs.statSync(outPath).size / (1024 * 1024)).toFixed(2);
    console.log(`  OK  ${outName.padEnd(42)} (${scene.durationInFrames}f) -> ${mb} MB`);
  });
}

async function main() {
  console.log("[1/3] Bundling Remotion project (marketing/remotion/index.js)...");
  const serveUrl = await bundle({
    entryPoint,
    publicDir,
  });
  console.log("  Bundle ready:", serveUrl);

  if (STILLS.length > 0) {
    console.log(`Rendering ${STILLS.length} Instagram Stills...`);
    for (const id of STILLS) {
      const comp = await selectComposition({ serveUrl, id });
      const tmpOut = path.join(outDir, `_tmp_${id}.png`);
      const finalOut = path.join(outDir, `${id}.png`);
      await renderStill({
        composition: comp,
        serveUrl,
        output: tmpOut,
        imageFormat: "png",
      });
      fs.copyFileSync(tmpOut, finalOut);
      fs.unlinkSync(tmpOut);
    }
  }

  console.log(`[2/3] Rendering Live-Browser Overview Videos (9:16 Reels & 4:5 Feed)...`);
  for (const v of VIDEOS) {
    const comp = await selectComposition({ serveUrl, id: v.id });
    const tmpOut = path.join(v.dir, `_tmp_${v.file}`);
    const finalOut = path.join(v.dir, v.file);
    await renderMedia({
      composition: comp,
      serveUrl,
      codec: "h264",
      outputLocation: tmpOut,
    });
    fs.copyFileSync(tmpOut, finalOut);
    fs.unlinkSync(tmpOut);
    const mb = (fs.statSync(finalOut).size / (1024 * 1024)).toFixed(2);
    console.log(`  OK  ${v.file.padEnd(28)} (${comp.width}x${comp.height}, ${comp.durationInFrames}f) -> ${mb} MB`);
  }

  console.log(`[3/3] Slicing 24 Clean Modular Scene Clips for Concat Editor...`);
  sliceScenesFromMaster(path.join(concatAssetsDir, "_clean_master_reels.mp4"), "reels");
  sliceScenesFromMaster(path.join(concatAssetsDir, "_clean_master_feed.mp4"), "feed");

  console.log("All Live-Browser Videos and Concat Modular Clips rendered!");
}

main().catch((err) => {
  console.error("Remotion render failed:", err);
  process.exit(1);
});
