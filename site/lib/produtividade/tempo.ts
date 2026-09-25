/**
 * Horas de sistema ficam em UTC no banco ("AAAA-MM-DD HH:MM:SS"), e o
 * navegador recebe em ISO ("…Z") para mostrar no fuso de quem está vendo.
 * A data de trabalho do registro é outra coisa: um dia do calendário, sem
 * hora, escolhido pela pessoa.
 */

export function agoraBanco(somarMinutos = 0): string {
  const d = new Date(Date.now() + somarMinutos * 60_000);
  return d.toISOString().slice(0, 19).replace("T", " ");
}

export function bancoParaIso(valor: string | null | undefined): string | null {
  if (!valor) return null;
  return `${String(valor).slice(0, 19).replace(" ", "T")}Z`;
}

/** Hoje no horário de Brasília, como "AAAA-MM-DD". */
export function hojeBrasilia(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** "AAAA-MM-DD" que existe no calendário (pega 31/02). */
export function dataValida(texto: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!m) return false;
  const [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (ano < 2000 || ano > 2200 || mes < 1 || mes > 12) return false;
  return dia >= 1 && dia <= new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}
