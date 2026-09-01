# Passivo Veicular — site standalone

Projeto Apps Script separado, extraído do "Sistema de Gestão de Patrimônio -
SGP/COLOG" (que ficava em `apps-script/` neste mesmo repositório, junto com o
módulo de Doação Veicular). Abre direto no painel do Passivo, sem seletor de
painéis.

## Arquivos

Servidor (`.gs`):
- `Codigo.gs` — `doGet`, `include()` e `getContextoInicial()`.
- `Utilitarios.gs` — normalização/validação genéricas + login/perfis (lê a
  aba "Usuarios" própria da planilha do Passivo — base de usuários
  independente do site de Doação Veicular, por decisão do usuário).
- `Setup.gs` — estrutura da planilha própria do Passivo (abas, cabeçalhos) e
  `criarEstruturaPassivoVeicular()`.
- `AbaVeiculos.gs` — CRUD da aba "Veiculos" (cadastro individual/lote,
  listagem, painel geral, edição, exclusão lógica, lixeira).
- `AbaInfracoes.gs` — CRUD das abas "Infracoes"/"InfracoesEnvios", que agora
  guardam débitos de qualquer tipo (Infração, IPVA, Licenciamento, Taxas,
  Outra — ver `PV_TIPOS_DEBITO` em `Setup.gs`), diferenciados pela coluna
  "Tipo". Infração continua com os mesmos campos/fluxo de antes (AIT,
  Artigo, Código de enquadramento, Órgão autuador, StatusCancelamento); os
  demais tipos usam campos genéricos (DataVencimento, Exercicio,
  StatusPagamento: Pendente/Pago). Valor (R$) é comum a todos os tipos —
  para Infração é opcional e pode ser preenchido automaticamente ao
  escolher um artigo/código na busca (ver `DadosInfracoesRenainf.gs`). Os
  envios de pedido valem para qualquer tipo de débito.
- `DadosInfracoesRenainf.gs` — tabela de código de enquadramento das
  infrações de trânsito (código, artigo/base legal, descrição e valor em
  R$), usada para semear a aba "TabelaInfracoes" na primeira vez e também
  para autopreencher Descrição e Valor quando alguém escolhe um artigo pela
  busca no cadastro de débito. Se essa planilha já existia antes dessa
  tabela existir, rode `atualizarTabelaInfracoes` uma vez pelo editor do
  Apps Script (menu de funções ao lado de "Executar") pra recarregar os
  461 códigos com os valores.

Cliente (`.html`):
- `Pagina.html` — monta a página a partir dos arquivos abaixo e faz o
  bootstrap inicial (busca o contexto do usuário, depois inicializa o painel).
- `EstiloGenerico.html` / `EstiloPassivo.html` — CSS (design/estrutural),
  separado do JS.
- `ComponentesComuns.html` — loader de tela cheia + modal de confirmação
  (usados pelos utilitários de cliente).
- `PainelPassivoVeicular.html` — markup do painel (telas + modais).
- `UtilitariosCliente.html` — funções JS genéricas (`chamarServidor_`,
  `mostrarMensagem`, `confirmar_`, etc.).
- `PassivoVeicularJs.html` — JS específico do Passivo Veicular.

## Configuração antes de usar

*(Opcional)* No editor do Apps Script, abra **Configurações do projeto >
Propriedades do script** e crie **`PV_SPREADSHEET_ID`** se você quer que
este site continue usando a planilha do Passivo Veicular que já existe hoje
(com todos os veículos/infrações já cadastrados) — copie aqui o mesmo ID
salvo nessa property no projeto original (o ID é o trecho da URL da
planilha entre `/d/` e `/edit`, não o `gid` do final da URL — esse é só o
identificador da aba aberta). Se não configurar, ao rodar
`criarEstruturaPassivoVeicular()` uma planilha nova e vazia é criada
automaticamente e o ID é salvo sozinho.

Depois, pelo editor do Apps Script, selecione a função
`criarEstruturaPassivoVeicular` no menu de funções e clique em Executar —
uma vez só. Ela cria (ou repara) as abas Veiculos/Infracoes/InfracoesEnvios/
TabelaInfracoes/OrgaosAutuadores/**Usuarios**.

**A aba "Usuarios" nasce vazia.** Abra a planilha do Passivo, vá na aba
"Usuarios" e adicione manualmente a primeira linha: seu e-mail na coluna
Email e `admin` na coluna Perfil. Sem essa linha, ninguém — nem
administrador — consegue entrar no site (todo mundo cai em "sem acesso").
Esse é o único login que existe neste site: é uma base própria, não a
mesma planilha/aba "Usuarios" do site de Doação Veicular (decisão
deliberada, pra não ter duas bases de usuários pra manter sincronizadas).

Depois desse primeiro usuário, o resto é feito pela tela **"👤 Usuários"**
(só aparece pra quem é admin): cadastrar/editar/remover gente, com perfil
`admin` ou `usuario` (estratificação por Operador/UF fica pra depois — por
enquanto só esses dois perfis). Ao cadastrar alguém pela tela, o site chama
`Spreadsheet.addEditor(email)` automaticamente, então a pessoa já ganha
acesso de edição à planilha do Passivo pelo Google Drive, sem precisar que
ninguém entre na planilha e compartilhe manualmente. Isso pode exigir uma
nova autorização do Google (tela de permissões) na primeira vez que o
script tentar compartilhar. O e-mail não pode ser editado depois de criado
(é a chave de login e de compartilhamento) — pra "trocar" o e-mail de
alguém, exclua e cadastre de novo.

Por fim, implante como aplicativo da web (**Implantar > Nova implantação**).

## O que foi deixado de fora de propósito

- **Seletor de painéis** (Doação/Passivo) e `voltarSeletorPaineis_()` — não
  fazem sentido num site que só tem o Passivo.
- **`importarVeiculosPassivoDF_()`** — migração pontual e histórica dos
  veículos do Distrito Federal (dados fixos hardcoded do projeto original);
  não é reaproveitável para outros estados e a planilha já existente já tem
  esses dados, se você optar por apontar `PV_SPREADSHEET_ID` para ela.
- **Restrição de veículos por UF do mobilizado** e **anexo de boleto** —
  chegaram a ser implementadas no projeto original e foram revertidas por
  causa de um bug de instabilidade do Apps Script na mesma época. Podem ser
  reavaliadas aqui, com mais calma, se fizer sentido.
