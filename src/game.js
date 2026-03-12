import { InputManager } from './input.js';
import { PhysicsEngine } from './physics.js';
import { Renderer } from './renderer.js';
import { ScoringSystem } from './scoring.js';
import { createTable } from './table.js';
import { Ball } from './entities.js';
import { PHYSICS_STEP, BALL_LOST_DELAY, GAME_OVER_DELAY } from './constants.js';

/**
 * Main game controller.
 * Owns the game loop, state machine, and orchestrates all subsystems.
 *
 * States: TITLE → READY → PLAYING → BALL_LOST → READY | GAME_OVER → TITLE
 */
export class Game {
  constructor(canvas) {
    this.input = new InputManager();
    this.physics = new PhysicsEngine();
    this.renderer = new Renderer(canvas);
    this.scoring = new ScoringSystem();
    this.table = createTable();

    this.ball = new Ball(this.table.ballStart.x, this.table.ballStart.y);
    this.ball.active = false;  // hidden until game starts
    this.state = 'TITLE';
    this._stateTimer = 0;
    this._lastTime = 0;
    this._accumulator = 0;
  }

  start() {
    this.renderer.resize();
    window.addEventListener('resize', () => this.renderer.resize());

    const loop = (timestamp) => {
      const frameTime = Math.min((timestamp - this._lastTime) / 1000, 0.05);
      this._lastTime = timestamp;
      this._accumulator += frameTime;

      // Fixed-step physics
      while (this._accumulator >= PHYSICS_STEP) {
        this._tick(PHYSICS_STEP);
        this._accumulator -= PHYSICS_STEP;
      }

      this.renderer.render(
        this.state, this.table, this.ball, this.scoring, frameTime
      );
      this.input.update();
      requestAnimationFrame(loop);
    };

    requestAnimationFrame((ts) => {
      this._lastTime = ts;
      requestAnimationFrame(loop);
    });
  }

  // ── Per-physics-step update ───────────────────────────────────────────────
  _tick(dt) {
    switch (this.state) {
      case 'TITLE':    this._tickTitle(dt);    break;
      case 'READY':    this._tickReady(dt);    break;
      case 'PLAYING':  this._tickPlaying(dt);  break;
      case 'BALL_LOST': this._tickBallLost(dt); break;
      case 'GAME_OVER': this._tickGameOver(dt); break;
    }
  }

  // ── TITLE ──
  _tickTitle(dt) {
    if (this.input.startPressed) {
      this.scoring.reset();
      this._enterReady();
    }
  }

  // ── READY (ball on plunger) ──
  _tickReady(dt) {
    const plunger = this.table.plunger;

    // Keep ball on plunger tip
    this.ball.x = plunger.x;
    this.ball.y = plunger.y - 20 + plunger.compression * 0.6;
    this.ball.vx = 0;
    this.ball.vy = 0;

    if (this.input.plungerHeld) {
      plunger.charge(dt);
    }

    if (this.input.plungerReleased) {
      if (plunger.compression > 2) {
        this.ball.vy = plunger.release();
        this.ball.active = true;
        this.state = 'PLAYING';
      } else {
        plunger.reset();
      }
    }

    // Update flipper angles even in READY
    for (const f of this.table.flippers) {
      const active = f.side === 'left' ? this.input.leftFlipper : this.input.rightFlipper;
      f.update(dt, active);
    }
  }

  // ── PLAYING ──
  _tickPlaying(dt) {
    // Update flippers
    for (const f of this.table.flippers) {
      const active = f.side === 'left' ? this.input.leftFlipper : this.input.rightFlipper;
      f.update(dt, active);
    }

    // Physics step
    const result = this.physics.step(this.ball, this.table, this.scoring, dt);

    // Process scoring events
    for (const evt of result.scored) {
      this.scoring.addPoints(evt.points);
      if (evt.type === 'target_reset') {
        this.scoring.bumpMultiplier();
      }
    }

    this.scoring.update(dt);

    // Ball drained?
    if (result.drained) {
      this.scoring.loseLife();
      this._stateTimer = BALL_LOST_DELAY;
      this.state = 'BALL_LOST';
    }
  }

  // ── BALL_LOST ──
  _tickBallLost(dt) {
    this._stateTimer -= dt;

    // Keep updating flippers for visual
    for (const f of this.table.flippers) {
      f.update(dt, false);
    }

    if (this._stateTimer <= 0) {
      if (this.scoring.isGameOver) {
        this._stateTimer = GAME_OVER_DELAY;
        this.state = 'GAME_OVER';
      } else {
        this._enterReady();
      }
    }
  }

  // ── GAME_OVER ──
  _tickGameOver(dt) {
    this._stateTimer -= dt;
    if (this._stateTimer <= 0 && this.input.startPressed) {
      // Update high score before returning to title
      if (this.scoring.score > this.scoring.highScore) {
        this.scoring.highScore = this.scoring.score;
        this.scoring._saveHighScore();
      }
      this.state = 'TITLE';
    }
  }

  // ── Helpers ──
  _enterReady() {
    const start = this.table.ballStart;
    this.ball.reset(start.x, start.y);
    this.table.plunger.reset();
    // Reset all targets
    for (const t of this.table.targets) t.reset();
    this.state = 'READY';
  }
}
