import Head from 'next/head';
import { GetStaticProps } from 'next';
import { useState } from 'react';
import Layout from '../../components/Layout';
import Analytics from '../../components/Analytics';
import FeaturedCard from '../../components/FeaturedCard';
import BlogCard from '../../components/BlogCard';
import Sidebar from '../../components/Sidebar';
import { getSiteData, getPosts, getCategories, getSocialLinks } from '../../lib/data';
import { getPalette, paletteToCSS } from '../../lib/palettes';
import { SiteData, Post, Category, SocialLink } from '../../lib/types';

interface BlogIndexProps {
  site: SiteData;
  posts: Post[];
  categories: Category[];
  socialLinks: SocialLink[];
  paletteCSS: string;
  faviconUrl: string | null;
}

export default function BlogIndex({ site, posts, categories, socialLinks }: BlogIndexProps) {
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? posts.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.excerpt?.toLowerCase().includes(search.toLowerCase()),
      )
    : posts;

  const [featured1, featured2, ...rest] = filtered;
  const featuredSidebar = posts.slice(0, 5);

  return (
    <>
      <Head>
        <title>{`Blog — ${site.name}`}</title>
        <meta name="description" content={`Confira os artigos do blog de ${site.name}.`} />
        <meta property="og:title" content={`Blog — ${site.name}`} />
        <meta property="og:type" content="website" />
      </Head>
      <Analytics site={site} />
      <Layout site={site} categories={categories} socialLinks={socialLinks}>
        <section className="blog-hero">
          <div className="container">
            <h1>Blog</h1>
            <p>Conteúdo prático para ajudar o seu negócio a crescer.</p>
          </div>
        </section>

        <div className="container">
          <div className="blog-layout">
            <main className="blog-main" aria-label="Lista de artigos">
              {filtered.length === 0 ? (
                <div className="empty-state">
                  <p>Nenhum artigo encontrado para &ldquo;{search}&rdquo;.</p>
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
              searchValue={search}
              onSearch={setSearch}
            />
          </div>
        </div>
      </Layout>
    </>
  );
}

export const getStaticProps: GetStaticProps<BlogIndexProps> = async () => {
  const site = getSiteData();
  const allPosts = getPosts();
  const categories = getCategories();
  const socialLinks = getSocialLinks();
  const palette = getPalette(site.colorPalette);
  const paletteCSS = paletteToCSS(palette);

  const posts = allPosts.filter((p: Post) => p.status === 'published');

  return {
    props: {
      site,
      posts,
      categories,
      socialLinks,
      paletteCSS,
      faviconUrl: site.faviconUrl ?? null,
    },
  };
};
