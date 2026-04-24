'use strict';

/**
 * Lambda@Edge — Viewer Request handler
 *
 * Rewrites the URI to prepend the site slug derived from the Host header.
 * This allows a single CloudFront distribution to serve multiple tenant sites
 * stored under different S3 prefixes.
 *
 * S3 bucket layout:
 *   s3://BUCKET/SLUG/index.html
 *   s3://BUCKET/SLUG/post/my-post/index.html
 *   …
 *
 * CloudFront behaviour:
 *   Origin: S3 bucket root (with OAC / OAI)
 *   This function rewrites /path → /SLUG/path
 *
 * Deployment:
 *   1. Deploy this function to AWS Lambda (us-east-1).
 *   2. Associate it with the CloudFront distribution's "Viewer Request" event.
 *   3. The distribution must have a wildcard CNAME pointing to it
 *      (*.example.com → distribution domain).
 *
 * Configuration:
 *   - Set the BASE_DOMAIN environment variable (e.g. "example.com") in the Lambda
 *     config.  Lambda@Edge does NOT support env vars natively; use SSM Parameter
 *     Store or hardcode the value below as a fallback.
 */

const BASE_DOMAIN = process.env.BASE_DOMAIN || 'example.com';

exports.handler = async (event) => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;

  const hostHeader = headers.host && headers.host[0] ? headers.host[0].value : '';

  // Extract slug from subdomain: "my-blog.example.com" → "my-blog"
  const slug = extractSlug(hostHeader, BASE_DOMAIN);

  if (!slug) {
    // No slug found (e.g. bare domain or unknown host) — serve root
    return request;
  }

  // Rewrite URI: /some/path → /SLUG/some/path
  const originalUri = request.uri || '/';

  // Avoid double-prefixing if already prefixed (safety check)
  if (!originalUri.startsWith(`/${slug}/`) && originalUri !== `/${slug}`) {
    request.uri = `/${slug}${originalUri === '/' ? '/index.html' : originalUri}`;
  }

  // Also ensure trailing-slash paths resolve to index.html
  if (request.uri.endsWith('/') && !request.uri.endsWith('/index.html')) {
    request.uri = `${request.uri}index.html`;
  }

  return request;
};

/**
 * Extract the slug (subdomain part) from a host header value.
 * @param {string} host - e.g. "my-blog.example.com" or "my-blog.example.com:443"
 * @param {string} baseDomain - e.g. "example.com"
 * @returns {string|null}
 */
function extractSlug(host, baseDomain) {
  // Strip port if present
  const hostname = host.split(':')[0].toLowerCase();
  const suffix = `.${baseDomain.toLowerCase()}`;

  if (!hostname.endsWith(suffix)) return null;

  const slug = hostname.slice(0, hostname.length - suffix.length);
  return slug && slug !== 'www' ? slug : null;
}
