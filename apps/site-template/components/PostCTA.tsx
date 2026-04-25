import Link from 'next/link';

export default function PostCTA() {
  return (
    <section className="post-cta" aria-label="Chamada para ação">
      <div className="post-cta-inner">
        <h2 className="post-cta-title">Pronto para dar o próximo passo?</h2>
        <p className="post-cta-text">
          Converse com nossos especialistas e descubra como podemos ajudar o seu negócio a crescer.
        </p>
        <Link href="/contato/" className="btn-primary">
          Falar com um especialista →
        </Link>
      </div>
    </section>
  );
}
