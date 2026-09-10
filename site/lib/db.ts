import mysql, { type RowDataPacket } from "mysql2/promise";

/** Tipos que o driver aceita como parâmetro de consulta. */
export type ValorSql = string | number | boolean | Date | null;

/**
 * Conexão com o TiDB Cloud.
 *
 * As credenciais NUNCA ficam no código — vêm das variáveis de ambiente
 * configuradas no painel da Vercel. É por isso que este arquivo pode ficar
 * no GitHub sem risco: ele sabe COMO conectar, não sabe a senha.
 */

function precisaDaVariavel(nome: string): string {
  const valor = process.env[nome];
  if (!valor) {
    throw new Error(
      `A variável de ambiente ${nome} não está configurada. ` +
        `Configure em: Vercel → projeto → Settings → Environment Variables.`
    );
  }
  return valor;
}

/**
 * O TiDB Cloud exige conexão criptografada (TLS). O certificado dele é
 * emitido por uma autoridade pública conhecida, então não é preciso
 * carregar arquivo de certificado nenhum — basta exigir a verificação.
 */
function configuracaoBase(comBanco: boolean): mysql.ConnectionOptions {
  return {
    host: precisaDaVariavel("TIDB_HOST"),
    port: Number(process.env.TIDB_PORT || 4000),
    user: precisaDaVariavel("TIDB_USER"),
    password: precisaDaVariavel("TIDB_PASSWORD"),
    ...(comBanco ? { database: precisaDaVariavel("TIDB_DATABASE") } : {}),
    ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
    // Datas voltam como texto "AAAA-MM-DD HH:MM:SS" em vez de objeto Date.
    // Evita que o fuso horário do servidor da Vercel (UTC) desloque em
    // algumas horas uma data que foi digitada no Brasil.
    dateStrings: true,
  };
}

/**
 * Pool reaproveitado entre requisições da mesma instância da função.
 * Em ambiente serverless cada instância vive pouco, então o pool é
 * pequeno de propósito — não adianta segurar muitas conexões abertas.
 */
let pool: mysql.Pool | null = null;

export function obterPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      ...configuracaoBase(true),
      connectionLimit: 5,
      waitForConnections: true,
      maxIdle: 2,
      idleTimeout: 30_000,
      enableKeepAlive: true,
    });
  }
  return pool;
}

/** Consulta comum do dia a dia (já dentro do banco "sgp"). */
export async function consultar<T extends RowDataPacket>(
  sql: string,
  parametros: ValorSql[] = []
): Promise<T[]> {
  const [linhas] = await obterPool().execute<T[]>(sql, parametros);
  return linhas;
}

/**
 * Conexão avulsa SEM escolher o banco — usada só na criação inicial,
 * quando o banco "sgp" ainda não existe e portanto não dá para conectar
 * direto nele. Quem chama é responsável por fechar.
 */
export async function conectarSemBanco(): Promise<mysql.Connection> {
  return mysql.createConnection(configuracaoBase(false));
}
