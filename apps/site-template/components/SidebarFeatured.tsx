import Link from 'next/link';
import { Post } from '../lib/types';

export default function SidebarFeatured({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;

  return (
    <ul className="sidebar-featured-list">
      {posts.map((post) => (
        <li key={post.id} className="sidebar-featured-item">
          <Link href={`/blog/${post.slug}/`}>{post.title}</Link>
          {post.readingTimeMinutes && (
            <span className="sidebar-featured-meta">{post.readingTimeMinutes} min</span>
          )}
        </li>
      ))}
    </ul>
  );
}
