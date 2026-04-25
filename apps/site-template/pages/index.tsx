import Head from 'next/head';
import Link from 'next/link';
import { GetStaticProps } from 'next';
import Layout from '../components/Layout';
import Analytics from '../components/Analytics';
import BlogCard from '../components/BlogCard';
import { getSiteData, getPosts, getCategories, getSocialLinks } from '../lib/data';
import { getPalette, paletteToCSS } from '../lib/palettes';
import { SiteData, Post, Category, SocialLink } from '../lib/types';

interface HomeProps {
  site: SiteData;
  recentPosts: Post[];
  categories: Category[];
  socialLinks: SocialLink[];
  paletteCSS: string;
  faviconUrl: string | null;
}

export default function Home({ site, recentPosts, categories, socialLinks }: HomeProps) {
  return (
    <>
      <Head>
        <title>{site.name}</title>
        <meta name="description" content={`${site.name} — conteúdo prático para o seu negócio crescer.`} />
        <meta property="og:title" content={site.name} />
        <meta property="og:type" content="website" />
      </Head>
      <Analytics site={site} />
      <Layout site={site} categories={categories} socialLinks={socialLinks}>

        {/* Hero */}
        <section className="home-hero">
          <div className="container">
            <div className="home-hero-content">
              <h1 className="home-hero-title">{site.name}</h1>
              <p className="home-hero-subtitle">
                Conteúdo prático e direto ao ponto para ajudar o seu negócio a crescer.
                Estratégias, dicas e análises para empreendedores.
              </p>
              <div className="home-hero-actions">
                <Link href="/blog/" className="btn-primary">
                  Ver todos os artigos
                </Link>
                <Link href="/contato/" className="btn-secondary">
                  Falar com especialista
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Recent posts */}
        {recentPosts.length > 0 && (
          <section className="home-section">
            <div className="container">
              <div className="home-section-header">
                <h2 className="home-section-title">Últimos artigos</h2>
                <Link href="/blog/" className="home-section-link">
                  Ver todos →
                </Link>
              </div>
              <div className="home-posts-grid">
                {recentPosts.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA strip */}
        <section className="home-cta-strip">
          <div className="container">
            <div className="home-cta-strip-inner">
              <div>
                <h2 className="home-cta-strip-title">Pronto para dar o próximo passo?</h2>
                <p className="home-cta-strip-text">
                  Converse com nossos especialistas e descubra como podemos transformar o seu negócio.
                </p>
              </div>
              <Link href="/contato/" className="btn-primary home-cta-strip-btn">
                Entrar em contato
              </Link>
            </div>
          </div>
        </section>

      </Layout>
    </>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const site = getSiteData();
  const allPosts = getPosts();
  const categories = getCategories();
  const socialLinks = getSocialLinks();
  const palette = getPalette(site.colorPalette);
  const paletteCSS = paletteToCSS(palette);

  const recentPosts = allPosts
    .filter((p: Post) => p.status === 'published')
    .slice(0, 3);

  return {
    props: {
      site,
      recentPosts,
      categories,
      socialLinks,
      paletteCSS,
      faviconUrl: site.faviconUrl ?? null,
    },
  };
};
