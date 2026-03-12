# Squad Decisions

## Active Decisions

### Game Architecture — Modular ES Modules

**Author:** Ripley (Lead)  
**Date:** 2026-03-12  
**Status:** Accepted

#### Context

Needed a complete architecture for a 2D pinball game in HTML5 Canvas — playable from `index.html` with no build tools.

#### Decision

Eight ES modules with clear single-responsibility boundaries:

| Module | Responsibility |
|--------|---------------|
| `constants.js` | All tuning parameters — physics, colors, dimensions, scoring |
| `input.js` | Keyboard state tracking (held, just-pressed, just-released) |
| `entities.js` | Entity classes: Ball, Flipper, Bumper, Wall, Target, Rollover, Plunger |
| `table.js` | Table layout factory — instantiates all entities with positions |
| `physics.js` | 120Hz fixed-timestep engine — gravity, collision detection/response |
| `renderer.js` | Canvas drawing — all visual output, state overlays, HUD |
| `scoring.js` | Score, lives, multiplier, localStorage high score |
| `game.js` | Game loop + state machine orchestrator |

##### Key Technical Decisions

1. **Fixed 120Hz physics timestep** with accumulator pattern. Decoupled from render rate.
2. **Circle-segment collision** for ball vs walls/flippers. Circle-circle for bumpers.
3. **One-way walls** via `oneWayNormal` property on Wall entities — used for plunger lane exit gate.
4. **Flipper velocity transfer** proportional to contact distance from pivot — tip hits harder.
5. **Class-based entities** with update/onHit methods — simple, readable, extensible.
6. **Native canvas resolution** (400×700) with CSS `image-rendering: pixelated` for scaling.
7. **No build tools** — pure ES modules loaded via `<script type="module">`.

#### Consequences

- Any team member can tune gameplay by editing `constants.js` alone.
- Physics and rendering are fully decoupled — can change one without touching the other.
- New entities (ramps, spinners) can be added by extending `entities.js` + `table.js` + collision cases in `physics.js`.
- No transpilation, bundling, or dev server required.

#### Alternatives Considered

- **ECS (Entity-Component-System)**: Too heavy for current scope. Can migrate if entity count grows past 50.
- **Lower-res render buffer**: Would give more authentic pixel art but complicates coordinate mapping. Deferred.
- **Web Audio for sound**: Deferred — visual game is solid without it.

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
