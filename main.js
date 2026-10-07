import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initAudio, playHeroChord, playSectionTone, playHover, playSuccess } from './audio.js';

gsap.registerPlugin(ScrollTrigger);

// ─── PREMIUM EASES ───────────────────────────────────────────────────────────
const E = {
  out:     'cubic-bezier(0.16, 1, 0.3, 1)',
  inOut:   'cubic-bezier(0.87, 0, 0.13, 1)',
  back:    'cubic-bezier(0.34, 1.56, 0.64, 1)',
  elastic: 'elastic.out(1, 0.4)',
};

// ─── 1. LOADER (Plan 10 — dramatic brand reveal) ──────────────────────────────
function runLoader() {
  return new Promise(resolve => {
    const loader  = document.getElementById('loader');
    const fill    = document.querySelector('.loader-bar-fill');
    const pct     = document.querySelector('.loader-pct');
    const lines   = document.querySelectorAll('.loader-line');
    const logo    = document.querySelector('.loader-logo');
    const barWrap = document.querySelector('.loader-bar-wrap');
    if (!loader) { resolve(); return; }

    const tl = gsap.timeline({ onComplete: resolve });

    tl
      .to(logo,    { opacity: 1, y: 0,  duration: 0.9, ease: E.out }, 0.2)
      .to(barWrap, { opacity: 1,        duration: 0.5               }, 0.7)
      .to({ val: 0 }, {
        val: 100, duration: 2.8, ease: 'power2.inOut',
        onUpdate() {
          const v = Math.round(this.targets()[0].val);
          if (fill) fill.style.width = v + '%';
          if (pct)  pct.textContent  = v + '%';
        },
      }, 0.8);

    lines.forEach((line, i) => {
      tl.to(line, { opacity: 1, y: 0, duration: 0.3, ease: E.out }, 0.9 + i * 0.5);
    });

    // Glitch exit — logo stutters then the loader expands and reveals site
    tl
      .to(logo, { x: 5,  skewX:  4,  duration: 0.06, ease: 'none' }, '+=0.2')
      .to(logo, { x: -4, skewX: -3,  duration: 0.06, ease: 'none' })
      .to(logo, { x: 2,  skewX:  1,  duration: 0.06, ease: 'none' })
      .to(logo, { x: 0,  skewX:  0,  duration: 0.08, ease: 'none' })
      .to('.loader-inner', { y: -60, opacity: 0, duration: 0.7, ease: 'power3.in' }, '+=0.1')
      .to(loader, { scale: 1.06, opacity: 0, duration: 1.3, ease: E.inOut }, '-=0.2')
      .set(loader, { display: 'none' });
  });
}

// ─── 2. LENIS ─────────────────────────────────────────────────────────────────
let lenis;

function initLenis() {
  lenis = new Lenis({
    duration: 1.4,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

// ─── 3. SCROLL PROGRESS ───────────────────────────────────────────────────────
function initScrollProgress() {
  const bar = document.getElementById('scroll-bar');
  if (!bar) return;
  gsap.set(bar, { scaleX: 0, transformOrigin: 'left center' });
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: self => gsap.set(bar, { scaleX: self.progress }),
  });
}

// ─── 4. PAGE TRANSITIONS (Plan 2) ─────────────────────────────────────────────
function initPageTransitions() {
  const strips = gsap.utils.toArray('.pt-s');
  if (!strips.length) return;

  function wipe(onMid) {
    return gsap.timeline()
      .to(strips, { scaleY: 1, duration: 0.45, stagger: 0.06, ease: 'power3.in',  transformOrigin: 'bottom' })
      .call(onMid)
      .to(strips, { scaleY: 0, duration: 0.45, stagger: 0.06, ease: 'power3.out', transformOrigin: 'top'    }, '+=0.05');
  }

  document.querySelectorAll('.nav-link, .footer-col a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (!href?.startsWith('#')) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      wipe(() => lenis.scrollTo(target, { immediate: true }));
    });
  });
}

