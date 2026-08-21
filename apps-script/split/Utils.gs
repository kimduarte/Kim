
// ======================================================================
// UTILS — funções auxiliares, normalização de texto, validações
// ======================================================================

function getSpreadsheet_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getOrCreateSheet_(nome, cabecalho) {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(nome);
  if (!sheet) {
    sheet = ss.insertSheet(nome);
  }
  if (cabecalho && sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, cabecalho.length).setValues([cabecalho]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, cabecalho.length).setFontWeight('bold').setBackground('#1a73e8').setFontColor('#ffffff');
  }
  return sheet;
}

function normalizarTexto_(valor) {
  if (valor === null || valor === undefined) return '';
  var texto = String(valor);
  texto = texto.replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
  return texto;
}

function normalizarMarca_(valor) {
  var marca = normalizarTexto_(valor).toUpperCase();
  return CORRECOES_MARCA[marca] || marca;
}

function normalizarPlaca_(valor) {
  return normalizarTexto_(valor).toUpperCase().replace(/[\s-]/g, '');
}

function normalizarChassi_(valor) {
  return normalizarTexto_(valor).toUpperCase().replace(/\s/g, '');
}

// CNPJ/CPF: guarda só os dígitos (sem ponto, barra, hífen) — assim
// "12.345.678/0001-99" e "12345678000199" digitados por pessoas diferentes
// viram o mesmo valor gravado, e buscar ou comparar depois não falha por
// causa da formatação usada na hora de digitar.
function normalizarCnpjCpf_(valor) {
  return String(valor || '').replace(/\D/g, '');
}

function normalizarUF_(valor) {
  return normalizarTexto_(valor).toUpperCase();
}

function normalizarTransferido_(valor) {
  var texto = normalizarTexto_(valor).toUpperCase();
  if (texto === 'SIM' || texto === 'S') return 'SIM';
  if (texto === 'NÃO' || texto === 'NAO' || texto === 'N') return 'NÃO';
  return null;
}

// Aceita tanto um número quanto o texto digitado no formato brasileiro (ex.:
// "1.500,00", vindo da máscara de moeda da tela) e devolve sempre um número.
function normalizarValorMonetario_(valor) {
  if (typeof valor === 'number') return valor;
  var texto = normalizarTexto_(valor);
  if (!texto) return 0;
  var numero = parseFloat(texto.replace(/\./g, '').replace(',', '.').replace(/[^\d.\-]/g, ''));
  return isNaN(numero) ? 0 : numero;
}

function validarChassi_(chassi) {
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(chassi);
}

function validarPlaca_(placa) {
  var antiga = /^[A-Z]{3}[0-9]{4}$/;
  var mercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
  return antiga.test(placa) || mercosul.test(placa);
}

function validarRenavam_(renavam) {
  var texto = String(renavam).replace(/\D/g, '');
  return texto.length >= 9 && texto.length <= 11;
}

function gerarProximoId_() {
  var props = PropertiesService.getDocumentProperties();
  var seq = Number(props.getProperty('SEQ_VEICULO') || '0');
  seq += 1;
  props.setProperty('SEQ_VEICULO', String(seq));
  return 'VC-' + ('000000' + seq).slice(-6);
}

function registrarLog_(acao, idVeiculo, detalhes) {
  var sheet = getOrCreateSheet_(SHEET_LOG, CABECALHO_LOG);
  sheet.appendRow([new Date(), getEmailUsuarioAtual_(), acao, idVeiculo, detalhes || '']);
}

function getEmailUsuarioAtual_() {
  try {
    var email = Session.getActiveUser().getEmail();
    return email || 'desconhecido';
  } catch (e) {
    return 'desconhecido';
  }
}

function colunaParaIndice_(nomeColuna) {
  return CABECALHO_VEICULOS.indexOf(nomeColuna);
}
