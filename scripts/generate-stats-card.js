#!/usr/bin/env node
/**
 * Generates assets/stats.svg — a self-hosted replacement for the
 * github-readme-stats card (whose public instance frequently 502s).
 * Tokyonight palette to match the streak card.
 *
 * Auth: GITHUB_TOKEN env var, or falls back to `gh auth token`.
 * Usage: node scripts/generate-stats-card.js
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TOKEN =
  process.env.GITHUB_TOKEN ||
  execSync('gh auth token', { encoding: 'utf8' }).trim();
const LOGIN = 'fahdi';

async function gql(query, variables = {}) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'profile-stats-card',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors || !json.data) throw new Error(`HTTP ${res.status}: ${JSON.stringify(json).slice(0, 500)}`);
  return json.data;
}

async function collect() {
  // GitHub's GraphQL resource limits reject several heavy totalCount
  // connections combined in one query, so each runs on its own.
  const field = async (sel) =>
    (await gql(`query($login: String!) { user(login: $login) { ${sel} } }`, { login: LOGIN })).user;

  const name = (await field('name')).name;
  const followers = (await field('followers(first: 1) { totalCount }')).followers.totalCount;
  const prs = (await field('pullRequests(first: 1) { totalCount }')).pullRequests.totalCount;
  const issues = (await field('issues(first: 1) { totalCount }')).issues.totalCount;

  const year = new Date().getUTCFullYear();
  const contrib = await gql(
    `query($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          totalCommitContributions
        }
      }
    }`,
    { login: LOGIN, from: `${year}-01-01T00:00:00Z`, to: `${year}-12-31T23:59:59Z` }
  );

  let stars = 0;
  let repoCount = 0;
  let cursor = null;
  for (;;) {
    const page = await gql(
      `query($login: String!, $cursor: String) {
        user(login: $login) {
          repositories(first: 100, after: $cursor, ownerAffiliations: OWNER) {
            pageInfo { hasNextPage endCursor }
            nodes { stargazerCount }
          }
        }
      }`,
      { login: LOGIN, cursor }
    );
    const repos = page.user.repositories;
    stars += repos.nodes.reduce((s, r) => s + r.stargazerCount, 0);
    repoCount += repos.nodes.length;
    if (!repos.pageInfo.hasNextPage) break;
    cursor = repos.pageInfo.endCursor;
  }

  const c = contrib.user.contributionsCollection;
  return {
    name: name || LOGIN,
    stars,
    commits: c.totalCommitContributions,
    prs,
    issues,
    repos: repoCount,
    followers,
  };
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function card(d) {
  const year = new Date().getUTCFullYear();
  const rows = [
    ['Total Stars Earned', d.stars],
    [`Commits (${year})`, d.commits],
    ['Total PRs', d.prs],
    ['Total Issues', d.issues],
    ['Repositories', d.repos],
    ['Followers', d.followers],
  ];
  // tokyonight: bg 1a1b27, title 70a5fd, accent bf91f3, text 38bdae
  const rowSvg = rows
    .map(
      ([label, value], i) => `
    <g transform="translate(25, ${59 + i * 22})">
      <circle cx="4" cy="-4" r="3.5" fill="#bf91f3"/>
      <text x="16" y="0" fill="#38bdae" font-size="13" font-family="Segoe UI, Ubuntu, Helvetica, Arial, sans-serif">${esc(label)}:</text>
      <text x="220" y="0" fill="#c0caf5" font-size="13" font-weight="600" font-family="Segoe UI, Ubuntu, Helvetica, Arial, sans-serif">${esc(value.toLocaleString('en-US'))}</text>
    </g>`
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="450" height="205" viewBox="0 0 450 205" role="img" aria-label="GitHub stats for ${esc(d.name)}">
  <rect width="450" height="205" rx="4.5" fill="#1a1b27"/>
  <text x="25" y="33" fill="#70a5fd" font-size="16" font-weight="600" font-family="Segoe UI, Ubuntu, Helvetica, Arial, sans-serif">${esc(d.name)}'s GitHub Stats</text>
  ${rowSvg}
</svg>
`;
}

collect().then((d) => {
  const out = path.join(__dirname, '..', 'assets', 'stats.svg');
  fs.writeFileSync(out, card(d));
  console.log('✓ assets/stats.svg', JSON.stringify(d));
});
