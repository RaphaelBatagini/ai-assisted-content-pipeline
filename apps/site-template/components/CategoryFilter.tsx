import Link from 'next/link';
import { Category } from '../lib/types';

interface CategoryFilterProps {
  categories: Category[];
  activeSlug?: string;
}

export default function CategoryFilter({ categories, activeSlug }: CategoryFilterProps) {
  return (
    <nav className="category-filters" aria-label="Filter by category">
      <Link
        href="/blog/"
        className={`category-chip${!activeSlug ? ' category-chip--active' : ''}`}
        aria-current={!activeSlug ? 'page' : undefined}
      >
        All
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/blog/category/${cat.slug}/`}
          className={`category-chip${activeSlug === cat.slug ? ' category-chip--active' : ''}`}
          aria-current={activeSlug === cat.slug ? 'page' : undefined}
        >
          {cat.name}
        </Link>
      ))}
    </nav>
  );
}
