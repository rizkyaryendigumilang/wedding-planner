import { Composition, Folder, Still } from "remotion";
import { SLIDES, VIDEO_SCENES } from "./data.js";
import { InstagramSlide } from "./InstagramSlide.jsx";
import { OverviewVideo } from "./OverviewVideo.jsx";

const TOTAL_VIDEO_FRAMES = VIDEO_SCENES.reduce(
  (acc, s) => acc + s.durationInFrames,
  0
);

export const RemotionRoot = () => {
  return (
    <>
      <Folder name="Videos">
        {/* 9:16 Instagram Reels / Story Video Overview (1080x1920 @ 30fps) */}
        <Composition
          id="OverviewReels"
          component={OverviewVideo}
          durationInFrames={TOTAL_VIDEO_FRAMES}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ format: "reels", singleSceneIndex: null, cleanText: false }}
        />

        {/* 4:5 Instagram Feed Video Overview (1080x1350 @ 30fps) */}
        <Composition
          id="OverviewFeed"
          component={OverviewVideo}
          durationInFrames={TOTAL_VIDEO_FRAMES}
          fps={30}
          width={1080}
          height={1350}
          defaultProps={{ format: "feed", singleSceneIndex: null, cleanText: false }}
        />

        {/* Clean Masters (No Headline Text) for fast slicing into Concat Modular Clips */}
        <Composition
          id="OverviewReelsClean"
          component={OverviewVideo}
          durationInFrames={TOTAL_VIDEO_FRAMES}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ format: "reels", singleSceneIndex: null, cleanText: true }}
        />

        <Composition
          id="OverviewFeedClean"
          component={OverviewVideo}
          durationInFrames={TOTAL_VIDEO_FRAMES}
          fps={30}
          width={1080}
          height={1350}
          defaultProps={{ format: "feed", singleSceneIndex: null, cleanText: true }}
        />
      </Folder>

      {/* Klip Adegan Modular Bersih (Tanpa Teks Judul) untuk Diedit Manual di Concat */}
      <Folder name="Concat-Editable-Clips">
        {VIDEO_SCENES.map((scene, idx) => (
          <Composition
            key={`reels-clean-${scene.id}`}
            id={`ReelsSceneClean-${idx + 1}`}
            component={OverviewVideo}
            durationInFrames={scene.durationInFrames}
            fps={30}
            width={1080}
            height={1920}
            defaultProps={{
              format: "reels",
              singleSceneIndex: idx,
              cleanText: true,
            }}
          />
        ))}
        {VIDEO_SCENES.map((scene, idx) => (
          <Composition
            key={`feed-clean-${scene.id}`}
            id={`FeedSceneClean-${idx + 1}`}
            component={OverviewVideo}
            durationInFrames={scene.durationInFrames}
            fps={30}
            width={1080}
            height={1350}
            defaultProps={{
              format: "feed",
              singleSceneIndex: idx,
              cleanText: true,
            }}
          />
        ))}
      </Folder>

      <Folder name="InstagramCarousel-4x5">
        {SLIDES.map((s, idx) => (
          <Still
            key={s.id}
            id={s.id}
            component={InstagramSlide}
            width={1080}
            height={1350}
            defaultProps={{ slideIndex: idx, format: "portrait" }}
          />
        ))}
      </Folder>

      <Folder name="InstagramStory-9x16">
        <Still
          id="story-01-cover"
          component={InstagramSlide}
          width={1080}
          height={1920}
          defaultProps={{ slideIndex: 0, format: "story" }}
        />
        <Still
          id="story-10-cta"
          component={InstagramSlide}
          width={1080}
          height={1920}
          defaultProps={{ slideIndex: 9, format: "story" }}
        />
      </Folder>

      <Folder name="InstagramSquare-1x1">
        <Still
          id="square-01-cover"
          component={InstagramSlide}
          width={1080}
          height={1080}
          defaultProps={{ slideIndex: 0, format: "square" }}
        />
      </Folder>
    </>
  );
};
