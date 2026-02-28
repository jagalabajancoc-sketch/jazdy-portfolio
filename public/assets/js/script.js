/**
 * script.js — Jazdy Gales Labajan Portfolio
 * ─────────────────────────────────────────
 * Responsibilities:
 *   1. Dark / light theme toggle (persisted in localStorage)
 *   2. Nav: scroll-shadow, active link highlighting, burger menu
 *   3. Smooth section fade-in via IntersectionObserver
 *      (Education timeline entries animate automatically via CSS
 *       stagger — no extra JS needed beyond the .visible trigger)
 *   4. Testimonials carousel (auto-rotate + manual arrows + dots)
 *   5. Contact form: client-side validation + AJAX POST → /api/contact
 *   6. Toast notification helper
 *   7. Footer year auto-update
 *   8. AI Chat Widget
 */

/* ═══════════════════════════════════════════
   1. THEME TOGGLE
═══════════════════════════════════════════ */
(function initTheme() {
  const html       = document.documentElement;
  const toggleBtn  = document.getElementById('themeToggle');
  const toggleBtnMobile = document.getElementById('themeToggleMobile');
  const STORAGE_KEY = 'portfolioTheme';

  const saved = localStorage.getItem(STORAGE_KEY) || 'dark';
  html.setAttribute('data-theme', saved);
  if (toggleBtn) toggleBtn.setAttribute('aria-pressed', saved === 'dark' ? 'true' : 'false');
  if (toggleBtnMobile) toggleBtnMobile.setAttribute('aria-pressed', saved === 'dark' ? 'true' : 'false');

  function toggleTheme() {
    const current = html.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    if (toggleBtn) toggleBtn.setAttribute('aria-pressed', next === 'dark' ? 'true' : 'false');
    if (toggleBtnMobile) toggleBtnMobile.setAttribute('aria-pressed', next === 'dark' ? 'true' : 'false');
    localStorage.setItem(STORAGE_KEY, next);
  }

  if (toggleBtn) toggleBtn.addEventListener('click', toggleTheme);
  if (toggleBtnMobile) toggleBtnMobile.addEventListener('click', toggleTheme);
})();


/* ═══════════════════════════════════════════
   2. NAVIGATION
═══════════════════════════════════════════ */
(function initNav() {
  const header     = document.querySelector('.site-header');
  const burger     = document.getElementById('navBurger');
  const mobileMenu = document.getElementById('mobileMenu');
  const navLinks   = document.querySelectorAll('.nav__links a, .mobile-menu a');
  const sections   = document.querySelectorAll('section[id]');

  /* Scroll shadow */
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  /* Close function */
  function closeMenu() {
    mobileMenu.classList.remove('open');
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('menu-open');
    document.body.style.overflow = '';
  }

  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      burger.classList.toggle('open', isOpen);
      burger.setAttribute('aria-expanded', isOpen.toString());
      mobileMenu.setAttribute('aria-hidden', (!isOpen).toString());
      document.body.classList.toggle('menu-open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    const menuClose = document.getElementById('menuClose');
    if (menuClose) menuClose.addEventListener('click', closeMenu);

    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', closeMenu);
    });
  }

  /* Active link on scroll */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.getAttribute('id');
      navLinks.forEach(link => {
        const isActive = link.getAttribute('href') === `#${id}`;
        link.classList.toggle('active', isActive);
      });
    });
  }, { rootMargin: '-50% 0px -50% 0px' });

  sections.forEach(s => observer.observe(s));
})();


/* ═══════════════════════════════════════════
   3. SECTION FADE-IN (IntersectionObserver)
   Education entries animate via CSS stagger
   once their parent section gets .visible.
═══════════════════════════════════════════ */
(function initFadeIn() {
  const fadeEls = document.querySelectorAll('.fade-in');
  if (!fadeEls.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  fadeEls.forEach(el => io.observe(el));
})();


/* ═══════════════════════════════════════════
   4. TESTIMONIALS CAROUSEL
═══════════════════════════════════════════ */
(function initCarousel() {
  const track    = document.getElementById('carouselTrack');
  const dotsWrap = document.getElementById('carouselDots');
  const prevBtn  = document.getElementById('prevSlide');
  const nextBtn  = document.getElementById('nextSlide');

  if (!track) return;

  const slides  = Array.from(track.querySelectorAll('.carousel__slide'));
  const total   = slides.length;
  let   current = 0;
  let   autoTimer = null;
  const AUTO_MS = 5000;

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'carousel__dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  const dots = Array.from(dotsWrap.querySelectorAll('.carousel__dot'));

  function goTo(index) {
    current = (index + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => {
      d.classList.toggle('active', i === current);
      d.setAttribute('aria-selected', (i === current).toString());
    });
    const slideLabel = slides[current].getAttribute('aria-label');
    track.setAttribute('aria-label', slideLabel || '');
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function startAuto() { stopAuto(); autoTimer = setInterval(next, AUTO_MS); }
  function stopAuto()  { clearInterval(autoTimer); }

  if (prevBtn) prevBtn.addEventListener('click', () => { prev(); startAuto(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { next(); startAuto(); });

  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { prev(); startAuto(); }
    if (e.key === 'ArrowRight') { next(); startAuto(); }
  });

  const carousel = track.closest('.carousel');
  if (carousel) {
    carousel.addEventListener('mouseenter', stopAuto);
    carousel.addEventListener('mouseleave', startAuto);
    carousel.addEventListener('focusin',    stopAuto);
    carousel.addEventListener('focusout',   startAuto);
  }

  let touchStartX = 0;
  track.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].clientX;
    stopAuto();
  }, { passive: true });
  track.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) dx < 0 ? next() : prev();
    startAuto();
  }, { passive: true });

  goTo(0);
  startAuto();
})();


