import Head from 'next/head';
import { GetStaticProps } from 'next';
import { useState, FormEvent } from 'react';
import Layout from '../../components/Layout';
import Analytics from '../../components/Analytics';
import { getSiteData, getCategories, getSocialLinks } from '../../lib/data';
import { getPalette, paletteToCSS } from '../../lib/palettes';
import { SiteData, Category, SocialLink } from '../../lib/types';

interface ContactPageProps {
  site: SiteData;
  categories: Category[];
  socialLinks: SocialLink[];
  paletteCSS: string;
  faviconUrl: string | null;
  apiUrl: string;
  siteId: string;
}

export default function ContactPage({ site, categories, socialLinks, apiUrl, siteId }: ContactPageProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
      siteId,
    };
    try {
      const res = await fetch(`${apiUrl}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Erro ao enviar mensagem.');
      setStatus('success');
      form.reset();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro inesperado.');
      setStatus('error');
    }
  }

  return (
    <>
      <Head>
        <title>{`Contato — ${site.name}`}</title>
        <meta name="description" content={`Entre em contato com ${site.name}`} />
      </Head>
      <Analytics site={site} />
      <Layout site={site} categories={categories} socialLinks={socialLinks}>
        <div className="contact-page">
          <div className="page-hero">
            <h1>Contato</h1>
            <p>Preencha o formulário abaixo e entraremos em contato em breve.</p>
          </div>

          {status === 'success' && (
            <div className="alert-success">
              Mensagem enviada com sucesso! Entraremos em contato em breve.
            </div>
          )}

          {status === 'error' && (
            <div className="alert-error">{errorMsg}</div>
          )}

          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Nome</label>
              <input id="name" name="name" type="text" required placeholder="Seu nome" />
            </div>
            <div className="form-group">
              <label htmlFor="email">E-mail</label>
              <input id="email" name="email" type="email" required placeholder="seu@email.com" />
            </div>
            <div className="form-group">
              <label htmlFor="message">Mensagem</label>
              <textarea id="message" name="message" required placeholder="Sua mensagem..." />
            </div>
            <button type="submit" className="btn-primary" disabled={status === 'loading'}>
              {status === 'loading' ? 'Enviando...' : 'Enviar mensagem'}
            </button>
          </form>

          {(site.whatsapp || site.address) && (
            <div style={{ marginTop: '2rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              {site.whatsapp && (
                <p>
                  WhatsApp:{' '}
                  <a href={`https://wa.me/${site.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                    {site.whatsapp}
                  </a>
                </p>
              )}
              {site.address && <p style={{ marginTop: '0.5rem' }}>{site.address}</p>}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}

export const getStaticProps: GetStaticProps<ContactPageProps> = async () => {
  const site = getSiteData();
  const categories = getCategories();
  const socialLinks = getSocialLinks();
  const palette = getPalette(site.colorPalette);
  const paletteCSS = paletteToCSS(palette);

  return {
    props: {
      site,
      categories,
      socialLinks,
      paletteCSS,
      faviconUrl: site.faviconUrl ?? null,
      apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      siteId: site.id,
    },
  };
};
