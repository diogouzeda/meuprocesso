"""Cliente mínimo da API Pública do DataJud/CNJ.

Docs: https://datajud-wiki.cnj.jus.br/api-publica/
O backend é Elasticsearch; a busca vai no corpo (JSON) da requisição POST.
"""

from __future__ import annotations

import os
from typing import Any

import requests

from cnj_alias import cnj_para_alias, normalizar_numero

DEFAULT_BASE_URL = "https://api-publica.datajud.cnj.jus.br"


class DataJudError(RuntimeError):
    pass


def _headers(api_key: str) -> dict:
    return {
        "Authorization": f"APIKey {api_key}",
        "Content-Type": "application/json",
    }


def buscar_processo(
    numero: str,
    api_key: str | None = None,
    alias: str | None = None,
    base_url: str | None = None,
    timeout: int = 30,
) -> list[dict[str, Any]]:
    """Busca um processo pelo número único e retorna a lista de documentos (_source).

    Cada documento traz a capa do processo e o array `movimentos`.
    """
    api_key = api_key or os.getenv("DATAJUD_API_KEY")
    if not api_key:
        raise DataJudError("DATAJUD_API_KEY não definida (ver .env.example).")

    base_url = (base_url or os.getenv("DATAJUD_BASE_URL") or DEFAULT_BASE_URL).rstrip("/")
    alias = alias or cnj_para_alias(numero)
    numero_norm = normalizar_numero(numero)

    url = f"{base_url}/{alias}/_search"
    payload = {"query": {"match": {"numeroProcesso": numero_norm}}}

    resp = requests.post(url, json=payload, headers=_headers(api_key), timeout=timeout)
    if resp.status_code != 200:
        raise DataJudError(
            f"DataJud retornou HTTP {resp.status_code} em {url}: {resp.text[:300]}"
        )

    hits = resp.json().get("hits", {}).get("hits", [])
    return [h.get("_source", {}) for h in hits]


def extrair_movimentos(fonte: dict[str, Any]) -> list[dict[str, Any]]:
    """Extrai e ordena cronologicamente os movimentos de um documento do DataJud."""
    movimentos = fonte.get("movimentos", []) or []
    normalizados = [
        {
            "codigo": m.get("codigo"),
            "nome": m.get("nome"),
            "data": m.get("dataHora"),
        }
        for m in movimentos
    ]
    normalizados.sort(key=lambda m: m["data"] or "")
    return normalizados
