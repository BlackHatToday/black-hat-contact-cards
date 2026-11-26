// Minimal Upstash Redis REST client — no npm dependency, so the project
// does not need a package.json. The leading underscore on this folder name
// tells Vercel NOT to expose it as a public endpoint.
//
// Vercel's Upstash integration (Marketplace) adds these environment
// variables automatically. Both naming schemes are accepted.

function config() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('Redis is not configured (missing REST url/token env vars)');
  return { url: url.replace(/\/+$/, ''), token };
}

// Runs several commands in one round trip, e.g.
//   await redis([['INCR', 'a'], ['SADD', 'set', 'x']])  ->  [1, 1]
// Throws if the request fails or if any single command reports an error.
async function redis(commands) {
  const { url, token } = config();
  const res = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands)
  });
  if (!res.ok) throw new Error(`Redis request failed (${res.status})`);
  const out = await res.json();
  return out.map(item => {
    if (item && item.error) throw new Error(`Redis command error: ${item.error}`);
    return item.result;
  });
}

// Day boundaries follow Eastern time (the business is in NC), not UTC —
// otherwise an evening tap would be filed under tomorrow's date.
const TZ = 'America/New_York';
function dayKey(date = new Date()) {
  // 'en-CA' formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(date);
}

module.exports = { redis, dayKey, TZ };
