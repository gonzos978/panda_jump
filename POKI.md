# PandaJump on Poki

Branch: codex/poki. Standard Firebase builds remain available with npm run build.

- npm run dev:poki: Poki development mode.
- npm run build:poki: production web build in dist-poki.
- npm run test:poki: lifecycle, blocked storage, and release isolation checks (build first).
- npm run preview:poki: preview the production build.

The Poki build uses only the official Poki SDK externally. Firebase auth, online leaderboards and nickname collection are excluded. Scores, coins and upgrades remain local. Storage failures fall back to session memory with an in-game notice.

SDK events start on the first game-canvas tap, stop on pause/game over/menu, and resume after an optional commercial break. Commercial opportunities occur when resuming or retrying; audio and input are blocked until completion. No rewarded-ad mechanic is currently offered. Failed or blocked ads do not prevent continuing.

The game fills the viewport, retaining a 480-unit play corridor and extending scenery across landscape screens. Tall phones show additional vertical world. Resize preserves the run. No browser fullscreen request is used.

Before submitting:

- Run Poki Inspector against the uploaded build and verify SDK event order, real ads, audio, and CSP.
- Playtest desktop 640x360, 836x470 and 1031x580, phones and tablets, including rotation and blocked storage.
- Prepare static and animated thumbnails; confirm all artwork, animation, music and sound licenses permit commercial distribution. Retain AI creation and editing records where applicable.
- Review developer terms yourself. Upload the CONTENTS of dist-poki with index.html at the archive root, then request moderation/playtesting in Poki for Developers.
- Poki review and acceptance are required; a locally passing build is not certification.

Official references:
https://developers.poki.com/guide/sdk-html5
https://developers.poki.com/guide/requirements-quality
https://developers.poki.com/guide/content-player-safety
https://developers.poki.com/guide/external-resources-policy
