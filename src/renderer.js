import { COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';

/**
 * Canvas renderer with pixel-art aesthetic.
 * Uses native canvas size with imageSmoothingEnabled=false
 * and CSS image-rendering: pixelated for crisp upscaling.
 */
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    this.ctx.imageSmoothingEnabled = false;
    this._time = 0;
  }

  render(state, table, ball, scoring, dt) {
    this._time += dt;
    const ctx = this.ctx;

    // ── Background ──
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // ── Stars ──
    this._drawStars(ctx, table.stars);

    // ── Table surface ──
    this._drawTableSurface(ctx);

    // ── Walls ──
    for (const wall of table.walls) {
      this._drawWall(ctx, wall);
    }

    // ── Slingshot decoration ──
    this._drawSlingshots(ctx, table.walls);

    // ── Rollovers ──
    for (const r of table.rollovers) {
      this._drawRollover(ctx, r);
    }

    // ── Bumpers ──
    for (const bumper of table.bumpers) {
      this._drawBumper(ctx, bumper);
    }

    // ── Targets ──
    for (const target of table.targets) {
      this._drawTarget(ctx, target);
    }

    // ── Flippers ──
    for (const flipper of table.flippers) {
      this._drawFlipper(ctx, flipper);
    }

    // ── Plunger ──
    this._drawPlunger(ctx, table.plunger);

    // ── Ball ──
    if (ball.active) {
      this._drawBall(ctx, ball);
    }

    // ── HUD ──
    this._drawHUD(ctx, scoring, state);

    // ── State overlays ──
    if (state === 'TITLE') {
      this._drawTitleScreen(ctx);
    } else if (state === 'GAME_OVER') {
      this._drawGameOver(ctx, scoring);
    } else if (state === 'BALL_LOST') {
      this._drawBallLost(ctx, scoring);
    }
  }

  // ── Drawing helpers ─────────────────────────────────────────────────────────

  _drawStars(ctx, stars) {
    for (const star of stars) {
      const flicker = Math.sin(this._time * star.twinkleSpeed) * 0.3 + 0.7;
      const alpha = star.brightness * flicker;
      ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
      ctx.fillRect(Math.floor(star.x), Math.floor(star.y), star.size, star.size);
    }
  }

  _drawTableSurface(ctx) {
    ctx.fillStyle = COLORS.tableSurface;
    ctx.beginPath();
    ctx.moveTo(30, 100);
    ctx.lineTo(80, 35);
    ctx.lineTo(300, 35);
    ctx.lineTo(342, 50);
    ctx.lineTo(342, 125);
    ctx.lineTo(342, 660);
    ctx.lineTo(30, 660);
    ctx.closePath();
    ctx.fill();

    // Plunger lane
    ctx.fillStyle = '#0b0b28';
    ctx.fillRect(343, 50, 40, 612);
  }

  _drawWall(ctx, wall) {
    ctx.strokeStyle = wall.isSlingshot
      ? (wall.hitTimer > 0 ? COLORS.slingshot : COLORS.wall)
      : COLORS.wall;
    ctx.lineWidth = wall.isSlingshot ? 3 : 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(wall.x1, wall.y1);
    ctx.lineTo(wall.x2, wall.y2);
    ctx.stroke();

    // Subtle glow
    if (!wall.isSlingshot) {
      ctx.strokeStyle = COLORS.wallGlow;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.moveTo(wall.x1, wall.y1);
      ctx.lineTo(wall.x2, wall.y2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  _drawSlingshots(ctx, walls) {
    // Fill the slingshot triangles
    const leftSlings = walls.filter(w => w.isSlingshot && w.x1 < 190);
    const rightSlings = walls.filter(w => w.isSlingshot && w.x1 > 190);

    for (const group of [leftSlings, rightSlings]) {
      if (group.length < 2) continue;
      const isHit = group.some(w => w.hitTimer > 0);
      ctx.fillStyle = isHit ? 'rgba(255,68,136,0.35)' : 'rgba(51,85,204,0.15)';
      ctx.beginPath();
      ctx.moveTo(group[0].x1, group[0].y1);
      ctx.lineTo(group[0].x2, group[0].y2);
      ctx.lineTo(group[1].x2, group[1].y2);
      ctx.closePath();
      ctx.fill();
    }
  }

  _drawBumper(ctx, bumper) {
    const hit = bumper.hitTimer > 0;
    const color = COLORS.bumper[bumper.colorIndex] || COLORS.bumper[0];

    // Outer ring
    const ringRadius = bumper.radius + (hit ? 4 : 2);
    ctx.beginPath();
    ctx.arc(bumper.x, bumper.y, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = hit ? COLORS.bumperFlash : COLORS.bumperRing;
    ctx.lineWidth = hit ? 3 : 1.5;
    ctx.globalAlpha = hit ? 1 : 0.6;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Inner fill
    ctx.beginPath();
    ctx.arc(bumper.x, bumper.y, bumper.radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = hit ? 1 : 0.8;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Center dot
    ctx.beginPath();
    ctx.arc(bumper.x, bumper.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = hit ? '#fff' : 'rgba(255,255,255,0.5)';
    ctx.fill();

    // Hit flash glow
    if (hit) {
      const gradient = ctx.createRadialGradient(
        bumper.x, bumper.y, bumper.radius,
        bumper.x, bumper.y, bumper.radius + 15
      );
      gradient.addColorStop(0, color.replace(')', ',0.4)').replace('rgb', 'rgba'));
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(bumper.x, bumper.y, bumper.radius + 15, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,0.15)`;
      ctx.fill();
    }
  }

  _drawFlipper(ctx, flipper) {
    const seg = flipper.segment;
    const angle = flipper.angle;
    const perpX = -Math.sin(angle);
    const perpY = Math.cos(angle);
    const baseW = 7;
    const tipW = 3;

    ctx.fillStyle = COLORS.flipper;
    ctx.beginPath();
    ctx.moveTo(seg.x1 + perpX * baseW, seg.y1 + perpY * baseW);
    ctx.lineTo(seg.x1 - perpX * baseW, seg.y1 - perpY * baseW);
    ctx.lineTo(seg.x2 - perpX * tipW, seg.y2 - perpY * tipW);
    ctx.lineTo(seg.x2 + perpX * tipW, seg.y2 + perpY * tipW);
    ctx.closePath();
    ctx.fill();

    // Highlight edge
    ctx.strokeStyle = COLORS.flipperPivot;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Pivot pin
    ctx.beginPath();
    ctx.arc(flipper.px, flipper.py, 4, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.flipperPivot;
    ctx.fill();
  }

  _drawTarget(ctx, target) {
    ctx.fillStyle = target.isHit ? COLORS.targetDim : COLORS.target;
    ctx.fillRect(target.x, target.y, target.w, target.h);

    // Border
    ctx.strokeStyle = target.isHit ? '#332200' : '#ffcc00';
    ctx.lineWidth = 1;
    ctx.strokeRect(target.x, target.y, target.w, target.h);

    // Flash
    if (target.hitTimer > 0) {
      ctx.fillStyle = `rgba(255,255,255,${(target.hitTimer * 5).toFixed(2)})`;
      ctx.fillRect(target.x, target.y, target.w, target.h);
    }
  }

  _drawRollover(ctx, rollover) {
    const lit = rollover.isLit;
    ctx.fillStyle = lit ? COLORS.rollover : COLORS.rolloverDim;
    ctx.globalAlpha = lit ? 0.7 : 0.3;

    // Draw as a lane marker (small diamond)
    const cx = rollover.x + rollover.w / 2;
    const cy = rollover.y + rollover.h / 2;
    ctx.beginPath();
    ctx.moveTo(cx, rollover.y);
    ctx.lineTo(cx + 6, cy);
    ctx.lineTo(cx, rollover.y + rollover.h);
    ctx.lineTo(cx - 6, cy);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    // Small arrow at bottom
    if (lit) {
      ctx.fillStyle = COLORS.rollover;
      ctx.beginPath();
      ctx.moveTo(cx - 3, rollover.y + rollover.h + 2);
      ctx.lineTo(cx + 3, rollover.y + rollover.h + 2);
      ctx.lineTo(cx, rollover.y + rollover.h + 7);
      ctx.closePath();
      ctx.fill();
    }
  }

  _drawPlunger(ctx, plunger) {
    const trackX = plunger.x - 8;
    const trackW = 16;
    const trackH = 60;
    const trackY = plunger.y - 15;

    // Track
    ctx.fillStyle = COLORS.plungerTrack;
    ctx.fillRect(trackX, trackY, trackW, trackH);

    // Plunger head
    const headY = plunger.y + plunger.compression * 0.6;
    ctx.fillStyle = COLORS.plunger;
    ctx.fillRect(trackX + 2, headY - 8, trackW - 4, 12);

    // Spring lines
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    const springTop = headY + 4;
    const springBottom = trackY + trackH - 2;
    const springSegments = 6;
    if (springBottom > springTop) {
      const segH = (springBottom - springTop) / springSegments;
      for (let i = 0; i < springSegments; i++) {
        const sy = springTop + i * segH;
        const sx = (i % 2 === 0) ? trackX + 3 : trackX + trackW - 3;
        const ex = (i % 2 === 0) ? trackX + trackW - 3 : trackX + 3;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, sy + segH);
        ctx.stroke();
      }
    }
  }

  _drawBall(ctx, ball) {
    // Trail
    for (let i = 0; i < ball.trail.length; i++) {
      const t = ball.trail[i];
      const alpha = (i / ball.trail.length) * 0.25;
      ctx.beginPath();
      ctx.arc(t.x, t.y, ball.radius * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,200,220,${alpha.toFixed(2)})`;
      ctx.fill();
    }

    // Main ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.ball;
    ctx.fill();

    // Shine highlight
    ctx.beginPath();
    ctx.arc(ball.x - 2, ball.y - 2, ball.radius * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.ballShine;
    ctx.fill();
  }

  _drawHUD(ctx, scoring, state) {
    if (state === 'TITLE') return;

    // Score
    ctx.fillStyle = COLORS.scoreText;
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(scoring.score.toLocaleString(), 190, 22);

    // High score
    ctx.fillStyle = COLORS.uiText;
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`HI ${scoring.highScore.toLocaleString()}`, 34, 15);

    // Lives (ball icons)
    ctx.fillStyle = COLORS.livesText;
    ctx.textAlign = 'right';
    for (let i = 0; i < scoring.lives; i++) {
      ctx.beginPath();
      ctx.arc(335 - i * 16, 12, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bonus multiplier
    if (scoring.multiplier > 1) {
      ctx.fillStyle = COLORS.titlePrimary;
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`×${scoring.multiplier}`, 190, 648);
    }
  }

  _drawTitleScreen(ctx) {
    // Dim overlay
    ctx.fillStyle = 'rgba(6,6,26,0.85)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Title
    ctx.textAlign = 'center';

    ctx.fillStyle = COLORS.titlePrimary;
    ctx.font = 'bold 36px monospace';
    ctx.fillText('SPACE', 200, 240);
    ctx.fillText('PINBALL', 200, 280);

    // Subtitle
    ctx.fillStyle = COLORS.titleSecondary;
    ctx.font = '14px monospace';
    ctx.fillText('A Pixel Tribute to Space Cadet', 200, 320);

    // Controls
    ctx.fillStyle = COLORS.uiText;
    ctx.font = '12px monospace';
    ctx.fillText('Z / ← : Left Flipper', 200, 400);
    ctx.fillText('/ / → : Right Flipper', 200, 420);
    ctx.fillText('SPACE / ↓ : Plunger', 200, 440);

    // Prompt
    const blink = Math.sin(this._time * 4) > 0;
    if (blink) {
      ctx.fillStyle = COLORS.titlePrimary;
      ctx.font = 'bold 16px monospace';
      ctx.fillText('PRESS SPACE TO START', 200, 520);
    }
  }

  _drawGameOver(ctx, scoring) {
    ctx.fillStyle = 'rgba(6,6,26,0.8)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.titlePrimary;
    ctx.font = 'bold 32px monospace';
    ctx.fillText('GAME OVER', 200, 290);

    ctx.fillStyle = COLORS.scoreText;
    ctx.font = '18px monospace';
    ctx.fillText(`SCORE: ${scoring.score.toLocaleString()}`, 200, 340);

    if (scoring.score >= scoring.highScore && scoring.score > 0) {
      ctx.fillStyle = COLORS.titlePrimary;
      ctx.font = 'bold 14px monospace';
      ctx.fillText('★ NEW HIGH SCORE ★', 200, 370);
    }

    const blink = Math.sin(this._time * 4) > 0;
    if (blink) {
      ctx.fillStyle = COLORS.uiText;
      ctx.font = '14px monospace';
      ctx.fillText('PRESS SPACE TO CONTINUE', 200, 440);
    }
  }

  _drawBallLost(ctx, scoring) {
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.titlePrimary;
    ctx.font = 'bold 20px monospace';
    ctx.globalAlpha = 0.8;
    ctx.fillText('BALL LOST', 190, 350);
    ctx.globalAlpha = 1;
  }

  resize() {
    const ratio = CANVAS_WIDTH / CANVAS_HEIGHT;
    let w = window.innerWidth;
    let h = window.innerHeight;

    if (w / h > ratio) {
      w = Math.floor(h * ratio);
    } else {
      h = Math.floor(w / ratio);
    }

    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
  }
}
