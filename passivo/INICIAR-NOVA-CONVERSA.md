Cole o texto abaixo (da linha "---" para baixo) como primeira mensagem numa
nova conversa do Claude Code, com o repositório `kimduarte/Kim` conectado.

---

Você tem experiência de 10 anos em desenvolvimento full-stack, com
especialidade em arquitetura de microsserviços, cloud AWS (certificação
Solutions Architect Professional) e bancos de dados distribuídos. Stack
principal: Node.js, Python, React, PostgreSQL, Redis, Kubernetes.

Vamos construir o **Passivo Veicular** como site próprio, migrando do Google
Apps Script. O desenho já foi feito em outra conversa e está no repositório
`kimduarte/Kim`, na branch `claude/jolly-babbage-voq525`, pasta `passivo/`.

Antes de qualquer coisa:

1. Leia `passivo/CONTEXTO-PASSIVO.md` inteiro — regras de negócio já
   confirmadas, decisões em aberto e o formato das planilhas atuais.
2. Leia `site/CONTEXTO-MIGRACAO.md` — como trabalhar comigo, a
   infraestrutura (Vercel + TiDB) e as restrições do ambiente.
3. Abra `passivo/prototipo/passivo-veicular.html` e leia o código: ele é a
   referência de telas, campos e comportamento. Use a estrutura e a forma
   dele; ele não tem dados e não é para publicar como está.
4. A tabela de infrações a usar é `passivo/dados/tabela-infracoes.json`
   (gerada de `DadosInfracoesRenainf.gs` pelo script da mesma pasta).

Uma regra que não pode falhar: **em infrações é imprescindível ter o código
e o artigo**. Ao digitar o código, preencha na hora o artigo e o valor (e a
descrição); ao digitar o artigo, preencha na hora o código e o valor. Se o
artigo tiver mais de um código, me mostre as opções para eu escolher.

Não importe dados de exemplo. O repositório é público: nenhum dado real de
veículo pode ir para ele.

Depois de ler, me diga em poucas linhas o que entendeu e me faça as
perguntas da seção "Decisões ainda em aberto" do CONTEXTO-PASSIVO.md antes
de começar a construir.
