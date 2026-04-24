import Link from 'next/link';
import { Post } from '../lib/types';

interface PostCardProps {
  post: Post;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <article className="post-card">
      {post.coverImageUrl && (
        <img className="post-card-image" src={post.coverImageUrl} alt={post.title} />
      )}
      <div className="post-card-body">
        {post.Categories && post.Categories.length > 0 && (
          <div className="post-card-categories">
            {post.Categories.map((cat) => (
              <Link key={cat.id} href={`/${cat.slug}/`} className="category-badge">
                {cat.name}
              </Link>
            ))}
          </div>
        )}
        <h2 className="post-card-title">
          <Link href={`/post/${post.slug}/`}>{post.title}</Link>
        </h2>
        {post.excerpt && <p className="post-card-excerpt">{post.excerpt}</p>}
        <div className="post-card-meta">
          {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
          {post.readingTimeMinutes && <span>{post.readingTimeMinutes} min de leitura</span>}
        </div>
      </div>
    </article>
  );
}
