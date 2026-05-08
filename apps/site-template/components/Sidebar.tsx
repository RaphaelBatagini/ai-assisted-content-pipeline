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
  siteId?: string;
}

export default function Sidebar({
  categories,
  featuredPosts,
  activeCategory,
  searchValue,
  onSearch,
  siteId,
}: SidebarProps) {
  return (
    <aside className="blog-sidebar" aria-label="Sidebar">
      <div className="sidebar-widget">
        <h3 className="sidebar-widget-title">Search</h3>
        <SearchInput value={searchValue} onChange={onSearch} />
      </div>

      <div className="sidebar-widget">
        <h3 className="sidebar-widget-title">Categories</h3>
        <CategoryFilter categories={categories} activeSlug={activeCategory} />
      </div>

      {featuredPosts.length > 0 && (
        <div className="sidebar-widget">
          <h3 className="sidebar-widget-title">Featured articles</h3>
          <SidebarFeatured posts={featuredPosts} />
        </div>
      )}

      <CTABanner siteId={siteId} />
    </aside>
  );
}
