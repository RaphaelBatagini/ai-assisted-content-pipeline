import Link from 'next/link';

export default function CTABanner() {
  return (
    <div className="cta-banner" role="complementary" aria-label="Chamada para ação">
      <p className="cta-banner-title">Quer crescer com conteúdo?</p>
      <p className="cta-banner-text">
        Fale com um especialista e descubra como podemos ajudar o seu negócio.
      </p>
      <Link href="/contato/" className="btn-primary cta-banner-btn">
        Falar com especialista
      </Link>
    </div>
  );
}
