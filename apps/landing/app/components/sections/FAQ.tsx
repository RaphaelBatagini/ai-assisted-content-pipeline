"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { clsx } from "clsx";

const faqs = [
  {
    question: "Preciso saber programar para usar a plataforma?",
    answer:
      "Não. A plataforma foi criada para criadores de conteúdo sem conhecimento técnico. Tudo é gerenciado pelo painel web.",
  },
  {
    question: "Posso cancelar a assinatura a qualquer momento?",
    answer:
      "Sim. Você pode cancelar quando quiser pelo painel do Stripe. O acesso é mantido até o fim do período pago.",
  },
  {
    question: "Como funciona o domínio personalizado?",
    answer:
      "Você aponta o seu domínio para nossos servidores via DNS. A configuração de HTTPS é feita automaticamente.",
  },
  {
    question: "Onde ficam hospedadas as imagens?",
    answer:
      "As imagens são enviadas para o Amazon S3 e servidas por CDN, garantindo alta disponibilidade e velocidade.",
  },
  {
    question: "O pagamento é seguro?",
    answer:
      "Sim. Todo o processamento de pagamentos é feito pelo Stripe, uma das plataformas mais seguras do mundo.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 px-6 bg-muted/30">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Perguntas frequentes
          </h2>
          <p className="text-muted-foreground text-lg">
            Não encontrou sua dúvida? Entre em contato pelo formulário abaixo.
          </p>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-2xl overflow-hidden"
            >
              <button
                className="w-full flex items-center justify-between px-6 py-5 text-left font-semibold text-foreground hover:bg-muted/40 transition-colors"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={clsx(
                    "w-5 h-5 text-muted-foreground shrink-0 transition-transform",
                    open === i && "rotate-180"
                  )}
                />
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-muted-foreground text-sm leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
