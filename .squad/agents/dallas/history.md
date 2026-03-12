# Project Context

- **Owner:** Jose Corral
- **Project:** 2D pixel art pinball game in HTML5, inspired by Microsoft 3D Pinball Space Cadet
- **Stack:** HTML5 Canvas, JavaScript, pixel art assets
- **Theme:** Classic pinball — flippers, bumpers, ramps, scoring, space/retro aesthetic
- **Inspiration:** Microsoft 3D Pinball Space Cadet — nostalgic, fun, arcade feel
- **Created:** 2026-03-12

## Learnings

### Ripley Architecture (2026-03-12)

Ripley delivered complete playable pinball game. Key architectural decisions:

- **8 modular ES6 modules** with single responsibility — tuning, entities, physics, rendering, scoring, input, game loop, table layout
- **120Hz fixed-timestep physics** decoupled from render rate — enables smooth, predictable physics independent of frame rate
- **Class-based entity system** (Ball, Flipper, Bumper, Wall, Target, Rollover, Plunger) — extensible without ECS overhead
- **Canvas resolution 400×700** with CSS `image-rendering: pixelated` — pixel-perfect native rendering
- **No build tools** — pure ES modules via `<script type="module">`

**Impact:** Physics and rendering fully decoupled. Can enhance visuals without touching physics. Entity system supports adding ramps, spinners, etc.

**For Dallas:** Game is fully playable. Test harness ready. Can design QA test cases around entity behavior, scoring, collision edge cases.
