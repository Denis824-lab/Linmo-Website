"use strict";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const pointerGlow = document.querySelector(".cursor-light");
const menuButton = document.querySelector(".menu-button");
const navigation = document.querySelector(".nav");

menuButton?.addEventListener("click", () => {
  const open = navigation?.classList.toggle("is-open") || false;
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
});
document.querySelectorAll(".nav-links a").forEach((link) => link.addEventListener("click", () => {
  navigation?.classList.remove("is-open");
  menuButton?.setAttribute("aria-expanded", "false");
}));

if (!reducedMotion && pointerGlow) {
  window.addEventListener("pointermove", (event) => {
    pointerGlow.style.left = `${event.clientX}px`;
    pointerGlow.style.top = `${event.clientY}px`;
  }, { passive: true });
}

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("is-visible");
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.14, rootMargin: "0px 0px -40px" });

document.querySelectorAll(".reveal").forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
  revealObserver.observe(element);
});

document.querySelectorAll("[data-tone]").forEach((button) => {
  button.addEventListener("click", () => {
    const copies = {
      "Экран": "Alt+Z — выделите область на экране",
      "Буфер": "Alt+Q — переведите текст из буфера",
      "Речь": "Alt+X — начните голосовой ввод",
    };
    document.querySelectorAll("[data-tone]").forEach((item) => item.classList.toggle("active", item === button));
    const copy = document.querySelector("[data-tone-copy]");
    if (copy) {
      copy.animate([{ opacity: 0, transform: "translateY(5px)" }, { opacity: 1, transform: "none" }], { duration: 280 });
      copy.textContent = copies[button.dataset.tone];
    }
  });
});

if (!reducedMotion) {
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      card.style.setProperty("--x", `${x * 100}%`);
      card.style.setProperty("--y", `${y * 100}%`);
      card.style.transform = `perspective(800px) rotateX(${(0.5 - y) * 3}deg) rotateY(${(x - 0.5) * 3}deg)`;
    });
    card.addEventListener("pointerleave", () => { card.style.transform = ""; });
  });
}

const cookieBar = document.querySelector("[data-cookie-consent]");
const consent = localStorage.getItem("cookie-consent");
if (cookieBar && consent === null) cookieBar.hidden = false;
if (consent === "accepted") loadAnalytics();
document.querySelector("[data-cookie-accept]")?.addEventListener("click", () => {
  localStorage.setItem("cookie-consent", "accepted");
  if (cookieBar) cookieBar.hidden = true;
  loadAnalytics();
});
document.querySelector("[data-cookie-decline]")?.addEventListener("click", () => {
  localStorage.setItem("cookie-consent", "declined");
  if (cookieBar) cookieBar.hidden = true;
});

function loadAnalytics() {
  if (document.querySelector('script[data-linmo-analytics]')) return;
  const analytics = document.createElement("script");
  analytics.async = true;
  analytics.src = "https://mc.yandex.ru/metrika/tag.js";
  analytics.dataset.linmoAnalytics = "true";
  document.head.appendChild(analytics);
  window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
  window.ym.l = Date.now();
  window.ym("110608749", "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
}

async function initDownloadCounter() {
  const countElements = document.querySelectorAll("[data-download-count]");
  if (!countElements.length) return;

  const CACHE_KEY = "linmo_download_count_cache";
  const CACHE_TIME_KEY = "linmo_download_count_time";
  const cachedCount = localStorage.getItem(CACHE_KEY);
  const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

  if (cachedCount && cachedTime && Date.now() - Number(cachedTime) < 15 * 60 * 1000) {
    updateCountUI(Number(cachedCount));
    return;
  }

  try {
    const response = await fetch("https://api.github.com/repos/Denis824-lab/Linmo-Releases/releases");
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const releases = await response.json();

    let totalDownloads = 0;
    if (Array.isArray(releases)) {
      releases.forEach((release) => {
        if (Array.isArray(release.assets)) {
          release.assets.forEach((asset) => {
            if (asset.name && asset.name.toLowerCase().endsWith(".exe")) {
              totalDownloads += asset.download_count || 0;
            }
          });
        }
      });
    }

    if (totalDownloads > 0) {
      localStorage.setItem(CACHE_KEY, String(totalDownloads));
      localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
      updateCountUI(totalDownloads);
    }
  } catch (err) {
    if (cachedCount) {
      updateCountUI(Number(cachedCount));
    }
  }

  function updateCountUI(targetCount) {
    countElements.forEach((el) => {
      const duration = 1200;
      const startTime = performance.now();

      function step(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(easeProgress * targetCount);
        el.textContent = current.toLocaleString("ru-RU");
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = targetCount.toLocaleString("ru-RU");
        }
      }
      requestAnimationFrame(step);
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDownloadCounter);
} else {
  initDownloadCounter();
}
