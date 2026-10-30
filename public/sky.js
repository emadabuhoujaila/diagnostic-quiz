(function () {
  const canvas = document.getElementById('sky');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });
  const stars = [];
  const motes = [];
  let width = 0;
  let height = 0;
  let dpr = 1;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function seed() {
    stars.length = 0;
    motes.length = 0;
    for (let i = 0; i < 140; i += 1) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.5 + 0.25,
        p: Math.random() * Math.PI * 2,
        tint: Math.random() < 0.18 ? '255,196,120' : '226,236,255'
      });
    }
    const colors = ['#5ce1ff', '#ffb14a', '#ff6b9a', '#b388ff', '#7dffb3'];
    for (let i = 0; i < 56; i += 1) {
      motes.push({
        a: Math.random() * Math.PI * 2,
        rad: 36 + Math.random() * 190,
        speed: 0.25 + Math.random() * 0.7,
        size: 1.1 + Math.random() * 2.1,
        color: colors[i % colors.length]
      });
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function focus() {
    const el = document.querySelector('.bezel');
    if (!el) return { x: width * 0.34, y: height * 0.5 };
    const rect = el.getBoundingClientRect();
    return {
      x: rect.left + rect.width * 0.5,
      y: rect.top + rect.height * 0.46
    };
  }

  function blob(x, y, radius, color) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawAtom(x, y, time) {
    const glow = ctx.createRadialGradient(x, y, 0, x, y, 34);
    glow.addColorStop(0, '#fff4d2');
    glow.addColorStop(0.35, '#ffb14a');
    glow.addColorStop(1, 'rgba(255,90,60,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 34, 0, Math.PI * 2);
    ctx.fill();

    const orbits = [
      { rx: 86, ry: 32, rot: 0.35, speed: 0.00115, color: '#5ce1ff' },
      { rx: 124, ry: 46, rot: 1.55, speed: -0.00086, color: '#ff6b9a' },
      { rx: 162, ry: 58, rot: 2.45, speed: 0.00062, color: '#b388ff' }
    ];
    orbits.forEach((orbit) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(orbit.rot);
      ctx.strokeStyle = orbit.color;
      ctx.globalAlpha = 0.8;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, orbit.rx, orbit.ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      const angle = time * orbit.speed;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = orbit.color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * orbit.rx, Math.sin(angle) * orbit.ry, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    motes.forEach((mote) => {
      const angle = time * 0.00035 * mote.speed + mote.a;
      ctx.fillStyle = mote.color;
      ctx.globalAlpha = 0.72;
      ctx.beginPath();
      ctx.arc(
        x + Math.cos(angle) * mote.rad * 0.58,
        y + Math.sin(angle * 1.25) * mote.rad * 0.3,
        mote.size,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawOrrery(x, y, time) {
    const sun = ctx.createRadialGradient(x, y, 0, x, y, 18);
    sun.addColorStop(0, '#fff6d0');
    sun.addColorStop(0.5, '#ffb14a');
    sun.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fill();
    [
      { r: 34, size: 3.2, color: '#5ce1ff', speed: 0.0009 },
      { r: 52, size: 4.4, color: '#ff6b9a', speed: 0.00055 },
      { r: 70, size: 3.4, color: '#b388ff', speed: 0.00038 }
    ].forEach((planet) => {
      ctx.strokeStyle = planet.color;
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, planet.r, 0, Math.PI * 2);
      ctx.stroke();
      const angle = time * planet.speed;
      ctx.globalAlpha = 1;
      ctx.fillStyle = planet.color;
      ctx.beginPath();
      ctx.arc(x + Math.cos(angle) * planet.r, y + Math.sin(angle) * planet.r * 0.72, planet.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function drawPrism(x, y, time) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.lineTo(26, 24);
    ctx.lineTo(-26, 24);
    ctx.closePath();
    ctx.fillStyle = 'rgba(190, 230, 255, 0.16)';
    ctx.strokeStyle = 'rgba(226, 246, 255, 0.85)';
    ctx.lineWidth = 1.4;
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.moveTo(-70, -6);
    ctx.lineTo(-8, -2);
    ctx.stroke();
    const colors = ['#ff5b6a', '#ffb14a', '#ffe56a', '#7dffb3', '#5ce1ff', '#6aa6ff', '#c58bff'];
    colors.forEach((color, index) => {
      const sway = Math.sin(time * 0.001 + index) * 2;
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.75;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(8, -4 + index * 1.1);
      ctx.lineTo(78, -22 + index * 7 + sway);
      ctx.stroke();
    });
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawWave(x, y, time) {
    ctx.save();
    ctx.translate(x - 150, y);
    ['#5ce1ff', '#ffb14a'].forEach((color, index) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.8;
      ctx.lineWidth = 2;
      for (let i = 0; i <= 300; i += 4) {
        const yy = Math.sin(i * 0.045 + time * 0.003 + index) * (10 + index * 4);
        if (i === 0) ctx.moveTo(i, yy);
        else ctx.lineTo(i, yy);
      }
      ctx.stroke();
    });
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function fieldLines(time) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 8; i += 1) {
      const y0 = height * (0.12 + i * 0.1);
      ctx.beginPath();
      ctx.strokeStyle = i % 2 ? 'rgba(255,107,154,0.22)' : 'rgba(92,225,255,0.2)';
      ctx.lineWidth = 1.15;
      for (let x = 0; x <= width; x += 10) {
        const y = y0
          + Math.sin(x * 0.008 + time * 0.001 + i) * 16
          + Math.sin(x * 0.021 - time * 0.0007) * 7;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function frame(time) {
    const background = ctx.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, '#090714');
    background.addColorStop(0.48, '#141033');
    background.addColorStop(1, '#1c0c28');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    blob(width * 0.18, height * 0.22, 280, 'rgba(110, 70, 255, 0.2)');
    blob(width * 0.82, height * 0.18, 240, 'rgba(255, 70, 140, 0.14)');
    blob(width * 0.62, height * 0.84, 300, 'rgba(40, 190, 210, 0.13)');

    stars.forEach((star) => {
      const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(time * 0.0014 + star.p));
      ctx.fillStyle = `rgba(${star.tint},${twinkle})`;
      ctx.beginPath();
      ctx.arc(star.x * width, star.y * height, star.r, 0, Math.PI * 2);
      ctx.fill();
    });

    fieldLines(time);
    const center = focus();
    drawAtom(center.x, center.y, time);
    drawPrism(center.x + Math.min(170, width * 0.16), center.y + 78, time);
    drawWave(center.x, center.y + 168, time);
    drawOrrery(center.x - Math.min(150, width * 0.14), center.y - 108, time);

    if (!reduce) requestAnimationFrame(frame);
  }

  seed();
  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(frame);
})();
