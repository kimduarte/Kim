import type mysql from "mysql2/promise";
import { ATIVIDADES_PADRAO, CONFIG_PADRAO } from "./constantes";
import { agoraBanco } from "./tempo";

/**
 * Tabelas da produtividade. Todas começam com "prod_" e ficam no mesmo banco
 * do site, mas não se ligam à tabela de veículos: nenhuma consulta daqui lê
 * ou escreve nela.
 *
 * Datas e horas de sistema (criado_em, expira_em…) são gravadas em UTC.
 * A data do registro (coluna data) é a data de trabalho que a pessoa escolheu,
 * sem hora e sem fuso.
 */
export const TABELAS: { nome: string; sql: string }[] = [
  {
    nome: "prod_usuarios",
    sql: `CREATE TABLE IF NOT EXISTS prod_usuarios (
            id             VARCHAR(24)  NOT NULL,
            nome           VARCHAR(80)  NOT NULL,
            email          VARCHAR(120) NOT NULL,
            senha_hash     VARCHAR(200) NOT NULL,
            papel          VARCHAR(12)  NOT NULL DEFAULT 'servidor' COMMENT 'servidor ou coordenacao',
            ativo          TINYINT      NOT NULL DEFAULT 1,
            cor            TINYINT      NOT NULL DEFAULT 0,
            trocar_senha   TINYINT      NOT NULL DEFAULT 1 COMMENT '1 = senha provisoria, troca no proximo acesso',
            falhas         INT          NOT NULL DEFAULT 0,
            bloqueado_ate  DATETIME     NULL,
            criado_em      DATETIME     NOT NULL,
            atualizado_em  DATETIME     NOT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY uk_email (email)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
  },
  {
    nome: "prod_sessoes",
    sql: `CREATE TABLE IF NOT EXISTS prod_sessoes (
            token_hash  CHAR(64)    NOT NULL COMMENT 'SHA-256 do codigo guardado no navegador',
            usuario_id  VARCHAR(24) NOT NULL,
            criada_em   DATETIME    NOT NULL,
            expira_em   DATETIME    NOT NULL,
            PRIMARY KEY (token_hash),
            KEY idx_usuario (usuario_id),
            KEY idx_expira (expira_em)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
  },
  {
    nome: "prod_ufs",
    sql: `CREATE TABLE IF NOT EXISTS prod_ufs (
            sigla          CHAR(2)     NOT NULL,
            usuario_id     VARCHAR(24) NULL COMMENT 'responsavel; NULL = sem responsavel',
            atualizado_em  DATETIME    NOT NULL,
            PRIMARY KEY (sigla)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
  },
  {
    nome: "prod_atividades",
    sql: `CREATE TABLE IF NOT EXISTS prod_atividades (
            id             VARCHAR(40)  NOT NULL,
            categoria      VARCHAR(20)  NOT NULL,
            curto          VARCHAR(60)  NOT NULL,
            nome           VARCHAR(240) NOT NULL,
            uf_padrao      VARCHAR(2)   NULL COMMENT 'NULL = sem padrao; vazio = nacional',
            ordem          INT          NOT NULL,
            ativa          TINYINT      NOT NULL DEFAULT 1,
            atualizado_em  DATETIME     NOT NULL,
            PRIMARY KEY (id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
  },
  {
    nome: "prod_registros",
    sql: `CREATE TABLE IF NOT EXISTS prod_registros (
            id              VARCHAR(24)  NOT NULL,
            data            DATE         NOT NULL,
            usuario_id      VARCHAR(24)  NOT NULL COMMENT 'quem fez a atividade',
            uf              VARCHAR(2)   NOT NULL DEFAULT '' COMMENT 'vazio = nacional',
            atividade_id    VARCHAR(40)  NOT NULL,
            qtd             INT          NOT NULL,
            ref             VARCHAR(120) NOT NULL DEFAULT '',
            obs             VARCHAR(300) NOT NULL DEFAULT '',
            fora_do_leque   TINYINT      NOT NULL DEFAULT 0 COMMENT '1 = UF de outro responsavel na hora do registro',
            excluido        TINYINT      NOT NULL DEFAULT 0,
            criado_por      VARCHAR(24)  NOT NULL,
            atualizado_por  VARCHAR(24)  NOT NULL,
            criado_em       DATETIME     NOT NULL,
            atualizado_em   DATETIME     NOT NULL,
            PRIMARY KEY (id),
            KEY idx_usuario_data (usuario_id, data),
            KEY idx_data (data)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
  },
  {
    nome: "prod_config",
    sql: `CREATE TABLE IF NOT EXISTS prod_config (
            chave  VARCHAR(40)  NOT NULL,
            valor  VARCHAR(300) NOT NULL,
            PRIMARY KEY (chave)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
  },
];

/**
 * Cria o que faltar e põe as 15 atividades e os nomes do setor.
 * Rodar de novo é seguro: nada que já existe é apagado ou alterado.
 */
export async function prepararTabelas(conexao: mysql.Connection): Promise<string[]> {
  const feito: string[] = [];
  for (const t of TABELAS) {
    await conexao.query(t.sql);
    feito.push(`Tabela ${t.nome} conferida`);
  }
  const agora = agoraBanco();
  for (const [i, a] of ATIVIDADES_PADRAO.entries()) {
    await conexao.execute(
      `INSERT IGNORE INTO prod_atividades (id, categoria, curto, nome, uf_padrao, ordem, ativa, atualizado_em)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
      [a.id, a.categoria, a.curto, a.nome, a.ufPadrao ?? null, i, agora]
    );
  }
  feito.push(`As ${ATIVIDADES_PADRAO.length} atividades padrão conferidas`);
  for (const [chave, valor] of Object.entries(CONFIG_PADRAO)) {
    await conexao.execute(`INSERT IGNORE INTO prod_config (chave, valor) VALUES (?, ?)`, [chave, valor]);
  }
  return feito;
}
