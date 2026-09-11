import type { RowDataPacket } from "mysql2";
import { obterPool } from "@/lib/db";
import { COLUNAS, type Coluna } from "@/lib/colunas-veiculos";

/**
 * Recebe os veículos da planilha e grava no banco.
 *
 * Por que assim, e não subindo um CSV no painel do TiDB: o repositório do
 * projeto é PÚBLICO, então os dados reais (chassi, RENAVAM, CNPJ, endereços)
 * não podem passar por ele. Aqui os dados vão direto da planilha da Kim para
 * o banco dela, sem parar em lugar nenhum no meio do caminho.
 *
 * Quem chama é o script "EnviarParaOSite.gs", colado no editor do Apps
 * Script da planilha. Ele manda os veículos em lotes, porque uma função da
 * Vercel tem tempo limitado para responder — 3.851 de uma vez não caberia.
 *
 * São duas passadas, de propósito:
 *   1ª  acao="validar" — confere TODOS os lotes sem gravar nada.
 *   2ª  acao="gravar"  — só acontece se a 1ª não achou nenhum problema.
 * Assim nunca sobra meia base importada porque um registro no meio do
 * caminho tinha um campo fora do formato.
 *
 * Rodar de novo é seguro: grava com REPLACE, que substitui o veículo de
 * mesmo ID em vez de criar um segundo. Serve também para ressincronizar
 * durante o período em que os dois sistemas vão rodar em paralelo.
 */

export const dynamic = "force-dynamic";
// Uma função da Vercel no plano Hobby pode demorar até 60 segundos para
// responder. Um lote leva poucos segundos; a folga é para o caso de o banco
// estar lento na hora.
export const maxDuration = 60;

const TABELA = "veiculos";

/** Tamanho de lote que o script deve usar. O script lê isto do GET. */
export const TAMANHO_LOTE = 200;

// ---------------------------------------------------------------------
// Conversão de cada valor da planilha para o que o banco espera
// ---------------------------------------------------------------------

type ValorBanco = string | number | null;

interface Problema {
  linhaPlanilha: number;
  id: string;
  campo: string;
  motivo: string;
}

/** "AAAA-MM-DD HH:MM:SS" — o formato que o script envia. */
const FORMATO_DATA = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;

function dataValida(texto: string): boolean {
  const partes = FORMATO_DATA.exec(texto);
  if (!partes) return false;
  const [, ano, mes, dia, hora, minuto, segundo] = partes.map(Number) as unknown as number[];
  if (ano < 1900 || ano > 2200) return false;
  if (mes < 1 || mes > 12) return false;
  if (hora > 23 || minuto > 59 || segundo > 59) return false;
  // Confere o dia contra o mês de verdade (pega 31/02, 30/02, ano bissexto).
  const diasNoMes = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  return dia >= 1 && dia <= diasNoMes;
}

function normalizarSimNao(bruto: unknown): string | null {
  if (bruto === true) return "SIM";
  if (bruto === false) return "NÃO";
  const texto = String(bruto ?? "").trim().toUpperCase();
  // Vazio conta como "NÃO" — é assim que o sistema atual sempre leu esses
  // campos, e a coluna no banco não aceita ficar sem valor.
  if (!texto) return "NÃO";
  if (["SIM", "S", "TRUE", "1"].includes(texto)) return "SIM";
  if (["NÃO", "NAO", "N", "FALSE", "0"].includes(texto)) return "NÃO";
  return null; // não é SIM nem NÃO: vira problema
}

/**
 * Converte um valor. Devolve o valor pronto para o banco, ou uma explicação
 * do que está errado — em português, porque quem vai ler o relatório é a Kim.
 */
