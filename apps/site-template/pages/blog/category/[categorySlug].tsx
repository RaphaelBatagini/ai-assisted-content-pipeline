import Head from 'next/head';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useState } from 'react';
import Layout from '../../../components/Layout';
import Analytics from '../../../components/Analytics';
import FeaturedCard from '../../../components/FeaturedCard';
import BlogCard from '../../../components/BlogCard';
import Sidebar from '../../../components/Sidebar';
import { getSiteData, getPosts, getCategories, getSocialLinks } from '../../../lib/data';
import { getPalette, paletteToCSS } from '../../../lib/palettes';
import { SiteData, Post, Category, SocialLink } from '../../../lib/types';

interface BlogCategoryPageProps {
  site: SiteData;
  category: Category;
  posts: Post[];
  allPosts: Post[];
  categories: Category[];
  socialLinks: SocialLink[];
  paletteCSS: string;
  faviconUrl: string | null;
}

export default function BlogCategoryPage({
  site,
  category,
  posts,
  allPosts,
  categories,
  socialLinks,
}: BlogCategoryPageProps) {
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? posts.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.excerpt?.toLowerCase().includes(search.toLowerCase()),
      )
    : posts;

  const [featured1, featured2, ...rest] = filtered;
  const featuredSidebar = allPosts.slice(0, 5);

  return (
    <>
      <Head>
        <title>{`${category.name} — ${site.name}`}</title>
        {category.description && (
          <meta name="description" content={category.description} />
        )}
        <meta property="og:title" content={`${category.name} — ${site.name}`} />
        <meta property="og:type" content="website" />
      </Head>
      <Analytics site={site} />
      <Layout site={site} categories={categories} socialLinks={socialLinks}>
        <section className="blog-hero">
          <div className="container">
            <h1>{category.name}</h1>
            {category.description && <p>{category.description}</p>}
          </div>
        </section>

        <div className="container">
          <div className="blog-layout">
            <main className="blog-main" aria-label="Article list">
              {filtered.length === 0 ? (
                <div className="empty-state">
                  <p>
                    {search
                      ? `No articles found for \u201c${search}\u201d.`
                      : 'No posts in this category yet.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="blog-featured-list">
                    {featured1 && <FeaturedCard post={featured1} />}
                    {featured2 && <FeaturedCard post={featured2} />}
                  </div>
                  {rest.length > 0 && (
                    <div className="blog-cards-list">
                      {rest.map((post) => (
                        <BlogCard key={post.id} post={post} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </main>

            <Sidebar
              categories={categories}
              featuredPosts={featuredSidebar}
              activeCategory={category.slug}
              searchValue={search}
              onSearch={setSearch}
              siteId={site.id}
            />
          </div>
        </div>
      </Layout>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const categories = getCategories();
  return {
    paths: categories.map((cat: Category) => ({
      params: { categorySlug: cat.slug },
    })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<BlogCategoryPageProps> = async ({ params }) => {
  const site = getSiteData();
  const categories = getCategories();
  const socialLinks = getSocialLinks();
  const allPostsRaw = getPosts();
  const palette = getPalette(site.colorPalette);
  const paletteCSS = paletteToCSS(palette);

  const category = categories.find((c: Category) => c.slug === params?.categorySlug);
  if (!category) return { notFound: true };

  const posts = allPostsRaw.filter(
    (p: Post) =>
      p.status === 'published' &&
      p.Categories?.some((c: Category) => c.slug === params?.categorySlug),
  );

  const allPosts = allPostsRaw.filter((p: Post) => p.status === 'published');

  return {
    props: {
      site,
      category,
      posts,
      allPosts,
      categories,
      socialLinks,
      paletteCSS,
      faviconUrl: site.faviconUrl ?? null,
    },
  };
};
