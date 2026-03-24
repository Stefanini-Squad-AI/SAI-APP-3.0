// Shared helper to update a CI dashboard comment on a PR.
// Usage in actions/github-script:
//   const updateDashboard = require('./.github/scripts/update-dashboard');
//   await updateDashboard({ github, context, sections: { 'section-name': 'content' } });

const MARKER = '<!-- ci-dashboard -->';

function applySections(body, sections) {
  let result = body;
  for (const [name, content] of Object.entries(sections)) {
    const s = `<!-- section:${name} -->`, e = `<!-- /section:${name} -->`;
    const si = result.indexOf(s), ei = result.indexOf(e);
    if (si !== -1 && ei !== -1)
      result = result.substring(0, si + s.length) + '\n' + content + '\n' + result.substring(ei);
  }
  return result;
}

function verifySections(body, sections) {
  for (const [name, content] of Object.entries(sections)) {
    const s = `<!-- section:${name} -->`, e = `<!-- /section:${name} -->`;
    const si = body?.indexOf(s) ?? -1, ei = body?.indexOf(e) ?? -1;
    if (si !== -1 && ei !== -1 && body.substring(si + s.length, ei).trim() !== content.trim())
      return false;
  }
  return true;
}

async function findDashboardComment(github, context) {
  const { data: comments } = await github.rest.issues.listComments({
    owner: context.repo.owner, repo: context.repo.repo,
    issue_number: context.issue.number,
  });
  return comments.find(c => c.body?.includes(MARKER));
}

module.exports = async function updateDashboard({ github, context, sections }) {
  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (attempt > 1) await new Promise(r => setTimeout(r, attempt * 1000 + Math.random() * 2000));
    const comment = await findDashboardComment(github, context);
    if (!comment) return;
    const body = applySections(comment.body, sections);
    try {
      await github.rest.issues.updateComment({
        owner: context.repo.owner, repo: context.repo.repo,
        comment_id: comment.id, body,
      });
    } catch { continue; }
    await new Promise(r => setTimeout(r, 800));
    const updated = await findDashboardComment(github, context);
    if (verifySections(updated?.body, sections)) return;
  }
};
