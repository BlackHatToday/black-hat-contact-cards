// GET /api/stats — admin-only read access to the tap counters.
//
//   /api/stats                    overview: every card, totals for the last N days
//   /api/stats?card=<folder>      one card: a zero-filled day-by-day series
//   &days=30                      window size (default 30, max 365)
//
// Send the admin password in the "x-stats-password" header. The password is
// the STATS_PASSWORD environment variable set in the Vercel project.

const crypto = require('crypto');
const { redis, dayKey, TZ } = require('./_lib/redis');

function passwordOk(given) {
  const expected = process.env.STATS_PASSWORD;
  if (!expected || typeof given !== 'string') return false;
  // Hash both sides so timingSafeEqual always compares equal-length buffers.
  const a = crypto.createHash('sha256').update(given).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

// HGETALL comes back as a flat [field, value, field, value, ...] list
// (or occasionally as an object) — normalise to { field: number }.
function hashToObject(raw) {
  const out = {};
  if (Array.isArray(raw)) {
    for (let i = 0; i + 1 < raw.length; i += 2) out[raw[i]] = Number(raw[i + 1]) || 0;
  } else if (raw && typeof raw === 'object') {
    for (const k of Object.keys(raw)) out[k] = Number(raw[k]) || 0;
  }
  return out;
}

// The last `n` calendar days (Eastern), oldest first, as YYYY-MM-DD.
function lastDays(n) {
  const days = [];
  const now = Date.now();
  for (let i = n - 1; i >= 0; i--) days.push(dayKey(new Date(now - i * 86400000)));
  // Guard against a DST-shift duplicate by de-duping while keeping order.
  return days.filter((d, i) => days.indexOf(d) === i);
}

function seriesFor(hash, days) {
  return days.map(date => ({
    date,
    tag: hash[`${date}:tag`] || 0,
    link: hash[`${date}:link`] || 0
  }));
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  if (!passwordOk(req.headers['x-stats-password'])) {
    // A short pause makes rapid password guessing impractical.
    await new Promise(r => setTimeout(r, 600));
    return res.status(401).json({ error: 'Wrong or missing password.' });
  }

  const card = req.query && req.query.card ? String(req.query.card).toLowerCase() : '';
  let days = parseInt(req.query && req.query.days, 10);
  if (!Number.isFinite(days) || days < 1) days = 30;
  days = Math.min(days, 365);
  const window = lastDays(days);

  try {
    if (card) {
      if (!/^[a-z0-9][a-z0-9_\/-]*$/.test(card)) return res.status(400).json({ error: 'Bad card name.' });
      const [raw] = await redis([['HGETALL', `tap:${card}`]]);
      const series = seriesFor(hashToObject(raw), window);
      const tag = series.reduce((s, d) => s + d.tag, 0);
      const link = series.reduce((s, d) => s + d.link, 0);
      return res.status(200).json({ timezone: TZ, card, days: window.length, totals: { tag, link, all: tag + link }, series });
    }

    const [cards] = await redis([['SMEMBERS', 'tap:cards']]);
    const list = (cards || []).slice().sort();
    if (!list.length) return res.status(200).json({ timezone: TZ, days: window.length, cards: [] });

    const raws = await redis(list.map(c => ['HGETALL', `tap:${c}`]));
    const inWindow = new Set(window);
    const rows = list.map((c, i) => {
      const hash = hashToObject(raws[i]);
      let tag = 0, link = 0, last = null;
      for (const field of Object.keys(hash)) {
        const [date, src] = field.split(':');
        if (date && (!last || date > last)) last = date;
        if (!inWindow.has(date)) continue;
        if (src === 'tag') tag += hash[field]; else link += hash[field];
      }
      return { card: c, tag, link, all: tag + link, lastOpened: last };
    });
    rows.sort((a, b) => b.all - a.all || a.card.localeCompare(b.card));
    return res.status(200).json({ timezone: TZ, days: window.length, cards: rows });
  } catch (err) {
    console.error('stats failed:', err.message);
    return res.status(500).json({ error: 'Could not read the counters.' });
  }
};
