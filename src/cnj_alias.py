"""Deriva o alias do tribunal (endpoint DataJud) a partir do número único CNJ.

Formato do número único (Resolução CNJ 65/2008), 20 dígitos:
    NNNNNNN-DD.AAAA.J.TR.OOOO
    - NNNNNNN (7) : número sequencial
    - DD      (2) : dígito verificador
    - AAAA    (4) : ano do ajuizamento
    - J       (1) : segmento do Judiciário (justiça)
    - TR      (2) : tribunal
    - OOOO    (4) : unidade de origem

O endpoint da API Pública do DataJud é `api_publica_{alias}` (ex.: api_publica_tjsp).
"""

import re

# Segmento J=8 (Justiça Estadual): código TR -> UF (ordem alfabética dos estados)
_ESTADUAL_TR_TO_UF = {
    "01": "ac", "02": "al", "03": "ap", "04": "am", "05": "ba",
    "06": "ce", "07": "dft", "08": "es", "09": "go", "10": "ma",
    "11": "mt", "12": "ms", "13": "mg", "14": "pa", "15": "pb",
    "16": "pr", "17": "pe", "18": "pi", "19": "rj", "20": "rn",
    "21": "rs", "22": "ro", "23": "rr", "24": "sc", "25": "se",
    "26": "sp", "27": "to",
}

# Tribunais superiores (J varia); TR costuma ser "00"
_SUPERIORES = {
    "1": "stf",
    "3": "stj",
}


def normalizar_numero(numero: str) -> str:
    """Remove tudo que não for dígito e valida o tamanho (20)."""
    apenas_digitos = re.sub(r"\D", "", numero or "")
    if len(apenas_digitos) != 20:
        raise ValueError(
            f"Número CNJ inválido: esperados 20 dígitos, recebidos {len(apenas_digitos)} "
            f"(entrada: {numero!r})."
        )
    return apenas_digitos


def partes_cnj(numero: str) -> dict:
    """Decompõe o número único em seus campos."""
    n = normalizar_numero(numero)
    return {
        "sequencial": n[0:7],
        "dv": n[7:9],
        "ano": n[9:13],
        "justica": n[13:14],   # J
        "tribunal": n[14:16],  # TR
        "origem": n[16:20],
    }


def cnj_para_alias(numero: str) -> str:
    """Retorna o alias do endpoint DataJud (ex.: 'api_publica_tjsp').

    Cobre os segmentos mais comuns: Estadual (8), Trabalho (5), Federal (4),
    Eleitoral (6) e alguns superiores. Para segmentos não mapeados, levanta
    ValueError — nesses casos, informe o alias manualmente.
    """
    p = partes_cnj(numero)
    j, tr = p["justica"], p["tribunal"]

    if j == "5" and tr == "00":  # TST — checar antes do ramo genérico da Justiça do Trabalho
        return "api_publica_tst"

    if j == "8":  # Justiça Estadual
        uf = _ESTADUAL_TR_TO_UF.get(tr)
        if not uf:
            raise ValueError(f"Código de tribunal estadual desconhecido: TR={tr}.")
        return f"api_publica_tj{uf}"

    if j == "5":  # Justiça do Trabalho
        regiao = int(tr)
        return f"api_publica_trt{regiao}"

    if j == "4":  # Justiça Federal
        regiao = int(tr)
        return f"api_publica_trf{regiao}"

    if j == "6":  # Justiça Eleitoral
        uf = _ESTADUAL_TR_TO_UF.get(tr)
        if not uf:
            raise ValueError(f"Código de TRE desconhecido: TR={tr}.")
        return f"api_publica_tre-{uf}"

    if j in _SUPERIORES:
        return f"api_publica_{_SUPERIORES[j]}"

    raise ValueError(
        f"Segmento do Judiciário não mapeado (J={j}, TR={tr}). "
        "Informe o alias manualmente via --alias."
    )


if __name__ == "__main__":
    # Exemplo rápido de sanidade
    exemplos = [
        "0000832-35.2018.8.26.0100",  # TJSP
        "0001234-56.2020.5.02.0001",  # TRT2
    ]
    for e in exemplos:
        print(f"{e}  ->  {cnj_para_alias(e)}")
