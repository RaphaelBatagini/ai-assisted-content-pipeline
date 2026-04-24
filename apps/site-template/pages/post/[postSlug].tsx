import Head from 'next/head';
import Link from 'next/link';
import { GetStaticPaths, GetStaticProps } from 'next';
import Layout from '../../components/Layout';
import Analytics from '../../components/Analytics';
import { getSiteData, getPosts, getCategories, getSocialLinks } from '../../lib/data';
import { getPalette, paletteToCSS } from '../../lib/palettes';
import { SiteData, Post, Category, SocialLink } from '../../lib/types';

interface PostPageProps {
  site: SiteData;
  post: Post;
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

export default function PostPage({ site, post, categories, socialLinks }: PostPageProps) {
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt || '';
  const ogImage = post.ogImageUrl || post.coverImageUrl || '';

  return (
    <>
      <Head>
        <title>{`${title} — ${site.name}`}</title>
        {description && <meta name="description" content={description} />}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        {ogImage && <meta property="og:image" content={ogImage} />}
        {post.publishedAt && (
          <meta property="article:published_time" content={post.publishedAt} />
        )}
      </Head>
      <Analytics site={site} />
      <Layout site={site} categories={categories} socialLinks={socialLinks}>
        <article className="post-page">
          <header className="post-header">
            {post.Categories && post.Categories.length > 0 && (
              <div className="post-card-categories" style={{ marginBottom: '1rem' }}>
                {post.Categories.map((cat) => (
                  <Link key={cat.id} href={`/${cat.slug}/`} className="category-badge">
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
            <h1 className="post-title">{post.title}</h1>
            <div className="post-meta">
              {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
              {post.readingTimeMinutes && (
                <span>{post.readingTimeMinutes} min de leitura</span>
              )}
            </div>
          </header>

          {post.coverImageUrl && (
            <img className="post-cover" src={post.coverImageUrl} alt={post.title} />
          )}

          <div
            className="post-content"
            dangerouslySetInnerHTML={{ __html: post.content }}
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

export const getStaticProps: GetStaticProps<PostPageProps> = async ({ params }) => {
  const site = getSiteData();
  const categories = getCategories();
  const socialLinks = getSocialLinks();
  const allPosts = getPosts();
  const palette = getPalette(site.colorPalette);
  const paletteCSS = paletteToCSS(palette);

  const post = allPosts.find((p: Post) => p.slug === params?.postSlug && p.status === 'published');
  if (!post) return { notFound: true };

  return {
    props: {
      site,
      post,
      categories,
      socialLinks,
      paletteCSS,
      faviconUrl: site.faviconUrl ?? null,
    },
  };
};
