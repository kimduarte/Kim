import type { RowDataPacket } from "mysql2";
import type mysql from "mysql2/promise";
import { conectarSemBanco } from "@/lib/db";
import { gerarHash, gerarId, gerarSenhaProvisoria, textosIguais } from "@/lib/produtividade/senha";
import { encerrarSessoesDe } from "@/lib/produtividade/sessao";
import { prepararTabelas } from "@/lib/produtividade/tabelas";
import { agoraBanco } from "@/lib/produtividade/tempo";

/**
 * Preparação da produtividade: cria as tabelas "prod_" (se faltarem) e a
 * primeira conta da coordenação. Abre só com o link que tem o SETUP_TOKEN.
 *
 * Serve também para recuperar o acesso se a coordenação esquecer a senha:
 * gera uma senha provisória nova para uma conta da coordenação.
 *
 * Rodar de novo é seguro: nada que já existe é apagado.
 */

export const dynamic = "force-dynamic";

const NOME_BANCO = process.env.TIDB_DATABASE || "sgp";

function esc(t: unknown): string {
  return String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function pagina(titulo: string, corpo: string, status = 200): Response {
  return new Response(
    `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${esc(titulo)}</title>
<style>
  body{margin:0;padding:40px 16px;background:#f2f2f7;color:#1d1d1f;font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
  .caixa{max-width:620px;margin:0 auto;background:#fff;border-radius:16px;padding:26px 28px}
  h1{font-size:22px;margin:0 0 14px;letter-spacing:-.01em} h2{font-size:16px;margin:26px 0 8px}
  ul{padding-left:20px;margin:8px 0} li{margin:3px 0}
  .ok{color:#248a3d} .erro{color:#d70015}
  .destaque{background:#e8f1fd;border-radius:12px;padding:14px 16px;margin:14px 0;color:#0b3d7a}
  .senha{font:600 22px/1.3 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.04em;color:#1d1d1f;background:#fff;border-radius:8px;padding:8px 12px;display:inline-block;margin:6px 0}
  label{display:block;font-size:13px;font-weight:600;color:#6e6e73;margin:12px 0 4px}
  input,select{box-sizing:border-box;width:100%;height:40px;border:1px solid #d2d2d7;border-radius:8px;padding:0 12px;font:inherit}
  button{margin-top:16px;height:40px;padding:0 18px;border:0;border-radius:9px;background:#0071e3;color:#fff;font:600 15px system-ui,sans-serif;cursor:pointer}
  a{color:#0071e3} code{background:#f2f2f7;padding:2px 6px;border-radius:5px;font-size:13px}
  .nota{font-size:13px;color:#6e6e73}
</style></head><body><div class="caixa">${corpo}</div></body></html>`,
    {
      status,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        // O link tem o código de segurança: não pode vazar para outro site.
        "referrer-policy": "no-referrer",
        "x-frame-options": "DENY",
        "x-content-type-options": "nosniff",
      },
    }
  );
}

function tokenConfere(recebido: string | null): Response | null {
  const esperado = process.env.SETUP_TOKEN;
  if (!esperado) {
    return pagina("Configuração incompleta", `<h1 class="erro">Falta configurar o SETUP_TOKEN</h1><p>A variável de ambiente <code>SETUP_TOKEN</code> não está definida na Vercel.</p>`, 500);
  }
  if (!recebido || !textosIguais(recebido, esperado)) {
    return pagina("Acesso negado", `<h1 class="erro">Link inválido</h1><p>Esta página só abre com o link completo, que inclui o código de segurança.</p>`, 403);
  }
  return null;
}

async function abrirBanco(): Promise<{ conexao: mysql.Connection; feito: string[] }> {
  const conexao = await conectarSemBanco();
  await conexao.query(`CREATE DATABASE IF NOT EXISTS \`${NOME_BANCO}\` DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_general_ci`);
  await conexao.query(`USE \`${NOME_BANCO}\``);
  const feito = await prepararTabelas(conexao);
  return { conexao, feito };
}

async function situacao(conexao: mysql.Connection) {
  const [usuarios] = await conexao.query<RowDataPacket[]>(`SELECT nome, email, papel, ativo FROM prod_usuarios ORDER BY nome`);
  const [registros] = await conexao.query<RowDataPacket[]>(`SELECT COUNT(*) AS n FROM prod_registros WHERE excluido = 0`);
  const coordenacao = usuarios.filter((u) => u.papel === "coordenacao" && u.ativo);
  return { usuarios, coordenacao, registros: Number(registros[0]?.n) || 0 };
}

function formularios(token: string, coordenacao: RowDataPacket[]): string {
  const campoToken = `<input type="hidden" name="token" value="${esc(token)}">`;
  if (!coordenacao.length) {
    return `<h2>Criar a conta da coordenação</h2>
      <p>É a pessoa que vai cadastrar a equipe, distribuir as UFs e consolidar os números. O sistema gera uma senha provisória, que ela troca no primeiro acesso.</p>
      <form method="post">${campoToken}<input type="hidden" name="acao" value="criar">
        <label for="nome">Nome</label><input id="nome" name="nome" required maxlength="80" autocomplete="off">
        <label for="email">E-mail</label><input id="email" name="email" type="email" required maxlength="120" autocomplete="off">
        <button type="submit">Criar conta da coordenação</button>
      </form>`;
  }
  return `<h2>Coordenação esqueceu a senha?</h2>
    <p class="nota">Gera uma senha provisória nova para uma conta da coordenação. As outras pessoas da equipe pedem senha nova à coordenação, dentro do sistema.</p>
    <form method="post">${campoToken}<input type="hidden" name="acao" value="redefinir">
      <label for="email">Conta</label><select id="email" name="email">${coordenacao.map((u) => `<option value="${esc(u.email)}">${esc(u.nome)} (${esc(u.email)})</option>`).join("")}</select>
      <button type="submit">Gerar senha provisória</button>
    </form>`;
}

