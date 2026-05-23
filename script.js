const canvas = document.querySelector("#signal-field");
const ctx = canvas.getContext("2d");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;

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
  document.body.classList.add("has-pointer");
  root.style.setProperty("--cursor-x", `${event.clientX}px`);
  root.style.setProperty("--cursor-y", `${event.clientY}px`);
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

function updateScrollProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable <= 0 ? 0 : (window.scrollY / scrollable) * 100;
  root.style.setProperty("--scroll", `${Math.min(100, Math.max(0, progress))}%`);
  document.body.classList.toggle("is-scrolled", window.scrollY > 160);
}

updateScrollProgress();
window.addEventListener("scroll", updateScrollProgress, { passive: true });

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

document.querySelectorAll(".system-card, .lab-panel, .mix-card, .metrics article").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty("--shine-x", `${x}%`);
    card.style.setProperty("--shine-y", `${y}%`);
    if (!prefersReducedMotion && window.matchMedia("(pointer: fine)").matches) {
      const rotateX = (50 - y) * 0.08;
      const rotateY = (x - 50) * 0.08;
      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    }
  });

  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
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

document.querySelectorAll("a, button, .system-card, .lab-panel, .mix-card, .metrics article").forEach((element) => {
  element.addEventListener("pointerenter", () => document.body.classList.add("is-hovering"));
  element.addEventListener("pointerleave", () => document.body.classList.remove("is-hovering"));
});

document.querySelectorAll("[data-jump]").forEach((button) => {
  button.addEventListener("click", () => {
    const target = document.querySelector(button.dataset.jump);
    target?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
  });
});

const briefPanel = document.querySelector("#brief-panel");
const briefButtons = [document.querySelector("#brief-toggle"), document.querySelector("#hero-brief-toggle")].filter(Boolean);
const briefClose = document.querySelector(".brief-close");

function setBrief(open) {
  briefPanel?.classList.toggle("is-open", open);
  briefPanel?.setAttribute("aria-hidden", String(!open));
}

briefButtons.forEach((button) => button.addEventListener("click", () => setBrief(true)));
briefClose?.addEventListener("click", () => setBrief(false));
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setBrief(false);
});

const heroVisual = document.querySelector(".portrait-stage");
if (heroVisual) {
  window.addEventListener(
    "pointermove",
    (event) => {
      if (prefersReducedMotion || !window.matchMedia("(pointer: fine)").matches) return;
      const x = (event.clientX / window.innerWidth - 0.5) * 18;
      const y = (event.clientY / window.innerHeight - 0.5) * 18;
      heroVisual.style.setProperty("--hero-x", `${x}px`);
      heroVisual.style.setProperty("--hero-y", `${y}px`);
      heroVisual.querySelectorAll(".hud, .orbit-card").forEach((item, index) => {
        item.style.translate = `${x * (0.18 + index * 0.04)}px ${y * (0.18 + index * 0.04)}px`;
      });
    },
    { passive: true },
  );
}
