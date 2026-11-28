// Rules for client self-editing: which fields a client may change, how each is
// cleaned, and how an approved change is applied to a card's data.json.
//
// level "normal": reviewed like any change.   level "high": shown to Boris with a
// "high care" flag (links, payment handles, phone, email, booking link).
// Everything not listed here (access token, brand, folder, on/off settings,
// photos, gallery, listings) is owner-only and is silently refused.

const PHONE_TYPES = ['Mobile', 'Work', 'Work Landline', 'Home', 'Fax', 'Other'];
const SOCIAL_KEYS = ['instagram', 'tiktok', 'facebook', 'linkedin', 'twitter', 'youtube'];
const PAY_KEYS = ['cashapp', 'venmo', 'paypal', 'zelle'];

class FieldError extends Error {}

function txt(v, max, multiline, label) {
  if (v === undefined || v === null) v = '';
  if (typeof v !== 'string') throw new FieldError(`${label}: must be text`);
  let s = v.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  s = multiline ? s.split('\n').map(l => l.trim()).join('\n').trim() : s.replace(/\s+/g, ' ').trim();
  if (/[<>]/.test(s)) throw new FieldError(`${label}: please remove the < and > characters`);
  if (s.length > max) throw new FieldError(`${label}: too long (max ${max} characters)`);
  return s;
}
function url(v, label) {
  const s = txt(v, 300, false, label);
  if (s === '') return '';
  if (!/^https?:\/\/[^\s"']+$/i.test(s)) throw new FieldError(`${label}: must start with http:// or https://`);
  return s;
}
function list(v, max, label) {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v)) throw new FieldError(`${label}: must be a list`);
  if (v.length > max) throw new FieldError(`${label}: too many entries (max ${max})`);
  return v;
}
function obj(v, label) {
  if (v === undefined || v === null) return {};
  if (typeof v !== 'object' || Array.isArray(v)) throw new FieldError(`${label}: invalid`);
  return v;
}

const FIELDS = {
  tagline:        { level: 'normal', label: 'Tagline',         clean: v => txt(v, 140, false, 'Tagline') },
  about:          { level: 'normal', label: 'About',           clean: v => txt(v, 1200, true, 'About') },
  title:          { level: 'normal', label: 'Job title',       clean: v => txt(v, 100, false, 'Job title') },
  org:            { level: 'normal', label: 'Organization',    clean: v => txt(v, 100, false, 'Organization') },
  notes:          { level: 'normal', label: 'Notes',           clean: v => txt(v, 500, true, 'Notes') },
  address:        { level: 'normal', label: 'Physical address',clean: v => txt(v, 200, false, 'Physical address') },
  mailingAddress: { level: 'normal', label: 'Mailing address / P.O. Box', clean: v => txt(v, 200, false, 'Mailing address') },
  bookingLabel:   { level: 'normal', label: 'Booking button label', clean: v => txt(v, 60, false, 'Booking button label') },
  skills: { level: 'normal', label: 'Skills', clean: v =>
    list(v, 20, 'Skills').map(s => txt(s, 40, false, 'Skill')).filter(Boolean) },
  experience: { level: 'normal', label: 'Experience', clean: v =>
    list(v, 10, 'Experience').map(e => {
      e = obj(e, 'Experience');
      return { role: txt(e.role, 100, false, 'Role'), company: txt(e.company, 100, false, 'Company'),
               period: txt(e.period, 60, false, 'Period'), description: txt(e.description, 400, true, 'Description') };
    }).filter(e => e.role || e.company || e.description) },
  social: { level: 'normal', label: 'Social links', clean: v => {
    v = obj(v, 'Social links'); const out = {};
    SOCIAL_KEYS.forEach(k => { out[k] = txt(v[k], 200, false, 'Social link'); });
    return out; } },
  websites: { level: 'high', label: 'Website links', clean: v =>
    list(v, 10, 'Website links').map(w => {
      w = obj(w, 'Website link');
      return { label: txt(w.label, 60, false, 'Link label'), url: url(w.url, 'Link address') };
    }).filter(w => w.url) },
  payments: { level: 'high', label: 'Payment handles', clean: v => {
    v = obj(v, 'Payment handles'); const out = {};
    PAY_KEYS.forEach(k => { out[k] = txt(v[k], 120, false, 'Payment handle'); });
    return out; } },
  phones: { level: 'high', label: 'Phone numbers', clean: v =>
    list(v, 6, 'Phone numbers').map(p => {
      p = obj(p, 'Phone');
      const type = txt(p.type, 30, false, 'Phone type');
      if (!PHONE_TYPES.includes(type)) throw new FieldError('Phone type: choose one from the list');
      const number = txt(p.number, 25, false, 'Phone number');
      if (!/^[0-9+().\-\s]{7,25}$/.test(number)) throw new FieldError('Phone number: use digits, spaces, dashes or parentheses');
      const out = { type, number };
      const ext = String(p.ext || '').replace(/\D/g, '');
      if (ext) { if (ext.length > 6) throw new FieldError('Extension: too long'); out.ext = ext; }
      return out;
    }).filter(p => p.number) },
  emails: { level: 'high', label: 'Email addresses', clean: v =>
    list(v, 6, 'Email addresses').map(e => {
      e = obj(e, 'Email');
      const address = txt(e.address, 120, false, 'Email address');
      if (address && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) throw new FieldError('Email address: that does not look like an email');
      return { type: txt(e.type, 30, false, 'Email type') || 'Work', address };
    }).filter(e => e.address) },
  calendlyUrl: { level: 'high', label: 'Booking link', clean: v => url(v, 'Booking link') }
};

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Cleans a submitted { field: value } object against the current card data.
// Returns { changes, errors }. Unknown/owner-only fields are dropped, and fields
// whose cleaned value equals the current value are ignored.
function cleanChanges(submitted, current) {
  const changes = {}, errors = [];
  if (!submitted || typeof submitted !== 'object' || Array.isArray(submitted)) return { changes, errors: ['Nothing was submitted'] };
  Object.keys(submitted).forEach(field => {
    const spec = FIELDS[field];
    if (!spec) return;
    try {
      const value = spec.clean(submitted[field]);
      const currentClean = (() => { try { return spec.clean(current[field]); } catch (e) { return current[field]; } })();
      if (!same(value, currentClean)) changes[field] = value;
    } catch (e) {
      if (e instanceof FieldError) errors.push(e.message); else throw e;
    }
  });
  return { changes, errors };
}

// Applies cleaned changes. Website entries keep owner-only extras (QR settings)
// when the address is unchanged.
function applyChanges(data, changes) {
  const out = JSON.parse(JSON.stringify(data));
  Object.keys(changes).forEach(field => {
    if (!FIELDS[field]) return;
    let value = changes[field];
    if (field === 'websites') {
      const old = Array.isArray(out.websites) ? out.websites : [];
      value = value.map(w => {
        const prev = old.find(o => o && o.url === w.url);
        return prev ? Object.assign({}, prev, { label: w.label || prev.label }) : w;
      });
    }
    out[field] = value;
  });
  return out;
}

const level = field => (FIELDS[field] ? FIELDS[field].level : 'normal');
const labelOf = field => (FIELDS[field] ? FIELDS[field].label : field);

module.exports = { FIELDS, PHONE_TYPES, cleanChanges, applyChanges, level, labelOf };
