import { Check } from "lucide-react";

const planFeatures = [
  "1 site personalizado",
  "Posts e categorias ilimitados",
  "Editor rico com upload de imagens",
  "SEO automático em todos os posts",
  "Domínio personalizado com HTTPS",
  "Links sociais e formulário de contato",
  "Painel de gerenciamento completo",
  "Suporte por e-mail",
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6 bg-background">
      <div className="max-w-lg mx-auto text-center">
        <h2 className="text-4xl font-bold text-foreground mb-4">
          Plano simples e sem surpresas
        </h2>
        <p className="text-muted-foreground text-lg mb-12">
          Um plano que inclui tudo que você precisa para publicar e crescer.
        </p>
        <div className="bg-card border border-primary/30 rounded-3xl p-10 shadow-lg relative">
          <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
            MVP
          </span>
          <div className="mb-6">
            <span className="text-5xl font-extrabold text-foreground">R$ 29</span>
            <span className="text-muted-foreground">/mês</span>
          </div>
          <ul className="space-y-3 text-left mb-10">
            {planFeatures.map((feat) => (
              <li key={feat} className="flex items-center gap-3 text-foreground">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
          <a
            href="#register"
            className="block w-full bg-primary text-primary-foreground font-semibold py-4 rounded-xl text-lg hover:bg-accent transition-colors text-center"
          >
            Assinar agora
          </a>
        </div>
      </div>
    </section>
  );
}
