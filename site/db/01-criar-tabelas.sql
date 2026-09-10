-- =====================================================================
-- SGP/COLOG — Criação da tabela principal de veículos
-- =====================================================================
-- Execute este arquivo UMA VEZ, no SQL Editor do TiDB Cloud.
-- Ele cria o banco "sgp" e a tabela "veiculos", ainda vazia.
--
-- Equivalente à aba "Veiculos" da planilha atual (45 colunas), com duas
-- diferenças importantes que só um banco de verdade permite:
--   1. Cada campo tem um TIPO (data é data, valor é número) — a planilha
--      guarda tudo como texto e por isso aceita "31/02/2026" sem reclamar.
--   2. Índices nos campos usados para buscar/filtrar, que é o que faz a
--      consulta responder na hora mesmo com a base crescendo.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS sgp
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_general_ci;

USE sgp;

CREATE TABLE IF NOT EXISTS veiculos (
  -- Identificação ----------------------------------------------------
  id                         VARCHAR(12)   NOT NULL COMMENT 'ID interno, ex: VC-000123',
  data_cadastro              DATETIME      NULL,
  status_cadastro            VARCHAR(12)   NULL     COMMENT 'COMPLETO ou RASCUNHO',

  -- Processo / doação ------------------------------------------------
  ano                        SMALLINT      NULL     COMMENT 'Ano do PROCESSO de doação',
  mes                        VARCHAR(12)   NULL     COMMENT 'Mês do processo, ex: SETEMBRO',
  uf                         VARCHAR(10)   NULL,
  ente                       VARCHAR(20)   NULL     COMMENT 'Estado ou Município',
  donataria                  VARCHAR(200)  NULL,
  cnpj_donataria             VARCHAR(20)   NULL     COMMENT 'Só dígitos',
  termo_doacao               VARCHAR(120)  NULL,
  numero_processo            VARCHAR(40)   NULL     COMMENT 'Nº SEI do processo, ex: 08020.011113/2025-71',
  numero_sei                 VARCHAR(30)   NULL     COMMENT 'Nº do documento SEI do Termo',
  contrato                   VARCHAR(60)   NULL,
  aditivo                    VARCHAR(3)    NOT NULL DEFAULT 'NÃO',
  numero_aditivo             VARCHAR(60)   NULL,
  qtd_veiculos_contrato      INT           NULL,
  qtd_veiculos_aditivo       INT           NULL,
  motivo_inclusao_posterior  VARCHAR(300)  NULL,

  -- Veículo ----------------------------------------------------------
  marca                      VARCHAR(60)   NULL,
  descricao                  VARCHAR(160)  NULL     COMMENT 'Modelo',
  ano_modelo                 VARCHAR(9)    NULL     COMMENT 'Ano/modelo do VEÍCULO, ex: 2026/2027',
  chassi                     VARCHAR(24)   NULL,
  renavam                    VARCHAR(15)   NULL,
  placa                      VARCHAR(10)   NULL,
  valor_veiculo              DECIMAL(12,2) NULL,

  -- Endereço da donatária --------------------------------------------
  cep                        VARCHAR(10)   NULL,
  logradouro                 VARCHAR(160)  NULL,
  numero                     VARCHAR(20)   NULL,
  complemento                VARCHAR(80)   NULL,
  bairro                     VARCHAR(100)  NULL,
  municipio                  VARCHAR(100)  NULL,

  -- Situação da transferência ----------------------------------------
  transferido                VARCHAR(3)    NOT NULL DEFAULT 'NÃO',
  data_transferencia         DATETIME      NULL,
  atpve_emitido              VARCHAR(3)    NOT NULL DEFAULT 'NÃO',
  data_emissao_atpve         DATETIME      NULL,
  atpve_enviado              VARCHAR(3)    NOT NULL DEFAULT 'NÃO',
  data_envio_atpve           DATETIME      NULL,
  data_emissao_segunda_via   DATETIME      NULL     COMMENT '2ª via do ATPVe',

  -- Lixeira (exclusão lógica) ----------------------------------------
  excluido                   VARCHAR(3)    NOT NULL DEFAULT 'NÃO',
  excluido_por               VARCHAR(120)  NULL,
  data_exclusao              DATETIME      NULL,

  -- Auditoria --------------------------------------------------------
  observacoes                VARCHAR(300)  NULL,
  cadastrado_por             VARCHAR(120)  NULL,
  ultima_atualizacao         DATETIME      NULL,
  atualizado_por             VARCHAR(120)  NULL,

  PRIMARY KEY (id),

  -- Índices ----------------------------------------------------------
  -- Chassi e placa NÃO são únicos de propósito: um veículo excluído
  -- (lixeira) pode compartilhar chassi com o recadastro correto dele —
  -- isso existe hoje na base e é comportamento esperado. A checagem de
  -- duplicidade continua no código, que sabe ignorar os excluídos.
  KEY idx_chassi            (chassi),
  KEY idx_placa             (placa),
  KEY idx_renavam           (renavam),
  KEY idx_processo          (numero_processo),
  KEY idx_termo             (termo_doacao),
  KEY idx_donataria         (donataria),
  -- Compostos: refletem os filtros que as telas realmente usam juntos.
  KEY idx_excluido_uf       (excluido, uf),
  KEY idx_excluido_transf   (excluido, transferido),
  KEY idx_excluido_ano      (excluido, ano)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
