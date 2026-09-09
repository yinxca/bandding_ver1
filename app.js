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
    initMobileNav();
    initScrollSpy();
    initSmoothScroll();
    initReveal();
    initChatFlow();
    initForms();
    renderSignupCount();
  });

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
      const label = button.textContent;
      button.textContent = '신청 중…';

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
        button.textContent = label;
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
