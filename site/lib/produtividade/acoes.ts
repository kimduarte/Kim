import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { consultar, obterPool } from "@/lib/db";
import {
  CATEGORIAS,
  MAX_FALHAS,
  MINUTOS_BLOQUEIO,
  SIGLAS_UF,
  TAMANHO_MINIMO_SENHA,
  type Papel,
} from "./constantes";
import {
  conferirSenha,
  gastarTempoComoSeConferisse,
  gerarHash,
  gerarId,
  gerarSenhaProvisoria,
} from "./senha";
import {
  cookieApagado,
  cookieDaSessao,
  criarSessao,
  encerrarSessao,
  encerrarSessoesDe,
  type Usuario,
} from "./sessao";
import { agoraBanco, bancoParaIso, dataValida, hojeBrasilia } from "./tempo";

/**
 * O que cada pessoa pode fazer. Toda regra de acesso mora aqui, no servidor:
 * a tela só esconde botões por conforto, quem garante é este arquivo.
 *
 * Servidor:    vê e altera só os próprios registros; registra só em nome
 *              próprio; pode registrar em UF de fora do seu leque, e o
 *              registro fica marcado (fora_do_leque = 1).
 * Coordenação: vê todos os registros, registra em nome de qualquer pessoa
 *              ativa, cadastra contas, distribui UFs e ajusta atividades.
 */

export class ErroApp extends Error {
  constructor(
    public status: number,
    mensagem: string,
    public codigo?: string
  ) {
    super(mensagem);
  }
}

export type Corpo = Record<string, unknown>;
export interface Contexto {
  usuario: Usuario;
  token: string;
}
export interface Resultado {
  dados: unknown;
  cookie?: string;
}

// ---------------------------------------------------------------------
// Conferência dos campos que chegam do navegador
// ---------------------------------------------------------------------

