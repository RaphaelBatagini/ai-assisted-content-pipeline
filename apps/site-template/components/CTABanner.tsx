import Link from 'next/link';
import { trackEvent } from '../lib/analytics';

interface CTABannerProps {
  siteId?: string;
  postId?: string;
}

export default function CTABanner({ siteId, postId }: CTABannerProps) {
  return (
    <div className="cta-banner" role="complementary" aria-label="Call to action">
      <p className="cta-banner-title">Want to grow with content?</p>
      <p className="cta-banner-text">
        Talk to a specialist and discover how we can help your business.
      </p>
      <Link
        href="/contact/"
        className="btn-primary cta-banner-btn"
        onClick={() => trackEvent(siteId || '', 'cta_click', { postId })}
      >
        Talk to a specialist
      </Link>
    </div>
  );
}
