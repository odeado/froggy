// Sistema de partículas y efectos visuales (Screen Shake, Splash, Impactos).

export class Particle {
  constructor({ x, y, vx, vy, color, size, life }) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.life = life; // Duración total en segundos
    this.maxLife = life;
  }

  update(dt) {
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    this.life -= dt;
  }

  draw(ctx) {
    if (this.life <= 0) return;
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(1, this.size * alpha), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class EffectManager {
  constructor() {
    this.particles = [];
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
  }

  addSplash(x, y) {
    const count = 18;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const speed = 1.5 + Math.random() * 2.5;
      this.particles.push(
        new Particle({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.2,
          color: Math.random() > 0.3 ? "#7ce8ff" : "#ffffff",
          size: 2.5 + Math.random() * 2,
          life: 0.35 + Math.random() * 0.25,
        })
      );
    }
  }

  addCrash(x, y) {
    const count = 22;
    const colors = ["#ff4d4d", "#ffa64d", "#ffff66", "#808080"];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 3.5;
      this.particles.push(
        new Particle({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 3 + Math.random() * 2.5,
          life: 0.3 + Math.random() * 0.2,
        })
      );
    }
    this.triggerShake(0.3, 6);
  }

  addGoalBurst(x, y) {
    const count = 25;
    const colors = ["#4ade4a", "#7be07b", "#ffff7c", "#ffffff"];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3;
      this.particles.push(
        new Particle({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 2.5 + Math.random() * 2.5,
          life: 0.5 + Math.random() * 0.3,
        })
      );
    }
  }

  triggerShake(duration = 0.25, intensity = 4) {
    this.shakeDuration = duration;
    this.shakeIntensity = intensity;
  }

  update(dt) {
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      if (this.shakeDuration <= 0) {
        this.shakeDuration = 0;
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(dt);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  applyShakeTransform(ctx) {
    if (this.shakeDuration > 0) {
      const dx = (Math.random() - 0.5) * this.shakeIntensity * 2;
      const dy = (Math.random() - 0.5) * this.shakeIntensity * 2;
      ctx.translate(dx, dy);
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      p.draw(ctx);
    }
  }

  reset() {
    this.particles = [];
    this.shakeDuration = 0;
  }
}

export const effects = new EffectManager();
