import { STARTING_LIVES } from './constants.js';

/**
 * Tracks score, lives, high score, and bonus multiplier.
 * Persists high score to localStorage.
 */
export class ScoringSystem {
  constructor() {
    this.score = 0;
    this.lives = STARTING_LIVES;
    this.multiplier = 1;
    this.highScore = this._loadHighScore();
    this._pendingPoints = []; // for animated score popups
  }

  addPoints(points) {
    const earned = points * this.multiplier;
    this.score += earned;
    this._pendingPoints.push({ value: earned, timer: 1.0 });
    return earned;
  }

  loseLife() {
    this.lives = Math.max(0, this.lives - 1);
    this.multiplier = 1; // reset multiplier on ball loss
  }

  get isGameOver() {
    return this.lives <= 0;
  }

  bumpMultiplier() {
    this.multiplier = Math.min(this.multiplier + 1, 5);
  }

  reset() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this._saveHighScore();
    }
    this.score = 0;
    this.lives = STARTING_LIVES;
    this.multiplier = 1;
    this._pendingPoints = [];
  }

  update(dt) {
    for (const p of this._pendingPoints) {
      p.timer -= dt;
    }
    this._pendingPoints = this._pendingPoints.filter(p => p.timer > 0);
  }

  _loadHighScore() {
    try {
      return parseInt(localStorage.getItem('pinball_highscore') || '0', 10);
    } catch {
      return 0;
    }
  }

  _saveHighScore() {
    try {
      localStorage.setItem('pinball_highscore', String(this.highScore));
    } catch {
      // localStorage unavailable — ignore
    }
  }
}
