import type { RowDataPacket } from "mysql2";
import { consultar, obterPool } from "@/lib/db";
import { HORAS_SESSAO, type Papel } from "./constantes";
import { gerarToken, hashDoToken } from "./senha";
import { agoraBanco } from "./tempo";

/**
 * Entrada no sistema. O navegador guarda um código aleatório num cookie que
 * o JavaScript da página não consegue ler (HttpOnly) e que só viaja por
 * HTTPS (Secure). O banco guarda apenas o SHA-256 desse código: quem lesse a
 * tabela de sessões não conseguiria se passar por ninguém.
 */

export const NOME_COOKIE = "__Host-passivo";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  ativo: boolean;
  cor: number;
  trocarSenha: boolean;
}

interface LinhaUsuario extends RowDataPacket {
  id: string;
  nome: string;
  email: string;
  papel: string;
  ativo: number;
  cor: number;
  trocar_senha: number;
}

export function linhaParaUsuario(l: LinhaUsuario): Usuario {
  return {
    id: l.id,
    nome: l.nome,
    email: l.email,
    papel: l.papel === "coordenacao" ? "coordenacao" : "servidor",
    ativo: !!l.ativo,
    cor: Number(l.cor) || 0,
    trocarSenha: !!l.trocar_senha,
  };
}

export function lerCookie(request: Request): string | null {
  const cabecalho = request.headers.get("cookie") || "";
  for (const parte of cabecalho.split(";")) {
    const i = parte.indexOf("=");
    if (i < 0) continue;
    if (parte.slice(0, i).trim() === NOME_COOKIE) return decodeURIComponent(parte.slice(i + 1).trim());
  }
  return null;
}

export function cookieDaSessao(token: string): string {
  return `${NOME_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${HORAS_SESSAO * 3600}`;
}

export function cookieApagado(): string {
  return `${NOME_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function criarSessao(usuarioId: string): Promise<string> {
  const token = gerarToken();
  const agora = agoraBanco();
  const pool = obterPool();
  // Aproveita para limpar sessões vencidas de todo mundo.
  await pool.execute(`DELETE FROM prod_sessoes WHERE expira_em < ?`, [agora]);
  await pool.execute(
    `INSERT INTO prod_sessoes (token_hash, usuario_id, criada_em, expira_em) VALUES (?, ?, ?, ?)`,
    [hashDoToken(token), usuarioId, agora, agoraBanco(HORAS_SESSAO * 60)]
  );
  return token;
}

/**
 * Quem está usando. Devolve null se não há sessão, se venceu, ou se a pessoa
 * foi desativada. Quando falta menos de HORAS_SESSAO-1 horas, estica o prazo
 * (no máximo uma escrita por hora por pessoa) e avisa para renovar o cookie.
 */
export async function usuarioDaSessao(token: string | null): Promise<{ usuario: Usuario; renovar: boolean } | null> {
  if (!token || token.length > 100) return null;
  const agora = agoraBanco();
  const linhas = await consultar<LinhaUsuario & { expira_em: string }>(
    `SELECT u.id, u.nome, u.email, u.papel, u.ativo, u.cor, u.trocar_senha, s.expira_em
       FROM prod_sessoes s JOIN prod_usuarios u ON u.id = s.usuario_id
      WHERE s.token_hash = ? AND s.expira_em > ?`,
    [hashDoToken(token), agora]
  );
  const l = linhas[0];
  if (!l || !l.ativo) return null;
  const renovar = String(l.expira_em) < agoraBanco((HORAS_SESSAO - 1) * 60);
  if (renovar) {
    await obterPool().execute(`UPDATE prod_sessoes SET expira_em = ? WHERE token_hash = ?`, [
      agoraBanco(HORAS_SESSAO * 60),
      hashDoToken(token),
    ]);
  }
  return { usuario: linhaParaUsuario(l), renovar };
}

export async function encerrarSessao(token: string | null): Promise<void> {
  if (!token) return;
  await obterPool().execute(`DELETE FROM prod_sessoes WHERE token_hash = ?`, [hashDoToken(token)]);
}

/** Tira todo mundo que estiver entrado com esta conta (menos, se pedido, a sessão atual). */
export async function encerrarSessoesDe(usuarioId: string, excetoToken?: string | null): Promise<void> {
  if (excetoToken) {
    await obterPool().execute(`DELETE FROM prod_sessoes WHERE usuario_id = ? AND token_hash <> ?`, [
      usuarioId,
      hashDoToken(excetoToken),
    ]);
  } else {
    await obterPool().execute(`DELETE FROM prod_sessoes WHERE usuario_id = ?`, [usuarioId]);
  }
}
