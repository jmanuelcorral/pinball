import { Wall, Bumper, Flipper, Target, Rollover, Plunger } from './entities.js';
import { SLINGSHOT_RESTITUTION } from './constants.js';

/**
 * Creates the full pinball table layout.
 * All coordinates are in physics-space (400×700).
 */
export function createTable() {
  // ── Outer boundary walls ──
  const walls = [
    // Top boundary
    new Wall(30, 100, 80, 35),        // top-left angled
    new Wall(80, 35, 300, 35),         // top flat
    new Wall(300, 35, 342, 50),        // top-right angled

    // Plunger lane ceiling (angled to deflect ball left into main field)
    new Wall(342, 50, 383, 62),

    // Plunger lane right wall
    new Wall(383, 62, 383, 660),
    // Plunger lane bottom
    new Wall(347, 660, 383, 660),

    // Right wall of main field (below ball-entry gap)
    // Gap is from y≈50 to y≈125 — ball enters from plunger lane here
    new Wall(342, 125, 342, 555),

    // One-way gate at ball entry gap: ball can enter main field but not return
    // Normal points left → ball moving left (into field) passes, moving right is blocked
    new Wall(342, 55, 342, 120, null, false, { nx: -1, ny: 0 }),

    // Left wall
    new Wall(30, 100, 30, 555),

    // Guide rails → flippers
    new Wall(30, 555, 112, 628),      // left guide
    new Wall(342, 555, 268, 628),     // right guide

    // Drain area (vertical walls beside flippers)
    new Wall(112, 628, 112, 660),     // left drain wall
    new Wall(268, 628, 268, 660),     // right drain wall

    // Bottom walls (under drain — safety net perimeter)
    new Wall(30, 660, 112, 660),
    new Wall(268, 660, 342, 660),

    // Plunger lane left wall (lower section — keeps ball in lane)
    new Wall(342, 555, 342, 660),

    // ── Slingshot walls (higher restitution) ──
    new Wall(55, 460, 55, 538, SLINGSHOT_RESTITUTION, true),    // left vertical
    new Wall(55, 538, 112, 592, SLINGSHOT_RESTITUTION, true),   // left angled
    new Wall(325, 460, 325, 538, SLINGSHOT_RESTITUTION, true),  // right vertical
    new Wall(325, 538, 268, 592, SLINGSHOT_RESTITUTION, true),  // right angled

    // ── Inner lane dividers (top of table) ──
    new Wall(120, 55, 120, 110),      // left lane divider
    new Wall(190, 55, 190, 110),      // center lane divider
    new Wall(260, 55, 260, 110),      // right lane divider
  ];

  // ── Bumpers (triangle formation) ──
  const bumpers = [
    new Bumper(148, 240, 22, 0),   // left
    new Bumper(232, 240, 22, 1),   // right
    new Bumper(190, 175, 22, 2),   // top
  ];

  // ── Drop targets (left & right banks) ──
  const targets = [
    new Target(42, 195, 14, 28),   // left bank 1
    new Target(42, 240, 14, 28),   // left bank 2
    new Target(42, 285, 14, 28),   // left bank 3
    new Target(324, 195, 14, 28),  // right bank 1
    new Target(324, 240, 14, 28),  // right bank 2
  ];

  // ── Rollover lanes (top) ──
  const rollovers = [
    new Rollover(133, 60, 20, 45),  // left lane
    new Rollover(203, 60, 20, 45),  // center lane
    new Rollover(273, 60, 20, 45),  // right lane
  ];

  // ── Flippers ──
  const flippers = [
    new Flipper(138, 628, 'left'),
    new Flipper(242, 628, 'right'),
  ];

  // ── Plunger ──
  const plunger = new Plunger(363, 630);

  // ── Ball start position (in plunger lane) ──
  const ballStart = { x: 363, y: 580 };

  // ── Stars (background decoration) ──
  const stars = generateStars(90);

  return { walls, bumpers, targets, rollovers, flippers, plunger, ballStart, stars };
}

function generateStars(count) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * 400,
      y: Math.random() * 700,
      brightness: 0.3 + Math.random() * 0.7,
      size: Math.random() < 0.15 ? 2 : 1,
      twinkleSpeed: 1 + Math.random() * 3,
    });
  }
  return stars;
}
