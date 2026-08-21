
// ======================================================================
// INTEGRAÇÃO DIRETA COM O ONEDRIVE (Microsoft Graph, sem Power Automate)
// ======================================================================
//
// Requer a biblioteca "OAuth2 for Apps Script" instalada no projeto
// (Bibliotecas > colar o ID 1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF
// > selecionar a versão mais recente > identificador "OAuth2") e as
// Propriedades do Script: MS_CLIENT_ID, MS_CLIENT_SECRET, MS_TENANT_ID
// (valores obtidos ao registrar o aplicativo no Azure/Microsoft Entra).
// Opcionalmente, MS_ONEDRIVE_CAMINHO define o caminho do arquivo no OneDrive
// (padrão: "/Base_Veiculos_ATUAL.xlsx").

function getServicoMicrosoft_() {
  var props = PropertiesService.getScriptProperties();
  var tenantId = props.getProperty('MS_TENANT_ID');
  return OAuth2.createService('microsoft')
    .setAuthorizationBaseUrl('https://login.microsoftonline.com/' + tenantId + '/oauth2/v2.0/authorize')
    .setTokenUrl('https://login.microsoftonline.com/' + tenantId + '/oauth2/v2.0/token')
    .setClientId(props.getProperty('MS_CLIENT_ID'))
    .setClientSecret(props.getProperty('MS_CLIENT_SECRET'))
    .setCallbackFunction('autorizarMicrosoftCallback_')
    .setPropertyStore(props)
    .setScope('https://graph.microsoft.com/Files.ReadWrite https://graph.microsoft.com/Mail.Send offline_access')
    .setParam('response_mode', 'query');
}

/**
 * Roda esta função manualmente pelo editor do Apps Script (selecione
 * "autorizarMicrosoft" no menu de funções e clique em Executar) uma única
 * vez, depois de preencher MS_CLIENT_ID/MS_CLIENT_SECRET/MS_TENANT_ID nas
 * Propriedades do Script. Ela mostra, no log de execução (Ver > Execuções),
 * o link para abrir e conceder a permissão de acesso ao OneDrive e ao envio
 * de e-mail em nome da conta autorizada (escopo Mail.Send).
 *
 * Se a integração já tinha sido autorizada ANTES do escopo Mail.Send existir
 * (ver getServicoMicrosoft_), é preciso rodar esta função de novo pra
 * conceder a permissão nova — trocar o escopo não amplia sozinho uma
 * autorização já concedida.
 */
function autorizarMicrosoft() {
  var servico = getServicoMicrosoft_();
  if (servico.hasAccess()) {
    Logger.log('Já autorizado.');
  } else {
    Logger.log('Abra este link para autorizar o acesso ao OneDrive e ao envio de e-mail: ' + servico.getAuthorizationUrl());
  }
}

/**
 * Revoga a autorização atual da integração com a Microsoft — use antes de
 * autorizarMicrosoft() quando for preciso conceder um escopo novo (ex.:
 * Mail.Send foi adicionado depois que a integração já estava autorizada só
 * com Files.ReadWrite) e o site da Microsoft não estiver reapresentando a
 * tela de consentimento sozinho.
 */
function reautorizarMicrosoft() {
  getServicoMicrosoft_().reset();
  Logger.log('Autorização anterior removida. Rode autorizarMicrosoft() de novo pra conceder o acesso com o escopo atualizado.');
}

function autorizarMicrosoftCallback_(request) {
  var servico = getServicoMicrosoft_();
  var autorizado = servico.handleCallback(request);
  return HtmlService.createHtmlOutput(autorizado
    ? 'Autorizado com sucesso! Pode fechar esta aba.'
    : 'Falha na autorização. Feche esta aba e tente de novo.');
}

function enviarParaOneDriveViaGraph_() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('MS_CLIENT_ID')) return; // integração não configurada — no-op
  try {
    var servico = getServicoMicrosoft_();
    if (!servico.hasAccess()) return; // ainda não autorizado (ver autorizarMicrosoft()) — no-op

    var caminho = props.getProperty('MS_ONEDRIVE_CAMINHO') || '/Base_Veiculos_ATUAL.xlsx';
    var url = 'https://graph.microsoft.com/v1.0/me/drive/root:' + caminho + ':/content';
    UrlFetchApp.fetch(url, {
      method: 'put',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      payload: exportarPlanilhaComoXlsx_().getBytes(),
      headers: { Authorization: 'Bearer ' + servico.getAccessToken() },
      muteHttpExceptions: true
    });
  } catch (e) {
    // Intencional: notificação é best-effort, não deve travar a operação principal.
  }
}

/**
 * Envia um e-mail de verdade pela caixa de saída da conta institucional
 * (Outlook/Microsoft 365) autorizada em autorizarMicrosoft() — usa o mesmo
 * serviço já usado pro backup no OneDrive, só que com o escopo Mail.Send.
 * Devolve true se enviou por aqui; false se a integração não está
 * configurada/autorizada (nesse caso quem chamou deve cair pro MailApp do
 * Google como alternativa).
 */
function enviarEmailViaGraph_(destinatario, cc, assunto, corpo) {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('MS_CLIENT_ID')) return false; // integração não configurada

  var servico = getServicoMicrosoft_();
  if (!servico.hasAccess()) return false; // ainda não autorizado (ou autorizado sem o escopo Mail.Send)

  var mensagem = {
    message: {
      subject: assunto,
      body: { contentType: 'Text', content: corpo },
      toRecipients: String(destinatario).split(';').map(function (e) { return e.trim(); }).filter(Boolean)
        .map(function (e) { return { emailAddress: { address: e } }; }),
      ccRecipients: cc ? [{ emailAddress: { address: cc } }] : []
    },
    saveToSentItems: true
  };

  var resposta = UrlFetchApp.fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(mensagem),
    headers: { Authorization: 'Bearer ' + servico.getAccessToken() },
    muteHttpExceptions: true
  });

  var codigo = resposta.getResponseCode();
  if (codigo < 200 || codigo >= 300) {
    throw new Error('Falha ao enviar pelo Outlook institucional (' + codigo + '): ' + resposta.getContentText());
  }
  return true;
}
