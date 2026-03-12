import {
  GRAVITY, BALL_RADIUS, WALL_RESTITUTION, BUMPER_RESTITUTION,
  FLIPPER_RESTITUTION, FLIPPER_THICKNESS, DRAIN_Y,
  POINTS, CANVAS_WIDTH,
} from './constants.js';

/**
 * Fixed-timestep physics engine.
 * Handles gravity, collision detection & response for the ball
 * against all table elements.
 */
export class PhysicsEngine {
  /**
   * Advance one physics step.
   * @returns {{ drained: boolean, scored: {type: string, points: number}[] }}
   */
  step(ball, table, scoring, dt) {
    const events = [];
    let drained = false;

    if (!ball.active) return { drained: false, scored: events };

    // ── Gravity ──
    ball.vy += GRAVITY * dt;

    // ── Move ball ──
    ball.update(dt);

    // ── Update flippers ──
    // (angle already updated externally by game.js)

    // ── Update bumpers / targets / walls (timers) ──
    for (const b of table.bumpers) b.update(dt);
    for (const t of table.targets) t.update(dt);
    for (const r of table.rollovers) r.update(dt);
    for (const w of table.walls) w.update(dt);

    // ── Collisions ──

    // Ball vs walls
    for (const wall of table.walls) {
      const rest = wall.restitution ?? WALL_RESTITUTION;
      if (this._ballVsSegment(ball, wall.x1, wall.y1, wall.x2, wall.y2, rest, wall.oneWayNormal)) {
        wall.onHit();
        if (wall.isSlingshot) {
          events.push({ type: 'slingshot', points: POINTS.SLINGSHOT });
        }
      }
    }

    // Ball vs bumpers
    for (const bumper of table.bumpers) {
      if (this._ballVsCircle(ball, bumper.x, bumper.y, bumper.radius, BUMPER_RESTITUTION)) {
        bumper.onHit();
        events.push({ type: 'bumper', points: POINTS.BUMPER });
      }
    }

    // Ball vs flippers
    for (const flipper of table.flippers) {
      this._ballVsFlipper(ball, flipper);
    }

    // Ball vs targets
    for (const target of table.targets) {
      if (!target.isHit) {
        if (this._ballVsRect(ball, target)) {
          target.onHit();
          events.push({ type: 'target', points: POINTS.TARGET });
        }
      }
    }

    // Ball vs rollovers (trigger zones, no collision response)
    for (const rollover of table.rollovers) {
      if (rollover.cooldown <= 0) {
        if (this._pointInRect(ball.x, ball.y, rollover)) {
          rollover.onHit();
          events.push({ type: 'rollover', points: POINTS.ROLLOVER });
        }
      }
    }

    // ── Boundary clamp ──
    if (ball.x - ball.radius < 0) { ball.x = ball.radius; ball.vx = Math.abs(ball.vx) * 0.5; }
    if (ball.x + ball.radius > CANVAS_WIDTH) { ball.x = CANVAS_WIDTH - ball.radius; ball.vx = -Math.abs(ball.vx) * 0.5; }
    if (ball.y - ball.radius < 0) { ball.y = ball.radius; ball.vy = Math.abs(ball.vy) * 0.3; }

    // ── Drain check ──
    if (ball.y - ball.radius > DRAIN_Y) {
      ball.active = false;
      drained = true;
    }

    // ── Check if all targets hit → reset them ──
    if (table.targets.every(t => t.isHit)) {
      for (const t of table.targets) t.reset();
      events.push({ type: 'target_reset', points: 1000 });
    }

    return { drained, scored: events };
  }

  // ── Collision helpers ──────────────────────────────────────────────────────

