import type { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const { paletteCSS, faviconUrl } = pageProps as { paletteCSS?: string; faviconUrl?: string };

  return (
    <>
      <Head>
        {faviconUrl && <link rel="icon" href={faviconUrl} />}
        {paletteCSS && (
          <style>{`:root { ${paletteCSS} }`}</style>
        )}
      </Head>
      <Component {...pageProps} />
    </>
  );
}
