"""Fase 0 — prova técnica ponta a ponta.

Consulta um processo no DataJud pelo número único, extrai as movimentações e
(opcionalmente) traduz cada uma via IA para linguagem simples.

Uso:
    python src/fase0.py 0000832-35.2018.8.26.0100
    python src/fase0.py 0000832-35.2018.8.26.0100 --sem-ia
    python src/fase0.py 0000832-35.2018.8.26.0100 --alias api_publica_tjsp --limite 10

Requer um arquivo .env (baseado em .env.example) com DATAJUD_API_KEY e, para a
tradução, LLM_API_KEY.
"""

from __future__ import annotations

import argparse
import sys

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from cnj_alias import cnj_para_alias
from datajud_client import buscar_processo, extrair_movimentos, DataJudError


def main() -> int:
    parser = argparse.ArgumentParser(description="Fase 0 — DataJud + tradução IA")
    parser.add_argument("numero", help="Número único CNJ do processo")
    parser.add_argument("--alias", help="Forçar alias do tribunal (ex.: api_publica_tjsp)")
    parser.add_argument("--limite", type=int, default=15, help="Máx. de movimentações")
    parser.add_argument("--sem-ia", action="store_true", help="Só consultar, sem traduzir")
    args = parser.parse_args()

    alias = args.alias or cnj_para_alias(args.numero)
    print(f"Processo: {args.numero}")
    print(f"Tribunal (alias): {alias}\n")

    try:
        fontes = buscar_processo(args.numero, alias=alias)
    except DataJudError as e:
        print(f"[erro DataJud] {e}", file=sys.stderr)
        return 1

    if not fontes:
        print("Nenhum processo encontrado (verifique o número/tribunal ou a defasagem do DataJud).")
        return 0

    fonte = fontes[0]
    classe = (fonte.get("classe") or {}).get("nome", "—")
    print(f"Classe: {classe}")

    movimentos = extrair_movimentos(fonte)[-args.limite:]
    print(f"Movimentações (últimas {len(movimentos)}):\n")

    traduzir = None
    if not args.sem_ia:
        try:
            from translator import traduzir_movimento
            traduzir = traduzir_movimento
        except Exception as e:  # noqa: BLE001
            print(f"[aviso] IA indisponível ({e}). Seguindo sem tradução.\n")

    for m in movimentos:
        print(f"• {m['data']}  |  {m['nome']}")
        if traduzir:
            try:
                t = traduzir(m["nome"], contexto=f"Classe: {classe}")
                flag = "⚠ REVISAR" if t.get("requer_revisao") else "✓ auto"
                print(f"    → {t.get('texto_simples')}")
                print(
                    f"    [{flag} | confiança: {t.get('nivel_confianca')} | "
                    f"ação necessária: {t.get('acao_necessaria')}]"
                )
            except Exception as e:  # noqa: BLE001
                print(f"    [erro na tradução: {e}]")
        print()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
