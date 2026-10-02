(() => {
  "use strict";
  const section = document.querySelector(".cinema-scroll"),
    root = document.documentElement;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const track = document.querySelector(".sights-track"),
    controls = document.querySelector(".sights-controls");
  const slider = document.querySelector(".sights-slider"),
    intro = document.querySelector(".intro-copy");
  const panel2 = document.querySelector(".story-panel-bridge"),
    panel3 = document.querySelector(".story-panel-bazaar");
  const originalCards = Array.from(track.children),
    count = originalCards.length;
  let targetMouseX = 0,
    targetMouseY = 0,
    mouseX = 0,
    mouseY = 0,
    targetScroll = 0,
    smoothScroll = 0,
    initialized = false,
    rafPending = false;
  let cards = [],
    active = count,
    normalizing = false;
  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  const smoothstep = (a, b, v) => {
    const x = clamp((v - a) / (b - a));
    return x * x * (3 - 2 * x);
  };
  const lerp = (a, b, t) => a + (b - a) * t;
  const segment = (s, a, b, c, d) => {
    const enter = smoothstep(a, b, s),
      exit = smoothstep(c, d, s);
    return { enter, exit, active: enter * (1 - exit) };
  };
  const set = (name, value) =>
    root.style.setProperty("--" + name, String(value));
  const getScroll = () =>
    clamp(
      -section.getBoundingClientRect().top,
      0,
      section.offsetHeight - innerHeight,
    );
  function updateSlider() {
    const step =
      cards[0].offsetWidth +
      parseFloat(getComputedStyle(track).columnGap || "0");
    set("sights-shift", `${-step * active}px`);
    cards.forEach((card, i) => {
      card.classList.toggle("is-active", i === active);
      card.tabIndex = i === active ? 0 : -1;
      card.setAttribute("aria-pressed", String(i === active));
    });
    const source = document.querySelectorAll("#services [data-home-service]")[
      active % count
    ];
    const link = document.querySelector(".service-open");
    if (source) {
      link.href = source.href;
      link.textContent = `Open ${originalCards[active % count].querySelector("h3").textContent} ↗`;
    }
  }
  function jump(i) {
    normalizing = true;
    track.classList.add("is-jumping");
    active = i;
    updateSlider();
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        track.classList.remove("is-jumping");
        normalizing = false;
      }),
    );
  }
  function normalize() {
    if (active >= count * 2) jump(active - count);
    else if (active < count) jump(active + count);
  }
  function move(dir) {
    if (normalizing) return;
    if (active >= cards.length - 1 || active <= 0) {
      jump(count + (active % count));
      return;
    }
    active += dir;
    updateSlider();
    if (reduceMotion.matches) normalize();
  }
  track.replaceChildren();
  for (let setIndex = 0; setIndex < 3; setIndex++)
    for (const [i, card] of originalCards.entries()) {
      const clone = card.cloneNode(true);
      clone.dataset.sightIndex = setIndex * count + i;
      clone.addEventListener("click", () => {
        active = Number(clone.dataset.sightIndex);
        updateSlider();
        if (reduceMotion.matches) normalize();
      });
      clone.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          clone.click();
        }
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          move(event.key === "ArrowRight" ? 1 : -1);
        }
      });
      track.append(clone);
    }
  cards = Array.from(track.children);
  track.addEventListener("transitionend", (event) => {
    if (event.target === track && event.propertyName === "transform")
      normalize();
  });
  document
    .querySelector(".sight-prev")
    .addEventListener("click", () => move(-1));
  document
    .querySelector(".sight-next")
    .addEventListener("click", () => move(1));
  function update() {
    rafPending = false;
    targetScroll = getScroll();
    if (!initialized || reduceMotion.matches) {
      smoothScroll = targetScroll;
      initialized = true;
    } else smoothScroll = lerp(smoothScroll, targetScroll, 0.14);
    if (Math.abs(smoothScroll - targetScroll) < 0.08)
      smoothScroll = targetScroll;
    mouseX = reduceMotion.matches ? 0 : lerp(mouseX, targetMouseX, 0.12);
    mouseY = reduceMotion.matches ? 0 : lerp(mouseY, targetMouseY, 0.12);
    const f2 = segment(smoothScroll, 560, 900, 1300, 1620),
      f3 = segment(smoothScroll, 1760, 2140, 2540, 2700);
    const progress = clamp(smoothScroll / 2700),
      introExit = smoothstep(90, 650, smoothScroll);
    const sightsEnter = Math.pow(smoothstep(2760, 3560, smoothScroll), 1.55),
      controlsEnter = smoothstep(3360, 3660, smoothScroll);
    const blur = clamp(f2.active + f3.active),
      split = Math.pow(f2.enter, 1.5);
    const backScale = 0.76 + progress * 0.2 + f2.enter * 0.18 + f3.enter * 0.16;
    const sharedY = progress * -74,
      sharedScale = progress * 0.23;
    const screenTop = Math.min(220, Math.max(112, innerHeight * 0.19)) - 50;
    const parentTop = innerHeight - (innerHeight - screenTop) / backScale;
    const values = {
      mx: mouseX.toFixed(4),
      my: mouseY.toFixed(4),
      "scene-progress": clamp(smoothScroll / 3700),
      "back-opacity": 1 - f2.active * 0.06,
      "back-x": `${mouseX * -12}px`,
      "back-y": `${mouseY * -4}px`,
      "back-scale": backScale,
      "four-y": `${10 + progress * 10}vh`,
      "four-scale": 0.78 + progress * 0.16,
      "bazaar-y": `${20 - progress * 8}vh`,
      "blur-px": `${blur * 14}px`,
      "back-brightness": 1 - blur * 0.255,
      "bazaar-blur-px": `${f2.active * 14}px`,
      "bazaar-brightness": 1 - f2.active * 0.255 - f3.active * 0.06,
      "bazaar-saturation": 1 + f3.active * 0.18,
      "shade-opacity": 1,
      "shade-z": f2.active > 0.02 ? 2 : 0,
      "shade-top-alpha": blur * 0.465,
      "shade-mid-alpha": blur * 0.42,
      "shade-bottom-alpha": blur * 0.51,
      "title-y": `${introExit * -210}px`,
      "title-scale": 1 - introExit * 0.08,
      "title-opacity": 1 - introExit,
      "bridge-x": `calc(-50% + ${mouseX * 18}px)`,
      "bridge-y": `${mouseY * 8 + sharedY - f2.exit * 760}px`,
      "bridge-bottom": `${5 - f2.enter * 13}vh`,
      "bridge-width": `${67.2 + f2.enter * 37.8}vw`,
      "bridge-scale": 1.02 + sharedScale + f2.exit * 0.46,
      "split-left-x": `calc(-50% + ${-split * 46}vw + ${mouseX * 22}px)`,
      "split-left-y": `${mouseY * 10 + sharedY - split * 180}px`,
      "split-left-scale": 1 + sharedScale + f2.enter * 0.74,
      "split-right-x": `calc(-50% + ${split * 46}vw + ${mouseX * 22}px)`,
      "split-right-y": `${mouseY * 10 + sharedY - split * 180}px`,
      "split-right-scale": 1 + sharedScale + f2.enter * 0.74,
      "frame2-opacity": f2.active * (1 - f3.enter),
      "frame2-x": `calc(-50% + ${mouseX * 10}px)`,
      "frame2-y": `calc(-50% + ${mouseY * 8 - f2.exit * 150}px)`,
      "frame2-scale": 1.06 + f2.enter * 0.08 + f2.exit * 0.08,
      "intro-copy-y": `${introExit * 90}px`,
      "intro-copy-opacity": 1 - introExit,
      "panel2-opacity": f2.active * (1 - f2.exit),
      "panel2-y": `calc(-50% + ${-f2.exit * 86 + (1 - f2.enter) * 58}px)`,
      "panel3-opacity": f3.active * (1 - f3.exit),
      "panel3-y": `calc(-50% + ${-f3.exit * 86 + (1 - f3.enter) * 58}px)`,
      "sights-opacity": sightsEnter,
      "sights-controls-opacity": controlsEnter,
      "sights-visibility": sightsEnter > 0.01 ? "visible" : "hidden",
      "sights-y": "0px",
      "sights-enter-x": `${(1 - sightsEnter) * 420}vw`,
      "sights-scale": 1 / backScale,
      "sights-top": `${parentTop}px`,
      "sights-screen-top": `${screenTop}px`,
    };
    Object.entries(values).forEach(([key, value]) => set(key, value));
    // Keep the selected Workforce service visible despite the scaled parent's left edge.
    set(
      "sights-offset",
      `${innerWidth * 0.03 + (backScale - 1) * innerWidth * 0.53 + mouseX * 12 + (innerWidth <= 640 ? 20 : 48)}px`,
    );
    controls.classList.toggle("is-ready", controlsEnter > 0.98);
    controls.inert = controlsEnter <= 0.98;
    slider.inert = sightsEnter < 0.99;
    intro.inert = introExit > 0.98;
    panel2.inert = f2.active < 0.1;
    panel3.inert = f3.active < 0.1;
    if (
      Math.abs(smoothScroll - targetScroll) > 0.08 ||
      Math.abs(mouseX - (reduceMotion.matches ? 0 : targetMouseX)) > 0.001 ||
      Math.abs(mouseY - (reduceMotion.matches ? 0 : targetMouseY)) > 0.001
    )
      requestTick();
  }
  function requestTick() {
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(update);
    }
  }
  addEventListener("scroll", requestTick, { passive: true });
  addEventListener("resize", () => {
    updateSlider();
    requestTick();
  });
  addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType === "touch") return;
      targetMouseX = event.clientX / innerWidth - 0.5;
      targetMouseY = event.clientY / innerHeight - 0.5;
      requestTick();
    },
    { passive: true },
  );
  reduceMotion.addEventListener("change", () => {
    targetMouseX = targetMouseY = 0;
    requestTick();
  });
  document.querySelectorAll(".scene-img").forEach((img) =>
    img.addEventListener("error", () => {
      img.hidden = true;
      section.dataset.assetFallback = "true";
    }),
  );
  updateSlider();
  requestTick();
})();