function converterValor(
  coluna: Coluna,
  bruto: unknown
): { valor: ValorBanco } | { erro: string } {
  switch (coluna.tipo) {
    case "simnao": {
      const valor = normalizarSimNao(bruto);
      if (valor === null) {
        return { erro: `esperava SIM ou NÃO, veio "${String(bruto)}"` };
      }
      return { valor };
    }

    case "data": {
      const texto = String(bruto ?? "").trim();
      if (!texto) return { valor: null };
      if (!dataValida(texto)) {
        return { erro: `data fora do formato ou inexistente: "${texto}"` };
      }
      return { valor: texto };
    }

    case "inteiro": {
      const texto = String(bruto ?? "").trim();
      if (!texto) return { valor: null };
      if (!/^-?\d+$/.test(texto)) {
        return { erro: `esperava um número inteiro, veio "${texto}"` };
      }
      const numero = Number(texto);
      // "Ano" é SMALLINT no banco; os outros inteiros são INT. O limite
      // menor dos dois é o que vale para não estourar a coluna.
      const limite = coluna.banco === "ano" ? 32767 : 2147483647;
      if (Math.abs(numero) > limite) {
        return { erro: `número grande demais para este campo: ${texto}` };
      }
      return { valor: numero };
    }

    case "decimal": {
      if (bruto === "" || bruto === null || bruto === undefined) {
        return { valor: null };
      }
      const numero = typeof bruto === "number" ? bruto : Number(String(bruto).trim());
      if (!Number.isFinite(numero)) {
        return { erro: `esperava um valor em reais, veio "${String(bruto)}"` };
      }
      if (Math.abs(numero) > 9_999_999_999.99) {
        return { erro: `valor alto demais para este campo: ${numero}` };
      }
      // O banco guarda com 2 casas; arredonda aqui para o número gravado ser
      // exatamente o que a conferência vai somar depois.
      return { valor: Math.round(numero * 100) / 100 };
    }

    default: {
      const texto = String(bruto ?? "").trim();
      if (!texto) return { valor: null };
      if (coluna.limite && texto.length > coluna.limite) {
        return {
          erro:
            `tem ${texto.length} caracteres, mas o campo só aceita ${coluna.limite}. ` +
            `Começa com: "${texto.slice(0, 40)}…"`,
        };
      }
      return { valor: texto };
    }
  }
}

// ---------------------------------------------------------------------
// Entrada
// ---------------------------------------------------------------------

interface CorpoPedido {
  acao?: string;
  colunas?: unknown;
  linhas?: unknown;
}