/* ═══════════════════════════════════════════
   5. CONTACT FORM
═══════════════════════════════════════════ */
(function initContactForm() {
  const form      = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  if (!form) return;

  const rules = {
    name:    { el: null, error: null, validate: v => v.trim().length >= 2  ? '' : 'Please enter your full name (min 2 chars).' },
    email:   { el: null, error: null, validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Please enter a valid email address.' },
    subject: { el: null, error: null, validate: v => v.trim().length >= 3  ? '' : 'Subject must be at least 3 characters.' },
    message: { el: null, error: null, validate: v => v.trim().length >= 10 ? '' : 'Message must be at least 10 characters.' },
  };

  rules.name.el      = document.getElementById('contactName');
  rules.name.error   = document.getElementById('nameError');
  rules.email.el     = document.getElementById('contactEmail');
  rules.email.error  = document.getElementById('emailError');
  rules.subject.el   = document.getElementById('contactSubject');
  rules.subject.error = document.getElementById('subjectError');
  rules.message.el   = document.getElementById('contactMessage');
  rules.message.error = document.getElementById('messageError');

  function validateField(key) {
    const { el, error, validate } = rules[key];
    const msg = validate(el.value);
    error.textContent = msg;
    el.classList.toggle('error', !!msg);
    return !msg;
  }

  function validateAll() {
    return Object.keys(rules).map(k => validateField(k)).every(Boolean);
  }

  Object.keys(rules).forEach(k => {
    rules[k].el.addEventListener('blur', () => validateField(k));
    rules[k].el.addEventListener('input', () => {
      if (rules[k].el.classList.contains('error')) validateField(k);
    });
  });

  let currentRatingValue = null;

  form.querySelectorAll('.star-rating label').forEach(label => {
    const inputId = label.getAttribute('for');
    const input   = document.getElementById(inputId);
    if (!input) return;

    label.addEventListener('click', () => {
      const clickedValue = input.value;
      if (currentRatingValue === clickedValue) {
        setTimeout(() => {
          input.checked = false;
          currentRatingValue = null;
        }, 0);
      } else {
        currentRatingValue = clickedValue;
      }
    });
  });

  form.addEventListener('reset', () => { currentRatingValue = null; });

  function getSelectedRating() {
    const checked = form.querySelector('input[name="rating"]:checked');
    return checked ? parseInt(checked.value, 10) : null;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateAll()) return;

    const payload = {
      name:    rules.name.el.value.trim(),
      email:   rules.email.el.value.trim(),
      subject: rules.subject.el.value.trim(),
      message: rules.message.el.value.trim(),
      rating:  getSelectedRating(),
    };

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
      const res = await fetch('/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) {
        let errMsg = 'Something went wrong. Please try again.';
        try {
          const data = await res.json();
          if (data && data.message) errMsg = data.message;
        } catch (_) { /* ignore */ }
        throw new Error(errMsg);
      }

      showToast('✓ Message sent! I\'ll get back to you soon.', 'success');
      form.reset();
      Object.keys(rules).forEach(k => {
        rules[k].el.classList.remove('error');
        rules[k].error.textContent = '';
      });

    } catch (err) {
      showToast(`✕ ${err.message}`, 'error');
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  });
})();


/* ═══════════════════════════════════════════
   6. TOAST NOTIFICATION
═══════════════════════════════════════════ */
let toastTimer = null;

function showToast(message, type = 'success', duration = 4500) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  clearTimeout(toastTimer);
  toast.classList.remove('visible', 'toast--success', 'toast--error');

  toast.textContent = message;
  toast.classList.add(`toast--${type}`);

  void toast.offsetWidth;

  toast.classList.add('visible');

  toastTimer = setTimeout(() => {
    toast.classList.remove('visible');
  }, duration);
}


