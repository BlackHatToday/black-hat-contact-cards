// POST /api/edit-submit — a client's change request. NOTHING goes live here:
// the request is held in Redis until Boris approves it on the review page.
//
// Body: { card: "<folder>", key: "<private edit key>", changes: { field: value, ... } }
// A card must have "selfEdit": true and an "editKeyHash" (sha256 of the key) in
// its data.json — both are set from the review page ("Turn on editing").

const crypto = require('crypto');
const { redis, dayKey } = require('./_lib/redis');
const gh = require('./_lib/github');
const ce = require('./_lib/cardedit');

const SLUG_RE = /^[a-z0-9][a-z0-9_-]{0,60}$/;
const ALLOWED_ORIGIN = /^https:\/\/((www\.)?blackhatcards\.community|[a-z0-9-]+\.vercel\.app)$/i;
const MAX_PER_DAY = 5;      // submissions per card per day
const MAX_PENDING = 3;      // requests waiting at once, per card
const TTL = 30 * 86400;     // ignored requests are deleted after 30 days

const sha256 = s => crypto.createHash('sha256').update(String(s)).digest();
function keyOk(key, hash) {
  if (typeof key !== 'string' || typeof hash !== 'string' || key.length < 10) return false;
  const a = sha256(key), b = Buffer.from(hash, 'hex');
  return b.length === a.length && crypto.timingSafeEqual(a, b);
}
function body(req) {
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { return null; } }
  return b && typeof b === 'object' ? b : null;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  const origin = req.headers.origin;
  if (origin && !ALLOWED_ORIGIN.test(origin)) return res.status(403).end();

  const b = body(req);
  if (!b) return res.status(400).json({ error: 'Bad request' });
  const card = String(b.card || '').toLowerCase();
  const denied = async () => { await new Promise(r => setTimeout(r, 500)); return res.status(403).json({ error: 'This edit link is not valid. Please ask for a new one.' }); };
  if (!SLUG_RE.test(card)) return denied();

  let file;
  try { file = await gh.getFile(`${card}/data.json`); } catch (e) { return res.status(502).json({ error: 'Could not check your card right now. Please try again in a few minutes.' }); }
  if (!file || file.data.selfEdit !== true || !keyOk(b.key, file.data.editKeyHash)) return denied();

  try {
    const { changes, errors } = ce.cleanChanges(b.changes, file.data);
    if (errors.length) return res.status(400).json({ error: errors.join(' ') });
    if (!Object.keys(changes).length) return res.status(400).json({ error: 'No changes to send — everything matches your card.' });

    const [count] = await redis([['INCR', `edit:rate:${card}:${dayKey()}`], ['EXPIRE', `edit:rate:${card}:${dayKey()}`, 86400]]);
    if (count > MAX_PER_DAY) return res.status(429).json({ error: 'Too many changes sent today. Please try again tomorrow.' });

    const cardKey = `edit:card:${card}`;
    const [members] = await redis([['SMEMBERS', cardKey]]);
    let pending = 0;
    if (members.length) {
      const [vals] = await redis([['MGET', ...members.map(id => `edit:req:${id}`)]]);
      const stale = members.filter((id, i) => !vals[i]);
      if (stale.length) await redis([['SREM', cardKey, ...stale]]);
      pending = members.length - stale.length;
    }
    if (pending >= MAX_PENDING) return res.status(409).json({ error: 'You already have changes waiting for review. Please wait until they are approved.' });

    const id = crypto.randomBytes(8).toString('hex');
    const ts = Date.now();
    await redis([
      ['SET', `edit:req:${id}`, JSON.stringify({ id, card, ts, changes }), 'EX', TTL],
      ['ZADD', 'edit:queue', ts, id],
      ['SADD', cardKey, id],
      ['EXPIRE', cardKey, TTL]
    ]);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Something went wrong. Please try again later.' });
  }
};
