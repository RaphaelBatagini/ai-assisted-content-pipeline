import Head from 'next/head';
import { GetStaticProps } from 'next';
import Layout from '../components/Layout';
import PostCard from '../components/PostCard';
import Analytics from '../components/Analytics';
import { getSiteData, getPosts, getCategories, getSocialLinks } from '../lib/data';
import { getPalette, paletteToCSS } from '../lib/palettes';
import { SiteData, Post, Category, SocialLink } from '../lib/types';

interface HomeProps {
  site: SiteData;
  posts: Post[];
  categories: Category[];
  socialLinks: SocialLink[];
  paletteCSS: string;
  faviconUrl: string | null;
}

export default function Home({ site, posts, categories, socialLinks }: HomeProps) {
  return (
    <>
      <Head>
        <title>{site.name}</title>
        <meta name="description" content={`Blog ${site.name}`} />
        <meta property="og:title" content={site.name} />
        <meta property="og:type" content="website" />
      </Head>
      <Analytics site={site} />
      <Layout site={site} categories={categories} socialLinks={socialLinks}>
        <div className="container">
          <div className="page-hero">
            <h1>{site.name}</h1>
          </div>
          {posts.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum post publicado ainda. Volte em breve!</p>
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

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const site = getSiteData();
  const allPosts = getPosts();
  const categories = getCategories();
  const socialLinks = getSocialLinks();

  const posts = allPosts.filter((p: Post) => p.status === 'published');
  const palette = getPalette(site.colorPalette);
  const paletteCSS = paletteToCSS(palette);

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
