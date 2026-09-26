/**
 * Lê DadosInfracoesRenainf.gs (tabela do Apps Script) e gera
 * tabela-infracoes.json com { codigo, artigo, descricao, valor } por infração.
 *
 * Por que existe: em parte das linhas do .gs o artigo ficou vazio ou
 * misturado com a descrição (colunas desalinhadas na origem). O artigo é
 * obrigatório no cadastro de infração, então aqui ele é separado de volta.
 * Cada linha corrigida sai listada no relatório, para conferência humana.
 *
 * Uso:  node normalizar-tabela-infracoes.js
 */
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, 'DadosInfracoesRenainf.gs'), 'utf8');
const pvDadosRenainf_ = new Function(src + '\nreturn pvDadosRenainf_;')();
const linhas = pvDadosRenainf_(); // [artigo, descricao, codigo, gravidade, valor]

// Uma "peça" de artigo: número, inciso, alínea, parágrafo, "c/c", "*"...
const PECA = /^(\d{1,3}\*?\S*|\*\S+|pr\d*|pr\d*\*\S*|c\/c|UNICO|[A-Z]|[IVX]+|\*)$/;

// Separa o artigo que ficou grudado no fim da descrição.
function artigoDoFim(desc) {
  const t = desc.trim().split(/\s+/);
  const art = [];
  while (t.length > 1 && PECA.test(t[t.length - 1])) {
    // "ARTIGO 14 45*II*B": o 14 pertence à frase, não ao enquadramento.
    if (/^\d+$/.test(t[t.length - 1]) && /^ART(IGO|\.)?$/.test(t[t.length - 2] || '')) break;
    art.unshift(t.pop());
  }
  return { descricao: t.join(' '), artigo: art.join(' ') };
}

const saida = [];
const corrigidas = [];
const revisar = [];

for (const [art0, desc0, codigo, , valor0] of linhas) {
  let artigo = String(art0).trim();
  let descricao = String(desc0).trim();
  let motivo = '';

  if (!artigo) {
    // Caso 1: artigo vazio, está no fim da descrição.
    const r = artigoDoFim(descricao);
    descricao = r.descricao; artigo = r.artigo;
    motivo = 'artigo estava no fim da descrição';
  } else if (/^\d$/.test(artigo)) {
    // Caso 2: artigo é só um dígito — é o final do "pr" que ficou na descrição
    // (ex.: descrição "... 244*III c/c pr" + artigo "1" => "244*III c/c pr1").
    const r = artigoDoFim(descricao);
    descricao = r.descricao; artigo = r.artigo + artigo;
    motivo = 'artigo estava partido entre descrição e artigo';
  } else if (/^(\d+[MX]|\d{2})\s+(\d{2,3}\S*.*)$/.test(artigo)) {
    // Caso 3: o começo do "artigo" é o fim da descrição
    // ("1M 181*II" => descrição "... DE 50CM A 1M", artigo "181*II").
    const [, sobra, resto] = artigo.match(/^(\S+)\s+(.*)$/);
    descricao = descricao + ' ' + sobra; artigo = resto;
    motivo = 'fim da descrição estava no artigo';
  }

  if (!artigo) revisar.push(`${codigo}: artigo não encontrado`);
  if (/\*\d/.test(artigo)) revisar.push(`${codigo}: artigo "${artigo}" — inciso em número em vez de romano; conferir na origem`);
  if (/^450\*/.test(artigo)) revisar.push(`${codigo}: artigo "${artigo}" — provável erro de digitação na origem (45*...)`);

  const valor = valor0 === '' || valor0 == null ? null : Number(valor0);
  if (motivo) corrigidas.push(`${codigo}: ${motivo} → artigo "${artigo}"`);
  saida.push({ codigo, artigo, descricao, valor });
}

// Conferências finais
const codigos = new Set(saida.map(x => x.codigo));
if (codigos.size !== saida.length) throw new Error('Código de infração repetido');
for (const x of saida) if (!/^\d{3}-\d{2}$/.test(x.codigo)) throw new Error('Código fora do padrão: ' + x.codigo);

fs.writeFileSync(path.join(__dirname, 'tabela-infracoes.json'), JSON.stringify(saida, null, 1) + '\n');

const rel = [
  `Tabela de infrações normalizada — ${saida.length} códigos`,
  `Sem valor fixo: ${saida.filter(x => x.valor == null).length}`,
  `Artigos distintos: ${new Set(saida.map(x => x.artigo)).size}`,
  '',
  `Linhas corrigidas (${corrigidas.length}):`, ...corrigidas.map(s => '  ' + s),
  '',
  `Para revisão humana (${revisar.length}):`, ...(revisar.length ? revisar.map(s => '  ' + s) : ['  nenhuma']),
].join('\n');
fs.writeFileSync(path.join(__dirname, 'tabela-infracoes-relatorio.txt'), rel + '\n');
console.log(rel);