function blocoSituacao(feito: string[], s: Awaited<ReturnType<typeof situacao>>): string {
  return `<ul>${feito.map((f) => `<li class="ok">✓ ${esc(f)}</li>`).join("")}</ul>
    <div class="destaque">Contas cadastradas: <strong>${s.usuarios.length}</strong>
      (coordenação ativa: <strong>${s.coordenacao.length}</strong>) · Registros de produção: <strong>${s.registros}</strong></div>`;
}

function erroTecnico(erro: unknown): Response {
  const mensagem = erro instanceof Error ? erro.message : String(erro);
  return pagina("Erro", `<h1 class="erro">Não consegui preparar a produtividade</h1>
    <div class="destaque"><strong>Mensagem técnica:</strong><br><code>${esc(mensagem)}</code></div>
    <p>Mande esta mensagem para o Claude — ela diz o que ajustar.</p>`, 500);
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const negado = tokenConfere(token);
  if (negado) return negado;
  try {
    const { conexao, feito } = await abrirBanco();
    try {
      const s = await situacao(conexao);
      return pagina("Produtividade preparada", `<h1>Produtividade do Passivo Veicular</h1>
        <p>O banco está pronto. As tabelas da produtividade são separadas das de veículos.</p>
        ${blocoSituacao(feito, s)}
        ${s.coordenacao.length ? `<p>Para usar o sistema, abra <a href="/produtividade">/produtividade</a>.</p>` : ""}
        ${formularios(token!, s.coordenacao)}`);
    } finally {
      await conexao.end();
    }
  } catch (erro) {
    return erroTecnico(erro);
  }
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return pagina("Pedido inválido", `<h1 class="erro">Pedido inválido</h1>`, 400);
  }
  const token = String(form.get("token") || "");
  const negado = tokenConfere(token);
  if (negado) return negado;
  const acao = String(form.get("acao") || "");
  const voltar = `<p><a href="?token=${encodeURIComponent(token)}">Voltar</a></p>`;
  try {
    const { conexao } = await abrirBanco();
    try {
      const s = await situacao(conexao);
      const senha = gerarSenhaProvisoria();
      const agora = agoraBanco();
      let nome = "";
      let email = String(form.get("email") || "").trim().toLowerCase();

      if (acao === "criar") {
        nome = String(form.get("nome") || "").trim().replace(/\s+/g, " ");
        if (s.coordenacao.length) return pagina("Já existe", `<h1>A coordenação já tem conta</h1><p>Novas contas são criadas dentro do sistema, em Equipe e UFs.</p>${voltar}`, 409);
        if (!nome || nome.length > 80 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) {
          return pagina("Dados incompletos", `<h1 class="erro">Confira o nome e o e-mail</h1>${voltar}`, 400);
        }
        const [existe] = await conexao.execute<RowDataPacket[]>(`SELECT id FROM prod_usuarios WHERE email = ?`, [email]);
        const hash = await gerarHash(senha);
        if (existe.length) {
          await conexao.execute(
            `UPDATE prod_usuarios SET nome = ?, papel = 'coordenacao', ativo = 1, senha_hash = ?, trocar_senha = 1, falhas = 0, bloqueado_ate = NULL, atualizado_em = ? WHERE id = ?`,
            [nome, hash, agora, existe[0].id]
          );
        } else {
          await conexao.execute(
            `INSERT INTO prod_usuarios (id, nome, email, senha_hash, papel, ativo, cor, trocar_senha, falhas, criado_em, atualizado_em)
             VALUES (?, ?, ?, ?, 'coordenacao', 1, 0, 1, 0, ?, ?)`,
            [gerarId(), nome, email, hash, agora, agora]
          );
        }
      } else if (acao === "redefinir") {
        const alvo = s.coordenacao.find((u) => u.email === email);
        if (!alvo) return pagina("Conta não encontrada", `<h1 class="erro">Conta da coordenação não encontrada</h1>${voltar}`, 404);
        nome = alvo.nome;
        const [linha] = await conexao.execute<RowDataPacket[]>(`SELECT id FROM prod_usuarios WHERE email = ?`, [email]);
        await conexao.execute(
          `UPDATE prod_usuarios SET senha_hash = ?, trocar_senha = 1, falhas = 0, bloqueado_ate = NULL, atualizado_em = ? WHERE email = ?`,
          [await gerarHash(senha), agora, email]
        );
        await encerrarSessoesDe(linha[0].id);
      } else {
        return pagina("Pedido inválido", `<h1 class="erro">Pedido inválido</h1>${voltar}`, 400);
      }

      return pagina("Senha provisória", `<h1 class="ok">Pronto</h1>
        <p>Conta da coordenação: <strong>${esc(nome)}</strong> (${esc(email)}).</p>
        <div class="destaque">Senha provisória:<br><span class="senha">${esc(senha)}</span><br>
          Anote agora: ela não aparece de novo. No primeiro acesso o sistema pede para criar uma senha definitiva.</div>
        <p>Entre em <a href="/produtividade">/produtividade</a> com esse e-mail e essa senha.</p>`);
    } finally {
      await conexao.end();
    }
  } catch (erro) {
    return erroTecnico(erro);
  }
}
