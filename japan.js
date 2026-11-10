/* =====================================================================
   japan.js · «Сакура в снегу» (雪桜). Подключать ПОСЛЕ winter.js:
     <script src="japan.js"></script>
   Что делает:
   • лепестки сакуры летят вместе со снегом и разлетаются от курсора;
   • порыв ветра с лепестками, когда файлы обработаны;
   • бумажные фонарики под шапкой (вместо гирлянды);
   • Фудзи с луной (тёмная тема) или красным солнцем (светлая);
   • иероглифические подписи: 昼 День, 夜 Ночь, 設定 Настройки и т.д.;
   • кнопка 🌸 в шапке и клавиша S включают и выключают японский стиль (выбор запоминается).
   Логику сайта не трогает. Если удалить файл, останется зима.
   ===================================================================== */
(() => {
  'use strict';
  const R = document.documentElement, $ = (s) => document.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* без памяти тоже работает */ } },
  };
  let on = store.get('japan') !== 'off';
  R.classList.toggle('jp-off', !on);
  // лепестки и фонарики двигаются, только если японский стиль включён и зимние эффекты не выключены
  const motionOK = () => on && !reduce && !R.classList.contains('winter-off');

  /* ---------- Фудзи ---------- */
  const fuji = document.createElement('div');
  fuji.className = 'jp-fuji'; fuji.setAttribute('aria-hidden', 'true');
  fuji.innerHTML =
    '<svg viewBox="0 0 1440 320" preserveAspectRatio="xMaxYMax slice" xmlns="http://www.w3.org/2000/svg">' +
    '<defs>' +
    '<radialGradient id="jpHalo"><stop offset="0" style="stop-color:var(--sun)" stop-opacity=".5"/><stop offset="1" style="stop-color:var(--sun)" stop-opacity="0"/></radialGradient>' +
    '<clipPath id="jpClip"><path d="M860 320C980 305 1070 185 1160 104Q1200 92 1240 104C1330 185 1420 305 1540 320Z"/></clipPath>' +
    '</defs>' +
    '<circle cx="1010" cy="70" r="96" fill="url(#jpHalo)"/>' +
    '<circle cx="1010" cy="70" r="40" style="fill:var(--sun)" opacity=".85"/>' +
    '<path class="hill" d="M0 320V262C120 238 240 270 380 252C520 234 640 276 800 262C900 254 960 262 1000 266V320Z"/>' +
    '<path class="mtn" d="M860 320C980 305 1070 185 1160 104Q1200 92 1240 104C1330 185 1420 305 1540 320Z"/>' +
    '<path class="cap" clip-path="url(#jpClip)" d="M1090 60H1310V150L1276 158L1256 140L1238 172L1218 146L1200 180L1182 150L1164 174L1148 142L1124 160L1090 152Z"/>' +
    '<path class="hill2" d="M600 320V296C760 280 900 300 1060 292C1200 285 1320 300 1440 292V320Z"/>' +
    '</svg>';
  document.body.appendChild(fuji);

  /* ---------- фонарики ---------- */
  const lan = document.createElement('div'); lan.className = 'jp-lanterns'; lan.setAttribute('aria-hidden', 'true');
  document.body.appendChild(lan);
  const GLYPHS = ['福', '雪', '幸'];
  function buildLanterns() {
    const hd = $('header'); lan.style.top = (hd ? hd.offsetHeight - 1 : 67) + 'px';
    lan.textContent = '';
    const w = innerWidth, n = Math.max(3, Math.floor(w / (w < 1100 ? 150 : 190))), step = w / n;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < n; i++) {
      const el = document.createElement('i'); el.className = 'lan';
      el.style.left = ((i + .5) * step).toFixed(1) + 'px';
      el.style.setProperty('--len', 8 + ((i * 37) % 5) * 6);
      el.style.setProperty('--d', (((i * 53) % 10) / 2).toFixed(1));
      const b = document.createElement('b'); b.textContent = GLYPHS[i % GLYPHS.length];
      el.appendChild(b); frag.appendChild(el);
    }
    lan.appendChild(frag);
  }

  /* ---------- холст с лепестками ---------- */
  const cv = document.createElement('canvas'); cv.id = 'sakura'; cv.setAttribute('aria-hidden', 'true'); document.body.appendChild(cv);
  const g = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1, mx = -999, my = -999, last = 0, raf = 0, gustStart = 0, gustUntil = 0;
  const P = [], sprites = [];
  const SIZES = [5, 7, 9];

  function buildSprites() {
    sprites.length = 0;
    const light = R.dataset.theme === 'light';
    const cols = light ? ['#f8a5c8', '#f472b6', '#ec5f9e'] : ['#ffe9f1', '#fbcfe8', '#f9a8c9'];
    SIZES.forEach((w) => {
      const row = [];
      cols.forEach((col) => {
        const h = w * 1.05, s = Math.ceil(h * 2) + 6, c = document.createElement('canvas'); c.width = c.height = s;
        const x = c.getContext('2d'); x.translate(s / 2, s / 2);
        x.beginPath(); x.moveTo(0, h);
        x.bezierCurveTo(-w * 1.05, h * .5, -w * .8, -h * .75, -w * .2, -h);
        x.lineTo(0, -h * .72); x.lineTo(w * .2, -h);
        x.bezierCurveTo(w * .8, -h * .75, w * 1.05, h * .5, 0, h); x.closePath();
        const gr = x.createLinearGradient(0, h, 0, -h);
        gr.addColorStop(0, '#fff6fa'); gr.addColorStop(.4, col); gr.addColorStop(1, col);
        x.globalAlpha = .95; x.fillStyle = gr; x.fill();
        x.globalAlpha = .35; x.strokeStyle = light ? '#be185d' : '#ffffff'; x.lineWidth = .6; x.stroke();
        row.push(c);
      });
      sprites.push(row);
    });
  }
  const petal = (anywhere, temp) => ({
    x: Math.random() * W, y: anywhere ? Math.random() * H : -16,
    z: Math.floor(Math.random() * 3), c: Math.floor(Math.random() * 3),
    vy: (.45 + Math.random() * .55) * (temp ? 1.7 : 1), ph: Math.random() * 6.28, amp: .4 + Math.random() * .6,
    rot: Math.random() * 6.28, vr: (Math.random() - .5) * .05, fl: Math.random() * 6.28, vf: .02 + Math.random() * .03,
    a: .8 + Math.random() * .2, temp: !!temp,
  });
  function resize() {
    W = innerWidth; H = innerHeight; dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.max(14, Math.min(42, Math.round(W * H / 42000)));
    const base = P.filter((p) => !p.temp);
    while (base.length < n) { const p = petal(true); P.push(p); base.push(p); }
    for (let i = P.length - 1; i >= 0 && base.length > n; i--) if (!P[i].temp) { P.splice(i, 1); base.pop(); }
  }
  function tick(t) {
    const dt = Math.min(2.5, (t - last) / 16.7 || 1); last = t;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    let gw = 0;
    if (t < gustUntil) {
      const p = (t - gustStart) / (gustUntil - gustStart);
      gw = 3.4 * Math.sin(Math.PI * p);
      for (let i = 0; i < 2 && P.length < 150; i++) {
        const f = petal(false, true); f.x = Math.random() * W * .6 - W * .1; f.y = Math.random() * H * .8; P.push(f);
      }
    }
    const wind = Math.sin(t / 5000) * .25 + .12 + gw;
    for (let i = P.length - 1; i >= 0; i--) {
      const f = P[i];
      f.ph += .015 * dt; f.rot += f.vr * dt; f.fl += f.vf * dt;
      f.x += (Math.sin(f.ph) * f.amp + wind * (1 + f.z * .3)) * dt; f.y += f.vy * dt;
      const dx = f.x - mx, dy = f.y - my, d2 = dx * dx + dy * dy;
      if (d2 < 12100) { const d = Math.sqrt(d2) || 1, k = (110 - d) / 110 * 2.4; f.x += dx / d * k * dt; f.y += dy / d * k * dt * .6; f.rot += .08 * dt; }
      if (f.y > H + 16 || f.x > W + 30 || f.x < -30) {
        if (f.temp) { P.splice(i, 1); continue; }
        f.y = -16; f.x = Math.random() * W;
      }
      const sp = sprites[f.z][f.c], sx = .35 + .65 * Math.abs(Math.cos(f.fl)), cs = Math.cos(f.rot), sn = Math.sin(f.rot);
      g.setTransform(cs * sx * dpr, sn * sx * dpr, -sn * dpr, cs * dpr, f.x * dpr, f.y * dpr);
      g.globalAlpha = f.a; g.drawImage(sp, -sp.width / 2, -sp.height / 2);
    }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.globalAlpha = 1;
    raf = requestAnimationFrame(tick);
  }
  function run() {
    cancelAnimationFrame(raf);
    if (motionOK() && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(tick); }
    else { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); g.setTransform(dpr, 0, 0, dpr, 0, 0); }
  }
  function gust(ms) {
    if (!motionOK()) return;
    gustStart = performance.now(); gustUntil = gustStart + (ms || 3600);
  }
  window.japanGust = gust;   // можно вызвать из консоли: japanGust(5000)

  /* ---------- кнопка 🌸 и подпись у новогоднего счётчика ---------- */
  const anchor = $('#winterToggle') || $('#themeToggle');
  let btn = null;
  if (anchor) {
    btn = document.createElement('button');
    btn.id = 'japanToggle'; btn.className = 'theme-toggle japan-toggle'; btn.type = 'button';
    btn.title = 'Японский стиль: сакура, фонарики, Фудзи (S)'; btn.textContent = '🌸';
    btn.setAttribute('aria-label', 'Японский стиль'); btn.setAttribute('aria-pressed', on);
    btn.addEventListener('click', () => { on = !on; store.set('japan', on ? 'on' : 'off'); apply(); });
    anchor.insertAdjacentElement('afterend', btn);
  }
  function apply() {
    R.classList.toggle('jp-off', !on);
    if (btn) btn.setAttribute('aria-pressed', on);
    const ci = $('.ny-chip i'); if (ci) ci.textContent = on ? '🎍' : '🎄';
    if (on) { resize(); buildLanterns(); }
    themeMeta(); run();
  }

  /* ---------- иероглифические подписи ---------- */
  function tag(el, k) {
    if (!el || el.querySelector(':scope > .jp-k')) return;
    const s = document.createElement('small'); s.className = 'jp-k'; s.textContent = k; s.setAttribute('aria-hidden', 'true');
    el.appendChild(s);
  }
  const NAV = { 'index.html': 'ホーム', 'page2.html': '設定' };
  document.querySelectorAll('.nvg a[href]').forEach((a) => { const k = NAV[(a.getAttribute('href').split('/').pop() || '').toLowerCase()]; if (k) tag(a, k); });
  tag($('#helpBtn'), '案内'); tag($('#whatsNewBtn'), '新着');
  tag($('#printDay'), '昼'); tag($('#printNight'), '夜'); tag($('#exportBtn'), '出力');
  const PERIOD = { 'День': '昼', 'Ночь': '夜' };
  function tagPeriods(root) {
    root.querySelectorAll('h3').forEach((h) => {
      const n = h.firstChild; const k = n && n.nodeType === 3 ? PERIOD[n.textContent.trim()] : null;
      if (k) tag(h, k);
    });
  }
  ['#summary', '#results'].forEach((sel) => {
    const el = $(sel); if (!el) return;
    new MutationObserver(() => tagPeriods(el)).observe(el, { childList: true, subtree: true });
  });

  /* ---------- порыв ветра с лепестками после обработки файлов ---------- */
  const sum = $('#summary');
  if (sum) {
    let wasHidden = sum.classList.contains('hidden');
    new MutationObserver(() => {
      const hidden = sum.classList.contains('hidden');
      if (wasHidden && !hidden) gust(3800);
      wasHidden = hidden;
    }).observe(sum, { attributes: true, attributeFilter: ['class'] });
  }
  ['savedMsg', 'kwMsg'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) new MutationObserver(() => { if (el.textContent.trim()) gust(1300); }).observe(el, { childList: true, characterData: true, subtree: true });
  });

  /* ---------- курсор, горячая клавиша S ---------- */
  addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
  addEventListener('pointerleave', () => { mx = my = -999; });
  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || e.code !== 'KeyS') return;
    if (e.target.closest && e.target.closest('input,select,textarea,[contenteditable]')) return;
    if (btn) { e.preventDefault(); btn.click(); }
  });

  /* ---------- цвет панели браузера ---------- */
  function themeMeta() {
    const m = $('meta[name="theme-color"]'); if (!m) return;
    const light = R.dataset.theme === 'light';
    m.content = on ? (light ? '#f5f1e8' : '#070a1c') : (light ? '#eaf3fb' : '#050b1a');
  }

  /* ---------- запуск ---------- */
  new MutationObserver(() => { buildSprites(); themeMeta(); }).observe(R, { attributes: true, attributeFilter: ['data-theme'] });
  new MutationObserver(run).observe(R, { attributes: true, attributeFilter: ['class'] });   // кнопка ❄ тоже гасит лепестки
  let rt = 0;
  addEventListener('resize', () => { resize(); clearTimeout(rt); rt = setTimeout(buildLanterns, 200); });
  document.addEventListener('visibilitychange', run);
  buildSprites(); resize(); buildLanterns(); tagPeriods(document); apply();
  if (motionOK()) setTimeout(() => gust(2400), 900);   // лёгкий порыв при входе
})();
