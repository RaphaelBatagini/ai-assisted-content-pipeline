export default function Footer() {
  return (
    <footer className="bg-foreground/5 border-t border-border py-10 px-6">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">
          © {new Date().getFullYear()} Blogs Tool. Todos os direitos reservados.
        </p>
        <nav className="flex gap-6 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">
            Funcionalidades
          </a>
          <a href="#pricing" className="hover:text-foreground transition-colors">
            Preço
          </a>
          <a href="#faq" className="hover:text-foreground transition-colors">
            FAQ
          </a>
          <a href="#register" className="hover:text-foreground transition-colors">
            Cadastrar
          </a>
        </nav>
      </div>
    </footer>
  );
}
