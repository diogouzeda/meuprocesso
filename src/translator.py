"""Camada de IA: traduz uma movimentação processual para linguagem simples.

Saída estruturada com nível de confiança e flag de "ação necessária", seguindo
os guardrails do plano: nunca afirmar resultado ("ganhou/perdeu") sem revisão;
usar linguagem de status; movimentações sensíveis devem ir para revisão humana.

Usa a API da Anthropic (Claude). Para trocar de provedor, reescreva apenas
`_chamar_llm`.
"""

from __future__ import annotations

import json
import os
from typing import Any

# Movimentações sensíveis: mesmo com confiança alta, marque para revisão humana.
MOVIMENTOS_SENSIVEIS = {
    "sentença", "acórdão", "trânsito em julgado", "extinção", "improcedente",
    "procedente", "arquivamento", "baixa", "decisão", "julgamento",
}

SYSTEM_PROMPT = """Você traduz movimentações de processos judiciais brasileiros \
para linguagem simples, destinada ao cliente leigo de um escritório de advocacia.

Regras invioláveis:
- NUNCA afirme resultado do processo ("você ganhou/perdeu"). Use linguagem de \
status ("houve uma decisão; seu advogado vai avaliar e te orientar").
- Seja claro, curto e acolhedor. Sem juridiquês.
- Se a movimentação for ambígua ou sensível, reduza a confiança.

Responda SOMENTE com um JSON válido, sem texto extra, no formato:
{
  "texto_simples": "explicação em 1-2 frases para o cliente",
  "acao_necessaria": true|false,
  "nivel_confianca": "alta"|"media"|"baixa",
  "justificativa_curta": "por que essa tradução/observação"
}"""


def _eh_sensivel(nome: str) -> bool:
    n = (nome or "").lower()
    return any(termo in n for termo in MOVIMENTOS_SENSIVEIS)


def _chamar_llm(nome_movimento: str, contexto: str) -> dict[str, Any]:
    import anthropic

    api_key = os.getenv("LLM_API_KEY")
    if not api_key:
        raise RuntimeError("LLM_API_KEY não definida (ver .env.example).")
    model = os.getenv("LLM_MODEL", "claude-sonnet-4-5")

    client = anthropic.Anthropic(api_key=api_key)
    user_msg = (
        f"Movimentação oficial: {nome_movimento!r}\n"
        f"Contexto do processo: {contexto or 'não informado'}\n\n"
        "Traduza conforme as regras."
    )
    resp = client.messages.create(
        model=model,
        max_tokens=400,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_msg}],
    )
    texto = "".join(bloco.text for bloco in resp.content if bloco.type == "text").strip()
    return json.loads(texto)


def traduzir_movimento(nome_movimento: str, contexto: str = "") -> dict[str, Any]:
    """Traduz uma movimentação e aplica a regra de revisão humana obrigatória.

    Retorna o dicionário estruturado + o campo `requer_revisao`.
    """
    resultado = _chamar_llm(nome_movimento, contexto)

    sensivel = _eh_sensivel(nome_movimento)
    confianca = resultado.get("nivel_confianca", "baixa")
    resultado["sensivel"] = sensivel
    # Revisão obrigatória se sensível OU se a confiança não for alta.
    resultado["requer_revisao"] = sensivel or confianca != "alta"
    return resultado
