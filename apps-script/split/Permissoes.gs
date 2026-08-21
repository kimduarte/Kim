
// ======================================================================
// PERMISSÕES — controle de acesso por perfil
// admin:     irrestrito (cadastra, edita, exclui, cadastra usuários).
// usuario:   pode cadastrar e editar operações (veículos/processos), mas
//            não exclui processos nem cadastra outros usuários.
// visitante: só visualiza — nenhuma ação de escrita é permitida.
// ======================================================================

function getPerfilUsuarioAtual_() {
  var email = getEmailUsuarioAtual_();
  var sheet = getOrCreateSheet_(SHEET_USUARIOS, CABECALHO_USUARIOS);
  var dados = sheet.getDataRange().getValues();

  for (var i = 1; i < dados.length; i++) {
    var linha = dados[i];
    if (String(linha[0]).trim().toLowerCase() === email.toLowerCase()) {
      var perfilBruto = normalizarTexto_(linha[1]).toLowerCase();
      // "uf" era o perfil intermediário do modelo antigo (restrito por UF).
      // Equivale ao novo perfil "usuario" (cadastra/edita, sem restrição de
      // UF) — mantém acesso de quem já estava cadastrado assim antes.
      var perfil = perfilBruto === 'uf' ? PERFIL_USUARIO : (perfilBruto || PERFIL_VISITANTE);
      return {
        email: email,
        perfil: perfil,
        uf: normalizarUF_(linha[2] || ''),
        nome: linha[3] || email,
        // Admin sempre tem acesso à Produtividade — o campo na planilha só
        // importa pra estender esse acesso a usuários/visitantes específicos.
        acessoProdutividade: perfil === PERFIL_ADMIN || normalizarTexto_(linha[4]).toUpperCase() === 'SIM'
      };
    }
  }
  return { email: email, perfil: 'sem_acesso', uf: '', nome: email, acessoProdutividade: false };
}

function exigirPerfilAdmin_() {
  var perfil = getPerfilUsuarioAtual_();
  if (perfil.perfil !== PERFIL_ADMIN) {
    throw new Error('Ação restrita a administradores.');
  }
  return perfil;
}

function exigirPerfilEditor_() {
  var perfil = getPerfilUsuarioAtual_();
  if (perfil.perfil !== PERFIL_ADMIN && perfil.perfil !== PERFIL_USUARIO) {
    throw new Error('Você não tem permissão para cadastrar ou editar — visitantes só podem visualizar.');
  }
  return perfil;
}

function exigirAcessoProdutividade_() {
  var perfil = getPerfilUsuarioAtual_();
  if (!perfil.acessoProdutividade) {
    throw new Error('Você não tem permissão para usar a aba Produtividade — fale com um administrador.');
  }
  return perfil;
}

function podeVerLinha_(perfil) {
  return perfil.perfil === PERFIL_ADMIN || perfil.perfil === PERFIL_USUARIO || perfil.perfil === PERFIL_VISITANTE;
}

function podeEditarLinha_(perfil) {
  return perfil.perfil === PERFIL_ADMIN || perfil.perfil === PERFIL_USUARIO;
}
