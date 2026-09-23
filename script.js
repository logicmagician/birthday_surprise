// =================================================================
// BIRTHDAY SURPRISE — SCRIPT
// =================================================================
//
// =============================
// PERSONAL SETTINGS  ← edit these
// =============================
// This is the only section you need to touch to personalize the site.

// Her birthday, as "YYYY-MM-DD". Example: June 3rd, 2000 → "2000-06-03"
const correctBirthday = "2012-02-10";

// Photos for the gallery (and the first one doubles as the hero photo).
const photos = [
  "images/photo1.jpg",
  "images/photo2.jpg",
  "images/photo3.jpg",
  "images/photo4.jpg"
];

// One caption per photo, in the same order as the array above.
const captions = [
  "That smile.",
  "One of my favorite memories.",
  "Still one of my favorite pictures.",
  "And yes… you looked this good."
];

// The three lines on the very first screen.
const welcomeLines = [
  "Hey you…",
  "I made something for you.",
  "But there's one little thing you need to remember first…"
];

// Lines shown right after she gets the birthday right.
const unlockLines = ["Okay… you remembered.", "Let's open this…"];

// The two lines at the top of the main reveal screen.
const mainLines = ["A little something…", "made just for you."];

// The italic line under the hero photo.
const heroMessage =
  "Some people have a way of making ordinary moments feel a little more special just by being themselves.";

// The big final message. Use \n for a line break.
const finalMessage =
  "I don't know what the next year will bring,\nbut I hope it gives you plenty of reasons to smile,\ngrow, and chase everything you dream about.\n\nHappy Birthday ❤️";

// =============================
// END OF PERSONAL SETTINGS
// =============================


