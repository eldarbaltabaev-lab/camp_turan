/* =====================================================================
   winter.js — зимние эффекты. Подключать в конце <body>:
     <script src="winter.js"></script>
   Что делает:
   • живой снегопад: снежинки разлетаются от курсора;
   • МЕТЕЛЬ после того, как файлы обработаны;
   • новогодняя гирлянда под шапкой (огоньки зажигаются по очереди);
   • искры-снежинки за курсором;
   • таймер «до Нового года» в шапке;
   • кнопка ❄ выключает все эффекты (выбор запоминается);
   • плавная смена страниц, подсветка активного пункта меню, кнопка «наверх»;
   • горячие клавиши: H справка, N что нового, T тема, W зима, Esc закрыть (любая раскладка);
   • крупный процент в зоне загрузки, «набегающие» цифры итога, поочерёдное появление карточек.
   Логику сайта не трогает. Если удалить файл, сайт работает как раньше.
   ===================================================================== */
(() => {
  'use strict';
  const R = document.documentElement, $ = (s) => document.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* без памяти тоже работает */ } },
  };
  let on = store.get('winter') ? store.get('winter') === 'on' : !reduce;
  R.classList.toggle('winter-off', !on);

  /* ---------- холст со снегом ---------- */
  const cv = document.createElement('canvas'); cv.id = 'snow'; document.body.appendChild(cv);
  const g = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1, mx = -999, my = -999, last = 0, raf = 0, blizzUntil = 0, blizzStart = 0;
  const sprites = [], F = [];

  function buildSprites() {
    sprites.length = 0;
    const light = R.dataset.theme === 'light';
    for (let s = 0; s < 4; s++) {
      const size = Math.ceil((2 + s * 1.6) * 2 + 6), c = document.createElement('canvas'), x = c.getContext('2d');
      c.width = c.height = size;
      const gr = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      if (light) { gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.55, 'rgba(186,220,250,.95)'); gr.addColorStop(1, 'rgba(120,170,220,0)'); }
      else { gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.5, 'rgba(255,255,255,.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); }
      x.fillStyle = gr; x.beginPath(); x.arc(size / 2, size / 2, size / 2, 0, 6.283); x.fill();
      sprites.push(c);
    }
  }
  const flake = (anywhere, temp) => {
    const z = Math.floor(Math.random() * 4);
    return { x: Math.random() * W, y: anywhere ? Math.random() * H : -12, z, vy: (.35 + z * .28 + Math.random() * .25) * (temp ? 3 : 1),
      ph: Math.random() * 6.28, amp: .25 + Math.random() * .45, a: .55 + Math.random() * .45, temp: !!temp };
  };
  function resize() {
    W = innerWidth; H = innerHeight; dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.max(45, Math.min(110, Math.round(W * H / 16000)));
    const base = F.filter((f) => !f.temp);
    while (base.length < n) { const f = flake(true); F.push(f); base.push(f); }
    for (let i = F.length - 1; i >= 0 && base.length > n; i--) if (!F[i].temp) { F.splice(i, 1); base.pop(); }
  }
  function tick(t) {
    const dt = Math.min(2.5, (t - last) / 16.7 || 1); last = t;
    g.clearRect(0, 0, W, H);
    let bw = 0;
    if (t < blizzUntil) {
      const p = (t - blizzStart) / (blizzUntil - blizzStart);
      bw = 2.4 * Math.sin(Math.PI * p);
      for (let i = 0; i < 3 && F.length < 300; i++) { const f = flake(false, true); f.x = Math.random() * W * 1.3 - W * .3; F.push(f); }
    }
    const wind = Math.sin(t / 4000) * .35 + bw;
    for (let i = F.length - 1; i >= 0; i--) {
      const f = F[i];
      f.ph += .012 * dt; f.x += (Math.sin(f.ph) * f.amp + wind * (1 + f.z * .4)) * dt; f.y += f.vy * dt;
      const dx = f.x - mx, dy = f.y - my, d2 = dx * dx + dy * dy;
      if (d2 < 10000) { const d = Math.sqrt(d2) || 1, k = (100 - d) / 100 * 2.2; f.x += dx / d * k * dt; f.y += dy / d * k * dt * .6; }
      if (f.y > H + 12 || f.x > W + 24 || f.x < -24) {
        if (f.temp) { F.splice(i, 1); continue; }
        f.y = -12; f.x = Math.random() * W;
      }
      const s = sprites[f.z]; g.globalAlpha = f.a; g.drawImage(s, f.x - s.width / 2, f.y - s.height / 2);
    }
    g.globalAlpha = 1;
    raf = requestAnimationFrame(tick);
  }
  function run() {
    cancelAnimationFrame(raf);
    if (on && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(tick); } else g.clearRect(0, 0, W, H);
  }
  function blizzard(ms) {
    if (!on) return;
    blizzStart = performance.now(); blizzUntil = blizzStart + (ms || 3500);
  }
  window.winterBlizzard = blizzard;   // можно вызвать из консоли: winterBlizzard(5000)

  /* ---------- сугроб внизу экрана ---------- */
  const bank = document.createElement('div'); bank.className = 'snowbank'; document.body.appendChild(bank);

  /* ---------- гирлянда ---------- */
  const gar = document.createElement('div'); gar.className = 'garland'; document.body.appendChild(gar);
  const COLORS = ['#ff5d5d', '#ffd166', '#5eead4', '#7dd3fc', '#c4b5fd'];
  function buildGarland() {
    const hd = $('header'); gar.style.top = (hd ? hd.offsetHeight - 1 : 67) + 'px';
    gar.textContent = '';
    const w = innerWidth, seg = 230, sag = 26, n = Math.ceil(w / seg);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', w); svg.setAttribute('height', 60); svg.setAttribute('viewBox', '0 0 ' + w + ' 60');
    let d = '', bi = 0;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < n; i++) {
      const x0 = i * seg;
      d += 'M' + x0 + ',0 Q' + (x0 + seg / 2) + ',' + (sag * 2) + ' ' + (x0 + seg) + ',0 ';
      for (let k = 1; k <= 5; k++) {
        const t = k / 6, b = document.createElement('i');
        b.className = 'bulb';
        b.style.left = (x0 + seg * t).toFixed(1) + 'px';
        b.style.top = (2 * (1 - t) * t * sag * 2 + 1).toFixed(1) + 'px';
        b.style.setProperty('--c', COLORS[bi % COLORS.length]);
        b.style.setProperty('--i', bi);
        b.style.setProperty('--d', (Math.random() * 2.6).toFixed(2));
        frag.appendChild(b); bi++;
      }
    }
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d); svg.appendChild(path);
    gar.append(svg, frag);
  }

  /* ---------- кнопка ❄ и таймер до Нового года ---------- */
  const themeBtn = $('#themeToggle');
  if (themeBtn) {
    const host = themeBtn.parentElement.classList.contains('theme-switch') ? themeBtn.parentElement : themeBtn;
    const chipHost = host.parentElement;
    const tg = document.createElement('button');
    tg.id = 'winterToggle'; tg.className = 'theme-toggle winter-toggle'; tg.type = 'button';
    tg.title = 'Зимние эффекты: снег, гирлянда, искры (W)'; tg.textContent = '❄️';
    tg.setAttribute('aria-label', 'Зимние эффекты'); tg.setAttribute('aria-pressed', on);
    tg.addEventListener('click', () => {
      on = !on; store.set('winter', on ? 'on' : 'off'); R.classList.toggle('winter-off', !on); tg.setAttribute('aria-pressed', on);
      if (on) { resize(); buildGarland(); } run();
    });
    host.insertAdjacentElement('afterend', tg);

    const now = new Date(), m = now.getMonth(), day = now.getDate();
    let html = '';
    if (m === 0 && day <= 10) html = '<i>🎆</i><span>С Новым годом!</span>';
    else if (m >= 10) {
      const days = Math.ceil((new Date(now.getFullYear() + 1, 0, 1) - now) / 864e5);
      html = '<i>🎄</i><b>' + days + '</b><span> дн. до Нового года</span>';
    }
    if (html) {
      const chip = document.createElement('span');
      chip.className = 'ny-chip'; chip.title = 'До Нового года'; chip.innerHTML = html;
      chipHost.appendChild(chip);
    }
  }

  /* ---------- искры за курсором ---------- */
  let lastSpark = 0, alive = 0;
  addEventListener('pointermove', (e) => {
    mx = e.clientX; my = e.clientY;
    if (!on || e.pointerType === 'touch') return;
    const n = performance.now();
    if (n - lastSpark < 70 || alive > 14) return;
    lastSpark = n;
    const s = document.createElement('i');
    s.className = 'spark'; s.textContent = '❄';
    s.style.left = e.clientX + 'px'; s.style.top = e.clientY + 'px';
    s.style.fontSize = (8 + Math.random() * 7) + 'px';
    s.style.setProperty('--dx', (Math.random() * 40 - 20) + 'px');
    s.style.setProperty('--dy', (20 + Math.random() * 30) + 'px');
    s.style.setProperty('--r', (Math.random() * 180 - 90) + 'deg');
    document.body.appendChild(s); alive++;
    s.addEventListener('animationend', () => { s.remove(); alive--; });
  }, { passive: true });
  addEventListener('pointerleave', () => { mx = my = -999; });

  /* ---------- метель после загрузки файлов (когда «Общий итог» стал виден) ---------- */
  const sum = $('#summary');
  if (sum) {
    let wasHidden = sum.classList.contains('hidden');
    new MutationObserver(() => {
      const hidden = sum.classList.contains('hidden');
      if (wasHidden && !hidden) { blizzard(3800); requestAnimationFrame(() => countUp(sum)); }
      wasHidden = hidden;
    }).observe(sum, { attributes: true, attributeFilter: ['class'] });
  }


  /* ---------- «набегающие» цифры итога ---------- */
  function countUp(root) {
    if (!on || reduce) return;
    root.querySelectorAll('td.value-cell').forEach((td) => {
      const txt = td.textContent.trim();
      if (!/^\d{1,6}$/.test(txt)) return;
      const to = +txt, t0 = performance.now(), dur = 700;
      (function step(t) {
        const p = Math.min(1, (t - t0) / dur);
        td.textContent = p < 1 ? String(Math.round(to * (1 - Math.pow(1 - p, 3)))) : txt;
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    });
  }

  /* ---------- карточки файлов появляются по очереди ---------- */
  const res = $('#results');
  if (res) new MutationObserver(() => [...res.children].forEach((c, i) => c.style.setProperty('--n', i))).observe(res, { childList: true });

  /* ---------- крупный процент в зоне загрузки ---------- */
  const dz = $('#dropzone');
  if (dz && dz.querySelector('.dropzone-inner')) {
    const pct = document.createElement('div'); pct.className = 'dz-pct'; pct.textContent = '0%';
    dz.querySelector('.dropzone-inner').appendChild(pct);
    new MutationObserver(() => { pct.textContent = Math.round(parseFloat(dz.style.getPropertyValue('--progress')) || 0) + '%'; })
      .observe(dz, { attributes: true, attributeFilter: ['style'] });
  }

  /* ---------- меню: активная страница и плавный переход ---------- */
  const here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nvg a[href]').forEach((a) => {
    const f = (a.getAttribute('href').split('/').pop() || '').toLowerCase(), same = f === here;
    if (same) a.setAttribute('aria-current', 'page');
    a.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button || e.ctrlKey || e.metaKey || e.shiftKey || a.target === '_blank') return;
      e.preventDefault();
      if (same) { scrollTo({ top: 0, behavior: 'smooth' }); return; }
      R.classList.add('leaving'); setTimeout(() => { location.href = a.href; }, 220);
    });
  });
  addEventListener('pageshow', (e) => { if (e.persisted) R.classList.remove('leaving'); });

  /* ---------- кнопка «наверх» ---------- */
  const up = document.createElement('button');
  up.className = 'to-top'; up.type = 'button'; up.title = 'Наверх'; up.setAttribute('aria-label', 'Наверх'); up.textContent = '↑';
  up.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
  document.body.appendChild(up);
  addEventListener('scroll', () => up.classList.toggle('show', scrollY > 500), { passive: true });

  /* ---------- панели: «Понятно», оглавление справки, горячие клавиши ---------- */
  document.addEventListener('click', (e) => {
    const c = e.target.closest('[data-close]');
    if (c) { const x = c.closest('.whats-new-panel'); const b = x && x.querySelector('.whats-new-close'); if (b) b.click(); return; }
    const go = e.target.closest('[data-go]');
    if (go) { const el = document.getElementById(go.dataset.go); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    if (e.target.closest && e.target.closest('input,select,textarea,[contenteditable]')) return;
    const press = (id) => { const b = document.getElementById(id); if (b) { e.preventDefault(); b.click(); } };
    if (e.code === 'Escape') {
      ['whatsNewPanel', 'helpPanel'].forEach((id) => {
        const p = document.getElementById(id), b = p && !p.classList.contains('hidden') && p.querySelector('.whats-new-close');
        if (b) b.click();
      });
    } else if (e.code === 'KeyH') press('helpBtn');
    else if (e.code === 'KeyN') press('whatsNewBtn');
    else if (e.code === 'KeyT') press('themeToggle');
    else if (e.code === 'KeyW') press('winterToggle');
  });

  /* ---------- «Настройки»: короткая метель при сохранении ---------- */
  ['savedMsg', 'kwMsg'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) new MutationObserver(() => { if (el.textContent.trim()) blizzard(1300); }).observe(el, { childList: true, characterData: true, subtree: true });
  });

  /* ---------- цвет панели браузера под тему ---------- */
  function themeMeta() {
    let m = $('meta[name="theme-color"]');
    if (!m) { m = document.createElement('meta'); m.name = 'theme-color'; document.head.appendChild(m); }
    m.content = R.dataset.theme === 'light' ? '#eaf3fb' : '#050b1a';
  }

  /* ---------- запуск ---------- */
  new MutationObserver(() => { buildSprites(); themeMeta(); }).observe(R, { attributes: true, attributeFilter: ['data-theme'] });
  let rt = 0;
  addEventListener('resize', () => { resize(); clearTimeout(rt); rt = setTimeout(buildGarland, 200); });
  document.addEventListener('visibilitychange', run);
  buildSprites(); themeMeta(); resize(); buildGarland(); run();
  if (on) setTimeout(() => blizzard(2600), 700);   // небольшая метель при входе на страницу
})();
