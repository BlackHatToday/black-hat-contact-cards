// POST /api/tap — records ONE card open as a daily counter. Called by a
// tiny fire-and-forget beacon in assets/app.js and assets/property.js.
//
// What is stored: a count per card per day per source, nothing else.
// No IP address, no device info, no per-visit rows.
//   Redis hash   tap:<card>      field "<YYYY-MM-DD>:<tag|link>"  -> count
//   Redis set    tap:cards       every card that has been counted (for the admin list)

const { redis, dayKey } = require('./_lib/redis');

// Real cards are folders on this domain. A slug must look like a folder
// path — letters, digits, dashes, underscores, and "/" for nested folders.
const SLUG_RE = /^[a-z0-9][a-z0-9_-]*(\/[a-z0-9][a-z0-9_-]*){0,3}$/;

// New cards are verified once against the live site (so nobody can invent
// card names and fill the list with junk), then remembered in tap:cards.
const SITE = 'https://blackhatcards.community';

const ALLOWED_ORIGIN = /^https:\/\/((www\.)?blackhatcards\.community|[a-z0-9-]+\.vercel\.app)$/i;

function readBody(req) {
  let b = req.body;
  if (typeof b === 'string') {
    try { b = JSON.parse(b); } catch (e) { return null; }
  }
  return b && typeof b === 'object' ? b : null;
}

async function cardExistsOnSite(card) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch(`${SITE}/${card}/data.json`, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return false;
    const data = await res.json();
    return !!data && typeof data === 'object';
  } catch (e) {
    return false;
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  // Browsers always send Origin on a POST. If it is present and is not one
  // of our own hosts, ignore the request. (Light friction only — anyone can
  // fake a header — the real protection is the card-exists check below.)
  const origin = req.headers.origin;
  if (origin && !ALLOWED_ORIGIN.test(origin)) return res.status(403).end();

  const body = readBody(req);
  if (!body) return res.status(400).end();

  const card = String(body.card || '').toLowerCase();
  const src = body.src === 'tag' ? 'tag' : 'link';
  if (!SLUG_RE.test(card)) return res.status(400).end();

  try {
    const [known] = await redis([['SISMEMBER', 'tap:cards', card]]);
    if (!known && !(await cardExistsOnSite(card))) return res.status(404).end();

    await redis([
      ['HINCRBY', `tap:${card}`, `${dayKey()}:${src}`, 1],
      ['SADD', 'tap:cards', card]
    ]);
    return res.status(204).end();
  } catch (err) {
    // The card page ignores this response; just log it for the Vercel logs.
    console.error('tap failed:', err.message);
    return res.status(500).end();
  }
};
