/* ============================================
   반띵 (bandding) Landing — behaviour
   ============================================ */
(() => {
  'use strict';

  /* --------------------------------------------------
   * 이메일 신청 전송 설정
   * --------------------------------------------------
   * SIGNUP_ENDPOINT 를 비워두면 데모 모드 (localStorage 저장).
   * 실제 수집하려면 아래 중 하나의 URL 을 넣으세요:
   *  - Formspree:  https://formspree.io/f/xxxxxxxx
   *  - Google Apps Script 웹앱 URL (doPost 로 e.parameter.email 수신)
   *  - 자체 API 엔드포인트 (POST JSON { email } 수신)
   * -------------------------------------------------- */
  const SIGNUP_ENDPOINT = '';

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const STORE_KEY = 'bandding_signups';
  const BASE_COUNT = 128;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    initHeaderTheme();
    initMobileNav();
    initScrollSpy();
    initSmoothScroll();
    initReveal();
    initChatFlow();
    initSection2Scenes();
    initSection9Zoom();
    initForms();
    renderSignupCount();
  });

  /* Section 9: carry the phone scale forward as the three reference frames scroll by. */
  function initSection9Zoom() {
    const fp = document.querySelector('.fp-scroll');
    const s1 = document.getElementById('sec7');
    const s2 = document.getElementById('sec7-2');
    const s3 = document.getElementById('sec7-3');
    if (!fp || !s1 || !s2 || !s3) return;
    const phones = [s2.querySelector('.reminder-full-phone')].filter(Boolean);
    const update = () => {
      const start = s2.offsetTop;
      const end = s2.offsetTop + s2.offsetHeight - fp.clientHeight;
      const progress = Math.max(0, Math.min(1, (fp.scrollTop - start) / Math.max(1, end - start)));
      const scale = 1 + progress * 0.42;
      phones.forEach((phone) => { phone.style.setProperty('--s9-zoom', scale.toFixed(3)); });
    };
    fp.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  /* ---------- storage ---------- */
  function getSignups() {
    try {
      const list = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
      return Array.isArray(list) ? list : [];
    } catch { return []; }
  }
  function addSignup(email) {
    try {
      const list = getSignups();
      if (!list.includes(email)) {
        list.push(email);
        localStorage.setItem(STORE_KEY, JSON.stringify(list));
      }
    } catch { /* storage blocked */ }
  }
  const hasSignup = (email) => getSignups().includes(email);

  function renderSignupCount() {
    const el = document.getElementById('signupCount');
    if (el) el.textContent = (BASE_COUNT + getSignups().length).toLocaleString('ko-KR');
  }

  /* ---------- header ---------- */
  function initHeader() {
    const header = document.getElementById('header');
    if (!header) return;
    const fp = document.querySelector('.fp-scroll');
    const onScroll = () => {
      const scrolled = window.scrollY > 12 || (fp && fp.scrollTop > 12);
      header.classList.toggle('scrolled', scrolled);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    if (fp) fp.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- header colour vs. dark sections ---------- */
  function initHeaderTheme() {
    const header = document.getElementById('header');
    if (!header) return;
    const darkSections = [...document.querySelectorAll('[data-header-dark]')];
    if (!darkSections.length || !('IntersectionObserver' in window)) return;

    const state = new Map();
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => state.set(e.target, e.isIntersecting));
      header.classList.toggle('on-dark', [...state.values()].some(Boolean));
    }, { rootMargin: '-46% 0px -46% 0px', threshold: 0 });

    darkSections.forEach((s) => obs.observe(s));
  }

  /* ---------- mobile nav ---------- */
  function initMobileNav() {
    const toggle = document.getElementById('navToggle');
    const drawer = document.getElementById('navDrawer');
    if (!toggle || !drawer) return;
    const header = document.getElementById('header');

    const setOpen = (open) => {
      toggle.classList.toggle('open', open);
      drawer.classList.toggle('open', open);
      if (header && open) header.classList.add('scrolled');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    };

    toggle.addEventListener('click', () => setOpen(!drawer.classList.contains('open')));
    drawer.querySelectorAll('a, button').forEach((n) => n.addEventListener('click', () => setOpen(false)));
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  }

  /* ---------- scroll spy ---------- */
  function initScrollSpy() {
    const links = [...document.querySelectorAll('.nav-link')];
    const ids = [...new Set(links.map((l) => l.getAttribute('href')).filter((h) => h && h.startsWith('#')))];
    const sections = ids.map((id) => document.querySelector(id)).filter(Boolean);
    if (!sections.length || !('IntersectionObserver' in window)) return;

    const setActive = (id) => links.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === `#${id}`));

    const obs = new IntersectionObserver((entries) => {
      entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        .slice(0, 1)
        .forEach((e) => setActive(e.target.id));
    }, { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] });

    sections.forEach((s) => obs.observe(s));
  }

  /* ---------- smooth scroll ---------- */
  function initSmoothScroll() {
    const behavior = prefersReducedMotion ? 'auto' : 'smooth';
    const go = (sel) => {
      const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
      if (el) el.scrollIntoView({ behavior, block: 'start' });
    };

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (!href || href === '#') return;
        const el = document.querySelector(href);
        if (!el) return;
        e.preventDefault();
        go(el);
        history.replaceState(null, '', href);
      });
    });

    document.querySelectorAll('[data-scroll]').forEach((btn) => {
      btn.addEventListener('click', () => go(btn.getAttribute('data-scroll')));
    });

    const headerBtn = document.getElementById('headerNotifyBtn');
    if (headerBtn) {
      headerBtn.addEventListener('click', () => {
        go('#sec10');
        const input = document.getElementById('emailInputCta');
        if (input && !prefersReducedMotion) setTimeout(() => input.focus(), 600);
      });
    }
  }

  /* ---------- reveal ---------- */
  function initReveal() {
    const items = [...document.querySelectorAll('[data-reveal]')];
    if (!items.length) return;

    if (!('IntersectionObserver' in window) || prefersReducedMotion) {
      items.forEach((el) => el.classList.add('in-view'));
      return;
    }

    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const sibs = [...(el.parentElement?.children || [])].filter((c) => c.hasAttribute('data-reveal'));
        const idx = Math.max(0, sibs.indexOf(el));
        el.style.transitionDelay = `${Math.min(idx * 80, 320)}ms`;
        el.classList.add('in-view');
        o.unobserve(el);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });

    items.forEach((el) => obs.observe(el));
  }

  /* ---------- chat flow ---------- */
  function initChatFlow() {
    const items = [...document.querySelectorAll('[data-step]')];
    if (!items.length) return;

    let idx = 1 % items.length;
    let timer = null;
    const paint = () => items.forEach((b, i) => b.classList.toggle('active', i === idx));
    const advance = () => { idx = (idx + 1) % items.length; paint(); };
    const start = () => { if (!prefersReducedMotion && !timer) timer = setInterval(advance, 2200); };
    const stop = () => { clearInterval(timer); timer = null; };

    items.forEach((b, i) => b.addEventListener('click', () => { idx = i; paint(); stop(); start(); }));
    paint();

    const section = document.getElementById('sec2');
    if (section && 'IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((e) => (e.isIntersecting ? start() : stop()));
      }, { threshold: 0.3 }).observe(section);
    } else {
      start();
    }
  }

  /* ---------- section 2: scroll-through scenes ----------
   * Section 2 holds 3 "scenes" (frame 0/1/2): the fading headline's
   * active line, the notification card content, and the pill order
   * all change together. Scrolling down while inside section 2 steps
   * through the scenes one at a time instead of leaving the section;
   * only once the last scene is reached does the next scroll continue
   * on to section 3 (and symmetrically in reverse on the way back up).
   * Desktop only — mobile already scrolls normally (no fp-scroll snap). */
  function initSection2Scenes() {
    const section = document.getElementById('sec2');
    const track = document.getElementById('s2Track');
    const fp = document.querySelector('.fp-scroll');
    if (!section || !track || !fp) return;

    const slots = {};
    track.querySelectorAll('[data-slot]').forEach((el) => { slots[el.dataset.slot] = el; });

    const lines = [...section.querySelectorAll('[data-line]')];
    const l1Word = section.querySelector('[data-l1-word]');
    const notifyIconWrap = document.getElementById('s2NotifyIcon');
    const notifyTitle = document.getElementById('s2NotifyTitle');
    const notifyAmount = document.getElementById('s2NotifyAmount');
    const extra = document.getElementById('s2ExtraHeading');

    const FRAMES = [
      {
        lineStates: { 1: 'active', 2: 'medium', 3: 'light' },
        l1Word: '가스비',
        order: ['icloud', 'netflix-pill', 'chatgpt-pill', 'notify', 'adobe', 'spotify', 'youtube'],
        hiddenSlot: 'gas-pill',
        notify: { type: 'mask', title: '이번 달 가스비가 도착했어요', amount: '32,640원' },
        showExtra: false,
      },
      {
        lineStates: { 1: 'light', 2: 'active', 3: 'medium' },
        l1Word: '전기세',
        order: ['icloud', 'notify', 'gas-pill', 'chatgpt-pill', 'adobe', 'spotify', 'youtube'],
        hiddenSlot: 'netflix-pill',
        notify: { type: 'img', src: 'images/netflix.png', title: '이번 달 Netflix가 도착했어요', amount: '17,000원' },
        showExtra: false,
      },
      {
        lineStates: { 1: 'medium', 2: 'light', 3: 'active' },
        l1Word: '전기세',
        order: ['icloud', 'netflix-pill', 'gas-pill', 'notify', 'adobe', 'spotify', 'youtube'],
        hiddenSlot: 'chatgpt-pill',
        notify: { type: 'img', src: 'images/GPT.png', title: '이번 달 Chat GPT가 도착했어요', amount: '34,000원' },
        showExtra: true,
      },
    ];

    let frame = 0;
    const pillRow = section.querySelector('.s2-pill-row');
    const SWAP_MS = 400; // how long the pill row/notify card cross-fades out before the content swaps (~0.8s round trip)

    function mutateFrame(i) {
      const f = FRAMES[i];
      section.dataset.frame = String(i);

      lines.forEach((el) => {
        const state = f.lineStates[el.dataset.line];
        el.classList.toggle('is-medium', state === 'medium');
        el.classList.toggle('is-light', state === 'light');
      });

      if (l1Word) l1Word.textContent = f.l1Word;

      f.order.forEach((key) => { if (slots[key]) track.appendChild(slots[key]); });
      ['netflix-pill', 'gas-pill', 'chatgpt-pill'].forEach((key) => {
        if (slots[key]) slots[key].hidden = key === f.hiddenSlot;
      });

      if (notifyIconWrap) {
        notifyIconWrap.innerHTML = f.notify.type === 'mask'
          ? '<span class="s2-notify-icon-mark" aria-hidden="true"></span>'
          : `<img src="${f.notify.src}" alt="" />`;
      }
      if (notifyTitle) notifyTitle.textContent = f.notify.title;
      if (notifyAmount) notifyAmount.textContent = f.notify.amount;

      if (extra) {
        if (f.showExtra) {
          extra.hidden = false;
          requestAnimationFrame(() => requestAnimationFrame(() => extra.classList.add('is-visible')));
        } else {
          extra.classList.remove('is-visible');
          setTimeout(() => { if (!FRAMES[frame].showExtra) extra.hidden = true; }, 450);
        }
      }
    }

    // applyFrame() plays a brief cross-fade around the content swap (pill
    // row + notify card, which otherwise change instantly/abruptly) so a
    // step reads as a deliberate transition rather than a jarring jump-cut.
    // Pass immediate:true for the very first paint / the exit-reset, where
    // there's no "from" state on screen yet to fade away from.
    function applyFrame(i, immediate) {
      if (immediate || !pillRow) {
        mutateFrame(i);
        return;
      }
      pillRow.classList.add('is-swapping');
      setTimeout(() => {
        mutateFrame(i);
        requestAnimationFrame(() => pillRow.classList.remove('is-swapping'));
      }, SWAP_MS);
    }

    applyFrame(0, true);

    const isSection2Active = () => Math.abs(fp.scrollTop - section.offsetTop) < 4;

    // Cooldown is measured against a real clock (performance.now()) rather
    // than a setTimeout-driven flag, so it can't be thrown off by timer
    // coalescing/throttling — every wheel tick re-checks actual elapsed time.
    const COOLDOWN_MS = 900; // covers the ~0.8s cross-fade so a step can't be interrupted mid-transition
    let lastStepAt = -Infinity;

    // was section 2 the active (settled) section as of the last wheel tick?
    // tracked inside the wheel stream itself (not via IntersectionObserver)
    // so entry-detection and the swallow-the-first-tick guard share one
    // deterministic timeline instead of racing an async observer callback.
    let wasActiveOnLastWheel = false;

    fp.addEventListener('wheel', (e) => {
      if (window.innerWidth <= 900) return; // mobile: plain scroll, no scene-stepping
      const active = isSection2Active();
      if (!active) { wasActiveOnLastWheel = false; return; }

      const now = performance.now();

      if (!wasActiveOnLastWheel) {
        // the very first wheel tick observed once section 2 has settled into
        // view — the gesture that scrolled us here is often still firing
        // residual "momentum" ticks; swallow this one and start the cooldown
        // now so those trailing ticks don't get mistaken for a fresh step
        wasActiveOnLastWheel = true;
        lastStepAt = now;
        e.preventDefault();
        return;
      }

      const down = e.deltaY > 0;
      const canStep = (down && frame < FRAMES.length - 1) || (!down && frame > 0);
      const cooling = now - lastStepAt < COOLDOWN_MS;

      if (!canStep) {
        // at a boundary (first/last scene) — normally let native scroll-snap
        // carry on to the next/prev section, but if we *just* stepped here,
        // the same gesture's residual momentum could otherwise leak straight
        // through into that section-to-section scroll. Hold it off briefly.
        if (cooling) e.preventDefault();
        return;
      }

      e.preventDefault();
      if (cooling) return; // still cooling down from the last step/entry

      frame += down ? 1 : -1;
      applyFrame(frame);
      lastStepAt = now;
    }, { passive: false });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && frame !== 0) {
            frame = 0;
            applyFrame(0, true);
          }
        });
      }, { threshold: 0 }).observe(section);
    }
  }

  /* ---------- forms ---------- */
  function initForms() {
    bindForm({
      form: document.getElementById('emailForm'),
      input: document.getElementById('emailInput'),
      button: document.getElementById('emailSubmit'),
      hint: document.getElementById('formHint'),
      defaultHint: '',
    });
    bindForm({
      form: document.getElementById('emailFormCta'),
      input: document.getElementById('emailInputCta'),
      button: document.getElementById('emailSubmitCta'),
      hint: document.getElementById('formHintCta'),
      defaultHint: null,
    });
  }

  function bindForm({ form, input, button, hint, defaultHint }) {
    if (!form || !input || !button) return;

    const resetHint = () => {
      form.classList.remove('invalid');
      if (hint && defaultHint != null) {
        hint.classList.remove('error');
        hint.textContent = defaultHint;
      } else if (hint) {
        hint.classList.remove('error');
        renderSignupCount();
      }
    };

    const fail = (msg) => {
      form.classList.add('invalid');
      if (hint) { hint.classList.add('error'); hint.textContent = msg; }
      input.focus();
    };

    input.addEventListener('input', () => { if (form.classList.contains('invalid')) resetHint(); });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = input.value.trim().toLowerCase();

      if (!email) return fail('이메일을 입력해주세요.');
      if (!EMAIL_RE.test(email)) return fail('올바른 이메일 형식이 아니에요.');
      if (hasSignup(email)) {
        resetHint();
        showToast('이미 신청된 이메일이에요. 출시되면 알려드릴게요! 🙌');
        input.value = '';
        return;
      }

      button.disabled = true;
      const label = button.innerHTML;
      if (!button.hasAttribute('data-icon-only')) button.textContent = '신청 중…';

      try {
        await sendSignup(email);
        addSignup(email);
        resetHint();
        input.value = '';
        showToast('알림 신청이 완료되었습니다! 🚀');
        renderSignupCount();
      } catch (err) {
        console.error('[bandding] signup failed:', err);
        showToast('일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요.', true);
      } finally {
        button.disabled = false;
        button.innerHTML = label;
      }
    });
  }

  function sendSignup(email) {
    if (!SIGNUP_ENDPOINT) return new Promise((r) => setTimeout(r, 500));

    const isFormspree = /formspree\.io/.test(SIGNUP_ENDPOINT);
    const opts = isFormspree
      ? { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ email, source: 'landing' }) }
      : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, source: 'landing', ts: new Date().toISOString() }) };

    return fetch(SIGNUP_ENDPOINT, opts).then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    });
  }

  /* ---------- toast ---------- */
  let toastTimer = null;
  function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.toggle('error', isError);
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3600);
  }
})();
