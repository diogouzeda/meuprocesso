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

## Status

🚧 Em desenvolvimento — Fase 0 (prova técnica): validar cobertura e defasagem do DataJud nos tribunais-alvo.

## Roadmap

- [ ] Fase 0 — Prova técnica (acesso DataJud + tradução IA ponta a ponta)
- [ ] Fase 1 — MVP: painel do escritório (cadastro, coleta, tradução, revisão, timeline)
- [ ] Fase 2 — Canal com o cliente final (WhatsApp / portal)
- [ ] Fase 3 — Escala, cobrança e retenção

## Licença

Proprietária — todos os direitos reservados (ajuste conforme sua decisão).