  _closestPointOnSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    if (lenSq < 0.0001) return { x: ax, y: ay, t: 0 };
    let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return { x: ax + t * dx, y: ay + t * dy, t };
  }

  _ballVsSegment(ball, x1, y1, x2, y2, restitution, oneWayNormal = null) {
    const c = this._closestPointOnSegment(ball.x, ball.y, x1, y1, x2, y2);
    const dx = ball.x - c.x;
    const dy = ball.y - c.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < ball.radius && dist > 0.0001) {
      // One-way gate check: allow passage if ball moves with the normal
      if (oneWayNormal) {
        const dot = ball.vx * oneWayNormal.nx + ball.vy * oneWayNormal.ny;
        if (dot >= 0) return false;
      }

      const nx = dx / dist;
      const ny = dy / dist;

      // Push out
      const overlap = ball.radius - dist;
      ball.x += nx * (overlap + 0.5);
      ball.y += ny * (overlap + 0.5);

      // Reflect velocity
      const velDotN = ball.vx * nx + ball.vy * ny;
      if (velDotN < 0) {
        ball.vx -= (1 + restitution) * velDotN * nx;
        ball.vy -= (1 + restitution) * velDotN * ny;
      }
      return true;
    }
    return false;
  }

  _ballVsCircle(ball, cx, cy, cRadius, restitution) {
    const dx = ball.x - cx;
    const dy = ball.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = ball.radius + cRadius;

    if (dist < minDist && dist > 0.0001) {
      const nx = dx / dist;
      const ny = dy / dist;

      const overlap = minDist - dist;
      ball.x += nx * (overlap + 0.5);
      ball.y += ny * (overlap + 0.5);

      const velDotN = ball.vx * nx + ball.vy * ny;
      if (velDotN < 0) {
        ball.vx -= (1 + restitution) * velDotN * nx;
        ball.vy -= (1 + restitution) * velDotN * ny;
      }

      // Extra push for bumper feel
      const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      if (speed < 300) {
        ball.vx += nx * 250;
        ball.vy += ny * 250;
      }

      return true;
    }
    return false;
  }

  _ballVsFlipper(ball, flipper) {
    const seg = flipper.segment;
    const c = this._closestPointOnSegment(
      ball.x, ball.y, seg.x1, seg.y1, seg.x2, seg.y2
    );
    const dx = ball.x - c.x;
    const dy = ball.y - c.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = ball.radius + FLIPPER_THICKNESS;

    if (dist < minDist && dist > 0.0001) {
      const nx = dx / dist;
      const ny = dy / dist;

      // Push out
      const overlap = minDist - dist;
      ball.x += nx * (overlap + 0.5);
      ball.y += ny * (overlap + 0.5);

      // Flipper surface velocity at contact point
      const contactDist = c.t * flipper.length;
      const flipperSpeed = flipper.angularVelocity * contactDist;
      const perpX = -Math.sin(flipper.angle);
      const perpY = Math.cos(flipper.angle);
      const fvx = flipperSpeed * perpX;
      const fvy = flipperSpeed * perpY;

      // Relative velocity
      const relVx = ball.vx - fvx;
      const relVy = ball.vy - fvy;
      const relDotN = relVx * nx + relVy * ny;

      if (relDotN < 0) {
        ball.vx -= (1 + FLIPPER_RESTITUTION) * relDotN * nx;
        ball.vy -= (1 + FLIPPER_RESTITUTION) * relDotN * ny;

        // Transfer some flipper velocity directly for extra punch
        ball.vx += fvx * 0.3;
        ball.vy += fvy * 0.3;
      }
      return true;
    }
    return false;
  }

  _ballVsRect(ball, rect) {
    // Circle vs AABB
    const cx = Math.max(rect.x, Math.min(ball.x, rect.x + rect.w));
    const cy = Math.max(rect.y, Math.min(ball.y, rect.y + rect.h));
    const dx = ball.x - cx;
    const dy = ball.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < ball.radius) {
      // Simple bounce off
      if (dist > 0.0001) {
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = ball.radius - dist;
        ball.x += nx * (overlap + 0.5);
        ball.y += ny * (overlap + 0.5);
        const velDotN = ball.vx * nx + ball.vy * ny;
        if (velDotN < 0) {
          ball.vx -= (1 + WALL_RESTITUTION) * velDotN * nx;
          ball.vy -= (1 + WALL_RESTITUTION) * velDotN * ny;
        }
      }
      return true;
    }
    return false;
  }

  _pointInRect(px, py, rect) {
    return px >= rect.x && px <= rect.x + rect.w &&
           py >= rect.y && py <= rect.y + rect.h;
  }
}
