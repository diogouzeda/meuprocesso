/**
 * Deriva o alias do tribunal (endpoint DataJud) a partir do número único CNJ.
 *
 * Formato do número único (Resolução CNJ 65/2008), 20 dígitos:
 *   NNNNNNN-DD.AAAA.J.TR.OOOO
 * O endpoint da API Pública do DataJud é `api_publica_{alias}` (ex.: api_publica_tjsp).
 */

// Segmento J=8 (Justiça Estadual): código TR -> UF (ordem alfabética dos estados)
const ESTADUAL_TR_TO_UF: Record<string, string> = {
  "01": "ac", "02": "al", "03": "ap", "04": "am", "05": "ba",
  "06": "ce", "07": "dft", "08": "es", "09": "go", "10": "ma",
  "11": "mt", "12": "ms", "13": "mg", "14": "pa", "15": "pb",
  "16": "pr", "17": "pe", "18": "pi", "19": "rj", "20": "rn",
  "21": "rs", "22": "ro", "23": "rr", "24": "sc", "25": "se",
  "26": "sp", "27": "to",
};

// Tribunais superiores (J varia); TR costuma ser "00"
const SUPERIORES: Record<string, string> = {
  "1": "stf",
  "3": "stj",
};

export function normalizarNumero(numero: string): string {
  const apenasDigitos = (numero || "").replace(/\D/g, "");
  if (apenasDigitos.length !== 20) {
    throw new Error(
      `Número CNJ inválido: esperados 20 dígitos, recebidos ${apenasDigitos.length} (entrada: ${numero}).`
    );
  }
  return apenasDigitos;
}

export interface PartesCnj {
  sequencial: string;
  dv: string;
  ano: string;
  justica: string;
  tribunal: string;
  origem: string;
}

export function partesCnj(numero: string): PartesCnj {
  const n = normalizarNumero(numero);
  return {
    sequencial: n.slice(0, 7),
    dv: n.slice(7, 9),
    ano: n.slice(9, 13),
    justica: n.slice(13, 14),
    tribunal: n.slice(14, 16),
    origem: n.slice(16, 20),
  };
}

/**
 * Retorna o alias do endpoint DataJud (ex.: 'api_publica_tjsp').
 *
 * Cobre os segmentos mais comuns: Estadual (8), Trabalho (5), Federal (4),
 * Eleitoral (6) e alguns superiores. Para segmentos não mapeados, lança erro —
 * nesses casos, informe o alias manualmente.
 */
export function cnjParaAlias(numero: string): string {
  const { justica: j, tribunal: tr } = partesCnj(numero);

  if (j === "5" && tr === "00") {
    // TST — precisa ser checado antes do ramo genérico da Justiça do Trabalho.
    return "api_publica_tst";
  }

  if (j === "8") {
    const uf = ESTADUAL_TR_TO_UF[tr];
    if (!uf) throw new Error(`Código de tribunal estadual desconhecido: TR=${tr}.`);
    return `api_publica_tj${uf}`;
  }

  if (j === "5") {
    const regiao = parseInt(tr, 10);
    return `api_publica_trt${regiao}`;
  }

  if (j === "4") {
    const regiao = parseInt(tr, 10);
    return `api_publica_trf${regiao}`;
  }

  if (j === "6") {
    const uf = ESTADUAL_TR_TO_UF[tr];
    if (!uf) throw new Error(`Código de TRE desconhecido: TR=${tr}.`);
    return `api_publica_tre-${uf}`;
  }

  if (j in SUPERIORES) {
    return `api_publica_${SUPERIORES[j]}`;
  }

  throw new Error(
    `Segmento do Judiciário não mapeado (J=${j}, TR=${tr}). Informe o alias manualmente.`
  );
}