// ─── 5. CURSOR (Plan 8 — section-aware label) ─────────────────────────────────
function initCursor() {
  const dot   = document.getElementById('cursor-dot');
  const ring  = document.getElementById('cursor-ring');
  const label = document.getElementById('cursor-label');
  if (!dot || !ring) return;
  if (window.matchMedia('(hover: none)').matches) {
    dot.style.display = ring.style.display = 'none';
    if (label) label.style.display = 'none';
    document.body.style.cursor = 'auto';
    return;
  }

  window.addEventListener('mousemove', e => {
    gsap.set(dot, { x: e.clientX, y: e.clientY });
    gsap.to(ring, { x: e.clientX, y: e.clientY, duration: 0.55, ease: 'power3.out' });
    if (label) gsap.set(label, { x: e.clientX + 22, y: e.clientY + 22 });
  });

  // Expand ring + shrink dot on interactive elements
  const expand = () => {
    gsap.to(ring, { width: 68, height: 68, borderColor: 'rgba(0,87,255,0.8)', duration: 0.35, ease: E.back });
    gsap.to(dot,  { scale: 0, duration: 0.2 });
  };
  const contract = () => {
    gsap.to(ring, { width: 36, height: 36, borderColor: 'rgba(0,87,255,0.5)', duration: 0.4, ease: E.out });
    gsap.to(dot,  { scale: 1, duration: 0.25, ease: E.back });
  };

  document.querySelectorAll('a, button, .js-magnetic, .svc-card, .team-item, .port-item').forEach(el => {
    el.addEventListener('mouseenter', () => { expand(); playHover(); });
    el.addEventListener('mouseleave', contract);
  });
}

// ─── 6. SECTION CURSOR LABELS (Plan 8 continued) ──────────────────────────────
function initSectionCursor() {
  const label = document.getElementById('cursor-label');
  if (!label || window.matchMedia('(hover: none)').matches) return;

  const sections = [
    { sel: '.hero',             text: 'Scroll Down'   },
    { sel: '.thesis',           text: 'Our Position'  },
    { sel: '.capabilities',     text: 'Services'      },
    { sel: '.stats',            text: 'By Numbers'    },
    { sel: '.portfolio',        text: 'View Work'     },
    { sel: '.technology',       text: 'Our Stack'     },
    { sel: '.ai-section',       text: 'AI Workflows'  },
    { sel: '.products-section', text: 'We Build'      },
    { sel: '.converge',         text: 'Our Formula'   },
    { sel: '.process',          text: 'Our System'    },
    { sel: '.about',            text: 'VRYKS Media'   },
    { sel: '.team',             text: 'The Founders'  },
    { sel: '.contact',          text: "Let's Build"   },
  ];

  const show = text => {
    label.textContent = text;
    gsap.to(label, { opacity: 1, y: 0, duration: 0.3, ease: E.out });
  };
  const hide = () => gsap.to(label, { opacity: 0, y: 6, duration: 0.2 });

  sections.forEach(({ sel, text }) => {
    const el = document.querySelector(sel);
    if (!el) return;
    ScrollTrigger.create({
      trigger: el, start: 'top 50%', end: 'bottom 50%',
      onEnter: () => show(text), onLeave: hide,
      onEnterBack: () => show(text), onLeaveBack: hide,
    });
  });
}

// ─── 7. MAGNETIC BUTTONS ──────────────────────────────────────────────────────
function initMagnetic() {
  document.querySelectorAll('.js-magnetic').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const dist = Math.hypot(e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2);
      const strength = gsap.utils.clamp(0.2, 1, (100 - dist) / 100);
      gsap.to(el, {
        x: (e.clientX - r.left - r.width  / 2) * 0.38 * strength,
        y: (e.clientY - r.top  - r.height / 2) * 0.48 * strength,
        duration: 0.8, ease: 'power3.out',
      });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 1.2, ease: E.elastic });
    });
  });
}

// ─── 8. VELOCITY SKEW ─────────────────────────────────────────────────────────
function initVelocitySkew() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const proxy  = { skewY: 0 };
  const clamp  = gsap.utils.clamp(-6, 6);
  const setter = gsap.quickSetter('main', 'skewY', 'deg');
  ScrollTrigger.create({
    onUpdate: self => {
      gsap.to(proxy, {
        skewY: clamp(-self.getVelocity() / 280),
        duration: 0.55, ease: 'power3', overwrite: 'auto',
        onUpdate: () => setter(proxy.skewY),
      });
    },
  });
}

