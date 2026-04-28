import Link from 'next/link';

export default function CTABanner() {
  return (
    <div className="cta-banner" role="complementary" aria-label="Call to action">
      <p className="cta-banner-title">Want to grow with content?</p>
      <p className="cta-banner-text">
        Talk to a specialist and discover how we can help your business.
      </p>
      <Link href="/contact/" className="btn-primary cta-banner-btn">
        Talk to a specialist
      </Link>
    </div>
  );
}
