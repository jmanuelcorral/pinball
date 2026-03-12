import {
  BALL_RADIUS, BALL_MAX_SPEED,
  FLIPPER_LENGTH, FLIPPER_THICKNESS,
  FLIPPER_REST_ANGLE_L, FLIPPER_ACTIVE_ANGLE_L,
  FLIPPER_ANGULAR_SPEED,
  PLUNGER_MAX_PULL, PLUNGER_CHARGE_SPEED, PLUNGER_LAUNCH_FORCE,
} from './constants.js';

// ── Ball ──────────────────────────────────────────────────────────────────────
export class Ball {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = BALL_RADIUS;
    this.active = true;
    // Trail (recent positions for rendering)
    this.trail = [];
  }

  update(dt) {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 6) this.trail.shift();

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Clamp speed
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > BALL_MAX_SPEED) {
      const scale = BALL_MAX_SPEED / speed;
      this.vx *= scale;
      this.vy *= scale;
    }
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.active = true;
    this.trail = [];
  }
}

// ── Flipper ───────────────────────────────────────────────────────────────────
export class Flipper {
  /**
   * @param {number} px  Pivot x
   * @param {number} py  Pivot y
   * @param {'left'|'right'} side
   */
  constructor(px, py, side) {
    this.px = px;
    this.py = py;
    this.side = side;
    this.length = FLIPPER_LENGTH;
    this.thickness = FLIPPER_THICKNESS;

    if (side === 'left') {
      this.restAngle = FLIPPER_REST_ANGLE_L;
      this.activeAngle = FLIPPER_ACTIVE_ANGLE_L;
    } else {
      this.restAngle = Math.PI - FLIPPER_REST_ANGLE_L;
      this.activeAngle = Math.PI - FLIPPER_ACTIVE_ANGLE_L;
    }

    this.angle = this.restAngle;
    this.angularVelocity = 0;
  }

  update(dt, activated) {
    const target = activated ? this.activeAngle : this.restAngle;
    const dir = Math.sign(target - this.angle);

    if (dir === 0) {
      this.angularVelocity = 0;
      return;
    }

    this.angularVelocity = dir * FLIPPER_ANGULAR_SPEED;
    this.angle += this.angularVelocity * dt;

    // Clamp to range
    if (this.side === 'left') {
      this.angle = Math.max(this.activeAngle, Math.min(this.restAngle, this.angle));
    } else {
      this.angle = Math.min(this.activeAngle, Math.max(this.restAngle, this.angle));
    }

    // Stop angular velocity if at limit
    if (this.angle === this.restAngle || this.angle === this.activeAngle) {
      this.angularVelocity = 0;
    }
  }

  /** @returns {{x: number, y: number}} tip position */
  get tip() {
    return {
      x: this.px + Math.cos(this.angle) * this.length,
      y: this.py + Math.sin(this.angle) * this.length,
    };
  }

  /** @returns {{x1,y1,x2,y2}} line segment from pivot to tip */
  get segment() {
    const t = this.tip;
    return { x1: this.px, y1: this.py, x2: t.x, y2: t.y };
  }
}

// ── Bumper ─────────────────────────────────────────────────────────────────────
export class Bumper {
  constructor(x, y, radius, colorIndex = 0) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.colorIndex = colorIndex;
    this.hitTimer = 0;   // counts down after a hit (visual flash)
  }

  onHit() {
    this.hitTimer = 0.15;
  }

  update(dt) {
    if (this.hitTimer > 0) this.hitTimer -= dt;
  }
}

// ── Wall ──────────────────────────────────────────────────────────────────────
export class Wall {
  /**
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   * @param {number} [restitution]  Override restitution (for slingshots)
   * @param {boolean} [isSlingshot]
   */
  constructor(x1, y1, x2, y2, restitution = null, isSlingshot = false, oneWayNormal = null) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.restitution = restitution;
    this.isSlingshot = isSlingshot;
    this.oneWayNormal = oneWayNormal; // {nx,ny} — ball passes if moving with this normal
    this.hitTimer = 0;
  }

  onHit() {
    if (this.isSlingshot) this.hitTimer = 0.1;
  }

  update(dt) {
    if (this.hitTimer > 0) this.hitTimer -= dt;
  }
}

// ── Target ────────────────────────────────────────────────────────────────────
export class Target {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.isHit = false;
    this.hitTimer = 0;
  }

  onHit() {
    this.isHit = true;
    this.hitTimer = 0.2;
  }

  update(dt) {
    if (this.hitTimer > 0) this.hitTimer -= dt;
  }

  /** Reset target so it can be scored again */
  reset() {
    this.isHit = false;
  }
}

// ── Rollover ──────────────────────────────────────────────────────────────────
export class Rollover {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.isLit = false;
    this.cooldown = 0;
  }

  onHit() {
    this.isLit = true;
    this.cooldown = 0.5;
  }

  update(dt) {
    if (this.cooldown > 0) {
      this.cooldown -= dt;
    } else {
      this.isLit = false;
    }
  }
}

// ── Plunger ───────────────────────────────────────────────────────────────────
export class Plunger {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.compression = 0;
    this.maxCompression = PLUNGER_MAX_PULL;
    this.chargeSpeed = PLUNGER_CHARGE_SPEED;
    this.launchForce = PLUNGER_LAUNCH_FORCE;
    this.isCharging = false;
  }

  charge(dt) {
    this.isCharging = true;
    this.compression = Math.min(this.compression + this.chargeSpeed * dt, this.maxCompression);
  }

  /**
   * Release the plunger and return launch velocity (negative = upward).
   * @returns {number} vy to apply to ball
   */
  release() {
    const power = this.compression / this.maxCompression;
    this.compression = 0;
    this.isCharging = false;
    return -this.launchForce * power;
  }

  reset() {
    this.compression = 0;
    this.isCharging = false;
  }
}