// ─── 9. HERO (with audio) ─────────────────────────────────────────────────────
function animateHero() {
  const tl = gsap.timeline({
    defaults: { ease: E.out },
    onComplete: playHeroChord,
  });

  tl
    .addLabel('start')
    .to('.navbar', { opacity: 1, duration: 0.8 }, 'start')
    .from('.hero-title .word', {
      y: '110%', duration: 1.3,
      stagger: { amount: 0.5, ease: 'power2.inOut' },
    }, 'start+=0.15')
    .fromTo('.hero-sub',            { y: 32,  opacity: 0 }, { y: 0, opacity: 1, duration: 1.1 }, '-=0.75')
    .fromTo('.hero-cta-wrap',       { y: 24,  opacity: 0 }, { y: 0, opacity: 1, duration: 1   }, '-=0.65')
    .fromTo('.hero-scroll-indicator', { opacity: 0 },        { opacity: 1, duration: 1           }, '-=0.4');

  // Parallax depth layers (Plan 1)
  gsap.to('.hero-title',    { y: -110, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1   } });
  gsap.to('.hero-sub',      { y: -65,  ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.4 } });
  gsap.to('.hero-cta-wrap', { y: -40,  ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.8 } });
}

// ─── 10. THESIS (Plan 5 — char-by-char reveal) ────────────────────────────────
function animateThesis() {
  const section = document.querySelector('.thesis');
  if (!section) return;

  const tl = gsap.timeline({
    scrollTrigger: { trigger: section, start: 'top top', end: '+=100vh', scrub: 2 },
    onStart: () => playSectionTone('thesis'),
  });

  tl
    .fromTo('.thesis-eyebrow', { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.35 }, 0)
    .fromTo('.t-word', { y: '110%' }, {
      y: '0%', duration: 0.7,
      stagger: { amount: 0.5, ease: 'power2.inOut' },
      ease: E.out,
    }, 0.12)
    .fromTo('.thesis-p1', { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.45 }, 0.62)
    .to('.thesis-highlight', { color: '#0057FF', textShadow: '0 0 40px rgba(0,87,255,0.7)', duration: 0.14 }, 0.80)
    .to('.thesis-highlight', { color: '#f0f0f0', textShadow: 'none',                         duration: 0.14 }, 0.94)
    .fromTo('.thesis-p2', { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.45 }, 1.02);
}

// ─── 11. SERVICES ─────────────────────────────────────────────────────────────
function animateServices() {
  gsap.fromTo('.caps-title', { y: 50, opacity: 0 }, {
    y: 0, opacity: 1, duration: 1.2, ease: E.out,
    scrollTrigger: { trigger: '.caps-header', start: 'top 80%', toggleActions: 'play none none reverse' },
  });
  gsap.fromTo('.caps-header .eyebrow', { opacity: 0, x: -24 }, {
    opacity: 1, x: 0, duration: 0.8, ease: E.out,
    scrollTrigger: { trigger: '.caps-header', start: 'top 85%', toggleActions: 'play none none reverse' },
  });

  document.querySelectorAll('.js-svc-card').forEach(card => {
    const border = card.querySelector('.svc-border');
    const tl = gsap.timeline({
      scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none reverse' },
    });
    tl
      .fromTo(border, { width: '0%' }, { width: '100%', duration: 1.0, ease: E.inOut })
      .to(card, { opacity: 1, y: 0, duration: 0.9, ease: E.out }, '-=0.65');
  });
}

// ─── 12. STATS ────────────────────────────────────────────────────────────────
function animateStats() {
  gsap.fromTo('.stat-item', { opacity: 0, y: 44 }, {
    opacity: 1, y: 0, duration: 1, ease: E.out,
    stagger: { amount: 0.4, ease: 'power2.inOut' },
    scrollTrigger: { trigger: '.stats', start: 'top 78%', toggleActions: 'play none none reverse',
      onEnter: () => playSectionTone('stats') },
  });

  document.querySelectorAll('.js-count').forEach(el => {
    const to = +el.dataset.to;
    ScrollTrigger.create({
      trigger: el.closest('.stat-item'), start: 'top 80%', once: true,
      onEnter: () => {
        gsap.fromTo({ n: 0 }, { n: to }, {
          duration: 2.2, ease: 'power2.out',
          onUpdate() { el.textContent = Math.round(this.targets()[0].n); },
        });
      },
    });
  });
}

