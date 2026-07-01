# meuprocesso

Plataforma SaaS para escritórios de advocacia: monitora processos judiciais e **traduz as movimentações para linguagem simples** destinada ao cliente final do escritório.

> Modelo B2B2C — o escritório é o cliente pagante; o beneficiário é o cliente final, que passa a entender o próprio processo sem juridiquês.

## Visão do MVP

Foco inicial: **painel do escritório**. O escritório cadastra processos e clientes, a plataforma coleta as movimentações (via API Pública do DataJud/CNJ), uma camada de IA traduz cada movimentação com um nível de confiança, e o advogado **revisa e aprova** antes de qualquer envio ao cliente.

## Stack (sugerida)

- **Frontend:** Next.js + React + TypeScript + Tailwind
- **Backend:** Node.js (NestJS) ou Python (FastAPI)
- **Banco:** PostgreSQL (multi-tenant por `tenant_id`)
- **Fila/jobs:** Redis + BullMQ (ou Celery/RQ)
- **IA:** API de LLM para tradução das movimentações
- **Dados processuais:** API Pública DataJud/CNJ

## Integração DataJud (referência rápida)

- Base: `https://api-publica.datajud.cnj.jus.br/`
- Endpoint por tribunal: `POST /api_publica_{alias}/_search`
- Auth (header): `Authorization: APIKey <chave pública da wiki>`
- Docs: https://datajud-wiki.cnj.jus.br/api-publica/

## Rodando a Fase 0

Prova técnica ponta a ponta: consulta um processo no DataJud e traduz as movimentações com IA.

```bash
# 1. dependências
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 2. configurar segredos
cp .env.example .env   # e preencha LLM_API_KEY

# 3. executar
python src/fase0.py "0000832-35.2018.8.26.0100"          # com tradução IA
python src/fase0.py "0000832-35.2018.8.26.0100" --sem-ia # só consulta DataJud
```

Estrutura:

- `src/cnj_alias.py` — deriva o alias do tribunal a partir do número único CNJ.
- `src/datajud_client.py` — cliente da API Pública do DataJud.
- `src/translator.py` — camada de IA (tradução + nível de confiança + regra de revisão humana).
- `src/fase0.py` — CLI que junta tudo.

## Status

🚧 Em desenvolvimento — Fase 0 (prova técnica): validar cobertura e defasagem do DataJud nos tribunais-alvo.

## Roadmap

- [ ] Fase 0 — Prova técnica (acesso DataJud + tradução IA ponta a ponta)
- [ ] Fase 1 — MVP: painel do escritório (cadastro, coleta, tradução, revisão, timeline)
- [ ] Fase 2 — Canal com o cliente final (WhatsApp / portal)
- [ ] Fase 3 — Escala, cobrança e retenção

## Licença

Proprietária — todos os direitos reservados (ajuste conforme sua decisão).
