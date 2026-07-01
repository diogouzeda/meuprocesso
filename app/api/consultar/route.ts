import { NextRequest, NextResponse } from "next/server";
import { cnjParaAlias } from "@/lib/cnj-alias";
import { buscarProcesso, extrairMovimentos, DataJudError } from "@/lib/datajud-client";
import { traduzirMovimento } from "@/lib/translator";

export const runtime = "nodejs";

interface MovimentoTraduzido {
  data: string | null;
  nome: string | null;
  texto_simples?: string;
  acao_necessaria?: boolean;
  nivel_confianca?: string;
  requer_revisao?: boolean;
  erro?: string;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const numero = body?.numero as string | undefined;
  const limite = Number(body?.limite ?? 15);

  if (!numero) {
    return NextResponse.json({ erro: "Informe o número do processo." }, { status: 400 });
  }

  let alias: string;
  try {
    alias = cnjParaAlias(numero);
  } catch (e) {
    return NextResponse.json({ erro: (e as Error).message }, { status: 400 });
  }

  let fontes;
  try {
    fontes = await buscarProcesso(numero, { alias });
  } catch (e) {
    if (e instanceof DataJudError) {
      return NextResponse.json({ erro: e.message }, { status: 502 });
    }
    throw e;
  }

  if (fontes.length === 0) {
    return NextResponse.json({
      numero,
      alias,
      classe: null,
      movimentos: [],
      aviso: "Nenhum processo encontrado (verifique o número/tribunal ou a defasagem do DataJud).",
    });
  }

  const fonte = fontes[0];
  const classe = fonte.classe?.nome ?? "—";
  const movimentos = extrairMovimentos(fonte).slice(-limite);

  const traduzidos: MovimentoTraduzido[] = await Promise.all(
    movimentos.map(async (m) => {
      try {
        const t = await traduzirMovimento(m.nome ?? "", `Classe: ${classe}`);
        return { data: m.data, nome: m.nome, ...t };
      } catch (e) {
        return { data: m.data, nome: m.nome, erro: (e as Error).message };
      }
    })
  );

  return NextResponse.json({ numero, alias, classe, movimentos: traduzidos });
}
