#!/usr/bin/env node
/**
 * Generates all README badge SVGs into assets/badges/.
 * Self-contained replacement for img.shields.io URLs so the profile
 * never depends on a third-party badge service at render time.
 *
 * Usage: node scripts/generate-badges.js
 * Deps:  npm install badge-maker simple-icons
 */
const fs = require('fs');
const path = require('path');
const { makeBadge } = require('badge-maker');
const icons = require('simple-icons');

const OUT = path.join(__dirname, '..', 'assets', 'badges');
fs.mkdirSync(OUT, { recursive: true });

function logo(slug, color) {
  const key = 'si' + slug.charAt(0).toUpperCase() + slug.slice(1);
  const icon = icons[key];
  if (!icon) throw new Error(`simple-icons: missing ${key}`);
  const svg = icon.svg.replace('<svg ', `<svg fill="${color}" `);
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

// Dynamic values — refreshed by .github/workflows/update-badges.yml; the
// literals are fallbacks for local runs without env set.
const V_TABLECRAFTER = process.env.WP_TABLECRAFTER_VERSION || '8.0.45';
const V_EVENTCRAFTER = process.env.WP_EVENTCRAFTER_VERSION || '1.3.1';
const V_CARDCRAFTER = process.env.WP_CARDCRAFTER_VERSION || '1.14.3';
const TCJS_LANG = process.env.TABLECRAFTERJS_TOP_LANG || 'TypeScript 53%';
const WOO_AI_STARS = process.env.WOO_AI_STARS || '5';

// [file, label, message, color, style, logoSlug, logoColor]
const badges = [
  // Header credentials (flat-square)
  ['toptal', 'Toptal', 'Certified Engineer', '#3863A0', 'flat-square', 'toptal', 'white'],
  ['codeable', 'Codeable', 'Expert Developer 2019–2025', '#1BAFD6', 'flat-square', null, null],
  ['wporg-author', 'WordPress.org', 'Plugin Author', '#21759B', 'flat-square', 'wordpress', 'white'],
  ['tablecrafter-org', '@TableCrafter', 'Org', '#6366F1', 'flat-square', 'github', 'white'],
  ['email', 'Email', 'info@fahdmurtaza.com', '#EA4335', 'flat-square', 'gmail', 'white'],

  // Plugin cards (flat-square) — versions refreshed by update-badges workflow
  ['wp-tablecrafter', 'WP.org', `v${V_TABLECRAFTER}`, '#21759B', 'flat-square', 'wordpress', 'white'],
  ['wp-eventcrafter', 'WP.org', `v${V_EVENTCRAFTER}`, '#21759B', 'flat-square', 'wordpress', 'white'],
  ['wp-cardcrafter', 'WP.org', `v${V_CARDCRAFTER}`, '#21759B', 'flat-square', 'wordpress', 'white'],
  ['tablecrafterjs-lang', 'language', TCJS_LANG, '#3178C6', 'flat-square', 'typescript', 'white'],
  ['woo-ai-stars', 'stars', WOO_AI_STARS, '#dfb317', 'flat-square', 'github', 'white'],

  // Tech stack (for-the-badge): label-only badges, logo left
  ['go', 'Go', '', '#00ADD8', 'for-the-badge', 'go', 'white'],
  ['rust', 'Rust', '', '#000000', 'for-the-badge', 'rust', 'white'],
  ['javascript', 'JavaScript', '', '#F7DF1E', 'for-the-badge', 'javascript', 'black'],
  ['typescript', 'TypeScript', '', '#3178C6', 'for-the-badge', 'typescript', 'white'],
  ['python', 'Python', '', '#3776AB', 'for-the-badge', 'python', 'white'],
  ['php', 'PHP', '', '#777BB4', 'for-the-badge', 'php', 'white'],
  ['swift', 'Swift', '', '#FA7343', 'for-the-badge', 'swift', 'white'],
  ['html5', 'HTML5', '', '#E34F26', 'for-the-badge', 'html5', 'white'],
  ['css3', 'CSS3', '', '#1572B6', 'for-the-badge', 'css', 'white'],
  ['wordpress', 'WordPress', '', '#21759B', 'for-the-badge', 'wordpress', 'white'],
  ['woocommerce', 'WooCommerce', '', '#96588A', 'for-the-badge', 'woocommerce', 'white'],
  ['react', 'React', '', '#61DAFB', 'for-the-badge', 'react', 'black'],
  ['nextjs', 'Next.js', '', '#000000', 'for-the-badge', 'nextdotjs', 'white'],
  ['react-native', 'React Native', '', '#61DAFB', 'for-the-badge', 'react', 'black'],
  ['flutter', 'Flutter', '', '#02569B', 'for-the-badge', 'flutter', 'white'],
  ['django', 'Django', '', '#092E20', 'for-the-badge', 'django', 'white'],
  ['nodejs', 'Node.js', '', '#339933', 'for-the-badge', 'nodedotjs', 'white'],
  ['anthropic', 'Anthropic Claude', '', '#191919', 'for-the-badge', 'anthropic', 'white'],
  ['openai', 'OpenAI', '', '#412991', 'for-the-badge', null, null],
  ['langchain', 'LangChain', '', '#1C3C3C', 'for-the-badge', null, null],
  ['pinecone', 'Pinecone', '', '#000000', 'for-the-badge', null, null],
  ['agentic-commerce', 'Agentic Commerce', '', '#FF6B35', 'for-the-badge', null, null],
  ['git', 'Git', '', '#F05032', 'for-the-badge', 'git', 'white'],
  ['docker', 'Docker', '', '#2496ED', 'for-the-badge', 'docker', 'white'],
  ['mysql', 'MySQL', '', '#4479A1', 'for-the-badge', 'mysql', 'white'],
  ['mongodb', 'MongoDB', '', '#47A248', 'for-the-badge', 'mongodb', 'white'],
  ['redis', 'Redis', '', '#DC382D', 'for-the-badge', 'redis', 'white'],

  // Connect (for-the-badge)
  ['website', 'fahdmurtaza.com', '', '#6366F1', 'for-the-badge', 'googlechrome', 'white'],
  ['isupercoder', 'iSuperCoder.com', '', '#000000', 'for-the-badge', 'googlechrome', 'white'],
  ['toptal-connect', 'Toptal', '', '#3863A0', 'for-the-badge', 'toptal', 'white'],
  ['email-connect', 'Email', '', '#EA4335', 'for-the-badge', 'gmail', 'white'],
];

for (const [file, label, message, color, style, logoSlug, logoColor] of badges) {
  const opts = { style, color };
  // badge-maker requires a message; single-word badges put the text in message
  // with no label so the whole badge is one colored block (shields does the same).
  if (message) {
    opts.label = label;
    opts.message = message;
  } else {
    opts.message = label;
  }
  if (logoSlug) opts.logoBase64 = logo(logoSlug, logoColor);
  fs.writeFileSync(path.join(OUT, `${file}.svg`), makeBadge(opts));
  console.log(`✓ ${file}.svg`);
}
console.log(`\n${badges.length} badges written to assets/badges/`);
