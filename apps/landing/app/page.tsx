import type { Metadata } from "next";
import Hero from "./components/sections/Hero";
import Features from "./components/sections/Features";
import Pricing from "./components/sections/Pricing";
import FAQ from "./components/sections/FAQ";
import RegisterForm from "./components/RegisterForm";
import Footer from "./components/sections/Footer";

export const metadata: Metadata = {
  title: "Blogs Tool — Crie seu blog profissional",
  description:
    "Plataforma completa para criadores de conteúdo: sites estáticos ultra-rápidos, editor rico, SEO otimizado, domínio personalizado e gestão de pagamentos.",
  openGraph: {
    title: "Blogs Tool — Crie seu blog profissional",
    description:
      "Sites estáticos ultra-rápidos, editor rico, SEO otimizado, domínio personalizado e pagamentos integrados.",
    type: "website",
  },
};

export default function Home() {
  return (
    <main>
      <Hero />
      <Features />
      <Pricing />
      <FAQ />
      <RegisterForm />
      <Footer />
    </main>
  );
}
