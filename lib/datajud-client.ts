/**
 * Cliente mínimo da API Pública do DataJud/CNJ.
 * Docs: https://datajud-wiki.cnj.jus.br/api-publica/
 * O backend é Elasticsearch; a busca vai no corpo (JSON) da requisição POST.
 */

import { cnjParaAlias, normalizarNumero } from "./cnj-alias";

const DEFAULT_BASE_URL = "https://api-publica.datajud.cnj.jus.br";

export class DataJudError extends Error {}

export interface Movimento {
  codigo: number | null;
  nome: string | null;
  data: string | null;
}

export interface ProcessoFonte {
  classe?: { nome?: string };
  movimentos?: Array<{ codigo?: number; nome?: string; dataHora?: string }>;
  [key: string]: unknown;
}

export async function buscarProcesso(
  numero: string,
  opts: { alias?: string; apiKey?: string; baseUrl?: string; timeoutMs?: number } = {}
): Promise<ProcessoFonte[]> {
  const apiKey = opts.apiKey || process.env.DATAJUD_API_KEY;
  if (!apiKey) {
    throw new DataJudError("DATAJUD_API_KEY não definida (ver .env.example).");
  }

  const baseUrl = (opts.baseUrl || process.env.DATAJUD_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  const alias = opts.alias || cnjParaAlias(numero);
  const numeroNorm = normalizarNumero(numero);

  const url = `${baseUrl}/${alias}/_search`;
  const payload = { query: { match: { numeroProcesso: numeroNorm } } };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 30_000);

  let resp: Response;
  try {
    resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `APIKey ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new DataJudError(
        `Tempo limite excedido consultando o DataJud (${(opts.timeoutMs ?? 30_000) / 1000}s). O tribunal pode estar lento; tente novamente.`
      );
    }
    throw new DataJudError(`Falha ao conectar ao DataJud: ${(e as Error).message}`);
  } finally {
    clearTimeout(timeout);
  }

  if (!resp.ok) {
    const texto = await resp.text();
    throw new DataJudError(`DataJud retornou HTTP ${resp.status} em ${url}: ${texto.slice(0, 300)}`);
  }

  const json = await resp.json();
  const hits: Array<{ _source?: ProcessoFonte }> = json?.hits?.hits ?? [];
  return hits.map((h) => h._source ?? {});
}

export function extrairMovimentos(fonte: ProcessoFonte): Movimento[] {
  const movimentos = fonte.movimentos ?? [];
  const normalizados: Movimento[] = movimentos.map((m) => ({
    codigo: m.codigo ?? null,
    nome: m.nome ?? null,
    data: m.dataHora ?? null,
  }));
  normalizados.sort((a, b) => (a.data ?? "").localeCompare(b.data ?? ""));
  return normalizados;
}