// ─── 13. PORTFOLIO (Plan 4 — 3D hover card tilt) ──────────────────────────────
function animatePortfolio() {
  const card   = document.getElementById('port-hover-card');
  const visual = card?.querySelector('.phc-visual');
  const pName  = card?.querySelector('.phc-name');
  const pType  = card?.querySelector('.phc-type');

  gsap.fromTo('.port-heading', { y: 40, opacity: 0 }, {
    y: 0, opacity: 1, duration: 1.1, ease: E.out,
    scrollTrigger: { trigger: '.port-header', start: 'top 82%', toggleActions: 'play none none reverse' },
  });

  gsap.fromTo('.port-item', { opacity: 0, y: 32 }, {
    opacity: 1, y: 0, duration: 0.9, ease: E.out,
    stagger: { amount: 0.45, ease: 'power2.inOut' },
    scrollTrigger: { trigger: '.port-list', start: 'top 80%', toggleActions: 'play none none reverse',
      onEnter: () => playSectionTone('portfolio') },
  });

  if (!card) return;

  // Card trails cursor + 3D tilt based on viewport position (Plan 4)
  window.addEventListener('mousemove', e => {
    const nx = (e.clientX / window.innerWidth  - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    gsap.to(card, {
      x: e.clientX - card.offsetWidth  / 2,
      y: e.clientY - card.offsetHeight / 2,
      rotateY: nx * 14,
      rotateX: ny * -10,
      duration: 0.55,
      ease: 'power3.out',
    });
  });

  document.querySelectorAll('.js-port-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
      if (visual) visual.style.background = item.dataset.gradient;
      if (pName)  pName.textContent        = item.dataset.title;
      if (pType)  pType.textContent        = item.dataset.type;
      gsap.to(['#cursor-dot', '#cursor-ring'], { scale: 0, duration: 0.2 });
      gsap.to(card, { opacity: 1, scale: 1, duration: 0.45, ease: E.back });
    });
    item.addEventListener('mouseleave', () => {
      gsap.to(['#cursor-dot', '#cursor-ring'], { scale: 1, duration: 0.35, ease: E.back });
      gsap.to(card, { opacity: 0, scale: 0.88, rotateY: 0, rotateX: 0, duration: 0.3, ease: 'power2.in' });
    });
  });
}

// ─── 14. INTERSTITIAL ─────────────────────────────────────────────────────────
function animateInterstitial() {
  if (!document.querySelector('.i-word')) return;
  gsap.fromTo('.i-word', { opacity: 0, y: 52, rotateX: -25 }, {
    opacity: 1, y: 0, rotateX: 0,
    duration: 0.9,
    stagger: { amount: 0.5, ease: 'power2.inOut' },
    ease: E.out,
    scrollTrigger: { trigger: '.interstitial', start: 'top 65%', toggleActions: 'play none none reverse' },
  });
}

// ─── 15. CONVERGE ─────────────────────────────────────────────────────────────
function animateConverge() {
  const section = document.querySelector('.converge');
  if (!section) return;

  const tl = gsap.timeline({
    scrollTrigger: { trigger: section, start: 'top top', end: '+=100vh', scrub: 1.8,
      onEnter: () => playSectionTone('converge') },
  });

  tl
    .fromTo('.conv-left',  { x: '-120vw', opacity: 0.4 }, { x: '0vw', opacity: 1, duration: 0.55, stagger: 0.12, ease: 'none' }, 0)
    .fromTo('.conv-right', { x: '120vw',  opacity: 0.4 }, { x: '0vw', opacity: 1, duration: 0.55, stagger: 0.12, ease: 'none' }, 0)
    .fromTo('.conv-sep',   { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, stagger: 0.1, duration: 0.2 }, 0.38)
    .fromTo('.conv-conclusion', { scale: 0.65, opacity: 0, y: 20 }, { scale: 1, opacity: 1, y: 0, duration: 0.45, ease: E.back }, 0.68)
    .to('.conv-result', { textShadow: '0 0 120px rgba(0,87,255,0.9)', duration: 0.2 }, 0.84)
    .to('.conv-result', { textShadow: '0 0 80px rgba(0,87,255,0.6)',  duration: 0.2 }, 1.0);
}

