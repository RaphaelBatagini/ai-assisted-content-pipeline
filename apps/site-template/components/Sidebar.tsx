import { Category, Post } from '../lib/types';
import SearchInput from './SearchInput';
import CategoryFilter from './CategoryFilter';
import SidebarFeatured from './SidebarFeatured';
import CTABanner from './CTABanner';

interface SidebarProps {
  categories: Category[];
  featuredPosts: Post[];
  activeCategory?: string;
  searchValue: string;
  onSearch: (value: string) => void;
}

export default function Sidebar({
  categories,
  featuredPosts,
  activeCategory,
  searchValue,
  onSearch,
}: SidebarProps) {
  return (
    <aside className="blog-sidebar" aria-label="Barra lateral">
      <div className="sidebar-widget">
        <h3 className="sidebar-widget-title">Buscar</h3>
        <SearchInput value={searchValue} onChange={onSearch} />
      </div>

      <div className="sidebar-widget">
        <h3 className="sidebar-widget-title">Categorias</h3>
        <CategoryFilter categories={categories} activeSlug={activeCategory} />
      </div>

      {featuredPosts.length > 0 && (
        <div className="sidebar-widget">
          <h3 className="sidebar-widget-title">Artigos em destaque</h3>
          <SidebarFeatured posts={featuredPosts} />
        </div>
      )}

      <CTABanner />
    </aside>
  );
}
