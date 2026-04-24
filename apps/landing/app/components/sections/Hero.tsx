export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background py-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <span className="inline-block bg-primary/10 text-primary text-sm font-semibold px-4 py-1 rounded-full mb-6">
          Plataforma de Blogs Profissional
        </span>
        <h1 className="text-5xl md:text-6xl font-extrabold text-foreground leading-tight mb-6">
          Crie seu blog e comece a{" "}
          <span className="text-primary">monetizar</span> seu conteúdo
        </h1>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Sites estáticos ultra-rápidos, editor rico, SEO otimizado, domínio
          personalizado e gestão de pagamentos. Tudo em um único lugar.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#register"
            className="inline-flex items-center justify-center bg-primary text-primary-foreground font-semibold px-8 py-4 rounded-xl text-lg hover:bg-accent transition-colors"
          >
            Comece agora
          </a>
          <a
            href="#pricing"
            className="inline-flex items-center justify-center border border-border text-foreground font-semibold px-8 py-4 rounded-xl text-lg hover:bg-muted transition-colors"
          >
            Ver plano
          </a>
        </div>
      </div>
    </section>
  );
}