// ─── 16. PROCESS + DIAGRAM (Plan 6) ───────────────────────────────────────────
function animateProcess() {
  const section = document.querySelector('.process');
  if (!section) return;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top 72%',
      toggleActions: 'play none none reverse',
      onEnter: () => playSectionTone('process'),
    },
  });
  tl
    .to('.p-word', {
      y: '0%', duration: 1.1,
      stagger: { amount: 0.45, ease: 'power2.inOut' },
      ease: E.out,
    })
    .fromTo('.process-desc', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, ease: E.out }, '-=0.5');
}

function animateProcessDiagram() {
  const wrap = document.querySelector('.proc-diagram-wrap');
  const path = document.querySelector('.proc-curve');
  if (!wrap || !path) return;

  gsap.fromTo(wrap, { opacity: 0, y: 30 }, {
    opacity: 1, y: 0, duration: 1, ease: E.out,
    scrollTrigger: { trigger: wrap, start: 'top 80%', toggleActions: 'play none none reverse' },
  });

  // Path draw animation
  const len = path.getTotalLength();
  gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
  gsap.to(path, {
    strokeDashoffset: 0, duration: 2.4, ease: 'power2.inOut',
    scrollTrigger: { trigger: wrap, start: 'top 78%', toggleActions: 'play none none reverse' },
  });

  // Nodes appear as path reaches them (staggered to match draw)
  gsap.fromTo('.proc-node', { opacity: 0, scale: 0, transformOrigin: 'center', transformBox: 'fill-box' }, {
    opacity: 1, scale: 1, duration: 0.5, stagger: 0.4, ease: E.back,
    scrollTrigger: { trigger: wrap, start: 'top 75%', toggleActions: 'play none none reverse' },
  });

  // Pulse rings expand outward infinitely
  gsap.fromTo('.proc-pulse', { opacity: 0.7, scale: 1, transformOrigin: 'center', transformBox: 'fill-box' }, {
    opacity: 0, scale: 2.8,
    duration: 1.6,
    stagger: { each: 0.4, repeat: -1 },
    ease: 'power2.out',
    scrollTrigger: { trigger: wrap, start: 'top 75%' },
  });

  // Labels fade in
  gsap.fromTo('.proc-label', { opacity: 0 }, {
    opacity: 1, duration: 0.5, stagger: 0.35,
    scrollTrigger: { trigger: wrap, start: 'top 72%', toggleActions: 'play none none reverse' },
  });

  // Hover on nodes — show label clearly
  document.querySelectorAll('.proc-node-g').forEach(g => {
    g.addEventListener('mouseenter', () => playHover());
  });
}

// ─── 17. TEAM ─────────────────────────────────────────────────────────────────
function animateTeam() {
  document.querySelectorAll('.js-team-item').forEach(item => {
    const rule = item.querySelector('.team-rule');
    const row  = item.querySelector('.team-row');
    if (!rule || !row) return;
    const tl = gsap.timeline({
      scrollTrigger: { trigger: item, start: 'top 80%', toggleActions: 'play none none reverse',
        onEnter: () => playSectionTone('team') },
    });
    tl
      .fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: E.inOut })
      .fromTo(row,  { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: E.out }, '-=0.35');
  });
}

// ─── 18. CONTACT + FORM (Plan 9) ──────────────────────────────────────────────
function animateContact() {
  const tl = gsap.timeline({
    scrollTrigger: { trigger: '.contact', start: 'top 70%', toggleActions: 'play none none reverse',
      onEnter: () => playSectionTone('contact') },
  });
  tl
    .fromTo('.c-part-left',  { x: -100, opacity: 0 }, { x: 0, opacity: 1, duration: 1.2, ease: E.out })
    .fromTo('.c-part-right', { x:  100, opacity: 0 }, { x: 0, opacity: 1, duration: 1.2, ease: E.out }, '<0.06')
    .fromTo('.contact-desc', { y: 24, opacity: 0   }, { y: 0, opacity: 1, duration: 0.9, ease: E.out }, '-=0.55');
}

