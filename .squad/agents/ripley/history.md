# Project Context

- **Owner:** Jose Corral
- **Project:** 2D pixel art pinball game in HTML5, inspired by Microsoft 3D Pinball Space Cadet
- **Stack:** HTML5 Canvas, JavaScript, pixel art assets
- **Theme:** Classic pinball — flippers, bumpers, ramps, scoring, space/retro aesthetic
- **Inspiration:** Microsoft 3D Pinball Space Cadet — nostalgic, fun, arcade feel
- **Created:** 2026-03-12

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

### Architecture (2026-03-12)
- **Module structure**: 8 ES modules in `src/`, zero build tools. Entry point: `index.html` → `src/game.js`.
- **Physics**: 120Hz fixed-timestep (`1/120`), semi-implicit Euler. Gravity = 900 px/s². Ball max speed 1400 px/s.
- **Collision approach**: Circle-vs-line-segment (walls, flippers), circle-vs-circle (bumpers), circle-vs-AABB (targets). Rollovers are trigger-only zones.
- **One-way gate**: Wall entity supports `oneWayNormal` property for directional passage (used at plunger lane exit).
- **Flipper velocity transfer**: Angular velocity × contact distance from pivot → perpendicular velocity added to ball. Tip hits harder than base.
- **State machine**: `TITLE → READY → PLAYING → BALL_LOST → READY|GAME_OVER → TITLE`.
- **Responsive canvas**: Native 400×700, CSS `image-rendering: pixelated` for scaling, `imageSmoothingEnabled = false`.
- **Scoring**: Multiplier system (caps at 5×, resets on ball loss). Target bank reset grants bonus + multiplier bump.
- **Key files**: `constants.js` (all tuning params), `table.js` (table layout), `physics.js` (engine), `game.js` (orchestrator).
- **Plunger tuning**: Launch force 1600, charge speed 160, max pull 70. ~60% charge needed to reach ceiling and enter main field.
