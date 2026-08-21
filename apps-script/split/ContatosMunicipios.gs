
// ======================================================================
// CONTATOS DOS MUNICÍPIOS — base de referência (autoridade responsável,
// e-mails, telefone) usada só pra SUGERIR o destinatário e personalizar a
// saudação do e-mail de cobrança quando ainda não existe um contato salvo
// de uso anterior (ver montarEmailCobrancaProcesso). Editável direto na
// aba "ContatosMunicipios" da planilha — sem tela própria no site.
// ======================================================================

var SHEET_CONTATOS_MUNICIPIOS = 'ContatosMunicipios';
var CABECALHO_CONTATOS_MUNICIPIOS = ['UF', 'Municipio', 'Autoridade', 'AtoNomeacao', 'EmailPessoal', 'EmailGerais', 'Telefone'];

// Só considera "muito desatualizada" e avisa na tela depois desse tanto de
// dias sem ninguém confirmar que revisou a base — ver
// getStatusRevisaoContatosMunicipios/marcarContatosMunicipiosRevisados.
var CONTATOS_MUNICIPIOS_DIAS_PARA_AVISO = 180;

function listarContatosMunicipios_() {
  var sheet = getOrCreateSheet_(SHEET_CONTATOS_MUNICIPIOS, CABECALHO_CONTATOS_MUNICIPIOS);
  var valores = sheet.getDataRange().getValues();
  var lista = [];
  for (var i = 1; i < valores.length; i++) {
    var linha = valores[i];
    if (!linha[0] || !linha[1]) continue;
    lista.push({
      uf: linha[0], municipio: linha[1], autoridade: linha[2] || '', ato: linha[3] || '',
      emailPessoal: linha[4] || '', emailGerais: linha[5] || '', telefone: linha[6] || ''
    });
  }
  return lista;
}

/**
 * Reduz um nome de município/órgão a uma forma "canônica" só pra comparar
 * — maiúsculas, sem acento, sem prefixo tipo "MUNICÍPIO DE"/"PREFEITURA
 * DE"/"GUARDA MUNICIPAL DE", e corta tudo a partir de "/" ou "-" (que na
 * base normalmente introduz a UF, não faz parte do nome da cidade). Usada
 * dos dois lados (Donataria do veículo E Órgão da base de contatos) pra
 * ligar os dois mesmo com grafias/formatações diferentes.
 */
function normalizarNomeMunicipioParaMatch_(texto) {
  return String(texto || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/ /g, ' ')
    .replace(/\bMUNICIPIO\s+DE\b/g, '')
    .replace(/\bPREFEITURA\s+MUNICIPAL\s+DE\b/g, '')
    .replace(/\bPREFEITURA\s+DE\b/g, '')
    .replace(/\bGUARDA\s+CIVIL\s+MUNICIPAL\s+DE\b/g, '')
    .replace(/\bGUARDA\s+MUNICIPAL\s+DE\b/g, '')
    .replace(/[\/\-,].*$/, '')
    .replace(/[^A-Z ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// "RODRIGO SANTOS CUNHA" -> "Rodrigo Santos Cunha" (conectores como
// de/da/do ficam minúsculos) — só pra deixar o nome apresentável na
// saudação do e-mail, já que a planilha de origem vem tudo em maiúsculas.
function paraTitleCasePortugues_(texto) {
  var conectores = { DE: 1, DA: 1, DO: 1, DAS: 1, DOS: 1, E: 1 };
  return String(texto || '').toLowerCase().split(' ').map(function (palavra, i) {
    var maiusc = palavra.toUpperCase();
    if (i > 0 && conectores[maiusc]) return palavra;
    return palavra.charAt(0).toUpperCase() + palavra.slice(1);
  }).join(' ');
}

/**
 * Acha o contato de referência de um município pela UF + nome (Donataria)
 * — usado só como sugestão quando ainda não existe um e-mail já usado
 * antes numa cobrança real daquele processo (ver montarEmailCobrancaProcesso).
 * Devolve null se não achar ligação nenhuma (base incompleta, ou doação
 * pra um órgão estadual em vez de município, por exemplo).
 */
function buscarContatoMunicipio_(uf, donataria) {
  var chaveAlvo = normalizarNomeMunicipioParaMatch_(donataria);
  if (!chaveAlvo) return null;
  var contatos = listarContatosMunicipios_();
  for (var i = 0; i < contatos.length; i++) {
    if (contatos[i].uf !== uf) continue;
    if (normalizarNomeMunicipioParaMatch_(contatos[i].municipio) === chaveAlvo) return contatos[i];
  }
  return null;
}

/**
 * Situação da revisão da base de contatos — usada pra mostrar o aviso "base
 * desatualizada" na tela de Cobrança quando ninguém confirma uma revisão há
 * mais de CONTATOS_MUNICIPIOS_DIAS_PARA_AVISO dias.
 */
function getStatusRevisaoContatosMunicipios() {
  var props = PropertiesService.getScriptProperties();
  var revisadoEm = props.getProperty('CONTATOS_MUNICIPIOS_REVISADO_EM');
  if (!revisadoEm) return { revisadoEm: null, dias: null, desatualizada: true };
  var dias = Math.floor((Date.now() - new Date(revisadoEm).getTime()) / 86400000);
  return { revisadoEm: revisadoEm, dias: dias, desatualizada: dias >= CONTATOS_MUNICIPIOS_DIAS_PARA_AVISO };
}

function marcarContatosMunicipiosRevisados() {
  var perfil = exigirPerfilEditor_();
  var agora = new Date();
  PropertiesService.getScriptProperties().setProperty('CONTATOS_MUNICIPIOS_REVISADO_EM', agora.toISOString());
  registrarLog_('CONTATOS_MUNICIPIOS_REVISADOS', '-', 'Base de contatos dos municípios marcada como revisada.');
  return { mensagem: 'Base marcada como revisada hoje.' };
}