/* ═══════════════════════════════════════════
   7. FOOTER YEAR
═══════════════════════════════════════════ */
(function setFooterYear() {
  const el = document.getElementById('footerYear');
  if (el) el.textContent = new Date().getFullYear();
})();


/* ═══════════════════════════════════════════
   BONUS: Smooth scroll polyfill for older Safari
═══════════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    const target = document.querySelector(targetId);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});


/* ═══════════════════════════════════════════
   8. AI CHAT WIDGET
═══════════════════════════════════════════ */
(function initChat() {
  const widget      = document.getElementById('chatWidget');
  const bubble      = document.getElementById('chatBubble');
  const panel       = document.getElementById('chatPanel');
  const messages    = document.getElementById('chatMessages');
  const input       = document.getElementById('chatInput');
  const sendBtn     = document.getElementById('chatSend');
  const typingEl    = document.getElementById('chatTyping');
  const badgeEl     = document.getElementById('chatBadge');
  const clearBtn    = document.getElementById('chatClear');
  const suggestWrap = document.getElementById('chatSuggestions');

  if (!widget) return;

  let isOpen       = false;
  let isLoading    = false;
  let hasOpened    = false;
  let conversation = [];

  const WELCOME = "Hey there! 👋 I'm **JGL-Bot**, Jazdy's AI assistant. Ask me anything about his skills, projects, or availability!";

  function now() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function renderText(text) {
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code style="font-family:monospace;background:rgba(52,152,219,.15);padding:1px 4px;border-radius:3px">$1</code>')
      .replace(/\n/g, '<br/>');
  }

  function appendMessage(role, text) {
    const isBot = role === 'assistant';
    const isErr = role === 'error';

    const wrapper = document.createElement('div');
    wrapper.className = `chat-msg chat-msg--${isErr ? 'bot chat-msg--error' : (isBot ? 'bot' : 'user')}`;
    wrapper.innerHTML = `
      <div class="chat-msg__bubble">${renderText(text)}</div>
      <span class="chat-msg__time" aria-hidden="true">${now()}</span>
    `;
    messages.appendChild(wrapper);
    messages.scrollTop = messages.scrollHeight;
    return wrapper;
  }

  function setTyping(on) {
    typingEl.classList.toggle('visible', on);
    if (on) messages.scrollTop = messages.scrollHeight;
  }

  function setSendable(on) {
    sendBtn.disabled = !on;
    sendBtn.setAttribute('aria-disabled', (!on).toString());
  }

  function openChat() {
    isOpen = true;
    widget.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    bubble.setAttribute('aria-expanded', 'true');
    badgeEl.classList.remove('visible');

    if (!hasOpened) {
      hasOpened = true;
      appendMessage('assistant', WELCOME);
    }
    setTimeout(() => input.focus(), 350);
  }

  function closeChat() {
    isOpen = false;
    widget.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    bubble.setAttribute('aria-expanded', 'false');
  }

  bubble.addEventListener('click', () => isOpen ? closeChat() : openChat());

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closeChat();
  });

  clearBtn.addEventListener('click', () => {
    conversation = [];
    messages.innerHTML = '';
    suggestWrap.classList.remove('hidden');
    appendMessage('assistant', WELCOME);
  });

  suggestWrap.querySelectorAll('.chat-suggestion').forEach(btn => {
    btn.addEventListener('click', () => {
      input.value = btn.textContent.trim();
      suggestWrap.classList.add('hidden');
      handleSend();
    });
  });

  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
    setSendable(input.value.trim().length > 0 && !isLoading);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      if (input.value.trim()) handleSend();
    }
  });

  sendBtn.addEventListener('click', () => {
    if (!isLoading && input.value.trim()) handleSend();
  });

  async function handleSend() {
    const userText = input.value.trim();
    if (!userText || isLoading) return;

    suggestWrap.classList.add('hidden');

    input.value = '';
    input.style.height = 'auto';
    setSendable(false);

    appendMessage('user', userText);
    conversation.push({ role: 'user', content: userText });

    isLoading = true;
    setTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: conversation }),
      });

      const data = await res.json();
      setTyping(false);

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Something went wrong. Please try again.');
      }

      appendMessage('assistant', data.reply);
      conversation.push({ role: 'assistant', content: data.reply });

      if (!isOpen) {
        badgeEl.classList.add('visible');
      }

    } catch (err) {
      setTyping(false);
      appendMessage('error', err.message);
      if (conversation[conversation.length - 1]?.role === 'user') {
        conversation.pop();
      }
    } finally {
      isLoading = false;
      setSendable(input.value.trim().length > 0);
    }
  }

  setTimeout(() => {
    if (!hasOpened) {
      badgeEl.classList.add('visible');
    }
  }, 4000);

})();