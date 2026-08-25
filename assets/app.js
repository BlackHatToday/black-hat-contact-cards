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
    payment: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5c0 3-5 2-5 5 0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5"/></svg>',
    location: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>'
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
            <button type="button" class="field-qr-btn" data-qr-url="${url}" data-qr-label="Scan with ${cfg.label}" aria-label="Show QR code for ${cfg.label}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20v.01"/></svg>
            </button>
          </div>`;
      }
      // No universal link for this platform (e.g. Zelle) — plain info, no QR possible.
      // Called out explicitly since the linkable rows above it (Cash App etc.)
      // set an expectation that every payment row taps through to something.
      return `
        <div class="field" style="cursor:default;">
          <span class="icon">${ICONS.payment}</span>
          <span class="meta">
            <div class="label">${cfg.label}</div>
            <div class="value">${value}</div>
            <div style="font-family:'IBM Plex Mono', monospace; font-size:9.5px; color:var(--muted); margin-top:2px;">Not clickable — send manually via your bank's Zelle</div>
          </span>
        </div>`;
    }).join('');

    document.getElementById('paymentsEl').innerHTML = rows;
    document.getElementById('paymentsLabelText').textContent = d.paymentSectionLabel || 'Payment';
    document.getElementById('paymentsSection').style.display = 'block';

    document.querySelectorAll('#paymentsEl .field-qr-btn').forEach(btn => {
      btn.addEventListener('click', () => openQrModal(btn.dataset.qrUrl, btn.dataset.qrLabel));
    });
  }

  function renderListings(d) {
    const listings = (d.listings || []).filter(l => l.url).slice(0, 5); // hard cap at 5, even if more sneak into the data
    if (!listings.length) return;
    document.getElementById('listingsEl').innerHTML = listings.map(l => `
      <a class="field" href="${l.url}" target="_blank" rel="noopener">
        <span class="icon">${ICONS.home}</span>
        <span class="meta"><div class="label">${l.label || 'Listing'}</div><div class="value">${l.url.replace(/^https?:\/\//, '')}</div></span>
      </a>
    `).join('');
    document.getElementById('listingsSection').style.display = 'block';
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

  function wireDownloadPdf() {
    const btn = document.getElementById('pdfSaveBtn');
    if (!btn) return;
    btn.addEventListener('click', () => window.print());
  }

  // Prints just the name + QR code, separate from the full-card
  // Save-as-PDF above. Adds a body class the print stylesheet uses to
  // hide everything else, then removes it once printing is done so it
  // doesn't affect a later full-card print.
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

  // Lets anyone viewing this card — not just the card holder — pass along
  // a link for someone ELSE to get their own card made. Always points at
  // the general intake form, regardless of what page this button lives on.
  //
  // Set this to your real domain — deliberately NOT derived from
  // window.location.origin, since a visitor could be viewing this card
  // via an old .vercel.app tag, and the referral should always point at
  // the correct domain regardless of which URL they arrived through.
  const PROJECT_BASE_URL = 'https://blackhatcards.community';

  // Explicit Text/Email/Copy choices instead of the OS-controlled Web
  // Share sheet — that sheet's available targets vary by device/browser
  // (desktop browsers often only offer Mail, no SMS capability at all),
  // so this guarantees all three options work everywhere, every time.
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
      // iOS and Android expect different separators before the body param
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

  function renderNotes(d) {
    if (!d.notes) return;
    document.getElementById('notesEl').textContent = d.notes;
    document.getElementById('notesSection').style.display = 'block';
  }

  function renderFields(d) {
    const rows = [];
    (d.phones || []).forEach(p => rows.push({ icon: 'phone', label: p.type || 'Phone', value: p.number, href: `tel:${String(p.number).replace(/[^+\d]/g, '')}` }));
    (d.emails || []).forEach(e => rows.push({ icon: 'email', label: e.type || 'Email', value: e.address, href: `mailto:${e.address}` }));
    if (d.address) rows.push({ icon: 'location', label: 'Address', value: d.address, href: `https://maps.google.com/?q=${encodeURIComponent(d.address)}` });
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
    document.getElementById('bookBtnLabel').textContent = d.bookingLabel || 'Book a Time';
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

  // Sends the visitor to my-contact-info-form.html with their current info
  // already filled in, via a URL parameter — so they can see everything
  // laid out and edit it visually before sending, rather than typing a
  // blank note. Only includes fields that form actually supports.
  //
  // Also checks for a security token in the URL (?t=...), meant to be
  // baked into the physical NFC tag itself, not guessable from just the
  // person's name. If it matches what's stored in data.json, the outgoing
  // request is flagged as verified — if it's missing or wrong, flagged as
  // unverified — so you don't have to manually compare anything yourself.
  // Cards without a token at all (not yet migrated) get no flag either way.
  function renderEditMyInfoLink(d) {
    const link = document.getElementById('editMyInfoLink');
    if (!link) return;

    let tokenStatus = 'none'; // this card has no token system in use yet
    if (d.accessToken) {
      const urlToken = new URLSearchParams(window.location.search).get('t');
      tokenStatus = (urlToken && urlToken === d.accessToken) ? 'verified' : 'unverified';
    }

    const trimmed = {
      prefix: d.prefix, firstName: d.firstName, lastName: d.lastName,
      title: d.title, org: d.org, tagline: d.tagline, about: d.about,
      experience: d.experience, skills: d.skills, social: d.social,
      payments: d.payments, notes: d.notes, phones: d.phones, emails: d.emails,
      websites: d.websites, address: d.address, calendlyUrl: d.calendlyUrl,
      _tokenStatus: tokenStatus
    };
    const encoded = encodeURIComponent(JSON.stringify(trimmed));
    link.href = `/my-contact-info-form.html?data=${encoded}`;
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
    if (d.address) lines.push(`ADR;TYPE=HOME:;;${d.address.replace(/,/g, '\\,')};;;;`);
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
    wireDownloadPdf();
    wirePrintQrOnly();
    wireReferButton();
    renderPhoto(data);
    renderIdentity(data);
    renderAbout(data);
    renderExperience(data);
    renderSkills(data);
    renderSocial(data);
    renderPayments(data);
    renderListings(data);
    renderNotes(data);
    renderFields(data);
    renderCalendly(data);
    renderQR(data);
    wireSaveButton(data);
    renderShareBack(data);
    renderEditMyInfoLink(data);
  } catch (err) {
    document.querySelector('.page').innerHTML = `
      <div class="load-error">
        Couldn't load this contact's data.<br>
        Make sure data.json is in the same folder as this page.
      </div>`;
    console.error(err);
  }
})();
