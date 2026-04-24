import fs from 'fs';
import path from 'path';

const dataDir = process.env.SITE_DATA_PATH || path.join(process.cwd(), 'data');

export function getSiteData() {
  const raw = fs.readFileSync(path.join(dataDir, 'site.json'), 'utf-8');
  return JSON.parse(raw);
}

export function getPosts() {
  const raw = fs.readFileSync(path.join(dataDir, 'posts.json'), 'utf-8');
  return JSON.parse(raw);
}

export function getCategories() {
  const raw = fs.readFileSync(path.join(dataDir, 'categories.json'), 'utf-8');
  return JSON.parse(raw);
}

export function getSocialLinks() {
  const raw = fs.readFileSync(path.join(dataDir, 'social-links.json'), 'utf-8');
  return JSON.parse(raw);
}
