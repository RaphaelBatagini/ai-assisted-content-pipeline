import Link from 'next/link';

export default function PostCTA() {
  return (
    <section className="post-cta" aria-label="Call to action">
      <div className="post-cta-inner">
        <h2 className="post-cta-title">Ready to take the next step?</h2>
        <p className="post-cta-text">
          Talk to our specialists and discover how we can help your business grow.
        </p>
        <Link href="/contact/" className="btn-primary">
          Talk to a specialist →
        </Link>
      </div>
    </section>
  );
}
