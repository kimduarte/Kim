/**
 * A página da produtividade (/produtividade). É só a "casca": nenhum dado vem
 * aqui dentro. Os números chegam depois, pela API, e só para quem entrou.
 * O comportamento está em public/produtividade/app.js e o visual em app.css.
 */

const ICONE_CARRO = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 16.5h14v-3.2l-1.6-4A2 2 0 0 0 15.5 8h-7a2 2 0 0 0-1.9 1.3L5 13.3z"/><path d="M5 13.3h14M7.5 16.5v1.8M16.5 16.5v1.8"/></svg>`;
const I_PAINEL = `<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>`;
const I_REGISTRAR = `<circle cx="12" cy="12" r="8.5"/><path d="M12 8v8M8 12h8"/>`;
const I_EQUIPE = `<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19c.7-3 2.9-4.8 5.5-4.8s4.8 1.8 5.5 4.8"/><circle cx="16.8" cy="9.5" r="2.4"/><path d="M16.8 14.3c2 0 3.5 1.3 4 3.6"/>`;
const I_AJUSTES = `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>`;
const ico = (miolo: string, tam = 17) =>
  `<svg width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${miolo}</svg>`;
const LUPA = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>`;
const MAIS = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>`;
const PLANILHA = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9.5h16M4 14.5h16M9.5 9.5V20"/></svg>`;

export function paginaProdutividade(versao: string): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light only">
<meta name="robots" content="noindex">
<title>Passivo</title>
<link rel="preload" href="/produtividade/inter.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/produtividade/app.css?v=${versao}">
<script src="/produtividade/app.js?v=${versao}" defer></script>
</head>
<body>
<noscript><p class="faixa atencao" style="margin:24px">Este sistema precisa de JavaScript ligado no navegador para funcionar.</p></noscript>

<div class="carregando" id="telaCarregando"><span class="icone-app">${ICONE_CARRO}</span><span>Carregando…</span></div>

<!-- ================= ENTRAR ================= -->
<div class="tela-entrar" id="telaEntrar" hidden>
  <form class="cartao entrar" id="formEntrar" novalidate>
    <span class="icone-app">${ICONE_CARRO}</span>
    <h1>Passivo</h1>
    <p class="sub">Produtividade do Setor de Passivo Veicular</p>
    <div class="faixa" id="xAviso" hidden><p></p></div>
    <div class="grupo">
      <label class="linha"><span class="rot">E-mail</span><input type="email" id="xEmail" class="plano" autocomplete="username" maxlength="120" placeholder="nome@orgao.gov.br" required></label>
      <label class="linha"><span class="rot">Senha</span><input type="password" id="xSenha" class="plano" autocomplete="current-password" maxlength="200" placeholder="Sua senha" required></label>
    </div>
    <button type="submit" class="btn primario grande largo" id="xEntrar">Entrar</button>
    <p class="erro" id="xErro" role="alert"></p>
    <p class="nota">Esqueceu a senha? Peça uma nova à coordenação do setor.</p>
  </form>
</div>

<!-- ================= CRIAR SENHA (primeiro acesso) ================= -->
<div class="tela-entrar" id="telaSenha" hidden>
  <form class="cartao entrar" id="formSenha" novalidate>
    <span class="icone-app">${ICONE_CARRO}</span>
    <h1>Crie a sua senha</h1>
    <p class="sub" id="sOla"></p>
    <input type="text" id="sUsuario" autocomplete="username" hidden>
    <div class="grupo">
      <label class="linha" id="sAtualLinha"><span class="rot">Provisória</span><input type="password" id="sAtual" class="plano" autocomplete="current-password" maxlength="200"></label>
      <label class="linha"><span class="rot">Nova</span><input type="password" id="sNova" class="plano" autocomplete="new-password" maxlength="200"></label>
      <label class="linha"><span class="rot">Repita</span><input type="password" id="sRepita" class="plano" autocomplete="new-password" maxlength="200"></label>
    </div>
    <p class="nota" style="text-align:left">Pelo menos 8 caracteres. Uma frase curta que só você saiba é mais segura e mais fácil de lembrar.</p>
    <button type="submit" class="btn primario grande largo" id="sSalvar">Salvar e entrar</button>
    <p class="erro" id="sErro" role="alert"></p>
    <button type="button" class="btn texto" id="sSair">Sair</button>
  </form>
</div>

