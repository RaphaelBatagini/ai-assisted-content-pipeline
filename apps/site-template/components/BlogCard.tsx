import Link from 'next/link';
import { Post } from '../lib/types';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function BlogCard({ post }: { post: Post }) {
  const category = post.Categories?.[0];

  return (
    <article className="blog-card">
      {post.coverImageUrl && (
        <img
          className="blog-card-image"
          src={post.coverImageUrl}
          alt={post.title}
          loading="lazy"
        />
      )}
      <div className="blog-card-body">
        {category && (
          <Link href={`/blog/category/${category.slug}/`} className="category-badge">
            {category.name}
          </Link>
        )}
        <h2 className="blog-card-title">
          <Link href={`/blog/${post.slug}/`}>{post.title}</Link>
        </h2>
        {post.excerpt && <p className="blog-card-excerpt">{post.excerpt}</p>}
        <div className="blog-card-meta">
          {post.author && <span>{post.author}</span>}
          {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
          {post.readingTimeMinutes && <span>{post.readingTimeMinutes} min de leitura</span>}
        </div>
        <Link href={`/blog/${post.slug}/`} className="blog-card-cta" aria-label={`Ler artigo: ${post.title}`}>
          Ler mais →
        </Link>
      </div>
    </article>
  );
}
