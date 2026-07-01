import { MessageSquareCheck } from "lucide-react";

const NAV_LINKS = [
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Para escritórios", href: "#para-escritorios" },
  { label: "Segurança", href: "#seguranca" },
  { label: "Blog", href: "#blog" },
];

export function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <a href="/" className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
          <MessageSquareCheck size={20} />
        </span>
        <span className="text-lg font-bold text-slate-900">
          meu<span className="text-blue-600">processo</span>
        </span>
      </a>

      <nav className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
        {NAV_LINKS.map((link) => (
          <a key={link.href} href={link.href} className="transition hover:text-slate-900">
            {link.label}
          </a>
        ))}
      </nav>

      <a
        href="#entrar"
        className="rounded-lg border border-blue-600 px-5 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
      >
        Entrar
      </a>
    </header>
  );
}