function initContactForm() {
  const form    = document.querySelector('.js-contact-form');
  const success = document.querySelector('.cf-success');
  if (!form) return;

  // Animate fields in on scroll
  const fields = form.querySelectorAll('.cf-field');
  const foot   = form.querySelector('.cf-foot');

  gsap.fromTo([...fields, foot], { opacity: 0, y: 22 }, {
    opacity: 1, y: 0, duration: 0.8, ease: E.out,
    stagger: { amount: 0.55, ease: 'power2.inOut' },
    scrollTrigger: { trigger: form, start: 'top 80%', toggleActions: 'play none none reverse' },
  });

  // Submit — native submission to FormSubmit while animating
  form.addEventListener('submit', e => {
    const tl = gsap.timeline();
    tl
      .to([...fields, foot], { opacity: 0, y: -22, stagger: 0.05, duration: 0.4, ease: 'power2.in' })
      .to(success, { opacity: 1, scale: 1, duration: 0.8, ease: E.back, pointerEvents: 'all' }, '+=0.1');
    playSuccess();
  });
}

// ─── 19. FOOTER ───────────────────────────────────────────────────────────────
function animateTechnology() {
  const section = document.querySelector('.technology');
  if (!section) return;
  gsap.fromTo('.tech-title .p-word', { y: '110%' }, {
    y: '0%', duration: 1.1, stagger: { amount: 0.4, ease: 'power2.inOut' }, ease: E.out,
    scrollTrigger: { trigger: section, start: 'top 75%', toggleActions: 'play none none reverse' },
  });
  gsap.fromTo('.tech-desc', { opacity: 0, y: 24 }, {
    opacity: 1, y: 0, duration: 0.9, ease: E.out,
    scrollTrigger: { trigger: section, start: 'top 72%', toggleActions: 'play none none reverse' },
  });
  gsap.fromTo('.tech-item', { opacity: 0, y: 20 }, {
    opacity: 1, y: 0, duration: 0.7, ease: E.out,
    stagger: { amount: 0.5, ease: 'power2.inOut' },
    scrollTrigger: { trigger: '.tech-stack-grid', start: 'top 80%', toggleActions: 'play none none reverse' },
  });
}

function animateAiSection() {
  const section = document.querySelector('.ai-section');
  if (!section) return;
  gsap.fromTo('.ai-title .t-word', { y: '110%' }, {
    y: '0%', duration: 1.1, stagger: { amount: 0.4, ease: 'power2.inOut' }, ease: E.out,
    scrollTrigger: { trigger: section, start: 'top 75%', toggleActions: 'play none none reverse' },
  });
  gsap.fromTo('.ai-desc', { opacity: 0, y: 24 }, {
    opacity: 1, y: 0, duration: 0.9, ease: E.out,
    scrollTrigger: { trigger: section, start: 'top 72%', toggleActions: 'play none none reverse' },
  });
  gsap.fromTo('.ai-use-item', { opacity: 0, x: -24 }, {
    opacity: 1, x: 0, duration: 0.7, ease: E.out,
    stagger: { amount: 0.45, ease: 'power2.inOut' },
    scrollTrigger: { trigger: '.ai-uses', start: 'top 80%', toggleActions: 'play none none reverse' },
  });
  gsap.fromTo('.ai-flow', { opacity: 0, y: 30 }, {
    opacity: 1, y: 0, duration: 1, ease: E.out,
    scrollTrigger: { trigger: '.ai-right', start: 'top 80%', toggleActions: 'play none none reverse' },
  });
  gsap.fromTo('.ai-flow-step', { opacity: 0, x: 20 }, {
    opacity: 1, x: 0, duration: 0.5, ease: E.out,
    stagger: { amount: 0.5, ease: 'power2.inOut' },
    scrollTrigger: { trigger: '.ai-flow', start: 'top 75%', toggleActions: 'play none none reverse' },
  });
}

function animateProducts() {
  const section = document.querySelector('.products-section');
  if (!section) return;
  gsap.fromTo('.products-title', { opacity: 0, y: 40 }, {
    opacity: 1, y: 0, duration: 1, ease: E.out,
    scrollTrigger: { trigger: section, start: 'top 78%', toggleActions: 'play none none reverse' },
  });
  gsap.fromTo('.product-card', { opacity: 0, y: 32 }, {
    opacity: 1, y: 0, duration: 0.8, ease: E.out,
    stagger: { amount: 0.4, ease: 'power2.inOut' },
    scrollTrigger: { trigger: '.products-grid', start: 'top 80%', toggleActions: 'play none none reverse' },
  });
}

