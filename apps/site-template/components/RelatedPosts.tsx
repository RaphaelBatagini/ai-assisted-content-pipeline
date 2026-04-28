import { Post } from '../lib/types';
import BlogCard from './BlogCard';

interface RelatedPostsProps {
  currentPostId: string;
  categorySlug: string | undefined;
  allPosts: Post[];
}

export default function RelatedPosts({ currentPostId, categorySlug, allPosts }: RelatedPostsProps) {
  const related = allPosts
    .filter(
      (p) =>
        p.id !== currentPostId &&
        p.status === 'published' &&
        (categorySlug
          ? p.Categories?.some((c) => c.slug === categorySlug)
          : true),
    )
    .slice(0, 4);

  if (related.length === 0) return null;

  return (
    <section className="related-posts" aria-label="Related articles">
      <h2 className="related-posts-title">Related articles</h2>
      <div className="related-posts-grid">
        {related.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
