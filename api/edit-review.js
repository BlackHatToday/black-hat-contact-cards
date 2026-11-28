// /api/edit-review — Boris's review page backend. Password required on every call
// (header x-review-password = REVIEW_PASSWORD).
//
// GET                     -> { waiting, oldestTs, requests:[{id,card,ts,changes,current,high}] }
// POST {action:"approve", id}  -> writes the change to the card's data.json on GitHub (Vercel redeploys)
// POST {action:"reject",  id}  -> discards the request
// POST {action:"enable",  card | cards:[...]} -> turns on self-editing (links last 15 days); returns each private link ONCE

const crypto = require('crypto');
const { redis, dayKey } = require('./_lib/redis');
const gh = require('./_lib/github');
const ce = require('./_lib/cardedit');

const LINK_DAYS = 15;
const SLUG_RE = /^[a-z0-9][a-z0-9_-]{0,60}$/;
const sha256 = s => crypto.createHash('sha256').update(String(s)).digest();

function passOk(given) {
  const want = process.env.REVIEW_PASSWORD;
  if (!want || typeof given !== 'string') return false;
  return crypto.timingSafeEqual(sha256(given), sha256(want));
}
function body(req) {
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { return null; } }
  return b && typeof b === 'object' ? b : null;
}
async function loadRequests() {
  const [ids] = await redis([['ZRANGE', 'edit:queue', 0, -1]]);
  if (!ids.length) return [];
  const [vals] = await redis([['MGET', ...ids.map(id => `edit:req:${id}`)]]);
  const dead = [], out = [];
  ids.forEach((id, i) => { if (!vals[i]) dead.push(id); else { try { out.push(JSON.parse(vals[i])); } catch (e) { dead.push(id); } } });
  if (dead.length) await redis([['ZREM', 'edit:queue', ...dead]]);
  return out;
}
const drop = r => redis([['DEL', `edit:req:${r.id}`], ['ZREM', 'edit:queue', r.id], ['SREM', `edit:card:${r.card}`, r.id]]);

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' && req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return res.status(405).end(); }

  // slow down password guessing: 30 tries per hour per address
  try {
    const ip = String(req.headers['x-forwarded-for'] || 'x').split(',')[0].trim();
    const k = `edit:authtry:${ip}:${dayKey()}:${new Date().getUTCHours()}`;
    const [n] = await redis([['INCR', k], ['EXPIRE', k, 3700]]);
    if (n > 30) return res.status(429).json({ error: 'Too many attempts. Try again later.' });
  } catch (e) { return res.status(500).json({ error: 'Storage unavailable' }); }
  if (!passOk(req.headers['x-review-password'])) {
    await new Promise(r => setTimeout(r, 500));
    return res.status(401).json({ error: 'Wrong password' });
  }

  try {
    if (req.method === 'GET') {
      const reqs = await loadRequests();
      const requests = [];
      for (const r of reqs) {
        let current = {};
        try { const f = await gh.getFile(`${r.card}/data.json`); if (f) Object.keys(r.changes).forEach(k => { current[k] = f.data[k]; }); } catch (e) {}
        requests.push({ id: r.id, card: r.card, ts: r.ts, changes: r.changes, current,
          high: Object.keys(r.changes).some(k => ce.level(k) === 'high') });
      }
      requests.sort((a, b) => a.ts - b.ts);
      return res.status(200).json({ waiting: requests.length, oldestTs: requests.length ? requests[0].ts : null, requests });
    }

    const b = body(req);
    if (!b) return res.status(400).json({ error: 'Bad request' });

    if (b.action === 'enable') {
      // one card (b.card) or several (b.cards, up to 25). Each link lasts LINK_DAYS days.
      const names = (Array.isArray(b.cards) ? b.cards : [b.card]).map(c => String(c || '').trim().toLowerCase()).filter(Boolean);
      if (!names.length || names.length > 25) return res.status(400).json({ error: 'Give between 1 and 25 card folder names' });
      const expires = Date.now() + LINK_DAYS * 86400000;
      const results = [];
      for (const card of Array.from(new Set(names))) {
        if (!SLUG_RE.test(card)) { results.push({ card, error: 'Folder name looks wrong' }); continue; }
        try {
          const f = await gh.getFile(`${card}/data.json`);
          if (!f) { results.push({ card, error: 'No card with that folder name' }); continue; }
          const key = crypto.randomBytes(16).toString('hex');
          const data = Object.assign({}, f.data, { selfEdit: true, editKeyHash: sha256(key).toString('hex'), editKeyExpires: expires });
          await gh.putFile(`${card}/data.json`, data, f.sha, `Turn on self-editing for ${card} (link good for ${LINK_DAYS} days)`);
          results.push({ card, link: `https://blackhatcards.community/edit.html?c=${card}&k=${key}`, expires });
        } catch (e) { results.push({ card, error: e.message || 'Failed' }); }
      }
      return res.status(200).json({ ok: true, results });
    }

    if (b.action === 'approve' || b.action === 'reject') {
      const id = String(b.id || '');
      if (!/^[a-f0-9]{16}$/.test(id)) return res.status(400).json({ error: 'Bad request id' });
      const [raw] = await redis([['GET', `edit:req:${id}`]]);
      if (!raw) return res.status(404).json({ error: 'That request is already gone' });
      const r = JSON.parse(raw);
      if (b.action === 'reject') { await drop(r); return res.status(200).json({ ok: true }); }

      for (let attempt = 0; attempt < 2; attempt++) {
        const f = await gh.getFile(`${r.card}/data.json`);
        if (!f) return res.status(404).json({ error: 'Card not found' });
        const next = ce.applyChanges(f.data, r.changes);
        try {
          await gh.putFile(`${r.card}/data.json`, next, f.sha, `Approved self-edit for ${r.card}: ${Object.keys(r.changes).join(', ')}`);
          await drop(r);
          return res.status(200).json({ ok: true });
        } catch (e) {
          if (attempt === 0 && (e.status === 409 || e.status === 422)) continue;
          throw e;
        }
      }
    }
    return res.status(400).json({ error: 'Unknown action' });
  } catch (e) {
    return res.status(500).json({ error: 'Something went wrong: ' + (e.message || 'unknown') });
  }
};
