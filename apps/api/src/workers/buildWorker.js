require('dotenv').config();

const path = require('path');
const fs = require('fs');
const { execSync, execFileSync } = require('child_process');
const { buildQueue } = require('../services/buildQueue');
const { deploySite } = require('../services/s3DeployService');

// Load models (needs DB connection)
require('../models');
const { Site, Post, Category, SocialLink, sequelize } = require('../models');

const SITE_TEMPLATE_DIR =
  process.env.SITE_TEMPLATE_DIR ||
  path.resolve(__dirname, '../../../site-template');

const BUILDS_BASE_DIR = process.env.BUILDS_BASE_DIR || '/tmp/builds';

/**
 * Prepare the data JSON files for a site build.
 * @param {string} siteId
 * @returns {{ site, dataDir, outDir }}
 */
async function prepareBuildData(siteId) {
  const site = await Site.findByPk(siteId, {
    include: [{ model: SocialLink }],
  });
  if (!site) throw new Error(`Site not found: ${siteId}`);

  const posts = await Post.findAll({
    where: { siteId, status: 'published' },
    include: [{ model: Category, through: { attributes: [] } }],
    order: [['publishedAt', 'DESC']],
  });

  const categories = await Category.findAll({ where: { siteId } });

  const dataDir = path.join(BUILDS_BASE_DIR, siteId, 'data');
  fs.mkdirSync(dataDir, { recursive: true });

  const siteJson = site.toJSON();
  delete siteJson.SocialLinks; // keep social links separate

  fs.writeFileSync(path.join(dataDir, 'site.json'), JSON.stringify(siteJson, null, 2));
  fs.writeFileSync(path.join(dataDir, 'posts.json'), JSON.stringify(posts.map((p) => p.toJSON()), null, 2));
  fs.writeFileSync(path.join(dataDir, 'categories.json'), JSON.stringify(categories.map((c) => c.toJSON()), null, 2));
  fs.writeFileSync(
    path.join(dataDir, 'social-links.json'),
    JSON.stringify(site.SocialLinks ? site.SocialLinks.map((s) => s.toJSON()) : [], null, 2),
  );

  console.log(`[buildWorker] Data written to ${dataDir}`);
  return { site: siteJson, dataDir };
}

/**
 * Run next build for the site-template and return the out/ directory path.
 * @param {string} siteId
 * @param {string} dataDir
 * @param {string} siteSlug
 * @returns {string} outDir
 */
function runBuild(siteId, dataDir, siteSlug) {
  const outDir = path.join(BUILDS_BASE_DIR, siteId, 'out');
  const baseUrl = process.env.SITE_BASE_URL_TEMPLATE
    ? process.env.SITE_BASE_URL_TEMPLATE.replace('{slug}', siteSlug)
    : `http://${siteSlug}.localhost`;

  const env = {
    ...process.env,
    SITE_DATA_PATH: dataDir,
    SITE_BASE_URL: baseUrl,
    NEXT_PUBLIC_API_URL: process.env.API_URL || 'http://localhost:3001',
    NODE_ENV: 'production', // next build must run in production mode
    // next export writes to out/ inside the project dir; we symlink or copy after
  };

  console.log(`[buildWorker] Running next build for site ${siteId} (${siteSlug})...`);

  // Use a per-build output dir by setting NEXT_OUTPUT_DIR if supported,
  // otherwise build always writes to site-template/out/
  try {
    console.log(`[buildWorker] Using environment variables:`, {
      SITE_DATA_PATH: env.SITE_DATA_PATH,
      SITE_BASE_URL: env.SITE_BASE_URL,
      SITE_TEMPLATE_DIR,
      NEXT_PUBLIC_API_URL: env.NEXT_PUBLIC_API_URL,
      NODE_ENV: env.NODE_ENV,
    });
    execFileSync('npm', ['run', 'build'], {
      cwd: SITE_TEMPLATE_DIR,
      env,
      stdio: 'inherit',
    });
  } catch (err) {
    const stdout = err.stdout ? err.stdout.toString() : '';
    const stderr = err.stderr ? err.stderr.toString() : '';
    console.error(`[buildWorker] next build failed for site ${siteId} (${siteSlug}):`, err.message)
    if (stdout) console.error('[buildWorker] stdout:', stdout);
    if (stderr) console.error('[buildWorker] stderr:', stderr);
    throw err;
  }

  const builtOutDir = path.join(SITE_TEMPLATE_DIR, 'out');

  // Copy out/ to a tenant-specific directory so concurrent builds don't collide
  fs.mkdirSync(path.dirname(outDir), { recursive: true });
  if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });

  execSync(`cp -r "${builtOutDir}" "${outDir}"`, { stdio: 'inherit' });

  console.log(`[buildWorker] Build complete. Output at ${outDir}`);
  return outDir;
}

/**
 * Process a single build job.
 */
async function processBuildJob(job) {
  const { siteId, trigger } = job.data;
  console.log(`[buildWorker] Processing job ${job.id}: siteId=${siteId}, trigger=${trigger}`);

  await job.progress(10);

  const { site, dataDir } = await prepareBuildData(siteId);
  await job.progress(30);

  const outDir = runBuild(siteId, dataDir, site.slug);
  await job.progress(70);

  if (process.env.STATIC_SITES_BUCKET) {
    await deploySite(site.slug, outDir);
    await job.progress(95);
  } else {
    console.warn('[buildWorker] STATIC_SITES_BUCKET not set — skipping S3 deploy');
  }

  await job.progress(100);
  console.log(`[buildWorker] Job ${job.id} completed for site ${siteId}`);
}

// Register worker
buildQueue.process(
  parseInt(process.env.BUILD_CONCURRENCY || '1', 10),
  async (job) => {
    await processBuildJob(job);
  },
);

buildQueue.on('failed', (job, err) => {
  console.error(`[buildWorker] Job ${job.id} failed (attempt ${job.attemptsMade}):`, err.message);
});

buildQueue.on('completed', (job) => {
  console.log(`[buildWorker] Job ${job.id} completed successfully`);
});

buildQueue.on('error', (err) => {
  console.error('[buildWorker] Queue error:', err.message);
});

// Graceful shutdown
async function shutdown() {
  console.log('[buildWorker] Shutting down...');
  await buildQueue.close();
  await sequelize.close();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log('[buildWorker] Worker started. Waiting for jobs...');
