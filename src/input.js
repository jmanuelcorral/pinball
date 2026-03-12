/**
 * Tracks keyboard state: held keys, just-pressed, and just-released.
 * Call update() once per game-loop tick AFTER processing input.
 */
export class InputManager {
  constructor() {
    this._held = new Set();
    this._pressed = new Set();
    this._released = new Set();

    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this._held.add(e.code);
      this._pressed.add(e.code);
      // Prevent scroll / default for game keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this._held.delete(e.code);
      this._released.add(e.code);
    });
  }

  /** True while the key is held down */
  isDown(code) { return this._held.has(code); }

  /** True only on the frame the key was first pressed */
  wasPressed(code) { return this._pressed.has(code); }

  /** True only on the frame the key was released */
  wasReleased(code) { return this._released.has(code); }

  /** Convenience: left flipper active? */
  get leftFlipper() {
    return this.isDown('KeyZ') || this.isDown('ArrowLeft') || this.isDown('ShiftLeft');
  }

  /** Convenience: right flipper active? */
  get rightFlipper() {
    return this.isDown('Slash') || this.isDown('ArrowRight') || this.isDown('ShiftRight');
  }

  /** Convenience: plunger held? */
  get plungerHeld() {
    return this.isDown('Space') || this.isDown('ArrowDown');
  }

  /** Convenience: plunger just released? */
  get plungerReleased() {
    return this.wasReleased('Space') || this.wasReleased('ArrowDown');
  }

  /** Convenience: start / action button pressed? */
  get startPressed() {
    return this.wasPressed('Space') || this.wasPressed('Enter');
  }

  /** Call at the END of each game-loop tick */
  update() {
    this._pressed.clear();
    this._released.clear();
  }
}
