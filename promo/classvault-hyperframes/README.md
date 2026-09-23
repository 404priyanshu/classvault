# ClassVault HyperFrames promo

This is a 23-second, 1920 × 1080, 30 fps launch promo for ClassVault. The final MP4 is at [`renders/classvault-promo.mp4`](renders/classvault-promo.mp4). The five scenes are editable HTML files in `compositions/`.

HyperFrames turns a composition's HTML into video. The root `index.html` places scene files and the audio track on a timed canvas with `data-start` and `data-duration`. Each scene owns a paused GSAP timeline that HyperFrames can seek to any frame. Its renderer captures the browser frame by frame and encodes an MP4 through FFmpeg.

## Reopen and render

From this folder:

```sh
npx hyperframes@0.8.61 preview --background
npm run check
npm run render -- --output renders/classvault-promo.mp4 --quality delivery --fps 30
```

The Studio opens at `http://localhost:3002/#project/classvault-hyperframes`. Stop the persistent preview with `npx hyperframes@0.8.61 preview --stop` when finished. Node.js 22+ and FFmpeg are required. The repository's root `package-lock.json` is untouched.

## Story and sources

The promo uses the current clubhouse identity and the public marketing page captured on 2026-09-23. The three feature plates in `assets/` are crops of the site's explicitly illustrative notes, roadmap, and room previews. The hero artwork is copied from the repository's `src/assets/study-clubhouse.webp`; `assets/classvault-bed.wav` is generated locally by `scripts/generate-audio.py`. The copy reflects shipped notes discovery, source-cited roadmaps, and shared-timer/chat rooms. The final card carries the current Bennett University early-access line.

`BRIEF.md` and `STORYBOARD.md` record the decisions. This first cut is landscape for a site embed or YouTube; a social portrait cut should recompose each scene, not just crop the rendered MP4.

Official references: [HyperFrames quickstart](https://hyperframes.heygen.com/quickstart), [product video workflow](https://hyperframes.heygen.com/guides/product-launch-video), [GSAP animation contract](https://hyperframes.heygen.com/guides/gsap-animation).
