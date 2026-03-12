// ── Canvas & Display ──
export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 700;

// ── Physics ──
export const PHYSICS_STEP = 1 / 120;
export const GRAVITY = 900;
export const BALL_RADIUS = 7;
export const BALL_MAX_SPEED = 1400;
export const WALL_RESTITUTION = 0.45;
export const BUMPER_RESTITUTION = 1.5;
export const SLINGSHOT_RESTITUTION = 1.2;
export const FLIPPER_RESTITUTION = 0.85;

// ── Flippers ──
export const FLIPPER_LENGTH = 52;
export const FLIPPER_THICKNESS = 4;
export const FLIPPER_REST_ANGLE_L = Math.PI / 6;
export const FLIPPER_ACTIVE_ANGLE_L = -Math.PI / 3.5;
export const FLIPPER_ANGULAR_SPEED = 18;

// ── Plunger ──
export const PLUNGER_MAX_PULL = 70;
export const PLUNGER_CHARGE_SPEED = 160;
export const PLUNGER_LAUNCH_FORCE = 1600;

// ── Gameplay ──
export const STARTING_LIVES = 3;
export const DRAIN_Y = 670;
export const BALL_LOST_DELAY = 1.2;
export const GAME_OVER_DELAY = 2.5;

// ── Scoring ──
export const POINTS = {
  BUMPER: 100,
  TARGET: 500,
  ROLLOVER: 250,
  SLINGSHOT: 10,
};

// ── Space-theme palette ──
export const COLORS = {
  bg:             '#06061a',
  tableSurface:   '#0e0e30',
  wall:           '#3355cc',
  wallGlow:       '#5577ee',
  ball:           '#d8d8e8',
  ballShine:      '#ffffff',
  flipper:        '#ff8800',
  flipperPivot:   '#ffaa44',
  bumper:  ['#ff1166', '#00ee88', '#ffaa00'],
  bumperRing:     '#ffffff',
  bumperFlash:    '#ffffff',
  target:         '#ffee33',
  targetDim:      '#554400',
  rollover:       '#44ddff',
  rolloverDim:    '#113344',
  slingshot:      '#ff4488',
  plunger:        '#ee3300',
  plungerTrack:   '#1a1a2a',
  scoreText:      '#00ffcc',
  livesText:      '#ff8800',
  titlePrimary:   '#ff6600',
  titleSecondary: '#00ffcc',
  uiText:         '#aaaacc',
  star:           '#ffffff',
  drain:          '#000000',
};