function respostaJson(dados: unknown, status = 200): Response {
  return new Response(JSON.stringify(dados), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function tokenConfere(request: Request): boolean {
  const esperado = process.env.SETUP_TOKEN;
  if (!esperado) return false;
  const url = new URL(request.url);
  const recebido = url.searchParams.get("token") || request.headers.get("x-token");
  return recebido === esperado;
}

export async function POST(request: Request) {
  if (!process.env.SETUP_TOKEN) {
    return respostaJson(
      { ok: false, erro: "SETUP_TOKEN não está configurado na Vercel." },
      500
    );
  }
  if (!tokenConfere(request)) {
    return respostaJson({ ok: false, erro: "Código de segurança inválido." }, 403);
  }

  let corpo: CorpoPedido;
  try {
    corpo = (await request.json()) as CorpoPedido;
  } catch {
    return respostaJson({ ok: false, erro: "Não consegui ler o conteúdo enviado." }, 400);
  }

  const acao = String(corpo.acao || "");

  if (acao === "limpar") {
    try {
      await obterPool().query(`DELETE FROM \`${TABELA}\``);
      const linhas = await contar();
      return respostaJson({ ok: true, acao, restaram: linhas.total });
    } catch (erro) {
      return respostaJson({ ok: false, erro: mensagemDe(erro) }, 500);
    }
  }

  if (acao !== "validar" && acao !== "gravar") {
    return respostaJson(
      { ok: false, erro: `Ação desconhecida: "${acao}". Use validar, gravar ou limpar.` },
      400
    );
  }

  // --- confere o formato do que chegou -------------------------------
  if (!Array.isArray(corpo.colunas) || !Array.isArray(corpo.linhas)) {
    return respostaJson({ ok: false, erro: "Faltou a lista de colunas ou de linhas." }, 400);
  }
  const nomesRecebidos = corpo.colunas.map((n) => String(n));
  const linhas = corpo.linhas as unknown[][];

  const faltando = COLUNAS.filter((c) => !nomesRecebidos.includes(c.planilha));
  if (faltando.length) {
    return respostaJson(
      {
        ok: false,
        erro:
          `A planilha não tem estas colunas: ${faltando.map((c) => c.planilha).join(", ")}. ` +
          `Abra a aba "Veiculos" e confira a linha 1.`,
      },
      400
    );
  }

  // Posição de cada coluna dentro das linhas recebidas — por NOME, para o
  // envio continuar certo mesmo que a ordem das colunas na planilha mude.
  const posicao = new Map<string, number>();
  COLUNAS.forEach((c) => posicao.set(c.banco, nomesRecebidos.indexOf(c.planilha)));

  // --- converte e valida ---------------------------------------------
  const problemas: Problema[] = [];
  const prontas: ValorBanco[][] = [];
  const idsVistos = new Set<string>();

  for (const linha of linhas) {
    if (!Array.isArray(linha) || linha.length < 2) continue;
    // A última posição de cada linha é o número da linha na planilha, que o
    // script anexa só para o relatório de problemas poder apontar o lugar.
    const numeroLinha = Number(linha[linha.length - 1]) || 0;
    const celulas = linha.slice(0, -1);

    const id = String(celulas[posicao.get("id")!] ?? "").trim();
    if (!id) {
      problemas.push({
        linhaPlanilha: numeroLinha,
        id: "(sem ID)",
        campo: "ID",
        motivo: "está em branco — todo veículo precisa de um ID",
      });
      continue;
    }
    if (idsVistos.has(id)) {
      problemas.push({
        linhaPlanilha: numeroLinha,
        id,
        campo: "ID",
        motivo: "este ID aparece mais de uma vez no mesmo envio",
      });
      continue;
    }
    idsVistos.add(id);

    const valores: ValorBanco[] = [];
    let linhaOk = true;

    for (const coluna of COLUNAS) {
      const resultado = converterValor(coluna, celulas[posicao.get(coluna.banco)!]);
      if ("erro" in resultado) {
        problemas.push({
          linhaPlanilha: numeroLinha,
          id,
          campo: coluna.planilha,
          motivo: resultado.erro,
        });
        linhaOk = false;
        continue;
      }
      valores.push(resultado.valor);
    }

    if (linhaOk) prontas.push(valores);
  }

  if (problemas.length) {
    return respostaJson(
      {
        ok: false,
        acao,
        gravou: false,
        totalProblemas: problemas.length,
        // Manda no máximo 50: o suficiente para entender o padrão sem
        // estourar o tamanho da resposta.
        problemas: problemas.slice(0, 50),
      },
      422
    );
  }

  if (acao === "validar") {
    return respostaJson({ ok: true, acao, gravou: false, conferidos: prontas.length });
  }

  // --- grava ----------------------------------------------------------
  try {
    const campos = COLUNAS.map((c) => `\`${c.banco}\``).join(", ");
    // REPLACE e não INSERT: se este veículo já estiver no banco (porque o
    // envio foi repetido), o registro é substituído em vez de dar erro de
    // ID duplicado. Uma única ida ao banco por lote.
    const sql = `REPLACE INTO \`${TABELA}\` (${campos}) VALUES ?`;
    await obterPool().query(sql, [prontas]);
    return respostaJson({ ok: true, acao, gravou: true, gravados: prontas.length });
  } catch (erro) {
    return respostaJson({ ok: false, acao, gravou: false, erro: mensagemDe(erro) }, 500);
  }
}

// ---------------------------------------------------------------------
// Conferência — página que a Kim abre no navegador no final
// ---------------------------------------------------------------------

interface Contagem {
  total: number;
  ativos: number;
  excluidos: number;
  transferidos: number;
  comValor: number;
  somaValor: number;
  primeiroId: string | null;
  ultimoId: string | null;
}

async function contar(): Promise<Contagem> {
  const [linhas] = await obterPool().query<RowDataPacket[]>(
    `SELECT
       COUNT(*)                                              AS total,
       SUM(CASE WHEN excluido  <> 'SIM' THEN 1 ELSE 0 END)   AS ativos,
       SUM(CASE WHEN excluido   = 'SIM' THEN 1 ELSE 0 END)   AS excluidos,
       SUM(CASE WHEN transferido = 'SIM' THEN 1 ELSE 0 END)  AS transferidos,
       SUM(CASE WHEN valor_veiculo > 0 THEN 1 ELSE 0 END)    AS com_valor,
       COALESCE(SUM(valor_veiculo), 0)                       AS soma_valor,
       MIN(id)                                               AS primeiro_id,
       MAX(id)                                               AS ultimo_id
     FROM \`${TABELA}\``
  );
  const l = linhas[0] || {};
  return {
    total: Number(l.total || 0),
    ativos: Number(l.ativos || 0),
    excluidos: Number(l.excluidos || 0),
    transferidos: Number(l.transferidos || 0),
    comValor: Number(l.com_valor || 0),
    somaValor: Number(l.soma_valor || 0),
    primeiroId: l.primeiro_id ?? null,
    ultimoId: l.ultimo_id ?? null,
  };
}

function mensagemDe(erro: unknown): string {
  return erro instanceof Error ? erro.message : String(erro);
}

function escapar(texto: string): string {
  return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function pagina(corpo: string, sucesso: boolean): Response {
  const cor = sucesso ? "#1e7f4f" : "#b3261e";
  return new Response(
    `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
     <meta name="viewport" content="width=device-width,initial-scale=1">
     <title>Conferência da importação</title>
     <style>
       body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;
            background:#f4f6f9;color:#1c1c1c;line-height:1.55;margin:0;padding:40px 20px}
       .caixa{max-width:680px;margin:0 auto;background:#fff;border:1px solid #e0e3e8;
              border-radius:14px;padding:28px}
       h1{font-size:20px;margin:0 0 16px;color:${cor}}
       table{border-collapse:collapse;width:100%;margin:16px 0;font-size:14px}
       th,td{text-align:left;padding:9px 12px;border-bottom:1px solid #eceef2}
       th{width:60%;font-weight:500;color:#4a4f57}
       td{text-align:right;font-variant-numeric:tabular-nums;font-weight:600}
       code{background:#f0f2f5;padding:2px 6px;border-radius:4px;font-size:13px}
     </style></head><body><div class="caixa">${corpo}</div></body></html>`,
    { status: sucesso ? 200 : 500, headers: { "content-type": "text/html; charset=utf-8" } }
  );
}

export async function GET(request: Request) {
  if (!process.env.SETUP_TOKEN) {
    return pagina(
      `<h1>Falta configurar o SETUP_TOKEN</h1>
       <p>A variável <code>SETUP_TOKEN</code> não está definida na Vercel.</p>`,
      false
    );
  }
  if (!tokenConfere(request)) {
    return pagina(
      `<h1>Link inválido</h1>
       <p>Esta página só abre com o link completo, que inclui o código de segurança.</p>`,
      false
    );
  }

  // Deixa o script do Apps Script perguntar o tamanho de lote em vez de ter
  // esse número escrito em dois lugares.
  if (new URL(request.url).searchParams.get("formato") === "json") {
    try {
      return respostaJson({ ok: true, tamanhoLote: TAMANHO_LOTE, contagem: await contar() });
    } catch (erro) {
      return respostaJson({ ok: false, erro: mensagemDe(erro) }, 500);
    }
  }

  try {
    const c = await contar();
    const reais = c.somaValor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    return pagina(
      `<h1>${c.total > 0 ? "✅" : "⚠️"} O banco tem ${c.total.toLocaleString("pt-BR")} veículos</h1>
       <p>Compare estes números com a planilha antes de seguir para a próxima etapa:</p>
       <table>
         <tr><th>Total de veículos</th><td>${c.total.toLocaleString("pt-BR")}</td></tr>
         <tr><th>Ativos (fora da lixeira)</th><td>${c.ativos.toLocaleString("pt-BR")}</td></tr>
         <tr><th>Na lixeira (excluídos)</th><td>${c.excluidos.toLocaleString("pt-BR")}</td></tr>
         <tr><th>Já transferidos</th><td>${c.transferidos.toLocaleString("pt-BR")}</td></tr>
         <tr><th>Com valor preenchido</th><td>${c.comValor.toLocaleString("pt-BR")}</td></tr>
         <tr><th>Soma dos valores</th><td>${reais}</td></tr>
         <tr><th>Primeiro ID</th><td>${escapar(String(c.primeiroId ?? "—"))}</td></tr>
         <tr><th>Último ID</th><td>${escapar(String(c.ultimoId ?? "—"))}</td></tr>
       </table>
       <p>Pode fechar esta página.</p>`,
      true
    );
  } catch (erro) {
    return pagina(
      `<h1>❌ Não consegui ler o banco</h1>
       <p><code>${escapar(mensagemDe(erro))}</code></p>
       <p>Mande esta mensagem para o Claude.</p>`,
      false
    );
  }
}
