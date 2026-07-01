"use client";

import { useState, type FormEvent } from "react";
import { FileText, Lock, Search, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

interface MovimentoTraduzido {
  data: string | null;
  nome: string | null;
  texto_simples?: string;
  acao_necessaria?: boolean;
  nivel_confianca?: string;
  requer_revisao?: boolean;
  erro?: string;
}

interface Resultado {
  numero: string;
  alias: string;
  classe: string | null;
  movimentos: MovimentoTraduzido[];
  aviso?: string;
  erro?: string;
}

const FEATURES = [
  {
    icon: FileText,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    title: "Informações atualizadas",
    description: "Buscamos os dados diretamente nos tribunais.",
  },
  {
    icon: Sparkles,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    title: "Linguagem simples",
    description: "Traduzimos o juridiquês para você entender cada passo.",
  },
  {
    icon: ShieldCheck,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    title: "Privacidade garantida",
    description: "Sua consulta é 100% segura e confidencial.",
  },
];

function formatarData(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function Home() {
  const [numero, setNumero] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setCarregando(true);
    setErro(null);
    setResultado(null);

    try {
      const resp = await fetch("/api/consultar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero }),
      });
      const data: Resultado = await resp.json();
      if (!resp.ok) {
        setErro(data.erro || "Erro ao consultar o processo.");
      } else {
        setResultado(data);
      }
    } catch {
      setErro("Não foi possível consultar o processo. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <SiteHeader />

      <main className="mx-auto flex max-w-3xl flex-col items-center px-6 pb-20 pt-12 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Entenda seu processo
          <br />
          em <span className="text-blue-600">linguagem simples.</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-slate-500">
          Cole o número do seu processo para ver o andamento e entender o que está acontecendo.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-10 flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-200/50 sm:gap-3"
        >
          <Search className="ml-3 hidden shrink-0 text-slate-400 sm:block" size={20} />
          <div className="flex-1 text-left">
            <input
              type="text"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="Cole o número do processo (CNJ)"
              required
              className="w-full bg-transparent px-3 py-2 text-base text-slate-900 outline-none placeholder:text-slate-400 sm:px-0"
            />
            <p className="hidden px-3 text-xs text-slate-400 sm:block sm:px-0">
              Ex.: 0001234-56.2023.8.26.0100
            </p>
          </div>
          <button
            type="submit"
            disabled={carregando}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {carregando ? "Buscando…" : "Buscar"}
            {!carregando && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
          <Lock size={12} />
          Consulta segura e sigilosa. Seus dados não são armazenados.
        </p>

        <div className="mt-16 grid w-full grid-cols-1 gap-8 text-left sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${f.iconBg} ${f.iconColor}`}>
                <f.icon size={18} />
              </span>
              <div>
                <p className="font-semibold text-slate-900">{f.title}</p>
                <p className="mt-1 text-sm text-slate-500">{f.description}</p>
              </div>
            </div>
          ))}
        </div>

        {erro && (
          <p className="mt-10 w-full rounded-lg bg-red-50 px-4 py-3 text-left text-sm text-red-700">
            {erro}
          </p>
        )}

        {resultado?.aviso && (
          <p className="mt-10 w-full rounded-lg bg-amber-50 px-4 py-3 text-left text-sm text-amber-800">
            {resultado.aviso}
          </p>
        )}

        {resultado && resultado.movimentos.length > 0 && (
          <section className="mt-14 w-full text-left">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                {resultado.numero} · {resultado.alias}
              </p>
              <p className="text-lg font-semibold text-slate-900">{resultado.classe}</p>
            </div>

            <ol className="flex flex-col gap-3">
              {resultado.movimentos.map((m, i) => (
                <li key={i} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-400">{formatarData(m.data)}</p>
                  <p className="text-sm font-medium text-slate-700">{m.nome}</p>
                  {m.texto_simples && (
                    <p className="mt-2 text-sm text-slate-800">{m.texto_simples}</p>
                  )}
                  {m.requer_revisao && (
                    <span className="mt-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                      Em revisão pelo escritório
                    </span>
                  )}
                  {m.erro && (
                    <p className="mt-2 text-xs text-red-600">Tradução indisponível: {m.erro}</p>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
