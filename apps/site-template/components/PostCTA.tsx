import Link from 'next/link';
import { trackEvent } from '../lib/analytics';

interface PostCTAProps {
  siteId?: string;
  postId?: string;
}

export default function PostCTA({ siteId, postId }: PostCTAProps) {
  return (
    <section className="post-cta" aria-label="Call to action">
      <div className="post-cta-inner">
        <h2 className="post-cta-title">Ready to take the next step?</h2>
        <p className="post-cta-text">
          Talk to our specialists and discover how we can help your business grow.
        </p>
        <Link
          href="/contact/"
          className="btn-primary"
          onClick={() => trackEvent(siteId || '', 'cta_click', { postId })}
        >
          Talk to a specialist →
        </Link>
      </div>
    </section>
  );
}
