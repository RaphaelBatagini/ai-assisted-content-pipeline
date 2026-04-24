import { Globe, FileText, Search, CreditCard, Zap, Layout } from "lucide-react";

const features = [
  {
    icon: <Zap className="w-6 h-6 text-primary" />,
    title: "Sites ultrarrápidos",
    description:
      "Geração estática com Next.js garante performance máxima e pontuação perfeita no PageSpeed.",
  },
  {
    icon: <FileText className="w-6 h-6 text-primary" />,
    title: "Editor rico",
    description:
      "Escreva com um editor moderno que suporta texto formatado, imagens, links e muito mais.",
  },
  {
    icon: <Search className="w-6 h-6 text-primary" />,
    title: "SEO otimizado",
    description:
      "Meta tags, Open Graph, sitemap e robots.txt configurados automaticamente para cada post.",
  },
  {
    icon: <Globe className="w-6 h-6 text-primary" />,
    title: "Domínio personalizado",
    description:
      "Conecte seu domínio em minutos com suporte a HTTPS e CDN global incluídos.",
  },
  {
    icon: <CreditCard className="w-6 h-6 text-primary" />,
    title: "Gestão de pagamentos",
    description:
      "Integração nativa com Stripe para receber assinaturas e cobranças recorrentes.",
  },
  {
    icon: <Layout className="w-6 h-6 text-primary" />,
    title: "Painel completo",
    description:
      "Gerencie posts, categorias, contatos e links sociais num backoffice intuitivo.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 px-6 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Tudo o que você precisa para crescer
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Uma plataforma completa pensada para criadores de conteúdo que
            querem profissionalismo sem complicação.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-card rounded-2xl p-6 border border-border hover:shadow-md transition-shadow"
            >
              <div className="mb-4 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                {f.icon}
              </div>
              <h3 className="font-semibold text-foreground text-lg mb-2">
                {f.title}
              </h3>
              <p className="text-muted-foreground text-sm">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
