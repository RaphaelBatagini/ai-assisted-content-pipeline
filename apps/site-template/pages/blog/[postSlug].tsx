import Head from 'next/head';
import Link from 'next/link';
import { GetStaticPaths, GetStaticProps } from 'next';
import Layout from '../../components/Layout';
import Analytics from '../../components/Analytics';
import PostCTA from '../../components/PostCTA';
import RelatedPosts from '../../components/RelatedPosts';
import { getSiteData, getPosts, getCategories, getSocialLinks } from '../../lib/data';
import { getPalette, paletteToCSS } from '../../lib/palettes';
import { SiteData, Post, Category, SocialLink } from '../../lib/types';

interface ArticlePageProps {
  site: SiteData;
  post: Post;
  allPosts: Post[];
  categories: Category[];
  socialLinks: SocialLink[];
  paletteCSS: string;
  faviconUrl: string | null;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default function ArticlePage({
  site,
  post,
  allPosts,
  categories,
  socialLinks,
}: ArticlePageProps) {
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt || '';
  const ogImage = post.ogImageUrl || post.coverImageUrl || '';
  const primaryCategory = post.Categories?.[0];

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: description || undefined,
    datePublished: post.publishedAt || undefined,
    author: post.author ? { '@type': 'Person', name: post.author } : undefined,
    image: ogImage || undefined,
    publisher: { '@type': 'Organization', name: site.name },
    url: `/${post.slug}/`,
  };

  return (
    <>
      <Head>
        <title>{`${title} — ${site.name}`}</title>
        {description && <meta name="description" content={description} />}
        <meta property="og:title" content={title} />
        {description && <meta property="og:description" content={description} />}
        <meta property="og:type" content="article" />
        {ogImage && <meta property="og:image" content={ogImage} />}
        {post.publishedAt && (
          <meta property="article:published_time" content={post.publishedAt} />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />
      </Head>
      <Analytics site={site} />
      <Layout site={site} categories={categories} socialLinks={socialLinks}>
        <article className="post-page">
          <header className="post-header">
            {primaryCategory && (
              <div style={{ marginBottom: '0.75rem' }}>
                <Link
                  href={`/blog/category/${primaryCategory.slug}/`}
                  className="category-badge"
                >
                  {primaryCategory.name}
                </Link>
              </div>
            )}
            <h1 className="post-title">{post.title}</h1>
            {post.excerpt && (
              <p
                style={{
                  color: 'var(--color-text-muted)',
                  fontSize: '1.1rem',
                  lineHeight: '1.6',
                  marginBottom: '0.75rem',
                }}
              >
                {post.excerpt}
              </p>
            )}
            <div className="post-meta">
              {post.author && <span>Por {post.author}</span>}
              {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
              {post.readingTimeMinutes && (
                <span>{post.readingTimeMinutes} min de leitura</span>
              )}
            </div>
          </header>

          {post.coverImageUrl && (
            <img
              className="post-cover"
              src={post.coverImageUrl}
              alt={post.title}
              loading="eager"
            />
          )}

          <div
            className="post-content"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <PostCTA />

          <RelatedPosts
            currentPostId={post.id}
            categorySlug={primaryCategory?.slug}
            allPosts={allPosts}
          />
        </article>
      </Layout>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = getPosts();
  const published = posts.filter((p: Post) => p.status === 'published');
  return {
    paths: published.map((p: Post) => ({ params: { postSlug: p.slug } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<ArticlePageProps> = async ({ params }) => {
  const site = getSiteData();
  const categories = getCategories();
  const socialLinks = getSocialLinks();
  const allPostsRaw = getPosts();
  const palette = getPalette(site.colorPalette);
  const paletteCSS = paletteToCSS(palette);

  const post = allPostsRaw.find(
    (p: Post) => p.slug === params?.postSlug && p.status === 'published',
  );
  if (!post) return { notFound: true };

  const allPosts = allPostsRaw.filter((p: Post) => p.status === 'published');

  return {
    props: {
      site,
      post,
      allPosts,
      categories,
      socialLinks,
      paletteCSS,
      faviconUrl: site.faviconUrl ?? null,
    },
  };
};
