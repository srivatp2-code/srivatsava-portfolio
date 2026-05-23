const canvas = document.querySelector("#signal-field");
const ctx = canvas.getContext("2d");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let width = 0;
let height = 0;
let points = [];
let pointer = { x: -9999, y: -9999 };

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const count = Math.min(72, Math.max(36, Math.floor(width / 24)));
  points = Array.from({ length: count }, (_, index) => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.28,
    vy: (Math.random() - 0.5) * 0.28,
    phase: index * 0.37,
  }));
}

function drawField(time = 0) {
  if (prefersReducedMotion) return;
  ctx.clearRect(0, 0, width, height);
  ctx.lineWidth = 1;

  for (const point of points) {
    point.x += point.vx + Math.sin(time * 0.001 + point.phase) * 0.05;
    point.y += point.vy + Math.cos(time * 0.0012 + point.phase) * 0.05;

    if (point.x < -20) point.x = width + 20;
    if (point.x > width + 20) point.x = -20;
    if (point.y < -20) point.y = height + 20;
    if (point.y > height + 20) point.y = -20;
  }

  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const a = points[i];
      const b = points[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const distance = Math.hypot(dx, dy);

      if (distance < 145) {
        const opacity = (1 - distance / 145) * 0.2;
        ctx.strokeStyle = `rgba(215,255,72,${opacity})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  for (const point of points) {
    const distanceToPointer = Math.hypot(point.x - pointer.x, point.y - pointer.y);
    const radius = distanceToPointer < 180 ? 2.4 : 1.2;
    ctx.fillStyle = distanceToPointer < 180 ? "rgba(101,216,255,0.86)" : "rgba(247,244,235,0.36)";
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  requestAnimationFrame(drawField);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);
window.addEventListener("pointermove", (event) => {
  pointer = { x: event.clientX, y: event.clientY };
});

if (!prefersReducedMotion) {
  requestAnimationFrame(drawField);
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.15 },
);

document.querySelectorAll("[data-reveal]").forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index * 42, 260)}ms`;
  revealObserver.observe(element);
});

const metricObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      animateMetric(entry.target);
      metricObserver.unobserve(entry.target);
    }
  },
  { threshold: 0.6 },
);

document.querySelectorAll(".metric-number").forEach((metric) => metricObserver.observe(metric));

function animateMetric(element) {
  const target = Number(element.dataset.count || 0);
  const prefix = element.dataset.prefix || "";
  const suffix = element.dataset.suffix || "";
  const duration = 1100;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(target * eased);
    element.textContent = `${prefix}${value}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

document.querySelectorAll(".system-card, .lab-panel").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    card.style.setProperty("--shine-x", `${x}%`);
  });
});

document.querySelectorAll(".magnetic").forEach((button) => {
  button.addEventListener("pointermove", (event) => {
    if (prefersReducedMotion) return;
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    button.style.transform = `translate(${x * 0.08}px, ${y * 0.16}px)`;
  });

  button.addEventListener("pointerleave", () => {
    button.style.transform = "";
  });
});