function animateAbout() {
  const section = document.querySelector('.about');
  if (!section) return;
  gsap.fromTo('.about-title', { opacity: 0, y: 40 }, {
    opacity: 1, y: 0, duration: 1.1, ease: E.out,
    scrollTrigger: { trigger: section, start: 'top 78%', toggleActions: 'play none none reverse' },
  });
  gsap.fromTo('.about-body', { opacity: 0, y: 24 }, {
    opacity: 1, y: 0, duration: 0.9, ease: E.out,
    scrollTrigger: { trigger: '.about-right', start: 'top 80%', toggleActions: 'play none none reverse' },
  });
  gsap.fromTo('.about-meta-item', { opacity: 0, y: 20 }, {
    opacity: 1, y: 0, duration: 0.7, ease: E.out,
    stagger: { amount: 0.3, ease: 'power2.inOut' },
    scrollTrigger: { trigger: '.about-meta-grid', start: 'top 82%', toggleActions: 'play none none reverse' },
  });
}

function animateFooter() {
  gsap.fromTo('.footer-brand', { opacity: 0, y: 30 }, {
    opacity: 1, y: 0, duration: 1, ease: E.out,
    scrollTrigger: { trigger: '.footer', start: 'top 88%', toggleActions: 'play none none reverse' },
  });
  gsap.fromTo('.footer-col', { opacity: 0, y: 24 }, {
    opacity: 1, y: 0, duration: 0.9, ease: E.out,
    stagger: { amount: 0.3, ease: 'power2.inOut' },
    scrollTrigger: { trigger: '.footer', start: 'top 88%', toggleActions: 'play none none reverse' },
  });
}

// ─── 20. VIDEO BACKGROUND ─────────────────────────────────────────────────────
function initVideoBackground() {
  const video = document.getElementById('bg-video');
  if (!video) return;
  const HLS_SRC = 'https://stream.mux.com/8wrHPCX2dC3msyYU9ObwqNdm00u3ViXvOSHUMRYSEe5Q.m3u8';
  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = HLS_SRC;
    video.play().catch(() => {});
  } else {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest/dist/hls.min.js';
    s.onload = () => {
      if (window.Hls?.isSupported()) {
        const hls = new Hls();
        hls.loadSource(HLS_SRC);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
      }
    };
    document.head.appendChild(s);
  }
}

// ─── 21. SCRAMBLE ─────────────────────────────────────────────────────────────
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function scramble(el) {
  const original = el.dataset.original || el.textContent;
  el.dataset.original = original;
  let frame = 0;
  const total = 18;
  const id = setInterval(() => {
    el.textContent = original.split('').map((ch, i) => {
      if (ch === ' ') return ' ';
      if (i < frame / total * original.length) return ch;
      return CHARS[Math.floor(Math.random() * CHARS.length)];
    }).join('');
    if (++frame > total) { clearInterval(id); el.textContent = original; }
  }, 30);
}

function initScramble() {
  document.querySelectorAll('.svc-name, .team-name, .js-scramble').forEach(el => {
    el.addEventListener('mouseenter', () => scramble(el));
  });
}

// ─── 22. NAVBAR ───────────────────────────────────────────────────────────────
function initNavbarScroll() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  ScrollTrigger.create({
    start: 'top -80',
    onUpdate: self => navbar.classList.toggle('navbar--scrolled', self.scroll() > 80),
  });
}

// ─── BOOT ─────────────────────────────────────────────────────────────────────
async function boot() {
  await runLoader();

  initAudio();
  initLenis();
  initScrollProgress();
  initPageTransitions();
  initCursor();
  initSectionCursor();
  initMagnetic();
  initVelocitySkew();
  initVideoBackground();
  initNavbarScroll();

  animateHero();
  animateThesis();
  animateServices();
  animateStats();
  animatePortfolio();
  animateInterstitial();
  animateConverge();
  animateTechnology();
  animateAiSection();
  animateProducts();
  animateProcess();
  animateProcessDiagram();
  animateAbout();
  animateTeam();
  animateContact();
  initContactForm();
  animateFooter();

  initScramble();

  requestAnimationFrame(() => ScrollTrigger.refresh());

}

boot();
