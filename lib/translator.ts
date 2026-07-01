/**
 * Camada de IA: traduz uma movimentação processual para linguagem simples.
 *
 * Saída estruturada com nível de confiança e flag de "ação necessária", seguindo
 * os guardrails do plano: nunca afirmar resultado ("ganhou/perdeu") sem revisão;
 * usar linguagem de status; movimentações sensíveis devem ir para revisão humana.
 */

import Anthropic from "@anthropic-ai/sdk";

// Movimentações sensíveis: mesmo com confiança alta, marque para revisão humana.
const MOVIMENTOS_SENSIVEIS = [
  "sentença", "acórdão", "trânsito em julgado", "extinção", "improcedente",
  "procedente", "arquivamento", "baixa", "decisão", "julgamento",
];

const SYSTEM_PROMPT = `Você traduz movimentações de processos judiciais brasileiros para linguagem simples, destinada ao cliente leigo de um escritório de advocacia.

Regras invioláveis:
- NUNCA afirme resultado do processo ("você ganhou/perdeu"). Use linguagem de status ("houve uma decisão; seu advogado vai avaliar e te orientar").
- Seja claro, curto e acolhedor. Sem juridiquês.
- Se a movimentação for ambígua ou sensível, reduza a confiança.

Responda SOMENTE com um JSON válido, sem texto extra, no formato:
{
  "texto_simples": "explicação em 1-2 frases para o cliente",
  "acao_necessaria": true|false,
  "nivel_confianca": "alta"|"media"|"baixa",
  "justificativa_curta": "por que essa tradução/observação"
}`;

export interface TraducaoMovimento {
  texto_simples: string;
  acao_necessaria: boolean;
  nivel_confianca: "alta" | "media" | "baixa";
  justificativa_curta: string;
  sensivel: boolean;
  requer_revisao: boolean;
}

function ehSensivel(nome: string | null | undefined): boolean {
  const n = (nome || "").toLowerCase();
  return MOVIMENTOS_SENSIVEIS.some((termo) => n.includes(termo));
}

function extrairJson(texto: string): Record<string, unknown> {
  let limpo = texto.trim();
  if (limpo.startsWith("```")) {
    limpo = limpo.replace(/^```(json)?/, "").replace(/```$/, "").trim();
  }
  return JSON.parse(limpo);
}

async function chamarLlm(nomeMovimento: string, contexto: string): Promise<Record<string, unknown>> {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new Error("LLM_API_KEY não definida (ver .env.example).");
  }
  const model = process.env.LLM_MODEL || "claude-sonnet-5";

  const client = new Anthropic({ apiKey });
  const userMsg = `Movimentação oficial: ${JSON.stringify(nomeMovimento)}\nContexto do processo: ${contexto || "não informado"}\n\nTraduza conforme as regras.`;

  const resp = await client.messages.create({
    model,
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMsg }],
  });

  const texto = resp.content
    .filter((bloco) => bloco.type === "text")
    .map((bloco) => (bloco as { text: string }).text)
    .join("")
    .trim();

  return extrairJson(texto);
}

/**
 * Traduz uma movimentação e aplica a regra de revisão humana obrigatória.
 */
export async function traduzirMovimento(
  nomeMovimento: string,
  contexto = ""
): Promise<TraducaoMovimento> {
  const resultado = await chamarLlm(nomeMovimento, contexto);

  const sensivel = ehSensivel(nomeMovimento);
  const confianca = (resultado.nivel_confianca as string) || "baixa";

  return {
    texto_simples: String(resultado.texto_simples ?? ""),
    acao_necessaria: Boolean(resultado.acao_necessaria),
    nivel_confianca: confianca as TraducaoMovimento["nivel_confianca"],
    justificativa_curta: String(resultado.justificativa_curta ?? ""),
    sensivel,
    requer_revisao: sensivel || confianca !== "alta",
  };
}
