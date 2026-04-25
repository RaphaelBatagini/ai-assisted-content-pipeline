import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetStaticPaths, GetStaticProps } from 'next';
import { getSiteData, getCategories } from '../../lib/data';
import { getPalette, paletteToCSS } from '../../lib/palettes';
import { Category } from '../../lib/types';

interface RedirectProps {
  slug: string;
  paletteCSS: string;
  faviconUrl: string | null;
}

export default function CategoryRedirect({ slug }: RedirectProps) {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/blog/category/${slug}/`);
  }, [router, slug]);
  return null;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const categories = getCategories();
  return {
    paths: categories.map((cat: Category) => ({ params: { categorySlug: cat.slug } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<RedirectProps> = async ({ params }) => {
  const site = getSiteData();
  const palette = getPalette(site.colorPalette);
  const paletteCSS = paletteToCSS(palette);
  return {
    props: {
      slug: params?.categorySlug as string,
      paletteCSS,
      faviconUrl: site.faviconUrl ?? null,
    },
  };
};
