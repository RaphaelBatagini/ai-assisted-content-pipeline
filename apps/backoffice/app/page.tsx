import type { Metadata } from "next";
import Link from "next/link";
import {
  Zap,
  Globe,
  BarChart3,
  Users,
  RefreshCw,
  Tag,
  TrendingUp,
  Clock,
  CheckCircle2,
  ChevronRight,
  Search,
  FileText,
  Settings,
  Activity,
  Lightbulb,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Plataforma de IA para Agências | Crie Sites e Conteúdo Automático",
  description:
    "Automatize sites, blogs e SEO para seus clientes. Plataforma white-label para agências escalarem com receita recorrente.",
  keywords: [
    "automação de marketing para agências",
    "geração de conteúdo com IA",
    "SaaS para agências",
    "white label marketing digital",
    "criação de sites com IA",
    "SEO automatizado",
    "blog automático",
    "conteúdo para clientes automático",
    "ferramenta para agência escalar",
    "renda recorrente agência",
  ],
};

export default function RootPage() {
  return (
    <div className="h-screen overflow-y-auto bg-background text-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg">AgênciaIA</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
            >
              Começar gratuitamente
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-background py-20 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-purple/30 bg-brand-purple/10 px-3 py-1 text-xs font-medium text-brand-purple mb-6">
            <Zap className="h-3 w-3" />
            Automação de marketing para agências com IA
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl mb-6">
            Crie sites e conteúdo com IA —{" "}
            <span className="text-primary">
              e transforme isso em receita recorrente
            </span>{" "}
            para sua agência
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Automatize a criação de blogs, posts e estratégias de SEO para seus
            clientes — enquanto escala seu faturamento com um modelo SaaS
            white-label.
          </p>
          <ul className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 text-sm text-muted-foreground mb-10">
            {[
              "Gere sites completos em minutos",
              "Produza conteúdo otimizado para SEO automaticamente",
              "Gerencie múltiplos clientes em um só lugar",
              "Revenda com sua própria marca",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-base font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              Começar agora gratuitamente
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="#como-funciona"
              className="inline-flex items-center justify-center rounded-md border px-8 py-3 text-base font-semibold hover:bg-muted transition-colors"
            >
              Ver demonstração
            </Link>
          </div>
        </div>
      </section>

      {/* Problema */}
      <section className="bg-muted/40 py-20 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-4">
            Agências perdem tempo e dinheiro com tarefas que não escalam
          </h2>
          <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
            Enquanto isso, clientes querem resultados constantes — sem pagar
            mais por isso.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {[
              "Criação manual de conteúdo consome horas por semana",
              "Blogs inconsistentes que não geram tráfego",
              "Dificuldade em provar ROI para clientes",
              "Baixa previsibilidade de receita mensal",
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-lg border bg-background p-4"
              >
                <span className="mt-0.5 h-5 w-5 rounded-full bg-destructive/10 text-destructive flex items-center justify-center text-xs font-bold shrink-0">
                  ✕
                </span>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solução */}
      <section className="bg-background py-20 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-4">
            Uma plataforma que transforma conteúdo em{" "}
            <span className="text-primary">crescimento previsível</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Nossa plataforma usa IA para automatizar toda a operação de conteúdo
            da sua agência — da criação à otimização contínua.
          </p>
          <p className="text-muted-foreground text-lg mt-2">
            Você entrega mais valor, com menos esforço.
          </p>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="bg-muted/40 py-20 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-3">
            SEO automatizado em 5 passos simples
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Da criação do site à otimização contínua — tudo sem precisar de
            conhecimento técnico.
          </p>
          <div className="relative">
            <div className="absolute left-5 top-6 bottom-6 w-px bg-border hidden sm:block" />
            <ol className="space-y-6">
              {[
                {
                  icon: Globe,
                  title: "Crie o site do cliente em minutos",
                  desc: "A IA gera estrutura, layout e conteúdo base a partir do briefing do seu cliente.",
                },
                {
                  icon: Settings,
                  title: "Defina o tom de voz",
                  desc: "Baseado em conteúdo existente ou briefing — o conteúdo sempre soa como a marca do cliente.",
                },
                {
                  icon: FileText,
                  title: "Automatize o conteúdo",
                  desc: "Posts são gerados e publicados automaticamente, seguindo um calendário editorial inteligente.",
                },
                {
                  icon: Activity,
                  title: "Acompanhe a performance",
                  desc: "Dados de SEO e conversão em tempo real, organizados por cliente, em um único painel.",
                },
                {
                  icon: Lightbulb,
                  title: "Otimize com IA",
                  desc: "Sugestões automáticas para melhorar ranqueamento, engajamento e taxa de conversão.",
                },
              ].map((step, i) => (
                <li
                  key={step.title}
                  className="relative flex items-start gap-5 sm:pl-14"
                >
                  <div className="absolute left-0 hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white sm:flex">
                    {i + 1}
                  </div>
                  <div className="flex-1 rounded-lg border bg-background p-5">
                    <div className="mb-1 flex items-center gap-3">
                      <step.icon className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">{step.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="bg-background py-20 px-4">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-3">
            Feito para agências que querem escalar
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Todas as ferramentas que sua agência precisa para crescer sem
            aumentar a equipe.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Users,
                title: "Escala sem aumentar equipe",
                desc: "Atenda mais clientes sem crescer sua operação. Automatize o trabalho repetitivo.",
              },
              {
                icon: TrendingUp,
                title: "Receita recorrente previsível",
                desc: "Transforme serviços pontuais em assinaturas mensais com previsibilidade de caixa.",
              },
              {
                icon: Tag,
                title: "White-label completo",
                desc: "Venda como se fosse seu próprio produto — sua marca, seus preços, seus clientes.",
              },
              {
                icon: Search,
                title: "SEO de verdade",
                desc: "Conteúdo estruturado e otimizado para ranquear no Google desde o primeiro post.",
              },
              {
                icon: Clock,
                title: "Menos operação, mais estratégia",
                desc: "Automatize o operacional e libere sua equipe para trabalho de alto valor.",
              },
              {
                icon: BarChart3,
                title: "Dados em tempo real",
                desc: "Acompanhe performance de todos os clientes em um painel unificado e intuitivo.",
              },
            ].map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-lg border bg-background p-6 transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                  <benefit.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-1 font-semibold">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* White-label */}
      <section className="bg-foreground py-20 px-4 text-background">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-purple/50 bg-brand-purple/20 px-3 py-1 text-xs font-medium text-white">
            <Tag className="h-3 w-3" />
            White-label marketing digital
          </div>
          <h2 className="mb-4 text-3xl font-bold">
            Seu próprio SaaS, sem precisar desenvolver nada
          </h2>
          <p className="mb-8 text-lg text-background/80">
            Ofereça a plataforma com a sua marca, seus preços e para seus
            clientes. Transforme sua agência em uma empresa de tecnologia — sem
            investir em desenvolvimento.
          </p>
          <div className="mb-10 grid sm:grid-cols-3 gap-4">
            {[
              { label: "Sua marca", desc: "Logo, cores e domínio próprio" },
              { label: "Seus preços", desc: "Defina margens como quiser" },
              { label: "Seus clientes", desc: "Relacionamento 100% seu" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-background/20 bg-background/10 p-4"
              >
                <div className="mb-1 font-semibold">{item.label}</div>
                <div className="text-sm text-background/70">{item.desc}</div>
              </div>
            ))}
          </div>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-md bg-background px-8 py-3 text-base font-semibold text-foreground hover:bg-background/90 transition-colors"
          >
            Quero meu próprio SaaS
            <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Prova Social */}
      <section className="bg-muted/40 py-20 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-3">
            Resultados que falam por si
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Agências que automatizaram sua operação de conteúdo com IA.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                metric: "+300%",
                label: "Aumento de tráfego orgânico",
                sub: "em 6 meses de uso",
              },
              {
                metric: "-70%",
                label: "Tempo gasto com conteúdo",
                sub: "liberado para estratégia",
              },
              {
                metric: "+2x",
                label: "Retenção de clientes",
                sub: "com entregas consistentes",
              },
            ].map((stat) => (
              <div
                key={stat.metric}
                className="rounded-lg border bg-background p-8 text-center"
              >
                <div className="mb-2 text-5xl font-extrabold text-primary">
                  {stat.metric}
                </div>
                <div className="mb-1 font-semibold">{stat.label}</div>
                <div className="text-sm text-muted-foreground">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos / Monetização */}
      <section className="bg-background py-20 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-3">
            Monetize como quiser
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Você tem total flexibilidade para usar, cobrar ou revender a
            plataforma do jeito que faz mais sentido para seu negócio.
          </p>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                title: "Uso interno",
                desc: "Use para todos os seus clientes e reduza o custo e tempo da operação de conteúdo.",
                cta: "Começar agora",
                highlight: false,
              },
              {
                title: "Cobrar mensalidade",
                desc: "Adicione a plataforma ao seu pacote de serviços e gere receita recorrente previsível.",
                cta: "Quero recorrência",
                highlight: true,
              },
              {
                title: "Vender como SaaS",
                desc: "Lance seu próprio produto de SaaS white-label e crie uma nova linha de negócios.",
                cta: "Criar meu SaaS",
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.title}
                className={`flex flex-col rounded-lg border p-6 ${
                  plan.highlight ? "border-brand-purple/30 bg-brand-purple/5" : "bg-background"
                }`}
              >
                {plan.highlight && (
                  <span className="mb-3 inline-flex w-fit items-center rounded-full bg-brand-purple px-2.5 py-0.5 text-xs font-semibold text-white">
                    Mais popular
                  </span>
                )}
                <h3 className="mb-2 text-lg font-bold">{plan.title}</h3>
                <p className="mb-4 flex-1 text-sm text-muted-foreground">
                  {plan.desc}
                </p>
                <Link
                  href="/register"
                  className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                    plan.highlight
                      ? "bg-brand-purple text-white hover:bg-brand-purple/90"
                      : "border hover:bg-muted"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/40 py-20 px-4">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-3">
            Perguntas frequentes sobre a ferramenta para agência escalar
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Tire suas dúvidas antes de começar.
          </p>
          <div className="space-y-3">
            {[
              {
                q: "Isso substitui redatores?",
                a: "Não necessariamente. A plataforma automatiza a geração de rascunhos e posts otimizados para SEO, mas sua equipe pode revisar e ajustar cada peça. Você decide o nível de automação — de 100% automático a assistido por humanos.",
              },
              {
                q: "Funciona para qualquer nicho?",
                a: "Sim. A IA adapta o conteúdo ao segmento do cliente — saúde, tecnologia, varejo, serviços, educação e muito mais. Você configura o tom de voz e a plataforma aprende o estilo de cada cliente.",
              },
              {
                q: "Posso usar com meus clientes atuais?",
                a: "Com certeza. Você pode migrar clientes existentes para a plataforma, criar sites e começar a gerar conteúdo de forma automática. Não há necessidade de mudar sua metodologia atual.",
              },
              {
                q: "Preciso saber SEO para usar?",
                a: "Não. A plataforma cuida de toda a parte técnica de SEO automaticamente — estrutura de URLs, meta tags, densidade de palavras-chave e links internos. Você recebe o conteúdo pronto para ranquear.",
              },
              {
                q: "Como funciona o white-label?",
                a: "Você personaliza a plataforma com sua marca: logo, cores, domínio e e-mails. Seus clientes acessam uma solução com a identidade da sua agência. Você define os preços e mantém 100% do relacionamento com o cliente.",
              },
            ].map((faq) => (
              <details
                key={faq.q}
                className="group rounded-lg border bg-background"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between p-5 font-medium">
                  {faq.q}
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <div className="border-t px-5 pb-5 pt-4 text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-primary py-24 px-4 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-4xl font-extrabold">
            Comece a escalar sua agência hoje
          </h2>
          <p className="mb-10 text-xl text-white/80">
            Sem complexidade. Sem equipe extra. Só crescimento.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-md bg-white px-10 py-4 text-base font-bold text-primary hover:bg-white/90 transition-colors"
          >
            Começar agora
            <ChevronRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background py-10 px-4">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
              <Zap className="h-3 w-3 text-white" />
            </div>
            <span className="font-medium text-foreground">AgênciaIA</span>
          </div>
          <p>© {new Date().getFullYear()} AgênciaIA. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="hover:text-foreground transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="hover:text-foreground transition-colors"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

