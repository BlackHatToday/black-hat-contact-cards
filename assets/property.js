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
  function renderEditListingLink(d) {
    const link = document.getElementById('editMyInfoLink');
    if (!link) return;
    const trimmed = {
      address: d.address, price: d.price, sqft: d.sqft, beds: d.beds, baths: d.baths,
      description: d.description, agentName: d.agentName, agentPhone: d.agentPhone,
      agentEmail: d.agentEmail, bookingUrl: d.bookingUrl
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
    const selfUrl = window.location.href.split('#')[0].split('?')[0];
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

  try {
    const data = await loadData();
    wireDownloadPdf();
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