(() => {
  "use strict";

  /* ---------------------------------------------------------------
     Small helpers
     --------------------------------------------------------------- */
  const $ = (id) => document.getElementById(id);
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  function announce(text) {
    const el = $("sr-status");
    if (el) el.textContent = text;
  }

  /** Mobile-safe viewport height: sets --vh so `calc(var(--vh,1vh)*100)` works. */
  function setViewportHeightVar() {
    document.documentElement.style.setProperty(
      "--vh",
      `${window.innerHeight * 0.01}px`
    );
  }
  setViewportHeightVar();
  window.addEventListener("resize", setViewportHeightVar);
  window.addEventListener("orientationchange", setViewportHeightVar);

  /**
   * Typewriter: reveals `text` into `el` one character at a time and
   * resolves a promise when finished. Respects reduced-motion by
   * showing the full text immediately.
   */
  function typewrite(el, text, { speed = 34, cursor = true } = {}) {
    return new Promise((resolve) => {
      if (!el) return resolve();
      el.textContent = "";
      if (cursor) el.classList.add("type-cursor");

      if (prefersReducedMotion) {
        el.textContent = text;
        el.classList.remove("type-cursor");
        resolve();
        return;
      }

      let i = 0;
      (function step() {
        if (i <= text.length) {
          el.textContent = text.slice(0, i);
          i++;
          setTimeout(step, speed);
        } else {
          el.classList.remove("type-cursor");
          resolve();
        }
      })();
    });
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, prefersReducedMotion ? 0 : ms));
  }

  /* ---------------------------------------------------------------
     Screen navigation
     --------------------------------------------------------------- */
  const screens = {
    welcome: $("screen-welcome"),
    verify: $("screen-verify"),
    unlock: $("screen-unlock"),
    main: $("screen-main")
  };

  function goToScreen(name) {
    Object.values(screens).forEach((s) => {
      if (!s) return;
      s.classList.remove("is-active");
    });
    const target = screens[name];
    if (target) target.classList.add("is-active");
  }

  /* ---------------------------------------------------------------
     AMBIENT BACKGROUND PARTICLES (stars + soft glow drift)
     Uses <canvas> for the constant starfield (cheap on mobile),
     and occasional DOM particles for hearts/glow moments.
     --------------------------------------------------------------- */
  const canvas = $("bg-canvas");
  const ctx = canvas ? canvas.getContext("2d") : null;
  let stars = [];

  function sizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
  }

  function buildStars() {
    if (!canvas) return;
    const count = window.innerWidth < 600 ? 55 : 90;
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: (Math.random() * 1.2 + 0.3) * window.devicePixelRatio,
      baseAlpha: Math.random() * 0.5 + 0.15,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.4 + 0.15
    }));
  }

  let rafId = null;
  function drawStars(t) {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f3ecf8";
    for (const s of stars) {
      const twinkle = Math.sin(t * 0.0005 * s.speed + s.phase) * 0.35;
      ctx.globalAlpha = Math.max(0, s.baseAlpha + twinkle);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    rafId = requestAnimationFrame(drawStars);
  }

  if (canvas && ctx) {
    sizeCanvas();
    buildStars();
    if (!prefersReducedMotion) {
      rafId = requestAnimationFrame(drawStars);
    } else {
      drawStars(0); // draw once, static
    }
    window.addEventListener("resize", () => {
      sizeCanvas();
      buildStars();
    });
  }

  /**
   * Spawns a single floating DOM particle (heart, star or dot) that
   * drifts upward and fades out, then removes itself. Kept lightweight:
   * only a handful ever exist at once.
   */
  const PARTICLE_GLYPHS = { heart: "♥", star: "✦" };
  let particleBudget = 0; // caps how many can be alive at once
  const MAX_PARTICLES = 14;

  function spawnParticle(kind = "dot", opts = {}) {
    if (prefersReducedMotion) return;
    if (particleBudget >= MAX_PARTICLES) return;
    particleBudget++;

    const el = document.createElement(kind === "dot" ? "span" : "span");
    el.className = `particle particle--${kind}`;
    el.setAttribute("aria-hidden", "true");

    if (kind === "dot") {
      const size = (Math.random() * 3 + 2) * (opts.big ? 2.4 : 1);
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
    } else {
      el.textContent = PARTICLE_GLYPHS[kind] || "✦";
      el.style.fontSize = `${opts.big ? 1.8 : Math.random() * 0.5 + 0.7}rem`;
    }

    const startX = Math.random() * window.innerWidth;
    const startY = window.innerHeight + 20;
    const drift = (Math.random() - 0.5) * 120;
    const duration = Math.random() * 5000 + 6000;

    el.style.left = `${startX}px`;
    el.style.top = `${startY}px`;

    document.body.appendChild(el);

    const animation = el.animate(
      [
        { transform: "translate(0, 0)", opacity: 0 },
        { transform: `translate(${drift * 0.3}px, -35vh)`, opacity: opts.big ? 0.9 : 0.6, offset: 0.15 },
        { transform: `translate(${drift}px, -110vh)`, opacity: 0 }
      ],
      { duration, easing: "ease-out" }
    );

    animation.onfinish = () => {
      el.remove();
      particleBudget--;
    };
  }

  let ambientIntervalId = null;
  function startAmbientParticles(rate = 1800) {
    if (prefersReducedMotion) return;
    stopAmbientParticles();
    ambientIntervalId = setInterval(() => {
      const roll = Math.random();
      if (roll < 0.55) spawnParticle("dot");
      else if (roll < 0.85) spawnParticle("star");
      else spawnParticle("heart");
    }, rate);
  }
  function stopAmbientParticles() {
    if (ambientIntervalId) clearInterval(ambientIntervalId);
    ambientIntervalId = null;
  }

  // Gentle ambient drift begins right away, on every screen.
  startAmbientParticles(2200);

  /* ---------------------------------------------------------------
     SCREEN 1 — MYSTERIOUS WELCOME
     --------------------------------------------------------------- */
  async function runWelcome() {
    const l1 = $("welcome-line1");
    const l2 = $("welcome-line2");
    const l3 = $("welcome-line3");
    const beginBtn = $("btn-begin");

    await wait(500);
    await typewrite(l1, welcomeLines[0], { speed: 55 });
    await wait(450);
    await typewrite(l2, welcomeLines[1], { speed: 38 });
    await wait(450);
    await typewrite(l3, welcomeLines[2], { speed: 32 });
    await wait(350);

    beginBtn.classList.remove("is-hidden");
    beginBtn.focus({ preventScroll: true });
  }

  $("btn-begin").addEventListener("click", () => {
    goToScreen("verify");
    $("input-day").focus({ preventScroll: true });
  });

  /* ---------------------------------------------------------------
     SCREEN 2 — BIRTHDAY VERIFICATION
     --------------------------------------------------------------- */
  const birthdayForm = $("birthday-form");
  const verifyMessage = $("verify-message");
  const dateFieldsWrap = document.querySelector(".date-fields");
  const inputDay = $("input-day");
  const inputMonth = $("input-month");
  const inputYear = $("input-year");
  const unlockBtn = $("btn-unlock");

  const wrongMessages = [
    "Hmm… that's not the date I'm looking for 👀",
    "Not quite — try again?",
    "Close, but that's not it."
  ];

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function showVerifyMessage(text, { success = false } = {}) {
    verifyMessage.textContent = text;
    verifyMessage.classList.add("is-visible");
    verifyMessage.classList.toggle("is-success", success);
    announce(text);
  }

  birthdayForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const day = parseInt(inputDay.value, 10);
    const month = parseInt(inputMonth.value, 10);
    const year = parseInt(inputYear.value, 10);

    if (!day || !month || !year || String(year).length !== 4) {
      showVerifyMessage("Just the day, month and full year, please.");
      dateFieldsWrap.classList.remove("is-shaking");
      void dateFieldsWrap.offsetWidth; // restart animation
      dateFieldsWrap.classList.add("is-shaking");
      return;
    }

    const attempt = `${year}-${pad2(month)}-${pad2(day)}`;

    if (attempt === correctBirthday) {
      // Correct: lock the form, show success, move on.
      inputDay.disabled = true;
      inputMonth.disabled = true;
      inputYear.disabled = true;
      unlockBtn.disabled = true;

      showVerifyMessage("", { success: true });
      verifyMessage.classList.remove("is-visible");

      const label = $("btn-unlock-label");
      label.textContent = "✓";

      await runUnlockSequence();
    } else {
      const msg = wrongMessages[Math.floor(Math.random() * wrongMessages.length)];
      showVerifyMessage(msg);
      dateFieldsWrap.classList.remove("is-shaking");
      void dateFieldsWrap.offsetWidth;
      dateFieldsWrap.classList.add("is-shaking");
      inputDay.focus({ preventScroll: true });
    }
  });

  /* ---------------------------------------------------------------
     UNLOCK / CINEMATIC TRANSITION
     --------------------------------------------------------------- */
  async function runUnlockSequence() {
    goToScreen("unlock");

    const line1 = $("unlock-line1");
    const dots = $("unlock-dots");

    await typewrite(line1, unlockLines[0], { speed: 40 });
    await wait(400);

    // Animated dots: "." → ".." → "..."
    for (const frame of [".", "..", "..."]) {
      dots.textContent = frame;
      await wait(320);
    }
    await wait(200);

    line1.classList.remove("type-cursor");
    await typewrite(line1, unlockLines[1], { speed: 34 });
    await wait(500);

    // Burst of particles as the reveal opens.
    for (let i = 0; i < 6; i++) spawnParticle(Math.random() < 0.5 ? "star" : "dot", { big: true });

    goToScreen("main");
    startMainSequence();
  }

  /* ---------------------------------------------------------------
     SCREEN 3 — MAIN BIRTHDAY REVEAL
     --------------------------------------------------------------- */
  let mainSequenceStarted = false;

  async function startMainSequence() {
    if (mainSequenceStarted) return;
    mainSequenceStarted = true;

    const l1 = $("main-line1");
    const l2 = $("main-line2");

    await typewrite(l1, mainLines[0], { speed: 42 });
    await wait(350);
    await typewrite(l2, mainLines[1], { speed: 42 });
    await wait(450);

    // Reveal the hero photo.
    const heroFrame = document.querySelector(".photo-frame--hero");
    const heroImg = $("hero-photo");
    heroImg.src = photos[0] || heroImg.src;
    heroImg.addEventListener(
      "error",
      () => {
        heroFrame.classList.add("is-broken");
      },
      { once: true }
    );
    await wait(150);
    heroFrame.classList.add("is-visible");
    await wait(500);

    // Typewriter message under the hero photo.
    const heroMsgEl = $("hero-message");
    await typewrite(heroMsgEl, heroMessage, { speed: 22 });
    await wait(600);

    // Reveal the gallery.
    initGallery();
    $("gallery").classList.add("is-visible");
    await wait(700);

    // Reveal "one more thing…"
    $("one-more").classList.add("is-visible");

    // Slightly increase ambient particle rate now that we're in the
    // main emotional beat of the page.
    startAmbientParticles(1400);
  }

  /* ---------------------------------------------------------------
     PHOTO MEMORY GALLERY
     --------------------------------------------------------------- */
  let galleryIndex = 0;
  let galleryReady = false;

  function initGallery() {
    if (galleryReady) return;
    galleryReady = true;

    const img = $("gallery-photo");
    img.addEventListener("error", () => {
      const card = $("gallery-card");
      card.style.display = "none";
      $("gallery-caption").textContent = "";
    });

    renderGalleryFrame({ animate: false });

    $("gallery-prev").addEventListener("click", () => changeGalleryPhoto(-1));
    $("gallery-next").addEventListener("click", () => changeGalleryPhoto(1));
  }

  function renderGalleryFrame({ animate = true, direction = 1 } = {}) {
    const img = $("gallery-photo");
    const card = $("gallery-card");
    const caption = $("gallery-caption");
    const progress = $("gallery-progress");
    const prevBtn = $("gallery-prev");
    const nextBtn = $("gallery-next");

    const total = photos.length;
    const applyContent = () => {
      img.src = photos[galleryIndex] || "";
      img.alt = captions[galleryIndex] || `Photo ${galleryIndex + 1}`;
      caption.textContent = captions[galleryIndex] || "";
      progress.textContent = `${pad2(galleryIndex + 1)} / ${pad2(total)}`;
      prevBtn.disabled = galleryIndex === 0;
      nextBtn.disabled = galleryIndex === total - 1;
    };

    if (!animate || prefersReducedMotion) {
      applyContent();
      return;
    }

    const outClass = direction > 0 ? "slide-out-left" : "slide-out-right";
    const inClass = direction > 0 ? "slide-in-right" : "slide-in-left";

    card.classList.add(outClass);

    window.setTimeout(() => {
      applyContent();
      card.classList.remove(outClass);
      card.classList.add(inClass);
      // Force reflow so the browser registers the starting state
      // before we animate to the resting position.
      void card.offsetWidth;
      card.classList.remove(inClass);
    }, 260);
  }

  function changeGalleryPhoto(direction) {
    const total = photos.length;
    const next = galleryIndex + direction;
    if (next < 0 || next >= total) return;
    galleryIndex = next;
    renderGalleryFrame({ animate: true, direction });
  }

  /* ---------------------------------------------------------------
     ONE MORE THING → FINAL MESSAGE
     --------------------------------------------------------------- */
  $("btn-open-final").addEventListener("click", async () => {
    const overlay = $("final-overlay");
    const card = $("final-card");
    const btn = $("btn-open-final");

    btn.disabled = true;
    overlay.classList.add("is-visible");
    overlay.setAttribute("aria-hidden", "false");

    // Give the card a moment to fade in before the text starts.
    await wait(500);

    const msgEl = $("final-message");
    await typewrite(msgEl, finalMessage, { speed: 26 });
    await wait(500);

    $("final-signature").classList.add("is-visible");
    card.classList.add("is-glowing");

    // A calmer, more emotional final flourish: a few extra hearts/stars.
    startAmbientParticles(900);
    for (let i = 0; i < 4; i++) {
      window.setTimeout(() => spawnParticle("heart", { big: true }), i * 600);
    }
  });

  /* ---------------------------------------------------------------
     BACKGROUND MUSIC
     --------------------------------------------------------------- */
  const audio = $("bg-audio");
  const musicBtn = $("music-toggle");
  let audioFailed = false;
  let musicStartedOnce = false;

  audio.addEventListener(
    "error",
    () => {
      audioFailed = true;
      musicBtn.style.display = "none"; // no audio file present — hide control quietly
    },
    { once: true }
  );

  function setMusicButtonState(isPlaying) {
    musicBtn.setAttribute("aria-pressed", String(isPlaying));
    musicBtn.setAttribute(
      "aria-label",
      isPlaying ? "Pause background music" : "Play background music"
    );
  }

  musicBtn.addEventListener("click", async () => {
    if (audioFailed) return;
    try {
      if (audio.paused) {
        await audio.play();
        setMusicButtonState(true);
      } else {
        audio.pause();
        setMusicButtonState(false);
      }
    } catch (err) {
      // Autoplay/playback blocked or file missing — fail quietly.
      audioFailed = true;
      musicBtn.style.display = "none";
    }
  });

  /** Try (politely) to start music right after the first real interaction. */
  async function attemptAutoStartMusic() {
    if (musicStartedOnce || audioFailed) return;
    musicStartedOnce = true;
    try {
      await audio.play();
      setMusicButtonState(true);
    } catch (err) {
      // Browser blocked it — that's fine, the visible control still works.
      setMusicButtonState(false);
    }
  }

  $("btn-begin").addEventListener("click", attemptAutoStartMusic, { once: true });

  /* ---------------------------------------------------------------
     KICK OFF
     --------------------------------------------------------------- */
  runWelcome();

  window.addEventListener("beforeunload", () => {
    if (rafId) cancelAnimationFrame(rafId);
    stopAmbientParticles();
  });
})();
