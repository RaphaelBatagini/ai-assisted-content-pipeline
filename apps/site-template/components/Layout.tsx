import Link from 'next/link';
import { SiteData, Category, SocialLink } from '../lib/types';

interface LayoutProps {
  children: React.ReactNode;
  site: SiteData;
  categories: Category[];
  socialLinks: SocialLink[];
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  twitter: 'Twitter / X',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  pinterest: 'Pinterest',
  other: 'Link',
};

export default function Layout({ children, site, categories, socialLinks }: LayoutProps) {
  return (
    <>
      <header className="site-header">
        <div className="container">
          <Link href="/" className="site-logo">
            {site.logoUrl ? (
              <img src={site.logoUrl} alt={site.name} style={{ height: '40px', objectFit: 'contain' }} />
            ) : (
              site.name
            )}
          </Link>
          <nav className="site-nav">
            <Link href="/">Home</Link>
            {categories.map((cat) => (
              <Link key={cat.id} href={`/${cat.slug}/`}>
                {cat.name}
              </Link>
            ))}
            <Link href="/contato/">Contato</Link>
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="site-footer">
        <div className="container">
          {socialLinks.length > 0 && (
            <div className="social-links">
              {socialLinks.map((link) => (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer">
                  {PLATFORM_LABELS[link.platform] ?? link.platform}
                </a>
              ))}
            </div>
          )}
          {site.address && <p style={{ marginBottom: '0.5rem' }}>{site.address}</p>}
          <p>
            &copy; {new Date().getFullYear()} {site.name}. Todos os direitos reservados.
          </p>
          {site.contactEmail && (
            <p style={{ marginTop: '0.4rem' }}>
              <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
            </p>
          )}
        </div>
      </footer>
    </>
  );
}
