/**
 * Codigo.gs
 * Ponto de entrada do site standalone do Passivo Veicular — projeto Apps
 * Script separado do "Sistema de Gestão de Patrimônio - SGP/COLOG"
 * (Doação Veicular). Abre direto no painel do Passivo, sem seletor.
 */

function doGet(e) {
  return HtmlService.createTemplateFromFile('Pagina')
    .evaluate()
    .setTitle('Passivo Veicular')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Permite montar Pagina.html a partir de vários arquivos .html (markup,
// estilo, script) — cada `<?!= include('NomeDoArquivo'); ?>` é substituído
// pelo conteúdo do arquivo na hora de renderizar a página.
function include(nomeArquivo) {
  return HtmlService.createHtmlOutputFromFile(nomeArquivo).getContent();
}

// Chamada pelo cliente assim que a página carrega. O login/perfil continua
// vindo da planilha de Doações (aba "Usuarios") — ver getPerfilUsuarioAtual_
// em Utilitarios.gs — mesmo login que o site de Doação Veicular usa, sem
// precisar recadastrar ninguém.
function getContextoInicial() {
  return {
    usuario: getPerfilUsuarioAtual_(),
    // Usado no cadastro de veículo: quando a UF tem lista de órgãos
    // conhecida (ver ORGAOS_POR_UF em Utilitarios.gs), o campo Instituição
    // vira um select em vez de texto livre.
    orgaosPorUF: ORGAOS_POR_UF
  };
}
