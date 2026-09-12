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
    initStageReveal('sec5');
    initStageReveal('sec8c', 1);
    initSection5dToggle();
    positionS5dBlur();
    window.addEventListener('resize', positionS5dBlur, { passive: true });
    window.addEventListener('load', positionS5dBlur); // re-measure once images have settled
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(positionS5dBlur); // re-measure once the webfont has actually applied
    }
    setTimeout(positionS5dBlur, 600); // final safety net for any late layout shift
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
    const swipeWrap = document.getElementById('reminderSwipeWrap');

    const sectionBounds = () => {
      const start = s2.offsetTop;
      const end = s2.offsetTop + s2.offsetHeight - fp.clientHeight;
      return { start, end };
    };
    const getProgress = () => {
      const { start, end } = sectionBounds();
      return Math.max(0, Math.min(1, (fp.scrollTop - start) / Math.max(1, end - start)));
    };

    // one scroll before the zoom would otherwise finish, so the swipe
    // triggers a beat early instead of waiting for the very last pixel of zoom
    const SWIPE_THRESHOLD = 0.72;
    const GATE_COOLDOWN_MS = 700;
    let swiped = false;
    let lastGateAt = -Infinity;

    const update = () => {
      const progress = getProgress();
      const transition = Math.max(0, Math.min(1, (fp.scrollTop - s1.offsetTop) / Math.max(1, s1.offsetHeight)));
      s1.style.setProperty('--s9-story-fade', (1 - transition).toFixed(3));
      s2.style.setProperty('--s9-story-image', transition.toFixed(3));
      const scale = 1 + progress * 0.42;
      // set on s2 (a shared ancestor of both the swipe wrapper and the
      // plain phone image) so the custom property reaches whichever one
      // actually reads it in its transform, since CSS vars only inherit
      // downward and this section renders the phone either way.
      s2.style.setProperty('--s9-zoom', scale.toFixed(3));

      // Trigger straight off the real scroll position (fires on every
      // native 'scroll' event, including ones from trackpad/momentum
      // scrolling that skip past wheel-tick handlers entirely) instead of
      // depending on catching one exact 'wheel' event — that's what made
      // the swipe fire inconsistently. Clamp scroll right at the threshold
      // so a fast flick can't blow straight through into the next section
      // before the swipe has a chance to show.
      //
      // Bug this guards against: getProgress() clamps to 1 for ANY
      // scrollTop past this section's own end, not just while inside it.
      // Without the range check below, once `swiped` gets reset to false
      // on leaving (see the IntersectionObserver below), literally any
      // later 'scroll' event anywhere further down the page (section8,
      // section9, ...) would satisfy `progress >= SWIPE_THRESHOLD` again
      // and yank fp.scrollTop back up into this section — making it look
      // like scrolling past it was broken.
      const withinSection = fp.scrollTop <= sectionBounds().end + 20;
      if (swipeWrap && !swiped && progress >= SWIPE_THRESHOLD && withinSection) {
        swiped = true;
        lastGateAt = performance.now();
        swipeWrap.classList.add('is-on');
        fp.scrollTop = sectionBounds().start + (sectionBounds().end - sectionBounds().start) * SWIPE_THRESHOLD;
      }
    };
    fp.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();

    // ---- swipe-to-pay gate: once swiped (see update() above), hold the
    // scroll in place for a beat before letting a further scroll continue
    // on toward the next section (and symmetrically un-swipe on the way
    // back up), same cooldown pattern as the other scroll-gated
    // interactions on this page. ----
    if (swipeWrap) {
      fp.addEventListener('wheel', (e) => {
        if (window.innerWidth <= 900 || !swiped) return;
        const now = performance.now();
        const cooling = now - lastGateAt < GATE_COOLDOWN_MS;
        const down = e.deltaY > 0;

        if (!down) {
          e.preventDefault();
          if (cooling) return;
          swiped = false;
          swipeWrap.classList.remove('is-on');
          lastGateAt = now;
          return;
        }
        // scrolling further down while swiped: hold briefly, then let it
        // proceed on to the next section
        if (cooling) e.preventDefault();
        else lastGateAt = now;
      }, { passive: false });

      if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting && swiped) {
              swiped = false;
              swipeWrap.classList.remove('is-on');
            }
          });
        }, { threshold: 0 }).observe(s2);
      }
    }
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
    const links = [...document.querySelectorAll('.nav-link[data-nav]')];
    if (!links.length || !('IntersectionObserver' in window)) return;

    // every visible section, top to bottom (section numbering the user
    // gave), mapped to which nav item should read active from there on —
    // null means none of them yet (still in the hero).
    const sectionNav = [
      ['sec1', null],
      ['sec2', 'why'],
      ['sec5', 'why'],
      ['sec5b2', 'how'],
      ['sec5c', 'how'],
      ['sec5d', 'how'],
      ['sec7', 'how'],
      ['sec7-2', 'how'],
      ['sec8', 'how'],
      ['sec8b', 'together'],
      ['sec8c', 'together'],
      ['sec9', 'together'],
      ['sec10', 'start'],
    ];
    const navFor = new Map(sectionNav);
    const sections = sectionNav.map(([id]) => document.getElementById(id)).filter(Boolean);
    if (!sections.length) return;

    const setActive = (navKey) => links.forEach((l) => l.classList.toggle('active', !!navKey && l.dataset.nav === navKey));

    const obs = new IntersectionObserver((entries) => {
      entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        .slice(0, 1)
        .forEach((e) => setActive(navFor.get(e.target.id)));
    }, { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] });

    sections.forEach((s) => obs.observe(s));
  }

  /* ---------- smooth scroll ---------- */
  function initSmoothScroll() {
    const behavior = prefersReducedMotion ? 'auto' : 'smooth';
    const fp = document.querySelector('.fp-scroll');
    const go = (sel) => {
      const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
      if (!el) return;
      // scroll-snap-type: mandatory fights a multi-section smooth
      // scrollIntoView — it keeps trying to snap back toward the nearest
      // point mid-animation, so a jump of more than one section (e.g. the
      // "함께 반띵!" nav link from the hero) stalls a few px in and never
      // reaches the target. Suspend snapping for the jump, then restore it.
      if (fp && fp.contains(el)) {
        const prevSnap = fp.style.scrollSnapType;
        const targetTop = el.offsetTop;
        fp.style.scrollSnapType = 'none';
        el.scrollIntoView({ behavior, block: 'start' });
        // belt-and-suspenders: if the smooth scroll gets interrupted, never
        // starts, or never completes for any reason, force the exact final
        // position before handing snapping back — a button that silently
        // falls short of its target is worse than skipping the animation.
        // Race scrollend against a flat timeout instead of trusting either
        // alone (scrollend never fires if the browser never actually
        // started scrolling in the first place).
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          // scrollTo(..., {behavior:'instant'}) — not a raw .scrollTop
          // assignment — because that's what actually supersedes an
          // in-flight smooth scroll-behavior animation; a plain property
          // set can get silently overwritten by the animation's own
          // next frame.
          fp.scrollTo({ top: targetTop, behavior: 'instant' });
          fp.style.scrollSnapType = prevSnap;
        };
        fp.addEventListener('scrollend', finish, { once: true });
        setTimeout(finish, prefersReducedMotion ? 50 : 900);
      } else {
        el.scrollIntoView({ behavior, block: 'start' });
      }
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
        l1Word: '가스비',
        order: ['icloud', 'notify', 'gas-pill', 'chatgpt-pill', 'adobe', 'spotify', 'youtube'],
        hiddenSlot: 'netflix-pill',
        notify: { type: 'img', src: 'images/netflix.png', title: '이번 달 Netflix가 도착했어요', amount: '17,000원' },
        showExtra: false,
      },
      {
        lineStates: { 1: 'medium', 2: 'light', 3: 'active' },
        l1Word: '가스비',
        order: ['icloud', 'netflix-pill', 'gas-pill', 'notify', 'adobe', 'spotify', 'youtube'],
        hiddenSlot: 'chatgpt-pill',
        notify: { type: 'img', src: 'images/GPT.png', title: '이번 달 Chat GPT가 도착했어요', amount: '34,000원' },
        showExtra: false,
      },
      {
        // same scene as above — this step only brings in the bottom heading
        lineStates: { 1: 'medium', 2: 'light', 3: 'active' },
        l1Word: '가스비',
        order: ['icloud', 'netflix-pill', 'gas-pill', 'notify', 'adobe', 'spotify', 'youtube'],
        hiddenSlot: 'chatgpt-pill',
        notify: { type: 'img', src: 'images/GPT.png', title: '이번 달 Chat GPT가 도착했어요', amount: '34,000원' },
        showExtra: true,
      },
    ];

    let frame = 0;

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

    // Pills swap instantly (no fade dip — they never "blink" on a step),
    // but the notify card itself slides open like a shutter/drawer
    // whenever its content actually changes (a different service takes
    // over the card) — skipped when the card's content is unchanged
    // (e.g. the step that only brings in the bottom heading).
    const notifyMask = section.querySelector('.s2-notify-mask');
    const notifyCard = section.querySelector('.s2-notify-card');
    const notifySignature = (f) => JSON.stringify(f.notify);
    let prevNotifySig = notifySignature(FRAMES[0]);

    // Closing the card is cheap (just a class, no content change yet) and
    // happens synchronously so the wheel handler returns fast. The heavier
    // DOM work (onClosed — reordering 7 pills, swapping the icon/text) is
    // deferred into the next animation frame instead of running inline in
    // the scroll handler, which was the actual source of the stutter — then
    // the card opens, revealing the new content, one frame after that.
    // (s2-notify-closed toggles on the mask; the transition:none flush is
    // on the card itself, since that's the element that actually moves.)
    function slideOpenCard(onClosed) {
      if (!notifyMask || !notifyCard) { if (onClosed) onClosed(); return; }
      notifyCard.style.transition = 'none';
      notifyMask.classList.add('s2-notify-closed');
      void getComputedStyle(notifyCard).transform; // flush the closed/no-transition state (style-only, no layout)
      notifyCard.style.transition = '';
      requestAnimationFrame(() => {
        if (onClosed) onClosed();
        requestAnimationFrame(() => notifyMask.classList.remove('s2-notify-closed'));
      });
    }

    // called on entry into section 2 (from section 1, or back up from
    // section 3) — content is already correct (always scene 0), so just
    // replay the open, no content mutation needed
    function playNotifyOpen() {
      slideOpenCard();
    }

    function applyFrame(i) {
      const sig = notifySignature(FRAMES[i]);
      const shouldReplay = sig !== prevNotifySig;
      prevNotifySig = sig;

      if (!shouldReplay) {
        mutateFrame(i);
        return;
      }

      slideOpenCard(() => mutateFrame(i));
    }

    applyFrame(0);

    const isSection2Active = () => Math.abs(fp.scrollTop - section.offsetTop) < 4;

    // Cooldown is measured against a real clock (performance.now()) rather
    // than a setTimeout-driven flag, so it can't be thrown off by timer
    // coalescing/throttling — every wheel tick re-checks actual elapsed time.
    const COOLDOWN_MS = 700;
    let lastStepAt = -Infinity;

    // Trackpad momentum can keep firing wheel ticks for well over COOLDOWN_MS
    // after the physical swipe ends, so cooldown alone still let one swipe
    // punch through 2-3 steps back to back — each one instantly re-closing
    // the card before its open transition ever finished, so the shutter
    // motion never actually got a chance to be seen. A gesture is instead
    // allowed only ONE step: once taken, further ticks are ignored until the
    // wheel stream goes quiet for GESTURE_GAP_MS (i.e. a genuinely new
    // gesture), regardless of how long the old one's momentum keeps trailing.
    const GESTURE_GAP_MS = 160;
    let lastWheelAt = -Infinity;
    let steppedThisGesture = false;

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
      if (now - lastWheelAt > GESTURE_GAP_MS) steppedThisGesture = false;
      lastWheelAt = now;

      if (!wasActiveOnLastWheel) {
        // the very first wheel tick observed once section 2 has settled into
        // view — the gesture that scrolled us here is often still firing
        // residual "momentum" ticks; swallow this one and start the cooldown
        // now so those trailing ticks don't get mistaken for a fresh step
        wasActiveOnLastWheel = true;
        lastStepAt = now;
        steppedThisGesture = false;
        e.preventDefault();
        return;
      }

      const down = e.deltaY > 0;
      const canStep = (down && frame < FRAMES.length - 1) || (!down && frame > 0);
      const cooling = now - lastStepAt < COOLDOWN_MS;

      if (!canStep || steppedThisGesture) {
        // at a boundary (first/last scene) — normally let native scroll-snap
        // carry on to the next/prev section, but if we *just* stepped here,
        // the same gesture's residual momentum could otherwise leak straight
        // through into that section-to-section scroll. Hold it off briefly.
        if (cooling || steppedThisGesture) e.preventDefault();
        return;
      }

      e.preventDefault();
      if (cooling) return; // still cooling down from the last step/entry

      frame += down ? 1 : -1;
      applyFrame(frame);
      lastStepAt = now;
      steppedThisGesture = true;
    }, { passive: false });

    if ('IntersectionObserver' in window) {
      // threshold:0 alone fires the instant a single pixel of the section
      // appears — mid-glide, long before the scroll-snap actually settles,
      // so an animation started there is already finished by the time the
      // section is really on screen. 0.6 fires close to settle instead.
      let wasSettled = false;
      new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.intersectionRatio === 0) {
            if (frame !== 0) { frame = 0; applyFrame(0); }
            wasSettled = false;
            return;
          }
          const settled = entry.intersectionRatio >= 0.6;
          if (settled && !wasSettled) {
            // section 2 has essentially arrived (from section 1 above, or
            // back up from section 3) — it always settles on scene 0, so
            // play the same slide-open on the card as any other scene change
            playNotifyOpen();
          }
          wasSettled = settled;
        });
      }, { threshold: [0, 0.6] }).observe(section);
    }
  }

  /* ---------- generic scroll-stepped reveal ----------
   * Arriving at the section shows only its base content. Each further
   * scroll floats one more [data-stage-item] in, in order — cumulative,
   * nothing already shown goes away. Same entry-swallow / cooldown /
   * boundary-hold mechanics as section 2's stepper, so a single scroll
   * gesture's momentum can't skip steps or leak into the next section.
   * Desktop only — mobile already scrolls normally (no fp-scroll snap).
   * Shared by section 5 (cards) and section 8c (together rows).
   * minStage lets a section start with its first item(s) already shown
   * (section 8c: row 1 shouldn't require a blind scroll to appear) —
   * the stepper then only ever ranges between minStage and maxStage. */
  function initStageReveal(sectionId, minStage = 0) {
    const section = document.getElementById(sectionId);
    const fp = document.querySelector('.fp-scroll');
    if (!section || !fp) return;

    const items = [...section.querySelectorAll('[data-stage-item]')]
      .sort((a, b) => Number(a.dataset.stageItem) - Number(b.dataset.stageItem));
    if (!items.length) return;
    const maxStage = items.length;

    let stage = minStage;

    function applyStage(s) {
      section.dataset.stage = String(s);
      items.forEach((el) => {
        el.classList.toggle('is-visible', Number(el.dataset.stageItem) <= s);
      });
    }
    applyStage(minStage);

    const isActive = () => Math.abs(fp.scrollTop - section.offsetTop) < 4;
    const COOLDOWN_MS = 700;
    let lastStepAt = -Infinity;
    let wasActiveOnLastWheel = false;

    fp.addEventListener('wheel', (e) => {
      if (window.innerWidth <= 900) return;
      const active = isActive();
      if (!active) { wasActiveOnLastWheel = false; return; }

      const now = performance.now();
      if (!wasActiveOnLastWheel) {
        wasActiveOnLastWheel = true;
        lastStepAt = now;
        e.preventDefault();
        return;
      }

      const down = e.deltaY > 0;
      const canStep = (down && stage < maxStage) || (!down && stage > minStage);
      const cooling = now - lastStepAt < COOLDOWN_MS;

      if (!canStep) {
        if (cooling) e.preventDefault();
        return;
      }

      e.preventDefault();
      if (cooling) return;

      stage += down ? 1 : -1;
      applyStage(stage);
      lastStepAt = now;
    }, { passive: false });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && stage !== minStage) {
            stage = minStage;
            applyStage(minStage);
          }
        });
      }, { threshold: 0 }).observe(section);
    }
  }

  /* ---------- section 5d: auto-charge toggle swipe ----------
   * The toggle baked into the screenshot always shows "off" (knob at the
   * left). One scroll inside section 5d swipes it "on" (knob slides right,
   * a matching-green mask covers the image's static knob so nothing
   * ghosts); a further scroll continues on to section 6, same
   * entry-swallow / cooldown / boundary-hold mechanics as the other
   * section steppers. Desktop only — mobile has no fp-scroll snap. */
  function initSection5dToggle() {
    const section = document.getElementById('sec5d');
    const wrap = document.getElementById('s5dPhoneWrap');
    const phone = document.querySelector('.s5d-phone-ui');
    const track = document.getElementById('s5dToggleTrack');
    const knob = document.getElementById('s5dToggleKnob');
    const fp = document.querySelector('.fp-scroll');
    if (!section || !wrap || !phone || !track || !knob || !fp) return;

    // exact pixel measurements taken from images/second_UI.png at its
    // native 424×864 size — scaled to whatever size the image actually
    // renders at, so the overlay lines up with the baked-in toggle at
    // any viewport width, not just the one it was eyeballed at.
    const NATURAL_W = 424;
    const TRACK = { left: 229, top: 590, right: 386, bottom: 638 }; // inset inside the image's own border — that border is left untouched
    const KNOB = { top: 593, size: 41, offLeft: 342, onLeft: 232 };
    const TRACK_FONT = 19; // natural px, matching the baked-in off-state label's measured glyph height

    function positionToggle() {
      const scale = phone.getBoundingClientRect().width / NATURAL_W;
      track.style.left = `${TRACK.left * scale}px`;
      track.style.top = `${TRACK.top * scale}px`;
      track.style.width = `${(TRACK.right - TRACK.left) * scale}px`;
      track.style.height = `${(TRACK.bottom - TRACK.top) * scale}px`;
      track.style.fontSize = `${TRACK_FONT * scale}px`;
      knob.style.top = `${KNOB.top * scale}px`;
      knob.style.width = `${KNOB.size * scale}px`;
      knob.style.height = `${KNOB.size * scale}px`;
      knob.style.left = `${(wrap.classList.contains('is-on') ? KNOB.onLeft : KNOB.offLeft) * scale}px`;
    }
    positionToggle();
    window.addEventListener('resize', positionToggle, { passive: true });
    window.addEventListener('load', positionToggle);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(positionToggle);
    setTimeout(positionToggle, 600);

    let stage = 0;
    const maxStage = 1;

    function setStage(s) {
      stage = s;
      wrap.classList.toggle('is-on', stage === 1);
      const scale = phone.getBoundingClientRect().width / NATURAL_W;
      knob.style.left = `${(stage === 1 ? KNOB.onLeft : KNOB.offLeft) * scale}px`;
    }

    const isActive = () => Math.abs(fp.scrollTop - section.offsetTop) < 4;
    const COOLDOWN_MS = 700;
    let lastStepAt = -Infinity;
    let wasActiveOnLastWheel = false;

    fp.addEventListener('wheel', (e) => {
      if (window.innerWidth <= 900) return;
      const active = isActive();
      if (!active) { wasActiveOnLastWheel = false; return; }

      const now = performance.now();
      if (!wasActiveOnLastWheel) {
        wasActiveOnLastWheel = true;
        lastStepAt = now;
        e.preventDefault();
        return;
      }

      const down = e.deltaY > 0;
      const canStep = (down && stage < maxStage) || (!down && stage > 0);
      const cooling = now - lastStepAt < COOLDOWN_MS;

      if (!canStep) {
        if (cooling) e.preventDefault();
        return;
      }

      e.preventDefault();
      if (cooling) return;

      setStage(stage + (down ? 1 : -1));
      lastStepAt = now;
    }, { passive: false });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && stage !== 0) setStage(0);
        });
      }, { threshold: 0 }).observe(section);
    }
  }

  /* ---------- section 5d: blur backdrop position ----------
   * Pinned with a precise gap above the "정산할 때마다 챙기지 않도록,"
   * heading line — the two sit in different flex columns (visual is
   * bottom-anchored, copy is vertically centered), so getting an exact
   * pixel gap between them needs a real measurement rather than a
   * percentage guess. */
  function positionS5dBlur() {
    const blur = document.querySelector('.s5d-blur');
    const heading = document.querySelector('.s5d-heading');
    const visual = document.querySelector('.s5d-visual');
    if (!blur || !heading || !visual) return;
    const headingRect = heading.getBoundingClientRect();
    const visualRect = visual.getBoundingClientRect();
    const top = headingRect.top - visualRect.top - blur.offsetHeight - 34;
    blur.style.top = `${top}px`;
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
