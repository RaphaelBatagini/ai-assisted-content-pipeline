import Head from 'next/head';
import { GetStaticPaths, GetStaticProps } from 'next';
import Layout from '../../components/Layout';
import PostCard from '../../components/PostCard';
import Analytics from '../../components/Analytics';
import { getSiteData, getPosts, getCategories, getSocialLinks } from '../../lib/data';
import { getPalette, paletteToCSS } from '../../lib/palettes';
import { SiteData, Post, Category, SocialLink } from '../../lib/types';

interface CategoryPageProps {
  site: SiteData;
  category: Category;
  posts: Post[];
  categories: Category[];
  socialLinks: SocialLink[];
  paletteCSS: string;
  faviconUrl: string | null;
}

export default function CategoryPage({ site, category, posts, categories, socialLinks }: CategoryPageProps) {
  return (
    <>
      <Head>
        <title>{`${category.name} — ${site.name}`}</title>
        {category.description && <meta name="description" content={category.description} />}
        <meta property="og:title" content={`${category.name} — ${site.name}`} />
      </Head>
      <Analytics site={site} />
      <Layout site={site} categories={categories} socialLinks={socialLinks}>
        <div className="container">
          <div className="page-hero">
            <h1>{category.name}</h1>
            {category.description && <p>{category.description}</p>}
          </div>
          {posts.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum post nesta categoria ainda.</p>
            </div>
          ) : (
            <div className="posts-grid">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const categories = getCategories();
  return {
    paths: categories.map((cat: Category) => ({ params: { categorySlug: cat.slug } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<CategoryPageProps> = async ({ params }) => {
  const site = getSiteData();
  const categories = getCategories();
  const socialLinks = getSocialLinks();
  const allPosts = getPosts();
  const palette = getPalette(site.colorPalette);
  const paletteCSS = paletteToCSS(palette);

  const category = categories.find((c: Category) => c.slug === params?.categorySlug);
  if (!category) return { notFound: true };

  const posts = allPosts.filter(
    (p: Post) =>
      p.status === 'published' &&
      p.Categories?.some((c: Category) => c.slug === params?.categorySlug),
  );

  return {
    props: {
      site,
      category,
      posts,
      categories,
      socialLinks,
      paletteCSS,
      faviconUrl: site.faviconUrl ?? null,
    },
  };
};
