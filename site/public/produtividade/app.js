/*
 * Produtividade do Setor de Passivo Veicular — tela do sistema.
 *
 * JavaScript puro, sem bibliotecas. Os dados vêm de /api/produtividade/…,
 * que confere quem entrou e o que cada pessoa pode ver. Esconder um botão
 * aqui é só conforto: a regra de acesso de verdade está no servidor.
 *
 * O desenho das telas veio da versão em arquivo (passivo-veicular/passivo.html).
 */
(() => {
  'use strict';

  // ======================================================================
  // Constantes
  // ======================================================================
  const CHAVE_PREFS = 'passivoSistema.preferencias.v1';

  const NOMES_MES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const MES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const DIA_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const DIAS_LONGOS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

  // Mosaico do Brasil: [sigla, nome, linha, coluna]
  const UFS = [
    ['RR', 'Roraima', 0, 1], ['AP', 'Amapá', 0, 2],
    ['AM', 'Amazonas', 1, 1], ['PA', 'Pará', 1, 2], ['MA', 'Maranhão', 1, 3], ['CE', 'Ceará', 1, 4], ['RN', 'Rio Grande do Norte', 1, 5],
    ['AC', 'Acre', 2, 0], ['RO', 'Rondônia', 2, 1], ['TO', 'Tocantins', 2, 2], ['PI', 'Piauí', 2, 3], ['PE', 'Pernambuco', 2, 4], ['PB', 'Paraíba', 2, 5],
    ['MT', 'Mato Grosso', 3, 1], ['GO', 'Goiás', 3, 2], ['BA', 'Bahia', 3, 3], ['SE', 'Sergipe', 3, 4], ['AL', 'Alagoas', 3, 5],
    ['MS', 'Mato Grosso do Sul', 4, 1], ['DF', 'Distrito Federal', 4, 2], ['MG', 'Minas Gerais', 4, 3], ['ES', 'Espírito Santo', 4, 4],
    ['PR', 'Paraná', 5, 1], ['SP', 'São Paulo', 5, 2], ['RJ', 'Rio de Janeiro', 5, 3],
    ['SC', 'Santa Catarina', 6, 1],
    ['RS', 'Rio Grande do Sul', 7, 1],
  ].map(([sigla, nome, lin, col]) => ({ sigla, nome, lin, col }));
  const UF_POR_SIGLA = Object.fromEntries(UFS.map((u) => [u.sigla, u]));
  const UFS_ALFA = [...UFS].sort((a, b) => a.sigla.localeCompare(b.sigla));

  const CATEGORIAS = [
    { id: 'processos', nome: 'Análise e instrução de processos', curto: 'Processos' },
    { id: 'consultas', nome: 'Consultas e apoio técnico', curto: 'Consultas' },
    { id: 'oficios', nome: 'Ofícios e solicitações', curto: 'Ofícios' },
    { id: 'diligencias', nome: 'Diligências e relatórios', curto: 'Diligências' },
    { id: 'veiculos', nome: 'Veículos regularizados', curto: 'Veículos' },
  ];
  const IDX_CATEGORIA = Object.fromEntries(CATEGORIAS.map((c, i) => [c.id, i]));

  // ======================================================================
  // Utilitários
  // ======================================================================
  const $ = (id) => document.getElementById(id);
  const numFmt = new Intl.NumberFormat('pt-BR');
  const decFmt = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const fmtNum = (n) => numFmt.format(n);
  const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);
  const pctTxt = (v, t) => (!t ? '0%' : v > 0 && v / t < 0.01 ? '<1%' : `${Math.round((v / t) * 100)}%`);
  const capitalizar = (t) => t.charAt(0).toUpperCase() + t.slice(1);

  function el(tag, props, ...filhos) {
    const n = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v === undefined || v === null || v === false) continue;
        if (k === 'class') n.className = v;
        else if (k === 'text') n.textContent = v;
        else if (k === 'style') n.style.cssText = v;
        else if (k === 'value') n.value = v;
        else if (k === 'checked') n.checked = !!v;
        else if (k === 'selected') n.selected = !!v;
        else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
        else n.setAttribute(k, v === true ? '' : v);
      }
    }
    for (const f of filhos.flat(Infinity)) {
      if (f === undefined || f === null || f === false) continue;
      n.append(f && f.nodeType ? f : String(f));
    }
    return n;
  }

  // replaceChildren escreveria "null" na tela; aqui vazios são ignorados
  function preencher(no, ...filhos) {
    no.replaceChildren(...filhos.flat(Infinity).filter((f) => f !== null && f !== undefined && f !== false));
  }

  const normalizar = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

  // Datas sempre como texto AAAA-MM-DD no fuso do computador (nunca UTC).
  const pad = (n) => String(n).padStart(2, '0');
  const isoYMD = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
  const isoDe = (d) => isoYMD(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const hojeISO = () => isoDe(new Date());
  const partes = (s) => s.split('-').map(Number);
  const dataDe = (s) => { const [y, m, d] = partes(s); return new Date(y, m - 1, d); };
  const somaDias = (s, n) => { const d = dataDe(s); d.setDate(d.getDate() + n); return isoDe(d); };
  const diffDias = (a, b) => Math.round((dataDe(b) - dataDe(a)) / 864e5);
  const ultimoDia = (y, m) => new Date(y, m, 0).getDate();
  const mesAnterior = (y, m) => (m === 1 ? [y - 1, 12] : [y, m - 1]);
  const fmtData = (s) => { const [y, m, d] = partes(s); return `${pad(d)}/${pad(m)}/${y}`; };
  const fmtDM = (s) => { const [, m, d] = partes(s); return `${pad(d)}/${pad(m)}`; };
  const fmtDataHora = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const dataValida = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && isoDe(dataDe(s)) === s;
  function diasUteis(de, ate) {
    let n = 0;
    for (let d = dataDe(de), fim = dataDe(ate); d <= fim; d.setDate(d.getDate() + 1)) {
      const w = d.getDay();
      if (w !== 0 && w !== 6) n++;
    }
    return n;
  }
  function dataPorExtenso(iso) {
    const [y, m, d] = partes(iso);
    return `${capitalizar(DIAS_LONGOS[dataDe(iso).getDay()])}, ${d} de ${NOMES_MES[m - 1]} de ${y}`;
  }
  function dataCurta(iso) {
    const [y, m, d] = partes(iso);
    return `${d} ${MES_CURTO[m - 1]}${y !== partes(hojeISO())[0] ? ` ${y}` : ''}`;
  }

  function iniciais(nome) {
    const p = String(nome || '').trim().split(/\s+/).filter(Boolean);
    if (!p.length) return '?';
    const a = p[0][0];
    const b = p.length > 1 ? p[p.length - 1][0] : (p[0][1] || '');
    return (a + b).toUpperCase();
  }
  const primeiroNome = (nome) => String(nome || '').split(' ')[0];

  function debounce(fn, ms) {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  }

  // ======================================================================
  // Conversa com o servidor
  // ======================================================================
  class ErroApi extends Error {
    constructor(mensagem, status, codigo) { super(mensagem); this.status = status; this.codigo = codigo; }
  }

  async function api(acao, dados) {
    const opcoes = dados === undefined
      ? { credentials: 'same-origin', headers: { accept: 'application/json' } }
      : { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify(dados) };
    let resp;
    try {
      resp = await fetch(`/api/produtividade/${acao}`, opcoes);
    } catch (e) {
      throw new ErroApi('Sem conexão com o servidor. Confira a internet e tente de novo.', 0);
    }
    let corpo = null;
    try { corpo = await resp.json(); } catch (e) { /* resposta sem JSON */ }
    if (resp.ok) return corpo || {};
    const erro = new ErroApi((corpo && corpo.erro) || 'Não foi possível concluir agora. Tente de novo em instantes.', resp.status, corpo && corpo.codigo);
    if (erro.codigo === 'sessao' && acao !== 'entrar') sessaoTerminou();
    else if (erro.codigo === 'trocar_senha') mostrarTela('senha');
    throw erro;
  }

  // Roda uma ação que fala com o servidor; se der errado, avisa na tela.
  async function tentar(fn) {
    try {
      return await fn();
    } catch (e) {
      if (!(e instanceof ErroApi)) { console.error(e); aviso('Algo deu errado. Recarregue a página e tente de novo.'); return undefined; }
      if (e.codigo !== 'sessao' && e.codigo !== 'trocar_senha') aviso(e.message);
      return undefined;
    }
  }

  // ======================================================================
  // Estado (o que o servidor deixou esta pessoa ver)
  // ======================================================================
  let estado = null;
  let prefs;
  let carregadoEm = 0;

  function aplicarEstado(d) {
    const { campos, linhas } = d.registros;
    estado = {
      usuario: d.usuario,
      setor: d.setor,
      atividades: d.atividades,
      servidores: d.servidores,
      ufs: d.ufs,
      registros: linhas.map((l) => {
        const r = {};
        campos.forEach((c, i) => { r[c] = l[i]; });
        r.foraDoLeque = !!r.foraDoLeque;
        return r;
      }),
    };
    carregadoEm = Date.now();
  }

  function lerPrefs() {
    const padrao = {
      aba: 'painel',
      painel: { periodo: 'mes', de: '', ate: '', servidor: '', uf: '' },
      lista: { periodo: 'mes', de: '', ate: '', servidor: '', uf: '', atividade: '', busca: '', leque: '' },
      form: { servidor: '', uf: null },
    };
    try {
      const p = JSON.parse(localStorage.getItem(CHAVE_PREFS) || 'null');
      if (p) return { ...padrao, ...p, painel: { ...padrao.painel, ...p.painel }, lista: { ...padrao.lista, ...p.lista }, form: { ...padrao.form, ...p.form } };
    } catch (e) { /* usa o padrão */ }
    return padrao;
  }
  function salvarPrefs() { try { localStorage.setItem(CHAVE_PREFS, JSON.stringify(prefs)); } catch (e) { /* sem armazenamento: só não lembra os filtros */ } }

  // ---------------------------------------------------------------------
  // Consultas ao estado
  // ---------------------------------------------------------------------
  const souCoord = () => !!estado && estado.usuario.papel === 'coordenacao';
  const euId = () => estado.usuario.id;
  const registrosValidos = () => estado.registros.filter((r) => !r.excluido);
  const servidoresVisiveis = () => estado.servidores;
  const servidoresAtivos = () => estado.servidores.filter((s) => s.ativo);
  const servidorPorId = (id) => estado.servidores.find((s) => s.id === id);
  const nomeServidor = (id) => (servidorPorId(id) || {}).nome || 'Conta removida';
  const atividadePorId = (id) => estado.atividades.find((a) => a.id === id);
  const catIdx = (atividadeId) => { const a = atividadePorId(atividadeId); return a ? IDX_CATEGORIA[a.categoriaId] : 0; };
  const atividadesOrdenadas = () => [...estado.atividades].sort((a, b) => IDX_CATEGORIA[a.categoriaId] - IDX_CATEGORIA[b.categoriaId] || a.ordem - b.ordem);
  const responsavel = (sigla) => { const r = estado.ufs[sigla]; return r && r.servidorId ? servidorPorId(r.servidorId) : null; };
  const ufsDoServidor = (id) => UFS_ALFA.filter((u) => { const r = estado.ufs[u.sigla]; return r && r.servidorId === id; }).map((u) => u.sigla);
  const meuLeque = () => ufsDoServidor(euId());

  // ======================================================================
  // Períodos
  // ======================================================================
  function preencherPeriodos(select, valor) {
    const [Y, M] = partes(hojeISO());
    const meses = [];
    let [y, m] = mesAnterior(...mesAnterior(Y, M));
    for (let i = 0; i < 12; i++) { meses.push([y, m]); [y, m] = mesAnterior(y, m); }
    select.replaceChildren(
      el('option', { value: 'mes', text: 'Este mês' }),
      el('option', { value: 'mes_passado', text: 'Mês passado' }),
      el('option', { value: 'tres_meses', text: 'Últimos 3 meses' }),
      el('option', { value: 'ano', text: 'Este ano' }),
      el('option', { value: 'tudo', text: 'Todo o histórico' }),
      el('optgroup', { label: 'Meses anteriores' }, meses.map(([yy, mm]) => el('option', { value: `m:${yy}-${pad(mm)}`, text: `${NOMES_MES[mm - 1]} de ${yy}` }))),
      el('option', { value: 'custom', text: 'Escolher datas…' }),
    );
    select.value = valor;
    if (select.value !== valor) select.value = 'mes';
  }

  function resolverPeriodo(f) {
    const hoje = hojeISO();
    const [Y, M, D] = partes(hoje);
    const p = f.periodo || 'mes';
    let de; let ate; let rotulo; let ant = null;
    if (p === 'mes') {
      de = isoYMD(Y, M, 1); ate = hoje;
      const [py, pm] = mesAnterior(Y, M);
      ant = { de: isoYMD(py, pm, 1), ate: isoYMD(py, pm, Math.min(D, ultimoDia(py, pm))) };
      rotulo = `${NOMES_MES[M - 1]} de ${Y}, até ${fmtDM(hoje)}`;
    } else if (p === 'mes_passado') {
      const [py, pm] = mesAnterior(Y, M);
      de = isoYMD(py, pm, 1); ate = isoYMD(py, pm, ultimoDia(py, pm));
      const [qy, qm] = mesAnterior(py, pm);
      ant = { de: isoYMD(qy, qm, 1), ate: isoYMD(qy, qm, ultimoDia(qy, qm)), nome: NOMES_MES[qm - 1] };
      rotulo = `${NOMES_MES[pm - 1]} de ${py}`;
    } else if (p === 'tres_meses') {
      let [y, m] = [Y, M];
      for (let i = 0; i < 2; i++) [y, m] = mesAnterior(y, m);
      de = isoYMD(y, m, 1); ate = hoje;
      const n = diffDias(de, ate) + 1;
      ant = { de: somaDias(de, -n), ate: somaDias(de, -1) };
      rotulo = `${fmtData(de)} a ${fmtData(ate)}`;
    } else if (p === 'ano') {
      de = isoYMD(Y, 1, 1); ate = hoje;
      ant = { de: isoYMD(Y - 1, 1, 1), ate: isoYMD(Y - 1, M, Math.min(D, ultimoDia(Y - 1, M))) };
      rotulo = `${Y}, até ${fmtDM(hoje)}`;
    } else if (p === 'tudo') {
      const datas = registrosValidos().map((r) => r.data);
      de = datas.length ? datas.reduce((a, b) => (a < b ? a : b)) : hoje;
      const maior = datas.length ? datas.reduce((a, b) => (a > b ? a : b)) : hoje;
      ate = maior > hoje ? maior : hoje;
      rotulo = `todo o histórico, de ${fmtData(de)} a ${fmtData(ate)}`;
    } else if (p.startsWith('m:')) {
      const [y, m] = p.slice(2).split('-').map(Number);
      de = isoYMD(y, m, 1); ate = isoYMD(y, m, ultimoDia(y, m));
      if (ate > hoje) ate = hoje;
      const [py, pm] = mesAnterior(y, m);
      ant = { de: isoYMD(py, pm, 1), ate: isoYMD(py, pm, ultimoDia(py, pm)), nome: NOMES_MES[pm - 1] };
      rotulo = `${NOMES_MES[m - 1]} de ${y}`;
    } else {
      de = dataValida(f.de) ? f.de : isoYMD(Y, M, 1);
      ate = dataValida(f.ate) ? f.ate : hoje;
      if (de > ate) [de, ate] = [ate, de];
      const n = diffDias(de, ate) + 1;
      ant = { de: somaDias(de, -n), ate: somaDias(de, -1) };
      rotulo = `${fmtData(de)} a ${fmtData(ate)}`;
    }
    if (ant && !ant.nome) {
      ant.nome = partes(ant.de)[0] === Y && partes(ant.ate)[0] === Y ? `${fmtDM(ant.de)} a ${fmtDM(ant.ate)}` : `${fmtData(ant.de)} a ${fmtData(ant.ate)}`;
    }
    return { de, ate, rotulo, ant };
  }

  function filtrar(regs, f, per) {
    const servidor = souCoord() ? f.servidor : '';
    return regs.filter((r) => r.data >= per.de && r.data <= per.ate
      && (!servidor || r.servidorId === servidor)
      && (!f.uf || (f.uf === '_' ? !r.uf : r.uf === f.uf)));
  }

  function preencherServidores(select, valor, rotuloTodos) {
    const lista = [...servidoresVisiveis()].sort((a, b) => a.nome.localeCompare(b.nome));
    select.replaceChildren(el('option', { value: '', text: rotuloTodos }), ...lista.map((s) => el('option', { value: s.id, text: s.ativo ? s.nome : `${s.nome} (desativado)` })));
    select.value = valor || '';
    if (select.value !== (valor || '')) select.value = '';
  }
  function preencherUFsFiltro(select, valor) {
    select.replaceChildren(
      el('option', { value: '', text: 'Todas' }),
      el('option', { value: '_', text: 'Nacional (sem UF)' }),
      ...UFS_ALFA.map((u) => el('option', { value: u.sigla, text: `${u.sigla} – ${u.nome}` })),
    );
    select.value = valor || '';
    if (select.value !== (valor || '')) select.value = '';
  }

  // ======================================================================
  // Visual "Passivo": ícones, cores e peças de tela
  // ======================================================================
  function svg(marcacao) {
    const t = document.createElement('template');
    t.innerHTML = marcacao.trim();
    return t.content.firstChild;
  }
  const MAIS_CIRCULO = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 8v8M8 12h8"/></svg>';
  const CHECK_VERDE = '<svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" style="flex-shrink:0"><circle cx="12" cy="12" r="10" fill="#34c759"/><path d="m7.5 12.3 3 3 6-6.3" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ALERTA_LARANJA = '<svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" style="flex-shrink:0"><circle cx="12" cy="12" r="10" fill="#ff9500"/><path d="M12 7v6M12 16.5h.01" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>';
  function chev() {
    return svg('<svg class="chev" width="8" height="13" viewBox="0 0 8 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m1.5 1.5 5 5-5 5"/></svg>');
  }
  const PALETA_SRV = [['#007aff', '#ffffff'], ['#ff9500', '#1d1d1f'], ['#30b0c7', '#1d1d1f'], ['#af52de', '#ffffff'], ['#ff2d55', '#ffffff'], ['#34c759', '#1d1d1f'], ['#5856d6', '#ffffff'], ['#a2845e', '#ffffff']];
  const corSrv = (s) => PALETA_SRV[((s && s.corIdx) || 0) % PALETA_SRV.length];
  function avatar(s, classe) {
    const [bg, fg] = corSrv(s);
    return el('span', { class: `avatar${classe ? ` ${classe}` : ''}`, style: `background:${bg}; color:${fg}`, text: iniciais(s.nome), 'aria-hidden': 'true' });
  }
  const RAMPA = [['#e3eeff', '#1d1d1f'], ['#b9d5ff', '#1d1d1f'], ['#7fb2ff', '#1d1d1f'], ['#2f80f5', '#ffffff'], ['#0a5bc4', '#ffffff']];
  const nomePapel = (p) => (p === 'coordenacao' ? 'Coordenação' : 'Servidor');

  // ======================================================================
  // Dica flutuante, avisos e diálogo
  // ======================================================================
  const dica = $('dica');
  let dicaTimer;
  function mostrarDica(conteudo, x, y) {
    const filhos = [];
    if (conteudo.titulo) filhos.push(el('div', { class: 'd-tit', text: conteudo.titulo }));
    for (const l of conteudo.linhas || []) {
      filhos.push(el('div', { class: 'd-lin' },
        l.cor ? el('i', { class: 'd-chave', style: `background:${l.cor}` }) : null,
        el('b', { text: l.valor }), el('span', { text: l.rotulo })));
    }
    if (conteudo.rodape) filhos.push(el('div', { class: 'd-rod', text: conteudo.rodape }));
    dica.replaceChildren(...filhos);
    dica.hidden = false;
    posicionarDica(x, y);
  }
  function posicionarDica(x, y) {
    const r = dica.getBoundingClientRect();
    let left = x + 14; let top = y + 14;
    if (left + r.width > window.innerWidth - 8) left = x - r.width - 14;
    if (top + r.height > window.innerHeight - 8) top = y - r.height - 14;
    dica.style.left = `${Math.max(8, left)}px`;
    dica.style.top = `${Math.max(8, top)}px`;
  }
  function esconderDica() { dica.hidden = true; clearTimeout(dicaTimer); }
  function ligarDica(no, construir) {
    no.addEventListener('pointerenter', (ev) => {
      mostrarDica(construir(), ev.clientX, ev.clientY);
      if (ev.pointerType === 'touch') { clearTimeout(dicaTimer); dicaTimer = setTimeout(esconderDica, 2600); }
    });
    no.addEventListener('pointermove', (ev) => { if (ev.pointerType !== 'touch' && !dica.hidden) posicionarDica(ev.clientX, ev.clientY); });
    no.addEventListener('pointerleave', (ev) => { if (ev.pointerType !== 'touch') esconderDica(); });
    no.addEventListener('focus', () => { const r = no.getBoundingClientRect(); mostrarDica(construir(), r.right, r.top); });
    no.addEventListener('blur', esconderDica);
  }
  window.addEventListener('scroll', esconderDica, { passive: true });

  function aviso(msg, acao) {
    const t = el('div', { class: 'toast', role: 'status' }, acao ? svg(CHECK_VERDE) : null, el('span', { text: msg }));
    let timer;
    const fechar = () => { clearTimeout(timer); t.remove(); };
    if (acao) t.append(el('button', { type: 'button', text: acao.rotulo, onclick: () => { fechar(); acao.fn(); } }));
    $('toasts').replaceChildren(t);
    timer = setTimeout(fechar, acao ? 8000 : 5000);
  }

  // O botão principal vem primeiro no código (Enter confirma), mas aparece à direita.
  function dialogo({ titulo, corpo, botoes, largo }) {
    return new Promise((resolve) => {
      const d = $('dialogo');
      const itens = Array.isArray(corpo) ? corpo : [corpo];
      d.classList.toggle('largo', !!largo || itens.some((c) => c && c.tagName === 'TEXTAREA'));
      const classe = (c) => (c === 'btn-primario' ? 'primario' : c === 'btn-perigo' ? 'perigo' : c || '');
      const ordenados = botoes.map((b, i) => ({ ...b, i })).sort((a, b) => (b.classe ? 1 : 0) - (a.classe ? 1 : 0));
      const form = el('form', { method: 'dialog', class: 'dlg' },
        el('h2', { text: titulo }),
        itens,
        el('div', { class: 'dlg-acoes' }, ordenados.map((b) => el('button', {
          type: b.tipo || 'submit', value: b.valor || '', class: `btn ${classe(b.classe)}`, text: b.rotulo, onclick: b.onclick, style: `order:${b.i}`,
        }))));
      d.replaceChildren(form);
      d.returnValue = '';
      d.onclose = () => resolve(d.returnValue);
      if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
      const foco = d.querySelector('input, select, textarea') || d.querySelector('.btn.primario, .btn.perigo');
      if (foco) foco.focus();
    });
  }
  const dialogoAberto = () => $('dialogo').open;

  async function copiar(texto, area) {
    try {
      await navigator.clipboard.writeText(texto);
      aviso('Texto copiado.');
    } catch (e) {
      if (area) { area.focus(); area.select(); }
      aviso('O texto está selecionado. Use Ctrl+C para copiar.');
    }
  }

  function baixar(nome, conteudo, tipo) {
    const blob = new Blob([conteudo], { type: tipo });
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: nome });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function mostrarSenhaProvisoria(nome, senha, email) {
    const caixa = el('div', { class: 'senha-provisoria', text: senha });
    return dialogo({
      titulo: `Senha provisória de ${primeiroNome(nome)}`,
      corpo: [
        el('p', { text: `Passe esta senha para ${nome} por um canal reservado (pessoalmente ou por mensagem direta). No primeiro acesso, o sistema pede para criar uma senha definitiva.` }),
        caixa,
        el('p', {}, 'Para entrar: abra este mesmo endereço e use o e-mail ', el('b', { text: email }), '. A senha não aparece de novo; se perder, gere outra.'),
      ],
      botoes: [
        { rotulo: 'Fechar', valor: 'ok' },
        { rotulo: 'Copiar senha', tipo: 'button', classe: 'btn-primario', onclick: () => copiar(senha) },
      ],
    });
  }

  // ======================================================================
  // Entrar, criar senha e sair
  // ======================================================================
  let senhaDigitada = '';

  function mostrarTela(qual) {
    $('telaCarregando').hidden = qual !== 'carregando';
    $('telaEntrar').hidden = qual !== 'entrar';
    $('telaSenha').hidden = qual !== 'senha';
    $('app').hidden = qual !== 'app';
    if (qual !== 'app') esconderDica();
    if (qual === 'entrar') {
      document.title = 'Entrar · Passivo';
      setTimeout(() => ($('xEmail').value ? $('xSenha') : $('xEmail')).focus(), 0);
    } else if (qual === 'senha') {
      document.title = 'Criar senha · Passivo';
      const u = estado ? estado.usuario : null;
      $('sOla').textContent = u ? `Olá, ${primeiroNome(u.nome)}. Antes de começar, troque a senha provisória por uma só sua.` : '';
      $('sUsuario').value = u ? u.email : '';
      $('sAtualLinha').hidden = !!senhaDigitada;
      setTimeout(() => (senhaDigitada ? $('sNova') : $('sAtual')).focus(), 0);
    } else if (qual === 'app') {
      document.title = 'Passivo';
    }
  }

  function sessaoTerminou() {
    if (!$('app').hidden || !$('telaSenha').hidden) {
      if (dialogoAberto()) $('dialogo').close();
      $('xAviso').hidden = false;
      $('xAviso').firstElementChild.textContent = 'Sua sessão terminou. Entre de novo para continuar; o que estava na tela continua lá.';
    }
    mostrarTela('entrar');
  }

  async function carregarEEntrar() {
    const d = await api('estado');
    if (d.trocarSenha) {
      estado = { usuario: d.usuario };
      mostrarTela('senha');
      return;
    }
    const primeira = !estado || !estado.registros;
    const trocouDeConta = estado && estado.registros && estado.usuario.id !== d.usuario.id;
    aplicarEstado(d);
    senhaDigitada = '';
    if (trocouDeConta) { editandoId = null; pincel = null; prefs = lerPrefs(); }
    mostrarTela('app');
    if (primeira || trocouDeConta) {
      const hash = (location.hash || '').replace('#', '');
      mostrarAba(ABAS.includes(hash) ? hash : prefs.aba);
    } else {
      renderTudo();
    }
  }

  async function entrar(ev) {
    ev.preventDefault();
    const email = $('xEmail').value.trim();
    const senha = $('xSenha').value;
    $('xErro').textContent = '';
    if (!email || !senha) { $('xErro').textContent = 'Preencha o e-mail e a senha.'; return; }
    $('xEntrar').disabled = true;
    try {
      await api('entrar', { email, senha });
      senhaDigitada = senha;
      $('xSenha').value = '';
      $('xAviso').hidden = true;
      await carregarEEntrar();
    } catch (e) {
      $('xErro').textContent = e.message;
      $('xSenha').select();
    } finally {
      $('xEntrar').disabled = false;
    }
  }

  async function salvarSenhaNova(ev) {
    ev.preventDefault();
    const atual = senhaDigitada || $('sAtual').value;
    const nova = $('sNova').value;
    $('sErro').textContent = '';
    if (!atual) { $('sErro').textContent = 'Digite a senha provisória que você recebeu.'; return; }
    if (nova.length < 8) { $('sErro').textContent = 'A senha nova precisa ter pelo menos 8 caracteres.'; return; }
    if (nova !== $('sRepita').value) { $('sErro').textContent = 'As duas senhas novas não estão iguais.'; return; }
    $('sSalvar').disabled = true;
    try {
      await api('trocar-senha', { atual, nova });
      senhaDigitada = '';
      ['sAtual', 'sNova', 'sRepita'].forEach((id) => { $(id).value = ''; });
      await carregarEEntrar();
      aviso('Senha criada. Bem-vindo(a) ao Passivo.');
    } catch (e) {
      if (e.codigo !== 'sessao') $('sErro').textContent = e.message;
      if (/atual/.test(e.message)) { senhaDigitada = ''; $('sAtualLinha').hidden = false; }
    } finally {
      $('sSalvar').disabled = false;
    }
  }

  async function sair() {
    try { await api('sair', {}); } catch (e) { /* sai da tela de qualquer jeito */ }
    estado = null;
    senhaDigitada = '';
    editandoId = null;
    pincel = null;
    $('xAviso').hidden = true;
    $('xSenha').value = '';
    mostrarTela('entrar');
  }

  // ======================================================================
  // Navegação
  // ======================================================================
  const ABAS = ['painel', 'registrar', 'equipe', 'ajustes'];
  let abaAtual = '';
  function mostrarAba(nome) {
    if (!ABAS.includes(nome) || (nome === 'equipe' && !souCoord())) nome = 'painel';
    const trocou = nome !== abaAtual;
    abaAtual = nome;
    ABAS.forEach((a) => { $(`aba-${a}`).hidden = a !== nome; });
    document.querySelectorAll('[data-aba]').forEach((b) => {
      if (b.dataset.aba === nome) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    prefs.aba = nome;
    salvarPrefs();
    try { history.replaceState(null, '', `#${nome}`); } catch (e) { /* sem histórico */ }
    esconderDica();
    if (trocou) window.scrollTo(0, 0);
    renderCabecalho();
    renderAba();
  }
  function renderAba() {
    if (abaAtual === 'painel') renderPainel();
    else if (abaAtual === 'registrar') renderRegistrar();
    else if (abaAtual === 'equipe') renderEquipe();
    else renderAjustes();
  }
  function renderTudo() {
    if (abaAtual === 'equipe' && !souCoord()) { mostrarAba('painel'); return; }
    renderCabecalho();
    renderAba();
  }
  function renderCabecalho() {
    const coord = souCoord();
    document.querySelectorAll('[data-coord]').forEach((n) => { n.hidden = !coord; });
    $('topoUnidade').textContent = estado.setor.nome || 'Setor de Passivo Veicular';
    const eu = servidorPorId(euId()) || estado.usuario;
    $('usuarioChip').replaceChildren(avatar(eu), el('span', { class: 'duas-l' }, el('b', { text: eu.nome }), el('small', { text: nomePapel(estado.usuario.papel) })));
  }

  // Volta ao servidor para pegar o que outras pessoas registraram.
  async function recarregar() {
    if (!estado || !estado.registros || $('app').hidden) return;
    try {
      const d = await api('estado');
      if (d.trocarSenha) { estado = { usuario: d.usuario }; mostrarTela('senha'); return; }
      aplicarEstado(d);
      if (!dialogoAberto() && !editandoId) renderTudo(); else renderCabecalho();
    } catch (e) { /* sem conexão: tenta de novo na próxima vez */ }
  }

  // ======================================================================
  // VISÃO GERAL
  // ======================================================================
  function soma(regs, filtro) {
    let t = 0;
    for (const r of regs) if (!filtro || filtro(r)) t += r.qtd;
    return t;
  }

  function nomeAnterior(f, per) {
    if (!per.ant) return '';
    if (f.periodo === 'mes') { const [, m, d] = partes(per.ant.ate); return `${NOMES_MES[m - 1]} até o dia ${d}`; }
    if (f.periodo === 'ano') return `${partes(per.ant.de)[0]} no mesmo período`;
    return per.ant.nome;
  }

  function renderPainel() {
    const f = prefs.painel;
    const coord = souCoord();
    preencherPeriodos($('pPeriodo'), f.periodo);
    f.periodo = $('pPeriodo').value;
    $('pSeg').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.p === f.periodo)));
    const custom = f.periodo === 'custom';
    $('pDeCampo').hidden = !custom;
    $('pAteCampo').hidden = !custom;
    if (coord) {
      preencherServidores($('pServidor'), f.servidor, 'Todos');
      f.servidor = $('pServidor').value;
    }
    preencherUFsFiltro($('pUF'), f.uf);
    f.uf = $('pUF').value;

    const per = resolverPeriodo(f);
    if (custom) { f.de = per.de; f.ate = per.ate; $('pDe').value = per.de; $('pAte').value = per.ate; }
    const todos = registrosValidos();
    const regs = filtrar(todos, f, per);
    const regsAnt = per.ant ? filtrar(todos, f, per.ant) : null;
    const uteis = diasUteis(per.de, per.ate);
    const escopo = [];
    if (coord && f.servidor) escopo.push(nomeServidor(f.servidor));
    if (!coord) escopo.push('sua produção');
    if (f.uf) escopo.push(f.uf === '_' ? 'sem UF específica' : UF_POR_SIGLA[f.uf].nome);
    $('pRotulo').textContent = `${capitalizar(per.rotulo)} · ${fmtNum(uteis)} ${uteis === 1 ? 'dia útil' : 'dias úteis'}${escopo.length ? ` · ${escopo.join(' · ')}` : ''}`;

    renderKPIs(regs, regsAnt, uteis, nomeAnterior(f, per));
    $('legCategorias').replaceChildren(...CATEGORIAS.map((c, i) => el('span', {}, el('i', { class: 'ponto', style: `background:var(--c${i + 1})` }), c.curto)));
    $('grafTitulo').textContent = coord ? 'Produção por servidor' : 'Produção por UF';
    $('resumoTitulo').textContent = coord ? 'Resumo por servidor' : 'Resumo por UF';
    renderGrafServidores(regs, f);
    renderEvolucao(regs, per);
    renderCategorias(regs);
    renderTop(regs);
    renderMapaPainel(regs, f);
    renderResumo(regs, f);
  }

  function renderKPIs(regs, regsAnt, uteis, nomeAnt) {
    const delta = (atual, anterior) => {
      if (anterior === null) return el('span', { class: 'kpi-delta', text: 'Sem período anterior para comparar' });
      if (anterior === 0 && atual === 0) return el('span', { class: 'kpi-delta', text: `Nenhum também em ${nomeAnt}` });
      if (anterior === 0) return el('span', { class: 'kpi-delta', text: `Nenhum em ${nomeAnt}` });
      const v = Math.round(((atual - anterior) / anterior) * 100);
      if (v === 0) return el('span', { class: 'kpi-delta', text: `Igual a ${nomeAnt} (${fmtNum(anterior)})` });
      return el('span', { class: `kpi-delta ${v > 0 ? 'bom' : 'ruim'}`, text: `${v > 0 ? '↑' : '↓'} ${Math.abs(v)}% vs ${nomeAnt} (${fmtNum(anterior)})` });
    };
    const cartao = (rot, cor, valor, extra, ...resto) => el('div', { class: 'kpi' },
      el('span', { class: 'kpi-rot' }, el('i', { class: 'ponto', style: `background:${cor}` }), rot),
      el('span', { class: 'kpi-val' }, valor, extra ? el('small', { text: extra }) : null),
      ...resto);
    const total = soma(regs);
    const transf = soma(regs, (r) => r.atividadeId === 'transferido');
    const baix = soma(regs, (r) => r.atividadeId === 'baixado');
    const atendidas = new Set(regs.filter((r) => r.uf).map((r) => r.uf));
    let ufsCartao;
    if (souCoord()) {
      const faltam = UFS_ALFA.filter((u) => !atendidas.has(u.sigla)).map((u) => u.sigla);
      ufsCartao = cartao('Entes atendidos', 'var(--c3)', fmtNum(atendidas.size), ' de 27',
        el('span', { class: 'kpi-delta', text: faltam.length === 0 ? 'Todos com atendimento' : faltam.length <= 5 ? `Sem atendimento: ${faltam.join(', ')}` : `${faltam.length} sem atendimento` }));
    } else {
      const leque = meuLeque();
      const noLeque = leque.filter((u) => atendidas.has(u));
      const faltam = leque.filter((u) => !atendidas.has(u));
      const fora = [...atendidas].filter((u) => !leque.includes(u)).length;
      ufsCartao = leque.length
        ? cartao('UFs do seu leque', 'var(--c3)', fmtNum(noLeque.length), ` de ${leque.length}`,
          el('span', { class: 'kpi-delta', text: faltam.length === 0 ? 'Todas com atendimento' : `Sem atendimento: ${faltam.join(', ')}` }),
          fora ? el('span', { class: 'kpi-extra', text: `E mais ${fora} fora do leque` }) : null)
        : cartao('UFs atendidas', 'var(--c3)', fmtNum(atendidas.size), '',
          el('span', { class: 'kpi-delta', text: 'Nenhuma UF no seu leque ainda. A coordenação distribui as UFs.' }));
    }
    $('kpis').replaceChildren(
      cartao('Atividades', 'var(--c1)', fmtNum(total), '', delta(total, regsAnt ? soma(regsAnt) : null),
        uteis ? el('span', { class: 'kpi-extra', text: `${decFmt.format(total / uteis)} por dia útil` }) : null),
      cartao('Veículos transferidos', '#34c759', fmtNum(transf), '', delta(transf, regsAnt ? soma(regsAnt, (r) => r.atividadeId === 'transferido') : null)),
      cartao('Veículos baixados', '#ff9500', fmtNum(baix), '', delta(baix, regsAnt ? soma(regsAnt, (r) => r.atividadeId === 'baixado') : null)),
      ufsCartao,
    );
  }

  // Linhas do gráfico e da tabela: por servidor (coordenação) ou por UF (servidor).
  const vazioCats = () => CATEGORIAS.map(() => 0);
  function linhasGrafico(regs, f) {
    const mapa = new Map();
    const chave = souCoord() ? (r) => r.servidorId : (r) => r.uf || '_';
    for (const r of regs) {
      const k = chave(r);
      let m = mapa.get(k);
      if (!m) { m = { total: 0, cats: vazioCats() }; mapa.set(k, m); }
      m.cats[catIdx(r.atividadeId)] += r.qtd;
      m.total += r.qtd;
    }
    const ids = new Set(mapa.keys());
    if (souCoord()) {
      if (!f.servidor && !f.uf) servidoresAtivos().forEach((s) => ids.add(s.id));
      if (f.servidor) ids.add(f.servidor);
      return [...ids].map((id) => {
        const ufs = ufsDoServidor(id);
        return { id, nome: nomeServidor(id), sub: ufs.length ? ufs.join(', ') : 'Sem UF atribuída', ...(mapa.get(id) || { total: 0, cats: vazioCats() }) };
      }).sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome));
    }
    const leque = meuLeque();
    if (!f.uf) leque.forEach((u) => ids.add(u));
    return [...ids].map((id) => ({
      id,
      nome: id === '_' ? 'Nacional' : `${UF_POR_SIGLA[id].nome} (${id})`,
      sub: id === '_' ? 'Sem UF específica' : leque.includes(id) ? 'No seu leque' : 'Fora do seu leque',
      ...(mapa.get(id) || { total: 0, cats: vazioCats() }),
    })).sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome));
  }

  function renderGrafServidores(regs, f) {
    const cont = $('grafServidores');
    const linhas = linhasGrafico(regs, f);
    if (!linhas.length) {
      cont.replaceChildren(el('p', { class: 'nota', text: souCoord() ? 'Ninguém cadastrado ainda. Cadastre a equipe em Equipe e UFs.' : 'Nenhuma atividade registrada no período.' }));
      return;
    }
    const max = Math.max(1, ...linhas.map((l) => l.total));
    const totalGeral = linhas.reduce((a, l) => a + l.total, 0);
    cont.replaceChildren(el('div', { class: 'hb' }, linhas.map((l) => {
      const barra = el('div', { class: 'hb-barra', style: `width:calc((100% - 3rem) * ${l.total / max})` });
      l.cats.forEach((v, i) => {
        if (!v) return;
        const seg = el('div', { class: 'hb-seg', style: `flex-grow:${v}; background:var(--c${i + 1})` });
        ligarDica(seg, () => ({
          titulo: l.nome,
          linhas: [{ cor: `var(--c${i + 1})`, valor: fmtNum(v), rotulo: `${CATEGORIAS[i].nome} (${pctTxt(v, l.total)})` }],
          rodape: `Total: ${fmtNum(l.total)} · ${pctTxt(l.total, totalGeral)} do período`,
        }));
        barra.append(seg);
      });
      return el('div', { class: 'hb-linha' },
        el('div', { class: 'hb-nome' }, el('span', { text: l.nome }), el('small', { text: l.sub })),
        el('div', { class: 'hb-trilho' }, l.total ? barra : null, el('span', { class: `hb-valor${l.total ? '' : ' zero'}`, text: fmtNum(l.total) })));
    })));
  }

  function baldes(de, ate) {
    const dias = diffDias(de, ate) + 1;
    const itens = [];
    let tipo;
    if (dias <= 45) {
      tipo = 'dia';
      for (let d = de; d <= ate; d = somaDias(d, 1)) {
        const w = dataDe(d).getDay();
        itens.push({ de: d, ate: d, curto: fmtDM(d), longo: `${DIA_SEMANA[w]}, ${fmtData(d)}` });
      }
    } else if (dias <= 210) {
      tipo = 'semana';
      let inicio = somaDias(de, -((dataDe(de).getDay() + 6) % 7));
      while (inicio <= ate) {
        const fim = somaDias(inicio, 6);
        const a = inicio < de ? de : inicio;
        const b = fim > ate ? ate : fim;
        itens.push({ de: a, ate: b, curto: fmtDM(a), longo: `Semana de ${fmtDM(a)} a ${fmtDM(b)}` });
        inicio = somaDias(inicio, 7);
      }
    } else {
      tipo = 'mes';
      let [y, m] = partes(de);
      const [y2, m2] = partes(ate);
      while (y < y2 || (y === y2 && m <= m2)) {
        itens.push({ de: isoYMD(y, m, 1), ate: isoYMD(y, m, ultimoDia(y, m)), curto: `${MES_CURTO[m - 1]}/${String(y).slice(2)}`, longo: `${NOMES_MES[m - 1]} de ${y}` });
        [y, m] = m === 12 ? [y + 1, 1] : [y, m + 1];
      }
    }
    return { tipo, itens };
  }

  function marcas(max) {
    if (max <= 0) return [0, 1];
    const bruto = max / 4;
    const p = 10 ** Math.floor(Math.log10(bruto));
    let passo = [1, 2, 5, 10].map((m) => m * p).find((s) => s >= bruto);
    passo = Math.max(1, passo);
    const topo = Math.ceil(max / passo) * passo;
    const r = [];
    for (let v = 0; v <= topo + 1e-9; v += passo) r.push(Math.round(v));
    return r;
  }

  function renderEvolucao(regs, per) {
    const cont = $('grafEvolucao');
    const bs = baldes(per.de, per.ate);
    const vals = bs.itens.map(() => 0);
    for (const r of regs) {
      const i = bs.itens.findIndex((b) => r.data >= b.de && r.data <= b.ate);
      if (i >= 0) vals[i] += r.qtd;
    }
    const total = vals.reduce((a, b) => a + b, 0);
    $('evolTitulo').textContent = bs.tipo === 'dia' ? 'Por dia' : bs.tipo === 'semana' ? 'Por semana' : 'Por mês';
    const base = bs.tipo === 'dia' ? Math.max(1, diasUteis(per.de, per.ate)) : Math.max(1, bs.itens.length);
    const media = total / base;
    $('evolMedia').replaceChildren(el('i'), bs.tipo === 'dia' ? 'Média por dia útil ' : bs.tipo === 'semana' ? 'Média por semana ' : 'Média por mês ', el('strong', { text: decFmt.format(media) }));
    const max = Math.max(0, ...vals);
    const tk = marcas(max);
    const topo = tk[tk.length - 1];
    const iPico = max > 0 ? vals.indexOf(max) : -1;
    const plot = el('div', { class: 'evol-plot' });
    tk.forEach((t) => { if (t > 0) plot.append(el('i', { class: 'evol-grade', style: `bottom:${(t / topo) * 100}%` })); });
    const eixoY = el('div', { class: 'evol-y', 'aria-hidden': 'true' }, tk.map((t) => el('span', { style: `bottom:${(t / topo) * 100}%`, text: fmtNum(t) })));
    const eixoX = el('div', { class: 'evol-x', 'aria-hidden': 'true' });
    const largura = Math.max(200, (cont.clientWidth || 360) - 30);
    const passo = Math.max(1, Math.ceil(bs.itens.length / Math.max(2, Math.floor(largura / 52))));
    bs.itens.forEach((b, i) => {
      const col = el('div', { class: `evol-col${i === iPico ? ' pico' : ''}`, tabindex: '0', 'aria-label': `${b.longo}: ${fmtNum(vals[i])} atividades` },
        el('div', { class: 'evol-barra', style: `height:${(vals[i] / topo) * 100}%` }));
      ligarDica(col, () => ({ titulo: b.longo, linhas: [{ valor: fmtNum(vals[i]), rotulo: vals[i] === 1 ? 'atividade' : 'atividades' }] }));
      plot.append(col);
      eixoX.append(el('span', {}, i % passo === 0 ? el('b', { text: b.curto }) : null));
    });
    if (total) plot.append(el('i', { class: 'evol-media', style: `bottom:${Math.min(100, (media / topo) * 100)}%` }));
    cont.replaceChildren(el('div', { class: 'evol' }, plot, eixoY, eixoX));
    let resumo = 'Nenhuma atividade registrada no período.';
    if (iPico >= 0) {
      const b = bs.itens[iPico];
      const n = `${fmtNum(max)} ${max === 1 ? 'atividade' : 'atividades'}`;
      if (bs.tipo === 'dia') resumo = `O melhor dia foi ${DIAS_LONGOS[dataDe(b.de).getDay()]}, ${fmtDM(b.de)}, com ${n}.`;
      else if (bs.tipo === 'semana') resumo = `A melhor semana foi a de ${fmtDM(b.de)} a ${fmtDM(b.ate)}, com ${n}.`;
      else resumo = `O melhor mês foi ${b.longo}, com ${n}.`;
    }
    $('evolResumo').textContent = resumo;
  }

  function renderCategorias(regs) {
    const total = soma(regs);
    const por = vazioCats();
    regs.forEach((r) => { por[catIdx(r.atividadeId)] += r.qtd; });
    $('listaCategorias').replaceChildren(...CATEGORIAS.map((c, i) => el('div', { class: 'linha' },
      el('i', { class: 'ponto', style: `background:var(--c${i + 1}); width:10px; height:10px` }),
      el('span', { class: 'rot', text: c.nome }),
      el('strong', { style: 'font-weight:600; font-variant-numeric:tabular-nums', text: fmtNum(por[i]) }),
      el('span', { class: 'valor', style: 'width:44px; text-align:right', text: pctTxt(por[i], total) }))));
  }

  function abrirRegistros(filtros) {
    const p = prefs.painel;
    prefs.lista = { ...prefs.lista, periodo: p.periodo, de: p.de, ate: p.ate, servidor: p.servidor, uf: p.uf, atividade: '', leque: '', busca: '', ...filtros };
    $('buscaGlobal').value = '';
    limiteLista = 100;
    salvarPrefs();
    mostrarAba('registrar');
  }

  function renderTop(regs) {
    const por = new Map();
    regs.forEach((r) => por.set(r.atividadeId, (por.get(r.atividadeId) || 0) + r.qtd));
    const top = [...por.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const cont = $('listaTop');
    if (!top.length) {
      cont.replaceChildren(el('div', { class: 'linha' }, el('span', { class: 'rot nota', text: 'Nenhuma atividade no período.' })));
      return;
    }
    cont.replaceChildren(...top.map(([id, v], i) => {
      const a = atividadePorId(id) || { curto: id };
      return el('button', { type: 'button', class: 'linha', title: 'Ver esses registros', onclick: () => abrirRegistros({ atividade: id }) },
        el('span', { class: 'valor', style: 'width:18px', text: String(i + 1) }),
        el('span', { class: 'rot', text: a.curto }),
        el('strong', { style: 'font-weight:600; font-variant-numeric:tabular-nums', text: fmtNum(v) }),
        chev());
    }));
  }

  function renderMapaPainel(regs, f) {
    const coord = souCoord();
    const leque = coord ? [] : meuLeque();
    const porUF = new Map();
    const porUFAtv = new Map();
    let nacional = 0;
    for (const r of regs) {
      if (!r.uf) { nacional += r.qtd; continue; }
      porUF.set(r.uf, (porUF.get(r.uf) || 0) + r.qtd);
      let m = porUFAtv.get(r.uf);
      if (!m) { m = new Map(); porUFAtv.set(r.uf, m); }
      m.set(r.atividadeId, (m.get(r.atividadeId) || 0) + r.qtd);
    }
    const max = Math.max(0, ...porUF.values());
    const nFaixas = Math.min(5, max);
    const limites = [];
    for (let i = 1; i <= nFaixas; i++) limites.push(Math.ceil((max * i) / nFaixas));
    const faixaDe = (v) => {
      if (!v) return -1;
      const i = limites.findIndex((l) => v <= l);
      return nFaixas === 5 ? i : Math.round(((i + 1) / nFaixas) * 5) - 1;
    };
    const mapa = el('div', { class: 'mapa', role: 'group', 'aria-label': 'Atividades por unidade da federação' });
    for (const u of UFS) {
      const v = porUF.get(u.sigla) || 0;
      const fx = faixaDe(v);
      const b = el('button', {
        type: 'button', class: `tile${fx < 0 ? ' livre' : ''}`,
        style: `grid-row:${u.lin + 1}; grid-column:${u.col + 1};${fx >= 0 ? ` background:${RAMPA[fx][0]}; color:${RAMPA[fx][1]}` : ''}`,
        'aria-label': `${u.nome}: ${fmtNum(v)} atividades${f.uf === u.sigla ? ' (filtro ativo)' : ''}`, 'aria-pressed': String(f.uf === u.sigla),
      }, el('b', { text: u.sigla }), el('span', { text: fmtNum(v) }));
      b.addEventListener('click', () => { prefs.painel.uf = prefs.painel.uf === u.sigla ? '' : u.sigla; salvarPrefs(); esconderDica(); renderPainel(); });
      ligarDica(b, () => {
        const top = [...(porUFAtv.get(u.sigla) || new Map()).entries()].sort((a, c) => c[1] - a[1]).slice(0, 3);
        let rodape;
        if (coord) { const resp = responsavel(u.sigla); rodape = `Responsável: ${resp ? resp.nome : 'ninguém atribuído'}`; } else rodape = leque.includes(u.sigla) ? 'No seu leque' : 'Fora do seu leque';
        return {
          titulo: `${u.nome} (${u.sigla})`,
          linhas: [{ valor: fmtNum(v), rotulo: v === 1 ? 'atividade' : 'atividades' },
            ...top.map(([id, q]) => ({ cor: `var(--c${catIdx(id) + 1})`, valor: fmtNum(q), rotulo: (atividadePorId(id) || {}).curto || id }))],
          rodape,
        };
      });
      mapa.append(b);
    }
    mapa.append(el('div', { class: 'mapa-legenda', 'aria-hidden': 'true' }, 'Menos', RAMPA.map((q) => el('i', { style: `background:${q[0]}` })), 'Mais'));
    $('mapaPainel').replaceChildren(mapa);
    if (coord || !leque.length) {
      const n = porUF.size;
      $('mapaStatus').replaceChildren(el('span', { class: `status ${n === 27 ? 'bom' : 'atencao'}` }, svg(n === 27 ? CHECK_VERDE : ALERTA_LARANJA), `${n} de 27 atendidos`));
    } else {
      const n = leque.filter((u) => porUF.has(u)).length;
      const todas = n === leque.length;
      $('mapaStatus').replaceChildren(el('span', { class: `status ${todas ? 'bom' : 'atencao'}` }, svg(todas ? CHECK_VERDE : ALERTA_LARANJA), `${n} de ${leque.length} do seu leque`));
    }
    $('notaNacional').textContent = nacional ? `Mais ${fmtNum(nacional)} ${nacional === 1 ? 'atividade' : 'atividades'} sem UF específica (nacional).` : '';
    const fora = soma(regs, (r) => r.foraDoLeque);
    preencher($('notaForaLeque'), fora
      ? [`${fmtNum(fora)} ${fora === 1 ? 'atividade registrada' : 'atividades registradas'} fora do leque no período. `,
        el('button', { type: 'button', class: 'link-texto', text: 'Ver quais', onclick: () => abrirRegistros({ leque: 'fora' }) })]
      : []);
  }

  function renderResumo(regs, f) {
    const coord = souCoord();
    const linhas = linhasGrafico(regs, f).filter((l) => l.total || (coord && !f.servidor && !f.uf) || (!coord && !f.uf));
    const total = linhas.reduce((a, l) => a + l.total, 0);
    const somaCats = CATEGORIAS.map((c, i) => linhas.reduce((a, l) => a + l.cats[i], 0));
    $('tabResumo').replaceChildren(
      el('thead', {}, el('tr', {},
        el('th', { text: coord ? 'Servidor' : 'UF' }), el('th', { text: coord ? 'UFs' : 'Leque' }),
        CATEGORIAS.map((c, i) => el('th', { class: 'num', title: c.nome }, el('span', { class: 'th-cat' }, el('i', { class: 'ponto', style: `background:var(--c${i + 1})` }), c.curto))),
        el('th', { class: 'num', text: 'Total' }), el('th', { class: 'num', text: '% do período' }))),
      el('tbody', {}, linhas.length ? linhas.map((l) => el('tr', {},
        el('td', { class: 'nome', text: l.nome }),
        el('td', { style: 'color: var(--texto-2); font-size: 13px', text: l.sub }),
        l.cats.map((v) => el('td', { class: 'num', text: fmtNum(v) })),
        el('td', { class: 'num' }, el('strong', { text: fmtNum(l.total) })),
        el('td', { class: 'num', style: 'color: var(--texto-2)', text: pctTxt(l.total, total) }))) : el('tr', {}, el('td', { colspan: 9, class: 'nota', text: 'Nenhum registro no período.' }))),
      el('tfoot', {}, el('tr', {},
        el('td', { class: 'nome', text: coord ? 'Total do setor' : 'Seu total' }), el('td', {}),
        somaCats.map((v) => el('td', { class: 'num', text: fmtNum(v) })),
        el('td', { class: 'num', text: fmtNum(total) }), el('td', { class: 'num', text: total ? '100%' : '0%' }))),
    );
  }

  function textoRelatorio() {
    const f = prefs.painel;
    const coord = souCoord();
    const per = resolverPeriodo(f);
    const regs = filtrar(registrosValidos(), f, per);
    const total = soma(regs);
    const linhas = [];
    linhas.push(coord ? 'RELATÓRIO DE PRODUTIVIDADE' : 'RELATÓRIO DE PRODUTIVIDADE INDIVIDUAL');
    linhas.push([estado.setor.nome, estado.setor.unidade].filter(Boolean).join(' — '));
    linhas.push(`Período: ${fmtData(per.de)} a ${fmtData(per.ate)} (${diasUteis(per.de, per.ate)} dias úteis)`);
    if (!coord) linhas.push(`Servidor: ${estado.usuario.nome}${meuLeque().length ? ` (${meuLeque().join(', ')})` : ''}`);
    else if (f.servidor) linhas.push(`Servidor: ${nomeServidor(f.servidor)}`);
    if (f.uf) linhas.push(`UF: ${f.uf === '_' ? 'sem UF específica (nacional)' : `${UF_POR_SIGLA[f.uf].nome} (${f.uf})`}`);
    linhas.push('');
    linhas.push('1. RESUMO');
    linhas.push(`Total de atividades registradas: ${fmtNum(total)}`);
    linhas.push(`Veículos transferidos: ${fmtNum(soma(regs, (r) => r.atividadeId === 'transferido'))}`);
    linhas.push(`Veículos baixados: ${fmtNum(soma(regs, (r) => r.atividadeId === 'baixado'))}`);
    const ufs = new Set(regs.filter((r) => r.uf).map((r) => r.uf));
    linhas.push(`Entes federados atendidos: ${ufs.size} de 27`);
    const fora = soma(regs, (r) => r.foraDoLeque);
    if (fora) linhas.push(`Atividades fora do leque do responsável: ${fmtNum(fora)}`);
    linhas.push('');
    linhas.push('2. ATIVIDADES POR CATEGORIA');
    const porAtv = new Map();
    for (const r of regs) porAtv.set(r.atividadeId, (porAtv.get(r.atividadeId) || 0) + r.qtd);
    CATEGORIAS.forEach((c) => {
      const doGrupo = atividadesOrdenadas().filter((a) => a.categoriaId === c.id && porAtv.get(a.id));
      const sub = doGrupo.reduce((s, a) => s + porAtv.get(a.id), 0);
      if (!sub) return;
      linhas.push(`${c.nome}: ${fmtNum(sub)}`);
      doGrupo.forEach((a) => linhas.push(`  - ${a.nome}: ${fmtNum(porAtv.get(a.id))}`));
    });
    if (!total) linhas.push('Nenhuma atividade registrada no período.');
    linhas.push('');
    if (coord) {
      linhas.push('3. ATIVIDADES POR SERVIDOR');
      const porSrv = new Map();
      for (const r of regs) porSrv.set(r.servidorId, (porSrv.get(r.servidorId) || 0) + r.qtd);
      [...porSrv.entries()].sort((a, b) => b[1] - a[1]).forEach(([id, v]) => {
        const u = ufsDoServidor(id);
        linhas.push(`  - ${nomeServidor(id)}${u.length ? ` (${u.join(', ')})` : ''}: ${fmtNum(v)} (${pct(v, total)}%)`);
      });
      if (!porSrv.size) linhas.push('Nenhuma atividade registrada no período.');
    } else {
      linhas.push('3. ATIVIDADES POR UF');
      const porUf = new Map();
      for (const r of regs) porUf.set(r.uf || '_', (porUf.get(r.uf || '_') || 0) + r.qtd);
      [...porUf.entries()].sort((a, b) => b[1] - a[1]).forEach(([uf, v]) => {
        linhas.push(`  - ${uf === '_' ? 'Nacional (sem UF)' : `${UF_POR_SIGLA[uf].nome} (${uf})`}: ${fmtNum(v)} (${pct(v, total)}%)`);
      });
      if (!porUf.size) linhas.push('Nenhuma atividade registrada no período.');
    }
    linhas.push('');
    const d = new Date();
    linhas.push(`Gerado em ${fmtData(isoDe(d))} às ${pad(d.getHours())}:${pad(d.getMinutes())}, por ${estado.usuario.nome}.`);
    return linhas.join('\n');
  }

  // ======================================================================
  // REGISTRAR
  // ======================================================================
  let editandoId = null;
  let limiteLista = 100;
  let salvando = false;

  function substituirRegistro(r) {
    const i = estado.registros.findIndex((x) => x.id === r.id);
    if (r.excluido) { if (i >= 0) estado.registros.splice(i, 1); return; }
    if (i >= 0) estado.registros[i] = r; else estado.registros.push(r);
  }

  function preencherFormulario() {
    $('regData').textContent = dataPorExtenso(hojeISO());
    const coord = souCoord();
    const ativos = coord ? servidoresAtivos().sort((a, b) => a.nome.localeCompare(b.nome)) : [servidorPorId(euId()) || estado.usuario];
    const semEquipe = ativos.length === 0 && !editandoId;
    $('formSemEquipe').hidden = !semEquipe;
    $('form').hidden = semEquipe;

    const fSrv = $('fServidor');
    const editado = editandoId ? estado.registros.find((r) => r.id === editandoId) : null;
    const srvAtual = fSrv.value || prefs.form.servidor || euId();
    const opcoes = [...ativos];
    if (editado && !opcoes.some((s) => s.id === editado.servidorId) && servidorPorId(editado.servidorId)) opcoes.push(servidorPorId(editado.servidorId));
    fSrv.replaceChildren(...(coord ? [el('option', { value: '', text: 'Escolha' })] : []), ...opcoes.map((s) => el('option', { value: s.id, text: s.nome })));
    fSrv.disabled = !coord;
    fSrv.value = srvAtual;
    if (fSrv.value !== srvAtual) fSrv.value = opcoes.some((s) => s.id === euId()) ? euId() : '';

    const fAtv = $('fAtividade');
    const atvAtual = fAtv.value;
    const atividades = atividadesOrdenadas().filter((a) => a.ativa || (editado && editado.atividadeId === a.id));
    preencher(fAtv, el('option', { value: '', text: 'Escolha a atividade' }),
      ...CATEGORIAS.map((c) => {
        const doGrupo = atividades.filter((a) => a.categoriaId === c.id);
        return doGrupo.length ? el('optgroup', { label: c.nome }, doGrupo.map((a) => el('option', { value: a.id, text: a.curto }))) : null;
      }));
    fAtv.value = atvAtual;
    preencherUFsForm();
    mostrarDescricao();
    if (!$('fData').value) $('fData').value = hojeISO();
    $('fData').max = hojeISO();
  }

  function preencherUFsForm() {
    const fUF = $('fUF');
    const srv = $('fServidor').value;
    const minhas = srv ? ufsDoServidor(srv) : [];
    // Sem escolha anterior (ou trocou a pessoa): começa pela primeira UF do leque.
    const salvo = fUF.dataset.padrao || prefs.form.uf === null || prefs.form.uf === undefined ? (minhas[0] || '') : prefs.form.uf;
    const atual = fUF.dataset.tocado ? fUF.value : (fUF.dataset.padrao ? salvo : (fUF.value || salvo));
    delete fUF.dataset.padrao;
    const outras = UFS_ALFA.filter((u) => !minhas.includes(u.sigla));
    const s = servidorPorId(srv);
    const dono = !s ? '' : s.id === euId() ? 'suas UFs' : `UFs de ${primeiroNome(s.nome)}`;
    preencher(fUF,
      minhas.length ? el('optgroup', { label: capitalizar(dono) }, minhas.map((sg) => el('option', { value: sg, text: `${sg} – ${UF_POR_SIGLA[sg].nome}` }))) : null,
      el('optgroup', { label: minhas.length ? 'Fora do leque' : 'UFs' }, outras.map((u) => el('option', { value: u.sigla, text: `${u.sigla} – ${u.nome}` }))),
      el('optgroup', { label: 'Sem UF' }, el('option', { value: '', text: 'Nacional / sem UF específica' })));
    fUF.value = atual;
    if (fUF.value !== atual) fUF.value = minhas[0] || '';
    const seg = $('fUFSeg');
    seg.querySelectorAll('button[data-uf]').forEach((b) => b.remove());
    minhas.forEach((sg) => seg.insertBefore(el('button', {
      type: 'button', 'data-uf': sg, text: sg, 'aria-label': UF_POR_SIGLA[sg].nome,
      onclick: () => { fUF.value = sg; fUF.dataset.tocado = '1'; atualizarSegUF(); },
    }), $('fUFOutra')));
    atualizarSegUF();
  }

  function atualizarSegUF() {
    const v = $('fUF').value;
    let marcado = false;
    $('fUFSeg').querySelectorAll('button[data-uf]').forEach((b) => {
      const sel = b.dataset.uf === v;
      b.setAttribute('aria-pressed', String(sel));
      if (sel) marcado = true;
    });
    $('fUFOutra').classList.toggle('sel', !marcado);
    $('fUFOutraRot').textContent = marcado ? 'Outra' : (v || 'Nacional');
    // Aviso de fora do leque
    const srv = $('fServidor').value;
    const fora = !!(v && srv && !ufsDoServidor(srv).includes(v));
    const aviso = $('fAvisoLeque');
    aviso.hidden = !fora;
    if (fora) {
      aviso.textContent = srv === euId()
        ? `${v} está fora do seu leque. O registro fica sinalizado para a coordenação.`
        : `${v} não está no leque de ${primeiroNome(nomeServidor(srv))}. O registro fica marcado como fora do leque.`;
    }
  }

  function mostrarDescricao() {
    const a = atividadePorId($('fAtividade').value);
    const ci = a ? IDX_CATEGORIA[a.categoriaId] : -1;
    $('fAtvIcone').style.background = ci >= 0 ? `var(--c${ci + 1})` : '#c7c7cc';
    $('fDescricao').textContent = a ? CATEGORIAS[ci].nome : 'Escolha na lista';
    const longa = a && normalizar(a.nome) !== normalizar(a.curto) ? a.nome : '';
    $('fDescricaoLonga').textContent = longa;
    $('fDescricaoLonga').hidden = !longa;
  }

  function renderHojeResumo() {
    const srv = $('fServidor').value;
    const data = $('fData').value || hojeISO();
    const alvo = $('hojeResumo');
    if (editandoId) {
      const r = estado.registros.find((x) => x.id === editandoId);
      alvo.textContent = r ? `Alterando o registro de ${fmtData(r.data)}. Salve ou cancele para voltar a registrar.` : '';
      return;
    }
    if (!srv) { alvo.textContent = 'Escolha o servidor para ver o que já foi registrado no dia.'; return; }
    const doDia = registrosValidos().filter((r) => r.servidorId === srv && r.data === data);
    const q = soma(doDia);
    const quem = srv === euId() ? 'você' : primeiroNome(nomeServidor(srv));
    alvo.replaceChildren(data === hojeISO() ? 'Hoje, ' : `Em ${fmtData(data)}, `, el('b', { text: quem }), ` registrou ${fmtNum(q)} ${q === 1 ? 'atividade' : 'atividades'}.`);
  }

  function renderRegistrar() {
    preencherFormulario();
    renderHojeResumo();
    renderLista();
  }

  function entrarEdicao(id) {
    const r = estado.registros.find((x) => x.id === id);
    if (!r) return;
    editandoId = id;
    preencherFormulario();
    $('fData').value = r.data;
    $('fServidor').value = r.servidorId;
    delete $('fUF').dataset.tocado;
    preencherUFsForm();
    $('fUF').value = r.uf || '';
    $('fUF').dataset.tocado = '1';
    atualizarSegUF();
    $('fAtividade').value = r.atividadeId;
    $('fQtd').value = String(r.qtd);
    $('fRef').value = r.ref || '';
    $('fObs').value = r.obs || '';
    mostrarDescricao();
    $('formTitulo').textContent = 'Editar registro';
    $('fEnviar').textContent = 'Salvar alteração';
    $('fCancelar').hidden = false;
    $('fErro').textContent = '';
    renderHojeResumo();
    renderLista();
    $('cartaoForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('fAtividade').focus({ preventScroll: true });
  }

  function sairEdicao() {
    editandoId = null;
    $('formTitulo').textContent = 'Nova atividade';
    $('fEnviar').textContent = 'Registrar';
    $('fCancelar').hidden = true;
    $('fQtd').value = '1';
    $('fRef').value = '';
    $('fObs').value = '';
    $('fData').value = hojeISO();
    $('fErro').textContent = '';
    renderRegistrar();
  }

  function marcarInvalido(id, invalido) { $(id).setAttribute('aria-invalid', invalido ? 'true' : 'false'); }

  const dadosDoRegistro = (r) => ({ id: r.id, data: r.data, servidorId: r.servidorId, atividadeId: r.atividadeId, qtd: r.qtd, uf: r.uf || '', ref: r.ref || '', obs: r.obs || '' });

  async function enviarFormulario(ev) {
    ev.preventDefault();
    if (salvando) return;
    const data = $('fData').value;
    const servidorId = $('fServidor').value;
    const atividadeId = $('fAtividade').value;
    const qtd = Number($('fQtd').value);
    const erros = [];
    marcarInvalido('fData', false); marcarInvalido('fServidor', false); marcarInvalido('fAtividade', false); marcarInvalido('fQtd', false);
    if (!dataValida(data)) { erros.push('informe a data'); marcarInvalido('fData', true); } else if (data > hojeISO()) { erros.push('a data não pode ser no futuro'); marcarInvalido('fData', true); }
    if (!servidorId) { erros.push('escolha o servidor'); marcarInvalido('fServidor', true); }
    if (!atividadeId) { erros.push('escolha a atividade'); marcarInvalido('fAtividade', true); }
    if (!Number.isInteger(qtd) || qtd < 1 || qtd > 9999) { erros.push('a quantidade deve ser um número inteiro de 1 a 9999'); marcarInvalido('fQtd', true); }
    if (erros.length) {
      $('fErro').textContent = `Falta pouco: ${erros.join(', ')}.`;
      return;
    }
    $('fErro').textContent = '';
    const dados = { data, servidorId, atividadeId, qtd, uf: $('fUF').value, ref: $('fRef').value.trim(), obs: $('fObs').value.trim() };
    const atv = atividadePorId(atividadeId);
    const resumo = `${atv.curto}${qtd > 1 ? ` × ${qtd}` : ''} · ${nomeServidor(servidorId)}${dados.uf ? ` · ${dados.uf}` : ''}`;

    salvando = true;
    $('fEnviar').disabled = true;
    try {
      if (editandoId) {
        const antigo = estado.registros.find((x) => x.id === editandoId);
        const antes = antigo ? dadosDoRegistro(antigo) : null;
        const { registro } = await api('registro', { id: editandoId, ...dados });
        substituirRegistro(registro);
        sairEdicao();
        aviso(`Alteração salva: ${resumo}`, antes && {
          rotulo: 'Desfazer',
          fn: () => tentar(async () => { const r2 = await api('registro', antes); substituirRegistro(r2.registro); renderAba(); aviso('Alteração desfeita.'); }),
        });
      } else {
        const { registro } = await api('registro', dados);
        substituirRegistro(registro);
        prefs.form.servidor = servidorId;
        prefs.form.uf = dados.uf;
        salvarPrefs();
        $('fQtd').value = '1';
        $('fRef').value = '';
        $('fObs').value = '';
        aviso(`Registrado: ${resumo}${registro.foraDoLeque ? ' (fora do leque)' : ''}`, {
          rotulo: 'Desfazer',
          fn: () => tentar(async () => { const r2 = await api('excluir-registro', { id: registro.id, excluido: true }); substituirRegistro(r2.registro); renderAba(); aviso('Registro desfeito.'); }),
        });
        renderRegistrar();
        $('fAtividade').focus();
      }
    } catch (e) {
      if (!(e instanceof ErroApi)) throw e;
      if (e.codigo !== 'sessao' && e.codigo !== 'trocar_senha') $('fErro').textContent = e.message;
    } finally {
      salvando = false;
      $('fEnviar').disabled = false;
    }
  }

  function excluirRegistro(id) {
    const r = estado.registros.find((x) => x.id === id);
    if (!r) return;
    tentar(async () => {
      const { registro } = await api('excluir-registro', { id, excluido: true });
      substituirRegistro(registro);
      if (editandoId === id) sairEdicao(); else renderRegistrar();
      aviso(`Registro excluído: ${(atividadePorId(r.atividadeId) || {}).curto || ''} de ${fmtData(r.data)}`, {
        rotulo: 'Desfazer',
        fn: () => tentar(async () => { const r2 = await api('excluir-registro', { id, excluido: false }); substituirRegistro(r2.registro); renderAba(); aviso('Registro de volta.'); }),
      });
    });
  }

  function refVisual(ref) {
    const t = String(ref || '').trim();
    const limpo = t.toUpperCase().replace(/[\s-]/g, '');
    if (/^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(limpo)) {
      const txt = /^[A-Z]{3}\d{4}$/.test(limpo) ? `${limpo.slice(0, 3)}-${limpo.slice(3)}` : limpo;
      return el('span', { class: 'placa', title: 'Placa' }, el('span', { text: txt }));
    }
    return t ? el('span', { class: 'mono', text: t }) : null;
  }

  function registrosDaLista() {
    const f = prefs.lista;
    const per = resolverPeriodo(f);
    const busca = normalizar(f.busca);
    let regs = filtrar(registrosValidos(), f, per)
      .filter((r) => (!f.atividade || r.atividadeId === f.atividade) && (f.leque !== 'fora' || r.foraDoLeque));
    if (busca) {
      regs = regs.filter((r) => {
        const a = atividadePorId(r.atividadeId) || {};
        return normalizar(`${r.ref} ${r.obs} ${a.curto} ${a.nome} ${nomeServidor(r.servidorId)} ${r.uf}`).includes(busca)
          || normalizar(r.ref).replace(/[\s-]/g, '').includes(busca.replace(/[\s-]/g, ''));
      });
    }
    regs.sort((a, b) => (b.data > a.data ? 1 : b.data < a.data ? -1 : (b.criadoEm || '').localeCompare(a.criadoEm || '')));
    return { regs, per };
  }

  function chipUF(r) {
    if (!r.uf) return el('span', { class: 'chip-uf nacional', text: 'Nacional' });
    if (!r.foraDoLeque) return el('span', { class: 'chip-uf', text: r.uf });
    return el('span', { class: 'chip-uf fora', text: r.uf, title: 'Fora do leque de quem registrou', 'aria-label': `${r.uf}, fora do leque` });
  }

  function renderLista() {
    const f = prefs.lista;
    preencherPeriodos($('lPeriodo'), f.periodo);
    f.periodo = $('lPeriodo').value;
    const custom = f.periodo === 'custom';
    $('lDeCampo').hidden = !custom;
    $('lAteCampo').hidden = !custom;
    if (souCoord()) {
      preencherServidores($('lServidor'), f.servidor, 'Todos');
      f.servidor = $('lServidor').value;
    }
    preencherUFsFiltro($('lUF'), f.uf);
    f.uf = $('lUF').value;
    const selAtv = $('lAtividade');
    selAtv.replaceChildren(el('option', { value: '', text: 'Todas' }),
      ...CATEGORIAS.map((c) => el('optgroup', { label: c.nome }, atividadesOrdenadas().filter((a) => a.categoriaId === c.id).map((a) => el('option', { value: a.id, text: a.curto })))));
    selAtv.value = f.atividade;
    if (selAtv.value !== f.atividade) { selAtv.value = ''; f.atividade = ''; }
    $('lLeque').value = f.leque === 'fora' ? 'fora' : '';
    if ($('lBusca').value !== f.busca) $('lBusca').value = f.busca;
    if (document.activeElement !== $('buscaGlobal') && $('buscaGlobal').value !== f.busca) $('buscaGlobal').value = f.busca;

    const { regs, per } = registrosDaLista();
    if (custom) { f.de = per.de; f.ate = per.ate; $('lDe').value = per.de; $('lAte').value = per.ate; }
    const q = soma(regs);
    $('lContagem').textContent = `${fmtNum(regs.length)} ${regs.length === 1 ? 'lançamento' : 'lançamentos'} · ${fmtNum(q)} ${q === 1 ? 'atividade' : 'atividades'}`;
    const visiveis = regs.slice(0, limiteLista);
    const linhas = [el('div', { class: 'tl cab-t', role: 'row' },
      ['Data', 'Atividade', 'UF', 'Qtd.', 'Referência', ''].map((h, i) => el('span', { role: 'columnheader', text: h, style: i === 3 ? 'text-align:right' : undefined })))];
    if (!visiveis.length) linhas.push(el('div', { class: 'tl', role: 'row' }, el('span', { class: 'vazio', role: 'cell', text: 'Nenhum registro encontrado com esses filtros.' })));
    for (const r of visiveis) {
      const a = atividadePorId(r.atividadeId) || { curto: r.atividadeId, categoriaId: 'processos' };
      const ci = IDX_CATEGORIA[a.categoriaId];
      linhas.push(el('div', { class: `tl${editandoId === r.id ? ' editando' : ''}`, role: 'row' },
        el('span', { class: 'data', role: 'cell', text: dataCurta(r.data), title: fmtData(r.data) }),
        el('span', { class: 'atv', role: 'cell' }, a.curto,
          el('small', {}, el('i', { class: 'ponto', style: `background:var(--c${ci + 1})` }), `${nomeServidor(r.servidorId)} · ${CATEGORIAS[ci].curto}${r.foraDoLeque ? ' · fora do leque' : ''}`),
          r.obs ? el('small', { class: 'obs', text: r.obs }) : null),
        el('span', { role: 'cell' }, chipUF(r)),
        el('span', { class: 'qtd', role: 'cell', text: fmtNum(r.qtd) }),
        el('span', { role: 'cell' }, refVisual(r.ref)),
        el('span', { class: 'acoes', role: 'cell' },
          el('button', { type: 'button', class: 'btn texto', text: 'Editar', 'aria-label': `Editar registro de ${fmtData(r.data)}`, onclick: () => entrarEdicao(r.id) }),
          el('button', { type: 'button', class: 'btn texto perigo', text: 'Excluir', 'aria-label': `Excluir registro de ${fmtData(r.data)}`, onclick: () => excluirRegistro(r.id) }))));
    }
    $('tabRegistros').replaceChildren(...linhas);
    const btnMais = $('lMais');
    btnMais.hidden = regs.length <= limiteLista;
    btnMais.firstElementChild.textContent = `Mostrar mais (${fmtNum(regs.length - limiteLista)} restantes)`;
  }

  function csvDe(regs) {
    const cab = ['Data', 'Servidor', 'UF', 'Fora do leque', 'Categoria', 'Atividade', 'Descrição da atividade', 'Quantidade', 'Referência', 'Observação', 'Registrado em'];
    // Planilhas abrem "=…" como fórmula: um apóstrofo na frente evita isso.
    const cel = (v) => {
      let s = String(v ?? '');
      if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
      return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const linhas = regs.map((r) => {
      const a = atividadePorId(r.atividadeId) || { curto: r.atividadeId, nome: r.atividadeId, categoriaId: 'processos' };
      return [fmtData(r.data), nomeServidor(r.servidorId), r.uf || 'Nacional', r.foraDoLeque ? 'Sim' : '', CATEGORIAS[IDX_CATEGORIA[a.categoriaId]].nome, a.curto, a.nome, r.qtd, r.ref, r.obs, fmtDataHora(r.criadoEm)];
    });
    return `﻿${[cab, ...linhas].map((l) => l.map(cel).join(';')).join('\r\n')}`;
  }

  // ======================================================================
  // EQUIPE E UFs (só coordenação)
  // ======================================================================
  let pincel = null; // id de quem recebe os estados; '' = tirar o responsável
  let filaUF = Promise.resolve();

  function substituirServidor(s) {
    const i = estado.servidores.findIndex((x) => x.id === s.id);
    if (i >= 0) estado.servidores[i] = s; else estado.servidores.push(s);
    if (s.id === euId()) { estado.usuario.nome = s.nome; estado.usuario.email = s.email; }
  }

  function totaisDoMes() {
    const hoje = hojeISO();
    const [Y, M] = partes(hoje);
    const de = isoYMD(Y, M, 1);
    const m = new Map();
    registrosValidos().forEach((r) => { if (r.data >= de && r.data <= hoje) m.set(r.servidorId, (m.get(r.servidorId) || 0) + r.qtd); });
    return m;
  }

  const campo = (rotulo, entrada) => el('label', { class: 'campo-dlg' }, rotulo, entrada);

  function renderEquipe() {
    esconderDica();
    const ativos = servidoresAtivos().sort((a, b) => a.nome.localeCompare(b.nome));
    const inativos = estado.servidores.filter((s) => !s.ativo).sort((a, b) => a.nome.localeCompare(b.nome));
    const lanc = new Map();
    registrosValidos().forEach((r) => lanc.set(r.servidorId, (lanc.get(r.servidorId) || 0) + 1));
    const doMes = totaisDoMes();
    if (pincel === null || (pincel !== '' && !ativos.some((s) => s.id === pincel))) pincel = ativos.length ? ativos[0].id : '';
    const semResp = UFS_ALFA.filter((u) => { const s = responsavel(u.sigla); return !(s && s.ativo); }).map((u) => u.sigla);
    $('eSub').textContent = `${fmtNum(ativos.length)} ${ativos.length === 1 ? 'pessoa com acesso' : 'pessoas com acesso'} · ${semResp.length ? `${semResp.length} ${semResp.length === 1 ? 'UF sem responsável' : 'UFs sem responsável'}` : 'os 27 entes federados têm responsável'}`;

    const linhas = ativos.map((s) => {
      const ufs = ufsDoServidor(s.id);
      const souEu = s.id === euId();
      return el('div', { class: `linha-srv${pincel === s.id ? ' sel' : ''}` },
        el('button', { type: 'button', class: 'linha', 'aria-pressed': String(pincel === s.id), title: 'Escolher para distribuir os estados no mapa', onclick: () => { pincel = s.id; renderEquipe(); } },
          avatar(s),
          el('span', { class: 'duas-l' },
            el('span', {}, s.nome, souEu ? ' (você)' : '', s.papel === 'coordenacao' ? ' ' : '', s.papel === 'coordenacao' ? el('span', { class: 'etiqueta', text: 'Coordenação' }) : null),
            el('small', { text: `${s.email} · ${ufs.length ? ufs.join(', ') : 'nenhuma UF ainda'}` })),
          el('span', { class: 'valor', text: fmtNum(doMes.get(s.id) || 0) })),
        el('span', { class: 'acoes-linha' },
          el('button', { type: 'button', class: 'btn texto', text: 'Editar', onclick: () => abrirPessoa(s) }),
          souEu ? null : el('button', { type: 'button', class: 'btn texto', text: 'Nova senha', onclick: () => novaSenha(s) }),
          souEu ? null : el('button', { type: 'button', class: 'btn texto perigo', text: 'Desativar', onclick: () => desativar(s, lanc.get(s.id) || 0) })));
    });
    linhas.push(el('div', { class: 'linha-srv' }, el('button', { type: 'button', class: 'linha linha-add', onclick: () => abrirPessoa(null) }, svg(MAIS_CIRCULO), 'Adicionar pessoa')));
    $('eLista').replaceChildren(...linhas);

    $('eInativosBloco').hidden = !inativos.length;
    $('eInativos').replaceChildren(...inativos.map((s) => el('div', { class: 'linha-srv' },
      el('span', { class: 'linha' }, el('span', { class: 'avatar inativo', text: iniciais(s.nome), 'aria-hidden': 'true' }),
        el('span', { class: 'duas-l' }, s.nome, el('small', { text: `${s.email} · ${fmtNum(lanc.get(s.id) || 0)} lançamentos no histórico` }))),
      el('span', { class: 'acoes-linha', style: 'opacity:1' },
        el('button', { type: 'button', class: 'btn texto', text: 'Reativar', onclick: () => reativar(s) })))));

    const botaoPincel = (id, rot, bolinha) => el('button', { type: 'button', class: 'pincel', 'aria-pressed': String(pincel === id), onclick: () => { pincel = id; renderEquipe(); } }, bolinha, rot);
    $('ePinceis').replaceChildren(...ativos.map((s) => botaoPincel(s.id, primeiroNome(s.nome), avatar(s, 'mini'))),
      botaoPincel('', 'Sem responsável', el('span', { class: 'borracha', text: '×', 'aria-hidden': 'true' })));

    const mapa = el('div', { class: 'mapa grande', role: 'group', 'aria-label': 'Responsável por unidade da federação' });
    for (const u of UFS) {
      const s = responsavel(u.sigla);
      const valido = s && s.ativo;
      const [bg, fg] = valido ? corSrv(s) : ['', ''];
      const b = el('button', {
        type: 'button', class: `tile${valido ? '' : ' livre'}`,
        style: `grid-row:${u.lin + 1}; grid-column:${u.col + 1};${valido ? ` background:${bg}; color:${fg}` : ''}`,
        'aria-label': `${u.nome}: ${valido ? s.nome : 'sem responsável'}`,
      }, el('b', { text: u.sigla }), el('span', { text: valido ? iniciais(s.nome) : '—' }));
      b.addEventListener('click', () => clicarUF(u.sigla));
      ligarDica(b, () => {
        const r = responsavel(u.sigla);
        return { titulo: `${u.nome} (${u.sigla})`, linhas: [{ valor: r && r.ativo ? r.nome : 'ninguém', rotulo: 'responsável' }], rodape: pincel ? `Clique para passar para ${nomeServidor(pincel)}` : 'Clique para deixar sem responsável' };
      });
      mapa.append(b);
    }
    $('eMapa').replaceChildren(mapa);
    $('ePendencias').replaceChildren(semResp.length
      ? el('span', { class: 'status atencao' }, svg(ALERTA_LARANJA), `${semResp.length} ${semResp.length === 1 ? 'UF sem responsável' : 'UFs sem responsável'}: ${semResp.join(', ')}`)
      : el('span', { class: 'status bom' }, svg(CHECK_VERDE), 'Os 27 entes federados têm responsável'));
  }

  // Muda na tela na hora e grava em seguida, um clique de cada vez, na ordem.
  function clicarUF(sigla) {
    const atual = responsavel(sigla);
    const novo = pincel && atual && atual.id === pincel ? '' : pincel;
    const antes = estado.ufs[sigla];
    estado.ufs[sigla] = { servidorId: novo || null, em: new Date().toISOString() };
    renderEquipe();
    filaUF = filaUF.then(async () => {
      try {
        const r = await api('uf', { sigla, servidorId: novo || '' });
        estado.ufs[sigla] = { servidorId: r.servidorId, em: r.em };
      } catch (e) {
        if (antes) estado.ufs[sigla] = antes; else delete estado.ufs[sigla];
        if (abaAtual === 'equipe' && !$('app').hidden) renderEquipe();
        if (e instanceof ErroApi && e.codigo !== 'sessao') aviso(`${sigla} não foi gravada: ${e.message}`);
      }
    });
  }

  async function abrirPessoa(s) {
    const nova = !s;
    const inNome = el('input', { type: 'text', maxlength: 80, value: s ? s.nome : '', placeholder: 'Nome e sobrenome', autocomplete: 'off' });
    const inEmail = el('input', { type: 'email', maxlength: 120, value: s ? s.email : '', placeholder: 'nome@orgao.gov.br', autocomplete: 'off' });
    const selPapel = el('select', {},
      el('option', { value: 'servidor', text: 'Servidor: vê e registra só a própria produção' }),
      el('option', { value: 'coordenacao', text: 'Coordenação: vê tudo e administra a equipe' }));
    selPapel.value = s ? s.papel : 'servidor';
    const souEu = s && s.id === euId();
    if (souEu) selPapel.disabled = true;
    const r = await dialogo({
      titulo: nova ? 'Adicionar pessoa' : `Editar ${primeiroNome(s.nome)}`,
      corpo: [
        campo('Nome', inNome),
        campo('E-mail, que é o login', inEmail),
        campo('Papel', selPapel),
        nova ? el('p', { text: 'O sistema gera uma senha provisória para você passar à pessoa. No primeiro acesso, ela cria a própria senha.' }) : null,
        souEu ? el('p', { text: 'O seu próprio papel só pode ser mudado por outra pessoa da coordenação.' }) : null,
      ],
      botoes: [{ rotulo: 'Cancelar', valor: '' }, { rotulo: nova ? 'Adicionar' : 'Salvar', valor: 'ok', classe: 'btn-primario' }],
    });
    if (r !== 'ok') return;
    const dados = { nome: inNome.value.trim().replace(/\s+/g, ' '), email: inEmail.value.trim(), papel: selPapel.value };
    if (!dados.nome || !dados.email) { aviso('Preencha o nome e o e-mail.'); return; }
    if (s) dados.id = s.id;
    await tentar(async () => {
      const resp = await api('usuario', dados);
      substituirServidor(resp.usuario);
      if (nova) {
        pincel = resp.usuario.id;
        renderEquipe();
        await mostrarSenhaProvisoria(resp.usuario.nome, resp.senhaProvisoria, resp.usuario.email);
        aviso(`${resp.usuario.nome} entrou na equipe. Agora clique no mapa nos estados que ficam com essa pessoa.`);
      } else {
        renderCabecalho();
        renderEquipe();
        aviso('Dados atualizados.');
      }
    });
  }

  async function novaSenha(s) {
    const r = await dialogo({
      titulo: `Gerar senha nova para ${primeiroNome(s.nome)}?`,
      corpo: [el('p', { text: `A senha atual de ${s.nome} deixa de valer agora e, se a pessoa estiver com o sistema aberto, precisa entrar de novo. Use quando ela esquecer a senha ou a conta ficar travada.` })],
      botoes: [{ rotulo: 'Cancelar', valor: '' }, { rotulo: 'Gerar senha', valor: 'ok', classe: 'btn-primario' }],
    });
    if (r !== 'ok') return;
    await tentar(async () => {
      const resp = await api('redefinir-senha', { id: s.id });
      await mostrarSenhaProvisoria(s.nome, resp.senhaProvisoria, s.email);
    });
  }

  async function desativar(s, n) {
    const ufs = ufsDoServidor(s.id);
    const r = await dialogo({
      titulo: `Desativar ${s.nome}?`,
      corpo: [
        el('p', { text: `${s.nome} deixa de entrar no sistema.${n ? ` Os ${fmtNum(n)} lançamentos continuam no histórico e na visão geral.` : ''}` }),
        ufs.length ? el('p', { text: `As UFs de ${primeiroNome(s.nome)} (${ufs.join(', ')}) ficam sem responsável.` }) : null,
        el('p', { text: 'Dá para reativar depois.' }),
      ],
      botoes: [{ rotulo: 'Cancelar', valor: '' }, { rotulo: 'Desativar', valor: 'ok', classe: 'btn-perigo' }],
    });
    if (r !== 'ok') return;
    await tentar(async () => {
      const resp = await api('usuario-ativo', { id: s.id, ativo: false });
      substituirServidor(resp.usuario);
      resp.ufsLiberadas.forEach((sg) => { estado.ufs[sg] = { servidorId: null, em: resp.em }; });
      renderEquipe();
      aviso(`${s.nome} foi desativado(a).`);
    });
  }

  async function reativar(s) {
    await tentar(async () => {
      const resp = await api('usuario-ativo', { id: s.id, ativo: true });
      substituirServidor(resp.usuario);
      renderEquipe();
      aviso(`${s.nome} voltou para a equipe. Se não lembrar a senha, use Nova senha.`);
    });
  }

  // ======================================================================
  // AJUSTES
  // ======================================================================
  function renderAjustes() {
    const coord = souCoord();
    const eu = servidorPorId(euId()) || estado.usuario;
    const leque = meuLeque();
    $('aSub').textContent = coord ? 'Sua conta, planilha, atividades e nomes do setor' : 'Sua conta e a planilha dos seus registros';
    $('aConta').replaceChildren(avatar(eu),
      el('div', {},
        el('b', { text: eu.nome }),
        el('small', { text: eu.email }),
        el('small', { style: 'margin-top:4px' }, el('span', { class: 'etiqueta', text: nomePapel(estado.usuario.papel) }), ` ${leque.length ? `Seu leque: ${leque.join(', ')}` : 'Nenhuma UF no seu leque'}`)));
    $('aPlanilhaNota').textContent = coord
      ? 'Todos os registros do setor, com a coluna "Fora do leque", para abrir no Excel.'
      : 'Todos os seus registros, para abrir no Excel.';
    if (!coord) return;
    if (document.activeElement !== $('dSetor')) $('dSetor').value = estado.setor.nome || '';
    if (document.activeElement !== $('dUnidade')) $('dUnidade').value = estado.setor.unidade || '';
    const bloco = (ci) => {
      const lista = atividadesOrdenadas().filter((a) => IDX_CATEGORIA[a.categoriaId] === ci);
      if (!lista.length) return null;
      return el('div', {},
        el('div', { class: 'rotulo-cat' }, el('i', { class: 'ponto', style: `background:var(--c${ci + 1})` }), CATEGORIAS[ci].nome),
        el('div', { class: 'grupo cinza' }, lista.map((a) => {
          const chk = el('input', { type: 'checkbox', checked: a.ativa, 'aria-label': `${a.curto}: ${a.ativa ? 'em uso' : 'desligada'}` });
          chk.addEventListener('change', () => tentar(async () => {
            chk.disabled = true;
            try {
              const { atividade } = await api('atividade-ativa', { id: a.id, ativa: chk.checked });
              Object.assign(a, atividade);
              renderAjustes();
              aviso(a.ativa ? `${a.curto} voltou para as opções de registro.` : `${a.curto} saiu das opções de registro. O histórico continua.`);
            } catch (e) {
              chk.checked = !chk.checked;
              chk.disabled = false;
              throw e;
            }
          }));
          return el('div', { class: 'linha' },
            el('button', { type: 'button', class: `linha-texto${a.ativa ? '' : ' atv-inativa'}`, title: 'Ajustar nome e categoria', onclick: () => editarAtividade(a) }, a.curto),
            el('label', { class: 'interruptor' }, chk, el('span')));
        })));
    };
    $('dAtividades').replaceChildren(el('div', {}, bloco(0), bloco(1)), el('div', {}, bloco(2), bloco(3), bloco(4)));
  }

  async function editarAtividade(a) {
    const nova = !a;
    const inCurto = el('input', { type: 'text', maxlength: 60, value: a ? a.curto : '' });
    const inNome = el('textarea', { maxlength: 240, rows: 3 });
    inNome.value = a ? a.nome : '';
    const selCat = el('select', {}, CATEGORIAS.map((c) => el('option', { value: c.id, text: c.nome })));
    selCat.value = a ? a.categoriaId : 'processos';
    const r = await dialogo({
      titulo: nova ? 'Nova atividade' : 'Ajustar atividade',
      corpo: [
        campo('Nome curto, que aparece nos gráficos e nas listas', inCurto),
        campo('Descrição completa, que aparece no relatório em texto', inNome),
        campo('Categoria', selCat),
        nova ? null : el('p', { text: 'A mudança vale também para os registros antigos desta atividade.' }),
      ],
      botoes: [{ rotulo: 'Cancelar', valor: '' }, { rotulo: nova ? 'Adicionar' : 'Salvar', valor: 'ok', classe: 'btn-primario' }],
    });
    if (r !== 'ok') return;
    const curto = inCurto.value.trim();
    if (!curto) { aviso('Escreva o nome curto da atividade.'); return; }
    await tentar(async () => {
      const { atividade } = await api('atividade', { id: a ? a.id : '', curto, nome: inNome.value.trim() || curto, categoriaId: selCat.value });
      if (a) Object.assign(a, atividade); else estado.atividades.push(atividade);
      renderAjustes();
      aviso(nova ? `${curto} foi adicionada às atividades.` : 'Atividade atualizada.');
    });
  }

  async function abrirTrocaSenha() {
    const atual = el('input', { type: 'password', maxlength: 200, autocomplete: 'current-password' });
    const nova = el('input', { type: 'password', maxlength: 200, autocomplete: 'new-password' });
    const repita = el('input', { type: 'password', maxlength: 200, autocomplete: 'new-password' });
    const r = await dialogo({
      titulo: 'Trocar senha',
      corpo: [
        campo('Senha atual', atual), campo('Senha nova', nova), campo('Repita a senha nova', repita),
        el('p', { text: 'Pelo menos 8 caracteres. Ao trocar, quem estiver entrado com a sua conta em outro computador precisa entrar de novo.' }),
      ],
      botoes: [{ rotulo: 'Cancelar', valor: '' }, { rotulo: 'Trocar senha', valor: 'ok', classe: 'btn-primario' }],
    });
    if (r !== 'ok') return;
    if (nova.value !== repita.value) { aviso('As duas senhas novas não estão iguais. Nada foi trocado.'); return; }
    await tentar(async () => {
      await api('trocar-senha', { atual: atual.value, nova: nova.value });
      aviso('Senha trocada.');
    });
  }

  function baixarPlanilha(regs, nome) {
    baixar(`passivo-${nome}-${hojeISO()}.csv`, csvDe(regs), 'text/csv;charset=utf-8');
  }

  // ======================================================================
  // Ligações de eventos (uma vez)
  // ======================================================================
  function ligarEventos() {
    $('formEntrar').addEventListener('submit', entrar);
    $('formSenha').addEventListener('submit', salvarSenhaNova);
    $('sSair').addEventListener('click', sair);
    $('aSair').addEventListener('click', sair);
    $('aTrocarSenha').addEventListener('click', abrirTrocaSenha);

    document.querySelectorAll('[data-aba]').forEach((b) => b.addEventListener('click', () => mostrarAba(b.dataset.aba)));
    document.querySelectorAll('[data-ir]').forEach((b) => b.addEventListener('click', () => mostrarAba(b.dataset.ir)));
    $('buscaGlobal').addEventListener('input', debounce(() => {
      prefs.lista.busca = $('buscaGlobal').value;
      limiteLista = 100;
      salvarPrefs();
      if (abaAtual !== 'registrar') mostrarAba('registrar'); else renderLista();
    }, 200));

    // Visão geral
    $('pSeg').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { prefs.painel.periodo = b.dataset.p; salvarPrefs(); renderPainel(); }));
    $('pPeriodo').addEventListener('change', () => { prefs.painel.periodo = $('pPeriodo').value; salvarPrefs(); renderPainel(); });
    $('pDe').addEventListener('change', () => { prefs.painel.de = $('pDe').value; salvarPrefs(); renderPainel(); });
    $('pAte').addEventListener('change', () => { prefs.painel.ate = $('pAte').value; salvarPrefs(); renderPainel(); });
    $('pServidor').addEventListener('change', () => { prefs.painel.servidor = $('pServidor').value; salvarPrefs(); renderPainel(); });
    $('pUF').addEventListener('change', () => { prefs.painel.uf = $('pUF').value; salvarPrefs(); renderPainel(); });
    $('btnRelatorio').addEventListener('click', () => {
      const area = el('textarea', { readonly: true, rows: 18 });
      area.value = textoRelatorio();
      dialogo({
        titulo: 'Relatório em texto',
        corpo: [el('p', { text: 'Mesmo período e filtros da visão geral. Copie e cole no documento (SEI, e-mail, Word).' }), area],
        botoes: [
          { rotulo: 'Fechar', valor: 'fechar' },
          { rotulo: 'Copiar texto', tipo: 'button', classe: 'btn-primario', onclick: () => copiar(area.value, area) },
        ],
        largo: true,
      });
    });

    // Registrar
    $('form').addEventListener('submit', enviarFormulario);
    $('fServidor').addEventListener('change', () => { delete $('fUF').dataset.tocado; $('fUF').dataset.padrao = '1'; preencherUFsForm(); renderHojeResumo(); });
    $('fUF').addEventListener('change', () => { $('fUF').dataset.tocado = '1'; atualizarSegUF(); });
    $('fData').addEventListener('change', renderHojeResumo);
    $('fAtividade').addEventListener('change', () => {
      mostrarDescricao();
      const a = atividadePorId($('fAtividade').value);
      if (a && a.ufPadrao !== undefined) { $('fUF').value = a.ufPadrao; $('fUF').dataset.tocado = '1'; atualizarSegUF(); }
    });
    const mudarQtd = (d) => {
      const q = Math.round(Number($('fQtd').value) || 1) + d;
      $('fQtd').value = String(Math.min(9999, Math.max(1, q)));
    };
    $('fMenos').addEventListener('click', () => mudarQtd(-1));
    $('fMais').addEventListener('click', () => mudarQtd(1));
    $('fCancelar').addEventListener('click', sairEdicao);
    const mudouLista = (campo, id) => () => { prefs.lista[campo] = $(id).value; limiteLista = 100; salvarPrefs(); renderLista(); };
    $('lPeriodo').addEventListener('change', mudouLista('periodo', 'lPeriodo'));
    $('lDe').addEventListener('change', mudouLista('de', 'lDe'));
    $('lAte').addEventListener('change', mudouLista('ate', 'lAte'));
    $('lServidor').addEventListener('change', mudouLista('servidor', 'lServidor'));
    $('lUF').addEventListener('change', mudouLista('uf', 'lUF'));
    $('lAtividade').addEventListener('change', mudouLista('atividade', 'lAtividade'));
    $('lLeque').addEventListener('change', mudouLista('leque', 'lLeque'));
    $('lBusca').addEventListener('input', debounce(() => { $('buscaGlobal').value = $('lBusca').value; mudouLista('busca', 'lBusca')(); }, 200));
    $('lMais').firstElementChild.addEventListener('click', () => { limiteLista += 100; renderLista(); });
    $('lCSV').addEventListener('click', () => { const { regs } = registrosDaLista(); baixarPlanilha(regs, 'registros-filtrados'); });

    // Equipe
    $('eAdicionar').addEventListener('click', () => abrirPessoa(null));

    // Ajustes
    $('aCSV').addEventListener('click', () => {
      const regs = registrosValidos().sort((a, b) => a.data.localeCompare(b.data));
      baixarPlanilha(regs, souCoord() ? 'todos-os-registros' : 'meus-registros');
    });
    $('dNovaAtividade').addEventListener('click', () => editarAtividade(null));
    const salvarSetor = () => tentar(async () => {
      const { setor } = await api('setor', { nome: $('dSetor').value.trim(), unidade: $('dUnidade').value.trim() });
      estado.setor = setor;
      renderCabecalho();
      aviso('Nomes do setor atualizados.');
    });
    $('dSetor').addEventListener('change', salvarSetor);
    $('dUnidade').addEventListener('change', salvarSetor);

    window.addEventListener('resize', debounce(() => {
      if (abaAtual !== 'painel' || $('app').hidden) return;
      const per = resolverPeriodo(prefs.painel);
      renderEvolucao(filtrar(registrosValidos(), prefs.painel, per), per);
    }, 150));
    window.addEventListener('hashchange', () => {
      const h = (location.hash || '').replace('#', '');
      if (estado && estado.registros && ABAS.includes(h) && h !== abaAtual) mostrarAba(h);
    });
    // Ao voltar para a aba do navegador, busca o que os colegas registraram.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && Date.now() - carregadoEm > 60_000) recarregar();
    });
  }

  // ======================================================================
  // Início
  // ======================================================================
  prefs = lerPrefs();
  ligarEventos();
  carregarEEntrar().catch((e) => {
    if (e instanceof ErroApi && (e.codigo === 'sessao' || e.codigo === 'trocar_senha')) return;
    mostrarTela('entrar');
    $('xErro').textContent = e instanceof ErroApi ? e.message : 'Não foi possível abrir o sistema. Recarregue a página.';
    if (!(e instanceof ErroApi)) console.error(e);
  });
})();
