---
name: "canvas-game-architecture"
description: "Patterns for building HTML5 Canvas games with fixed-timestep physics and modular ES modules"
domain: "game-development"
confidence: "high"
source: "earned"
---

## Context

Applies when building 2D HTML5 Canvas games — especially physics-based games like pinball, breakout, or platformers. These patterns ensure smooth physics, clean architecture, and maintainable code.

## Patterns

### Fixed-Timestep Game Loop
Use an accumulator pattern to decouple physics from rendering:
```javascript
while (accumulator >= PHYSICS_STEP) {
  update(PHYSICS_STEP);
  accumulator -= PHYSICS_STEP;
}
render();
```
Physics at 120Hz, rendering at display refresh. Cap frame delta to prevent spiral of death (`Math.min(dt, 0.05)`).

### Module Boundaries
- **constants.js** owns ALL tuning parameters (physics, colors, scoring). Single source of truth.
- **entities.js** defines data classes. Entities own state + simple update methods.
- **physics.js** handles collision detection/response. Returns events, never modifies score directly.
- **renderer.js** is read-only — draws state, never mutates it.
- **game.js** orchestrates: reads input, updates entities, runs physics, triggers rendering.

### Collision Detection
- Ball vs wall: closest-point-on-segment, check distance < ball.radius
- Ball vs bumper: center-to-center distance < sum of radii
- Ball vs flipper: same as wall but with velocity transfer from angular motion
- One-way gates: skip collision if `ball.velocity · wall.oneWayNormal >= 0`

### Flipper Velocity Transfer
Contact velocity = `angularVelocity × distanceFromPivot`, applied perpendicular to flipper. Tip hits harder than base — this makes flipper aim meaningful.

### Pixel Art Canvas
- Set `imageSmoothingEnabled = false` on context
- CSS: `image-rendering: pixelated; image-rendering: crisp-edges`
- Use integer coordinates for drawing (`Math.floor()`)

## Anti-Patterns

- **Monolithic game loop**: Don't put physics, rendering, and input in one function. Separate systems.
- **Frame-rate-dependent physics**: Never use `dt` from requestAnimationFrame directly for physics. Always use fixed timestep.
- **Two-way collision walls for one-way passages**: Use a `oneWayNormal` property instead of hacks.
- **Modifying game state in the renderer**: Renderer should be pure read-only.
