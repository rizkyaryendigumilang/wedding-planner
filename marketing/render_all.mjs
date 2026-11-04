/**
 * Programmatic Remotion Renderer
 * Renders:
 * 1. 13 Instagram Stills (4:5 Carousel, 9:16 Story, 1:1 Square) -> marketing/out/
 * 2. 2 Full Overview Videos (9:16 Reels & 4:5 Feed MP4) -> marketing/out/
 * 3. 12 Clean Modular Scene Clips (6 Reels + 6 Feed without burned-in headline) -> marketing/concat-assets/
 *    so the user can edit text titles, reorder, trim, remove, or add clips manually inside Concat!
 */
import path from "node:path";
import fs from "node:fs";
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

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(concatAssetsDir, { recursive: true });

const STILLS = [
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
];

const VIDEOS = [
  { id: "OverviewReels", file: "overview-reels-9x16.mp4", dir: outDir },
  { id: "OverviewFeed", file: "overview-feed-4x5.mp4", dir: outDir },
];

const CONCAT_SCENE_VIDEOS = [
  ...VIDEO_SCENES.map((s, idx) => ({
    id: `ReelsSceneClean-${idx + 1}`,
    file: `reels-scene-0${idx + 1}-${s.id}.mp4`,
    dir: concatAssetsDir,
  })),
  ...VIDEO_SCENES.map((s, idx) => ({
    id: `FeedSceneClean-${idx + 1}`,
    file: `feed-scene-0${idx + 1}-${s.id}.mp4`,
    dir: concatAssetsDir,
  })),
];

async function main() {
  console.log("[1/4] Bundling Remotion project (marketing/remotion/index.js)...");
  const serveUrl = await bundle({
    entryPoint,
    publicDir,
  });
  console.log("  Bundle ready:", serveUrl);

  console.log(`[2/4] Rendering ${STILLS.length} Instagram Stills (4:5, 9:16, 1:1)...`);
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
    const kb = Math.round(fs.statSync(finalOut).size / 1024);
    console.log(`  OK  ${id.padEnd(22)} (${comp.width}x${comp.height}) -> ${kb} KB`);
  }

  console.log(`[3/4] Rendering ${VIDEOS.length} Full Overview Videos (H.264 MP4 @ 30fps)...`);
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
    console.log(`  OK  ${v.file.padEnd(26)} (${comp.width}x${comp.height}, ${comp.durationInFrames}f) -> ${mb} MB`);
  }

  console.log(`[4/4] Rendering ${CONCAT_SCENE_VIDEOS.length} Clean Modular Scene Clips for Concat Editor...`);
  for (const v of CONCAT_SCENE_VIDEOS) {
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
    console.log(`  OK  ${v.file.padEnd(34)} (${comp.width}x${comp.height}, ${comp.durationInFrames}f) -> ${mb} MB`);
  }

  console.log("All Remotion Stills, Full Videos, and Concat Modular Clips rendered!");
}

main().catch((err) => {
  console.error("Remotion render failed:", err);
  process.exit(1);
});
