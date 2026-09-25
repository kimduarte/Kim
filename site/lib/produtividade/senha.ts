import { createHash, randomBytes, randomInt, scrypt, timingSafeEqual } from "node:crypto";

/**
 * Senhas nunca ficam guardadas: o banco guarda só o resultado do scrypt, uma
 * conta feita de propósito para ser lenta e cara. Quem copiasse a tabela
 * inteira não conseguiria entrar com esses dados.
 *
 * Formato guardado: scrypt$N$r$p$sal$resultado (sal e resultado em base64).
 * Os parâmetros vão junto para que possam ser aumentados no futuro sem
 * invalidar as senhas antigas.
 */

const N = 16384;
const R = 8;
const P = 1;
const TAMANHO = 64;

function scryptAsync(senha: string, sal: Buffer, n: number, r: number, p: number, tamanho: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(senha.normalize("NFC"), sal, tamanho, { N: n, r, p, maxmem: 256 * n * r + 1024 * 1024 }, (erro, chave) => {
      if (erro) reject(erro);
      else resolve(chave);
    });
  });
}

export async function gerarHash(senha: string): Promise<string> {
  const sal = randomBytes(16);
  const chave = await scryptAsync(senha, sal, N, R, P, TAMANHO);
  return `scrypt$${N}$${R}$${P}$${sal.toString("base64")}$${chave.toString("base64")}`;
}

export async function conferirSenha(senha: string, guardado: string): Promise<boolean> {
  const partes = guardado.split("$");
  if (partes.length !== 6 || partes[0] !== "scrypt") return false;
  const [n, r, p] = [Number(partes[1]), Number(partes[2]), Number(partes[3])];
  const sal = Buffer.from(partes[4], "base64");
  const esperado = Buffer.from(partes[5], "base64");
  const chave = await scryptAsync(senha, sal, n, r, p, esperado.length);
  return chave.length === esperado.length && timingSafeEqual(chave, esperado);
}

/** Um hash qualquer, para gastar o mesmo tempo quando o e-mail não existe. */
let hashDeMentira: Promise<string> | null = null;
export async function gastarTempoComoSeConferisse(senha: string): Promise<void> {
  if (!hashDeMentira) hashDeMentira = gerarHash(randomBytes(12).toString("hex"));
  await conferirSenha(senha, await hashDeMentira);
}

/**
 * Senha provisória fácil de ditar: três grupos de 4, sem letras que se
 * confundem (l, 1, o, 0, i). Ex.: k7mq-x3pd-9rwa. Cerca de 59 bits.
 */
export function gerarSenhaProvisoria(): string {
  const alfabeto = "abcdefghjkmnpqrstuvwxyz23456789";
  const grupos: string[] = [];
  for (let g = 0; g < 3; g++) {
    let grupo = "";
    for (let i = 0; i < 4; i++) grupo += alfabeto[randomInt(alfabeto.length)];
    grupos.push(grupo);
  }
  return grupos.join("-");
}

/** Código de sessão: 32 bytes aleatórios. O banco guarda só o SHA-256 dele. */
export function gerarToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashDoToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function gerarId(): string {
  return randomBytes(9).toString("base64url");
}

/** Compara dois textos sem vazar, pelo tempo de resposta, onde diferem. */
export function textosIguais(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}
