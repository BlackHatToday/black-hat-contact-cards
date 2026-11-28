// Reads and writes a card's data.json in the GitHub repo (no npm dependency).
// Environment variables (set in Vercel): GITHUB_TOKEN, GITHUB_REPO ("owner/repo"),
// optional GITHUB_BRANCH (default "main").
// The leading underscore on this folder keeps Vercel from exposing it as an endpoint.

function cfg() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token || !repo) throw new Error('GitHub is not configured (missing GITHUB_TOKEN or GITHUB_REPO)');
  return { token, repo, branch: process.env.GITHUB_BRANCH || 'main' };
}

function headers(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'black-hat-cards-editor',
    'Content-Type': 'application/json'
  };
}

// Returns { data, sha } or null when the file does not exist.
async function getFile(path) {
  const { token, repo, branch } = cfg();
  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`, { headers: headers(token) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub read failed (${res.status})`);
  const j = await res.json();
  const text = Buffer.from(j.content || '', 'base64').toString('utf8');
  return { data: JSON.parse(text), sha: j.sha };
}

// Writes data back as pretty JSON (2 spaces, same as the existing files).
// Throws an error with .status = 409/422 when the file changed in the meantime.
async function putFile(path, data, sha, message) {
  const { token, repo, branch } = cfg();
  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify({
      message, branch, sha,
      content: Buffer.from(JSON.stringify(data, null, 2) + '\n', 'utf8').toString('base64')
    })
  });
  if (!res.ok) {
    const e = new Error(`GitHub write failed (${res.status})`);
    e.status = res.status;
    throw e;
  }
  return true;
}

module.exports = { getFile, putFile };
