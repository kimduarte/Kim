import * as acoes from "./acoes";
import { ErroApp, type Contexto, type Corpo, type Resultado } from "./acoes";
import { cookieDaSessao, lerCookie, usuarioDaSessao } from "./sessao";

/**
 * Porta de entrada de /api/produtividade/<acao>. Aqui ficam as conferências
 * que valem para todas as ações:
 *
 * - quem está entrado (cookie de sessão) e se pode fazer aquilo;
 * - pedidos que alteram dados só vêm em JSON e da própria página — um site de
 *   fora não consegue disparar uma alteração usando a sessão de alguém;
 * - erro inesperado vira mensagem simples; o detalhe vai para o registro da
 *   Vercel, não para a tela.
 */

type Acesso = "publico" | "qualquer" | "coordenacao";

interface Definicao {
  metodo: "GET" | "POST";
  acesso: Acesso;
  /** Pode ser usada por quem ainda está com senha provisória. */
  comSenhaProvisoria?: boolean;
  fn: (corpo: Corpo, ctx: Contexto) => Promise<Resultado>;
}

const ACOES: Record<string, Definicao> = {
  entrar: { metodo: "POST", acesso: "publico", fn: (c) => acoes.entrar(c) },
  sair: { metodo: "POST", acesso: "qualquer", comSenhaProvisoria: true, fn: acoes.sair },
  "trocar-senha": { metodo: "POST", acesso: "qualquer", comSenhaProvisoria: true, fn: acoes.trocarSenha },
  estado: { metodo: "GET", acesso: "qualquer", comSenhaProvisoria: true, fn: acoes.estado },
  registro: { metodo: "POST", acesso: "qualquer", fn: acoes.salvarRegistro },
  "excluir-registro": { metodo: "POST", acesso: "qualquer", fn: acoes.excluirRegistro },
  usuario: { metodo: "POST", acesso: "coordenacao", fn: acoes.salvarUsuario },
  "usuario-ativo": { metodo: "POST", acesso: "coordenacao", fn: acoes.ativarUsuario },
  "redefinir-senha": { metodo: "POST", acesso: "coordenacao", fn: acoes.redefinirSenha },
  uf: { metodo: "POST", acesso: "coordenacao", fn: (c) => acoes.atribuirUf(c) },
  atividade: { metodo: "POST", acesso: "coordenacao", fn: (c) => acoes.salvarAtividade(c) },
  "atividade-ativa": { metodo: "POST", acesso: "coordenacao", fn: (c) => acoes.ativarAtividade(c) },
  setor: { metodo: "POST", acesso: "coordenacao", fn: (c) => acoes.salvarSetor(c) },
};

const TAMANHO_MAXIMO_PEDIDO = 32 * 1024;

function resposta(dados: unknown, status: number, cookies: string[] = []): Response {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  for (const c of cookies) headers.append("set-cookie", c);
  return new Response(JSON.stringify(dados), { status, headers });
}

function mesmaOrigem(request: Request): boolean {
  const origem = request.headers.get("origin");
  if (!origem) {
    // Navegadores sempre mandam Origin em POST feito por fetch. Sem ele, só
    // aceita se o Referer (quando existe) for da mesma página.
    const referer = request.headers.get("referer");
    if (!referer) return true;
    try {
      return new URL(referer).host === hostDoPedido(request);
    } catch {
      return false;
    }
  }
  try {
    return new URL(origem).host === hostDoPedido(request);
  } catch {
    return false;
  }
}

function hostDoPedido(request: Request): string {
  return request.headers.get("x-forwarded-host") || request.headers.get("host") || new URL(request.url).host;
}

async function lerCorpo(request: Request): Promise<Corpo> {
  const tipo = request.headers.get("content-type") || "";
  if (!tipo.toLowerCase().startsWith("application/json")) throw new ErroApp(415, "Pedido em formato inesperado.");
  const texto = await request.text();
  if (texto.length > TAMANHO_MAXIMO_PEDIDO) throw new ErroApp(413, "Pedido grande demais.");
  try {
    const corpo = JSON.parse(texto || "{}");
    if (!corpo || typeof corpo !== "object" || Array.isArray(corpo)) throw new Error("não é objeto");
    return corpo as Corpo;
  } catch {
    throw new ErroApp(400, "Pedido em formato inesperado.");
  }
}

export async function tratar(request: Request, nomeAcao: string, metodo: "GET" | "POST"): Promise<Response> {
  const def = Object.prototype.hasOwnProperty.call(ACOES, nomeAcao) ? ACOES[nomeAcao] : undefined;
  if (!def) return resposta({ erro: "Endereço não encontrado." }, 404);
  if (def.metodo !== metodo) return resposta({ erro: "Método não permitido." }, 405);

  const cookies: string[] = [];
  try {
    let corpo: Corpo = {};
    if (metodo === "POST") {
      if (!mesmaOrigem(request)) throw new ErroApp(403, "Pedido recusado: não veio da página do sistema.");
      corpo = await lerCorpo(request);
    }

    let ctx: Contexto | null = null;
    if (def.acesso !== "publico") {
      const token = lerCookie(request);
      const sessao = await usuarioDaSessao(token);
      if (!sessao || !token) throw new ErroApp(401, "Sua sessão terminou. Entre de novo.", "sessao");
      if (sessao.renovar) cookies.push(cookieDaSessao(token));
      if (sessao.usuario.trocarSenha && !def.comSenhaProvisoria) {
        throw new ErroApp(403, "Crie a sua senha antes de continuar.", "trocar_senha");
      }
      if (def.acesso === "coordenacao" && sessao.usuario.papel !== "coordenacao") {
        throw new ErroApp(403, "Só a coordenação pode fazer isso.");
      }
      ctx = { usuario: sessao.usuario, token };
    }

    const r = await def.fn(corpo, ctx as Contexto);
    if (r.cookie) cookies.push(r.cookie);
    return resposta(r.dados, 200, cookies);
  } catch (erro) {
    if (erro instanceof ErroApp) {
      return resposta({ erro: erro.message, ...(erro.codigo ? { codigo: erro.codigo } : {}) }, erro.status, cookies);
    }
    console.error(`[produtividade] erro em ${nomeAcao}:`, erro);
    return resposta({ erro: "Não foi possível concluir agora. Tente de novo em instantes." }, 500, cookies);
  }
}
