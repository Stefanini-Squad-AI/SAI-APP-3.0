// Shared helper to update a CI dashboard comment on a PR.
// Usage in actions/github-script:
//   const updateDashboard = require('./.github/scripts/update-dashboard');
//   await updateDashboard({ github, context, sections: { 'section-name': 'content' } });
//
// Multiple jobs update different sections concurrently. Each writer re-fetches the
// latest comment before patching and uses staggered retries + jitter so parallel
// runs tend to converge instead of permanently dropping another job's update.

const MARKER = '<!-- ci-dashboard -->';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Spreads concurrent writers apart deterministically per section set (djb2-ish). */
function staggerMs(sections) {
  const keys = Object.keys(sections)
    .sort((a, b) => a.localeCompare(b))
    .join(',');
  let h = 5381;
  for (const ch of keys) h = (Math.imul(32, h) + h) ^ ch.codePointAt(0);
  return 400 + (Math.abs(h) % 2400);
}

function applySections(body, sections) {
  let result = body;
  for (const [name, content] of Object.entries(sections)) {
    const s = `<!-- section:${name} -->`,
      e = `<!-- /section:${name} -->`;
    const si = result.indexOf(s),
      ei = result.indexOf(e);
    if (si !== -1 && ei !== -1)
      result = result.substring(0, si + s.length) + '\n' + content + '\n' + result.substring(ei);
  }
  return result;
}

function verifySections(body, sections) {
  for (const [name, content] of Object.entries(sections)) {
    const s = `<!-- section:${name} -->`,
      e = `<!-- /section:${name} -->`;
    const si = body?.indexOf(s) ?? -1,
      ei = body?.indexOf(e) ?? -1;
    if (si !== -1 && ei !== -1 && body.substring(si + s.length, ei).trim() !== content.trim())
      return false;
  }
  return true;
}

async function findDashboardComment(github, context) {
  const { data: comments } = await github.rest.issues.listComments({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.issue.number,
  });
  return comments.find((c) => c.body?.includes(MARKER));
}

module.exports = async function updateDashboard({ github, context, sections }) {
  const maxAttempts = 15;
  await sleep(staggerMs(sections));

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (attempt > 1) {
      const backoff = Math.min(8000, 600 * 2 ** (attempt - 2) + Math.random() * 1200);
      await sleep(backoff);
    }
    const comment = await findDashboardComment(github, context);
    if (!comment) return;
    const body = applySections(comment.body, sections);
    await sleep(40 + Math.random() * 180);
    try {
      await github.rest.issues.updateComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        comment_id: comment.id,
        body,
      });
    } catch {
      continue;
    }
    await sleep(350 + Math.random() * 450);
    const updated = await findDashboardComment(github, context);
    if (verifySections(updated?.body, sections)) return;
  }
};
