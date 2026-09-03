/* ============================================================
   PROPERTY CARD ENGINE — shares assets/style.css with the
   person-card engine, but is a separate script since property
   data (address, price, beds/baths, agent) doesn't map onto
   the person schema. Edit this once to change every property
   page that uses property-template/index.html.
   ============================================================ */

(async function () {
  function basePath() {
    return window.location.pathname.endsWith('/')
      ? window.location.pathname
      : window.location.pathname + '/';
  }

  function resolveAsset(file) {
    if (!file) return '';
    return /^https?:\/\//i.test(file) ? file : basePath() + file;
  }

  async function loadData() {
    const res = await fetch(basePath() + 'data.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('data.json not found');
    return res.json();
  }

  function renderHero(d) {
    const heroEl = document.getElementById('propHero');
    if (d.heroPhoto) {
      const img = document.createElement('img');
      img.src = resolveAsset(d.heroPhoto);
      img.alt = d.address || 'Property photo';
      img.onerror = () => { heroEl.innerHTML = '<div class="prop-hero-fallback">Photo unavailable</div>'; };
      heroEl.appendChild(img);
    } else {
      heroEl.innerHTML = '<div class="prop-hero-fallback">No photo added yet</div>';
    }
  }

  function renderIdentity(d) {
    document.title = d.address || 'Property';
    document.getElementById('propAddress').textContent = d.address || '';
    document.getElementById('printQrAddress').textContent = d.address || '';
    if (d.price) document.getElementById('propPrice').textContent = d.price;
  }

  function renderStats(d) {
    const stats = [];
    if (d.beds != null && d.beds !== '') stats.push({ num: d.beds, label: 'Beds' });
    if (d.baths != null && d.baths !== '') stats.push({ num: d.baths, label: 'Baths' });
    if (d.sqft) stats.push({ num: d.sqft, label: 'Sq Ft' });
    if (!stats.length) return;
    document.getElementById('statsRow').innerHTML = stats.map(s => `
      <div class="stat-block">
        <div class="stat-num">${s.num}</div>
        <div class="stat-label">${s.label}</div>
      </div>
    `).join('');
    document.getElementById('statsRow').style.display = 'flex';
  }

  function renderDescription(d) {
    if (!d.description) return;
    document.getElementById('descriptionText').textContent = d.description;
    document.getElementById('descriptionSection').style.display = 'block';
  }

  function renderGallery(d) {
    if (!d.photos || !d.photos.length) return;
    document.getElementById('galleryGrid').innerHTML = d.photos.map(p => `
      <a href="${resolveAsset(p)}" target="_blank" rel="noopener">
        <img src="${resolveAsset(p)}" alt="Property photo" loading="lazy">
      </a>
    `).join('');
    document.getElementById('gallerySection').style.display = 'block';
  }

  function renderAgent(d) {
    if (!d.agentName) return;
    const initials = d.agentName.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
    let avatarHtml;
    if (d.agentPhotoFile) {
      avatarHtml = `<img class="agent-avatar" src="${resolveAsset(d.agentPhotoFile)}" alt="${d.agentName}" onerror="this.outerHTML='<div class=&quot;agent-avatar-fallback&quot;>${initials}</div>'">`;
    } else {
      avatarHtml = `<div class="agent-avatar-fallback">${initials}</div>`;
    }

    document.getElementById('agentBlock').innerHTML = `
      <div class="agent-card">
        ${avatarHtml}
        <div class="agent-info">
          <div class="agent-name">${d.agentName}</div>
          <div class="agent-role">Listing Agent</div>
        </div>
      </div>
    `;

    const rows = [];
    if (d.agentPhone) rows.push({ label: 'Mobile', value: d.agentPhone, href: `tel:${String(d.agentPhone).replace(/[^+\d]/g, '')}` });
    if (d.agentEmail) rows.push({ label: 'Email', value: d.agentEmail, href: `mailto:${d.agentEmail}` });
    if (rows.length) {
      document.getElementById('agentFields').innerHTML = rows.map(r => `
        <a class="field" href="${r.href}" target="_blank" rel="noopener">
          <span class="meta"><div class="label">${r.label}</div><div class="value">${r.value}</div></span>
        </a>
      `).join('');
    }

    document.getElementById('agentSection').style.display = 'block';
  }

  function renderBooking(d) {
    if (!d.bookingUrl) return;
    const btn = document.getElementById('bookShowingBtn');
    btn.href = d.bookingUrl;
    document.getElementById('bookShowingLabel').textContent = d.bookingLabel || 'Schedule a Showing';
    btn.style.display = 'flex';
  }

  // Sends whoever's looking at this listing to property-intake-form.html
  // with its current info already filled in, via a URL parameter — so
  // it can be reviewed visually and edited before sending an update.
  //
  // Also checks for a security token in the URL (?t=...), baked into the
  // physical NFC tag rather than guessable from the address alone. See
  // the matching comment in assets/app.js for the full explanation.
  function renderEditListingLink(d) {
    const link = document.getElementById('editMyInfoLink');
    if (!link) return;

    let tokenStatus = 'none';
    if (d.accessToken) {
      const urlToken = new URLSearchParams(window.location.search).get('t');
      tokenStatus = (urlToken && urlToken === d.accessToken) ? 'verified' : 'unverified';
    }

    const trimmed = {
      address: d.address, price: d.price, sqft: d.sqft, beds: d.beds, baths: d.baths,
      description: d.description, agentName: d.agentName, agentPhone: d.agentPhone,
      agentEmail: d.agentEmail, bookingUrl: d.bookingUrl,
      _tokenStatus: tokenStatus
    };
    const encoded = encodeURIComponent(JSON.stringify(trimmed));
    link.href = `/property-intake-form.html?data=${encoded}`;
  }

  function renderOtherProperty(d) {
    if (!d.otherPropertyUrl) return;
    document.getElementById('otherPropertyLabel').textContent = d.otherPropertyLabel || 'View Another Listing';
    document.getElementById('otherPropertyBtn').href = d.otherPropertyUrl;
    document.getElementById('otherPropertySection').style.display = 'block';
    /* global QRCode */
    new QRCode(document.getElementById('otherPropertyQrcode'), {
      text: d.otherPropertyUrl, width: 180, height: 180,
      colorDark: '#14171c', colorLight: '#ede6d6',
      correctLevel: QRCode.CorrectLevel.M
    });
  }

  function renderQR(d) {
    if (d.showQR === false) return;
    // Uses the canonical domain, not window.location — a visitor could be
    // viewing this listing via an old .vercel.app tag, and the QR it
    // shares should always point at the correct domain regardless.
    const selfUrl = `${PROJECT_BASE_URL}${basePath()}`;
    document.getElementById('qrSection').style.display = 'block';
    /* global QRCode */
    new QRCode(document.getElementById('qrcode'), {
      text: selfUrl, width: 180, height: 180,
      colorDark: '#14171c', colorLight: '#ede6d6',
      correctLevel: QRCode.CorrectLevel.M
    });
  }

  function wireDownloadPdf() {
    const btn = document.getElementById('pdfSaveBtn');
    if (!btn) return;
    btn.addEventListener('click', () => window.print());
  }

  // Same mechanism as the person card's Print QR Code Only — see the
  // matching comment in assets/app.js. Strips the page down to just the
  // address and the QR code, for a clean minimal printout separate from
  // the full Save-as-PDF listing above (e.g. a yard-sign insert).
  function wirePrintQrOnly() {
    const link = document.getElementById('printQrLink');
    if (!link) return;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      document.body.classList.add('print-qr-only');
      window.print();
    });
    window.addEventListener('afterprint', () => {
      document.body.classList.remove('print-qr-only');
    });
  }

  // Same referral mechanism as the person card — always points at the
  // general "get your own card" intake form, regardless of listing.
  //
  // Set this to your real domain — deliberately NOT derived from
  // window.location.origin, since a visitor could be viewing this
  // listing via an old .vercel.app tag.
  const PROJECT_BASE_URL = 'https://blackhatcards.community';

  // Explicit Text/Email/Copy choices instead of the OS-controlled Web
  // Share sheet — see the matching comment in assets/app.js.
  function wireReferButton() {
    const btn = document.getElementById('referBtn');
    const overlay = document.getElementById('referModalOverlay');
    if (!btn || !overlay) return;

    const referUrl = `${PROJECT_BASE_URL}/my-contact-info-form.html`;
    const message = 'I have a digital contact card that saves to your phone with a tap. Want your own? Request a Black Hat Card here:';

    btn.addEventListener('click', () => overlay.classList.add('open'));
    document.getElementById('referModalClose').addEventListener('click', () => overlay.classList.remove('open'));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });

    document.getElementById('referTextBtn').addEventListener('click', () => {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const separator = isIOS ? '&' : '?';
      window.location.href = `sms:${separator}body=${encodeURIComponent(`${message}\n${referUrl}`)}`;
      overlay.classList.remove('open');
    });

    document.getElementById('referEmailBtn').addEventListener('click', () => {
      const subject = encodeURIComponent('Request a Black Hat Card');
      const body = encodeURIComponent(`${message}\n\n${referUrl}`);
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
      overlay.classList.remove('open');
    });

    document.getElementById('referCopyBtn').addEventListener('click', async () => {
      const text = `${message}\n${referUrl}`;
      try {
        await navigator.clipboard.writeText(text);
        document.getElementById('statusEl').textContent = 'Referral link copied — paste it wherever you\'d like to send it.';
      } catch (err) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try { document.execCommand('copy'); document.getElementById('statusEl').textContent = 'Referral link copied.'; }
        catch (e2) { document.getElementById('statusEl').textContent = `Share this link: ${referUrl}`; }
        document.body.removeChild(ta);
      }
      overlay.classList.remove('open');
    });
  }

  // Same color-derivation math as assets/app.js — kept in sync so what
  // gets previewed always matches what goes live, for both card types.
  function hexToRgb(hex) {
    const c = hex.replace('#', '');
    return [0, 2, 4].map(i => parseInt(c.substr(i, 2), 16));
  }
  function rgbToHex(rgb) {
    return '#' + rgb.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  }
  function relativeLuminance(hex) {
    const rgb = hexToRgb(hex).map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }
  function adjustBrightness(hex, amount) {
    return rgbToHex(hexToRgb(hex).map(v => v + amount));
  }
  function computeThemeFromBackground(bgHex) {
    const isLight = relativeLuminance(bgHex) > 0.4;
    return {
      text: isLight ? '#1a1a1a' : '#ede6d6',
      muted: isLight ? '#5a5a55' : '#8b93a1',
      surface: adjustBrightness(bgHex, isLight ? -18 : 14),
      surface2: adjustBrightness(bgHex, isLight ? -30 : 24),
      line: adjustBrightness(bgHex, isLight ? -45 : 32),
    };
  }

  // Same contrast-safety mechanism as assets/app.js — see the matching
  // comment there for the full reasoning.
  function contrastRatio(hex1, hex2) {
    const l1 = relativeLuminance(hex1), l2 = relativeLuminance(hex2);
    const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    let h, s; const l = (mx + mn) / 2;
    if (mx === mn) { h = s = 0; }
    else {
      const d = mx - mn;
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h /= 6;
    }
    return [h, s, l];
  }
  function hslToRgb(h, s, l) {
    if (s === 0) { const v = l * 255; return [v, v, v]; }
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return [hue2rgb(p, q, h + 1 / 3) * 255, hue2rgb(p, q, h) * 255, hue2rgb(p, q, h - 1 / 3) * 255];
  }
  function ensureContrast(fgHex, bgHex, minRatio = 3.5) {
    if (contrastRatio(fgHex, bgHex) >= minRatio) return fgHex;
    const [h, s, l0] = rgbToHsl(...hexToRgb(fgHex));
    const bgIsLight = relativeLuminance(bgHex) > 0.4;
    const step = bgIsLight ? -0.02 : 0.02;
    let l = l0, result = fgHex;
    for (let i = 0; i < 50; i++) {
      l = Math.max(0, Math.min(1, l + step));
      result = rgbToHex(hslToRgb(h, s, l));
      if (contrastRatio(result, bgHex) >= minRatio) return result;
      if (l <= 0 || l >= 1) break;
    }
    return result;
  }

  // Same font-pairing system as the person card — see the matching
  // comment in assets/app.js.
  const FONT_PAIRINGS = {
    editorial:   { fontsUrl: 'https://fonts.googleapis.com/css2?family=Fraunces:wght@600&family=Source+Sans+3:wght@400&display=swap', display: "'Fraunces', serif", body: "'Source Sans 3', sans-serif" },
    luxury:      { fontsUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Cormorant+Garamond:wght@500&display=swap', display: "'Playfair Display', serif", body: "'Cormorant Garamond', serif" },
    traditional: { fontsUrl: 'https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@700&family=Lora:wght@600&display=swap', display: "'Libre Baskerville', serif", body: "'Lora', serif" },
    playful:     { fontsUrl: 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@700&family=Nunito:wght@500&display=swap', display: "'Baloo 2', sans-serif", body: "'Nunito', sans-serif" },
  };
  function applyFontPairing(key) {
    const pairing = FONT_PAIRINGS[key];
    if (!pairing) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = pairing.fontsUrl;
    document.head.appendChild(link);
    document.documentElement.style.setProperty('--font-display', pairing.display);
    document.documentElement.style.setProperty('--font-body', pairing.body);
  }

  // Same brand-theming mechanism as the person card — see the matching
  // comment in assets/app.js. Background is optional — a brand with just
  // an accent color behaves exactly as before.
  async function applyBrandTheme(d) {
    if (!d.brand) return;
    try {
      const res = await fetch(`/brands/${d.brand}.json`, { cache: 'no-store' });
      if (!res.ok) return;
      const brand = await res.json();
      const root = document.documentElement.style;
      const effectiveBg = brand.background || '#14171c';
      if (brand.accent) root.setProperty('--copper', ensureContrast(brand.accent, effectiveBg));
      if (brand.accentSoft) root.setProperty('--copper-soft', ensureContrast(brand.accentSoft, effectiveBg));
      if (brand.background) {
        const theme = computeThemeFromBackground(brand.background);
        root.setProperty('--ink', brand.background);
        root.setProperty('--parchment', theme.text);
        root.setProperty('--muted', theme.muted);
        root.setProperty('--surface', theme.surface);
        root.setProperty('--surface-2', theme.surface2);
        root.setProperty('--line', theme.line);
      }
      if (brand.font) applyFontPairing(brand.font);
    } catch (err) {
      console.error('Could not load brand theme:', err);
    }
  }

  try {
    const data = await loadData();
    await applyBrandTheme(data);
    wireDownloadPdf();
    wireReferButton();
    wirePrintQrOnly();
    renderHero(data);
    renderIdentity(data);
    renderStats(data);
    renderDescription(data);
    renderGallery(data);
    renderAgent(data);
    renderOtherProperty(data);
    renderBooking(data);
    renderEditListingLink(data);
    renderQR(data);
  } catch (err) {
    document.querySelector('.page').innerHTML = `
      <div class="load-error">
        Couldn't load this listing's data.<br>
        Make sure data.json is in the same folder as this page.
      </div>`;
    console.error(err);
  }
})();
