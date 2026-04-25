import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetStaticPaths, GetStaticProps } from 'next';
import { getSiteData, getPosts } from '../../lib/data';
import { getPalette, paletteToCSS } from '../../lib/palettes';
import { Post } from '../../lib/types';

interface RedirectProps {
  slug: string;
  paletteCSS: string;
  faviconUrl: string | null;
}

export default function PostRedirect({ slug }: RedirectProps) {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/blog/${slug}/`);
  }, [router, slug]);
  return null;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = getPosts();
  const published = posts.filter((p: Post) => p.status === 'published');
  return {
    paths: published.map((p: Post) => ({ params: { postSlug: p.slug } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<RedirectProps> = async ({ params }) => {
  const site = getSiteData();
  const palette = getPalette(site.colorPalette);
  const paletteCSS = paletteToCSS(palette);
  return {
    props: {
      slug: params?.postSlug as string,
      paletteCSS,
      faviconUrl: site.faviconUrl ?? null,
    },
  };
};