<!-- ================= SISTEMA ================= -->
<div class="app" id="app" hidden>
  <aside class="lateral" aria-label="Menu principal">
    <div class="marca">
      <span class="icone-app">${ICONE_CARRO}</span>
      <div><b>Passivo</b><small id="topoUnidade">Setor de Passivo Veicular</small></div>
    </div>
    <label class="busca">${LUPA}<input type="search" id="buscaGlobal" placeholder="Buscar placa, SEI, servidor" aria-label="Buscar nos registros"></label>
    <nav class="menu" aria-label="Seções">
      <span class="secao">Produtividade</span>
      <button type="button" class="item" data-aba="painel">${ico(I_PAINEL)}Visão geral</button>
      <button type="button" class="item" data-aba="registrar">${ico(I_REGISTRAR)}Registrar</button>
      <span class="secao">Setor</span>
      <button type="button" class="item" data-aba="equipe" data-coord>${ico(I_EQUIPE)}Equipe e UFs</button>
      <button type="button" class="item" data-aba="ajustes">${ico(I_AJUSTES)}Ajustes</button>
    </nav>
    <button type="button" class="rodape-lateral" id="usuarioChip" data-ir="ajustes"></button>
  </aside>

  <main class="conteudo">
    <!-- ================= VISÃO GERAL ================= -->
    <section id="aba-painel" class="aba-conteudo" aria-labelledby="tit-painel">
      <div class="cab">
        <div><h1 id="tit-painel">Visão geral</h1><p class="sub" id="pRotulo"></p></div>
        <div class="acoes-cab">
          <button type="button" class="btn" id="btnRelatorio"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/></svg>Relatório</button>
          <button type="button" class="btn primario" data-ir="registrar">${MAIS}Registrar</button>
        </div>
      </div>
      <div class="filtros">
        <div class="seg" id="pSeg" role="group" aria-label="Período rápido">
          <button type="button" data-p="mes">Mês</button><button type="button" data-p="tres_meses">Trimestre</button><button type="button" data-p="ano">Ano</button>
        </div>
        <label class="pill-sel"><span>Período</span><select id="pPeriodo"></select></label>
        <label class="pill-sel" id="pDeCampo" hidden><span>De</span><input type="date" id="pDe"></label>
        <label class="pill-sel" id="pAteCampo" hidden><span>Até</span><input type="date" id="pAte"></label>
        <label class="pill-sel" id="pServidorCampo" data-coord><span>Servidor</span><select id="pServidor"></select></label>
        <label class="pill-sel"><span>UF</span><select id="pUF"></select></label>
      </div>
      <div class="kpis" id="kpis"></div>
      <div class="grade-2">
        <section class="cartao">
          <div class="cartao-cab"><h2 id="grafTitulo">Produção por servidor</h2><span class="nota">Atividades por categoria</span></div>
          <div class="legenda" id="legCategorias"></div>
          <div id="grafServidores"></div>
        </section>
        <section class="cartao">
          <div class="cartao-cab"><h2 id="evolTitulo">Por dia</h2><span class="chave-media" id="evolMedia"></span></div>
          <div id="grafEvolucao"></div>
          <p class="nota" id="evolResumo" style="margin-top: 14px"></p>
        </section>
      </div>
      <div class="grade-meio">
        <div class="pilha">
          <section class="cartao lista-cartao"><h2>Categorias</h2><div id="listaCategorias"></div></section>
          <section class="cartao lista-cartao"><h2>Mais registradas</h2><div id="listaTop"></div></section>
        </div>
        <section class="cartao">
          <div class="cartao-cab"><h2>Entes federados</h2><span id="mapaStatus"></span></div>
          <p class="nota" style="margin: 4px 0 18px">Clique num estado para filtrar a visão geral por ele.</p>
          <div id="mapaPainel"></div>
          <p class="nota centro" id="notaNacional" style="margin-top: 14px"></p>
          <p class="nota centro" id="notaForaLeque" style="margin-top: 6px"></p>
        </section>
      </div>
      <section class="cartao">
        <div class="cartao-cab" style="margin-bottom: 12px"><h2 id="resumoTitulo">Resumo por servidor</h2><span class="nota">Os mesmos números dos gráficos, em tabela</span></div>
        <div class="rolagem"><table class="tabela" id="tabResumo"></table></div>
      </section>
    </section>

    <!-- ================= REGISTRAR ================= -->
    <section id="aba-registrar" class="aba-conteudo" aria-labelledby="tit-registrar" hidden>
      <div class="cab">
        <div><h1 id="tit-registrar">Registrar</h1><p class="sub" id="regData"></p></div>
        <div class="acoes-cab"><button type="button" class="btn" id="lCSV">${PLANILHA}Baixar lista em planilha</button></div>
      </div>
      <div class="reg-grade">
        <div class="reg-form" id="cartaoForm">
          <div class="cartao" id="formSemEquipe" hidden>
            <h2>Cadastre a equipe primeiro</h2>
            <p class="nota" style="margin: 6px 0 14px">Para registrar atividades, o sistema precisa saber quem são as pessoas do setor.</p>
            <button type="button" class="btn primario" data-ir="equipe">Cadastrar a equipe</button>
          </div>
          <form id="form" novalidate autocomplete="off">
            <h2 id="formTitulo">Nova atividade</h2>
            <div class="grupo">
              <label class="linha"><span class="rot">Servidor</span><select id="fServidor" class="plano"></select></label>
              <label class="linha"><span class="rot">Data</span><input type="date" id="fData" class="plano data"></label>
            </div>
            <p class="rotulo-grupo">UF atendida</p>
            <div class="grupo" style="padding: 8px">
              <div class="seg cheio" id="fUFSeg" role="group" aria-label="UF atendida">
                <span class="seg-outra" id="fUFOutra"><span id="fUFOutraRot">Outra</span><select id="fUF" aria-label="Outra UF ou nacional"></select></span>
              </div>
            </div>
            <p class="rodape-grupo aviso-leque" id="fAvisoLeque" hidden></p>
            <p class="rotulo-grupo">Atividade</p>
            <div class="grupo">
              <label class="linha alta recuo"><span class="icone-cat" id="fAtvIcone"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 16.5h14v-3.2l-1.6-4A2 2 0 0 0 15.5 8h-7a2 2 0 0 0-1.9 1.3L5 13.3z"/><path d="M5 13.3h14"/></svg></span><span class="duas-l"><select id="fAtividade" class="plano titulo-sel" aria-label="Atividade"></select><small id="fDescricao"></small></span></label>
              <div class="linha"><label class="rot" for="fQtd">Quantidade</label><input type="number" id="fQtd" class="plano num" min="1" max="9999" step="1" value="1" inputmode="numeric"><span class="stepper"><button type="button" id="fMenos" aria-label="Diminuir quantidade">−</button><i></i><button type="button" id="fMais" aria-label="Aumentar quantidade">+</button></span></div>
              <label class="linha"><span class="rot">Referência</span><input type="text" id="fRef" class="plano" maxlength="120" placeholder="Opcional"></label>
              <label class="linha"><span class="rot">Observação</span><input type="text" id="fObs" class="plano" maxlength="300" placeholder="Opcional"></label>
            </div>
            <p class="rodape-grupo" id="fDescricaoLonga" hidden></p>
            <p class="rodape-grupo">A referência pode ser a placa, o número SEI ou o número do ofício.</p>
            <button type="submit" class="btn primario grande largo" id="fEnviar" style="margin-top: 22px">Registrar</button>
            <button type="button" class="btn texto largo" id="fCancelar" style="margin-top: 6px" hidden>Cancelar edição</button>
            <p class="erro" id="fErro" role="alert"></p>
            <p class="nota centro hoje-resumo" id="hojeResumo" style="margin-top: 10px"></p>
          </form>
        </div>
        <section class="cartao lista-reg" aria-labelledby="tit-registros">
          <div class="cartao-cab"><h2 id="tit-registros">Registros</h2><span class="nota" id="lContagem"></span></div>
          <div class="filtros">
            <label class="busca" style="width: 190px; background: #eeeef0">${LUPA}<input type="search" id="lBusca" placeholder="Buscar placa, SEI…" aria-label="Buscar nos registros"></label>
            <label class="pill-sel"><span>Período</span><select id="lPeriodo"></select></label>
            <label class="pill-sel" id="lDeCampo" hidden><span>De</span><input type="date" id="lDe"></label>
            <label class="pill-sel" id="lAteCampo" hidden><span>Até</span><input type="date" id="lAte"></label>
            <label class="pill-sel" data-coord><span>Servidor</span><select id="lServidor"></select></label>
            <label class="pill-sel"><span>UF</span><select id="lUF"></select></label>
            <label class="pill-sel"><span>Atividade</span><select id="lAtividade"></select></label>
            <label class="pill-sel"><span>Leque</span><select id="lLeque"><option value="">Todos</option><option value="fora">Só fora do leque</option></select></label>
          </div>
          <div id="tabRegistros" role="table" aria-label="Registros"></div>
          <div class="mais" id="lMais" hidden><button type="button" class="btn texto">Mostrar mais</button></div>
        </section>
      </div>
    </section>

    <!-- ================= EQUIPE (coordenação) ================= -->
    <section id="aba-equipe" class="aba-conteudo" aria-labelledby="tit-equipe" hidden>
      <div class="cab">
        <div><h1 id="tit-equipe">Equipe e UFs</h1><p class="sub" id="eSub"></p></div>
        <div class="acoes-cab"><button type="button" class="btn primario" id="eAdicionar">${MAIS}Adicionar pessoa</button></div>
      </div>
      <div class="eq-grade">
        <div>
          <p class="rotulo-grupo">Pessoas com acesso</p>
          <div class="grupo" id="eLista"></div>
          <p class="rodape-grupo">Clique numa pessoa para escolher quem recebe os estados no mapa. O número ao lado é o total de atividades no mês.</p>
          <div id="eInativosBloco" hidden>
            <p class="rotulo-grupo" style="margin-top: 26px">Desativadas</p>
            <div class="grupo" id="eInativos"></div>
            <p class="rodape-grupo">Quem sai do setor é desativado: não entra mais no sistema, mas o histórico continua na visão geral.</p>
          </div>
        </div>
        <section class="cartao">
          <h2>Responsabilidade por UF</h2>
          <p class="nota" style="margin-top: 4px">Escolha uma pessoa e clique nos estados que ficam com ela. Clique de novo para tirar. Cada servidor enxerga só a própria produção; o que registrar em UF de outra pessoa aparece marcado como fora do leque.</p>
          <div class="pinceis" id="ePinceis" role="group" aria-label="Atribuir estados a"></div>
          <div id="eMapa"></div>
          <div class="pendencias" id="ePendencias"></div>
        </section>
      </div>
    </section>

    <!-- ================= AJUSTES ================= -->
    <section id="aba-ajustes" class="aba-conteudo" aria-labelledby="tit-ajustes" hidden>
      <div class="cab"><div><h1 id="tit-ajustes">Ajustes</h1><p class="sub" id="aSub"></p></div></div>
      <div class="dados-grade">
        <section class="cartao flex">
          <div class="conta" id="aConta"></div>
          <div class="filtros" style="margin-top: auto; gap: 8px">
            <button type="button" class="btn" id="aTrocarSenha">Trocar senha</button>
            <button type="button" class="btn perigo" id="aSair">Sair</button>
          </div>
        </section>
        <section class="cartao flex">
          <h2>Planilha</h2>
          <p class="nota" id="aPlanilhaNota"></p>
          <button type="button" class="btn" id="aCSV" style="align-self: flex-start; margin-top: auto">${PLANILHA}Baixar planilha</button>
        </section>
        <section class="cartao largo" data-coord>
          <div class="cab" style="align-items: center">
            <div><h2>Atividades contadas</h2><p class="nota" style="margin-top: 2px">Clique no nome para ajustar. Desligue a que o setor não fizer mais: o histórico dela continua na visão geral.</p></div>
            <button type="button" class="btn" id="dNovaAtividade"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Adicionar atividade</button>
          </div>
          <div class="atv-colunas" id="dAtividades"></div>
        </section>
        <section class="cartao largo" data-coord>
          <h2 style="margin-bottom: 14px">Identificação</h2>
          <div class="grupo cinza">
            <label class="linha"><span class="rot">Nome do setor</span><input type="text" id="dSetor" class="plano" maxlength="80"></label>
            <label class="linha"><span class="rot">Unidade atendida</span><input type="text" id="dUnidade" class="plano" maxlength="140"></label>
          </div>
          <p class="rodape-grupo">Aparecem no menu e no relatório em texto.</p>
        </section>
      </div>
    </section>
  </main>

  <nav class="abas-cel" aria-label="Seções">
    <button type="button" data-aba="painel">${ico(I_PAINEL, 25)}Visão geral</button>
    <button type="button" data-aba="registrar">${ico(I_REGISTRAR, 25)}Registrar</button>
    <button type="button" data-aba="equipe" data-coord>${ico(I_EQUIPE, 25)}Equipe</button>
    <button type="button" data-aba="ajustes">${ico(I_AJUSTES, 25)}Ajustes</button>
  </nav>
</div>

<div id="dica" role="tooltip" hidden></div>
<div id="toasts" aria-live="polite"></div>
<dialog id="dialogo"></dialog>
</body>
</html>
`;
}
