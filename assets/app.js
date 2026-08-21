/* ============================================================
   SHARED ENGINE — do not duplicate this file per person.
   Every person's index.html loads this same script from /assets/.
   To add a new section or field: add it here once, and it
   becomes available to everyone via their data.json.
   ============================================================ */

(async function () {
  const ICONS = {
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 6 12 13 2 6"/><path d="M2 6h20v12H2z"/></svg>',
    website: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"/></svg>',
    payment: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5c0 3-5 2-5 5 0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5"/></svg>'
  };

  // Pre-configured platforms: just label + how to build the URL from a
  // handle. Add a new platform by adding one entry here — no icon
  // artwork needed, it uses an auto-generated badge from the abbreviation.
  const SOCIAL_PLATFORMS = {
    instagram: { label: 'Instagram', abbr: 'IG', urlFor: h => `https://instagram.com/${h.replace(/^@/, '')}` },
    tiktok:    { label: 'TikTok',    abbr: 'TT', urlFor: h => `https://tiktok.com/@${h.replace(/^@/, '')}` },
    facebook:  { label: 'Facebook',  abbr: 'FB', urlFor: h => `https://facebook.com/${h.replace(/^@/, '')}` },
    linkedin:  { label: 'LinkedIn',  abbr: 'IN', urlFor: h => `https://linkedin.com/in/${h.replace(/^@/, '')}` },
    twitter:   { label: 'X',         abbr: 'X',  urlFor: h => `https://x.com/${h.replace(/^@/, '')}` },
    youtube:   { label: 'YouTube',   abbr: 'YT', urlFor: h => `https://youtube.com/@${h.replace(/^@/, '')}` }
  };

  // Payment handles. Most apps support a direct pay-link; Zelle doesn't
  // have a universal public link (it works by matching phone/email inside
  // your own bank's app), so it's shown as plain info instead of a link.
  const PAYMENT_PLATFORMS = {
    cashapp: { label: 'Cash App', urlFor: h => `https://cash.app/$${h.replace(/^\$/, '')}` },
    venmo:   { label: 'Venmo',    urlFor: h => `https://venmo.com/u/${h.replace(/^@/, '')}` },
    paypal:  { label: 'PayPal',   urlFor: h => `https://paypal.me/${h.replace(/^@/, '')}` },
    zelle:   { label: 'Zelle',    urlFor: null }
  };

  // Resolve paths relative to this page's actual folder, regardless of
  // whether the visited URL has a trailing slash.
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

  function renderPhoto(d) {
    const initials = ((d.firstName || '')[0] || '') + ((d.lastName || '')[0] || '');
    const img = document.getElementById('avatarImg');
    const fallback = document.getElementById('avatarFallback');
    if (d.photoFile) {
      img.src = resolveAsset(d.photoFile);
      img.alt = `${d.firstName} ${d.lastName}`;
      img.style.display = 'block';
      fallback.style.display = 'none';
      img.onerror = () => { img.style.display = 'none'; fallback.style.display = 'flex'; fallback.textContent = initials.toUpperCase(); };
    } else {
      fallback.textContent = initials.toUpperCase();
    }
  }

  function renderIdentity(d) {
    const fullName = [d.prefix, d.firstName, d.lastName].filter(Boolean).join(' ');
    document.title = `${d.firstName} ${d.lastName}`.trim();
    document.getElementById('nameEl').textContent = fullName;

    if (d.tagline) {
      const t = document.getElementById('taglineEl');
      t.textContent = d.tagline;
      t.style.display = 'block';
    }

    const roleEl = document.getElementById('roleEl');
    if (d.title && d.org) roleEl.innerHTML = `${d.title} · <span class="org">${d.org}</span>`;
    else if (d.org) roleEl.innerHTML = `<span class="org">${d.org}</span>`;
    else roleEl.textContent = d.title || '';
  }

  function renderAbout(d) {
    if (!d.about) return;
    document.getElementById('aboutText').textContent = d.about;
    document.getElementById('aboutSection').style.display = 'block';
  }

  function renderExperience(d) {
    if (!d.experience || !d.experience.length) return;
    document.getElementById('timelineEl').innerHTML = d.experience.map(e => `
      <div class="exp-item">
        <div class="exp-role">${e.role || ''}</div>
        <div class="exp-meta"><span class="company">${e.company || ''}</span>${e.period ? ' · ' + e.period : ''}</div>
        ${e.description ? `<div class="exp-desc">${e.description}</div>` : ''}
      </div>
    `).join('');
    document.getElementById('experienceSection').style.display = 'block';
  }

  function renderSkills(d) {
    if (!d.skills || !d.skills.length) return;
    document.getElementById('skillsEl').innerHTML = d.skills.map(s => `<span class="skill-pill">${s}</span>`).join('');
    document.getElementById('skillsSection').style.display = 'block';
  }

  function renderSocial(d) {
    const entries = Object.entries(d.social || {}).filter(([, handle]) => handle && String(handle).trim());
    if (!entries.length) return;
    document.getElementById('socialEl').innerHTML = entries.map(([platform, handle]) => {
      const cfg = SOCIAL_PLATFORMS[platform] || { label: platform, abbr: platform.slice(0, 2).toUpperCase(), urlFor: h => h };
      const url = cfg.urlFor(String(handle));
      return `<a class="social-pill" href="${url}" target="_blank" rel="noopener"><span class="social-badge">${cfg.abbr}</span>${cfg.label}</a>`;
    }).join('');
    document.getElementById('socialSection').style.display = 'block';
  }

  function renderPayments(d) {
    const entries = Object.entries(d.payments || {}).filter(([, handle]) => handle && String(handle).trim());
    if (!entries.length) return;

    const rows = entries.map(([platform, handle]) => {
      const cfg = PAYMENT_PLATFORMS[platform] || { label: platform, urlFor: null };
      const value = String(handle);

      if (cfg.urlFor) {
        const url = cfg.urlFor(value);
        return `
          <div class="field">
            <a class="field-link" href="${url}" target="_blank" rel="noopener">
              <span class="icon">${ICONS.payment}</span>
              <span class="meta"><div class="label">${cfg.label}</div><div class="value">${value}</div></span>
            </a>
            <button type="button" class="field-qr-btn" data-qr-url="${url}" data-qr-label="Scan to pay via ${cfg.label}" aria-label="Show QR code for ${cfg.label}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20v.01"/></svg>
            </button>
          </div>`;
      }
      // No universal link for this platform (e.g. Zelle) — plain info, no QR possible
      return `
        <div class="field" style="cursor:default;">
          <span class="icon">${ICONS.payment}</span>
          <span class="meta"><div class="label">${cfg.label}</div><div class="value">${value}</div></span>
        </div>`;
    }).join('');

    document.getElementById('paymentsEl').innerHTML = rows;
    document.getElementById('paymentsSection').style.display = 'block';

    document.querySelectorAll('#paymentsEl .field-qr-btn').forEach(btn => {
      btn.addEventListener('click', () => openQrModal(btn.dataset.qrUrl, btn.dataset.qrLabel));
    });
  }

  function openQrModal(url, label) {
    const overlay = document.getElementById('qrModalOverlay');
    const codeEl = document.getElementById('qrModalCode');
    document.getElementById('qrModalLabel').textContent = label;
    codeEl.innerHTML = '';
    new QRCode(codeEl, {
      text: url, width: 160, height: 160,
      colorDark: '#14171c', colorLight: '#ede6d6',
      correctLevel: QRCode.CorrectLevel.M
    });
    overlay.classList.add('open');
  }

  function wireQrModal() {
    const overlay = document.getElementById('qrModalOverlay');
    document.getElementById('qrModalClose').addEventListener('click', () => overlay.classList.remove('open'));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });
  }

  function renderNotes(d) {
    if (!d.notes) return;
    document.getElementById('notesEl').textContent = d.notes;
    document.getElementById('notesSection').style.display = 'block';
  }

  function renderFields(d) {
    const rows = [];
    (d.phones || []).forEach(p => rows.push({ icon: 'phone', label: p.type || 'Phone', value: p.number, href: `tel:${String(p.number).replace(/[^+\d]/g, '')}` }));
    (d.emails || []).forEach(e => rows.push({ icon: 'email', label: e.type || 'Email', value: e.address, href: `mailto:${e.address}` }));
    if (d.website) rows.push({ icon: 'website', label: 'Website', value: d.website.replace(/^https?:\/\//, ''), href: d.website }); // legacy single-website support
    (d.websites || []).forEach(w => rows.push({ icon: 'website', label: w.label || 'Website', value: w.url.replace(/^https?:\/\//, ''), href: w.url }));
    document.getElementById('fieldsEl').innerHTML = rows.map(r => `
      <a class="field" href="${r.href}" target="_blank" rel="noopener">
        <span class="icon">${ICONS[r.icon]}</span>
        <span class="meta"><div class="label">${r.label}</div><div class="value">${r.value}</div></span>
      </a>
    `).join('');
  }

  function renderCalendly(d) {
    if (!d.calendlyUrl) return;
    const btn = document.getElementById('bookBtn');
    btn.href = d.calendlyUrl;
    btn.style.display = 'flex';
  }

  // Lets a visitor send THEIR info back to the card owner. There's no
  // web technology that can read "the visitor's own contact card" from
  // their phone (that's locked down for privacy reasons), so this opens
  // a pre-addressed, pre-written email the visitor fills in themselves —
  // same low-friction pattern used elsewhere in this project.
  function renderShareBack(d) {
    const ownerEmail = (d.emails && d.emails[0] && d.emails[0].address) || '';
    if (!ownerEmail) return; // nothing to address the email to
    const btn = document.getElementById('shareBackBtn');
    const ownerFirstName = d.firstName || 'there';
    document.getElementById('shareBackLabel').textContent = `Share Your Info With ${ownerFirstName}`;
    btn.style.display = 'flex';
    btn.addEventListener('click', () => {
      const subject = encodeURIComponent(`Nice to meet you, ${ownerFirstName}!`);
      const body = encodeURIComponent(`Hi ${ownerFirstName},\n\nGreat meeting you! Here's my info:\n\nName: \nPhone: \nEmail: \n\n(fill in when you get a chance!)`);
      window.location.href = `mailto:${ownerEmail}?subject=${subject}&body=${body}`;
    });
  }

  function renderQR(d) {
    if (d.showQR === false) return;
    const selfUrl = window.location.href.split('#')[0].split('?')[0];
    document.getElementById('qrSection').style.display = 'block';
    /* global QRCode */
    new QRCode(document.getElementById('qrcode'), {
      text: selfUrl, width: 180, height: 180,
      colorDark: '#14171c', colorLight: '#ede6d6',
      correctLevel: QRCode.CorrectLevel.M
    });
  }

  function buildVCard(d) {
    const lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:${d.lastName};${d.firstName};;${d.prefix || ''};`, `FN:${[d.prefix, d.firstName, d.lastName].filter(Boolean).join(' ')}`];
    if (d.org) lines.push(`ORG:${d.org}`);
    if (d.title) lines.push(`TITLE:${d.title}`);
    (d.phones || []).forEach(p => lines.push(`TEL;TYPE=${(p.type || 'CELL').toUpperCase()}:${p.number}`));
    (d.emails || []).forEach(e => lines.push(`EMAIL:${e.address}`));
    if (d.website) lines.push(`URL:${d.website}`); // legacy single-website support
    (d.websites || []).forEach(w => lines.push(`URL:${w.url}`));
    if (d.notes) lines.push(`NOTE:${d.notes.replace(/\n/g, '\\n')}`);
    lines.push('END:VCARD');
    return lines.join('\r\n');
  }

  function wireSaveButton(d) {
    document.getElementById('saveBtn').addEventListener('click', () => {
      const blob = new Blob([buildVCard(d)], { type: 'text/vcard' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${d.firstName}_${d.lastName}.vcf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      document.getElementById('statusEl').textContent = 'Contact file downloaded — open it to save.';
    });
  }

  try {
    const data = await loadData();
    wireQrModal();
    renderPhoto(data);
    renderIdentity(data);
    renderAbout(data);
    renderExperience(data);
    renderSkills(data);
    renderSocial(data);
    renderPayments(data);
    renderNotes(data);
    renderFields(data);
    renderCalendly(data);
    renderQR(data);
    wireSaveButton(data);
    renderShareBack(data);
  } catch (err) {
    document.querySelector('.page').innerHTML = `
      <div class="load-error">
        Couldn't load this contact's data.<br>
        Make sure data.json is in the same folder as this page.
      </div>`;
    console.error(err);
  }
})();
