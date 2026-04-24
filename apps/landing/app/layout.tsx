import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Blogs Tool — Crie seu blog profissional",
  description: "Plataforma completa para criadores de conteúdo: sites estáticos ultra-rápidos, editor rico, SEO otimizado, domínio personalizado e gestão de pagamentos.",
  openGraph: {
    title: "Blogs Tool — Crie seu blog profissional",
    description: "Sites estáticos ultra-rápidos, editor rico, SEO otimizado, domínio personalizado e pagamentos integrados.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
