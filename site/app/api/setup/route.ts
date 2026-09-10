import { conectarSemBanco } from "@/lib/db";

/**
 * Criação inicial do banco e da tabela de veículos.
 *
 * Existe porque o painel do TiDB Cloud não oferece um editor de SQL nesta
 * versão (só importação de CSV), e o ambiente onde o código é escrito não
 * alcança o banco pela rede. Então quem executa o SQL é o próprio site,
 * que roda na Vercel e tem acesso.
 *
 * É seguro rodar mais de uma vez: tudo usa IF NOT EXISTS, então repetir
 * não apaga, não duplica e não altera nada que já exista.
 */

export const dynamic = "force-dynamic";

const NOME_BANCO = process.env.TIDB_DATABASE || "sgp";

const COMANDOS: { descricao: string; sql: string }[] = [
  {
    descricao: `Criar o banco "${NOME_BANCO}"`,
    sql: `CREATE DATABASE IF NOT EXISTS \`${NOME_BANCO}\`
            DEFAULT CHARACTER SET utf8mb4
            DEFAULT COLLATE utf8mb4_general_ci`,
  },
  {
    descricao: "Criar a tabela veiculos",
    sql: `CREATE TABLE IF NOT EXISTS \`${NOME_BANCO}\`.veiculos (
            id                         VARCHAR(12)   NOT NULL COMMENT 'ID interno, ex: VC-000123',
            data_cadastro              DATETIME      NULL,
            status_cadastro            VARCHAR(12)   NULL     COMMENT 'COMPLETO ou RASCUNHO',

            ano                        SMALLINT      NULL     COMMENT 'Ano do PROCESSO de doacao',
            mes                        VARCHAR(12)   NULL,
            uf                         VARCHAR(10)   NULL,
            ente                       VARCHAR(20)   NULL,
            donataria                  VARCHAR(200)  NULL,
            cnpj_donataria             VARCHAR(20)   NULL,
            termo_doacao               VARCHAR(120)  NULL,
            numero_processo            VARCHAR(40)   NULL,
            numero_sei                 VARCHAR(30)   NULL,
            contrato                   VARCHAR(60)   NULL,
            aditivo                    VARCHAR(3)    NOT NULL DEFAULT 'NÃO',
            numero_aditivo             VARCHAR(60)   NULL,
            qtd_veiculos_contrato      INT           NULL,
            qtd_veiculos_aditivo       INT           NULL,
            motivo_inclusao_posterior  VARCHAR(300)  NULL,

            marca                      VARCHAR(60)   NULL,
            descricao                  VARCHAR(160)  NULL,
            ano_modelo                 VARCHAR(9)    NULL     COMMENT 'Ano/modelo do VEICULO, ex: 2026/2027',
            chassi                     VARCHAR(24)   NULL,
            renavam                    VARCHAR(15)   NULL,
            placa                      VARCHAR(10)   NULL,
            valor_veiculo              DECIMAL(12,2) NULL,

            cep                        VARCHAR(10)   NULL,
            logradouro                 VARCHAR(160)  NULL,
            numero                     VARCHAR(20)   NULL,
            complemento                VARCHAR(80)   NULL,
            bairro                     VARCHAR(100)  NULL,
            municipio                  VARCHAR(100)  NULL,

            transferido                VARCHAR(3)    NOT NULL DEFAULT 'NÃO',
            data_transferencia         DATETIME      NULL,
            atpve_emitido              VARCHAR(3)    NOT NULL DEFAULT 'NÃO',
            data_emissao_atpve         DATETIME      NULL,
            atpve_enviado              VARCHAR(3)    NOT NULL DEFAULT 'NÃO',
            data_envio_atpve           DATETIME      NULL,
            data_emissao_segunda_via   DATETIME      NULL,

            excluido                   VARCHAR(3)    NOT NULL DEFAULT 'NÃO',
            excluido_por               VARCHAR(120)  NULL,
            data_exclusao              DATETIME      NULL,

            observacoes                VARCHAR(300)  NULL,
            cadastrado_por             VARCHAR(120)  NULL,
            ultima_atualizacao         DATETIME      NULL,
            atualizado_por             VARCHAR(120)  NULL,

            PRIMARY KEY (id),

            KEY idx_chassi          (chassi),
            KEY idx_placa           (placa),
            KEY idx_renavam         (renavam),
            KEY idx_processo        (numero_processo),
            KEY idx_termo           (termo_doacao),
            KEY idx_donataria       (donataria),
            KEY idx_excluido_uf     (excluido, uf),
            KEY idx_excluido_transf (excluido, transferido),
            KEY idx_excluido_ano    (excluido, ano)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
  },
];

function paginaHtml(titulo: string, corpo: string, sucesso: boolean): Response {
  const cor = sucesso ? "#1e7f4f" : "#b3261e";
  const fundo = sucesso ? "#eaf6ef" : "#fdecea";
  return new Response(
    `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
     <meta name="viewport" content="width=device-width,initial-scale=1">
     <title>${titulo}</title>
     <style>
       body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;
            background:#f4f6f9;color:#1c1c1c;line-height:1.55;margin:0;padding:40px 20px}
       .caixa{max-width:640px;margin:0 auto;background:#fff;border:1px solid #e0e3e8;
              border-radius:14px;padding:28px}
       h1{font-size:20px;margin:0 0 16px;color:${cor}}
       .destaque{background:${fundo};border:1px solid ${cor}33;border-radius:10px;
                 padding:14px 16px;margin:16px 0;font-size:14px}
       ul{padding-left:20px} li{margin-bottom:6px}
       code{background:#f0f2f5;padding:2px 6px;border-radius:4px;font-size:13px}
     </style></head><body><div class="caixa">${corpo}</div></body></html>`,
    {
      status: sucesso ? 200 : 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    }
  );
}

export async function GET(request: Request) {
  const tokenEsperado = process.env.SETUP_TOKEN;
  const tokenRecebido = new URL(request.url).searchParams.get("token");

  if (!tokenEsperado) {
    return paginaHtml(
      "Configuração incompleta",
      `<h1>Falta configurar o SETUP_TOKEN</h1>
       <p>A variável de ambiente <code>SETUP_TOKEN</code> não está definida na Vercel.</p>`,
      false
    );
  }

  if (tokenRecebido !== tokenEsperado) {
    return paginaHtml(
      "Acesso negado",
      `<h1>Link inválido</h1>
       <p>Esta página só abre com o link completo, que inclui um código de segurança.</p>`,
      false
    );
  }

  const executados: string[] = [];

  try {
    const conexao = await conectarSemBanco();
    try {
      for (const comando of COMANDOS) {
        await conexao.query(comando.sql);
        executados.push(comando.descricao);
      }

      // Confere o que realmente ficou no banco, em vez de só confiar que
      // os comandos passaram.
      const [colunas] = await conexao.query(
        `SELECT COUNT(*) AS total FROM information_schema.columns
          WHERE table_schema = ? AND table_name = 'veiculos'`,
        [NOME_BANCO]
      );
      const [indices] = await conexao.query(
        `SELECT COUNT(DISTINCT index_name) AS total FROM information_schema.statistics
          WHERE table_schema = ? AND table_name = 'veiculos'`,
        [NOME_BANCO]
      );
      const [registros] = await conexao.query(
        `SELECT COUNT(*) AS total FROM \`${NOME_BANCO}\`.veiculos`
      );

      const totalColunas = (colunas as { total: number }[])[0]?.total ?? 0;
      const totalIndices = (indices as { total: number }[])[0]?.total ?? 0;
      const totalRegistros = (registros as { total: number }[])[0]?.total ?? 0;

      return paginaHtml(
        "Banco preparado",
        `<h1>✅ Banco preparado com sucesso</h1>
         <p>O que foi feito agora:</p>
         <ul>${executados.map((e) => `<li>${e}</li>`).join("")}</ul>
         <div class="destaque">
           <strong>Conferência feita no próprio banco:</strong><br>
           Tabela <code>veiculos</code> criada com <strong>${totalColunas} colunas</strong>
           e <strong>${totalIndices} índices</strong>.<br>
           Registros na tabela: <strong>${totalRegistros}</strong>
           ${totalRegistros === 0 ? "(vazia, como esperado — os dados entram na próxima etapa)" : ""}
         </div>
         <p>Pode fechar esta página. O próximo passo é importar os veículos.</p>`,
        true
      );
    } finally {
      await conexao.end();
    }
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    return paginaHtml(
      "Erro ao preparar o banco",
      `<h1>❌ Não consegui preparar o banco</h1>
       ${executados.length ? `<p>Etapas concluídas antes do erro:</p><ul>${executados.map((e) => `<li>${e}</li>`).join("")}</ul>` : ""}
       <div class="destaque"><strong>Mensagem técnica:</strong><br><code>${mensagem.replace(/</g, "&lt;")}</code></div>
       <p>Mande esta mensagem para o Claude — ela diz exatamente o que ajustar.</p>`,
      false
    );
  }
}
