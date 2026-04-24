export interface SiteData {
  id: string;
  name: string;
  slug: string;
  colorPalette: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  contactEmail: string;
  whatsapp: string | null;
  address: string | null;
  gaTrackingId: string | null;
  gtmContainerId: string | null;
  fbPixelId: string | null;
  customHeadScripts: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImageUrl: string | null;
  status: 'draft' | 'published' | 'archived';
  publishedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
  readingTimeMinutes: number | null;
  Categories: Category[];
}

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
}