function texto(corpo: Corpo, campo: string, max: number, rotulo: string, obrigatorio = false): string {
  const bruto = corpo[campo];
  if (bruto !== undefined && bruto !== null && typeof bruto !== "string") {
    throw new ErroApp(400, `O campo ${rotulo} veio num formato inválido.`);
  }
  // eslint-disable-next-line no-control-regex
  const t = String(bruto ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  if (obrigatorio && !t) throw new ErroApp(400, `Preencha ${rotulo}.`);
  if (t.length > max) throw new ErroApp(400, `${capitalizar(rotulo)} pode ter no máximo ${max} caracteres.`);
  return t;
}

function capitalizar(t: string): string {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function email(corpo: Corpo): string {
  const e = texto(corpo, "email", 120, "o e-mail", true).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new ErroApp(400, "Esse e-mail não parece válido. Confira se está completo.");
  return e;
}

function uf(corpo: Corpo, campo = "uf"): string {
  const u = texto(corpo, campo, 2, "a UF").toUpperCase();
  if (u && !(SIGLAS_UF as readonly string[]).includes(u)) throw new ErroApp(400, "UF inválida.");
  return u;
}

function booleano(corpo: Corpo, campo: string): boolean {
  if (typeof corpo[campo] !== "boolean") throw new ErroApp(400, "Pedido incompleto.");
  return corpo[campo] as boolean;
}

function validarNovaSenha(nova: string, usuario: { email: string }, atual?: string): void {
  if (nova.length < TAMANHO_MINIMO_SENHA) {
    throw new ErroApp(400, `A senha nova precisa ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`);
  }
  if (nova.length > 200) throw new ErroApp(400, "A senha nova é longa demais.");
  if (atual !== undefined && nova === atual) throw new ErroApp(400, "A senha nova precisa ser diferente da atual.");
  const antesDoArroba = usuario.email.split("@")[0].toLowerCase();
  if (antesDoArroba.length >= 4 && nova.toLowerCase().includes(antesDoArroba)) {
    throw new ErroApp(400, "A senha não pode conter o seu e-mail.");
  }
  if (/^(.)\1+$/.test(nova) || ["12345678", "123456789", "1234567890", "senha123", "senha1234", "password"].includes(nova.toLowerCase())) {
    throw new ErroApp(400, "Essa senha é fácil demais de adivinhar. Escolha outra.");
  }
}

// ---------------------------------------------------------------------
// Leitura do banco, já no formato que a tela usa
// ---------------------------------------------------------------------

interface LinhaUsuarioCompleta extends RowDataPacket {
  id: string;
  nome: string;
  email: string;
  papel: string;
  ativo: number;
  cor: number;
  trocar_senha: number;
  senha_hash: string;
  falhas: number;
  bloqueado_ate: string | null;
  atualizado_em: string;
}

function usuarioParaTela(l: LinhaUsuarioCompleta | RowDataPacket) {
  return {
    id: l.id as string,
    nome: l.nome as string,
    email: l.email as string,
    papel: (l.papel === "coordenacao" ? "coordenacao" : "servidor") as Papel,
    ativo: !!l.ativo,
    corIdx: Number(l.cor) || 0,
    atualizadoEm: bancoParaIso(l.atualizado_em as string),
  };
}

function atividadeParaTela(l: RowDataPacket) {
  return {
    id: l.id as string,
    categoriaId: l.categoria as string,
    curto: l.curto as string,
    nome: l.nome as string,
    ordem: Number(l.ordem),
    ativa: !!l.ativa,
    ...(l.uf_padrao === null || l.uf_padrao === undefined ? {} : { ufPadrao: l.uf_padrao as string }),
    atualizadoEm: bancoParaIso(l.atualizado_em as string),
  };
}

const CAMPOS_REGISTRO = ["id", "data", "servidorId", "uf", "atividadeId", "qtd", "ref", "obs", "foraDoLeque", "criadoEm", "atualizadoEm"] as const;
const SELECT_REGISTRO = `SELECT id, DATE_FORMAT(data, '%Y-%m-%d') AS data, usuario_id, uf, atividade_id, qtd, ref, obs,
                                fora_do_leque, excluido, criado_em, atualizado_em FROM prod_registros`;

function registroParaLinha(l: RowDataPacket): unknown[] {
  return [l.id, l.data, l.usuario_id, l.uf, l.atividade_id, Number(l.qtd), l.ref, l.obs, l.fora_do_leque ? 1 : 0, bancoParaIso(l.criado_em), bancoParaIso(l.atualizado_em)];
}

function registroParaTela(l: RowDataPacket) {
  const linha = registroParaLinha(l);
  const r: Record<string, unknown> = Object.fromEntries(CAMPOS_REGISTRO.map((c, i) => [c, linha[i]]));
  r.foraDoLeque = !!r.foraDoLeque;
  if (l.excluido) r.excluido = true;
  return r;
}

async function buscarUsuario(id: string): Promise<LinhaUsuarioCompleta | undefined> {
  const [l] = await consultar<LinhaUsuarioCompleta>(`SELECT * FROM prod_usuarios WHERE id = ?`, [id]);
  return l;
}

async function responsavelDaUf(sigla: string): Promise<string | null> {
  const [l] = await consultar<RowDataPacket>(`SELECT usuario_id FROM prod_ufs WHERE sigla = ?`, [sigla]);
  return l ? ((l.usuario_id as string | null) ?? null) : null;
}

async function proximaCor(): Promise<number> {
  const linhas = await consultar<RowDataPacket>(`SELECT cor FROM prod_usuarios WHERE ativo = 1`);
  const usadas = new Set(linhas.map((l) => Number(l.cor)));
  for (let i = 0; i < 8; i++) if (!usadas.has(i)) return i;
  return linhas.length % 8;
}

async function coordenadoresAtivos(): Promise<number> {
  const [l] = await consultar<RowDataPacket>(`SELECT COUNT(*) AS n FROM prod_usuarios WHERE papel = 'coordenacao' AND ativo = 1`);
  return Number(l?.n) || 0;
}

// ---------------------------------------------------------------------
// Entrar, sair e senha
// ---------------------------------------------------------------------

export async function entrar(corpo: Corpo): Promise<Resultado> {
  const e = texto(corpo, "email", 120, "o e-mail").toLowerCase();
  const senha = typeof corpo.senha === "string" ? corpo.senha : "";
  if (!e || !senha) throw new ErroApp(400, "Preencha o e-mail e a senha.");
  if (senha.length > 200) throw new ErroApp(401, "E-mail ou senha incorretos.");

  const [u] = await consultar<LinhaUsuarioCompleta>(`SELECT * FROM prod_usuarios WHERE email = ?`, [e]);
  if (!u || !u.ativo) {
    await gastarTempoComoSeConferisse(senha);
    throw new ErroApp(401, "E-mail ou senha incorretos.");
  }
  const agora = agoraBanco();
  if (u.bloqueado_ate && String(u.bloqueado_ate) > agora) {
    throw new ErroApp(429, `Muitas tentativas erradas seguidas. Por segurança, esta conta fica travada por ${MINUTOS_BLOQUEIO} minutos. Tente de novo depois, ou peça à coordenação uma senha nova.`);
  }
  const pool = obterPool();
  if (!(await conferirSenha(senha, u.senha_hash))) {
    const falhas = Number(u.falhas) + 1;
    if (falhas >= MAX_FALHAS) {
      await pool.execute(`UPDATE prod_usuarios SET falhas = 0, bloqueado_ate = ? WHERE id = ?`, [agoraBanco(MINUTOS_BLOQUEIO), u.id]);
      throw new ErroApp(429, `Senha errada ${MAX_FALHAS} vezes seguidas. Por segurança, esta conta ficou travada por ${MINUTOS_BLOQUEIO} minutos.`);
    }
    await pool.execute(`UPDATE prod_usuarios SET falhas = ? WHERE id = ?`, [falhas, u.id]);
    throw new ErroApp(401, "E-mail ou senha incorretos.");
  }
  await pool.execute(`UPDATE prod_usuarios SET falhas = 0, bloqueado_ate = NULL WHERE id = ?`, [u.id]);
  const token = await criarSessao(u.id);
  return { dados: { ok: true, trocarSenha: !!u.trocar_senha }, cookie: cookieDaSessao(token) };
}

export async function sair(_corpo: Corpo, ctx: Contexto): Promise<Resultado> {
  await encerrarSessao(ctx.token);
  return { dados: { ok: true }, cookie: cookieApagado() };
}

export async function trocarSenha(corpo: Corpo, ctx: Contexto): Promise<Resultado> {
  const atual = typeof corpo.atual === "string" ? corpo.atual : "";
  const nova = typeof corpo.nova === "string" ? corpo.nova : "";
  const u = await buscarUsuario(ctx.usuario.id);
  if (!u) throw new ErroApp(401, "Sua sessão terminou. Entre de novo.", "sessao");
  if (!atual || !(await conferirSenha(atual, u.senha_hash))) throw new ErroApp(400, "A senha atual não confere.");
  validarNovaSenha(nova, u, atual);
  await obterPool().execute(
    `UPDATE prod_usuarios SET senha_hash = ?, trocar_senha = 0, falhas = 0, bloqueado_ate = NULL, atualizado_em = ? WHERE id = ?`,
    [await gerarHash(nova), agoraBanco(), u.id]
  );
  // Quem estiver entrado com a senha antiga em outro computador sai.
  await encerrarSessoesDe(u.id, ctx.token);
  return { dados: { ok: true } };
}

// ---------------------------------------------------------------------
// Tudo o que a pessoa pode ver, de uma vez
// ---------------------------------------------------------------------

export async function estado(_corpo: Corpo, ctx: Contexto): Promise<Resultado> {
  const eu = ctx.usuario;
  const usuarioTela = { id: eu.id, nome: eu.nome, email: eu.email, papel: eu.papel, corIdx: eu.cor };
  if (eu.trocarSenha) return { dados: { usuario: usuarioTela, trocarSenha: true } };

  const coord = eu.papel === "coordenacao";
  const [config, atividades, usuarios, ufs, registros] = await Promise.all([
    consultar<RowDataPacket>(`SELECT chave, valor FROM prod_config`),
    consultar<RowDataPacket>(`SELECT * FROM prod_atividades`),
    coord
      ? consultar<RowDataPacket>(`SELECT id, nome, email, papel, ativo, cor, atualizado_em FROM prod_usuarios`)
      : consultar<RowDataPacket>(`SELECT id, nome, email, papel, ativo, cor, atualizado_em FROM prod_usuarios WHERE id = ?`, [eu.id]),
    coord
      ? consultar<RowDataPacket>(`SELECT sigla, usuario_id, atualizado_em FROM prod_ufs`)
      : consultar<RowDataPacket>(`SELECT sigla, usuario_id, atualizado_em FROM prod_ufs WHERE usuario_id = ?`, [eu.id]),
    coord
      ? consultar<RowDataPacket>(`${SELECT_REGISTRO} WHERE excluido = 0`)
      : consultar<RowDataPacket>(`${SELECT_REGISTRO} WHERE excluido = 0 AND usuario_id = ?`, [eu.id]),
  ]);
  const cfg = Object.fromEntries(config.map((c) => [c.chave as string, c.valor as string]));
  return {
    dados: {
      usuario: usuarioTela,
      hoje: hojeBrasilia(),
      setor: { nome: cfg.setor_nome || "", unidade: cfg.setor_unidade || "" },
      atividades: atividades.map(atividadeParaTela),
      servidores: usuarios.map(usuarioParaTela),
      ufs: Object.fromEntries(ufs.map((l) => [l.sigla as string, { servidorId: (l.usuario_id as string | null) ?? null, em: bancoParaIso(l.atualizado_em as string) }])),
      registros: { campos: CAMPOS_REGISTRO, linhas: registros.map(registroParaLinha) },
    },
  };
}

// ---------------------------------------------------------------------
// Registros de produção
// ---------------------------------------------------------------------

async function registroVisivel(id: string, ctx: Contexto): Promise<RowDataPacket> {
  const [r] = await consultar<RowDataPacket>(`${SELECT_REGISTRO} WHERE id = ?`, [id]);
  // Para quem não pode ver, "não existe" — nem confirma que o id é válido.
  if (!r || (ctx.usuario.papel !== "coordenacao" && r.usuario_id !== ctx.usuario.id)) {
    throw new ErroApp(404, "Registro não encontrado. Ele pode ter sido apagado por outra pessoa; recarregue a página.");
  }
  return r;
}

export async function salvarRegistro(corpo: Corpo, ctx: Contexto): Promise<Resultado> {
  const eu = ctx.usuario;
  const id = texto(corpo, "id", 24, "o identificador");
  const existente = id ? await registroVisivel(id, ctx) : null;
  if (existente?.excluido) throw new ErroApp(409, "Este registro foi excluído. Recarregue a página.");

  const data = texto(corpo, "data", 10, "a data", true);
  if (!dataValida(data)) throw new ErroApp(400, "A data não é válida.");
  if (data > hojeBrasilia()) throw new ErroApp(400, "A data não pode ser no futuro.");

  const qtd = corpo.qtd;
  if (typeof qtd !== "number" || !Number.isInteger(qtd) || qtd < 1 || qtd > 9999) {
    throw new ErroApp(400, "A quantidade deve ser um número inteiro de 1 a 9999.");
  }
  const sigla = uf(corpo);
  const ref = texto(corpo, "ref", 120, "a referência");
  const obs = texto(corpo, "obs", 300, "a observação");

  // De quem é a produção
  let alvo = eu.id;
  const pedido = texto(corpo, "servidorId", 24, "o servidor");
  if (eu.papel === "coordenacao") {
    if (pedido) alvo = pedido;
    else if (existente) alvo = existente.usuario_id as string;
    const u = await buscarUsuario(alvo);
    const mantemOMesmo = existente && existente.usuario_id === alvo;
    if (!u || (!u.ativo && !mantemOMesmo)) throw new ErroApp(400, "Escolha um servidor ativo da equipe.");
  } else if (pedido && pedido !== eu.id) {
    throw new ErroApp(403, "Você só pode registrar a sua própria produção.");
  }

  // Qual atividade
  const atividadeId = texto(corpo, "atividadeId", 40, "a atividade", true);
  const [atv] = await consultar<RowDataPacket>(`SELECT id, ativa FROM prod_atividades WHERE id = ?`, [atividadeId]);
  const mesmaAtividade = existente && existente.atividade_id === atividadeId;
  if (!atv || (!atv.ativa && !mesmaAtividade)) throw new ErroApp(400, "Escolha uma atividade da lista.");

  const foraDoLeque = sigla !== "" && (await responsavelDaUf(sigla)) !== alvo;
  const agora = agoraBanco();
  const pool = obterPool();

  let idFinal = id;
  if (existente) {
    await pool.execute(
      `UPDATE prod_registros SET data = ?, usuario_id = ?, uf = ?, atividade_id = ?, qtd = ?, ref = ?, obs = ?,
              fora_do_leque = ?, atualizado_por = ?, atualizado_em = ? WHERE id = ?`,
      [data, alvo, sigla, atividadeId, qtd, ref, obs, foraDoLeque ? 1 : 0, eu.id, agora, id]
    );
  } else {
    idFinal = gerarId();
    await pool.execute(
      `INSERT INTO prod_registros (id, data, usuario_id, uf, atividade_id, qtd, ref, obs, fora_do_leque, excluido,
                                   criado_por, atualizado_por, criado_em, atualizado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
      [idFinal, data, alvo, sigla, atividadeId, qtd, ref, obs, foraDoLeque ? 1 : 0, eu.id, eu.id, agora, agora]
    );
  }
  const [salvo] = await consultar<RowDataPacket>(`${SELECT_REGISTRO} WHERE id = ?`, [idFinal]);
  return { dados: { registro: registroParaTela(salvo) } };
}

export async function excluirRegistro(corpo: Corpo, ctx: Contexto): Promise<Resultado> {
  const id = texto(corpo, "id", 24, "o identificador", true);
  const excluido = booleano(corpo, "excluido");
  await registroVisivel(id, ctx);
  await obterPool().execute(`UPDATE prod_registros SET excluido = ?, atualizado_por = ?, atualizado_em = ? WHERE id = ?`, [
    excluido ? 1 : 0,
    ctx.usuario.id,
    agoraBanco(),
    id,
  ]);
  const [salvo] = await consultar<RowDataPacket>(`${SELECT_REGISTRO} WHERE id = ?`, [id]);
  return { dados: { registro: registroParaTela(salvo) } };
}

// ---------------------------------------------------------------------
// Equipe (só coordenação)
// ---------------------------------------------------------------------

export async function salvarUsuario(corpo: Corpo, ctx: Contexto): Promise<Resultado> {
  const id = texto(corpo, "id", 24, "o identificador");
  const nome = texto(corpo, "nome", 80, "o nome", true);
  const mail = email(corpo);
  const papel = corpo.papel === "coordenacao" ? "coordenacao" : corpo.papel === "servidor" ? "servidor" : null;
  if (!papel) throw new ErroApp(400, "Escolha se a pessoa é da coordenação ou servidor.");

  const [mesmoEmail] = await consultar<RowDataPacket>(`SELECT id FROM prod_usuarios WHERE email = ? AND id <> ?`, [mail, id || ""]);
  if (mesmoEmail) throw new ErroApp(409, "Já existe uma conta com esse e-mail.");
  const pool = obterPool();
  const agora = agoraBanco();

  if (!id) {
    const senhaProvisoria = gerarSenhaProvisoria();
    const novoId = gerarId();
    try {
      await pool.execute(
        `INSERT INTO prod_usuarios (id, nome, email, senha_hash, papel, ativo, cor, trocar_senha, falhas, criado_em, atualizado_em)
         VALUES (?, ?, ?, ?, ?, 1, ?, 1, 0, ?, ?)`,
        [novoId, nome, mail, await gerarHash(senhaProvisoria), papel, await proximaCor(), agora, agora]
      );
    } catch (erro) {
      if ((erro as { code?: string }).code === "ER_DUP_ENTRY") throw new ErroApp(409, "Já existe uma conta com esse e-mail.");
      throw erro;
    }
    const u = await buscarUsuario(novoId);
    return { dados: { usuario: usuarioParaTela(u!), senhaProvisoria } };
  }

  const u = await buscarUsuario(id);
  if (!u) throw new ErroApp(404, "Conta não encontrada.");
  if (u.papel !== papel) {
    if (u.id === ctx.usuario.id) throw new ErroApp(400, "Você não pode mudar o seu próprio papel. Peça a outra pessoa da coordenação.");
    if (u.papel === "coordenacao" && u.ativo && (await coordenadoresAtivos()) <= 1) {
      throw new ErroApp(400, "A equipe precisa de pelo menos uma pessoa na coordenação.");
    }
  }
  await pool.execute(`UPDATE prod_usuarios SET nome = ?, email = ?, papel = ?, atualizado_em = ? WHERE id = ?`, [nome, mail, papel, agora, id]);
  // Mudou o e-mail ou o papel: quem estiver entrado precisa entrar de novo.
  if (u.email !== mail || u.papel !== papel) await encerrarSessoesDe(id, id === ctx.usuario.id ? ctx.token : null);
  return { dados: { usuario: usuarioParaTela((await buscarUsuario(id))!) } };
}

export async function ativarUsuario(corpo: Corpo, ctx: Contexto): Promise<Resultado> {
  const id = texto(corpo, "id", 24, "o identificador", true);
  const ativo = booleano(corpo, "ativo");
  const u = await buscarUsuario(id);
  if (!u) throw new ErroApp(404, "Conta não encontrada.");
  if (id === ctx.usuario.id) throw new ErroApp(400, "Você não pode desativar a sua própria conta.");
  const pool = obterPool();
  const agora = agoraBanco();
  let ufsLiberadas: string[] = [];
  if (ativo) {
    await pool.execute(`UPDATE prod_usuarios SET ativo = 1, cor = ?, falhas = 0, bloqueado_ate = NULL, atualizado_em = ? WHERE id = ?`, [await proximaCor(), agora, id]);
  } else {
    const ufs = await consultar<RowDataPacket>(`SELECT sigla FROM prod_ufs WHERE usuario_id = ?`, [id]);
    ufsLiberadas = ufs.map((l) => l.sigla as string);
    await pool.execute(`UPDATE prod_ufs SET usuario_id = NULL, atualizado_em = ? WHERE usuario_id = ?`, [agora, id]);
    await pool.execute(`UPDATE prod_usuarios SET ativo = 0, atualizado_em = ? WHERE id = ?`, [agora, id]);
    await encerrarSessoesDe(id);
  }
  return { dados: { usuario: usuarioParaTela((await buscarUsuario(id))!), ufsLiberadas, em: bancoParaIso(agora) } };
}

export async function redefinirSenha(corpo: Corpo, ctx: Contexto): Promise<Resultado> {
  const id = texto(corpo, "id", 24, "o identificador", true);
  if (id === ctx.usuario.id) throw new ErroApp(400, "Para a sua própria conta, use Trocar senha, em Ajustes.");
  const u = await buscarUsuario(id);
  if (!u || !u.ativo) throw new ErroApp(404, "Conta não encontrada ou desativada.");
  const senhaProvisoria = gerarSenhaProvisoria();
  await obterPool().execute(
    `UPDATE prod_usuarios SET senha_hash = ?, trocar_senha = 1, falhas = 0, bloqueado_ate = NULL, atualizado_em = ? WHERE id = ?`,
    [await gerarHash(senhaProvisoria), agoraBanco(), id]
  );
  await encerrarSessoesDe(id);
  return { dados: { senhaProvisoria } };
}

export async function atribuirUf(corpo: Corpo): Promise<Resultado> {
  const sigla = uf(corpo, "sigla");
  if (!sigla) throw new ErroApp(400, "UF inválida.");
  const servidorId = texto(corpo, "servidorId", 24, "o servidor") || null;
  if (servidorId) {
    const u = await buscarUsuario(servidorId);
    if (!u || !u.ativo) throw new ErroApp(400, "Escolha um servidor ativo da equipe.");
  }
  const agora = agoraBanco();
  await obterPool().execute(
    `INSERT INTO prod_ufs (sigla, usuario_id, atualizado_em) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE usuario_id = VALUES(usuario_id), atualizado_em = VALUES(atualizado_em)`,
    [sigla, servidorId, agora]
  );
  return { dados: { sigla, servidorId, em: bancoParaIso(agora) } };
}

// ---------------------------------------------------------------------
// Atividades e nomes do setor (só coordenação)
// ---------------------------------------------------------------------

export async function salvarAtividade(corpo: Corpo): Promise<Resultado> {
  const id = texto(corpo, "id", 40, "o identificador");
  const curto = texto(corpo, "curto", 60, "o nome curto", true);
  const nome = texto(corpo, "nome", 240, "a descrição") || curto;
  const categoria = texto(corpo, "categoriaId", 20, "a categoria", true);
  if (!(CATEGORIAS as readonly string[]).includes(categoria)) throw new ErroApp(400, "Categoria inválida.");
  const pool = obterPool();
  const agora = agoraBanco();
  let idFinal = id;
  if (id) {
    const [r] = await pool.execute<ResultSetHeader>(`UPDATE prod_atividades SET curto = ?, nome = ?, categoria = ?, atualizado_em = ? WHERE id = ?`, [curto, nome, categoria, agora, id]);
    if (!r.affectedRows) throw new ErroApp(404, "Atividade não encontrada.");
  } else {
    idFinal = gerarId();
    const [m] = await consultar<RowDataPacket>(`SELECT COALESCE(MAX(ordem), 0) AS m FROM prod_atividades`);
    await pool.execute(
      `INSERT INTO prod_atividades (id, categoria, curto, nome, uf_padrao, ordem, ativa, atualizado_em) VALUES (?, ?, ?, ?, NULL, ?, 1, ?)`,
      [idFinal, categoria, curto, nome, Number(m?.m || 0) + 1, agora]
    );
  }
  const [a] = await consultar<RowDataPacket>(`SELECT * FROM prod_atividades WHERE id = ?`, [idFinal]);
  return { dados: { atividade: atividadeParaTela(a) } };
}

export async function ativarAtividade(corpo: Corpo): Promise<Resultado> {
  const id = texto(corpo, "id", 40, "o identificador", true);
  const ativa = booleano(corpo, "ativa");
  const [r] = await obterPool().execute<ResultSetHeader>(`UPDATE prod_atividades SET ativa = ?, atualizado_em = ? WHERE id = ?`, [ativa ? 1 : 0, agoraBanco(), id]);
  if (!r.affectedRows) throw new ErroApp(404, "Atividade não encontrada.");
  const [a] = await consultar<RowDataPacket>(`SELECT * FROM prod_atividades WHERE id = ?`, [id]);
  return { dados: { atividade: atividadeParaTela(a) } };
}

export async function salvarSetor(corpo: Corpo): Promise<Resultado> {
  const nome = texto(corpo, "nome", 80, "o nome do setor") || "Setor de Passivo Veicular";
  const unidade = texto(corpo, "unidade", 140, "a unidade");
  const pool = obterPool();
  for (const [chave, valor] of [["setor_nome", nome], ["setor_unidade", unidade]]) {
    await pool.execute(`INSERT INTO prod_config (chave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = VALUES(valor)`, [chave, valor]);
  }
  return { dados: { setor: { nome, unidade } } };
}

