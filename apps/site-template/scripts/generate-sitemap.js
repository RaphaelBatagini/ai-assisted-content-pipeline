#!/usr/bin/env node
/**
 * Post-build script: generates sitemap.xml and updates robots.txt in the out/ directory.
 * Usage: SITE_DATA_PATH=/path/to/data SITE_BASE_URL=https://slug.example.com node scripts/generate-sitemap.js
 */

const fs = require('fs');
const path = require('path');

const dataDir = process.env.SITE_DATA_PATH || path.join(__dirname, '..', 'data');
const outDir = path.join(__dirname, '..', 'out');
const baseUrl = (process.env.SITE_BASE_URL || 'http://localhost').replace(/\/$/, '');

const site = JSON.parse(fs.readFileSync(path.join(dataDir, 'site.json'), 'utf-8'));
const posts = JSON.parse(fs.readFileSync(path.join(dataDir, 'posts.json'), 'utf-8'));
const categories = JSON.parse(fs.readFileSync(path.join(dataDir, 'categories.json'), 'utf-8'));

const published = posts.filter((p) => p.status === 'published');

function url(loc, lastmod, priority = '0.7') {
  return `  <url>
    <loc>${baseUrl}${loc}</loc>
    ${lastmod ? `<lastmod>${new Date(lastmod).toISOString().split('T')[0]}</lastmod>` : ''}
    <priority>${priority}</priority>
  </url>`;
}

const urls = [
  url('/', site.updatedAt || new Date().toISOString(), '1.0'),
  url('/contato/', null, '0.5'),
  ...categories.map((cat) => url(`/${cat.slug}/`, null, '0.6')),
  ...published.map((post) => url(`/post/${post.slug}/`, post.publishedAt || post.updatedAt, '0.8')),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

fs.writeFileSync(path.join(outDir, 'sitemap.xml'), sitemap, 'utf-8');
console.log(`[sitemap] Written ${urls.length} URLs to out/sitemap.xml`);

// Update robots.txt placeholder
const robotsPath = path.join(outDir, 'robots.txt');
if (fs.existsSync(robotsPath)) {
  const robotsContent = fs.readFileSync(robotsPath, 'utf-8');
  fs.writeFileSync(
    robotsPath,
    robotsContent.replace('SITEMAP_URL_PLACEHOLDER', `${baseUrl}/sitemap.xml`),
    'utf-8',
  );
  console.log('[sitemap] Updated robots.txt with sitemap URL');
}
