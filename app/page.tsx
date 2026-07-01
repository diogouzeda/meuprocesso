"use client";

import { useState, type FormEvent } from "react";

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
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">meuprocesso</h1>
        <p className="text-sm text-slate-600">
          Cole o número único do seu processo (formato CNJ) para acompanhar as movimentações
          traduzidas em linguagem simples.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          placeholder="0000832-35.2018.4.01.3202"
          required
          className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-blue-600"
        />
        <button
          type="submit"
          disabled={carregando}
          className="rounded-lg bg-blue-700 px-6 py-3 font-medium text-white transition hover:bg-blue-800 disabled:opacity-50"
        >
          {carregando ? "Buscando…" : "Buscar processo"}
        </button>
      </form>

      {erro && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</p>
      )}

      {resultado?.aviso && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{resultado.aviso}</p>
      )}

      {resultado && resultado.movimentos.length > 0 && (
        <section className="flex flex-col gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {resultado.numero} · {resultado.alias}
            </p>
            <p className="text-lg font-medium">{resultado.classe}</p>
          </div>

          <ol className="flex flex-col gap-3">
            {resultado.movimentos.map((m, i) => (
              <li key={i} className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs text-slate-500">{formatarData(m.data)}</p>
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
  );
}
