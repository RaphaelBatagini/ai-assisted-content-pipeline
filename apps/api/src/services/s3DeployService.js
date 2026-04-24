const {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} = require('@aws-sdk/client-s3');
const {
  CloudFrontClient,
  CreateInvalidationCommand,
} = require('@aws-sdk/client-cloudfront');
const fs = require('fs');
const path = require('path');
const { lookup: mimeLookup } = require('mime-types');

const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const cf = new CloudFrontClient({ region: 'us-east-1' });

const BUCKET = process.env.STATIC_SITES_BUCKET;
const CF_DISTRIBUTION_ID = process.env.CF_DISTRIBUTION_ID;

/**
 * Recursively collect all files under a directory.
 * @param {string} dir
 * @returns {string[]} absolute paths
 */
function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

/**
 * Delete all existing objects for a site prefix in S3.
 * @param {string} siteSlug
 */
async function clearSitePrefix(siteSlug) {
  const prefix = `${siteSlug}/`;
  let continuationToken;
  const keys = [];

  do {
    const res = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );
    if (res.Contents) {
      keys.push(...res.Contents.map((o) => ({ Key: o.Key })));
    }
    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (continuationToken);

  if (keys.length === 0) return;

  // Delete in batches of 1000
  for (let i = 0; i < keys.length; i += 1000) {
    await s3.send(
      new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: { Objects: keys.slice(i, i + 1000) },
      }),
    );
  }
  console.log(`[s3Deploy] Cleared ${keys.length} objects for prefix ${prefix}`);
}

/**
 * Upload the contents of outDir to S3 under the site slug prefix.
 * @param {string} siteSlug
 * @param {string} outDir  - path to the Next.js `out/` directory
 */
async function uploadSite(siteSlug, outDir) {
  const files = walkDir(outDir);
  let count = 0;

  for (const filePath of files) {
    const relative = path.relative(outDir, filePath).replace(/\\/g, '/');
    const key = `${siteSlug}/${relative}`;
    const contentType = mimeLookup(filePath) || 'application/octet-stream';
    const body = fs.readFileSync(filePath);

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: relative.startsWith('_next/static/')
          ? 'public, max-age=31536000, immutable'
          : 'public, max-age=300',
      }),
    );
    count++;
  }

  console.log(`[s3Deploy] Uploaded ${count} files for site ${siteSlug}`);
}

/**
 * Invalidate CloudFront cache for a given site slug.
 * @param {string} siteSlug
 */
async function invalidateCloudFront(siteSlug) {
  if (!CF_DISTRIBUTION_ID) {
    console.warn('[s3Deploy] CF_DISTRIBUTION_ID not set, skipping invalidation');
    return;
  }
  await cf.send(
    new CreateInvalidationCommand({
      DistributionId: CF_DISTRIBUTION_ID,
      InvalidationBatch: {
        CallerReference: `${siteSlug}-${Date.now()}`,
        Paths: {
          Quantity: 1,
          Items: [`/${siteSlug}/*`],
        },
      },
    }),
  );
  console.log(`[s3Deploy] CloudFront invalidation created for /${siteSlug}/*`);
}

/**
 * Full deploy: clear old files, upload new files, invalidate CDN.
 * @param {string} siteSlug
 * @param {string} outDir
 */
async function deploySite(siteSlug, outDir) {
  await clearSitePrefix(siteSlug);
  await uploadSite(siteSlug, outDir);
  await invalidateCloudFront(siteSlug);
}

module.exports = { deploySite, uploadSite, clearSitePrefix, invalidateCloudFront };
