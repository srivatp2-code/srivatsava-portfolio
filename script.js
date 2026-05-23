const canvas = document.querySelector("#cosmos");
const ctx = canvas.getContext("2d");
const root = document.documentElement;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let width = 0;
let height = 0;
let particles = [];
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
  particles = Array.from({ length: Math.min(68, Math.max(32, Math.floor(width / 26))) }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 1.8 + 0.4,
    vx: (Math.random() - 0.5) * 0.22,
    vy: (Math.random() - 0.5) * 0.22,
  }));
}

function draw(time = 0) {
  if (reducedMotion) return;
  ctx.clearRect(0, 0, width, height);
  for (const particle of particles) {
    particle.x += particle.vx;
    particle.y += particle.vy;
    if (particle.x < -20) particle.x = width + 20;
    if (particle.x > width + 20) particle.x = -20;
    if (particle.y < -20) particle.y = height + 20;
    if (particle.y > height + 20) particle.y = -20;

    const distance = Math.hypot(particle.x - pointer.x, particle.y - pointer.y);
    ctx.fillStyle = distance < 180 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.28)";
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, distance < 180 ? particle.r * 1.8 : particle.r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < particles.length; i += 1) {
    for (let j = i + 1; j < particles.length; j += 1) {
      const a = particles[i];
      const b = particles[j];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < 118) {
        ctx.strokeStyle = `rgba(105,184,255,${(1 - d / 118) * 0.13})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  requestAnimationFrame(draw);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);
if (!reducedMotion) requestAnimationFrame(draw);

window.addEventListener(
  "pointermove",
  (event) => {
    pointer = { x: event.clientX, y: event.clientY };
    document.body.classList.add("has-pointer");
    root.style.setProperty("--cursor-x", `${event.clientX}px`);
    root.style.setProperty("--cursor-y", `${event.clientY}px`);
  },
  { passive: true },
);

function updateProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable <= 0 ? 0 : (window.scrollY / scrollable) * 100;
  root.style.setProperty("--scroll", `${Math.min(100, Math.max(0, progress))}%`);
}

updateProgress();
window.addEventListener("scroll", updateProgress, { passive: true });

const revealObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    }
  },
  { threshold: 0.18 },
);

document.querySelectorAll("[data-reveal]").forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index * 60, 260)}ms`;
  revealObserver.observe(element);
});

document.querySelectorAll("a, button, .asset, .glass-card, .mix-node, .person-card").forEach((element) => {
  element.addEventListener("pointerenter", () => document.body.classList.add("is-hovering"));
  element.addEventListener("pointerleave", () => document.body.classList.remove("is-hovering"));
});

document.querySelectorAll(".magnetic").forEach((element) => {
  element.addEventListener("pointermove", (event) => {
    if (reducedMotion || !window.matchMedia("(pointer: fine)").matches) return;
    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    element.style.transform = `translate(${x * 0.08}px, ${y * 0.12}px)`;
  });
  element.addEventListener("pointerleave", () => {
    element.style.transform = "";
  });
});

document.querySelectorAll(".floating-board, .glass-card, .mix-node, .person-card").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    if (reducedMotion || !window.matchMedia("(pointer: fine)").matches) return;
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(1000px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg) translateY(-4px)`;
  });
  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
});
