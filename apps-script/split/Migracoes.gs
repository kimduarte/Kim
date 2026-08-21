
/**
 * Importação/atualização em lote da base de contatos dos municípios
 * (autoridade responsável, e-mails, telefone), a partir da planilha
 * "CONTATOS_MUNICIPIOS.xlsx" enviada em 19/08/2026 — 133 municípios com
 * dados preenchidos. Rode manualmente pelo editor (selecione
 * "importarContatosMunicipios" no menu de funções e clique em Executar)
 * sempre que receber uma base atualizada — identifica cada linha por
 * UF + Município (normalizado), então já existentes são ATUALIZADOS em
 * vez de duplicados, e pode rodar quantas vezes precisar.
 */
var CONTATOS_MUNICIPIOS_IMPORTAR_ = [
  { uf: 'AL', orgao: 'MACEIÓ/AL', autoridade: 'RODRIGO SANTOS CUNHA', ato: 'conforme Termo de Posse da Câmara Municipal de Maceió, de 05 de abril de 2026 (35426038)', emailPessoal: 'rodrigocunha@gp.maceio.al.gov.br', emailGerais: 'gabinete@gp.maceio.al.gov.br; gabinete@arser.maceio.al.gov.br; gabinete@semsc.maceio.al.gov.br; gabcivil@gp.maceio.al.gov.br', telefone: '' },
  { uf: 'AP', orgao: 'MUNICÍPIO DE MACAPÁ/AP', autoridade: 'PEDRO DOS SANTOS MARTINS', ato: 'Presidente da Câmara Municipal, no exercício da Prefeitura desde a renúncia do titular em março de 2026, após afastamento determinado pelo STF', emailPessoal: 'daluadorota@gmail.com', emailGerais: 'comando.gcmm@gmail.com; gabinete@macapa.ap.gov.br', telefone: '' },
  { uf: 'BA', orgao: 'MUNICÍPIO DE ALAGOINHAS - BA', autoridade: 'GUSTAVO AUGUSTO DE SOUZA CARMO', ato: 'nomeado conforme ato de posse no dia 01 de janeiro de 2025 (31988707).', emailPessoal: 'gustavocarmo@alagoinhas.ba.gov.br', emailGerais: 'cmt.gcm@alagoinhas.com.br', telefone: '' },
  { uf: 'BA', orgao: 'MUNICÍPIO DE AMARGOSA -BA', autoridade: 'GETÚLIO ALMEIDA SAMPAIO', ato: 'nomeado conforme ato de posse no dia 01 de janeiro de 2025 (31871542)', emailPessoal: 'getulioalmeidasampaio@gmail.com', emailGerais: 'convenios@amargosa.ba.gov.br', telefone: '' },
  { uf: 'BA', orgao: 'MUNICÍPIO DE LUÍS EDUARDO MAGALHÃES -BA', autoridade: 'ONDUMAR FERREIRA BORGES JUNIOR', ato: 'Nomeado conforme ato de posse no dia 01 de janeiro de 2025 (31768735)', emailPessoal: 'ondumarferreira@gmail.com', emailGerais: 'gcm@pmlem.ba.gov.br', telefone: '' },
  { uf: 'BA', orgao: 'MUNICÍPIO DE SALVADOR -BA', autoridade: 'BRUNO SOARES REIS', ato: 'Nomeado conforme ato de posse no dia 01 de janeiro de 2025 (32492970)', emailPessoal: 'bruno.reis@salvador.ba.gov.br', emailGerais: 'ricardo.571@salvador.ba.gov.br; flavia.nascimento@salvador.ba.gov.br; prefeito@salvador.ba.gov.br', telefone: ': Palácio Thomé de Souza, Praça Municipal, s/n, Centro, Salvador/BA, CEP: 40020-010' },
  { uf: 'CE', orgao: 'MUNICÍPIO DE ARACATI/CE', autoridade: 'ROBERTA CARDOSO BARBOSA DE ALMEIDA', ato: 'nomeado conforme Ata da Sessão Solene de Posse, no dia 01 de janeiro de 2025 (34916861)', emailPessoal: '', emailGerais: 'comando.gma@aracati.ce.gov.br', telefone: '' },
  { uf: 'CE', orgao: 'MUNICÍPIO DE CAUCAIA/CE', autoridade: 'NAUMI GOMES DE AMORIM', ato: 'nomeado conforme Ata da Sessão Solene de Posse, no dia 01 de janeiro de 2025 (34911198).', emailPessoal: 'amorimnaumi55@gmail.com', emailGerais: 'secretaria.seguranca@caucaia.ce.gov.br', telefone: '' },
  { uf: 'CE', orgao: 'MUNICÍPIO DE FORTALEZA/CE', autoridade: 'EVANDRO SÁ BARRETO LEITÃO', ato: 'posse da Câmara Municipal de Fortaleza - CE, no dia 01 de janeiro de 2025 (30424166).', emailPessoal: 'evandro.leitao@gabpref.fortaleza.ce.gov.br', emailGerais: 'pmpu@sesec.fortaleza.ce.gov.br', telefone: '' },
  { uf: 'CE', orgao: 'MUNICÍPIO DE RUSSAS/CE', autoridade: 'SÁVIO GURGEL NOGUEIRA', ato: 'nomeado conforme Ata da Sessão Solene de Posse, no dia 01 de janeiro de 2025 (34911705)', emailPessoal: 'saviogurgel@hotmail.com', emailGerais: 'chefe_gabinete@russas.ce.gov.br', telefone: '' },
  { uf: 'ES', orgao: 'MUNICÍPIO DE CARIACICA - ES', autoridade: 'EUCLERIO DE AZEVEDO SAMPAIO JUNIOR', ato: 'nomeado conforme ato de posse no dia 01 de janeiro de 2025 (31795478).', emailPessoal: 'euclerio.sampaio@cariacica.es.gov.br', emailGerais: 'lauedis.tomazelli@cariacica.es.gov.br; guilherme.oliveira2@mj.gov.br', telefone: '' },
  { uf: 'ES', orgao: 'MUNICÍPIO DE SERRA - ES', autoridade: 'WEVERSON VALCKER MEIRELES', ato: 'nomeado conforme Sessão Solene de Posse em 01 de janeiro de 2025 (32137020)', emailPessoal: 'weversonmeireles.serra@gmail.com', emailGerais: 'lais.matos@serra.es.gov.br; diego.costa@serra.es.gov.br', telefone: '' },
  { uf: 'ES', orgao: 'Vila Velha - ES', autoridade: 'ARNALDO BORGO FILHO', ato: 'nomeado conforme ato de posse no dia 01 de janeiro de 2025 (31432215).', emailPessoal: 'arnaldo.filho@vilavelha.es.gov.br', emailGerais: 'semdest@vilavelha.es.gov.br; gabinete@vilavelha.es.gov.br; gilberto.araujo@vilavelha.es.gov.br', telefone: '' },
  { uf: 'GO', orgao: 'MUNICÍPIO DE APARECIDA DE GOIÂNIA/GO', autoridade: 'LEANDRO VILELA VELLOSO', ato: 'Nomeado conforme ato de posse da Câmara Municipal de Aparecida de Goiânia, no dia 01 de janeiro de 2025 (30315749).', emailPessoal: 'v.vilela2025@gmail.com', emailGerais: 'casacivilap@gmail.com;', telefone: '' },
  { uf: 'GO', orgao: 'MUNICÍPIO DE CALDAS NOVAS/GO', autoridade: 'KLEBER LUIZ MARRA', ato: 'conforme Diploma do Prefeito (36220518)', emailPessoal: '', emailGerais: 'willenrcs@gmail.com; gabineteklebermarra@caldasnovas.go.gov.br; smt@caldasnovas.go.gov.br', telefone: '' },
  { uf: 'GO', orgao: 'MUNICÍPIO DE FORMOSA/GO', autoridade: 'SIMONE DIAS DE SOUSA RIBEIRO', ato: 'conforme ato de posse da Câmara Municipal de Formosa/GO (34620082)', emailPessoal: 'prefeitasimoneribeiro@gmail.com', emailGerais: 'guarda@formosa.go.gov.br; gabinete@formosa.go.gov.br', telefone: '' },
  { uf: 'GO', orgao: 'MUNICÍPIO DE GOIÂNIA/GO', autoridade: 'SANDRO DA MABEL ANTONIO SCODRO', ato: 'comunicado de posse nº 15610/2025 da prefeitura de Goiânia, em 01/01/2025. (34760492)', emailPessoal: 'sandro.mabel@scodro.com.br', emailGerais: 'gabpresidente@goiania.go.gov.br; secger.gcmgoiania@gmail.com; gabinete.prefeito@goiania.go.go', telefone: '' },
  { uf: 'GO', orgao: 'MUNICÍPIO DE PALMEIRAS DE GOIÁS/GO', autoridade: 'OSVALDO CASSIANO DE FARIA', ato: 'nomeado conforme Sessão Solene de Posse em 01 de janeiro de 2025 (32095102)', emailPessoal: '', emailGerais: 'chefedegabinete@palmeirasdegoias.go.gov.br; gcr.sme.pmpg@gmail.com', telefone: '' },
  { uf: 'GO', orgao: 'MUNICÍPIO DE SENADOR CANEDO/GO', autoridade: 'FERNANDO PELLOZO', ato: 'Nomeada conforme ato de posse da Câmara Municipal de Senador canedo/GO, no dia 01 de janeiro de 2021.', emailPessoal: 'fernandopellozo@gmail.com', emailGerais: 'gabineteprefeito@senadorcanedo.go.gov.br', telefone: '' },
  { uf: 'GO', orgao: 'MUNICÍPIO DE PALMEIRAS DE GOIÁS/GO', autoridade: 'OSVALDO CASSIANO DE FARIA', ato: 'nomeado conforme Termo de Posse do Prefeito, de 01 de Janeiro de 2025 (32360382)', emailPessoal: 'cassianodefariaosvaldo@gmail.com', emailGerais: 'gabinete@palmeirasdegoias.go.gov.br; chefedegabinete@palmeirasdegoias.go.gov.br; gcr.smepmpg@gmail.com', telefone: '' },
  { uf: 'MA', orgao: 'MUNICÍPIO DE ANAPURUS - MA', autoridade: 'TÂNIOS MATIAS LIMA', ato: 'nomeado conforme Sessão Solene de Posse em 01 de janeiro de 2025 (31946610).', emailPessoal: 'prefeitotanios@anapurus.ma.gov.br', emailGerais: 'prefeitura.anapurus@gmail.com; gamonteles@gmail.com', telefone: '' },
  { uf: 'MA', orgao: 'MUNICÍPIO DE BARREIRINHAS - MA', autoridade: 'MARCUS VINICIUS VALE LIMA', ato: 'nomeado conforme Sessão Solene de Posse em 01 de janeiro de 2025 (32600526)', emailPessoal: 'marcusvvl97@gmail.com', emailGerais: 'seguranca@barreirinhas.ma.gov.br; prefeito@barreirinhas.ma.gov.br', telefone: '' },
  { uf: 'MA', orgao: 'MUNICÍPIO DE GOVERNADOR EUGÊNIO BARROS', autoridade: 'FRANCISCO CARNEIRO RIBEIRO', ato: 'nomeado conforme SessãoEspecial de Posse em 01 de janeiro de 2025 (3498111).', emailPessoal: 'franciscocdob21@gmail.com', emailGerais: 'pmgeb@hotmail.com; prefeiturageb@outlook.com', telefone: '' },
  { uf: 'MA', orgao: 'MUNICÍPIO DE LAGO DA PEDRA - MA', autoridade: 'MAURA JORGE ALVES DE MELO RIBEIRO', ato: 'Nomeada conforme ato de posse no dia 01 de janeiro de 2025 (30392467).', emailPessoal: 'maura.prefeita@gmail.com', emailGerais: 'prefeituralp@lagodapedra.ma.gov.br; secdeseguranca@lagodapedra.ma.gov.br', telefone: '' },
  { uf: 'MA', orgao: 'MUNICÍPIO DE LAJEADO NOVO/MA', autoridade: 'ATAÍRES LOBO SANTOS DE ANDRADE', ato: 'Nomeado conforme Termo de Posse da Câmara Municipal de Lajeado Novo/MA datado de 01/01/2025 (30571502).', emailPessoal: 'prefeitoitairestratozao@gmail.com', emailGerais: 'admlajeadonovo@gmail.com; gabiente@lajeadonovo.ma.gov.br; prefeitura@lajeadonovo.ma.gov.br', telefone: '' },
  { uf: 'MA', orgao: 'MUNICÍPIO DE PENALVA - MA', autoridade: 'LUIZ HENRIQUE ALVES GUERRA', ato: 'nomeado conforme Termo de Posse da Câmara Municipal de Penalva - MA, em 1º de janeiro de 2025 (32221258)', emailPessoal: '', emailGerais: 'prefeiturapenalva45@gmail.com; gabsspma@gmail.com; prefeiturapenalva.ma@gmail.com', telefone: '' },
  { uf: 'MA', orgao: 'MUNICÍPIO DE PERITORÓ - MA', autoridade: 'JOSUÉ PINHO DA SILVA JUNIOR', ato: 'nomeado conforme Termo de Posse da Câmara Municipal de Peritoró - MA, no dia 1º de janeiro de 2025 (32854041).', emailPessoal: 'drjuniorprefeito@peritoro.ma.gov.br', emailGerais: 'gabinete@peritoro.ma.gov.br', telefone: '' },
  { uf: 'MA', orgao: 'MUNICÍPIO DE VIANA -MA', autoridade: 'CARLOS AUGUSTO FURTADO CIDREIRA', ato: 'nomeado conforme Termo de Posse da Câmara Municipal de Viana - MA, no dia 1º de janeiro de 2025 (32862672)', emailPessoal: 'carlosaugustofurtadocidreira@gmail.com', emailGerais: 'Prefeituradevianama@gmail.com', telefone: 'Rua Praça Ozimo de Carvalho, 141, Centro, Viana - MA, 65.215-000' },
  { uf: 'MS', orgao: 'MUNICÍPIO DE BONITO/MS', autoridade: 'JOSMAIL RODRIGUES', ato: 'Nomeado conforme Termo de Posse da Câmara Municipal de Bonito/MS datado de 01/01/2021.', emailPessoal: 'josmailrodrigues.ms@gmail.com', emailGerais: 'gabinete.prefeito@bonito.ms.gov.br', telefone: '(67) 3255-1351 (67) 3255-1471' },
  { uf: 'MS', orgao: 'MUNICÍPIO DE DOURADOS - MS', autoridade: 'MARÇAL GONÇALVES LEITE FILHO', ato: 'nomeado conforme ato de posse no dia 01 de janeiro de 2025 (32025146).', emailPessoal: 'marcal.filho@dourados.ms.gov.br', emailGerais: 'gmd@dourados.ms.gov.br', telefone: '' },
  { uf: 'MG', orgao: 'MUNICÍPIO DE PLANURA/MG', autoridade: 'ANTONIO LUIZ BOTELHO', ato: 'nomeado conforme Termo de Posse da Câmara Municipal de Planura/MG, em 01 de janeiro de 2025 (32665570).', emailPessoal: 'antonioluizbotelho@planura.mg.br', emailGerais: 'PREFEITURA@PLANURA.MG.GOV.BR', telefone: '' },
  { uf: 'MG', orgao: 'MUNICÍPIO DE SANTA LUZIA/MG', autoridade: 'PAULO HENRIQUE PAULINO E SILVA', ato: 'conforme Termo de Posse (34505792)', emailPessoal: 'paulobigodinho@santaluzia.mg.gov.br', emailGerais: 'guardamunicipal@santaluzia.mg.gov.br; felipemendescarvalho@santaluzia.mg.gov.br', telefone: '' },
  { uf: 'PB', orgao: 'MUNICÍPIO DE JOÃO PESSOA - PB', autoridade: 'CICERO DE LUCENA FILHO', ato: 'nomeado conforme Termo de Posse da Câmara Municipal de João Pessoa - PB, no dia 1º de janeiro de 2025 (32709871).', emailPessoal: 'cicerolucena11@outlook.com', emailGerais: 'semusb.comando@joaopessoa.pb.gov.br gapre@joaopessoa.pb.gov.br; gabinetesemusbjp@gmail.com', telefone: '' },
  { uf: 'PB', orgao: 'MUNICÍPIO DE POCINHOS - PB', autoridade: 'ELIANE MOURA DOS SANTOS GALDINO', ato: 'nomeado conforme Ata da Sessão Solene da Câmara Municipal no dia 01 de janeiro de 2025 (34393335)', emailPessoal: 'elianemourasgaldino@gmail.com', emailGerais: 'prefmunicipalpocinhospb@gmail.com', telefone: '' },
  { uf: 'PR', orgao: 'MUNICÍPIO DE APUCARANA - PR', autoridade: 'RODOLFO MOTA DA SILVA', ato: 'Nomeado no dia 01 de janeiro de 2025 (33360970).', emailPessoal: 'rodolfoapucarana@gmail.com/rodolfomota@outlook.com', emailGerais: 'gcm@apucarana.pr.gov.br', telefone: '' },
  { uf: 'PR', orgao: 'MUNICÍPIO DE ARAPONGAS - PR', autoridade: 'RAFAEL FELIPE CITA', ato: 'Posse do Cine Teatro Mauá de Arapongas -PR, em 01 de janeiro de 2025 (30895619).', emailPessoal: 'sei.rafaelcita@gmail.com', emailGerais: 'gabinete@arapongas.pr.gov.br', telefone: '' },
  { uf: 'PR', orgao: 'MUNICÍPIO DE ARAUCÁRIA - PR', autoridade: 'LUIZ GUSTAVO BOTOGOSKI', ato: '', emailPessoal: 'gustavo.botogoski@araucaria.pr.gov.br', emailGerais: 'prefeito@araucaria.pr.gov.br; prefeitura@araucaria.pr.gov.br; guardamunicipal@araucaria.pr.gov.br', telefone: '(41) 3614-1511 (Gabinete do Prefeito)' },
  { uf: 'PR', orgao: 'MUNICÍPIO DE CAMPO LARGO - PR', autoridade: 'MAURÍCIO ROBERTO RIVABEM', ato: 'nomeado conforme ata da reunião solene de posse da Câmara Municipal de Campo Largo PR, de 01 de janeiro de 2025 (35239873)', emailPessoal: 'mauriciorivabem@campolargo.pr.gov.br', emailGerais: 'messiasgmcl11@gmail.com; guardamunicipal@campolargo.pr.gov.br', telefone: '' },
  { uf: 'PR', orgao: 'MUNICÍPIO DE CASCAVEL - PR', autoridade: 'RENATO DA SILVA', ato: 'Nomeado no dia 01 de Janeiro de 2025 (30297220)', emailPessoal: 'renato-silva@cascavel.pr.gov.br', emailGerais: 'cristianob@cascavel.pr.gov.br casacivil@cascavel.pr.gov.br', telefone: '' },
  { uf: 'PR', orgao: 'MUNICÍPIO DE LONDRINA - PR', autoridade: 'JOSÉ TIAGO CAMARGO DO AMARAL', ato: 'nomeado conforme ato de posse da Câmara Municipal de Londrina - PR, no dia 01 de janeiro de 2025 (30994611).', emailPessoal: 'tiago.prefeito@londrina.pr.gov.br', emailGerais: 'gabprefeito@londrina.pr.gov.br; defesa.convenio@londrina.pr.gov.br; defesa.social@londrina.pr.gov.br; seplan@londrina.pr.gov.br', telefone: '' },
  { uf: 'PR', orgao: 'MUNICÍPIO DE MARINGÁ - PR', autoridade: 'SILVIO MAGALHÃES BARROS II', ato: 'Nomeado conforme ato de posse da Câmara Municipal de Maringá - PR, no dia 01 de janeiro de 2025 (30900434).', emailPessoal: 'contato@silviobarros.com.br', emailGerais: 'prefeito@maringa.pr.gov.br', telefone: '' },
  { uf: 'PR', orgao: 'MUNICÍPIO DE PONTA GROSSA - PR', autoridade: 'ELIZABETH SILVEIRA SCHMIDT', ato: 'Termo de posse da Câmara Municipal de Ponta Grossa - PR, no dia 01 de janeiro de 2025 (33695145)', emailPessoal: 'prefeitaelizabeth@pontagrossa.pr.gov.br', emailGerais: 'emmanuel.santos@pontagrossa.pr.gov.br', telefone: '' },
  { uf: 'PR', orgao: 'MUNICÍPIO DE SANDARI - PR', autoridade: 'CARLOS ALBERTO DE PAULA JÚNIOR', ato: 'posse da Câmara Municipal de Sarandi - PR, no dia 01 de janeiro de 2025 (30927131)', emailPessoal: 'gap@sarandi.pr.gov.br', emailGerais: 'gap@sarandi.pr.gov.br; sec.adm@sarandi.pr.gov.br', telefone: '' },
  { uf: 'PR', orgao: 'MUNICÍPIO DE SAO JOSÉ DOS PINHAIS - PR', autoridade: 'MARGARIDA MARIA SINGER', ato: 'nomeado conforme Ata da Sessão Solene de Posse, no dia 01 de janeiro de 2025 (36535192)', emailPessoal: 'nina.singer@sjp.pr.gov.br', emailGerais: 'mario.kosiol@sjp.pr.gov.br', telefone: '' },
  { uf: 'PR', orgao: 'MUNICÍPIO DE SIQUEIRA CAMPOS - PR', autoridade: 'LUIZ HENRIQUE GERMANO', ato: 'nomeado conforme ato de posse no dia 01 de janeiro de 2025 (33689813)', emailPessoal: 'luizhenriquegermano@siqueiracampos.pr.gov.br', emailGerais: 'gabinete@siqueiracampos.pr.gov.br; administracao@siqueiracampos.pr.gov.br; siqueiracampos@bm.pr.gov.br; pbc-siqueiracampos@bbm.pr.gov.br', telefone: '' },
  { uf: 'PR', orgao: 'MUNICÍPIO DE UMUARAMA - PR', autoridade: 'ANTÔNIO FERNANDO SCANAVACA', ato: 'conforme ato de transmissão de cargo de Prefeito, publicado no Umuarama Ilustrado de 03 de janeiro de 2025 de nº 13.206 (34213416)', emailPessoal: 'deputado@fernandoscanavaca.com.br', emailGerais: 'gmu@umuarama.pr.gov.br', telefone: '' },
  { uf: 'PE', orgao: 'MUNICÍPIO DE BELO JARDIM - PE', autoridade: 'GILVANDRO ESTRELA DE OLIVEIRA', ato: 'nomeado conforme Termo de Posse da Câmara Municipal de Belo Jardim - PE, no dia 01 de janeiro de 2025 (31809106).', emailPessoal: 'gilvandroestrela@belojardim.pe.gov.br', emailGerais: 'ouvidoria@belojardim.pe.gov.br; sedec@belojardim.pe.gov.br', telefone: '' },
  { uf: 'PE', orgao: 'MUNICÍPIO DE CAMARAGIBE/PE', autoridade: 'DIEGO DA ROCHA CABRAL', ato: 'Nomeado no dia 01 de janeiro de 2025 (30315500).', emailPessoal: 'diego.cabral@camaragibe.pe.gov.br', emailGerais: 'sesep@camaragibe.pe.gov.br; gabinete@camaragibe.pe.gov.br; segov@camaragibe.pe.gov.br; dranadegi@camaragibe.pe.gov.br; secad@camaragibe.pe.gov.br', telefone: '' },
  { uf: 'PE', orgao: 'MUNICÍPIO DE CARUARU - PE', autoridade: 'RODRIGO ANSELMO PINHEIRO DOS SANTOS', ato: 'nomeado conforme Termo de Compromisso de Posse do dia 01 de janeiro de 2025 (32682824)', emailPessoal: 'rodrigo.pinheiro@caruaru.pe.gov.br', emailGerais: 'guarda.municipal@caruaru.pe.gov.br; ouvidoria@caruaru.pe.gov.br; secop@caruaru.pe.gov.br; alinealana2009@hotmail.com', telefone: '' },
  { uf: 'PE', orgao: 'MUNICÍPIO DA ILHA DE ITAMARACÁ - PE', autoridade: 'PAULO FERNANDO PIMENTEL GALVÃO,', ato: 'conforme Diploma expedido pelo Presidente da 131ª Junta Eleitoral do TRE de Pernambuco, 17 de dezembro de 2024. (33329816)', emailPessoal: '', emailGerais: 'seguranca@ilhadeitamaraca.pe.gov.br', telefone: '' },
  { uf: 'PE', orgao: 'MUNICÍPIO DE ITAPISSUMA - PE', autoridade: 'VALDEMIR LOURENÇO DOS SANTOS JÚNIOR', ato: 'nomeado conforme Ata da Sessão Solene da Câmara Municipal de Itapissuma - PE, no dia 01 de janeiro de 2025 (332878).', emailPessoal: 'juniorsanttos2@yahoo.com.br', emailGerais: 'gerconvenios.pmi@itapissuma.pe.gov.br; guardamunicipaldeitapissuma@hotmail.com', telefone: 'Telefone: (81) 3548-1647' },
  { uf: 'PE', orgao: 'MUNICÍPIO DE JABOATÃO DOS GUARARAPES/PE', autoridade: 'LUIZ JOSÉ INOJOSA DE MEDEIROS', ato: 'nomeado conforme Ata da Reunião Solene de Posse em 01 de janeiro de 2025 (34392804)', emailPessoal: 'luiz.medeiros@jaboatao.pe.gov.br', emailGerais: 'comandodaguardajaboatao@gmail.com; sesc.jaboatao@gmail.com; defesacivil@jaboatao.pe.gov.br; defesaautuacao.transito@jaboatao.pe.gov.br; gab.semob.pmjg@gmail.com; ouvidoria@jaboatao.pe.gov.br', telefone: '' },
  { uf: 'PE', orgao: 'MUNICÍPIO DE OLINDA/PE', autoridade: 'MIRELLA FERNANDA BEZERRA DE ALMEIDA', ato: 'nomeado conforme ato de posse no dia 01 de janeiro de 2025 (30674539).', emailPessoal: 'prefeitamirella@olinda.pe.gov.br', emailGerais: 'admgabineteolinda@gmail.com; secretariosesc@olinda.pe.gov.br;', telefone: '' },
  { uf: 'PE', orgao: 'MUNICÍPIO DE PALMARES/PE', autoridade: 'JOSÉ BARTOLOMEU DE ALMEIDA MELO JUNIOR', ato: 'nomeado conforme Diploma no dia 01 de janeiro de 2025 (32586495)', emailPessoal: 'juniormelo.pmp@gmail.com', emailGerais: 'mdestran@palmares.pe.gov.br; notificacao@1doc.com.br', telefone: '' },
  { uf: 'PE', orgao: 'MUNICÍPIO DE PASSIRA/PE', autoridade: 'SEVERINO SILVESTRE DE ALBUQUERQUE', ato: 'Nomeada conforme ato de posse da Câmara Municipal de Passira/PE, no dia 01 de janeiro de 2021.', emailPessoal: 'silvestrepassira@hotmail.com', emailGerais: 'secadm.passira@gmail.com', telefone: '' },
  { uf: 'PE', orgao: 'MUNICÍPIO DO PAULISTA - PE', autoridade: 'SEVERINO RAMOS DE SANTANA', ato: 'Nomeada conforme ato de posse da Câmara Municipal de Paulista/PE, no dia 01 de janeiro de 2025 (30461081).', emailPessoal: 'ramosgabinete.paulista@gmail.com', emailGerais: 'ssmdcpaulista.pe@gmail.com; gabinetedoprefeito@paulista.pe.gov.br', telefone: '' },
  { uf: 'PE', orgao: 'MUNICÍPIO DE POMBOS - PE', autoridade: 'ELIAS BATISTA DE LIMA', ato: 'nomeado conforme Ata da Sessão Solene da Câmara Municipal de Pombos - PE, no dia 01 de janeiro de 2025 (31655856).', emailPessoal: 'gabinetedoprefeitoeliasmeufii@gmail.com', emailGerais: 'adm@pombos.pe.gov.br; prefeitura@pombos.pe.gov.br', telefone: '' },
  { uf: 'PE', orgao: 'MUNICÍPIO DE SANTA CRUZ DO CAPIBARIBE - PE', autoridade: 'HELIO LIMA ARAGÃO FILHO', ato: 'nomeado conforme Sessão Solene de Posse da Câmara de Vereadores de Santa Cruz do Capibaribe -PE em 01 de janeiro de 2025 (32970404).', emailPessoal: 'heliolimaaragaofilho@gmail.com', emailGerais: 'leticiastevam51@gmail.com; secretariosds.scc@gmail.com; contato@santacruzdocapibaribe.pe.gov.br; segov@santacruzdocapibaribe.pe.gov.br; sedes@santacruzdocapibaribe.pe.gov.br; gabinete@santacruzdocapibaribe.pe.gov.br', telefone: 'Gabinete do Prefeito: (81) 3731-1479' },
  { uf: 'PE', orgao: 'MUNICÍPIO DE SÃO VICENTE FERRER - PE', autoridade: 'MARCONE VICENTE DOS SANTOS', ato: 'nomeado conforme Sessão Solene de Posse da Câmara Municipal de São Vicente Ferrer - PE, de 01 de janeiro de 2025 (33206938​​​​​​​)', emailPessoal: 'pref.marcone@gmail.com', emailGerais: 'prefeiturasaovicenteferrer@gmail.com.br', telefone: '81 - 3655-1133 (Gabinete do Prefeito)' },
  { uf: 'PE', orgao: 'MUNICÍPIO DE TORITAMA - PE', autoridade: 'SERGIO PROCOPIO COLIN DA SILVA CARVALHO', ato: 'nomeado conforme ata da reunião solene de posse da Câmara Municipal de Toritama - PE, de 01 de janeiro de 2025 (31695932, 31695934).', emailPessoal: 'gabinetesergiocollin@gmail.com', emailGerais: 'chefiadegabinete@toritama.pe.gov.br; administracao@toritama.pe.gov.br; ordemsocial@toritama.pe.gov.br', telefone: '' },
  { uf: 'PE', orgao: 'MUNICÍPIO DE VENTUROSA - PE', autoridade: 'KELVIN DOUGLAS CAVALCANTI ALMEIDA', ato: 'nomeado conforme Ata da Sessão Solene de Posse da Câmara Municipal de Venturosa - PE, no dia 01 de janeiro de 2025 (32593741)', emailPessoal: 'kelvincavalcantioficial@gmail.com', emailGerais: 'administracao@venturosa.pe.gov.br; luizfbfilho@hotmail.com', telefone: '' },
  { uf: 'PE', orgao: 'MUNICÍPIO DE VITÓRIA DE SANTO ANTÃO - PE', autoridade: 'PAULO ROBERTO LEITE DE ARRUD', ato: 'nomeado conforme Sessão Solene de Posse em 01 de janeiro de 2025 (30342880).', emailPessoal: 'paulorobertoleitedearruda6@gmail.com', emailGerais: 'ouvidoria@prefeituradavitoria.pe.gov.br; gabinete@prefeituradavitoria.pe.gov.br;', telefone: '' },
  { uf: 'PE', orgao: 'MUNICÍPIO DE JABOATÃO DOS GUARARAPES - PE.', autoridade: 'LUIZ JOSÉ INOJOSA DE MEDEIROS', ato: 'nomeado conforme Ata da Reunião Solene de Posse em 01 de janeiro de 2025 (32643988).', emailPessoal: 'luiz.medeiros@jaboatao.pe.gov.br', emailGerais: 'comandodaguardajaboatao@gmail.com; sesc.jaboatao@gmail.com', telefone: '' },
  { uf: 'RJ', orgao: 'MUNICÍPIO DE BELFORD ROXO - RJ', autoridade: 'MARCIO CORREIA DE OLIVEIRA', ato: 'nomeado conforme ato de posse no dia 01 de janeiro de 2025 (31869746).', emailPessoal: 'marciocanellabr@gmail.com', emailGerais: 'smsp@prefeituradebelfordroxo.rj.gov.br; semsep@prefeituradebelfordroxo.rj.gov.br; gabineteprefeito@prefeituradebelfordroxo.rj.gov.br; broxo.semsep@gmail.com; comunicacao@prefeituradebelfordroxo.rj.gov.br; gabcompras@prefeituradebelfordroxo.rj.gov.br; licitacao@prefeituradebelfordroxo.rj.gov.br', telefone: '' },
  { uf: 'RJ', orgao: 'MUNICÍPIO DE BOM JESUS DE ITABAPOANA/RJ', autoridade: 'PAULO SERGIO CYRILLO', ato: 'Conforme termo de posse, datada de 01 de janeiro de 2025 (30342980).', emailPessoal: 'paulosergiocyrillo@gmail.com', emailGerais: 'gabinete@bomjesus.rj.gov.br', telefone: '' },
  { uf: 'RJ', orgao: 'MUNICÍPIO DE ITAGUAÍ - RJ', autoridade: 'HAROLDO RODRIGUES JESUS NETO', ato: 'Nomeado conforme ato de posse da Câmara Municipal de Itaguaí - RJ, no dia 01 de janeiro de 2025 (30282684).', emailPessoal: 'haroldorjn@gmail.com', emailGerais: '', telefone: '' },
  { uf: 'RJ', orgao: 'MUNICÍPIO DE ITATIAIA - RJ', autoridade: 'KAIO MARCIO RESENDE DE PAIVA', ato: 'nomeado conforme Ata da Sessão Solene de Posse, no dia 01 de janeiro de 2025 (34962404)', emailPessoal: 'kaiomarcio.itatiaia@gmail.com', emailGerais: 'convenios.itatiaia@gmail.com', telefone: '' },
  { uf: 'RJ', orgao: 'MUNÍCIPIO DE NOVA FRIBURGO - RJ', autoridade: 'JOHNNY MAYCON CORDEIRO RIBEIRO', ato: 'Nomeada conforme ato de posse da Câmara Municipal de Nova Friburgo/RJ, no dia 01 de janeiro de 2021 (30329563).', emailPessoal: 'johnnyieq441@gmail.com', emailGerais: 'sgabinete@pmnf.rj.gov.br; mayrasecgab@gmail.com', telefone: '' },
  { uf: 'RJ', orgao: 'MUNICÍPIO DE PETRÓPOLIS - RJ', autoridade: 'HINGO HAMMES', ato: 'Nomeado conforme termo de compromisso e posse da Câmara Municipal de Petrópolis - RJ, no dia 01 de janeiro de 2025 (33025859).', emailPessoal: '', emailGerais: 'petropolisconvenios@gmail.com; gap@petropolis.rj.gov.br; rubensbomtempo@petropolis.rj.gov.br;', telefone: 'Av. Koeller 260 – Centro – Petrópolis/RJ CEP: 25680-060 - telefone (24) 2246-9240' },
  { uf: 'RJ', orgao: 'MUNICÍPIO DE RIO DAS OSTRAS - RJ', autoridade: 'CARLOS AUGUSTO CARVALHO BALTAZAR', ato: 'posse da Câmara Municipal de Rio das Ostras/RJ, no dia 01 de janeiro de 2025 (30423946).', emailPessoal: '', emailGerais: 'cissa.pmro@gmail.com', telefone: '' },
  { uf: 'RJ', orgao: 'MUNICÍPIO SÃO JOÃO DA BARRA - RJ', autoridade: 'KARLA CHAGAS MAIA', ato: 'nomeada conforme ato de posse no dia 01 de janeiro de 2025 (30356260).', emailPessoal: '', emailGerais: 'gabinete@sjb.rj.gov.br', telefone: '' },
  { uf: 'RJ', orgao: 'MUNICÍPIO TANGUÁ - RJ', autoridade: 'RODRIGO DA COSTA MEDEIROS', ato: 'nomeado conforme Termo de Posse (33939962)', emailPessoal: '', emailGerais: 'gabinete@tangua.rj.gov.br; secmsop@tangua.rj.gov.br; gcm@tangua.rj.gov.br', telefone: '' },
  { uf: 'RN', orgao: 'MUNICÍPIO DE VERA CRUZ - RN​​', autoridade: 'JOSÉ JUNIOR DE OLIVEIRA', ato: 'Nomeado no dia 01 de Janeiro de 2025 (31040047).', emailPessoal: '', emailGerais: 'gabineteveracruz2025@hotmail.com', telefone: '' },
  { uf: 'RS', orgao: 'MUNICÍPIO DE SAPUCAIA DO SUL/RS', autoridade: 'VOLMIR RODRIGUES', ato: 'Nomeado pela Camara de Vereadores de Sapucaia do Sul/RS conforme Termo de transmissão de cargo datado de 01 de janeiro de 2021.', emailPessoal: 'volmirrodrigues@terra.com.br', emailGerais: 'gabinete@sapucaiadosul.rs.gov.br; contato@sapucaiadosul.rs.gov.br; volmirrodrigues@terra.com.br', telefone: '' },
  { uf: 'RS', orgao: 'MUNICÍPIO DE PORTO ALEGRE/RS', autoridade: 'SEBASTIÃO DE ARAÚJO MELO', ato: 'Nomeado conforme Termo de Posse emitido pela Câmara Municipal de Porto Alegre, no primeiro dia de janeiro de 2025 (30681060).', emailPessoal: 'sebastiao.melo@portoalegre.rs.gov.br', emailGerais: 'prefeito@portoalegre.rs.gov.br; ricardo.gomes@portoalegre.rs.gov.br; veridiana.carpes@portoalegre.rs.gov.br; marcoa.filho@portoalegre.rs.gov.br; richard.rodrigues@portoalegre.rs.gov.br; carmenlucia@portoalegre.rs.gov.br', telefone: '' },
  { uf: 'RR', orgao: 'MUNICÍPIO DE BOA VISTA - RR', autoridade: 'MARCELO ZEITOUNE', ato: 'nomeado conforme Sessão Solene de Posse em 01 de janeiro de 2025 (35453230).', emailPessoal: 'marcelo.zeitoune@prefeitura.boavista.br', emailGerais: 'cappsmst@outlook.com; smgov@prefeitura.boavista.br; smst.gab@boavista.rr.gov.br; leda.paixao@boavista.rr.gov.br', telefone: '' },
  { uf: 'RR', orgao: 'MUNICÍPIO DE BONFIM - RR', autoridade: 'ROMUALDO FEITOSA SILVA', ato: 'nomeado conforme Sessão Solene de Posse em 01 de janeiro de 2025 (32416891)', emailPessoal: 'romualdofeitosa32@gmail.com', emailGerais: 'bell.pinheiros@gmail.com; gcmbonfim21@gmail.com; pmbonfimrr@gmail.com', telefone: '' },
  { uf: 'RR', orgao: 'MUNICÍPIO DE CANTÁ -RR', autoridade: 'ANDRE LUIS COSTA DE CASTRO', ato: 'nomeado conforme Sessão Solene de Posse em 01 de janeiro de 2025 (33707833)', emailPessoal: 'ac623698@gmail.com/castroecastro.cc.ltda@gmail.com', emailGerais: 'prefeitura.canta@gmail.com', telefone: '' },
  { uf: 'RR', orgao: 'MUNICÍPIO DE CARACARAÍ - RR', autoridade: 'DIANIERY DE SOUZA COELHO', ato: 'nomeada conforme Sessão Solene de Posse em 01 de janeiro de 2025 (32600313)', emailPessoal: 'diane.coelho@caracarai.rr.gov.br / dianecoelho.cci@gmail.com', emailGerais: 'gcm@caracarai.rr.gov.br; gapre@caracarai.rr.gov.br; raimundo.figueiredo@caracarai.rr.gov.br', telefone: '' },
  { uf: 'RR', orgao: 'MUNICÍPIO DE MUCAJAÍ - RR', autoridade: 'FRANCISCO RUFINO DE SOUZA', ato: 'nomeado conforme Termo de Posse da Câmara Municipal de Mucajaí - RR em 01 de janeiro de 2025 (32533850).', emailPessoal: 'chiquinhorufino10@gmail.com', emailGerais: 'prefeiturademucajairr@gmail.com; segurancamucajai@gmail.com; segurancamucajai@outlook.com', telefone: '' },
  { uf: 'RR', orgao: 'MUNICÍPIO DE PACARAIMA - RR', autoridade: 'WALDERY DAVILA SAMPAIO', ato: 'nomeado conforme Sessão Solene de Posse em 01 de janeiro de 2025 (33811804)', emailPessoal: 'walderydavila@gmail.com', emailGerais: 'segop@pacaraima.rr.gov.br; gabinete@pacaraima.rr.gov.br', telefone: '' },
  { uf: 'SC', orgao: 'Florianópolis - SC', autoridade: 'TOPÁZIO SILVEIRA NETO', ato: 'conforme Diploma expedido pela Justiça Eleitoral de santa Catarina, em 17 de dezembro de 2024 (34266888)', emailPessoal: 'topazio.neto@pmf.sc.gov.br', emailGerais: 'topazio.neto@floripa.sc.gov.br; guardaflorianopolis@floripa.sc.gov.br.', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE AGUDOS -SP', autoridade: 'RAFAEL LIMA FERNANDES', ato: 'nomeado conforme Ata da Sessão Solene da Câmara Municipal de Agudos/SP no dia 01 de janeiro de 2025 (34652851)', emailPessoal: 'rafaellimaf@uol.com.br', emailGerais: 'vagner.dias@agudos.sp.gov.br; convenios@agudos.sp.gov.br; gabinete@agudos.sp.gov.br; cesar.alpaniez@agudos.sp.gov.br', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE APARECIDA -SP', autoridade: 'JOSÉ LUIZ RODRIGUES', ato: 'nomeado conforme Ata da Sessão Solene da Câmara Municipal de Aparecida/SP, no dia 01 de janeiro de 2025 (34664340)', emailPessoal: 'zelouquinho@uol.com.br', emailGerais: 'convenios@aparecida.sp.gov.br; admtransito@aparecida.sp.gov.br; gabinete@aparecida.sp.gov.br', telefone: '(19) 3547-3150 - GABINETE DO PREFEITO' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE ARARAS -SP', autoridade: 'IRINEU NORIVAL MARETTO', ato: 'nomeado conforme ato de posse no dia 01 de janeiro de 2025 (32315976).', emailPessoal: 'irineumaretto2025@gmail.com', emailGerais: 'seguranca@araras.sp.gov.br', telefone: '(19) 3547-3150 - GABINETE DO PREFEITO' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE ARTHUR NOGUEIRA - SP.', autoridade: 'LUCAS SIA RISSATO', ato: 'nomeado conforme ato de posse no dia 01 de janeiro de 2025 (31469135).', emailPessoal: 'lucassiarissato@gmail.com', emailGerais: 'contato@arturnogueira.sp.gov.br; gabinete@arturnogueira.sp.gov.br; seguranca.sec@arturnogueira.sp.gov.br', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE ATIBAIA - SP', autoridade: 'DANIEL DA ROCHA MARTINI', ato: 'nomeado no dia 01 de janeiro de 2025 (33879951)', emailPessoal: 'daniel.martini@atibaia.sp.gov.br', emailGerais: 'prefeito@atibaia.sp.gov.br; tsiqueira@atibaia.sp.gov.br', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE CAÇAPAVA - SP', autoridade: 'YAN LOPES DE ALMEIDA', ato: 'nomeado conforme Ata da Sessão Solene da Câmara Municipal de Caçapava/SP, no dia 01 de janeiro de 2025 (35142092).', emailPessoal: 'yanlopes2k@gmail.com', emailGerais: 'gabinete.prefeito@cacapava.sp.gov.br; silvana.gcm@cacapava.sp.gov.br', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE CAIEIRAS - SP', autoridade: 'GILMAR SOARES VICENTE', ato: 'nomeado conforme ato de posse, de 1º de janeiro de 2025 (34617029)', emailPessoal: 'gilmar.soares@caieiras.sp.gov.br', emailGerais: 'guarda@caieiras.sp.gov.br', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE CAMPO LIMPO PAULISTA/SP', autoridade: 'ADEILDO NOGUERIA DA SILVA', ato: 'Nomeado pela Câmara Municipal de Campo Limpo Paulista por meio do Termo de Posse de 1º de janeiro de 2025 (30510920).', emailPessoal: 'nogueira.adeildo@gmail.com; prefeito.adeildo@campolimpopaulista.sp.gov.br', emailGerais: 'jonascespedes@gmail.com; jonas.cespedes@campolimpopauklista.sp.gov.br', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE COSMÓPOLIS - SP', autoridade: 'ANTONIO CLAUDIO FELISBINO JUNIOR', ato: 'Nomeado no dia 01 de janeiro de 2025 (30360691).', emailPessoal: 'antonioclaudiofelisbinojunior@gmail.com', emailGerais: 'sspt@cosmopolis.sp.gov.br', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE DIADEMA - SP', autoridade: 'TAKAHARU YAMAUCHI', ato: 'nomeado conforme ato de posse, de 1º de janeiro de 2025 (35094939)', emailPessoal: 'taka.yamauchi@diadema.sp.gov.br', emailGerais: 'anderson.celso@diadema.sp.gov.br; segurancacidada@diadema.sp.gov.br; nilton.dias@diadema.sp.gov.br', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE EMBU-GUAÇU -SP', autoridade: 'FRANCISCO JOSÉ DO NASCIMENTO', ato: 'nomeado conforme ato de posse no dia 21 de julho de 2025 (33817281).', emailPessoal: 'francisco.nascimento@eg.sp.gov.br', emailGerais: 'gabinete@eg.sp.gov.br; administracao@eg.sp.gov.br; gcm@eg.sp.gov.br; desenvolvimento@eg.sp.gov.br', telefone: 'Rua Coronel Luiz Tenório de Brito, número 458, no bairro Centro, com o CEP 06900-000 - (11) 4662-7351' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE FRANCISCO MORATO - SP', autoridade: 'ILDO DA SILVA GUSMÃO', ato: 'conforme Termo de Posse da Câmara Municipal de Francisco Morato - SP, em 01 de janeiro de 2025 (32189417)', emailPessoal: 'ildo.gusmao@franciscomorato.sp.gov.br', emailGerais: 'jucineide.santos@franciscomorato.sp.gov.br; luigi.molon@franciscomorato.sp.gov.br; seguranca.cidada@franciscomorato.sp.gov.br', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE FRANCO DA ROCHA - SP', autoridade: 'LORENA RODRIGUES DE OLIVEIRA', ato: 'conforme Termo de Posse nº 002/2025 da Câmara Municipal de Franco da Rocha - SP, em 01 de janeiro de 2025 (34339308)', emailPessoal: 'lorena.oliveira@francodarocha.sp.gov.br', emailGerais: 'marcio.coelho@francodarocha.sp.gov.br; jose.cardoso@francodarocha.sp.gov.br; izabele.brazhighim@francodarocha.sp.gov.br', telefone: 'situado à Avenida Liberdade, 250 - Centro, Franco da Rocha - SP, CEP 07.850-325' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE ITAPETININGA/SP', autoridade: 'JEFERSON RODRIGO BRUN', ato: 'conforme termo de Posse (34807902)', emailPessoal: 'jefersonbrun@itapetininga.sp.gov.br', emailGerais: 'seguranapublica@itapetininga.sp.gov.br; governo@itapetininga.sp.gov.br', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE ITAPEVI/SP', autoridade: 'MARCOS FERREIRA GODOY', ato: 'nomeado conforme ato de posse, de 1º de janeiro de 2025 (34339995)', emailPessoal: '', emailGerais: 'sec.seguranca@itapevi.sp.gov.br; priscila.camargo@itapevi.sp.gov.br', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE ITAPIRA/SP', autoridade: 'ANTONIO HELIO NICOLATI', ato: 'Termo de Posse e Compromisso no dia 01 de janeiro de 2025 (330159239)', emailPessoal: 'toninho.bellini@hotmail.com', emailGerais: 'prefeito@itapira.sp.gov.br; gabinetedoprefeito@itapira.sp.gov.br; adm.secretario@itapira.sp.gov.br; gov.secretario@itapira.sp.gov.br; convenios@itapira.sp.gov.br; convenios.itapira@gmail.com', telefone: 'Rua João de Moraes, 490 centro. Itapira/SP - CEP. 13.970-903 - Telefone: (19) 3843-9100' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE JAGUARIÚNA/SP', autoridade: 'DAVID HILARIO NETO', ato: 'nomeado conforme Ata da Sessão Solene da Câmara Municipal da Jaguariúna/SP no dia 01 de janeiro de 2025 (33417562).', emailPessoal: '(david.liiiiihhh@gmail.com', emailGerais: 'segurancapublica@jaguariuna.sp.gov.br; convenios@jaguariuna.sp.gov.br', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE JUNDIAÍ - SP', autoridade: 'GUSTAVO MARTINELLI', ato: 'nomeado conforme ato de posse no dia 01 de janeiro de 2025 (31469135).', emailPessoal: 'gmartinelli@jundiai.sp.gov.br', emailGerais: 'comandantegm@jundiai.sp.gov.br;fzarantonello@jundiai.sp.gov.br', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE LEME- SP', autoridade: 'CLAUDEMIR APARECIDO BORGES', ato: 'nomeado conforme ato de posse no dia 01 de janeiro de 2025 (31571828).', emailPessoal: 'claudemirapborges@ig.com.br', emailGerais: 'gabinete@leme.sp.gov.br; corregedoria@gcmleme.sp.gov.br; cmtgcm@leme.sp.gov.br', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE LENÇOIS PAULISTA - SP', autoridade: 'ANDRÉ PACCOLA SASS', ato: '', emailPessoal: 'segurancapublica@lencoispaulista.sp.gov.br', emailGerais: '', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE LOUVEIRA - SP', autoridade: 'PAULO ALBERTO FINAMORE', ato: 'conforme Termo de Posse nº 2 da Câmara Municipal da Louveira/SP, de 01 de janeiro de 2025 (33365318)', emailPessoal: 'paulo.finamore@yahoo.com.br', emailGerais: 'gislaine.chiquetto@louveira.sp.gov.br', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE MOGI DAS CRUZES - SP', autoridade: 'RODRIGO FALSETTI', ato: 'nomeado conforme Ata da Sessão Solene no dia 01 de janeiro de 2025 (33361258).', emailPessoal: 'rodrigofalsetti@hotmail.com', emailGerais: 'diretoriagcmmg@mogiguacu.sp.gov.br; gabinete@mogidascruzes.sp.gov.br', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE MONTE ALTO - SP', autoridade: 'MARIA HELENA AGUIAR RETTONDINI', ato: 'nomeado conforme Ata da Sessão Solene da Câmara Municipal no dia 01 de janeiro de 2025 (33365403).', emailPessoal: 'luiz_nunes@yahoo.com', emailGerais: 'seguranca.publica@montealto.sp.gov.br', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE OLIMPIA - SP', autoridade: 'EUGENIO JOSÉ ZULIANI', ato: 'nomeado conforme Ata da Sessão Solene da Câmara Municipal de Olímpia/SP no dia 01 de janeiro de 2025 (33367107', emailPessoal: 'geninhozuliani@terra.com.br', emailGerais: 'gcm@olimpia.sp.gov.br', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE ORLÂNDIA- SP', autoridade: 'JORGE GABRIEL GRASI', ato: 'nomeado conforme Ata da Sessão Solene da Câmara Municipal de Orlândia/SP, no dia 01 de janeiro de 2025 (35179503)', emailPessoal: 'gabrielthor89@hotmail.com', emailGerais: 'carlos.mattiuzzo@orlandia.sp.gov.br; segurancapublica@orlandia.sp.gov.br andreza.miranda@orlandia.sp.gov.br', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE PAULÍNEA -SP', autoridade: 'DANILO HENRIQUE MACEDO DE BARROS', ato: 'nomeado conforme ato de posse no dia 01 de janeiro de 2025 (31655759).', emailPessoal: 'danilobarrosprefeito@gmail.com', emailGerais: 'seguranca@paulinia.sp.gov.br; gabinete@paulinia.sp.gov.br; sspcompras@paulinia.sp.gov.br;gm@paulinia.sp.gov.br; smsp@paulinia.sp.gov.br', telefone: 'Av. Prefeito José Lazano Araújo, 1551 - Parque Brasil - Cep 13141-901 - Paulínea /SP Tel: (19)38745600' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE PEDREIRA/SP', autoridade: 'FABIO VINICIUS POLIDORO', ato: 'Nomeado no dia 04 de abril de 2022 (33429481).', emailPessoal: 'fabioviniciuspolidoro@gmail.com', emailGerais: 'gm@pedreira.sp.gov.br', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE PIRAPORA DO BOM JESUS - SP', autoridade: 'GREGÓRIO RODRIGUES PONTES MAGLIO', ato: 'conforme termo de posse de Prefeito da Câmara Municipal de Pirapora do Bom Jesus, de 01 de janeiro de 2025 (36039514)', emailPessoal: 'gregoriomaglio2019@gmail.com', emailGerais: 'defesacivil@piraporadobomjesus.sp.gov.br', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE PITANGUEIRAS/SP', autoridade: 'DIMAS TADEU BOLZAN', ato: 'Nomeado no dia 01 de Janeiro de 2025 (30904400).', emailPessoal: 'dimasbolzan@yahoo.com.br', emailGerais: '', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE PORTO FERREIRA/SP', autoridade: 'ANDRÉ LUIZ ANCHÃO BRAGA', ato: 'Termo de Posse e Compromisso no dia 31 de dezembro de 2024 (33295758)', emailPessoal: '', emailGerais: 'ouvidoria@portoferreira.sp.gov.br; miguel.bragioni@portoferreira.sp.gov.br; gustavo.freitas@portoferreira.sp.gov.br; Jose.ruiz@portoferreira.sp.gov.br; lucas.lima@portoferreira.sp.gov.br', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE QUADRA -SP', autoridade: 'LHEONIDES DE OLIVEIRA ANDRADE', ato: 'nomeada conforme ato de posse no dia 01 de janeiro de 2025 (32432115).', emailPessoal: 'gabinete1@quadra.sp.gov.br', emailGerais: 'gabinete1@quadra.sp.gov.br administracao@quadra.sp.gov.br; protocolo@quadra.sp.gov.br', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE RIBEIRÃO PRETO - SP', autoridade: 'RICARDO AUGUSTO MACHADO DA SILVA', ato: 'nomeado conforme ato de posse no dia 01 de janeiro de 2025 (31501855).', emailPessoal: 'prefeitoricardosilva@ribeiraopreto.sp.gov.br', emailGerais: 'superintendencia@guarda.ribeiraopreto.sp.gov.br; ouvidoria@guarda.ribeiraopreto.sp.gov.br; rsluiz@guarda.ribeiraopreto.sp.gov.br', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE SANTA CRUZ DO RIO PARDO - SP', autoridade: 'OTACÍLIO PARRAS ASSIS', ato: 'nomeado conforme ato de posse no dia 01 de janeiro de 2025 (34535174)', emailPessoal: 'clinicamedicinadotransito@gmail.com', emailGerais: 'relacoesinstitucionais@santacruzdoriopardo.sp.gov.br; convenios@santacruzdoriopardo.sp.gov.br', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE SANTO ANDRÉ - SP', autoridade: 'GILVAN FERREIRA DE SOUZA JÚNIOR', ato: 'nomeado conforme Ata da Sessão Solene da Câmara Municipal de Londrina/PR no dia 01 de janeiro de 2025 (34322881)', emailPessoal: 'gfsouza@santoandre.sp.gov.br', emailGerais: 'sscidada@santoandre.sp.gov.br', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE SANTO ANTONIO DE POSSE - SP', autoridade: 'JOSÉ RICARDO CORTEZ,', ato: 'nomeado conforme Ata da Sessão Solene da Câmara Municipal de Santo Antônio de Posse/SP, no dia 01 de janeiro de 2025 (33360349)', emailPessoal: 'prefeitojrcortez@gmail.com', emailGerais: 'segurancapublica@pmsaposse.sp.gov.br', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE SÃO CAETANO DO SUL-SP', autoridade: 'ANACLETO CAMPANELLA JÚNIOR', ato: 'nomeado conforme Sessão Solene de Posse em 01 de janeiro de 2025 (33598785)', emailPessoal: 'anacleto.campanella@saocaetanodosul.sp.gov.br', emailGerais: 'rogerio.dourado@saocaetanodosul.sp.gov.br', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE SÃO JOAQUIM DA BARRA-SP', autoridade: 'WAGNER JOSÉ SCHIMIDT', ato: 'conforme ata da Sessão solene de Posse em 01 de janeiro de 2025 (34729602)', emailPessoal: '', emailGerais: 'chefedegabinete@saojoaquimdabarra.sp.gov.br; demutran@saojoaquimdabarra.sp.gov.br; convenios@saojoaquimdabarra.sp.gov.br', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE SÃO JOSÉ DOS CAMPOS - SP', autoridade: 'ANDERSON FARIAS FERREIRA', ato: 'Nomeado no dia 01 de janeiro de 2025 (30316058).', emailPessoal: 'andersonfariasferreira@gmail.com', emailGerais: '', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE SÃO JOSÉ DO RIO PRETO - SP', autoridade: 'FÁBIO ROGÉRIO CÂNDIDO', ato: 'nomeado conforme ato de posse no dia 01 de janeiro de 2025 (30440532)', emailPessoal: '', emailGerais: 'gabinete@riopreto.sp.gov.br', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE SÃO PAULO-SP', autoridade: 'RICARDO LUIS REIS NUNES', ato: 'nomeado conforme Certidão de Posse da Câmara Municipal de São Paulo - SP, de 01 de Janeiro de 2025 (31471462).', emailPessoal: 'ricardo.nunes@prefeitura.sp.gov.br', emailGerais: 'casacivil@prefeitura.sp.gov.br; casacivil.emendas@prefeitura.sp.gov.br; chgprefeito@prefeitura.sp.gov.br; carlosmachadosilva@prefeitura.sp.gov.br', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE TABOÃO DA SERRA - SP', autoridade: 'DANIEL PLANA BOGALHO', ato: 'nomeado conforme ato de posse no dia 01 de janeiro de 2025 (32561019).', emailPessoal: 'prefeito.daniel@ts.sp.gov.br', emailGerais: 'gabinete.prefeito@ts.sp.gov.br; gabinete.vice-prefeita@ts.sp.gov; smag@ts.sp.gov.br', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE TAPIRATIBA - SP', autoridade: 'RAMON JESUS VIEIRA', ato: 'nomeado conforme Ata da Sessão Solene da Câmara Municipal de Tapiratiba/SP no dia 01 de janeiro de 2025 (34670195)', emailPessoal: 'ramonvieira.pref@gmail.com', emailGerais: 'gcm@tapiratiba.sp.gov.br', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE TAUBATÉ - SP', autoridade: 'SÉRGIO LUIZ VICTOR JUNIOR', ato: 'Nomeado conforme Termo de posse da Câmara Municipal de Taubaté, no dia 01 de janeiro de 2025 (30315897).', emailPessoal: 'sergio.victor@taubate.sp.gov.br', emailGerais: 'cgp.gabinetetaubate@gmail.com; gcmwagneroliveira@gmail.com', telefone: '' },
  { uf: 'SP', orgao: 'MUNICÍPIO DE VOTORAMTIM - SP', autoridade: 'WEBER MAGANHATO JUNIOR', ato: 'nomeado conforme Ata da Sessão Solene da Câmara Municipal de Votoramtim no dia 01 de janeiro de 2025 (35302766)', emailPessoal: 'webermanga2024@gmail.com; (agendaprefeitoweber@gmail.com', emailGerais: 'cleber.abreu@votorantim.sp.gov.br; convenios.gcm@votorantim.sp.gov.br; dtt@votorantim.sp.gov.br; seg@votorantim.sp.gov.br', telefone: '' },
  { uf: 'SE', orgao: 'MUNICÍPIO DE ESTÂNCIA/SE', autoridade: 'ANDRÉ GRAÇA SANTOS', ato: 'Nomeado conforme Termo de Posse da Câmara Municipal de Estância/SE datado de 01/01/2025.', emailPessoal: '', emailGerais: 'gabinete@estancia.se.gov.br; guardamunicipal@estancia.se.gov.br', telefone: '' },
  { uf: 'SE', orgao: 'MUNICÍPIO DE TOBIAS BARRETO/SE', autoridade: 'ADILSON DE JESUS SANTOS', ato: 'Nomeado conforme Termo de Posse da Câmara Municipal de Tobias Barreto/SE datado de 01/01/2021.', emailPessoal: 'dilsondeagripino@hotmail.com', emailGerais: 'gabinetecivilpmtb@gmail.com', telefone: '' },
  { uf: 'SE', orgao: 'MUNICÍPIO DE NOSSA SENHORA DO SOCORRO/SE', autoridade: 'SAMUEL CARVALHO DOS SANTOS', ato: 'Nomeado conforme Termo de Posse da Câmara Municipal de Nossa Senhora do Socorro/SE datado de 01/01/2025.', emailPessoal: '', emailGerais: 'gabinete@socorro.se.gov.br; prefeito@socorro.se.gov.br', telefone: '' },
  { uf: 'SE', orgao: 'MUNICÍPIO DE CARMÓPOLIS - SE', autoridade: 'WELBER ANDRADE LEITE', ato: 'nomeado conforme Sessão Solene de Posse em 01 de janeiro de 2025 (30593343).', emailPessoal: 'welberleite@hotmail.com', emailGerais: 'planejamento@carmopolis.se.gov.br administracao@carmopolis.se.gov.br', telefone: '' },
  { uf: 'SE', orgao: 'MUNICÍPIO DE PRÓPRIA - SE', autoridade: 'JOSÉ LUCIANO NASCIMENTO LIMA', ato: 'nomeado conforme Sessão Solene de Posse em 01 de janeiro de 2025 (32325069)', emailPessoal: 'jluciano1708@gmail.com', emailGerais: 'gabinete@propria.se.gov.br guardamunicipal@propria.se.gov.brsmtt@propria.se.gov.br', telefone: '' },
  { uf: 'SE', orgao: 'MUNICÍPIO DE PORTO DA FOLHA/SE', autoridade: 'EVERTON LIMA GOIS', ato: 'Nomeado conforme Ata de Posse da Câmara Municipal de Porto da Folha/SE datado de 01/01/2025.', emailPessoal: 'evertonlimagoisgois@yahoo.com.br', emailGerais: 'gabinete.portodafolha@gmail.com; gabinete@portodafolha.se.gov.br; camarapfolh@gmail.com', telefone: '' },
  { uf: 'TO', orgao: 'MUNICÍPIO DE ARAGUAÍNA - TO', autoridade: 'WAGNER RODRIGUES BARROS', ato: 'Nomeado conforme ato de posse no dia 01 de janeiro de 2025 (31737156).', emailPessoal: 'wagner.rodrigues@araguaina.to.gov.br', emailGerais: 'dir-compras-astt@araguaina.to.gov.br', telefone: '' },
];

function importarContatosMunicipios() {
  var sheet = getOrCreateSheet_(SHEET_CONTATOS_MUNICIPIOS, CABECALHO_CONTATOS_MUNICIPIOS);
  var valores = sheet.getDataRange().getValues();

  var linhaPorChave = {};
  for (var i = 1; i < valores.length; i++) {
    var chave = valores[i][0] + '|' + normalizarNomeMunicipioParaMatch_(valores[i][1]);
    linhaPorChave[chave] = i + 1; // linha real na planilha
  }

  var atualizados = 0, novos = 0;
  var novasLinhas = [];
  CONTATOS_MUNICIPIOS_IMPORTAR_.forEach(function (c) {
    var linha = [c.uf, c.orgao, c.autoridade, c.ato, c.emailPessoal, c.emailGerais, c.telefone];
    var chave = c.uf + '|' + normalizarNomeMunicipioParaMatch_(c.orgao);
    if (linhaPorChave[chave]) {
      sheet.getRange(linhaPorChave[chave], 1, 1, CABECALHO_CONTATOS_MUNICIPIOS.length).setValues([linha]);
      atualizados++;
    } else {
      novasLinhas.push(linha);
      novos++;
    }
  });

  if (novasLinhas.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, novasLinhas.length, CABECALHO_CONTATOS_MUNICIPIOS.length).setValues(novasLinhas);
  }

  PropertiesService.getScriptProperties().setProperty('CONTATOS_MUNICIPIOS_REVISADO_EM', new Date().toISOString());
  registrarLog_('IMPORTAR_CONTATOS_MUNICIPIOS', '-', novos + ' novo(s), ' + atualizados + ' atualizado(s).');
  Logger.log('Contatos dos municípios: ' + novos + ' novo(s), ' + atualizados + ' atualizado(s).');
}

/**
 * Marca ATPVeEmitido e ATPVeEnviado como 'SIM' em massa para todos os
 * veículos de 2024 e 2025 que ainda estavam com algum dos dois em aberto —
 * SEM preencher DataEmissaoATPVe/DataEnvioATPVe (ficam como estavam, em
 * branco), pra essa marcação não entrar como emissão/envio no Relatório de
 * Produtividade (que soma por essas datas, não pelo clique).
 *
 * NUNCA mexe em veículo já marcado como Transferido — só lê o campo pra
 * decidir se pula a linha, nenhuma célula de um veículo transferido é
 * escrita. Também pula veículos na lixeira (Excluido = SIM) e os que já
 * estavam com os dois campos SIM (idempotente — pode rodar de novo sem
 * problema).
 *
 * Rode manualmente pelo editor (selecione
 * "marcarAtpveEmitidoEnviado2024e2025" no menu de funções, clique em
 * Executar) e confira o resumo em Ver > Registros de execução.
 */
function marcarAtpveEmitidoEnviado2024e2025() {
  var perfil = exigirPerfilAdmin_();
  var sheet = getOrCreateSheet_(SHEET_VEICULOS, CABECALHO_VEICULOS);
  garantirColunasVeiculos_();

  var valores = sheet.getDataRange().getValues();
  var cabecalho = valores[0];
  var idxAno = cabecalho.indexOf('Ano');
  var idxTransferido = cabecalho.indexOf('Transferido');
  var idxExcluido = cabecalho.indexOf('Excluido');
  var idxEmitido = cabecalho.indexOf('ATPVeEmitido');
  var idxEnviado = cabecalho.indexOf('ATPVeEnviado');
  var idxId = cabecalho.indexOf('ID');
  var idxUltimaAtualizacao = cabecalho.indexOf('UltimaAtualizacao');
  var idxAtualizadoPor = cabecalho.indexOf('AtualizadoPor');

  var agora = new Date();
  var idsAtualizados = [];
  var totalTransferidosIgnorados = 0;

  for (var i = 1; i < valores.length; i++) {
    var linha = valores[i];
    if (!linha[idxId]) continue;

    var ano = parseInt(linha[idxAno], 10);
    if (ano !== 2024 && ano !== 2025) continue;
    if (String(linha[idxExcluido]).toUpperCase() === 'SIM') continue;

    // NUNCA mexe em veículo já transferido — pedido explícito do usuário.
    if (String(linha[idxTransferido]).toUpperCase() === 'SIM') {
      totalTransferidosIgnorados++;
      continue;
    }

    var jaEmitido = String(linha[idxEmitido]).toUpperCase() === 'SIM';
    var jaEnviado = String(linha[idxEnviado]).toUpperCase() === 'SIM';
    if (jaEmitido && jaEnviado) continue; // já estava com os dois SIM, nada a fazer.

    var linhaAtualizada = linha.slice();
    linhaAtualizada[idxEmitido] = 'SIM';
    linhaAtualizada[idxEnviado] = 'SIM';
    linhaAtualizada[idxUltimaAtualizacao] = agora;
    linhaAtualizada[idxAtualizadoPor] = perfil.email + ' (marcação em massa ATPVe 2024/2025)';
    // Propositalmente NÃO mexe em DataEmissaoATPVe/DataEnvioATPVe.

    sheet.getRange(i + 1, 1, 1, cabecalho.length).setValues([linhaAtualizada]);
    idsAtualizados.push(linha[idxId]);
  }

  registrarLog_('MARCAR_ATPVE_EM_MASSA', '-',
    idsAtualizados.length + ' veículo(s) de 2024/2025 marcados como ATPVe emitido/enviado, sem data (' +
    totalTransferidosIgnorados + ' já transferido(s) foram ignorados/preservados). IDs: ' + idsAtualizados.join(', '));
  invalidarCacheDashboard_();

  Logger.log(idsAtualizados.length + ' veículo(s) atualizado(s): ' + idsAtualizados.join(', '));
  Logger.log(totalTransferidosIgnorados + ' veículo(s) já transferido(s) foram ignorados (não mexidos).');
  return { atualizados: idsAtualizados.length, transferidosIgnorados: totalTransferidosIgnorados };
}

/**
 * De-Para de unificação de nomenclatura de Donatária — só para Ente =
 * "Estado" (União/Município ficam de fora por enquanto, por pedido
 * explícito). Cada entrada foi revisada manualmente (comparando com a
 * lista oficial de CNPJ por UF, quando disponível) antes de entrar aqui —
 * NÃO foi gerada e aplicada automaticamente por similaridade de texto, que
 * erra em casos como confundir duas secretarias diferentes do mesmo
 * estado (ex.: Segurança Pública x Administração Penitenciária do DF,
 * removido desta lista de propósito).
 */
var UNIFICACAO_DONATARIA_ESTADO_ = [
  { uf: 'DF', de: 'Secretaria de Estado da Segurança Pública do Distrito Federal', para: 'Secretaria de Estado de Segurança Pública do Distrito Federal' },
  { uf: 'DF', de: 'Secretária de Segurança Pública do Distrito Federal', para: 'Secretaria de Estado de Segurança Pública do Distrito Federal' },
  { uf: 'DF', de: 'Secretaria de Estado de Segurança Pública do distrito Federal', para: 'Secretaria de Estado de Segurança Pública do Distrito Federal' },
  { uf: 'SP', de: 'Secretaria da Segurança Pública de São Paulo', para: 'Secretaria da Segurança Pública do Estado de São Paulo' },
  { uf: 'SP', de: 'Secretaria da Segurança Publica de São Paulo - SP', para: 'Secretaria da Segurança Pública do Estado de São Paulo' },
  { uf: 'SP', de: 'Secretária de Estado da Segurança Pública de São Paulo', para: 'Secretaria da Segurança Pública do Estado de São Paulo' },
  { uf: 'SP', de: 'Secretaria de Segurança Pública do Estado de São Paulo', para: 'Secretaria da Segurança Pública do Estado de São Paulo' },
  { uf: 'SP', de: 'Secretaria de Estado da Segurança Pública de São Paulo', para: 'Secretaria da Segurança Pública do Estado de São Paulo' },
  { uf: 'SP', de: 'Secretaria de Estado da Segurança Pública do Estado de São Paulo', para: 'Secretaria da Segurança Pública do Estado de São Paulo' },
  { uf: 'RO', de: 'Secretaria de Estado da Segurança​, Defesa e Cidadania do Estado de Rondônia', para: 'Secretaria de Estado da Segurança, Defesa e Cidadania de Rondônia' },
  { uf: 'RO', de: 'SECRETARIA DE ESTADO DA SEGURANÇA​, DEFESA E CIDADANIA DE RONDONIA', para: 'Secretaria de Estado da Segurança, Defesa e Cidadania de Rondônia' },
  { uf: 'AP', de: 'SECRETARIA DE ESTADO DA JUSTIÇA E SEGURANÇA PÚBLICA DO AMAPÁ', para: 'Secretaria de Estado da Justiça e Segurança Pública do Amapá' },
  { uf: 'AP', de: 'Secretaria de Estado de Segurança Pública do Amapá', para: 'Secretaria de Estado da Justiça e Segurança Pública do Amapá' },
  { uf: 'PB', de: 'Secretaria de Estado da Segurança Pública e Defesa Social da Paraíba', para: 'Secretaria de Estado da Segurança e da Defesa Social da Paraíba' },
  { uf: 'PB', de: 'Secretaria de Estado da Segurança Pública e da Defesa Social da Paraíba', para: 'Secretaria de Estado da Segurança e da Defesa Social da Paraíba' },
  { uf: 'PB', de: 'Secr. de Est. da Segurança e da Def. Soc. da Paraíba', para: 'Secretaria de Estado da Segurança e da Defesa Social da Paraíba' },
  { uf: 'TO', de: 'Polícia Militar do Estado do Tocantins', para: 'Polícia Militar' },
  { uf: 'TO', de: 'Polícia Militar do Estado do Tocantins​', para: 'Polícia Militar' },
  { uf: 'TO', de: 'Polícia Militar do Estado do Tocantins - TO', para: 'Polícia Militar' },
  { uf: 'TO', de: 'Policia Militar do Estado do Tocantins', para: 'Polícia Militar' },
  { uf: 'MS', de: 'Secretaria de Estado de Justiça e Segurança Pública de Mato Grosso do Sul', para: 'Secretaria de Estado de Justiça e Segurança Pública do Mato Grosso do Sul' },
  { uf: 'MS', de: 'Secretaria de Est. de Justiça e Segurança Pública do Mato Grosso do Sul', para: 'Secretaria de Estado de Justiça e Segurança Pública do Mato Grosso do Sul' },
  { uf: 'MS', de: 'Secretaria de Estado de Justiça e Segurança Pública', para: 'Secretaria de Estado de Justiça e Segurança Pública do Mato Grosso do Sul' },
  { uf: 'MS', de: 'Secretaria de Estado de Justiça e Segurança Pública - MS', para: 'Secretaria de Estado de Justiça e Segurança Pública do Mato Grosso do Sul' },
  { uf: 'MS', de: 'Secretaria Est. Just. e Segurança Pública do Mato Grosso do Sul', para: 'Secretaria de Estado de Justiça e Segurança Pública do Mato Grosso do Sul' },
  { uf: 'PE', de: 'Secretaria de Defesa Social de Pernambuco', para: 'Secretaria de Defesa Social do Estado de Pernambuco' },
  { uf: 'PE', de: 'SECRETARIA DE DEFESA SOCIAL DE PERNAMBUCO', para: 'Secretaria de Defesa Social do Estado de Pernambuco' },
  { uf: 'TO', de: 'Secretaria da Segurança Pública do Estado do Tocantins', para: 'Secretaria de Estado da Segurança Pública do Tocantins' },
  { uf: 'TO', de: 'Secretaria da Segurança Pública do Tocantins', para: 'Secretaria de Estado da Segurança Pública do Tocantins' },
  { uf: 'TO', de: 'Secretaria de Estado de Segurança Pública de Tocantins', para: 'Secretaria de Estado da Segurança Pública do Tocantins' },
  { uf: 'AC', de: 'Secretaria de Estado de Justiça e Segurança Pública do Acre', para: 'Secretaria de Estado da Justiça e Segurança Pública do Acre' },
  { uf: 'AC', de: 'Secretaria de Estado da Justiça e Segurança Publicado Acre', para: 'Secretaria de Estado da Justiça e Segurança Pública do Acre' },
  { uf: 'RR', de: 'Secretaria de Estado da Segurança Publica de Roraima', para: 'Secretaria de Estado da Segurança Pública de Roraima' },
  { uf: 'RR', de: 'Secretaria de Est. da Segurança Publica de Roraima', para: 'Secretaria de Estado da Segurança Pública de Roraima' },
  { uf: 'RR', de: 'Secretária de Segurança Pública de Roraima', para: 'Secretaria de Estado da Segurança Pública de Roraima' },
  { uf: 'MT', de: 'Secretaria de Estado de Segurança Pública do Mato Grosso', para: 'Secretaria de Estado de Segurança Pública de Mato Grosso' },
  { uf: 'MT', de: 'Secretaria de Estado de Segurança Pública - MT', para: 'Secretaria de Estado de Segurança Pública de Mato Grosso' },
  { uf: 'MT', de: 'Secretaria de Estado da Segurança Pública do Mato Grosso', para: 'Secretaria de Estado de Segurança Pública de Mato Grosso' },
  { uf: 'MT', de: 'Secretaria de Estado de Segurança Pública​​​ de Mato Grosso - MT', para: 'Secretaria de Estado de Segurança Pública de Mato Grosso' },
  { uf: 'SC', de: 'Secretaria de Est. da Seg. Pública de Santa Catarina', para: 'Secretaria de Estado da Segurança Pública de Santa Catarina' },
  { uf: 'SC', de: 'Secretaria de estado da Segurança Pública de Santa Catarina', para: 'Secretaria de Estado da Segurança Pública de Santa Catarina' },
  { uf: 'AM', de: 'Secretaria de Estado da Segurança Pública do Amazonas', para: 'Secretaria de Estado de Segurança Pública do Amazonas' },
  { uf: 'AM', de: 'Secretaria de Estado de Segurança Pública do Estado do Amazonas', para: 'Secretaria de Estado de Segurança Pública do Amazonas' },
  { uf: 'AM', de: 'Secretaria de Estado de Segurança Pública do Amazonas.', para: 'Secretaria de Estado de Segurança Pública do Amazonas' },
  { uf: 'RS', de: 'Secretaria da Segurança Pública do Estado do Rio Grande do Sul', para: 'Secretaria de Estado da Segurança Pública do Rio Grande do Sul' },
  { uf: 'RS', de: 'Secretaria da Segurança Pública do Rio Grande do Sul', para: 'Secretaria de Estado da Segurança Pública do Rio Grande do Sul' },
  { uf: 'RS', de: 'Secretaria de Est. da Seg. Públ. do Rio Grande do Sul', para: 'Secretaria de Estado da Segurança Pública do Rio Grande do Sul' },
  { uf: 'SE', de: 'Secretaria de Estado de Segurança Pública de Sergipe', para: 'Secretaria de Estado da Segurança Pública de Sergipe' },
  { uf: 'SE', de: 'Secretaria de Estado da Segurança Pública de Sergipe​', para: 'Secretaria de Estado da Segurança Pública de Sergipe' },
  { uf: 'SE', de: 'Secretaria de Estado da Segurança Pública do Estado de Sergipe', para: 'Secretaria de Estado da Segurança Pública de Sergipe' },
  { uf: 'SE', de: 'Secretaria de Est. da Segurança Pública de Sergipe', para: 'Secretaria de Estado da Segurança Pública de Sergipe' },
  { uf: 'RJ', de: 'Secretaria de Estado da Polícia Militar do Rio de Janeiro', para: 'Secretaria de Estado de Polícia Militar do Rio de Janeiro' },
  { uf: 'RJ', de: 'Secretaria de Estado de Polícia Militar do Rio de Janeiro - RJ', para: 'Secretaria de Estado de Polícia Militar do Rio de Janeiro' },
  { uf: 'RJ', de: 'Secretaria de Estado de Polícia Militar do Estado do Rio de Janeiro', para: 'Secretaria de Estado de Polícia Militar do Rio de Janeiro' },
  { uf: 'RJ', de: 'Secretaria de Estado da Polícia Militar - RJ', para: 'Secretaria de Estado de Polícia Militar do Rio de Janeiro' },
  { uf: 'RJ', de: 'Secretaria de Estado de Policia Militar do Rio de Janeiro', para: 'Secretaria de Estado de Polícia Militar do Rio de Janeiro' },
  { uf: 'RJ', de: 'SECRETARIA DE ESTADO DE POLICIA MILITAR do Rio de janeiro', para: 'Secretaria de Estado de Polícia Militar do Rio de Janeiro' },
  { uf: 'PA', de: 'Sec. Est. Seg. Públ. Def. Social do Est. do Pará', para: 'Secretaria de Estado de Segurança Pública e Defesa Social do Pará' },
  { uf: 'PA', de: 'Secretaria de Estado de Segurança Pública e Defesa Social da Pará', para: 'Secretaria de Estado de Segurança Pública e Defesa Social do Pará' },
  { uf: 'PR', de: 'Secretaria de Estado da Segurança Pública do Estado do Paraná', para: 'Secretaria de Estado da Segurança Pública do Paraná' },
  { uf: 'PR', de: 'Secretaria de Estado da Segurança Publica do Paraná', para: 'Secretaria de Estado da Segurança Pública do Paraná' },
  { uf: 'PR', de: 'Secretaria de Est. da Segurança Pública do Paraná', para: 'Secretaria de Estado da Segurança Pública do Paraná' },
  { uf: 'PR', de: 'Secretaria de Estado da Segurança Pública', para: 'Secretaria de Estado da Segurança Pública do Paraná' },
  { uf: 'PR', de: 'SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA DO PARANA', para: 'Secretaria de Estado da Segurança Pública do Paraná' },
  { uf: 'MA', de: 'Secretaria de Estado da Segurança Pública do Estado do Maranhão', para: 'Secretaria de Estado da Segurança Pública do Maranhão' },
  { uf: 'MA', de: 'Secretaria de Segurança Público do Maranhão', para: 'Secretaria de Estado da Segurança Pública do Maranhão' },
  { uf: 'MA', de: 'Secretaria de Estado de Segurança Pública do Maranhão', para: 'Secretaria de Estado da Segurança Pública do Maranhão' },
  { uf: 'MA', de: 'Segurança Pública do Maranhão', para: 'Secretaria de Estado da Segurança Pública do Maranhão' },
  { uf: 'PI', de: 'Secretaria de Estado da Segurança Pública do Piauí', para: 'Secretaria de Segurança Pública do Estado do Piauí' },
  { uf: 'PI', de: 'Secretaria de Segurança do Piauí', para: 'Secretaria de Segurança Pública do Estado do Piauí' },
  { uf: 'PI', de: 'Secretaria de Segurança - PI', para: 'Secretaria de Segurança Pública do Estado do Piauí' },
  { uf: 'PI', de: 'Secretaria de Segurança Pública do Piauí', para: 'Secretaria de Segurança Pública do Estado do Piauí' },
  { uf: 'PI', de: 'Secretaria de Estado de Segurança Pública do Piauí', para: 'Secretaria de Segurança Pública do Estado do Piauí' },
  { uf: 'RN', de: 'Secretaria de Estado da Segurança Publica e da Defesa Social do Rio Grande do Norte', para: 'Secretaria de Estado da Segurança Pública e da Defesa Social do Rio Grande do Norte' },
  { uf: 'RN', de: 'Secr. Est. Seg. Públ. Def. Soc. Rio Grande do Norte', para: 'Secretaria de Estado da Segurança Pública e da Defesa Social do Rio Grande do Norte' },
  { uf: 'RN', de: 'Secretária de Estado da Segurança e da Defesa Social do Rio Grande do Norte', para: 'Secretaria de Estado da Segurança Pública e da Defesa Social do Rio Grande do Norte' },
  { uf: 'RN', de: 'Secretária de Segurança Pública do Rio Grande do Norte', para: 'Secretaria de Estado da Segurança Pública e da Defesa Social do Rio Grande do Norte' },
  { uf: 'MG', de: 'Polícia Militar do Estado de Minas Gerais', para: 'Polícia Militar' },
  { uf: 'MG', de: 'Polícia Militar de Minas Gerais', para: 'Polícia Militar' },
  { uf: 'AL', de: 'Secretaria de Estado da Segurança Pública - AL', para: 'Secretaria de Estado da Segurança Pública de Alagoas' },
  { uf: 'AL', de: 'Secretaria de Estado da Segurança Pública do Estado de Alagoas', para: 'Secretaria de Estado da Segurança Pública de Alagoas' },
  { uf: 'CE', de: 'Secretaria da Segurança Pública e Defesa Social do Ceará', para: 'Secretaria da Segurança Pública e Defesa Social do Estado do Ceará' },
  { uf: 'CE', de: 'Secretaria da Segurança Pública e Def. Soc. do Estado do Ceará', para: 'Secretaria da Segurança Pública e Defesa Social do Estado do Ceará' },
  { uf: 'CE', de: 'Secretaria de Segurança Pública e Defesa Social do Ceará', para: 'Secretaria da Segurança Pública e Defesa Social do Estado do Ceará' },
  { uf: 'CE', de: 'Secr. da Segurança Pública e Defesa Social do Estado do Ceará', para: 'Secretaria da Segurança Pública e Defesa Social do Estado do Ceará' },
  { uf: 'ES', de: 'Sec. Est. Seg. Públ. Def. Social do Espírito Santo', para: 'Secretaria de Estado da Segurança Pública e Defesa Social do Espírito Santo' },
  { uf: 'ES', de: 'Secr. de Est. Seg. Públ. e Def. Soc. do Espírito Santo', para: 'Secretaria de Estado da Segurança Pública e Defesa Social do Espírito Santo' },
  { uf: 'ES', de: 'Secretaria da Segurança Pública e Defesa Social do Espírito Santo', para: 'Secretaria de Estado da Segurança Pública e Defesa Social do Espírito Santo' },
  { uf: 'ES', de: 'Secretaria de Estado da Segurança e Defesa Social Espírito Santo', para: 'Secretaria de Estado da Segurança Pública e Defesa Social do Espírito Santo' },
  { uf: 'ES', de: 'Secretaria de Estado de Estado da Segurança Pública e Defesa Social do Espírito Santo', para: 'Secretaria de Estado da Segurança Pública e Defesa Social do Espírito Santo' },
  { uf: 'GO', de: 'Secretaria de Estado da Segurança Pública Goiás', para: 'Secretaria de Estado da Segurança Pública de Goiás' },
  { uf: 'GO', de: 'Secretaria de Estado da Segurança Pública do Estado de Goiás', para: 'Secretaria de Estado da Segurança Pública de Goiás' },
  { uf: 'MG', de: 'Polícia Civil de Minas Gerais', para: 'Polícia Civil' },
  { uf: 'MG', de: 'Polícia Civil do Estado de Minas Gerais', para: 'Polícia Civil' },
  { uf: 'RJ', de: 'Secretaria de Estado de Polícia Civil do Rio de Janeiro', para: 'Polícia Civil' },
  { uf: 'RJ', de: 'Secretaria de Estado da Polícia Civil do Rio de Janeiro', para: 'Polícia Civil' },
  { uf: 'RJ', de: 'Secretaria de Est. de Polícia Civil do Rio de Janeiro', para: 'Polícia Civil' },
  { uf: 'RJ', de: 'SECRETARIA DE ESTADO DA POLÍCIA CIVIL - RJ (PCERJ)', para: 'Polícia Civil' },
  { uf: 'BA', de: 'Secretaria da Segurança Pública da Bahia', para: 'Secretaria da Segurança Pública do Estado da Bahia' },
  { uf: 'BA', de: 'Secretaria da Segurança Pública da Bahia - BA', para: 'Secretaria da Segurança Pública do Estado da Bahia' },
  { uf: 'BA', de: 'Secretaria da Segurança Pública​ da Bahia', para: 'Secretaria da Segurança Pública do Estado da Bahia' },
  { uf: 'BA', de: 'Secretaria de Segurança Pública da Bahia', para: 'Secretaria da Segurança Pública do Estado da Bahia' },
  { uf: 'RJ', de: 'Secretaria de Est. de Defesa Civil do Estado do Rio de Janeiro', para: 'Secretaria de Estado de Defesa Civil do Rio de Janeiro' },
  { uf: 'RJ', de: 'Secretaria de Estado de Defesa Civil do Estado do Rio de janeiro', para: 'Secretaria de Estado de Defesa Civil do Rio de Janeiro' },
  { uf: 'MG', de: 'Corpo de Bombeiros Militar de Minas Gerais', para: 'Corpo de Bombeiros' },
  { uf: 'MG', de: 'Corpo de Bombeiros Militar do Estado de Minas Gerais', para: 'Corpo de Bombeiros' },
  { uf: 'CE', de: 'Corpo de Bombeiros Militar do Estado do Ceará', para: 'Corpo de Bombeiros' },
  { uf: 'CE', de: 'Corpo de Bombeiros Militar do Ceará', para: 'Corpo de Bombeiros' },
  { uf: 'BA', de: 'Polícia Militar da Bahia', para: 'Polícia Militar' },
  { uf: 'BA', de: 'Polícia Militar do Estado da Bahia', para: 'Polícia Militar' },
  { uf: 'ES', de: 'Polícia Militar do Espírito Santo', para: 'Polícia Militar' },
  { uf: 'ES', de: 'Polícia Militar do Estado do Espírito Santo', para: 'Polícia Militar' },
  { uf: 'BA', de: 'Polícia Civil da Bahia', para: 'Polícia Civil' },
  { uf: 'BA', de: 'Polícia Civil do Estado da Bahia', para: 'Polícia Civil' },
  { uf: 'GO', de: 'Corpo de Bombeiros Militar do Estado do Goiás', para: 'Corpo de Bombeiros' },
  { uf: 'GO', de: 'Corpo de Bombeiros Militar do Estado de Goiás', para: 'Corpo de Bombeiros' },
  { uf: 'PI', de: 'Corpo de Bombeiros Militar do Estado do Piauí', para: 'Corpo de Bombeiros' },
  { uf: 'PI', de: 'Corpo de Bombeiros Militar do Piauí', para: 'Corpo de Bombeiros' },
  { uf: 'BA', de: 'Corpo de Bombeiros Militar da Bahia', para: 'Corpo de Bombeiros' },
  { uf: 'BA', de: 'Corpo de Bombeiros Militar do Estado da Bahia', para: 'Corpo de Bombeiros' }
];

/**
 * Aplica o De-Para acima em massa na aba Veiculos — só em registros com
 * Ente = "Estado" (Município e União ficam de fora por enquanto). Não
 * mexe em NumeroSei/Chassi/Placa/Transferido/ATPVe/nada além do texto da
 * Donatária. Idempotente: rodar de novo não faz nada nas linhas já
 * unificadas (o valor atual já não bate com nenhum "de" da lista).
 *
 * Rode manualmente pelo editor (selecione
 * "unificarNomenclaturaDonatariaEstado" no menu de funções, clique em
 * Executar) e confira o resumo em Ver > Registros de execução.
 */
function unificarNomenclaturaDonatariaEstado() {
  var perfil = exigirPerfilAdmin_();
  var sheet = getOrCreateSheet_(SHEET_VEICULOS, CABECALHO_VEICULOS);
  garantirColunasVeiculos_();

  var deParaPorChave = {};
  UNIFICACAO_DONATARIA_ESTADO_.forEach(function (m) {
    deParaPorChave[m.uf + '|' + m.de.trim()] = m.para;
  });

  var valores = sheet.getDataRange().getValues();
  var cabecalho = valores[0];
  var idxEnte = cabecalho.indexOf('Ente');
  var idxUF = cabecalho.indexOf('UF');
  var idxDonataria = cabecalho.indexOf('Donataria');
  var idxExcluido = cabecalho.indexOf('Excluido');
  var idxId = cabecalho.indexOf('ID');
  var idxUltimaAtualizacao = cabecalho.indexOf('UltimaAtualizacao');
  var idxAtualizadoPor = cabecalho.indexOf('AtualizadoPor');

  var agora = new Date();
  var idsAtualizados = [];
  var contagemPorUf = {};

  for (var i = 1; i < valores.length; i++) {
    var linha = valores[i];
    if (!linha[idxId]) continue;
    if (String(linha[idxExcluido]).toUpperCase() === 'SIM') continue;
    if (linha[idxEnte] !== 'Estado') continue;

    var chave = linha[idxUF] + '|' + String(linha[idxDonataria] || '').trim();
    var nomeCanonico = deParaPorChave[chave];
    if (!nomeCanonico || nomeCanonico === linha[idxDonataria]) continue;

    var linhaAtualizada = linha.slice();
    linhaAtualizada[idxDonataria] = nomeCanonico;
    linhaAtualizada[idxUltimaAtualizacao] = agora;
    linhaAtualizada[idxAtualizadoPor] = perfil.email + ' (unificação de nomenclatura Estado)';

    sheet.getRange(i + 1, 1, 1, cabecalho.length).setValues([linhaAtualizada]);
    idsAtualizados.push(linha[idxId]);
    contagemPorUf[linha[idxUF]] = (contagemPorUf[linha[idxUF]] || 0) + 1;
  }

  registrarLog_('UNIFICAR_DONATARIA_ESTADO', '-',
    idsAtualizados.length + ' veículo(s) com Donatária unificada (Ente=Estado). Por UF: ' + JSON.stringify(contagemPorUf));
  invalidarCacheDashboard_();

  Logger.log(idsAtualizados.length + ' veículo(s) atualizado(s).');
  Logger.log('Por UF: ' + JSON.stringify(contagemPorUf));
  return { atualizados: idsAtualizados.length, porUf: contagemPorUf };
}

var PREENCHER_NUMERO_PROCESSO_2026_ = [
  { id: 'VC-002977', numeroProcesso: '08020.007709/2025-76' },
  { id: 'VC-002978', numeroProcesso: '08020.007709/2025-76' },
  { id: 'VC-002979', numeroProcesso: '08020.007709/2025-76' },
  { id: 'VC-002980', numeroProcesso: '08020.007709/2025-76' },
  { id: 'VC-002981', numeroProcesso: '08020.007709/2025-76' },
  { id: 'VC-002982', numeroProcesso: '08020.007709/2025-76' },
  { id: 'VC-002983', numeroProcesso: '08020.007709/2025-76' },
  { id: 'VC-002984', numeroProcesso: '08020.007709/2025-76' },
  { id: 'VC-003011', numeroProcesso: '08020.007710/2025-09' },
  { id: 'VC-003012', numeroProcesso: '08020.007710/2025-09' },
  { id: 'VC-003013', numeroProcesso: '08020.007710/2025-09' },
  { id: 'VC-003014', numeroProcesso: '08020.007710/2025-09' },
  { id: 'VC-003015', numeroProcesso: '08020.000424/2026-95' },
  { id: 'VC-003016', numeroProcesso: '08020.000424/2026-95' },
  { id: 'VC-003039', numeroProcesso: '08020.009099/2025-45' },
  { id: 'VC-003040', numeroProcesso: '08020.009099/2025-45' },
  { id: 'VC-003041', numeroProcesso: '08020.009099/2025-45' },
  { id: 'VC-003046', numeroProcesso: '08020.011115/2025-60' },
  { id: 'VC-003047', numeroProcesso: '08020.000296/2026-80' },
  { id: 'VC-003051', numeroProcesso: '08020.011192/2025-10' },
  { id: 'VC-003055', numeroProcesso: '08020.011428/2025-18' },
  { id: 'VC-003059', numeroProcesso: '08020.011185/2025-18' },
  { id: 'VC-003064', numeroProcesso: '08020.011195/2025-53' },
  { id: 'VC-003065', numeroProcesso: '08020.011188/2025-51' },
  { id: 'VC-003066', numeroProcesso: '08020.000351/2026-31' },
  { id: 'VC-003067', numeroProcesso: '08020.000351/2026-31' },
  { id: 'VC-003071', numeroProcesso: '08020.011111/2025-81' },
  { id: 'VC-003072', numeroProcesso: '08020.006762/2025-50' },
  { id: 'VC-003073', numeroProcesso: '08020.006762/2025-50' },
  { id: 'VC-003074', numeroProcesso: '08020.006762/2025-50' },
  { id: 'VC-003075', numeroProcesso: '08020.006762/2025-50' },
  { id: 'VC-003076', numeroProcesso: '08020.006762/2025-50' },
  { id: 'VC-003077', numeroProcesso: '08020.009608/2025-30' },
  { id: 'VC-003078', numeroProcesso: '08020.011116/2025-12' },
  { id: 'VC-003079', numeroProcesso: '08020.011116/2025-12' },
  { id: 'VC-003080', numeroProcesso: '08020.011116/2025-12' },
  { id: 'VC-003081', numeroProcesso: '08020.009094/2025-12' },
  { id: 'VC-003082', numeroProcesso: '08020.006798/2025-33' },
  { id: 'VC-003083', numeroProcesso: '08020.009087/2025-11' },
  { id: 'VC-003086', numeroProcesso: '08020.001941/2025-09' },
  { id: 'VC-003087', numeroProcesso: '08020.001941/2025-09' },
  { id: 'VC-003088', numeroProcesso: '08020.001941/2025-09' },
  { id: 'VC-003089', numeroProcesso: '08020.001941/2025-09' },
  { id: 'VC-003090', numeroProcesso: '08020.001941/2025-09' },
  { id: 'VC-003091', numeroProcesso: '08020.001941/2025-09' },
  { id: 'VC-003092', numeroProcesso: '08020.009090/2025-34' },
  { id: 'VC-003093', numeroProcesso: '08020.009782/2025-82' },
  { id: 'VC-003094', numeroProcesso: '08020.009782/2025-82' },
  { id: 'VC-003095', numeroProcesso: '08020.009774/2025-36' },
  { id: 'VC-003096', numeroProcesso: '08020.009096/2025-10' },
  { id: 'VC-003097', numeroProcesso: '08020.009866/2025-16' },
  { id: 'VC-003098', numeroProcesso: '08020.000503/2026-04' },
  { id: 'VC-003099', numeroProcesso: '08020.006756/2025-01' },
  { id: 'VC-003100', numeroProcesso: '08020.000383/2026-37' },
  { id: 'VC-003101', numeroProcesso: '08020.000383/2026-37' },
  { id: 'VC-003102', numeroProcesso: '08020.000383/2026-37' },
  { id: 'VC-003103', numeroProcesso: '08020.000383/2026-37' },
  { id: 'VC-003104', numeroProcesso: '08020.000383/2026-37' },
  { id: 'VC-003105', numeroProcesso: '08020.000383/2026-37' },
  { id: 'VC-003106', numeroProcesso: '08020.000383/2026-37' },
  { id: 'VC-003107', numeroProcesso: '08020.000383/2026-37' },
  { id: 'VC-003108', numeroProcesso: '08020.000383/2026-37' },
  { id: 'VC-003109', numeroProcesso: '08020.000383/2026-37' },
  { id: 'VC-003110', numeroProcesso: '08020.000383/2026-37' },
  { id: 'VC-003111', numeroProcesso: '08020.000383/2026-37' },
  { id: 'VC-003112', numeroProcesso: '08020.000383/2026-37' },
  { id: 'VC-003113', numeroProcesso: '08020.000383/2026-37' },
  { id: 'VC-003114', numeroProcesso: '08020.000383/2026-37' },
  { id: 'VC-003115', numeroProcesso: '08020.000383/2026-37' },
  { id: 'VC-003116', numeroProcesso: '08020.000383/2026-37' },
  { id: 'VC-003117', numeroProcesso: '08020.000383/2026-37' },
  { id: 'VC-003118', numeroProcesso: '08020.000383/2026-37' },
  { id: 'VC-003119', numeroProcesso: '08020.000383/2026-37' },
  { id: 'VC-003120', numeroProcesso: '08020.000383/2026-37' },
  { id: 'VC-003121', numeroProcesso: '08020.000383/2026-37' },
  { id: 'VC-003122', numeroProcesso: '08020.000383/2026-37' },
  { id: 'VC-003123', numeroProcesso: '08020.000383/2026-37' },
  { id: 'VC-003124', numeroProcesso: '08020.000383/2026-37' },
  { id: 'VC-003125', numeroProcesso: '08020.000383/2026-37' },
  { id: 'VC-003126', numeroProcesso: '08020.000383/2026-37' },
  { id: 'VC-003127', numeroProcesso: '08020.000383/2026-37' },
  { id: 'VC-003128', numeroProcesso: '08020.000383/2026-37' },
  { id: 'VC-003129', numeroProcesso: '08020.000383/2026-37' },
  { id: 'VC-003130', numeroProcesso: '08020.000383/2026-37' },
  { id: 'VC-003131', numeroProcesso: '08020.000383/2026-37' },
  { id: 'VC-003132', numeroProcesso: '08020.000383/2026-37' },
  { id: 'VC-003133', numeroProcesso: '08020.000383/2026-37' },
  { id: 'VC-003134', numeroProcesso: '08020.000383/2026-37' },
  { id: 'VC-003135', numeroProcesso: '08020.000383/2026-37' },
  { id: 'VC-003136', numeroProcesso: '08020.009098/2025-09' },
  { id: 'VC-003137', numeroProcesso: '08020.009916/2025-65' },
  { id: 'VC-003138', numeroProcesso: '08020.009093/2025-78' },
  { id: 'VC-003139', numeroProcesso: '08020.009093/2025-78' },
  { id: 'VC-003140', numeroProcesso: '08020.000403/2026-70' },
  { id: 'VC-003141', numeroProcesso: '08020.009914/2025-76' },
  { id: 'VC-003142', numeroProcesso: '08020.009913/2025-21' },
  { id: 'VC-003143', numeroProcesso: '08020.009086/2025-76' },
  { id: 'VC-003144', numeroProcesso: '08020.009912/2025-87' },
  { id: 'VC-003145', numeroProcesso: '08020.009911/2025-32' },
  { id: 'VC-003149', numeroProcesso: '08020.008522/2025-90' },
  { id: 'VC-003150', numeroProcesso: '08020.008522/2025-90' },
  { id: 'VC-003151', numeroProcesso: '08020.003624/2026-08' },
  { id: 'VC-003152', numeroProcesso: '08020.003925/2026-23' },
  { id: 'VC-003153', numeroProcesso: '08020.003925/2026-23' },
  { id: 'VC-003154', numeroProcesso: '08020.004691/2026-31' },
  { id: 'VC-003155', numeroProcesso: '08020.004685/2026-84' },
  { id: 'VC-003156', numeroProcesso: '08020.005261/2026-37' },
  { id: 'VC-003157', numeroProcesso: '08020.003935/2026-69' },
  { id: 'VC-003158', numeroProcesso: '08020.009904/2025-31' },
  { id: 'VC-003159', numeroProcesso: '08020.005333/2026-46' },
  { id: 'VC-003160', numeroProcesso: '08020.009795/2025-51' },
  { id: 'VC-003161', numeroProcesso: '08020.009901/2025-05' },
  { id: 'VC-003162', numeroProcesso: '08020.007855/2025-00' },
  { id: 'VC-003163', numeroProcesso: '08020.009917/2025-18' },
  { id: 'VC-003164', numeroProcesso: '08020.007733/2025-13' },
  { id: 'VC-003165', numeroProcesso: '08020.007733/2025-13' },
  { id: 'VC-003166', numeroProcesso: '08020.011446/2025-08' },
  { id: 'VC-003167', numeroProcesso: '08020.011446/2025-08' },
  { id: 'VC-003168', numeroProcesso: '08020.011446/2025-08' },
  { id: 'VC-003169', numeroProcesso: '08020.011446/2025-08' },
  { id: 'VC-003170', numeroProcesso: '08020.011446/2025-08' },
  { id: 'VC-003171', numeroProcesso: '08020.011446/2025-08' },
  { id: 'VC-003172', numeroProcesso: '08020.011446/2025-08' },
  { id: 'VC-003173', numeroProcesso: '08020.011446/2025-08' },
  { id: 'VC-003174', numeroProcesso: '08020.011446/2025-08' },
  { id: 'VC-003175', numeroProcesso: '08020.011446/2025-08' },
  { id: 'VC-003176', numeroProcesso: '08020.011446/2025-08' },
  { id: 'VC-003177', numeroProcesso: '08020.011446/2025-08' },
  { id: 'VC-003178', numeroProcesso: '08020.011446/2025-08' },
  { id: 'VC-003179', numeroProcesso: '08020.011446/2025-08' },
  { id: 'VC-003180', numeroProcesso: '08020.009091/2025-89' },
  { id: 'VC-003181', numeroProcesso: '08020.009091/2025-89' },
  { id: 'VC-003182', numeroProcesso: '08020.009867/2025-61' },
  { id: 'VC-003183', numeroProcesso: '08020.009412/2025-45' },
  { id: 'VC-003184', numeroProcesso: '08020.009412/2025-45' },
  { id: 'VC-003185', numeroProcesso: '08020.009412/2025-45' },
  { id: 'VC-003186', numeroProcesso: '08020.007850/2025-79' },
  { id: 'VC-003187', numeroProcesso: '08020.011449/2025-33' },
  { id: 'VC-003188', numeroProcesso: '08020.011449/2025-33' },
  { id: 'VC-003189', numeroProcesso: '08020.011449/2025-33' },
  { id: 'VC-003190', numeroProcesso: '08020.011449/2025-33' },
  { id: 'VC-003191', numeroProcesso: '08020.011449/2025-33' },
  { id: 'VC-003192', numeroProcesso: '08020.011449/2025-33' },
  { id: 'VC-003193', numeroProcesso: '08020.011449/2025-33' },
  { id: 'VC-003194', numeroProcesso: '08020.011449/2025-33' },
  { id: 'VC-003195', numeroProcesso: '08020.011449/2025-33' },
  { id: 'VC-003196', numeroProcesso: '08020.011449/2025-33' },
  { id: 'VC-003197', numeroProcesso: '08020.011449/2025-33' },
  { id: 'VC-003198', numeroProcesso: '08020.011449/2025-33' },
  { id: 'VC-003199', numeroProcesso: '08020.011449/2025-33' },
  { id: 'VC-003200', numeroProcesso: '08020.011449/2025-33' },
  { id: 'VC-003201', numeroProcesso: '08020.003930/2026-36' },
  { id: 'VC-003202', numeroProcesso: '08020.003930/2026-36' },
  { id: 'VC-003203', numeroProcesso: '08020.009809/2025-37' },
  { id: 'VC-003204', numeroProcesso: '08020.009809/2025-37' },
  { id: 'VC-003205', numeroProcesso: '08020.009809/2025-37' },
  { id: 'VC-003206', numeroProcesso: '08020.009809/2025-37' },
  { id: 'VC-003207', numeroProcesso: '08020.009809/2025-37' },
  { id: 'VC-003208', numeroProcesso: '08020.009809/2025-37' },
  { id: 'VC-003209', numeroProcesso: '08020.009809/2025-37' },
  { id: 'VC-003210', numeroProcesso: '08020.009809/2025-37' },
  { id: 'VC-003211', numeroProcesso: '08020.009809/2025-37' },
  { id: 'VC-003212', numeroProcesso: '08020.009809/2025-37' },
  { id: 'VC-003213', numeroProcesso: '08020.009809/2025-37' },
  { id: 'VC-003214', numeroProcesso: '08020.009809/2025-37' },
  { id: 'VC-003215', numeroProcesso: '08020.009809/2025-37' },
  { id: 'VC-003216', numeroProcesso: '08020.009809/2025-37' },
  { id: 'VC-003217', numeroProcesso: '08020.009809/2025-37' },
  { id: 'VC-003218', numeroProcesso: '08020.009809/2025-37' },
  { id: 'VC-003219', numeroProcesso: '08020.006759/2025-36' },
  { id: 'VC-003220', numeroProcesso: '08020.006759/2025-36' },
  { id: 'VC-003221', numeroProcesso: '08020.006759/2025-36' },
  { id: 'VC-003222', numeroProcesso: '08020.006759/2025-36' },
  { id: 'VC-003223', numeroProcesso: '08020.006759/2025-36' },
  { id: 'VC-003224', numeroProcesso: '08020.006759/2025-36' },
  { id: 'VC-003225', numeroProcesso: '08020.006759/2025-36' },
  { id: 'VC-003226', numeroProcesso: '08020.006759/2025-36' },
  { id: 'VC-003227', numeroProcesso: '08020.006759/2025-36' },
  { id: 'VC-003228', numeroProcesso: '08020.006759/2025-36' },
  { id: 'VC-003229', numeroProcesso: '08020.006759/2025-36' },
  { id: 'VC-003230', numeroProcesso: '08020.006759/2025-36' },
  { id: 'VC-003231', numeroProcesso: '08020.006759/2025-36' },
  { id: 'VC-003232', numeroProcesso: '08020.006759/2025-36' },
  { id: 'VC-003233', numeroProcesso: '08020.000113/2026-26' },
  { id: 'VC-003234', numeroProcesso: '08020.000111/2026-37' },
  { id: 'VC-003235', numeroProcesso: '08020.000111/2026-37' },
  { id: 'VC-003236', numeroProcesso: '08020.006708/2025-12' },
  { id: 'VC-003237', numeroProcesso: '08020.009900/2025-52' },
  { id: 'VC-003238', numeroProcesso: '08020.011450/2025-68' },
  { id: 'VC-003239', numeroProcesso: '08020.011450/2025-68' },
  { id: 'VC-003240', numeroProcesso: '08020.011450/2025-68' },
  { id: 'VC-003241', numeroProcesso: '08020.011450/2025-68' },
  { id: 'VC-003242', numeroProcesso: '08020.011450/2025-68' },
  { id: 'VC-003243', numeroProcesso: '08020.011450/2025-68' },
  { id: 'VC-003244', numeroProcesso: '08020.011450/2025-68' },
  { id: 'VC-003245', numeroProcesso: '08020.011450/2025-68' },
  { id: 'VC-003246', numeroProcesso: '08020.011450/2025-68' },
  { id: 'VC-003247', numeroProcesso: '08020.011450/2025-68' },
  { id: 'VC-003248', numeroProcesso: '08020.011450/2025-68' },
  { id: 'VC-003249', numeroProcesso: '08020.011450/2025-68' },
  { id: 'VC-003250', numeroProcesso: '08020.011450/2025-68' },
  { id: 'VC-003251', numeroProcesso: '08020.011450/2025-68' },
  { id: 'VC-003252', numeroProcesso: '08020.009411/2025-09' },
  { id: 'VC-003253', numeroProcesso: '08020.006702/2025-37' },
  { id: 'VC-003254', numeroProcesso: '08020.006702/2025-37' },
  { id: 'VC-003255', numeroProcesso: '08020.006702/2025-37' },
  { id: 'VC-003256', numeroProcesso: '08020.006702/2025-37' },
  { id: 'VC-003257', numeroProcesso: '08020.006702/2025-37' },
  { id: 'VC-003258', numeroProcesso: '08020.006702/2025-37' },
  { id: 'VC-003259', numeroProcesso: '08020.000109/2026-68' },
  { id: 'VC-003260', numeroProcesso: '08020.009413/2025-90' },
  { id: 'VC-003261', numeroProcesso: '08020.009413/2025-90' },
  { id: 'VC-003262', numeroProcesso: '08020.005334/2026-91' },
  { id: 'VC-003264', numeroProcesso: '08020.011451/2025-11' },
  { id: 'VC-003265', numeroProcesso: '08020.011451/2025-11' },
  { id: 'VC-003266', numeroProcesso: '08020.011451/2025-11' },
  { id: 'VC-003267', numeroProcesso: '08020.011451/2025-11' },
  { id: 'VC-003268', numeroProcesso: '08020.011451/2025-11' },
  { id: 'VC-003269', numeroProcesso: '08020.011451/2025-11' },
  { id: 'VC-003270', numeroProcesso: '08020.011451/2025-11' },
  { id: 'VC-003271', numeroProcesso: '08020.011451/2025-11' },
  { id: 'VC-003272', numeroProcesso: '08020.011451/2025-11' },
  { id: 'VC-003273', numeroProcesso: '08020.011451/2025-11' },
  { id: 'VC-003274', numeroProcesso: '08020.011451/2025-11' },
  { id: 'VC-003275', numeroProcesso: '08020.011451/2025-11' },
  { id: 'VC-003276', numeroProcesso: '08020.011451/2025-11' },
  { id: 'VC-003277', numeroProcesso: '08020.011451/2025-11' },
  { id: 'VC-003278', numeroProcesso: '08020.011451/2025-11' },
  { id: 'VC-003279', numeroProcesso: '08020.011365/2025-08' },
  { id: 'VC-003280', numeroProcesso: '08020.009406/2025-98' },
  { id: 'VC-003281', numeroProcesso: '08020.009906/2025-20' },
  { id: 'VC-003282', numeroProcesso: '08000.047035/2025-81' },
  { id: 'VC-003283', numeroProcesso: '08000.047035/2025-81' },
  { id: 'VC-003284', numeroProcesso: '08000.047035/2025-81' },
  { id: 'VC-003285', numeroProcesso: '08020.007731/2025-16' },
  { id: 'VC-003286', numeroProcesso: '08020.007731/2025-16' },
  { id: 'VC-003287', numeroProcesso: '08020.007731/2025-16' },
  { id: 'VC-003288', numeroProcesso: '08020.007731/2025-16' },
  { id: 'VC-003289', numeroProcesso: '08020.007731/2025-16' },
  { id: 'VC-003290', numeroProcesso: '08020.007731/2025-16' },
  { id: 'VC-003291', numeroProcesso: '08020.009909/2025-63' },
  { id: 'VC-003292', numeroProcesso: '08020.007856/2025-46' },
  { id: 'VC-003293', numeroProcesso: '08020.009823/2025-31' },
  { id: 'VC-003294', numeroProcesso: '08020.011362/2025-66' },
  { id: 'VC-003295', numeroProcesso: '08020.011362/2025-66' },
  { id: 'VC-003296', numeroProcesso: '08020.011362/2025-66' },
  { id: 'VC-003297', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003298', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003299', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003300', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003301', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003302', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003303', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003304', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003305', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003306', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003307', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003308', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003309', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003310', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003311', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003312', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003313', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003314', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003315', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003316', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003317', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003318', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003319', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003320', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003321', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003322', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003323', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003324', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003325', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003326', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003327', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003328', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003329', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003330', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003331', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003332', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003333', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003334', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003335', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003336', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003337', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003338', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003339', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003340', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003341', numeroProcesso: '08020.011859/2025-84' },
  { id: 'VC-003342', numeroProcesso: '08000.047738/2025-17' },
  { id: 'VC-003343', numeroProcesso: '08000.047738/2025-17' },
  { id: 'VC-003344', numeroProcesso: '08020.004835/2026-50' },
  { id: 'VC-003345', numeroProcesso: '08020.004835/2026-50' },
  { id: 'VC-003347', numeroProcesso: '08020.009405/2025-43' },
  { id: 'VC-003348', numeroProcesso: '08020.009405/2025-43' },
  { id: 'VC-003349', numeroProcesso: '08020.009405/2025-43' },
  { id: 'VC-003350', numeroProcesso: '08020.009405/2025-43' },
  { id: 'VC-003351', numeroProcesso: '08020.009405/2025-43' },
  { id: 'VC-003352', numeroProcesso: '08020.004857/2026-10' },
  { id: 'VC-003353', numeroProcesso: '08020.004857/2026-10' },
  { id: 'VC-003354', numeroProcesso: '08020.001928/2026-22' },
  { id: 'VC-003355', numeroProcesso: '08020.001928/2026-22' },
  { id: 'VC-003356', numeroProcesso: '08020.004848/2026-29' },
  { id: 'VC-003357', numeroProcesso: '08020.004584/2026-11' },
  { id: 'VC-003358', numeroProcesso: '08020.004584/2026-11' },
  { id: 'VC-003359', numeroProcesso: '08020.004584/2026-11' },
  { id: 'VC-003360', numeroProcesso: '08020.004584/2026-11' },
  { id: 'VC-003361', numeroProcesso: '08020.004584/2026-11' },
  { id: 'VC-003362', numeroProcesso: '08020.004584/2026-11' },
  { id: 'VC-003363', numeroProcesso: '08020.004584/2026-11' },
  { id: 'VC-003364', numeroProcesso: '08020.004584/2026-11' },
  { id: 'VC-003365', numeroProcesso: '08020.004584/2026-11' },
  { id: 'VC-003366', numeroProcesso: '08020.004584/2026-11' },
  { id: 'VC-003367', numeroProcesso: '08020.004584/2026-11' },
  { id: 'VC-003368', numeroProcesso: '08020.004584/2026-11' },
  { id: 'VC-003369', numeroProcesso: '08020.001816/2026-71' },
  { id: 'VC-003370', numeroProcesso: '08020.001816/2026-71' },
  { id: 'VC-003371', numeroProcesso: '08020.001816/2026-71' },
  { id: 'VC-003372', numeroProcesso: '08020.001816/2026-71' },
  { id: 'VC-003373', numeroProcesso: '08020.001816/2026-71' },
  { id: 'VC-003374', numeroProcesso: '08020.001816/2026-71' },
  { id: 'VC-003375', numeroProcesso: '08020.001816/2026-71' },
  { id: 'VC-003376', numeroProcesso: '08020.001816/2026-71' },
  { id: 'VC-003377', numeroProcesso: '08020.001816/2026-71' },
  { id: 'VC-003378', numeroProcesso: '08020.001816/2026-71' },
  { id: 'VC-003379', numeroProcesso: '08020.001816/2026-71' },
  { id: 'VC-003380', numeroProcesso: '08020.001816/2026-71' },
  { id: 'VC-003381', numeroProcesso: '08020.001816/2026-71' },
  { id: 'VC-003382', numeroProcesso: '08020.001816/2026-71' },
  { id: 'VC-003383', numeroProcesso: '08020.001816/2026-71' },
  { id: 'VC-003384', numeroProcesso: '08020.001816/2026-71' },
  { id: 'VC-003385', numeroProcesso: '08020.001816/2026-71' },
  { id: 'VC-003386', numeroProcesso: '08020.001816/2026-71' },
  { id: 'VC-003387', numeroProcesso: '08020.001816/2026-71' },
  { id: 'VC-003388', numeroProcesso: '08020.001816/2026-71' },
  { id: 'VC-003389', numeroProcesso: '08020.001816/2026-71' },
  { id: 'VC-003390', numeroProcesso: '08020.001816/2026-71' },
  { id: 'VC-003391', numeroProcesso: '08020.001816/2026-71' },
  { id: 'VC-003392', numeroProcesso: '08020.001816/2026-71' },
  { id: 'VC-003393', numeroProcesso: '08020.001816/2026-71' },
  { id: 'VC-003394', numeroProcesso: '08020.007834/2025-86' },
  { id: 'VC-003395', numeroProcesso: '08020.012903/2025-73' },
  { id: 'VC-003396', numeroProcesso: '08020.012903/2025-73' },
  { id: 'VC-003397', numeroProcesso: '08020.012903/2025-73' },
  { id: 'VC-003398', numeroProcesso: '08020.004854/2026-86' },
  { id: 'VC-003399', numeroProcesso: '08020.009812/2025-51' },
  { id: 'VC-003400', numeroProcesso: '08020.009483/2026-29' },
  { id: 'VC-003401', numeroProcesso: '08020.009483/2026-29' },
  { id: 'VC-003402', numeroProcesso: '08020.009483/2026-29' },
  { id: 'VC-003403', numeroProcesso: '08020.009483/2026-29' },
  { id: 'VC-003404', numeroProcesso: '08020.009483/2026-29' },
  { id: 'VC-003405', numeroProcesso: '08020.009483/2026-29' },
  { id: 'VC-003406', numeroProcesso: '08020.009483/2026-29' },
  { id: 'VC-003407', numeroProcesso: '08020.009483/2026-29' },
  { id: 'VC-003408', numeroProcesso: '08020.009483/2026-29' },
  { id: 'VC-003409', numeroProcesso: '08020.009483/2026-29' },
  { id: 'VC-003410', numeroProcesso: '08020.009483/2026-29' },
  { id: 'VC-003411', numeroProcesso: '08020.009483/2026-29' },
  { id: 'VC-003412', numeroProcesso: '08020.009483/2026-29' },
  { id: 'VC-003413', numeroProcesso: '08020.009483/2026-29' },
  { id: 'VC-003414', numeroProcesso: '08020.009483/2026-29' },
  { id: 'VC-003415', numeroProcesso: '08020.009483/2026-29' },
  { id: 'VC-003416', numeroProcesso: '08020.009483/2026-29' },
  { id: 'VC-003417', numeroProcesso: '08020.009483/2026-29' },
  { id: 'VC-003418', numeroProcesso: '08020.009483/2026-29' },
  { id: 'VC-003419', numeroProcesso: '08020.009483/2026-29' },
  { id: 'VC-003420', numeroProcesso: '08020.009483/2026-29' },
  { id: 'VC-003421', numeroProcesso: '08020.009483/2026-29' },
  { id: 'VC-003422', numeroProcesso: '08020.009483/2026-29' },
  { id: 'VC-003423', numeroProcesso: '08020.009483/2026-29' },
  { id: 'VC-003424', numeroProcesso: '08020.009483/2026-29' },
  { id: 'VC-003425', numeroProcesso: '08020.009483/2026-29' },
  { id: 'VC-003426', numeroProcesso: '08020.009483/2026-29' },
  { id: 'VC-003427', numeroProcesso: '08020.011459/2025-79' },
  { id: 'VC-003428', numeroProcesso: '08020.011459/2025-79' },
  { id: 'VC-003429', numeroProcesso: '08020.011459/2025-79' },
  { id: 'VC-003430', numeroProcesso: '08020.011459/2025-79' },
  { id: 'VC-003431', numeroProcesso: '08020.011459/2025-79' },
  { id: 'VC-003432', numeroProcesso: '08020.011459/2025-79' },
  { id: 'VC-003433', numeroProcesso: '08020.011459/2025-79' },
  { id: 'VC-003434', numeroProcesso: '08020.011459/2025-79' },
  { id: 'VC-003435', numeroProcesso: '08020.000782/2026-06' },
  { id: 'VC-003436', numeroProcesso: '08020.009915/2025-11' },
  { id: 'VC-003437', numeroProcesso: '08020.008230/2026-38' },
  { id: 'VC-003438', numeroProcesso: '08020.008230/2026-38' },
  { id: 'VC-003439', numeroProcesso: '08020.009947/2026-05' },
  { id: 'VC-003440', numeroProcesso: '08020.009947/2026-05' },
  { id: 'VC-003441', numeroProcesso: '08020.009947/2026-05' },
  { id: 'VC-003442', numeroProcesso: '08020.009947/2026-05' },
  { id: 'VC-003443', numeroProcesso: '08020.009947/2026-05' },
  { id: 'VC-003444', numeroProcesso: '08020.009947/2026-05' },
  { id: 'VC-003445', numeroProcesso: '08020.009947/2026-05' },
  { id: 'VC-003446', numeroProcesso: '08020.009947/2026-05' },
  { id: 'VC-003447', numeroProcesso: '08000.044823/2025-15' },
  { id: 'VC-003448', numeroProcesso: '08000.044823/2025-15' },
  { id: 'VC-003449', numeroProcesso: '08000.044823/2025-15' },
  { id: 'VC-002992', numeroProcesso: '08020.006803/2025-16' },
  { id: 'VC-002993', numeroProcesso: '08020.006803/2025-16' },
  { id: 'VC-002994', numeroProcesso: '08020.006803/2025-16' },
  { id: 'VC-002995', numeroProcesso: '08020.006803/2025-16' },
  { id: 'VC-002996', numeroProcesso: '08020.006803/2025-16' },
  { id: 'VC-002997', numeroProcesso: '08020.006803/2025-16' },
  { id: 'VC-002998', numeroProcesso: '08020.006803/2025-16' },
  { id: 'VC-002999', numeroProcesso: '08020.006484/2025-31' },
  { id: 'VC-003000', numeroProcesso: '08020.006484/2025-31' },
  { id: 'VC-003001', numeroProcesso: '08020.006484/2025-31' },
  { id: 'VC-003002', numeroProcesso: '08020.006484/2025-31' },
  { id: 'VC-003003', numeroProcesso: '08020.006484/2025-31' },
  { id: 'VC-003004', numeroProcesso: '08020.006484/2025-31' },
  { id: 'VC-003005', numeroProcesso: '08020.006484/2025-31' },
  { id: 'VC-003006', numeroProcesso: '08020.006484/2025-31' },
  { id: 'VC-003007', numeroProcesso: '08020.006484/2025-31' },
  { id: 'VC-003008', numeroProcesso: '08020.006484/2025-31' },
  { id: 'VC-003026', numeroProcesso: '08020.008552/2025-04' },
  { id: 'VC-003027', numeroProcesso: '08020.004276/2025-05' },
  { id: 'VC-003028', numeroProcesso: '08020.004276/2025-05' },
  { id: 'VC-003029', numeroProcesso: '08020.007914/2025-31' },
  { id: 'VC-003030', numeroProcesso: '08020.007914/2025-31' },
  { id: 'VC-003031', numeroProcesso: '08020.007914/2025-31' },
  { id: 'VC-003032', numeroProcesso: '08020.007914/2025-31' },
  { id: 'VC-003033', numeroProcesso: '08020.007914/2025-31' },
  { id: 'VC-003034', numeroProcesso: '08020.007914/2025-31' },
  { id: 'VC-003035', numeroProcesso: '08020.007216/2025-36' },
  { id: 'VC-003036', numeroProcesso: '08020.007930/2025-24' },
  { id: 'VC-003037', numeroProcesso: '08020.007930/2025-24' },
  { id: 'VC-003038', numeroProcesso: '08020.007930/2025-24' },
  { id: 'VC-003042', numeroProcesso: '08020.001942/2025-45' },
  { id: 'VC-003043', numeroProcesso: '08020.001942/2025-45' },
  { id: 'VC-003044', numeroProcesso: '08020.001942/2025-45' },
  { id: 'VC-003045', numeroProcesso: '08020.006435/2025-06' },
  { id: 'VC-003048', numeroProcesso: '08020.007882/2025-74' },
  { id: 'VC-003049', numeroProcesso: '08020.004388/2025-58' },
  { id: 'VC-003050', numeroProcesso: '08020.005629/2025-86' },
  { id: 'VC-003052', numeroProcesso: '08020.008468/2025-82' },
  { id: 'VC-003053', numeroProcesso: '08020.008468/2025-82' },
  { id: 'VC-003056', numeroProcesso: '08020.004378/2025-12' },
  { id: 'VC-003057', numeroProcesso: '08020.004378/2025-12' },
  { id: 'VC-003058', numeroProcesso: '08020.007143/2025-82' },
  { id: 'VC-003060', numeroProcesso: '08020.007874/2025-28' },
  { id: 'VC-003061', numeroProcesso: '08020.007874/2025-28' },
  { id: 'VC-003062', numeroProcesso: '08020.007874/2025-28' },
  { id: 'VC-003063', numeroProcesso: '08020.007874/2025-28' },
  { id: 'VC-003084', numeroProcesso: '08020.005650/2025-81' },
  { id: 'VC-003085', numeroProcesso: '08020.006783/2025-75' },
  { id: 'VC-003146', numeroProcesso: '08020.004311/2025-88' },
  { id: 'VC-003147', numeroProcesso: '08020.004311/2025-88' },
  { id: 'VC-003148', numeroProcesso: '08020.004311/2025-88' },
  { id: 'VC-003263', numeroProcesso: '08020.010085/2024-93' },
];

/**
 * Preenche o Número do Processo dos veículos de 2026 que ainda estavam sem
 * esse dado, cruzando o Termo de Doação de cada um contra duas planilhas
 * de referência (Processo x Termo x SEI) fornecidas pelo usuário — uma só
 * com termos numerados em 2026, outra cobrindo também termos de anos
 * anteriores (2016 a 2025) que só foram processados agora. 120 processos
 * encontrados, cobrindo 450 veículos; os que não bateram com nenhuma das
 * duas planilhas continuam sem Número de Processo.
 *
 * Só grava em veículos que ainda estão com NumeroProcesso vazio — nunca
 * sobrescreve um valor já preenchido. Não mexe em mais nenhum campo
 * (Chassi, Placa, NumeroSei, Transferido etc.) — o NumeroSei já cadastrado
 * em cada veículo é do Termo de Doação, diferente do SEI que aparecia nas
 * planilhas de referência (esse é de outro documento), por isso não é
 * tocado aqui.
 *
 * Rode manualmente pelo editor (selecione "preencherNumeroProcesso2026" no
 * menu de funções, clique em Executar) — é seguro rodar mais de uma vez.
 */
function preencherNumeroProcesso2026() {
  var perfil = exigirPerfilAdmin_();
  var sheet = getOrCreateSheet_(SHEET_VEICULOS, CABECALHO_VEICULOS);
  garantirColunasVeiculos_();

  var valores = sheet.getDataRange().getValues();
  var cabecalho = valores[0];
  var idxId = cabecalho.indexOf('ID');
  var idxNumeroProcesso = cabecalho.indexOf('NumeroProcesso');
  var idxUltimaAtualizacao = cabecalho.indexOf('UltimaAtualizacao');
  var idxAtualizadoPor = cabecalho.indexOf('AtualizadoPor');

  var linhaPorId = {};
  for (var i = 1; i < valores.length; i++) {
    var id = valores[i][idxId];
    if (id) linhaPorId[id] = i;
  }

  var agora = new Date();
  var atualizados = [];
  var jaTinhamProcesso = [];
  var idsNaoEncontrados = [];

  PREENCHER_NUMERO_PROCESSO_2026_.forEach(function (item) {
    var i = linhaPorId[item.id];
    if (i === undefined) { idsNaoEncontrados.push(item.id); return; }
    if (valores[i][idxNumeroProcesso]) { jaTinhamProcesso.push(item.id); return; }
    valores[i][idxNumeroProcesso] = item.numeroProcesso;
    valores[i][idxUltimaAtualizacao] = agora;
    valores[i][idxAtualizadoPor] = perfil.email + ' (preenchimento em massa de Número do Processo)';
    atualizados.push({ id: item.id, linha: i + 1 });
  });

  atualizados.forEach(function (a) {
    sheet.getRange(a.linha, 1, 1, cabecalho.length).setValues([valores[a.linha - 1]]);
  });

  registrarLog_('PREENCHER_NUMERO_PROCESSO', '-',
    atualizados.length + ' veículo(s) tiveram o Número do Processo preenchido. ' +
    jaTinhamProcesso.length + ' já tinham (ignorados). ' + idsNaoEncontrados.length + ' ID(s) não encontrado(s) na base.');
  invalidarCacheDashboard_();

  Logger.log(atualizados.length + ' veículo(s) atualizado(s): ' + atualizados.map(function (a) { return a.id; }).join(', '));
  if (jaTinhamProcesso.length) Logger.log(jaTinhamProcesso.length + ' já tinham processo (ignorados): ' + jaTinhamProcesso.join(', '));
  if (idsNaoEncontrados.length) Logger.log(idsNaoEncontrados.length + ' ID(s) não encontrado(s) na base: ' + idsNaoEncontrados.join(', '));

  return { atualizados: atualizados.length, jaTinham: jaTinhamProcesso.length, naoEncontrados: idsNaoEncontrados.length };
}

var PREENCHER_NUMERO_PROCESSO_2026_LOTE2_ = [
  { id: 'VC-002932', numeroProcesso: '08020.004253/2025-92' },
  { id: 'VC-002933', numeroProcesso: '08020.004253/2025-92' },
  { id: 'VC-002934', numeroProcesso: '08020.004181/2025-83' },
  { id: 'VC-002935', numeroProcesso: '08020.006636/2025-03' },
  { id: 'VC-002936', numeroProcesso: '08020.006625/2025-15' },
  { id: 'VC-002937', numeroProcesso: '08020.009407/2024-51' },
  { id: 'VC-002938', numeroProcesso: '08020.007921/2025-33' },
  { id: 'VC-002939', numeroProcesso: '08020.007935/2025-57' },
  { id: 'VC-002940', numeroProcesso: '08020.007935/2025-57' },
  { id: 'VC-002941', numeroProcesso: '08020.007935/2025-57' },
  { id: 'VC-002942', numeroProcesso: '08020.007935/2025-57' },
  { id: 'VC-002943', numeroProcesso: '08020.007861/2025-59' },
  { id: 'VC-002944', numeroProcesso: '08020.007861/2025-59' },
  { id: 'VC-002945', numeroProcesso: '08020.007861/2025-59' },
  { id: 'VC-002946', numeroProcesso: '08020.007861/2025-59' },
  { id: 'VC-002947', numeroProcesso: '08020.007861/2025-59' },
  { id: 'VC-002948', numeroProcesso: '08020.007861/2025-59' },
  { id: 'VC-002949', numeroProcesso: '08020.009100/2025-31' },
  { id: 'VC-002950', numeroProcesso: '08020.009100/2025-31' },
  { id: 'VC-002951', numeroProcesso: '08020.009100/2025-31' },
  { id: 'VC-002952', numeroProcesso: '08020.009100/2025-31' },
  { id: 'VC-002953', numeroProcesso: '08020.006814/2025-98' },
  { id: 'VC-002954', numeroProcesso: '08020.006814/2025-98' },
  { id: 'VC-002955', numeroProcesso: '08020.006814/2025-98' },
  { id: 'VC-002956', numeroProcesso: '08020.006814/2025-98' },
  { id: 'VC-002957', numeroProcesso: '08020.004137/2025-73' },
  { id: 'VC-002958', numeroProcesso: '08020.004137/2025-73' },
  { id: 'VC-002959', numeroProcesso: '08020.004137/2025-73' },
  { id: 'VC-002960', numeroProcesso: '08020.004137/2025-73' },
  { id: 'VC-002961', numeroProcesso: '08020.004137/2025-73' },
  { id: 'VC-002962', numeroProcesso: '08020.004137/2025-73' },
  { id: 'VC-002963', numeroProcesso: '08020.004137/2025-73' },
  { id: 'VC-002964', numeroProcesso: '08020.004137/2025-73' },
  { id: 'VC-002965', numeroProcesso: '08020.004137/2025-73' },
  { id: 'VC-002966', numeroProcesso: '08020.004137/2025-73' },
  { id: 'VC-002967', numeroProcesso: '08020.004137/2025-73' },
  { id: 'VC-002968', numeroProcesso: '08020.004137/2025-73' },
  { id: 'VC-002969', numeroProcesso: '08020.004137/2025-73' },
  { id: 'VC-002970', numeroProcesso: '08020.004137/2025-73' },
  { id: 'VC-002971', numeroProcesso: '08020.004137/2025-73' },
  { id: 'VC-002972', numeroProcesso: '08020.004137/2025-73' },
  { id: 'VC-002973', numeroProcesso: '08020.004137/2025-73' },
  { id: 'VC-002974', numeroProcesso: '08020.004137/2025-73' },
  { id: 'VC-002975', numeroProcesso: '08020.004137/2025-73' },
  { id: 'VC-002976', numeroProcesso: '08020.004137/2025-73' },
  { id: 'VC-002985', numeroProcesso: '08020.006713/2025-17' },
  { id: 'VC-002986', numeroProcesso: '08020.006713/2025-17' },
  { id: 'VC-002987', numeroProcesso: '08020.006713/2025-17' },
  { id: 'VC-002988', numeroProcesso: '08020.006713/2025-17' },
  { id: 'VC-002989', numeroProcesso: '08020.008621/2025-71' },
  { id: 'VC-002990', numeroProcesso: '08020.006624/2025-71' },
  { id: 'VC-002991', numeroProcesso: '08020.008527/2025-12' },
  { id: 'VC-003009', numeroProcesso: '08020.006826/2025-12' },
  { id: 'VC-003010', numeroProcesso: '08020.006826/2025-12' },
  { id: 'VC-003017', numeroProcesso: '08020.001907/2025-26' },
  { id: 'VC-003018', numeroProcesso: '08020.001907/2025-26' },
  { id: 'VC-003019', numeroProcesso: '08020.007858/2025-35' },
  { id: 'VC-003020', numeroProcesso: '08020.006771/2025-41' },
  { id: 'VC-003021', numeroProcesso: '08020.010788/2025-01' },
  { id: 'VC-003022', numeroProcesso: '08020.006789/2025-42' },
  { id: 'VC-003023', numeroProcesso: '08020.006789/2025-42' },
  { id: 'VC-003024', numeroProcesso: '08020.006717/2025-03' },
  { id: 'VC-003025', numeroProcesso: '08020.005653/2025-15' },
  { id: 'VC-003346', numeroProcesso: '08020.008530/2025-36' },
];

/**
 * Segundo lote do preenchimento de Número do Processo (2026) — os 24
 * processos (64 veículos) que não bateram nas duas primeiras planilhas de
 * referência, agora cruzados contra uma terceira planilha (935 termos,
 * todos numerados em 2025). Fechou 100% dos que faltavam.
 *
 * Mesmas regras do lote 1 (ver preencherNumeroProcesso2026): só grava
 * onde NumeroProcesso está vazio, não mexe em NumeroSei nem em outro
 * campo. Rode manualmente pelo editor (selecione
 * "preencherNumeroProcesso2026Lote2" no menu de funções, clique em
 * Executar) — seguro rodar mais de uma vez.
 */
var PREENCHER_NUMERO_PROCESSO_2025_ = [
  { id: 'VC-001810', numeroProcesso: '08020.008167/2024-78' },
  { id: 'VC-001811', numeroProcesso: '08020.000135/2025-13' },
  { id: 'VC-001849', numeroProcesso: '08020.005854/2024-31' },
  { id: 'VC-001850', numeroProcesso: '08020.005854/2024-31' },
  { id: 'VC-001854', numeroProcesso: '08020.007931/2024-98' },
  { id: 'VC-001855', numeroProcesso: '08020.007931/2024-98' },
  { id: 'VC-001857', numeroProcesso: '08020.009077/2024-02' },
  { id: 'VC-001858', numeroProcesso: '08020.009077/2024-02' },
  { id: 'VC-001859', numeroProcesso: '08020.009077/2024-02' },
  { id: 'VC-001860', numeroProcesso: '08020.009752/2024-95' },
  { id: 'VC-001862', numeroProcesso: '08020.000384/2025-09' },
  { id: 'VC-001864', numeroProcesso: '08020.003383/2024-27' },
  { id: 'VC-001865', numeroProcesso: '08020.003383/2024-27' },
  { id: 'VC-001868', numeroProcesso: '08020.007916/2024-40' },
  { id: 'VC-001869', numeroProcesso: '08020.005912/2024-27' },
  { id: 'VC-001870', numeroProcesso: '08020.005912/2024-27' },
  { id: 'VC-001871', numeroProcesso: '08020.002296/2025-33' },
  { id: 'VC-001872', numeroProcesso: '08020.002296/2025-33' },
  { id: 'VC-001873', numeroProcesso: '08020.002296/2025-33' },
  { id: 'VC-001874', numeroProcesso: '08020.002296/2025-33' },
  { id: 'VC-001875', numeroProcesso: '08020.002296/2025-33' },
  { id: 'VC-001876', numeroProcesso: '08020.002296/2025-33' },
  { id: 'VC-001877', numeroProcesso: '08020.002296/2025-33' },
  { id: 'VC-001878', numeroProcesso: '08020.002296/2025-33' },
  { id: 'VC-001879', numeroProcesso: '08020.002296/2025-33' },
  { id: 'VC-001880', numeroProcesso: '08020.002296/2025-33' },
  { id: 'VC-001881', numeroProcesso: '08020.002296/2025-33' },
  { id: 'VC-001882', numeroProcesso: '08020.002296/2025-33' },
  { id: 'VC-001883', numeroProcesso: '08020.002296/2025-33' },
  { id: 'VC-001884', numeroProcesso: '08020.002296/2025-33' },
  { id: 'VC-001885', numeroProcesso: '08020.002296/2025-33' },
  { id: 'VC-001886', numeroProcesso: '08020.002296/2025-33' },
  { id: 'VC-001887', numeroProcesso: '08020.002296/2025-33' },
  { id: 'VC-001888', numeroProcesso: '08020.002296/2025-33' },
  { id: 'VC-001889', numeroProcesso: '08020.002296/2025-33' },
  { id: 'VC-001890', numeroProcesso: '08020.002296/2025-33' },
  { id: 'VC-001891', numeroProcesso: '08020.002296/2025-33' },
  { id: 'VC-001892', numeroProcesso: '08020.002296/2025-33' },
  { id: 'VC-001893', numeroProcesso: '08020.002296/2025-33' },
  { id: 'VC-001894', numeroProcesso: '08020.002296/2025-33' },
  { id: 'VC-001895', numeroProcesso: '08020.002296/2025-33' },
  { id: 'VC-001896', numeroProcesso: '08020.002296/2025-33' },
  { id: 'VC-001897', numeroProcesso: '08020.002296/2025-33' },
  { id: 'VC-001898', numeroProcesso: '08020.002296/2025-33' },
  { id: 'VC-001899', numeroProcesso: '08020.002296/2025-33' },
  { id: 'VC-001900', numeroProcesso: '08020.002296/2025-33' },
  { id: 'VC-001902', numeroProcesso: '08020.002270/2025-95' },
  { id: 'VC-001903', numeroProcesso: '08020.002270/2025-95' },
  { id: 'VC-001904', numeroProcesso: '08020.002270/2025-95' },
  { id: 'VC-001905', numeroProcesso: '08020.002270/2025-95' },
  { id: 'VC-001906', numeroProcesso: '08020.002266/2025-27' },
  { id: 'VC-001907', numeroProcesso: '08020.002266/2025-27' },
  { id: 'VC-001908', numeroProcesso: '08020.003442/2024-67' },
  { id: 'VC-001909', numeroProcesso: '08020.003442/2024-67' },
  { id: 'VC-001910', numeroProcesso: '08020.003442/2024-67' },
  { id: 'VC-001911', numeroProcesso: '08020.003442/2024-67' },
  { id: 'VC-001912', numeroProcesso: '08020.003442/2024-67' },
  { id: 'VC-001914', numeroProcesso: '08020.002102/2025-08' },
  { id: 'VC-001915', numeroProcesso: '08020.002102/2025-08' },
  { id: 'VC-001916', numeroProcesso: '08020.002102/2025-08' },
  { id: 'VC-001917', numeroProcesso: '08020.002102/2025-08' },
  { id: 'VC-001918', numeroProcesso: '08020.002102/2025-08' },
  { id: 'VC-001919', numeroProcesso: '08020.002102/2025-08' },
  { id: 'VC-001920', numeroProcesso: '08020.002102/2025-08' },
  { id: 'VC-001921', numeroProcesso: '08020.002102/2025-08' },
  { id: 'VC-001922', numeroProcesso: '08020.002102/2025-08' },
  { id: 'VC-001923', numeroProcesso: '08020.002102/2025-08' },
  { id: 'VC-001924', numeroProcesso: '08020.002102/2025-08' },
  { id: 'VC-001925', numeroProcesso: '08020.002102/2025-08' },
  { id: 'VC-001926', numeroProcesso: '08020.005518/2024-99' },
  { id: 'VC-001927', numeroProcesso: '08020.005518/2024-99' },
  { id: 'VC-001928', numeroProcesso: '08020.002271/2025-30' },
  { id: 'VC-001929', numeroProcesso: '08020.002271/2025-30' },
  { id: 'VC-001930', numeroProcesso: '08020.002269/2025-61' },
  { id: 'VC-001931', numeroProcesso: '08020.002269/2025-61' },
  { id: 'VC-001932', numeroProcesso: '08020.002269/2025-61' },
  { id: 'VC-001933', numeroProcesso: '08020.002269/2025-61' },
  { id: 'VC-001934', numeroProcesso: '08020.002269/2025-61' },
  { id: 'VC-001935', numeroProcesso: '08020.002269/2025-61' },
  { id: 'VC-001936', numeroProcesso: '08020.002269/2025-61' },
  { id: 'VC-001937', numeroProcesso: '08020.002269/2025-61' },
  { id: 'VC-001938', numeroProcesso: '08020.002269/2025-61' },
  { id: 'VC-001939', numeroProcesso: '08020.002269/2025-61' },
  { id: 'VC-001940', numeroProcesso: '08020.002269/2025-61' },
  { id: 'VC-001941', numeroProcesso: '08020.002269/2025-61' },
  { id: 'VC-001942', numeroProcesso: '08020.002269/2025-61' },
  { id: 'VC-001943', numeroProcesso: '08020.002269/2025-61' },
  { id: 'VC-001944', numeroProcesso: '08020.002269/2025-61' },
  { id: 'VC-001945', numeroProcesso: '08020.002269/2025-61' },
  { id: 'VC-001946', numeroProcesso: '08020.002269/2025-61' },
  { id: 'VC-001947', numeroProcesso: '08020.002268/2025-16' },
  { id: 'VC-001948', numeroProcesso: '08020.002268/2025-16' },
  { id: 'VC-001949', numeroProcesso: '08020.002268/2025-16' },
  { id: 'VC-001950', numeroProcesso: '08020.002268/2025-16' },
  { id: 'VC-001951', numeroProcesso: '08020.002268/2025-16' },
  { id: 'VC-001952', numeroProcesso: '08020.002268/2025-16' },
  { id: 'VC-001953', numeroProcesso: '08020.002268/2025-16' },
  { id: 'VC-001954', numeroProcesso: '08020.002268/2025-16' },
  { id: 'VC-001955', numeroProcesso: '08020.002268/2025-16' },
  { id: 'VC-001956', numeroProcesso: '08020.002268/2025-16' },
  { id: 'VC-001957', numeroProcesso: '08020.002268/2025-16' },
  { id: 'VC-001958', numeroProcesso: '08020.002268/2025-16' },
  { id: 'VC-001959', numeroProcesso: '08020.002268/2025-16' },
  { id: 'VC-001960', numeroProcesso: '08020.002268/2025-16' },
  { id: 'VC-001961', numeroProcesso: '08020.002268/2025-16' },
  { id: 'VC-001962', numeroProcesso: '08020.002268/2025-16' },
  { id: 'VC-001963', numeroProcesso: '08020.002268/2025-16' },
  { id: 'VC-001964', numeroProcesso: '08020.002268/2025-16' },
  { id: 'VC-001965', numeroProcesso: '08020.002268/2025-16' },
  { id: 'VC-001966', numeroProcesso: '08020.002268/2025-16' },
  { id: 'VC-001967', numeroProcesso: '08020.007773/2024-76' },
  { id: 'VC-001969', numeroProcesso: '08020.002353/2024-01' },
  { id: 'VC-001970', numeroProcesso: '08020.002353/2024-01' },
  { id: 'VC-001971', numeroProcesso: '08020.000133/2025-16' },
  { id: 'VC-001972', numeroProcesso: '08020.002275/2025-18' },
  { id: 'VC-001973', numeroProcesso: '08000.009184/2024-61' },
  { id: 'VC-001974', numeroProcesso: '08000.009184/2024-61' },
  { id: 'VC-001977', numeroProcesso: '08020.002273/2025-29' },
  { id: 'VC-001978', numeroProcesso: '08020.002273/2025-29' },
  { id: 'VC-001979', numeroProcesso: '08020.007482/2024-88' },
  { id: 'VC-001980', numeroProcesso: '08020.007482/2024-88' },
  { id: 'VC-001981', numeroProcesso: '08000.033292/2024-54' },
  { id: 'VC-001982', numeroProcesso: '08000.033292/2024-54' },
  { id: 'VC-001983', numeroProcesso: '08000.033275/2024-17' },
  { id: 'VC-001984', numeroProcesso: '08000.032965/2024-59' },
  { id: 'VC-001985', numeroProcesso: '08000.032965/2024-59' },
  { id: 'VC-001986', numeroProcesso: '08020.003548/2025-41' },
  { id: 'VC-001987', numeroProcesso: '08020.003548/2025-41' },
  { id: 'VC-001988', numeroProcesso: '08020.009810/2024-81' },
  { id: 'VC-001989', numeroProcesso: '08020.002715/2025-37' },
  { id: 'VC-001997', numeroProcesso: '08020.007341/2024-65' },
  { id: 'VC-001998', numeroProcesso: '08020.002244/2025-67' },
  { id: 'VC-001999', numeroProcesso: '08020.002244/2025-67' },
  { id: 'VC-002000', numeroProcesso: '08020.003342/2025-11' },
  { id: 'VC-002001', numeroProcesso: '08020.003342/2025-11' },
  { id: 'VC-002002', numeroProcesso: '08020.007326/2024-17' },
  { id: 'VC-002003', numeroProcesso: '08020.007326/2024-17' },
  { id: 'VC-002004', numeroProcesso: '08020.007346/2024-98' },
  { id: 'VC-002005', numeroProcesso: '08020.007542/2024-62' },
  { id: 'VC-002006', numeroProcesso: '08020.007319/2024-15' },
  { id: 'VC-002007', numeroProcesso: '08020.007324/2024-28' },
  { id: 'VC-002008', numeroProcesso: '08020.002357/2024-81' },
  { id: 'VC-002009', numeroProcesso: '08020.002357/2024-81' },
  { id: 'VC-002010', numeroProcesso: '08020.002357/2024-81' },
  { id: 'VC-002011', numeroProcesso: '08020.002357/2024-81' },
  { id: 'VC-002012', numeroProcesso: '08020.003107/2025-40' },
  { id: 'VC-002013', numeroProcesso: '08020.003107/2025-40' },
  { id: 'VC-002014', numeroProcesso: '08020.003107/2025-40' },
  { id: 'VC-002015', numeroProcesso: '08020.003107/2025-40' },
  { id: 'VC-002016', numeroProcesso: '08020.003107/2025-40' },
  { id: 'VC-002017', numeroProcesso: '08020.003107/2025-40' },
  { id: 'VC-002018', numeroProcesso: '08020.003107/2025-40' },
  { id: 'VC-002019', numeroProcesso: '08020.003405/2025-30' },
  { id: 'VC-002020', numeroProcesso: '08020.003405/2025-30' },
  { id: 'VC-002021', numeroProcesso: '08020.007340/2024-11' },
  { id: 'VC-002022', numeroProcesso: '08020.002274/2025-73' },
  { id: 'VC-002023', numeroProcesso: '08020.003371/2025-83' },
  { id: 'VC-002024', numeroProcesso: '08020.007435/2024-34' },
  { id: 'VC-002025', numeroProcesso: '08020.007435/2024-34' },
  { id: 'VC-002026', numeroProcesso: '08020.007786/2024-45' },
  { id: 'VC-002027', numeroProcesso: '08020.004544/2025-81' },
  { id: 'VC-002028', numeroProcesso: '08020.004544/2025-81' },
  { id: 'VC-002029', numeroProcesso: '08020.004544/2025-81' },
  { id: 'VC-002030', numeroProcesso: '08020.004544/2025-81' },
  { id: 'VC-002031', numeroProcesso: '08020.004544/2025-81' },
  { id: 'VC-002032', numeroProcesso: '08020.004544/2025-81' },
  { id: 'VC-002033', numeroProcesso: '08000.026269/2024-11' },
  { id: 'VC-002034', numeroProcesso: '08000.049592/2024-55' },
  { id: 'VC-002035', numeroProcesso: '08000.049592/2024-55' },
  { id: 'VC-002036', numeroProcesso: '08020.005023/2025-41' },
  { id: 'VC-002037', numeroProcesso: '08020.005023/2025-41' },
  { id: 'VC-002038', numeroProcesso: '08020.005023/2025-41' },
  { id: 'VC-002039', numeroProcesso: '08020.004852/2025-14' },
  { id: 'VC-002040', numeroProcesso: '08020.004852/2025-14' },
  { id: 'VC-002041', numeroProcesso: '08020.004852/2025-14' },
  { id: 'VC-002042', numeroProcesso: '08020.004852/2025-14' },
  { id: 'VC-002043', numeroProcesso: '08020.004852/2025-14' },
  { id: 'VC-002044', numeroProcesso: '08020.004852/2025-14' },
  { id: 'VC-002045', numeroProcesso: '08020.004852/2025-14' },
  { id: 'VC-002046', numeroProcesso: '08020.004852/2025-14' },
  { id: 'VC-002047', numeroProcesso: '08020.004852/2025-14' },
  { id: 'VC-002048', numeroProcesso: '08020.004852/2025-14' },
  { id: 'VC-002049', numeroProcesso: '08020.004852/2025-14' },
  { id: 'VC-002050', numeroProcesso: '08020.004852/2025-14' },
  { id: 'VC-002051', numeroProcesso: '08020.004854/2025-03' },
  { id: 'VC-002052', numeroProcesso: '08020.003783/2024-32' },
  { id: 'VC-002053', numeroProcesso: '08020.003783/2024-32' },
  { id: 'VC-002054', numeroProcesso: '08020.003899/2024-71' },
  { id: 'VC-002055', numeroProcesso: '08020.003899/2024-71' },
  { id: 'VC-002056', numeroProcesso: '08020.003887/2024-47' },
  { id: 'VC-002057', numeroProcesso: '08020.007344/2024-07' },
  { id: 'VC-002058', numeroProcesso: '08020.007344/2024-07' },
  { id: 'VC-002059', numeroProcesso: '08020.007344/2024-07' },
  { id: 'VC-002060', numeroProcesso: '08020.007849/2024-63' },
  { id: 'VC-002061', numeroProcesso: '08020.007849/2024-63' },
  { id: 'VC-002062', numeroProcesso: '08020.007319/2024-15' },
  { id: 'VC-002063', numeroProcesso: '08020.007319/2024-15' },
  { id: 'VC-002064', numeroProcesso: '08020.007319/2024-15' },
  { id: 'VC-002065', numeroProcesso: '08020.007319/2024-15' },
  { id: 'VC-002066', numeroProcesso: '08020.007327/2024-61' },
  { id: 'VC-002067', numeroProcesso: '08020.007327/2024-61' },
  { id: 'VC-002068', numeroProcesso: '08020.007731/2024-35' },
  { id: 'VC-002070', numeroProcesso: '08020.007407/2024-17' },
  { id: 'VC-002071', numeroProcesso: '08020.007407/2024-17' },
  { id: 'VC-002072', numeroProcesso: '08020.007407/2024-17' },
  { id: 'VC-002073', numeroProcesso: '08020.007407/2024-17' },
  { id: 'VC-002074', numeroProcesso: '08020.005025/2025-30' },
  { id: 'VC-002075', numeroProcesso: '08020.007716/2024-97' },
  { id: 'VC-002076', numeroProcesso: '08020.007716/2024-97' },
  { id: 'VC-002077', numeroProcesso: '08020.007716/2024-97' },
  { id: 'VC-002078', numeroProcesso: '08020.007716/2024-97' },
  { id: 'VC-002079', numeroProcesso: '08020.007716/2024-97' },
  { id: 'VC-002080', numeroProcesso: '08020.007716/2024-97' },
  { id: 'VC-002081', numeroProcesso: '08020.007343/2024-54' },
  { id: 'VC-002082', numeroProcesso: '08020.007343/2024-54' },
  { id: 'VC-002083', numeroProcesso: '08020.001686/2024-13' },
  { id: 'VC-002084', numeroProcesso: '08020.004375/2025-89' },
  { id: 'VC-002085', numeroProcesso: '08020.007728/2024-11' },
  { id: 'VC-002086', numeroProcesso: '08020.007728/2024-11' },
  { id: 'VC-002087', numeroProcesso: '08020.007728/2024-11' },
  { id: 'VC-002088', numeroProcesso: '08020.007728/2024-11' },
  { id: 'VC-002089', numeroProcesso: '08020.007728/2024-11' },
  { id: 'VC-002090', numeroProcesso: '08020.007728/2024-11' },
  { id: 'VC-002091', numeroProcesso: '08020.007725/2024-88' },
  { id: 'VC-002092', numeroProcesso: '08020.007725/2024-88' },
  { id: 'VC-002093', numeroProcesso: '08020.007725/2024-88' },
  { id: 'VC-002094', numeroProcesso: '08020.007725/2024-88' },
  { id: 'VC-002095', numeroProcesso: '08020.007725/2024-88' },
  { id: 'VC-002096', numeroProcesso: '08020.007725/2024-88' },
  { id: 'VC-002097', numeroProcesso: '08020.007332/2024-74' },
  { id: 'VC-002098', numeroProcesso: '08020.007332/2024-74' },
  { id: 'VC-002099', numeroProcesso: '08020.003882/2024-14' },
  { id: 'VC-002100', numeroProcesso: '08020.003882/2024-14' },
  { id: 'VC-002101', numeroProcesso: '08020.003882/2024-14' },
  { id: 'VC-002102', numeroProcesso: '08020.003882/2024-14' },
  { id: 'VC-002103', numeroProcesso: '08000.048464/2024-94' },
  { id: 'VC-002104', numeroProcesso: '08000.048464/2024-94' },
  { id: 'VC-002105', numeroProcesso: '08020.007748/2024-92' },
  { id: 'VC-002106', numeroProcesso: '08020.003784/2024-87' },
  { id: 'VC-002107', numeroProcesso: '08020.001710/2024-14' },
  { id: 'VC-002108', numeroProcesso: '08020.001710/2024-14' },
  { id: 'VC-002109', numeroProcesso: '08020.007739/2024-00' },
  { id: 'VC-002110', numeroProcesso: '08020.007739/2024-00' },
  { id: 'VC-002111', numeroProcesso: '08020.007739/2024-00' },
  { id: 'VC-002112', numeroProcesso: '08020.007739/2024-00' },
  { id: 'VC-002113', numeroProcesso: '08020.007739/2024-00' },
  { id: 'VC-002114', numeroProcesso: '08020.007739/2024-00' },
  { id: 'VC-002115', numeroProcesso: '08020.007542/2024-62' },
  { id: 'VC-002116', numeroProcesso: '08020.007542/2024-62' },
  { id: 'VC-002117', numeroProcesso: '08020.007542/2024-62' },
  { id: 'VC-002118', numeroProcesso: '08020.007542/2024-62' },
  { id: 'VC-002119', numeroProcesso: '08020.007730/2024-91' },
  { id: 'VC-002120', numeroProcesso: '08020.007730/2024-91' },
  { id: 'VC-002121', numeroProcesso: '08020.007730/2024-91' },
  { id: 'VC-002122', numeroProcesso: '08020.007730/2024-91' },
  { id: 'VC-002123', numeroProcesso: '08020.007730/2024-91' },
  { id: 'VC-002124', numeroProcesso: '08020.007730/2024-91' },
  { id: 'VC-002125', numeroProcesso: '08020.003892/2024-50' },
  { id: 'VC-002126', numeroProcesso: '08020.003892/2024-50' },
  { id: 'VC-002127', numeroProcesso: '08020.003892/2024-50' },
  { id: 'VC-002128', numeroProcesso: '08020.003892/2024-50' },
  { id: 'VC-002130', numeroProcesso: '08020.007324/2024-28' },
  { id: 'VC-002131', numeroProcesso: '08020.007324/2024-28' },
  { id: 'VC-002132', numeroProcesso: '08020.007324/2024-28' },
  { id: 'VC-002133', numeroProcesso: '08020.007324/2024-28' },
  { id: 'VC-002134', numeroProcesso: '08020.005338/2025-98' },
  { id: 'VC-002135', numeroProcesso: '08020.005338/2025-98' },
  { id: 'VC-002136', numeroProcesso: '08020.001711/2024-51' },
  { id: 'VC-002137', numeroProcesso: '08020.001722/2024-31' },
  { id: 'VC-002138', numeroProcesso: '08020.001722/2024-31' },
  { id: 'VC-002139', numeroProcesso: '08020.001722/2024-31' },
  { id: 'VC-002140', numeroProcesso: '08020.007724/2024-33' },
  { id: 'VC-002141', numeroProcesso: '08020.007724/2024-33' },
  { id: 'VC-002142', numeroProcesso: '08020.007724/2024-33' },
  { id: 'VC-002143', numeroProcesso: '08020.007724/2024-33' },
  { id: 'VC-002144', numeroProcesso: '08020.007724/2024-33' },
  { id: 'VC-002145', numeroProcesso: '08020.007724/2024-33' },
  { id: 'VC-002146', numeroProcesso: '08020.001718/2024-72' },
  { id: 'VC-002150', numeroProcesso: '08020.007868/2024-90' },
  { id: 'VC-002151', numeroProcesso: '08020.007868/2024-90' },
  { id: 'VC-002152', numeroProcesso: '08020.007868/2024-90' },
  { id: 'VC-002153', numeroProcesso: '08020.007868/2024-90' },
  { id: 'VC-002154', numeroProcesso: '08020.003906/2024-35' },
  { id: 'VC-002155', numeroProcesso: '08020.003906/2024-35' },
  { id: 'VC-002156', numeroProcesso: '08020.001712/2024-03' },
  { id: 'VC-002164', numeroProcesso: '08020.005024/2025-95' },
  { id: 'VC-002165', numeroProcesso: '08020.007876/2024-36' },
  { id: 'VC-002166', numeroProcesso: '08020.003912/2024-92' },
  { id: 'VC-002167', numeroProcesso: '08020.003912/2024-92' },
  { id: 'VC-002168', numeroProcesso: '08020.005291/2024-81' },
  { id: 'VC-002169', numeroProcesso: '08020.005291/2024-81' },
  { id: 'VC-002170', numeroProcesso: '08020.005291/2024-81' },
  { id: 'VC-002171', numeroProcesso: '08020.007710/2024-10' },
  { id: 'VC-002172', numeroProcesso: '08020.007710/2024-10' },
  { id: 'VC-002173', numeroProcesso: '08020.007710/2024-10' },
  { id: 'VC-002174', numeroProcesso: '08020.007710/2024-10' },
  { id: 'VC-002175', numeroProcesso: '08020.007710/2024-10' },
  { id: 'VC-002176', numeroProcesso: '08020.007710/2024-10' },
  { id: 'VC-002177', numeroProcesso: '08020.007353/2024-90' },
  { id: 'VC-002178', numeroProcesso: '08020.007353/2024-90' },
  { id: 'VC-002179', numeroProcesso: '08020.001704/2024-59' },
  { id: 'VC-002180', numeroProcesso: '08020.001719/2024-17' },
  { id: 'VC-002181', numeroProcesso: '08020.007723/2024-99' },
  { id: 'VC-002182', numeroProcesso: '08020.007723/2024-99' },
  { id: 'VC-002183', numeroProcesso: '08020.007723/2024-99' },
  { id: 'VC-002184', numeroProcesso: '08020.007723/2024-99' },
  { id: 'VC-002185', numeroProcesso: '08020.007723/2024-99' },
  { id: 'VC-002186', numeroProcesso: '08020.007723/2024-99' },
  { id: 'VC-002187', numeroProcesso: '08020.007723/2024-99' },
  { id: 'VC-002190', numeroProcesso: '08020.004853/2025-51' },
  { id: 'VC-002191', numeroProcesso: '08020.007761/2024-41' },
  { id: 'VC-002192', numeroProcesso: '08020.007738/2024-57' },
  { id: 'VC-002193', numeroProcesso: '08020.007738/2024-57' },
  { id: 'VC-002194', numeroProcesso: '08020.007738/2024-57' },
  { id: 'VC-002195', numeroProcesso: '08020.007738/2024-57' },
  { id: 'VC-002196', numeroProcesso: '08020.007738/2024-57' },
  { id: 'VC-002197', numeroProcesso: '08020.007738/2024-57' },
  { id: 'VC-002198', numeroProcesso: '08020.007738/2024-57' },
  { id: 'VC-002199', numeroProcesso: '08020.006148/2025-98' },
  { id: 'VC-002200', numeroProcesso: '08020.006148/2025-98' },
  { id: 'VC-002201', numeroProcesso: '08020.006148/2025-98' },
  { id: 'VC-002202', numeroProcesso: '08020.006148/2025-98' },
  { id: 'VC-002203', numeroProcesso: '08020.006148/2025-98' },
  { id: 'VC-002204', numeroProcesso: '08020.006148/2025-98' },
  { id: 'VC-002205', numeroProcesso: '08020.007717/2024-31' },
  { id: 'VC-002206', numeroProcesso: '08020.007717/2024-31' },
  { id: 'VC-002207', numeroProcesso: '08020.007717/2024-31' },
  { id: 'VC-002208', numeroProcesso: '08020.007717/2024-31' },
  { id: 'VC-002209', numeroProcesso: '08020.007717/2024-31' },
  { id: 'VC-002210', numeroProcesso: '08020.007717/2024-31' },
  { id: 'VC-002211', numeroProcesso: '08020.007327/2024-61' },
  { id: 'VC-002212', numeroProcesso: '08020.007327/2024-61' },
  { id: 'VC-002213', numeroProcesso: '08020.007327/2024-61' },
  { id: 'VC-002214', numeroProcesso: '08020.007732/2024-80' },
  { id: 'VC-002215', numeroProcesso: '08020.007732/2024-80' },
  { id: 'VC-002216', numeroProcesso: '08020.007732/2024-80' },
  { id: 'VC-002217', numeroProcesso: '08020.007732/2024-80' },
  { id: 'VC-002218', numeroProcesso: '08020.007732/2024-80' },
  { id: 'VC-002219', numeroProcesso: '08020.007732/2024-80' },
  { id: 'VC-002220', numeroProcesso: '08020.007732/2024-80' },
  { id: 'VC-002221', numeroProcesso: '08020.003881/2024-70' },
  { id: 'VC-002222', numeroProcesso: '08020.003881/2024-70' },
  { id: 'VC-002223', numeroProcesso: '08020.003881/2024-70' },
  { id: 'VC-002224', numeroProcesso: '08020.003881/2024-70' },
  { id: 'VC-002225', numeroProcesso: '08020.003881/2024-70' },
  { id: 'VC-002226', numeroProcesso: '08020.003881/2024-70' },
  { id: 'VC-002227', numeroProcesso: '08020.007331/2024-20' },
  { id: 'VC-002228', numeroProcesso: '08020.007331/2024-20' },
  { id: 'VC-002229', numeroProcesso: '08020.007718/2024-86' },
  { id: 'VC-002230', numeroProcesso: '08020.007718/2024-86' },
  { id: 'VC-002231', numeroProcesso: '08020.007718/2024-86' },
  { id: 'VC-002232', numeroProcesso: '08020.007718/2024-86' },
  { id: 'VC-002233', numeroProcesso: '08020.007718/2024-86' },
  { id: 'VC-002234', numeroProcesso: '08020.007718/2024-86' },
  { id: 'VC-002235', numeroProcesso: '08020.007718/2024-86' },
  { id: 'VC-002236', numeroProcesso: '08020.007418/2024-05' },
  { id: 'VC-002237', numeroProcesso: '08020.007418/2024-05' },
  { id: 'VC-002238', numeroProcesso: '08020.007737/2024-11' },
  { id: 'VC-002239', numeroProcesso: '08020.007737/2024-11' },
  { id: 'VC-002240', numeroProcesso: '08020.007737/2024-11' },
  { id: 'VC-002241', numeroProcesso: '08020.007737/2024-11' },
  { id: 'VC-002242', numeroProcesso: '08020.007737/2024-11' },
  { id: 'VC-002243', numeroProcesso: '08020.007737/2024-11' },
  { id: 'VC-002244', numeroProcesso: '08020.001707/2024-92' },
  { id: 'VC-002245', numeroProcesso: '08020.001707/2024-92' },
  { id: 'VC-002246', numeroProcesso: '08020.003917/2024-15' },
  { id: 'VC-002247', numeroProcesso: '08020.007720/2024-55' },
  { id: 'VC-002248', numeroProcesso: '08020.007720/2024-55' },
  { id: 'VC-002249', numeroProcesso: '08020.007720/2024-55' },
  { id: 'VC-002250', numeroProcesso: '08020.007720/2024-55' },
  { id: 'VC-002251', numeroProcesso: '08020.007720/2024-55' },
  { id: 'VC-002252', numeroProcesso: '08020.007720/2024-55' },
  { id: 'VC-002253', numeroProcesso: '08020.005550/2025-55' },
  { id: 'VC-002254', numeroProcesso: '08020.009801/2024-90' },
  { id: 'VC-002255', numeroProcesso: '08020.003920/2024-39' },
  { id: 'VC-002256', numeroProcesso: '08020.003920/2024-39' },
  { id: 'VC-002257', numeroProcesso: '08020.005461/2025-17' },
  { id: 'VC-002258', numeroProcesso: '08020.007714/2024-06' },
  { id: 'VC-002259', numeroProcesso: '08020.007714/2024-06' },
  { id: 'VC-002260', numeroProcesso: '08020.007714/2024-06' },
  { id: 'VC-002261', numeroProcesso: '08020.007714/2024-06' },
  { id: 'VC-002262', numeroProcesso: '08020.007714/2024-06' },
  { id: 'VC-002263', numeroProcesso: '08020.007714/2024-06' },
  { id: 'VC-002264', numeroProcesso: '08020.003921/2024-83' },
  { id: 'VC-002265', numeroProcesso: '08020.007883/2024-38' },
  { id: 'VC-002266', numeroProcesso: '08020.007733/2024-24' },
  { id: 'VC-002267', numeroProcesso: '08020.007733/2024-24' },
  { id: 'VC-002268', numeroProcesso: '08020.007733/2024-24' },
  { id: 'VC-002269', numeroProcesso: '08020.007733/2024-24' },
  { id: 'VC-002270', numeroProcesso: '08020.007733/2024-24' },
  { id: 'VC-002271', numeroProcesso: '08020.007733/2024-24' },
  { id: 'VC-002272', numeroProcesso: '08020.007733/2024-24' },
  { id: 'VC-002273', numeroProcesso: '08020.007722/2024-44' },
  { id: 'VC-002274', numeroProcesso: '08020.007722/2024-44' },
  { id: 'VC-002275', numeroProcesso: '08020.007722/2024-44' },
  { id: 'VC-002276', numeroProcesso: '08020.007722/2024-44' },
  { id: 'VC-002277', numeroProcesso: '08020.007722/2024-44' },
  { id: 'VC-002278', numeroProcesso: '08020.007722/2024-44' },
  { id: 'VC-002279', numeroProcesso: '08020.003904/2024-46' },
  { id: 'VC-002280', numeroProcesso: '08020.003904/2024-46' },
  { id: 'VC-002281', numeroProcesso: '08020.009815/2024-11' },
  { id: 'VC-002282', numeroProcesso: '08020.003919/2024-12' },
  { id: 'VC-002283', numeroProcesso: '08020.003919/2024-12' },
  { id: 'VC-002284', numeroProcesso: '08020.003919/2024-12' },
  { id: 'VC-002285', numeroProcesso: '08020.003919/2024-12' },
  { id: 'VC-002286', numeroProcesso: '08020.003919/2024-12' },
  { id: 'VC-002287', numeroProcesso: '08020.003919/2024-12' },
  { id: 'VC-002288', numeroProcesso: '08020.003777/2024-85' },
  { id: 'VC-002289', numeroProcesso: '08020.003777/2024-85' },
  { id: 'VC-002290', numeroProcesso: '08020.007712/2024-17' },
  { id: 'VC-002291', numeroProcesso: '08020.007712/2024-17' },
  { id: 'VC-002292', numeroProcesso: '08020.007712/2024-17' },
  { id: 'VC-002293', numeroProcesso: '08020.007712/2024-17' },
  { id: 'VC-002294', numeroProcesso: '08020.007712/2024-17' },
  { id: 'VC-002295', numeroProcesso: '08020.007712/2024-17' },
  { id: 'VC-002296', numeroProcesso: '08020.003772/2024-52' },
  { id: 'VC-002297', numeroProcesso: '08020.007727/2024-77' },
  { id: 'VC-002298', numeroProcesso: '08020.007727/2024-77' },
  { id: 'VC-002299', numeroProcesso: '08020.007727/2024-77' },
  { id: 'VC-002300', numeroProcesso: '08020.007727/2024-77' },
  { id: 'VC-002301', numeroProcesso: '08020.007727/2024-77' },
  { id: 'VC-002302', numeroProcesso: '08020.007727/2024-77' },
  { id: 'VC-002303', numeroProcesso: '08020.007736/2024-68' },
  { id: 'VC-002304', numeroProcesso: '08020.007736/2024-68' },
  { id: 'VC-002305', numeroProcesso: '08020.007736/2024-68' },
  { id: 'VC-002306', numeroProcesso: '08020.007736/2024-68' },
  { id: 'VC-002307', numeroProcesso: '08020.007736/2024-68' },
  { id: 'VC-002308', numeroProcesso: '08020.007736/2024-68' },
  { id: 'VC-002309', numeroProcesso: '08020.001708/2024-37' },
  { id: 'VC-002310', numeroProcesso: '08020.001708/2024-37' },
  { id: 'VC-002311', numeroProcesso: '08020.007726/2024-22' },
  { id: 'VC-002312', numeroProcesso: '08020.007726/2024-22' },
  { id: 'VC-002313', numeroProcesso: '08020.007726/2024-22' },
  { id: 'VC-002314', numeroProcesso: '08020.007726/2024-22' },
  { id: 'VC-002315', numeroProcesso: '08020.007726/2024-22' },
  { id: 'VC-002316', numeroProcesso: '08020.007726/2024-22' },
  { id: 'VC-002317', numeroProcesso: '08020.007726/2024-22' },
  { id: 'VC-002319', numeroProcesso: '08020.003884/2024-11' },
  { id: 'VC-002320', numeroProcesso: '08020.008502/2024-38' },
  { id: 'VC-002321', numeroProcesso: '08020.008502/2024-38' },
  { id: 'VC-002322', numeroProcesso: '08020.008502/2024-38' },
  { id: 'VC-002323', numeroProcesso: '08020.008502/2024-38' },
  { id: 'VC-002324', numeroProcesso: '08020.007734/2024-79' },
  { id: 'VC-002325', numeroProcesso: '08020.007734/2024-79' },
  { id: 'VC-002326', numeroProcesso: '08020.007734/2024-79' },
  { id: 'VC-002327', numeroProcesso: '08020.007734/2024-79' },
  { id: 'VC-002328', numeroProcesso: '08020.007734/2024-79' },
  { id: 'VC-002329', numeroProcesso: '08020.007734/2024-79' },
  { id: 'VC-002330', numeroProcesso: '08020.007734/2024-79' },
  { id: 'VC-002331', numeroProcesso: '08020.007721/2024-08' },
  { id: 'VC-002332', numeroProcesso: '08020.007721/2024-08' },
  { id: 'VC-002333', numeroProcesso: '08020.007721/2024-08' },
  { id: 'VC-002334', numeroProcesso: '08020.007721/2024-08' },
  { id: 'VC-002335', numeroProcesso: '08020.007721/2024-08' },
  { id: 'VC-002336', numeroProcesso: '08020.007721/2024-08' },
  { id: 'VC-002337', numeroProcesso: '08020.007721/2024-08' },
  { id: 'VC-002338', numeroProcesso: '08020.003901/2024-11' },
  { id: 'VC-002339', numeroProcesso: '08020.003889/2024-36' },
  { id: 'VC-002340', numeroProcesso: '08020.003889/2024-36' },
  { id: 'VC-002341', numeroProcesso: '08020.003889/2024-36' },
  { id: 'VC-002342', numeroProcesso: '08020.003889/2024-36' },
  { id: 'VC-002343', numeroProcesso: '08020.003903/2024-00' },
  { id: 'VC-002344', numeroProcesso: '08020.003903/2024-00' },
  { id: 'VC-002345', numeroProcesso: '08020.003903/2024-00' },
  { id: 'VC-002346', numeroProcesso: '08020.003903/2024-00' },
  { id: 'VC-002347', numeroProcesso: '08020.003903/2024-00' },
  { id: 'VC-002348', numeroProcesso: '08020.003903/2024-00' },
  { id: 'VC-002349', numeroProcesso: '08020.006171/2025-82' },
  { id: 'VC-002350', numeroProcesso: '08020.007334/2024-63' },
  { id: 'VC-002351', numeroProcesso: '08020.007714/2024-06' },
  { id: 'VC-002352', numeroProcesso: '08020.007333/2024-19' },
  { id: 'VC-002353', numeroProcesso: '08020.003905/2024-91' },
  { id: 'VC-002354', numeroProcesso: '08020.005553/2025-99' },
  { id: 'VC-002355', numeroProcesso: '08020.001713/2024-40' },
  { id: 'VC-002356', numeroProcesso: '08020.001713/2024-40' },
  { id: 'VC-002357', numeroProcesso: '08020.007326/2024-17' },
  { id: 'VC-002358', numeroProcesso: '08020.007326/2024-17' },
  { id: 'VC-002359', numeroProcesso: '08020.007326/2024-17' },
  { id: 'VC-002360', numeroProcesso: '08020.006944/2025-21' },
  { id: 'VC-002361', numeroProcesso: '08020.003888/2024-91' },
  { id: 'VC-002362', numeroProcesso: '08020.003888/2024-91' },
  { id: 'VC-002363', numeroProcesso: '08020.003888/2024-91' },
  { id: 'VC-002364', numeroProcesso: '08020.003888/2024-91' },
  { id: 'VC-002365', numeroProcesso: '08000.048530/2024-26' },
  { id: 'VC-002366', numeroProcesso: '08000.048530/2024-26' },
  { id: 'VC-002367', numeroProcesso: '08020.003909/2024-79' },
  { id: 'VC-002368', numeroProcesso: '08020.003909/2024-79' },
  { id: 'VC-002369', numeroProcesso: '08020.003909/2024-79' },
  { id: 'VC-002370', numeroProcesso: '08020.003909/2024-79' },
  { id: 'VC-002371', numeroProcesso: '08020.007345/2024-43' },
  { id: 'VC-002372', numeroProcesso: '08020.007345/2024-43' },
  { id: 'VC-002373', numeroProcesso: '08020.007345/2024-43' },
  { id: 'VC-002374', numeroProcesso: '08020.007345/2024-43' },
  { id: 'VC-002375', numeroProcesso: '08020.007345/2024-43' },
  { id: 'VC-002376', numeroProcesso: '08020.007173/2025-99' },
  { id: 'VC-002377', numeroProcesso: '08020.007173/2025-99' },
  { id: 'VC-002378', numeroProcesso: '08020.007173/2025-99' },
  { id: 'VC-002379', numeroProcesso: '08020.007173/2025-99' },
  { id: 'VC-002380', numeroProcesso: '08020.007173/2025-99' },
  { id: 'VC-002381', numeroProcesso: '08000.033525/2024-19' },
  { id: 'VC-002382', numeroProcesso: '08000.033525/2024-19' },
  { id: 'VC-002383', numeroProcesso: '08020.007344/2024-07' },
  { id: 'VC-002384', numeroProcesso: '08020.007344/2024-07' },
  { id: 'VC-002385', numeroProcesso: '08020.003913/2024-37' },
  { id: 'VC-002386', numeroProcesso: '08020.007332/2024-74' },
  { id: 'VC-002387', numeroProcesso: '08000.048489/2024-98' },
  { id: 'VC-002388', numeroProcesso: '08000.048489/2024-98' },
  { id: 'VC-002389', numeroProcesso: '08000.023970/2025-51' },
  { id: 'VC-002390', numeroProcesso: '08000.023970/2025-51' },
  { id: 'VC-002391', numeroProcesso: '08000.023970/2025-51' },
  { id: 'VC-002392', numeroProcesso: '08000.049838/2024-99' },
  { id: 'VC-002393', numeroProcesso: '08000.049838/2024-99' },
  { id: 'VC-002394', numeroProcesso: '08020.010060/2024-90' },
  { id: 'VC-002395', numeroProcesso: '08020.010060/2024-90' },
  { id: 'VC-002396', numeroProcesso: '08020.010060/2024-90' },
  { id: 'VC-002397', numeroProcesso: '08020.010060/2024-90' },
  { id: 'VC-002398', numeroProcesso: '08020.010060/2024-90' },
  { id: 'VC-002399', numeroProcesso: '08020.006572/2025-32' },
  { id: 'VC-002400', numeroProcesso: '08020.006572/2025-32' },
  { id: 'VC-002401', numeroProcesso: '08020.006572/2025-32' },
  { id: 'VC-002402', numeroProcesso: '08020.003555/2025-43' },
  { id: 'VC-002403', numeroProcesso: '08020.007335/2024-16' },
  { id: 'VC-002404', numeroProcesso: '08020.007335/2024-16' },
  { id: 'VC-002405', numeroProcesso: '08020.009957/2024-71' },
  { id: 'VC-002406', numeroProcesso: '08020.009957/2024-71' },
  { id: 'VC-002407', numeroProcesso: '08020.009957/2024-71' },
  { id: 'VC-002408', numeroProcesso: '08020.009957/2024-71' },
  { id: 'VC-002409', numeroProcesso: '08020.009957/2024-71' },
  { id: 'VC-002410', numeroProcesso: '08020.009957/2024-71' },
  { id: 'VC-002411', numeroProcesso: '08020.009957/2024-71' },
  { id: 'VC-002412', numeroProcesso: '08020.009899/2024-85' },
  { id: 'VC-002413', numeroProcesso: '08020.009899/2024-85' },
  { id: 'VC-002414', numeroProcesso: '08020.009899/2024-85' },
  { id: 'VC-002415', numeroProcesso: '08020.009899/2024-85' },
  { id: 'VC-002416', numeroProcesso: '08020.009899/2024-85' },
  { id: 'VC-002417', numeroProcesso: '08020.009899/2024-85' },
  { id: 'VC-002418', numeroProcesso: '08020.009899/2024-85' },
  { id: 'VC-002419', numeroProcesso: '08020.010030/2024-83' },
  { id: 'VC-002420', numeroProcesso: '08020.010030/2024-83' },
  { id: 'VC-002421', numeroProcesso: '08020.010030/2024-83' },
  { id: 'VC-002422', numeroProcesso: '08020.010030/2024-83' },
  { id: 'VC-002423', numeroProcesso: '08020.010030/2024-83' },
  { id: 'VC-002424', numeroProcesso: '08020.010030/2024-83' },
  { id: 'VC-002425', numeroProcesso: '08020.010030/2024-83' },
  { id: 'VC-002426', numeroProcesso: '08020.010030/2024-83' },
  { id: 'VC-002427', numeroProcesso: '08020.010030/2024-83' },
  { id: 'VC-002428', numeroProcesso: '08020.010030/2024-83' },
  { id: 'VC-002429', numeroProcesso: '08020.006362/2025-44' },
  { id: 'VC-002430', numeroProcesso: '08020.003808/2024-06' },
  { id: 'VC-002431', numeroProcesso: '08020.003890/2024-61' },
  { id: 'VC-002432', numeroProcesso: '08020.003890/2024-61' },
  { id: 'VC-002433', numeroProcesso: '08020.003890/2024-61' },
  { id: 'VC-002434', numeroProcesso: '08020.003890/2024-61' },
  { id: 'VC-002435', numeroProcesso: '08020.003890/2024-61' },
  { id: 'VC-002436', numeroProcesso: '08020.007271/2025-26' },
  { id: 'VC-002437', numeroProcesso: '08020.007340/2024-11' },
  { id: 'VC-002438', numeroProcesso: '08020.007340/2024-11' },
  { id: 'VC-002439', numeroProcesso: '08020.007471/2025-89' },
  { id: 'VC-002440', numeroProcesso: '08020.000134/2025-61' },
  { id: 'VC-002441', numeroProcesso: '08020.007262/2025-35' },
  { id: 'VC-002442', numeroProcesso: '08020.007729/2024-66' },
  { id: 'VC-002443', numeroProcesso: '08020.007729/2024-66' },
  { id: 'VC-002444', numeroProcesso: '08020.007729/2024-66' },
  { id: 'VC-002445', numeroProcesso: '08020.007729/2024-66' },
  { id: 'VC-002446', numeroProcesso: '08020.007729/2024-66' },
  { id: 'VC-002447', numeroProcesso: '08020.007729/2024-66' },
  { id: 'VC-002448', numeroProcesso: '08020.009890/2024-74' },
  { id: 'VC-002449', numeroProcesso: '08020.009890/2024-74' },
  { id: 'VC-002450', numeroProcesso: '08020.006857/2025-73' },
  { id: 'VC-002451', numeroProcesso: '08020.006857/2025-73' },
  { id: 'VC-002452', numeroProcesso: '08020.006857/2025-73' },
  { id: 'VC-002453', numeroProcesso: '08020.006857/2025-73' },
  { id: 'VC-002454', numeroProcesso: '08020.006857/2025-73' },
  { id: 'VC-002455', numeroProcesso: '08020.006857/2025-73' },
  { id: 'VC-002456', numeroProcesso: '08020.006857/2025-73' },
  { id: 'VC-002457', numeroProcesso: '08020.006857/2025-73' },
  { id: 'VC-002458', numeroProcesso: '08020.006857/2025-73' },
  { id: 'VC-002459', numeroProcesso: '08020.006857/2025-73' },
  { id: 'VC-002460', numeroProcesso: '08020.006857/2025-73' },
  { id: 'VC-002461', numeroProcesso: '08020.006857/2025-73' },
  { id: 'VC-002462', numeroProcesso: '08020.006857/2025-73' },
  { id: 'VC-002463', numeroProcesso: '08020.006857/2025-73' },
  { id: 'VC-002464', numeroProcesso: '08020.006857/2025-73' },
  { id: 'VC-002465', numeroProcesso: '08020.006857/2025-73' },
  { id: 'VC-002466', numeroProcesso: '08020.006857/2025-73' },
  { id: 'VC-002467', numeroProcesso: '08020.006857/2025-73' },
  { id: 'VC-002468', numeroProcesso: '08020.006857/2025-73' },
  { id: 'VC-002469', numeroProcesso: '08020.006857/2025-73' },
  { id: 'VC-002470', numeroProcesso: '08020.006857/2025-73' },
  { id: 'VC-002471', numeroProcesso: '08020.006857/2025-73' },
  { id: 'VC-002472', numeroProcesso: '08020.006857/2025-73' },
  { id: 'VC-002473', numeroProcesso: '08020.006857/2025-73' },
  { id: 'VC-002474', numeroProcesso: '08020.006857/2025-73' },
  { id: 'VC-002475', numeroProcesso: '08020.010069/2024-09' },
  { id: 'VC-002476', numeroProcesso: '08020.010069/2024-09' },
  { id: 'VC-002477', numeroProcesso: '08020.010069/2024-09' },
  { id: 'VC-002478', numeroProcesso: '08020.010069/2024-09' },
  { id: 'VC-002479', numeroProcesso: '08020.010069/2024-09' },
  { id: 'VC-002480', numeroProcesso: '08020.010069/2024-09' },
  { id: 'VC-002481', numeroProcesso: '08020.007261/2025-91' },
  { id: 'VC-002482', numeroProcesso: '08020.010041/2024-63' },
  { id: 'VC-002483', numeroProcesso: '08020.007727/2024-77' },
  { id: 'VC-002484', numeroProcesso: '08020.010062/2024-89' },
  { id: 'VC-002485', numeroProcesso: '08020.010062/2024-89' },
  { id: 'VC-002486', numeroProcesso: '08020.010062/2024-89' },
  { id: 'VC-002487', numeroProcesso: '08020.010062/2024-89' },
  { id: 'VC-002488', numeroProcesso: '08020.010062/2024-89' },
  { id: 'VC-002489', numeroProcesso: '08020.010036/2024-51' },
  { id: 'VC-002490', numeroProcesso: '08020.010036/2024-51' },
  { id: 'VC-002491', numeroProcesso: '08020.010036/2024-51' },
  { id: 'VC-002492', numeroProcesso: '08020.010036/2024-51' },
  { id: 'VC-002493', numeroProcesso: '08020.010036/2024-51' },
  { id: 'VC-002494', numeroProcesso: '08020.010036/2024-51' },
  { id: 'VC-002495', numeroProcesso: '08020.010036/2024-51' },
  { id: 'VC-002496', numeroProcesso: '08020.010036/2024-51' },
  { id: 'VC-002497', numeroProcesso: '08020.010036/2024-51' },
  { id: 'VC-002498', numeroProcesso: '08020.010036/2024-51' },
  { id: 'VC-002499', numeroProcesso: '08020.010036/2024-51' },
  { id: 'VC-002500', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002501', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002502', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002503', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002504', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002505', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002506', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002507', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002508', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002509', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002510', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002511', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002512', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002513', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002514', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002515', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002516', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002517', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002518', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002519', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002520', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002521', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002522', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002523', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002524', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002525', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002526', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002527', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002528', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002529', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002530', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002531', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002532', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002533', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002534', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002535', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002536', numeroProcesso: '08020.006952/2025-77' },
  { id: 'VC-002537', numeroProcesso: '08020.007346/2024-98' },
  { id: 'VC-002538', numeroProcesso: '08020.007346/2024-98' },
  { id: 'VC-002539', numeroProcesso: '08020.007346/2024-98' },
  { id: 'VC-002540', numeroProcesso: '08020.007346/2024-98' },
  { id: 'VC-002541', numeroProcesso: '08020.007735/2024-13' },
  { id: 'VC-002542', numeroProcesso: '08020.007735/2024-13' },
  { id: 'VC-002543', numeroProcesso: '08020.007735/2024-13' },
  { id: 'VC-002544', numeroProcesso: '08020.007735/2024-13' },
  { id: 'VC-002545', numeroProcesso: '08020.007735/2024-13' },
  { id: 'VC-002546', numeroProcesso: '08020.007735/2024-13' },
  { id: 'VC-002547', numeroProcesso: '08020.007907/2024-59' },
  { id: 'VC-002548', numeroProcesso: '08020.007907/2024-59' },
  { id: 'VC-002549', numeroProcesso: '08020.007907/2024-59' },
  { id: 'VC-002550', numeroProcesso: '08020.007907/2024-59' },
  { id: 'VC-002551', numeroProcesso: '08020.009806/2024-12' },
  { id: 'VC-002552', numeroProcesso: '08020.004371/2025-09' },
  { id: 'VC-002553', numeroProcesso: '08020.004371/2025-09' },
  { id: 'VC-002554', numeroProcesso: '08020.007892/2024-29' },
  { id: 'VC-002555', numeroProcesso: '08020.007892/2024-29' },
  { id: 'VC-002556', numeroProcesso: '08020.007288/2025-83' },
  { id: 'VC-002557', numeroProcesso: '08020.009914/2024-95' },
  { id: 'VC-002558', numeroProcesso: '08020.009914/2024-95' },
  { id: 'VC-002559', numeroProcesso: '08020.010035/2024-14' },
  { id: 'VC-002560', numeroProcesso: '08020.010035/2024-14' },
  { id: 'VC-002561', numeroProcesso: '08020.007166/2025-97' },
  { id: 'VC-002562', numeroProcesso: '08020.007806/2025-69' },
  { id: 'VC-002563', numeroProcesso: '08020.007806/2025-69' },
  { id: 'VC-002564', numeroProcesso: '08020.007806/2025-69' },
  { id: 'VC-002565', numeroProcesso: '08020.007806/2025-69' },
  { id: 'VC-002566', numeroProcesso: '08020.010039/2024-94' },
  { id: 'VC-002567', numeroProcesso: '08020.007338/2024-41' },
  { id: 'VC-002568', numeroProcesso: '08020.007338/2024-41' },
  { id: 'VC-002574', numeroProcesso: '08020.008230/2025-57' },
  { id: 'VC-002575', numeroProcesso: '08020.001723/2024-85' },
  { id: 'VC-002576', numeroProcesso: '08020.008249/2025-01' },
  { id: 'VC-002577', numeroProcesso: '08020.007719/2024-21' },
  { id: 'VC-002578', numeroProcesso: '08020.007719/2024-21' },
  { id: 'VC-002579', numeroProcesso: '08020.007719/2024-21' },
  { id: 'VC-002580', numeroProcesso: '08020.007719/2024-21' },
  { id: 'VC-002581', numeroProcesso: '08020.007719/2024-21' },
  { id: 'VC-002582', numeroProcesso: '08020.007291/2025-05' },
  { id: 'VC-002583', numeroProcesso: '08020.002243/2025-12' },
  { id: 'VC-002584', numeroProcesso: '08020.002243/2025-12' },
  { id: 'VC-002585', numeroProcesso: '08020.002243/2025-12' },
  { id: 'VC-002586', numeroProcesso: '08020.001709/2024-81' },
  { id: 'VC-002587', numeroProcesso: '08020.001720/2024-41' },
  { id: 'VC-002588', numeroProcesso: '08020.001720/2024-41' },
  { id: 'VC-002589', numeroProcesso: '08020.006948/2025-17' },
  { id: 'VC-002590', numeroProcesso: '08020.006948/2025-17' },
  { id: 'VC-002591', numeroProcesso: '08020.006176/2025-13' },
  { id: 'VC-002592', numeroProcesso: '08020.006176/2025-13' },
  { id: 'VC-002593', numeroProcesso: '08020.006176/2025-13' },
  { id: 'VC-002594', numeroProcesso: '08020.006176/2025-13' },
  { id: 'VC-002595', numeroProcesso: '08020.006176/2025-13' },
  { id: 'VC-002596', numeroProcesso: '08020.001706/2024-48' },
  { id: 'VC-002597', numeroProcesso: '08020.001706/2024-48' },
  { id: 'VC-002598', numeroProcesso: '08020.001706/2024-48' },
  { id: 'VC-002599', numeroProcesso: '08020.001706/2024-48' },
  { id: 'VC-002600', numeroProcesso: '08020.003795/2024-67' },
  { id: 'VC-002601', numeroProcesso: '08020.000113/2025-45' },
  { id: 'VC-002604', numeroProcesso: '08020.000132/2025-71' },
  { id: 'VC-002605', numeroProcesso: '08020.006705/2024-90' },
  { id: 'VC-002606', numeroProcesso: '08020.010040/2024-19' },
  { id: 'VC-002607', numeroProcesso: '08020.008282/2025-23' },
  { id: 'VC-002610', numeroProcesso: '08020.001936/2025-98' },
  { id: 'VC-002611', numeroProcesso: '08020.001936/2025-98' },
  { id: 'VC-002612', numeroProcesso: '08020.003868/2025-00' },
  { id: 'VC-002613', numeroProcesso: '08020.003868/2025-00' },
  { id: 'VC-002614', numeroProcesso: '08020.003868/2025-00' },
  { id: 'VC-002615', numeroProcesso: '08020.003868/2025-00' },
  { id: 'VC-002616', numeroProcesso: '08020.003868/2025-00' },
  { id: 'VC-002617', numeroProcesso: '08020.003868/2025-00' },
  { id: 'VC-002618', numeroProcesso: '08020.003868/2025-00' },
  { id: 'VC-002619', numeroProcesso: '08020.003868/2025-00' },
  { id: 'VC-002620', numeroProcesso: '08020.003868/2025-00' },
  { id: 'VC-002621', numeroProcesso: '08020.003868/2025-00' },
  { id: 'VC-002622', numeroProcesso: '08020.003868/2025-00' },
  { id: 'VC-002623', numeroProcesso: '08020.003868/2025-00' },
  { id: 'VC-002624', numeroProcesso: '08020.007885/2025-16' },
  { id: 'VC-002625', numeroProcesso: '08020.007885/2025-16' },
  { id: 'VC-002626', numeroProcesso: '08020.007885/2025-16' },
  { id: 'VC-002627', numeroProcesso: '08020.007885/2025-16' },
  { id: 'VC-002628', numeroProcesso: '08020.007885/2025-16' },
  { id: 'VC-002629', numeroProcesso: '08020.007885/2025-16' },
  { id: 'VC-002630', numeroProcesso: '08020.007885/2025-16' },
  { id: 'VC-002631', numeroProcesso: '08020.007885/2025-16' },
  { id: 'VC-002632', numeroProcesso: '08020.007885/2025-16' },
  { id: 'VC-002633', numeroProcesso: '08020.007676/2024-83' },
  { id: 'VC-002634', numeroProcesso: '08020.007269/2025-57' },
  { id: 'VC-002635', numeroProcesso: '08020.007795/2025-17' },
  { id: 'VC-002636', numeroProcesso: '08020.006762/2024-79' },
  { id: 'VC-002637', numeroProcesso: '08020.010081/2024-13' },
  { id: 'VC-002638', numeroProcesso: '08020.010081/2024-13' },
  { id: 'VC-002639', numeroProcesso: '08020.010081/2024-13' },
  { id: 'VC-002640', numeroProcesso: '08020.010081/2024-13' },
  { id: 'VC-002641', numeroProcesso: '08020.010081/2024-13' },
  { id: 'VC-002642', numeroProcesso: '08020.010081/2024-13' },
  { id: 'VC-002643', numeroProcesso: '08020.010081/2024-13' },
  { id: 'VC-002644', numeroProcesso: '08020.007283/2025-51' },
  { id: 'VC-002645', numeroProcesso: '08020.007444/2024-25' },
  { id: 'VC-002646', numeroProcesso: '08020.008201/2025-95' },
  { id: 'VC-002647', numeroProcesso: '08020.008201/2025-95' },
  { id: 'VC-002648', numeroProcesso: '08020.008201/2025-95' },
  { id: 'VC-002649', numeroProcesso: '08020.008201/2025-95' },
  { id: 'VC-002650', numeroProcesso: '08020.008201/2025-95' },
  { id: 'VC-002651', numeroProcesso: '08020.008201/2025-95' },
  { id: 'VC-002652', numeroProcesso: '08020.008201/2025-95' },
  { id: 'VC-002653', numeroProcesso: '08020.008201/2025-95' },
  { id: 'VC-002654', numeroProcesso: '08020.008201/2025-95' },
  { id: 'VC-002655', numeroProcesso: '08020.008201/2025-95' },
  { id: 'VC-002656', numeroProcesso: '08020.008201/2025-95' },
  { id: 'VC-002657', numeroProcesso: '08020.008201/2025-95' },
  { id: 'VC-002658', numeroProcesso: '08020.001908/2025-71' },
  { id: 'VC-002659', numeroProcesso: '08020.001908/2025-71' },
  { id: 'VC-002660', numeroProcesso: '08020.006809/2025-85' },
  { id: 'VC-002661', numeroProcesso: '08020.006809/2025-85' },
  { id: 'VC-002662', numeroProcesso: '08020.006809/2025-85' },
  { id: 'VC-002663', numeroProcesso: '08020.001939/2025-21' },
  { id: 'VC-002666', numeroProcesso: '08020.007153/2025-18' },
  { id: 'VC-002667', numeroProcesso: '08020.007153/2025-18' },
  { id: 'VC-002668', numeroProcesso: '08020.002024/2025-33' },
  { id: 'VC-002669', numeroProcesso: '08106.005695/2015-34' },
  { id: 'VC-002670', numeroProcesso: '08020.007144/2025-27' },
  { id: 'VC-002671', numeroProcesso: '08020.007144/2025-27' },
  { id: 'VC-002672', numeroProcesso: '08020.007144/2025-27' },
  { id: 'VC-002673', numeroProcesso: '08020.001909/2025-15' },
  { id: 'VC-002674', numeroProcesso: '08020.001909/2025-15' },
  { id: 'VC-002675', numeroProcesso: '08020.001909/2025-15' },
  { id: 'VC-002676', numeroProcesso: '08020.001909/2025-15' },
  { id: 'VC-002677', numeroProcesso: '08020.001931/2025-65' },
  { id: 'VC-002678', numeroProcesso: '08020.001931/2025-65' },
  { id: 'VC-002679', numeroProcesso: '08020.001944/2025-34' },
  { id: 'VC-002680', numeroProcesso: '08020.001944/2025-34' },
  { id: 'VC-002681', numeroProcesso: '08020.002071/2025-87' },
  { id: 'VC-002682', numeroProcesso: '08020.001916/2025-17' },
  { id: 'VC-002683', numeroProcesso: '08020.003356/2025-35' },
  { id: 'VC-002684', numeroProcesso: '08020.003356/2025-35' },
  { id: 'VC-002685', numeroProcesso: '08020.009420/2024-19' },
  { id: 'VC-002686', numeroProcesso: '08020.001912/2025-39' },
  { id: 'VC-002687', numeroProcesso: '08020.001912/2025-39' },
  { id: 'VC-002688', numeroProcesso: '08020.001912/2025-39' },
  { id: 'VC-002689', numeroProcesso: '08020.001912/2025-39' },
  { id: 'VC-002690', numeroProcesso: '08020.001912/2025-39' },
  { id: 'VC-002691', numeroProcesso: '08020.001912/2025-39' },
  { id: 'VC-002692', numeroProcesso: '08020.001912/2025-39' },
  { id: 'VC-002693', numeroProcesso: '08020.001912/2025-39' },
  { id: 'VC-002694', numeroProcesso: '08020.001912/2025-39' },
  { id: 'VC-002695', numeroProcesso: '08020.006697/2025-62' },
  { id: 'VC-002696', numeroProcesso: '08020.006697/2025-62' },
  { id: 'VC-002697', numeroProcesso: '08020.006697/2025-62' },
  { id: 'VC-002698', numeroProcesso: '08020.007670/2024-14' },
  { id: 'VC-002699', numeroProcesso: '08020.007670/2024-14' },
  { id: 'VC-002700', numeroProcesso: '08020.001916/2025-17' },
  { id: 'VC-002701', numeroProcesso: '08020.001916/2025-17' },
  { id: 'VC-002702', numeroProcesso: '08020.001916/2025-17' },
  { id: 'VC-002703', numeroProcesso: '08020.002070/2025-32' },
  { id: 'VC-002704', numeroProcesso: '08020.002070/2025-32' },
  { id: 'VC-002705', numeroProcesso: '08020.002070/2025-32' },
  { id: 'VC-002706', numeroProcesso: '08020.001904/2025-92' },
  { id: 'VC-002707', numeroProcesso: '08020.001904/2025-92' },
  { id: 'VC-002708', numeroProcesso: '08020.001904/2025-92' },
  { id: 'VC-002709', numeroProcesso: '08020.001904/2025-92' },
  { id: 'VC-002710', numeroProcesso: '08020.001904/2025-92' },
  { id: 'VC-002711', numeroProcesso: '08020.001904/2025-92' },
  { id: 'VC-002712', numeroProcesso: '08020.003722/2025-56' },
  { id: 'VC-002713', numeroProcesso: '08020.003722/2025-56' },
  { id: 'VC-002714', numeroProcesso: '08020.002093/2025-47' },
  { id: 'VC-002715', numeroProcesso: '08020.002093/2025-47' },
  { id: 'VC-002716', numeroProcesso: '08020.003665/2025-13' },
  { id: 'VC-002717', numeroProcesso: '08020.001930/2025-11' },
  { id: 'VC-002718', numeroProcesso: '08020.001930/2025-11' },
  { id: 'VC-002719', numeroProcesso: '08020.001930/2025-11' },
  { id: 'VC-002720', numeroProcesso: '08020.001930/2025-11' },
  { id: 'VC-002721', numeroProcesso: '08020.001930/2025-11' },
  { id: 'VC-002722', numeroProcesso: '08020.007675/2024-39' },
  { id: 'VC-002723', numeroProcesso: '08020.003704/2025-74' },
  { id: 'VC-002724', numeroProcesso: '08020.003704/2025-74' },
  { id: 'VC-002725', numeroProcesso: '08020.003288/2025-12' },
  { id: 'VC-002726', numeroProcesso: '08020.001906/2025-81' },
  { id: 'VC-002727', numeroProcesso: '08020.009424/2024-99' },
  { id: 'VC-002728', numeroProcesso: '08020.009424/2024-99' },
  { id: 'VC-002729', numeroProcesso: '08020.001908/2025-71' },
  { id: 'VC-002730', numeroProcesso: '08020.001908/2025-71' },
  { id: 'VC-002731', numeroProcesso: '08020.001908/2025-71' },
  { id: 'VC-002732', numeroProcesso: '08020.001908/2025-71' },
  { id: 'VC-002733', numeroProcesso: '08020.001908/2025-71' },
  { id: 'VC-002734', numeroProcesso: '08020.001908/2025-71' },
  { id: 'VC-002735', numeroProcesso: '08020.007121/2025-12' },
  { id: 'VC-002736', numeroProcesso: '08020.007121/2025-12' },
  { id: 'VC-002737', numeroProcesso: '08020.007121/2025-12' },
  { id: 'VC-002738', numeroProcesso: '08020.007121/2025-12' },
  { id: 'VC-002739', numeroProcesso: '08020.007121/2025-12' },
  { id: 'VC-002740', numeroProcesso: '08020.007121/2025-12' },
  { id: 'VC-002741', numeroProcesso: '08020.009971/2025-55' },
  { id: 'VC-002742', numeroProcesso: '08020.009506/2024-33' },
  { id: 'VC-002743', numeroProcesso: '08020.003687/2025-75' },
  { id: 'VC-002744', numeroProcesso: '08020.002066/2025-74' },
  { id: 'VC-002745', numeroProcesso: '08020.002066/2025-74' },
  { id: 'VC-002746', numeroProcesso: '08020.007095/2025-22' },
  { id: 'VC-002747', numeroProcesso: '08020.007095/2025-22' },
  { id: 'VC-002748', numeroProcesso: '08020.003742/2025-27' },
  { id: 'VC-002749', numeroProcesso: '08020.003742/2025-27' },
  { id: 'VC-002750', numeroProcesso: '08020.007100/2025-05' },
  { id: 'VC-002751', numeroProcesso: '08020.007100/2025-05' },
  { id: 'VC-002752', numeroProcesso: '08020.004111/2025-25' },
  { id: 'VC-002753', numeroProcesso: '08020.009410/2024-75' },
  { id: 'VC-002754', numeroProcesso: '08020.009410/2024-75' },
  { id: 'VC-002755', numeroProcesso: '08020.009410/2024-75' },
  { id: 'VC-002756', numeroProcesso: '08020.009410/2024-75' },
  { id: 'VC-002757', numeroProcesso: '08020.009410/2024-75' },
  { id: 'VC-002758', numeroProcesso: '08020.009410/2024-75' },
  { id: 'VC-002759', numeroProcesso: '08020.009410/2024-75' },
  { id: 'VC-002760', numeroProcesso: '08020.009410/2024-75' },
  { id: 'VC-002761', numeroProcesso: '08020.009410/2024-75' },
  { id: 'VC-002762', numeroProcesso: '08020.009410/2024-75' },
  { id: 'VC-002763', numeroProcesso: '08020.009410/2024-75' },
  { id: 'VC-002764', numeroProcesso: '08020.009410/2024-75' },
  { id: 'VC-002765', numeroProcesso: '08020.009410/2024-75' },
  { id: 'VC-002766', numeroProcesso: '08020.009410/2024-75' },
  { id: 'VC-002767', numeroProcesso: '08020.009410/2024-75' },
  { id: 'VC-002768', numeroProcesso: '08020.001931/2025-65' },
  { id: 'VC-002769', numeroProcesso: '08020.001931/2025-65' },
  { id: 'VC-002770', numeroProcesso: '08020.001931/2025-65' },
  { id: 'VC-002771', numeroProcesso: '08020.001931/2025-65' },
  { id: 'VC-002772', numeroProcesso: '08020.000142/2025-15' },
  { id: 'VC-002773', numeroProcesso: '08020.007105/2025-20' },
  { id: 'VC-002774', numeroProcesso: '08020.007105/2025-20' },
  { id: 'VC-002775', numeroProcesso: '08020.007105/2025-20' },
  { id: 'VC-002776', numeroProcesso: '08020.007105/2025-20' },
  { id: 'VC-002777', numeroProcesso: '08020.001910/2025-40' },
  { id: 'VC-002778', numeroProcesso: '08020.001910/2025-40' },
  { id: 'VC-002779', numeroProcesso: '08020.001910/2025-40' },
  { id: 'VC-002780', numeroProcesso: '08020.001910/2025-40' },
  { id: 'VC-002781', numeroProcesso: '08020.007394/2024-86' },
  { id: 'VC-002782', numeroProcesso: '08020.007394/2024-86' },
  { id: 'VC-002783', numeroProcesso: '08020.007394/2024-86' },
  { id: 'VC-002784', numeroProcesso: '08020.001938/2025-87' },
  { id: 'VC-002785', numeroProcesso: '08020.001938/2025-87' },
  { id: 'VC-002786', numeroProcesso: '08020.001938/2025-87' },
  { id: 'VC-002787', numeroProcesso: '08020.001938/2025-87' },
  { id: 'VC-002788', numeroProcesso: '08020.002077/2025-54' },
  { id: 'VC-002789', numeroProcesso: '08020.009415/2024-06' },
  { id: 'VC-002790', numeroProcesso: '08020.001906/2025-81' },
  { id: 'VC-002791', numeroProcesso: '08020.001906/2025-81' },
  { id: 'VC-002792', numeroProcesso: '08020.001906/2025-81' },
  { id: 'VC-002793', numeroProcesso: '08020.001906/2025-81' },
  { id: 'VC-002794', numeroProcesso: '08020.001906/2025-81' },
  { id: 'VC-002795', numeroProcesso: '08020.001906/2025-81' },
  { id: 'VC-002796', numeroProcesso: '08020.001906/2025-81' },
  { id: 'VC-002797', numeroProcesso: '08020.010082/2024-50' },
  { id: 'VC-002798', numeroProcesso: '08020.007530/2025-19' },
  { id: 'VC-002799', numeroProcesso: '08020.007530/2025-19' },
  { id: 'VC-002800', numeroProcesso: '08020.007530/2025-19' },
  { id: 'VC-002801', numeroProcesso: '08020.007530/2025-19' },
  { id: 'VC-002802', numeroProcesso: '08020.007530/2025-19' },
  { id: 'VC-002803', numeroProcesso: '08020.007530/2025-19' },
  { id: 'VC-002804', numeroProcesso: '08020.007530/2025-19' },
  { id: 'VC-002805', numeroProcesso: '08020.007530/2025-19' },
  { id: 'VC-002806', numeroProcesso: '08020.007530/2025-19' },
  { id: 'VC-002807', numeroProcesso: '08020.007530/2025-19' },
  { id: 'VC-002808', numeroProcesso: '08020.007530/2025-19' },
  { id: 'VC-002809', numeroProcesso: '08020.007530/2025-19' },
  { id: 'VC-002810', numeroProcesso: '08020.007530/2025-19' },
  { id: 'VC-002811', numeroProcesso: '08020.007530/2025-19' },
  { id: 'VC-002812', numeroProcesso: '08020.007530/2025-19' },
  { id: 'VC-002813', numeroProcesso: '08020.007530/2025-19' },
  { id: 'VC-002814', numeroProcesso: '08020.007530/2025-19' },
  { id: 'VC-002815', numeroProcesso: '08020.007530/2025-19' },
  { id: 'VC-002816', numeroProcesso: '08020.007530/2025-19' },
  { id: 'VC-002817', numeroProcesso: '08020.007530/2025-19' },
  { id: 'VC-002818', numeroProcesso: '08020.007530/2025-19' },
  { id: 'VC-002819', numeroProcesso: '08020.007530/2025-19' },
  { id: 'VC-002820', numeroProcesso: '08020.007530/2025-19' },
  { id: 'VC-002821', numeroProcesso: '08020.007530/2025-19' },
  { id: 'VC-002822', numeroProcesso: '08020.004143/2025-21' },
  { id: 'VC-002823', numeroProcesso: '08020.004376/2025-23' },
  { id: 'VC-002824', numeroProcesso: '08020.004376/2025-23' },
  { id: 'VC-002825', numeroProcesso: '08020.004173/2025-37' },
  { id: 'VC-002826', numeroProcesso: '08020.004173/2025-37' },
  { id: 'VC-002827', numeroProcesso: '08020.007674/2024-94' },
  { id: 'VC-002828', numeroProcesso: '08020.004325/2025-00' },
  { id: 'VC-002829', numeroProcesso: '08020.004325/2025-00' },
  { id: 'VC-002830', numeroProcesso: '08020.008158/2025-68' },
  { id: 'VC-002831', numeroProcesso: '08020.008158/2025-68' },
  { id: 'VC-002832', numeroProcesso: '08020.008158/2025-68' },
  { id: 'VC-002833', numeroProcesso: '08020.006372/2025-80' },
  { id: 'VC-002834', numeroProcesso: '08020.006565/2025-31' },
  { id: 'VC-002835', numeroProcesso: '08020.006565/2025-31' },
  { id: 'VC-002836', numeroProcesso: '08020.006565/2025-31' },
  { id: 'VC-002837', numeroProcesso: '08020.004396/2025-02' },
  { id: 'VC-002838', numeroProcesso: '08106.000340/2018-00' },
  { id: 'VC-002873', numeroProcesso: '08106.000340/2018-00' },
  { id: 'VC-002922', numeroProcesso: '08106.000340/2018-00' },
  { id: 'VC-002839', numeroProcesso: '08020.004139/2025-62' },
  { id: 'VC-002840', numeroProcesso: '08020.004139/2025-62' },
  { id: 'VC-002841', numeroProcesso: '08020.004139/2025-62' },
  { id: 'VC-002842', numeroProcesso: '08020.004139/2025-62' },
  { id: 'VC-002843', numeroProcesso: '08020.004139/2025-62' },
  { id: 'VC-002844', numeroProcesso: '08020.004139/2025-62' },
  { id: 'VC-002845', numeroProcesso: '08020.004139/2025-62' },
  { id: 'VC-002846', numeroProcesso: '08020.004139/2025-62' },
  { id: 'VC-002847', numeroProcesso: '08020.004139/2025-62' },
  { id: 'VC-002848', numeroProcesso: '08020.004139/2025-62' },
  { id: 'VC-002849', numeroProcesso: '08020.004139/2025-62' },
  { id: 'VC-002850', numeroProcesso: '08020.004139/2025-62' },
  { id: 'VC-002851', numeroProcesso: '08020.004139/2025-62' },
  { id: 'VC-002928', numeroProcesso: '08020.004139/2025-62' },
  { id: 'VC-002929', numeroProcesso: '08020.004139/2025-62' },
  { id: 'VC-002852', numeroProcesso: '08020.004372/2025-45' },
  { id: 'VC-002853', numeroProcesso: '08106.005695/2015-34' },
  { id: 'VC-003054', numeroProcesso: '08106.005695/2015-34' },
  { id: 'VC-002854', numeroProcesso: '08020.008501/2025-74' },
  { id: 'VC-002855', numeroProcesso: '08020.008501/2025-74' },
  { id: 'VC-002856', numeroProcesso: '08020.008501/2025-74' },
  { id: 'VC-002857', numeroProcesso: '08020.008501/2025-74' },
  { id: 'VC-002858', numeroProcesso: '08020.007923/2025-22' },
  { id: 'VC-002859', numeroProcesso: '08020.007923/2025-22' },
  { id: 'VC-002860', numeroProcesso: '08020.004277/2025-41' },
  { id: 'VC-002861', numeroProcesso: '08020.004277/2025-41' },
  { id: 'VC-002862', numeroProcesso: '08020.004272/2025-19' },
  { id: 'VC-002863', numeroProcesso: '08020.004272/2025-19' },
  { id: 'VC-002864', numeroProcesso: '08020.004169/2025-79' },
  { id: 'VC-002865', numeroProcesso: '08020.004169/2025-79' },
  { id: 'VC-002866', numeroProcesso: '08020.004169/2025-79' },
  { id: 'VC-002867', numeroProcesso: '08020.004169/2025-79' },
  { id: 'VC-002868', numeroProcesso: '08020.004169/2025-79' },
  { id: 'VC-002869', numeroProcesso: '08020.004169/2025-79' },
  { id: 'VC-002870', numeroProcesso: '08020.004169/2025-79' },
  { id: 'VC-002871', numeroProcesso: '08020.008517/2025-87' },
  { id: 'VC-002872', numeroProcesso: '08020.008517/2025-87' },
  { id: 'VC-002874', numeroProcesso: '08020.004382/2025-81' },
  { id: 'VC-002875', numeroProcesso: '08020.011860/2025-17' },
  { id: 'VC-002876', numeroProcesso: '08020.011860/2025-17' },
  { id: 'VC-002877', numeroProcesso: '08020.004316/2025-19' },
  { id: 'VC-002878', numeroProcesso: '08020.004316/2025-19' },
  { id: 'VC-002879', numeroProcesso: '08020.004329/2025-80' },
  { id: 'VC-002880', numeroProcesso: '08020.006610/2025-57' },
  { id: 'VC-002881', numeroProcesso: '08020.006610/2025-57' },
  { id: 'VC-002882', numeroProcesso: '08020.006610/2025-57' },
  { id: 'VC-002883', numeroProcesso: '08020.006610/2025-57' },
  { id: 'VC-002884', numeroProcesso: '08020.006610/2025-57' },
  { id: 'VC-002885', numeroProcesso: '08020.006610/2025-57' },
  { id: 'VC-002886', numeroProcesso: '08020.006610/2025-57' },
  { id: 'VC-002887', numeroProcesso: '08020.006610/2025-57' },
  { id: 'VC-002888', numeroProcesso: '08020.006610/2025-57' },
  { id: 'VC-002889', numeroProcesso: '08020.006629/2025-01' },
  { id: 'VC-002890', numeroProcesso: '08020.006555/2025-03' },
  { id: 'VC-002891', numeroProcesso: '08020.010794/2025-50' },
  { id: 'VC-002892', numeroProcesso: '08020.007531/2025-63' },
  { id: 'VC-002893', numeroProcesso: '08020.011424/2025-30' },
  { id: 'VC-002894', numeroProcesso: '08020.004337/2025-26' },
  { id: 'VC-002895', numeroProcesso: '08020.006437/2025-97' },
  { id: 'VC-002896', numeroProcesso: '08020.006437/2025-97' },
  { id: 'VC-002897', numeroProcesso: '08020.006437/2025-97' },
  { id: 'VC-002898', numeroProcesso: '08020.006437/2025-97' },
  { id: 'VC-002899', numeroProcesso: '08020.007258/2025-77' },
  { id: 'VC-002900', numeroProcesso: '08106.005695/2015-34' },
  { id: 'VC-002901', numeroProcesso: '08020.002025/2025-88' },
  { id: 'VC-002902', numeroProcesso: '08020.002025/2025-88' },
  { id: 'VC-002903', numeroProcesso: '08020.010056/2024-21' },
  { id: 'VC-002904', numeroProcesso: '08020.003496/2025-11' },
  { id: 'VC-002905', numeroProcesso: '08020.003600/2025-60' },
  { id: 'VC-002906', numeroProcesso: '08020.003600/2025-60' },
  { id: 'VC-002907', numeroProcesso: '08020.001926/2025-52' },
  { id: 'VC-002908', numeroProcesso: '08020.003695/2025-11' },
  { id: 'VC-002909', numeroProcesso: '08020.009448/2025-29' },
  { id: 'VC-002910', numeroProcesso: '08020.009448/2025-29' },
  { id: 'VC-002911', numeroProcesso: '08020.009448/2025-29' },
  { id: 'VC-002912', numeroProcesso: '08020.009448/2025-29' },
  { id: 'VC-002913', numeroProcesso: '08020.009448/2025-29' },
  { id: 'VC-002914', numeroProcesso: '08020.009448/2025-29' },
  { id: 'VC-002915', numeroProcesso: '08020.009448/2025-29' },
  { id: 'VC-002916', numeroProcesso: '08020.009448/2025-29' },
  { id: 'VC-002917', numeroProcesso: '08020.009448/2025-29' },
  { id: 'VC-002918', numeroProcesso: '08020.009448/2025-29' },
  { id: 'VC-002919', numeroProcesso: '08020.009448/2025-29' },
  { id: 'VC-002920', numeroProcesso: '08020.009448/2025-29' },
  { id: 'VC-002921', numeroProcesso: '08020.009448/2025-29' },
  { id: 'VC-002923', numeroProcesso: '08020.008490/2025-22' },
  { id: 'VC-002924', numeroProcesso: '08020.008490/2025-22' },
  { id: 'VC-002925', numeroProcesso: '08020.003922/2024-28' },
  { id: 'VC-002926', numeroProcesso: '08020.004323/2025-11' },
  { id: 'VC-002927', numeroProcesso: '08020.004323/2025-11' },
  { id: 'VC-002930', numeroProcesso: '08020.009944/2024-00' },
  { id: 'VC-002931', numeroProcesso: '08020.001915/2025-72' },
];

/**
 * Preenche o Número do Processo dos veículos de 2025 que ainda estavam sem
 * esse dado (1.040 veículos, 323 processos), cruzando o Termo de Doação
 * contra uma planilha de referência com 935 termos numerados em 2025.
 * Mesmas regras de segurança do preenchimento de 2026: só grava onde
 * NumeroProcesso está vazio, não mexe em mais nenhum campo.
 *
 * Como são muitas linhas, grava tudo de uma vez com um único setValues()
 * no final (em vez de uma chamada por linha) — bem mais rápido e evita o
 * erro "Service Spreadsheets failed" que apareceu num lote anterior menor
 * feito linha a linha.
 *
 * Rode manualmente pelo editor (selecione "preencherNumeroProcesso2025" no
 * menu de funções, clique em Executar) — seguro rodar mais de uma vez.
 */
function preencherNumeroProcesso2025() {
  var perfil = exigirPerfilAdmin_();
  var sheet = getOrCreateSheet_(SHEET_VEICULOS, CABECALHO_VEICULOS);
  garantirColunasVeiculos_();

  var valores = sheet.getDataRange().getValues();
  var cabecalho = valores[0];
  var idxId = cabecalho.indexOf('ID');
  var idxNumeroProcesso = cabecalho.indexOf('NumeroProcesso');
  var idxUltimaAtualizacao = cabecalho.indexOf('UltimaAtualizacao');
  var idxAtualizadoPor = cabecalho.indexOf('AtualizadoPor');

  var linhaPorId = {};
  for (var i = 1; i < valores.length; i++) {
    var id = valores[i][idxId];
    if (id) linhaPorId[id] = i;
  }

  var agora = new Date();
  var atualizados = [];
  var jaTinhamProcesso = [];
  var idsNaoEncontrados = [];

  PREENCHER_NUMERO_PROCESSO_2025_.forEach(function (item) {
    var i = linhaPorId[item.id];
    if (i === undefined) { idsNaoEncontrados.push(item.id); return; }
    if (valores[i][idxNumeroProcesso]) { jaTinhamProcesso.push(item.id); return; }
    valores[i][idxNumeroProcesso] = item.numeroProcesso;
    valores[i][idxUltimaAtualizacao] = agora;
    valores[i][idxAtualizadoPor] = perfil.email + ' (preenchimento em massa de Número do Processo - 2025)';
    atualizados.push(item.id);
  });

  if (atualizados.length) {
    sheet.getRange(1, 1, valores.length, cabecalho.length).setValues(valores);
  }

  registrarLog_('PREENCHER_NUMERO_PROCESSO_2025', '-',
    atualizados.length + ' veículo(s) de 2025 tiveram o Número do Processo preenchido. ' +
    jaTinhamProcesso.length + ' já tinham (ignorados). ' + idsNaoEncontrados.length + ' ID(s) não encontrado(s).');
  invalidarCacheDashboard_();

  Logger.log(atualizados.length + ' veículo(s) atualizado(s).');
  if (jaTinhamProcesso.length) Logger.log(jaTinhamProcesso.length + ' já tinham processo (ignorados): ' + jaTinhamProcesso.join(', '));
  if (idsNaoEncontrados.length) Logger.log(idsNaoEncontrados.length + ' ID(s) não encontrado(s) na base: ' + idsNaoEncontrados.join(', '));

  return { atualizados: atualizados.length, jaTinham: jaTinhamProcesso.length, naoEncontrados: idsNaoEncontrados.length };
}

function preencherNumeroProcesso2026Lote2() {
  var perfil = exigirPerfilAdmin_();
  var sheet = getOrCreateSheet_(SHEET_VEICULOS, CABECALHO_VEICULOS);
  garantirColunasVeiculos_();

  var valores = sheet.getDataRange().getValues();
  var cabecalho = valores[0];
  var idxId = cabecalho.indexOf('ID');
  var idxNumeroProcesso = cabecalho.indexOf('NumeroProcesso');
  var idxUltimaAtualizacao = cabecalho.indexOf('UltimaAtualizacao');
  var idxAtualizadoPor = cabecalho.indexOf('AtualizadoPor');

  var linhaPorId = {};
  for (var i = 1; i < valores.length; i++) {
    var id = valores[i][idxId];
    if (id) linhaPorId[id] = i;
  }

  var agora = new Date();
  var atualizados = [];
  var jaTinhamProcesso = [];
  var idsNaoEncontrados = [];

  PREENCHER_NUMERO_PROCESSO_2026_LOTE2_.forEach(function (item) {
    var i = linhaPorId[item.id];
    if (i === undefined) { idsNaoEncontrados.push(item.id); return; }
    if (valores[i][idxNumeroProcesso]) { jaTinhamProcesso.push(item.id); return; }
    valores[i][idxNumeroProcesso] = item.numeroProcesso;
    valores[i][idxUltimaAtualizacao] = agora;
    valores[i][idxAtualizadoPor] = perfil.email + ' (preenchimento em massa de Número do Processo - lote 2)';
    atualizados.push({ id: item.id, linha: i + 1 });
  });

  atualizados.forEach(function (a) {
    sheet.getRange(a.linha, 1, 1, cabecalho.length).setValues([valores[a.linha - 1]]);
  });

  registrarLog_('PREENCHER_NUMERO_PROCESSO_LOTE2', '-',
    atualizados.length + ' veículo(s) tiveram o Número do Processo preenchido (lote 2). ' +
    jaTinhamProcesso.length + ' já tinham (ignorados). ' + idsNaoEncontrados.length + ' ID(s) não encontrado(s) na base.');
  invalidarCacheDashboard_();

  Logger.log(atualizados.length + ' veículo(s) atualizado(s): ' + atualizados.map(function (a) { return a.id; }).join(', '));
  if (jaTinhamProcesso.length) Logger.log(jaTinhamProcesso.length + ' já tinham processo (ignorados): ' + jaTinhamProcesso.join(', '));
  if (idsNaoEncontrados.length) Logger.log(idsNaoEncontrados.length + ' ID(s) não encontrado(s) na base: ' + idsNaoEncontrados.join(', '));

  return { atualizados: atualizados.length, jaTinham: jaTinhamProcesso.length, naoEncontrados: idsNaoEncontrados.length };
}

var PREENCHER_NUMERO_PROCESSO_2025_LOTE2_ = [
  { id: 'VC-001589', numeroProcesso: '08020.008936/2024-38' },
  { id: 'VC-001590', numeroProcesso: '08020.008936/2024-38' },
  { id: 'VC-001593', numeroProcesso: '08020.003696/2024-85' },
  { id: 'VC-001594', numeroProcesso: '08020.003696/2024-85' },
  { id: 'VC-001595', numeroProcesso: '08020.003696/2024-85' },
  { id: 'VC-001596', numeroProcesso: '08020.003696/2024-85' },
  { id: 'VC-001601', numeroProcesso: '08020.009258/2024-21' },
  { id: 'VC-001602', numeroProcesso: '08020.003701/2024-50' },
  { id: 'VC-001603', numeroProcesso: '08020.003692/2024-05' },
  { id: 'VC-001604', numeroProcesso: '08020.003692/2024-05' },
  { id: 'VC-001605', numeroProcesso: '08020.003695/2024-31' },
  { id: 'VC-001606', numeroProcesso: '08020.003695/2024-31' },
  { id: 'VC-001607', numeroProcesso: '08020.003695/2024-31' },
  { id: 'VC-001608', numeroProcesso: '08020.003695/2024-31' },
  { id: 'VC-001609', numeroProcesso: '08020.003690/2024-16' },
  { id: 'VC-001638', numeroProcesso: '08020.003694/2024-96' },
  { id: 'VC-001639', numeroProcesso: '08020.003694/2024-96' },
  { id: 'VC-001651', numeroProcesso: '08020.009626/2024-31' },
  { id: 'VC-001652', numeroProcesso: '08020.009626/2024-31' },
  { id: 'VC-001653', numeroProcesso: '08020.009626/2024-31' },
  { id: 'VC-001654', numeroProcesso: '08020.003676/2024-12' },
  { id: 'VC-001655', numeroProcesso: '08020.009711/2024-07' },
  { id: 'VC-001793', numeroProcesso: '08000.034739/2024-11' },
  { id: 'VC-001794', numeroProcesso: '08000.034739/2024-11' },
  { id: 'VC-001812', numeroProcesso: '08020.003677/2024-59' },
  { id: 'VC-001813', numeroProcesso: '08020.003677/2024-59' },
  { id: 'VC-001866', numeroProcesso: '08020.003700/2024-13' },
  { id: 'VC-001867', numeroProcesso: '08020.003700/2024-13' },
  { id: 'VC-001901', numeroProcesso: '08020.007943/2024-12' },
];

/**
 * Segundo lote do preenchimento de Número do Processo (2025) — 15
 * processos (29 veículos) cujo Termo de Doação é numerado em 2024 (não
 * 2025), cruzados contra uma planilha de referência específica de termos
 * de 2024. Mesmas regras de segurança: só grava onde NumeroProcesso está
 * vazio, grava tudo num único setValues() no final.
 *
 * Rode manualmente pelo editor (selecione
 * "preencherNumeroProcesso2025Lote2" no menu de funções, clique em
 * Executar) — seguro rodar mais de uma vez.
 */
function preencherNumeroProcesso2025Lote2() {
  var perfil = exigirPerfilAdmin_();
  var sheet = getOrCreateSheet_(SHEET_VEICULOS, CABECALHO_VEICULOS);
  garantirColunasVeiculos_();

  var valores = sheet.getDataRange().getValues();
  var cabecalho = valores[0];
  var idxId = cabecalho.indexOf('ID');
  var idxNumeroProcesso = cabecalho.indexOf('NumeroProcesso');
  var idxUltimaAtualizacao = cabecalho.indexOf('UltimaAtualizacao');
  var idxAtualizadoPor = cabecalho.indexOf('AtualizadoPor');

  var linhaPorId = {};
  for (var i = 1; i < valores.length; i++) {
    var id = valores[i][idxId];
    if (id) linhaPorId[id] = i;
  }

  var agora = new Date();
  var atualizados = [];
  var jaTinhamProcesso = [];
  var idsNaoEncontrados = [];

  PREENCHER_NUMERO_PROCESSO_2025_LOTE2_.forEach(function (item) {
    var i = linhaPorId[item.id];
    if (i === undefined) { idsNaoEncontrados.push(item.id); return; }
    if (valores[i][idxNumeroProcesso]) { jaTinhamProcesso.push(item.id); return; }
    valores[i][idxNumeroProcesso] = item.numeroProcesso;
    valores[i][idxUltimaAtualizacao] = agora;
    valores[i][idxAtualizadoPor] = perfil.email + ' (preenchimento em massa de Número do Processo - 2025 lote 2)';
    atualizados.push(item.id);
  });

  if (atualizados.length) {
    sheet.getRange(1, 1, valores.length, cabecalho.length).setValues(valores);
  }

  registrarLog_('PREENCHER_NUMERO_PROCESSO_2025_LOTE2', '-',
    atualizados.length + ' veículo(s) de 2025 (termo de 2024) tiveram o Número do Processo preenchido. ' +
    jaTinhamProcesso.length + ' já tinham (ignorados). ' + idsNaoEncontrados.length + ' ID(s) não encontrado(s).');
  invalidarCacheDashboard_();

  Logger.log(atualizados.length + ' veículo(s) atualizado(s): ' + atualizados.join(', '));
  if (jaTinhamProcesso.length) Logger.log(jaTinhamProcesso.length + ' já tinham processo (ignorados): ' + jaTinhamProcesso.join(', '));
  if (idsNaoEncontrados.length) Logger.log(idsNaoEncontrados.length + ' ID(s) não encontrado(s) na base: ' + idsNaoEncontrados.join(', '));

  return { atualizados: atualizados.length, jaTinham: jaTinhamProcesso.length, naoEncontrados: idsNaoEncontrados.length };
}

/**
 * Importação pontual dos 5 veículos do Ofício nº 480/2026/TRANSV/COLOG/
 * DGFNSP/SENASP/MJ (Termo de Doação SENASP 439/2026, à Secretaria de
 * Estado da Segurança Pública do Paraná — SEI 36509302, Processo
 * 08020.000781/2026-53). Usa importarVeiculosEmLote_ — lê a planilha
 * uma vez só e grava tudo de uma vez, então roda em segundos mesmo com
 * a base já grande. Rode manualmente pelo editor (selecione
 * "importarOficio480_2026" no menu de funções, clique em Executar,
 * depois Ver > Registros/Execuções pra conferir) — função de uso
 * único, pode apagar depois de rodada.
 */
function importarOficio480_2026() {
  var comum = {
    Ano: 2026,
    Mes: 'AGO',
    UF: 'PR',
    Ente: 'Estado',
    Donataria: 'Secretaria de Estado da Segurança Pública do Paraná',
    TermoDoacao: 'Termo de Doação SENASP 439/2026',
    NumeroSei: '36509302',
    NumeroProcesso: '08020.000781/2026-53',
    Descricao: 'TRAILBLAZER LT D4A',
    Marca: 'CHEVROLET',
    CNPJDonataria: '76.416.932/0001-81',
    CEP: '80420170',
    Logradouro: 'Rua Cel. Dulcídio',
    Numero: '800',
    Bairro: 'Batel',
    Municipio: 'Curitiba',
    ValorVeiculo: 289017.00,
    Transferido: 'NÃO'
  };

  // Anexo I do Ofício 480/2026 (o mesmo Termo de Doação 439/2026 tinha
  // esses dados sem o Renavam completo; o ofício trouxe a tabela
  // completa) — Destinação vira Observações, só de referência.
  var veiculos = [
    { Chassi: '9BG156FK0TC443806', Renavam: '1489869651', Placa: 'UIZ2B44', Observacoes: 'Destinação (Anexo I): Corpo de Bombeiros Militar do Estado do Paraná - 1º GBM Curitiba' },
    { Chassi: '9BG156FK0TC443819', Renavam: '1489876089', Placa: 'UIZ2B59', Observacoes: 'Destinação (Anexo I): Polícia Militar do Estado do Paraná - 18º BPM de Cornélio Procópio - PR' },
    { Chassi: '9BG156FK0TC444587', Renavam: '1489889350', Placa: 'UIZ2B91', Observacoes: 'Destinação (Anexo I): Polícia Militar do Estado do Paraná - 15º BPM de Porecatu - PR' },
    { Chassi: '9BG156FK0TC444654', Renavam: '1489898651', Placa: 'UIZ2C06', Observacoes: 'Destinação (Anexo I): Polícia Civil do Estado do Paraná' },
    { Chassi: '9BG156FK0TC444581', Renavam: '1489894010', Placa: 'UIZ2C00', Observacoes: 'Destinação (Anexo I): Polícia Civil do Estado do Paraná' }
  ];

  var resultado = importarVeiculosEmLote_(comum, veiculos);
  Logger.log('Cadastrados: ' + resultado.criados.length + (resultado.criados.length ? '\n' + resultado.criados.join('\n') : ''));
  if (resultado.jaExistiam.length) Logger.log('Já existiam (ignorados): ' + resultado.jaExistiam.length + '\n' + resultado.jaExistiam.join(', '));
  if (resultado.erros.length) Logger.log('Erros: ' + resultado.erros.length + '\n' + resultado.erros.join('\n'));

  var mensagem = resultado.criados.length + ' de ' + veiculos.length + ' veículo(s) cadastrado(s) com sucesso.' +
    (resultado.jaExistiam.length ? ' ' + resultado.jaExistiam.length + ' já existia(m) (ignorado(s)).' : '') +
    (resultado.erros.length ? ' ' + resultado.erros.length + ' com erro — veja Ver > Registros/Execuções.' : '');
  SpreadsheetApp.getActiveSpreadsheet().toast(mensagem, 'Importar Ofício 480/2026', 15);
  return { criados: resultado.criados.length, jaExistiam: resultado.jaExistiam.length, erros: resultado.erros.length, mensagem: mensagem };
}

/**
 * Importação pontual dos 29 veículos do Ofício nº 495/2026/TRANSV/COLOG/
 * DGFNSP/SENASP/MJ (Termo de Doação nº 477/2026, à Secretaria de Estado da
 * Justiça e Segurança Pública do Acre — SEI 36601724, Processo
 * 08020.001379/2026-96, Contrato 269/2025 conforme informado). Rode
 * manualmente pelo editor (selecione "importarOficio495_2026" no menu de
 * funções, clique em Executar) — é seguro rodar mais de uma vez, veículos
 * já cadastrados (mesmo chassi/placa) são ignorados sem duplicar.
 */
function importarOficio495_2026() {
  var comum = {
    Ano: 2026,
    Mes: 'AGO',
    UF: 'AC',
    Ente: 'Estado',
    Donataria: 'Secretaria de Estado da Justiça e Segurança Pública do Acre',
    TermoDoacao: 'Termo de Doação nº 477/2026',
    NumeroSei: '36601724',
    NumeroProcesso: '08020.001379/2026-96',
    Contrato: '269/2025',
    QtdVeiculosContrato: 29,
    Descricao: 'TRAILBLAZER LT D4A',
    Marca: 'CHEVROLET',
    CNPJDonataria: '63.608.947/0001-08',
    CEP: '69900660',
    Logradouro: 'Avenida Getúlio Vargas',
    Numero: '232',
    Bairro: 'Centro',
    Municipio: 'Rio Branco',
    ValorVeiculo: 289017.00,
    Transferido: 'NÃO'
  };

  var veiculos = [
    { Chassi: '9BG156FK0TC445233', Renavam: '1496054056', Placa: 'UJA6E14' },
    { Chassi: '9BG156FK0TC447150', Renavam: '1496058477', Placa: 'UJA6E28' },
    { Chassi: '9BG156FK0TC448127', Renavam: '1496060170', Placa: 'UJA6E32' },
    { Chassi: '9BG156FK0TC447140', Renavam: '1496061796', Placa: 'UJA6E43' },
    { Chassi: '9BG156FK0TC448073', Renavam: '1496069177', Placa: 'UJA6E67' },
    { Chassi: '9BG156FK0TC448043', Renavam: '1496071244', Placa: 'UJA6E79' },
    { Chassi: '9BG156FK0TC448028', Renavam: '1496078176', Placa: 'UJA6E85' },
    { Chassi: '9BG156FK0TC448023', Renavam: '1496097120', Placa: 'UJA6F61' },
    { Chassi: '9BG156FK0TC447773', Renavam: '1496100279', Placa: 'UJA6F69' },
    { Chassi: '9BG156FK0TC446917', Renavam: '1496102530', Placa: 'UJA6F81' },
    { Chassi: '9BG156FK0TC446889', Renavam: '1496104630', Placa: 'UJA6F88' },
    { Chassi: '9BG156FK0TC446880', Renavam: '1496107036', Placa: 'UJA6G01' },
    { Chassi: '9BG156FK0TC446873', Renavam: '1496108580', Placa: 'UJA6G05' },
    { Chassi: '9BG156FK0TC446862', Renavam: '1496109977', Placa: 'UJA6G09' },
    { Chassi: '9BG156FK0TC446801', Renavam: '1496111068', Placa: 'UJA6G11' },
    { Chassi: '9BG156FK0TC449137', Renavam: '1496124933', Placa: 'UJA6G31' },
    { Chassi: '9BG156FK0TC448781', Renavam: '1496126065', Placa: 'UJA6G33' },
    { Chassi: '9BG156FK0TC446131', Renavam: '1496126820', Placa: 'UJA6G34' },
    { Chassi: '9BG156FK0TC446574', Renavam: '1496127290', Placa: 'UJA6G36' },
    { Chassi: '9BG156FK0TC446573', Renavam: '1496129498', Placa: 'UJA6G40' },
    { Chassi: '9BG156FK0TC446569', Renavam: '1496130453', Placa: 'UJA6G42' },
    { Chassi: '9BG156FK0TC446562', Renavam: '1496131557', Placa: 'UJA6G44' },
    { Chassi: '9BG156FK0TC446560', Renavam: '1496132138', Placa: 'UJA6G46' },
    { Chassi: '9BG156FK0TC446602', Renavam: '1496132553', Placa: 'UJA6G47' },
    { Chassi: '9BG156FK0TC446601', Renavam: '1496132928', Placa: 'UJA6G48' },
    { Chassi: '9BG156FK0TC446600', Renavam: '1496133045', Placa: 'UJA6G50' },
    { Chassi: '9BG156FK0TC446598', Renavam: '1496133274', Placa: 'UJA6G51' },
    { Chassi: '9BG156FK0TC446597', Renavam: '1496133720', Placa: 'UJA6G52' },
    { Chassi: '9BG156FK0TC446593', Renavam: '1496134025', Placa: 'UJA6G53' }
  ];

  var resultado = importarVeiculosEmLote_(comum, veiculos);
  Logger.log('Cadastrados: ' + resultado.criados.length + (resultado.criados.length ? '\n' + resultado.criados.join('\n') : ''));
  if (resultado.jaExistiam.length) Logger.log('Já existiam (ignorados): ' + resultado.jaExistiam.length + '\n' + resultado.jaExistiam.join(', '));
  if (resultado.erros.length) Logger.log('Erros: ' + resultado.erros.length + '\n' + resultado.erros.join('\n'));

  var mensagem = resultado.criados.length + ' de ' + veiculos.length + ' veículo(s) cadastrado(s) com sucesso.' +
    (resultado.jaExistiam.length ? ' ' + resultado.jaExistiam.length + ' já existia(m) (ignorado(s)).' : '') +
    (resultado.erros.length ? ' ' + resultado.erros.length + ' com erro — veja Ver > Registros/Execuções.' : '');
  SpreadsheetApp.getActiveSpreadsheet().toast(mensagem, 'Importar Ofício 495/2026', 15);
  return { criados: resultado.criados.length, jaExistiam: resultado.jaExistiam.length, erros: resultado.erros.length, mensagem: mensagem };
}

// ======================================================================
// MIGRAÇÃO — importa e limpa os dados originais (BDADOS2024/2025/2026)
// ======================================================================

var COL_ORIGEM = {
  DONATARIA: 1,
  UF: 2,
  ENTE: 3,
  TERMO: 4,
  DESCRICAO: 6,
  MARCA: 7,
  CHASSI: 8,
  RENAVAM: 9,
  PLACA: 10,
  ANO: 11,
  MES: 12,
  TRANSFERIDO: 13,
  // Coluna "O" das abas de origem — só existe nas versões mais recentes de
  // BDADOS2024/2025/2026 (número do contrato de cada lote/termo).
  CONTRATO: 14
};

function migrarBaseOriginal() {
  exigirPerfilAdmin_();
  var ss = getSpreadsheet_();

  var ui = SpreadsheetApp.getUi();
  var respostaTolerante = ui.alert(
    'Registros antigos incompletos',
    'Alguns registros antigos podem não ter chassi/placa individual para cada veículo — por exemplo, processos em que ' +
    'só foi informada a quantidade total de veículos doados, com um único chassi representando o lote inteiro, ou um ' +
    'chassi digitado fora do padrão de 17 caracteres.\n\n' +
    'Deseja IMPORTAR esses registros mesmo assim (usando um identificador temporário quando faltar chassi ou placa, e ' +
    'mantendo o chassi digitado mesmo que fora do padrão), em vez de pular esses registros?\n\n' +
    'Você pode revisar depois pela aba "' + SHEET_IMPORT_LOG + '".',
    ui.ButtonSet.YES_NO
  );
  var modoTolerante = respostaTolerante === ui.Button.YES;

  var sheetVeiculos = getOrCreateSheet_(SHEET_VEICULOS, CABECALHO_VEICULOS);
  var logSheet = getOrCreateSheet_(SHEET_IMPORT_LOG, CABECALHO_IMPORT_LOG);
  garantirColunasVeiculos_();

  var chassisExistentes = carregarChassisExistentes_(sheetVeiculos);
  var origensExistentes = carregarOrigensExistentes_(sheetVeiculos);
  var linhasNovas = [];
  var logEntradas = [];
  var agora = new Date();
  var perfil = getPerfilUsuarioAtual_();

  // Gera os IDs em memória e só grava o contador uma única vez no final —
  // ler/gravar no PropertiesService a cada linha (milhares de vezes) é o
  // que deixava a migração extremamente lenta.
  var props = PropertiesService.getDocumentProperties();
  var proximoId = Number(props.getProperty('SEQ_VEICULO') || '0');

  var resumo = { lidas: 0, importadas: 0, duplicadas: 0, invalidas: 0 };

  ABAS_ORIGEM_MIGRACAO.forEach(function (nomeAba) {
    var aba = ss.getSheetByName(nomeAba);
    if (!aba) {
      logEntradas.push([agora, nomeAba, '-', 'AVISO', 'Aba não encontrada nesta planilha — nada importado dela.', '', '']);
      return;
    }

    var valores = aba.getDataRange().getValues();
    for (var i = 1; i < valores.length; i++) {
      var linha = valores[i];
      if (linhaVazia_(linha)) continue;
      resumo.lidas++;

      var resultado = processarLinhaOrigem_(linha, nomeAba, i + 1, chassisExistentes, origensExistentes, agora, perfil.email, modoTolerante);

      if (resultado.status === 'OK') {
        proximoId++;
        resultado.linha[0] = 'VC-' + ('000000' + proximoId).slice(-6);
        linhasNovas.push(resultado.linha);
        chassisExistentes[resultado.chassi] = true;
        origensExistentes[nomeAba + '|' + (i + 1)] = true;
        resumo.importadas++;
      } else if (resultado.status === 'DUPLICADO') {
        resumo.duplicadas++;
      } else {
        resumo.invalidas++;
      }
      if (resultado.log) logEntradas.push(resultado.log);
    }
  });

  props.setProperty('SEQ_VEICULO', String(proximoId));

  gravarNovosVeiculos_(sheetVeiculos, linhasNovas, logEntradas, agora);

  logEntradas.push([agora, 'RESUMO', '-', 'INFO',
    'Lidas: ' + resumo.lidas + ' | Importadas: ' + resumo.importadas +
    ' | Duplicadas (ignoradas): ' + resumo.duplicadas + ' | Inválidas (ignoradas): ' + resumo.invalidas,
    '', '']);

  if (logEntradas.length) {
    logSheet.getRange(logSheet.getLastRow() + 1, 1, logEntradas.length, CABECALHO_IMPORT_LOG.length)
      .setValues(logEntradas);
  }

  invalidarCacheDashboard_();

  var mensagem = 'Migração concluída. Lidas: ' + resumo.lidas + ', importadas: ' + resumo.importadas +
    ', duplicadas: ' + resumo.duplicadas + ', inválidas: ' + resumo.invalidas + '. Veja detalhes em "' + SHEET_IMPORT_LOG + '".';
  ss.toast(mensagem, 'Migração', 10);
  return { resumo: resumo, mensagem: mensagem };
}

function gravarNovosVeiculos_(sheetVeiculos, linhasNovas, logEntradas, agora) {
  if (!linhasNovas.length) return;
  try {
    sheetVeiculos.getRange(sheetVeiculos.getLastRow() + 1, 1, linhasNovas.length, CABECALHO_VEICULOS.length)
      .setValues(linhasNovas);
  } catch (erroLote) {
    var chassiCol = colunaParaIndice_('Chassi');
    linhasNovas.forEach(function (linha) {
      try {
        sheetVeiculos.appendRow(linha);
      } catch (erroLinha) {
        logEntradas.push([agora, 'GRAVACAO', '-', 'ERRO',
          'Falha ao gravar linha (valor rejeitado pela planilha): ' + erroLinha.message,
          linha[chassiCol], '']);
      }
    });
  }
}

// Considera a linha "vazia" olhando só pros campos que realmente identificam
// um veículo/doação (Donatária, Ente, Chassi, Placa) — não pra linha inteira.
// Duas causas já vistas de linha em branco não ser reconhecida como tal:
// 1) planilhas ligadas ao PowerApps preenchem um __PowerAppsId__ (e às vezes
//    um "\n" perdido) em linhas do resto totalmente em branco;
// 2) checkbox/dropdown de formatação de tabela aplicado além da última linha
//    realmente preenchida — ex.: um checkbox de "Transferido" desmarcado lê
//    como "false" (não como vazio) mesmo numa linha sem nenhum dado real.
// Em ambos os casos, se Donatária/Ente/Chassi/Placa estão todos em branco,
// não há veículo de verdade ali, mesmo que alguma coluna auxiliar carregue
// esse tipo de valor residual — daí checar só essas quatro, e não a linha
// inteira, senão a linha seguia pra validação completa e virava um "Ente
// desconhecido" (ou similar) só por ruído de linha de template sem dado.
function linhaVazia_(linha) {
  var CAMPOS_IDENTIFICADORES_ = ['DONATARIA', 'ENTE', 'CHASSI', 'PLACA'];
  return CAMPOS_IDENTIFICADORES_.every(function (campo) {
    var v = linha[COL_ORIGEM[campo]];
    return v === '' || v === null || v === undefined || String(v).trim() === '';
  });
}

/**
 * Reconcilia a aba Veiculos com uma versão atualizada/corrigida das abas de
 * origem (BDADOS2024/2025/2026) — use depois de substituir essas 3 abas por
 * uma base mais confiável (chassi/placa/renavam corrigidos, duplicidades
 * entre abas removidas etc.), quando Veiculos já tem operações em andamento
 * (Transferido, ATPVe, Valor, endereço, Processo) que não podem ser
 * perdidas rodando a migração do zero de novo.
 *
 * Ao contrário de migrarBaseOriginal (que rastreia o que já foi migrado
 * pelo par "aba+linha", e por isso trata tudo como "novo" se a planilha de
 * origem foi reordenada), esta função casa os registros pelo CHASSI — a
 * única forma confiável de saber que "é o mesmo veículo" depois que a
 * planilha de origem foi limpa/reordenada. Por isso, se o chassi de um
 * veículo foi corrigido na origem (ex.: tinha um caractere errado), ele
 * entra como um cadastro NOVO — o registro antigo com o chassi errado
 * continua em Veiculos e aparece no aviso de "sumiram da origem" no final,
 * pra você decidir se apaga ou corrige manualmente.
 *
 * Para cada linha válida das abas de origem:
 * - Chassi já existe em Veiculos: ATUALIZA só os campos "de origem" (Ano,
 *   Mês, UF, Ente, Donatária, Termo de Doação, Descrição, Marca, Renavam,
 *   Placa) — nunca mexe em ID, Transferido, DataTransferencia, ATPVe,
 *   Valor, endereço, Processo/Contrato ou Observações: isso é trabalho
 *   operacional já feito no site.
 * - Chassi novo: cadastra como veículo novo (mesma validação/modo
 *   tolerante de migrarBaseOriginal, sempre tolerante aqui porque a base já
 *   foi revisada manualmente antes desta reconciliação).
 *
 * Ao final, lista em ImportacaoLog (sem apagar nada) os veículos que já
 * estavam em Veiculos vindos de uma migração anterior, mas cujo chassi não
 * aparece mais em nenhuma das 3 abas de origem — pode ser um duplicado
 * removido de propósito na limpeza, ou algo que sumiu por engano.
 */
function reconciliarBaseOrigem() {
  exigirPerfilAdmin_();
  var ss = getSpreadsheet_();
  var sheetVeiculos = getOrCreateSheet_(SHEET_VEICULOS, CABECALHO_VEICULOS);
  var logSheet = getOrCreateSheet_(SHEET_IMPORT_LOG, CABECALHO_IMPORT_LOG);
  garantirColunasVeiculos_();

  var perfil = getPerfilUsuarioAtual_();
  var agora = new Date();

  var idxChassiV = colunaParaIndice_('Chassi');
  var idxObsV = colunaParaIndice_('Observacoes');
  var idxNumeroSei = colunaParaIndice_('NumeroSei');
  var CAMPOS_ATUALIZAVEIS = ['Ano', 'Mes', 'UF', 'Ente', 'Donataria', 'TermoDoacao', 'Descricao', 'Marca', 'Renavam', 'Placa'];
  var idxAtualizacao = colunaParaIndice_('UltimaAtualizacao');
  var idxAtualizadoPor = colunaParaIndice_('AtualizadoPor');

  var ultimaLinha = sheetVeiculos.getLastRow();
  var dadosVeiculos = ultimaLinha >= 2
    ? sheetVeiculos.getRange(2, 1, ultimaLinha - 1, CABECALHO_VEICULOS.length).getValues()
    : [];

  var chassiParaIndice = {}; // chassi normalizado -> índice em dadosVeiculos
  var chassisMigrados = {}; // chassi normalizado -> true, se veio de uma migração anterior
  dadosVeiculos.forEach(function (linhaV, indice) {
    var chassiV = normalizarChassi_(linhaV[idxChassiV]);
    if (!chassiV) return;
    chassiParaIndice[chassiV] = indice;
    if (REGEX_ORIGEM_OBSERVACOES.test(String(linhaV[idxObsV] || ''))) {
      chassisMigrados[chassiV] = true;
    }
  });

  var chassisExistentes = {}; // usado por processarLinhaOrigem_ pra evitar colisão entre linhas novas
  Object.keys(chassiParaIndice).forEach(function (c) { chassisExistentes[c] = true; });
  var chassisNaOrigemAtual = {};

  var props = PropertiesService.getDocumentProperties();
  var proximoId = Number(props.getProperty('SEQ_VEICULO') || '0');

  var linhasNovas = [];
  var logEntradas = [];
  var atualizados = 0, novos = 0, invalidos = 0;

  ABAS_ORIGEM_MIGRACAO.forEach(function (nomeAba) {
    var aba = ss.getSheetByName(nomeAba);
    if (!aba) {
      logEntradas.push([agora, nomeAba, '-', 'AVISO', 'Aba não encontrada nesta planilha — nada reconciliado dela.', '', '']);
      return;
    }
    var valores = aba.getDataRange().getValues();

    for (var i = 1; i < valores.length; i++) {
      var linha = valores[i];
      if (linhaVazia_(linha)) continue;
      var numLinha = i + 1;

      var chassi = normalizarChassi_(linha[COL_ORIGEM.CHASSI]);
      if (!chassi) continue; // sem chassi real na origem — não dá pra casar com segurança, revise manualmente
      chassisNaOrigemAtual[chassi] = true;

      var indiceExistente = chassiParaIndice[chassi];
      if (indiceExistente !== undefined) {
        var uf = normalizarUF_(linha[COL_ORIGEM.UF]) || UF_NAO_INFORMADA;
        var mes = normalizarTexto_(linha[COL_ORIGEM.MES]).toUpperCase();
        mes = MESES_ALIAS[mes] || mes;
        // O Termo de Doação na origem costuma trazer o Número SEI embutido
        // entre parênteses (ex.: "165/2023 (24860169)") — separa aqui pra
        // TermoDoacao e NumeroSei ficarem em campos distintos, sem precisar
        // rodar corrigirNumeroSeiDoTermo depois de cada reconciliação.
        var separadoSei = separarNumeroSeiDoTermo_(linha[COL_ORIGEM.TERMO]);
        var novosValores = {
          Ano: parseInt(linha[COL_ORIGEM.ANO], 10) || linha[COL_ORIGEM.ANO],
          Mes: mes,
          UF: uf,
          Ente: normalizarTexto_(linha[COL_ORIGEM.ENTE]),
          Donataria: normalizarTexto_(linha[COL_ORIGEM.DONATARIA]),
          TermoDoacao: separadoSei.termo,
          Descricao: normalizarTexto_(linha[COL_ORIGEM.DESCRICAO]),
          Marca: normalizarMarca_(linha[COL_ORIGEM.MARCA]),
          Renavam: normalizarTexto_(linha[COL_ORIGEM.RENAVAM]).replace(/\D/g, ''),
          Placa: normalizarPlaca_(linha[COL_ORIGEM.PLACA])
        };
        var linhaV = dadosVeiculos[indiceExistente];
        CAMPOS_ATUALIZAVEIS.forEach(function (campo) {
          linhaV[colunaParaIndice_(campo)] = novosValores[campo];
        });
        // Só grava o SEI extraído se achou algum — senão preserva o que já
        // estava (pode ter sido informado manualmente pela tela).
        if (separadoSei.numeroSei) {
          linhaV[idxNumeroSei] = separadoSei.numeroSei;
        }
        linhaV[idxAtualizacao] = agora;
        linhaV[idxAtualizadoPor] = perfil.email + ' (reconciliação com origem)';
        atualizados++;
      } else {
        var resultado = processarLinhaOrigem_(linha, nomeAba, numLinha, chassisExistentes, {}, agora, perfil.email, true);
        if (resultado.status === 'OK') {
          proximoId++;
          resultado.linha[0] = 'VC-' + ('000000' + proximoId).slice(-6);
          linhasNovas.push(resultado.linha);
          chassisExistentes[resultado.chassi] = true;
          novos++;
        } else {
          invalidos++;
        }
        if (resultado.log) logEntradas.push(resultado.log);
      }
    }
  });

  if (dadosVeiculos.length) {
    sheetVeiculos.getRange(2, 1, dadosVeiculos.length, CABECALHO_VEICULOS.length).setValues(dadosVeiculos);
  }
  props.setProperty('SEQ_VEICULO', String(proximoId));
  gravarNovosVeiculos_(sheetVeiculos, linhasNovas, logEntradas, agora);

  // Veículos migrados antes que sumiram da origem atual — só reporta, nunca apaga.
  var sumidos = Object.keys(chassisMigrados).filter(function (c) { return !chassisNaOrigemAtual[c]; });
  if (sumidos.length) {
    logEntradas.push([agora, 'RECONCILIACAO', '-', 'AVISO',
      'Estes ' + sumidos.length + ' chassi(s) estavam em Veiculos (de uma migração anterior) mas não aparecem mais em ' +
      'nenhuma das 3 abas de origem — revise manualmente se devem ser removidos: ' + sumidos.join(', '),
      '', '']);
  }

  logEntradas.push([agora, 'RESUMO', '-', 'INFO',
    'Reconciliação: atualizados: ' + atualizados + ' | novos: ' + novos + ' | inválidos (ignorados): ' + invalidos +
    ' | sumidos da origem (revisar): ' + sumidos.length,
    '', '']);

  if (logEntradas.length) {
    logSheet.getRange(logSheet.getLastRow() + 1, 1, logEntradas.length, CABECALHO_IMPORT_LOG.length)
      .setValues(logEntradas);
  }

  invalidarCacheDashboard_();

  var mensagem = 'Reconciliação concluída. Atualizados: ' + atualizados + ', novos: ' + novos +
    ', inválidos: ' + invalidos + ', sumidos da origem (revisar): ' + sumidos.length +
    '. Veja detalhes em "' + SHEET_IMPORT_LOG + '".';
  ss.toast(mensagem, 'Reconciliação', 10);
  return { atualizados: atualizados, novos: novos, invalidos: invalidos, sumidos: sumidos, mensagem: mensagem };
}

/**
 * AÇÃO IRREVERSÍVEL: apaga TODOS os veículos já cadastrados em Veiculos —
 * Transferido, ATPVe emitido/enviado, Valor, endereço, Número de
 * Processo/Contrato, tudo — e migra do zero só com o que estiver nas abas
 * BDADOS2024/2025/2026 agora. Mantém a estrutura de colunas (CABECALHO_
 * VEICULOS) intacta, só esvazia as linhas de dado.
 *
 * Ao contrário de reconciliarBaseOrigem (que preserva o que já existe),
 * esta função existe especificamente para quando a base de origem foi
 * reconstruída do zero e não deve sobrar nenhum vestígio da base antiga.
 * Pede confirmação explícita antes de apagar qualquer coisa.
 */
function zerarVeiculosERemigrar() {
  exigirPerfilAdmin_();
  var ss = getSpreadsheet_();
  var ui = SpreadsheetApp.getUi();

  var confirmacao = ui.alert(
    'Apagar toda a base de veículos?',
    'Isso vai apagar TODOS os veículos já cadastrados em "Veiculos" (Transferido, ATPVe, Valor, endereço, Processo — ' +
    'tudo) e recriar a aba do zero só com o que estiver nas abas BDADOS2024/2025/2026 agora. Essa ação não pode ser ' +
    'desfeita.\n\nTem certeza que quer continuar?',
    ui.ButtonSet.YES_NO
  );
  if (confirmacao !== ui.Button.YES) {
    ss.toast('Operação cancelada — nada foi apagado.', 'Cancelado', 5);
    return { cancelado: true };
  }

  var sheetVeiculos = getOrCreateSheet_(SHEET_VEICULOS, CABECALHO_VEICULOS);
  var ultimaLinha = sheetVeiculos.getLastRow();
  if (ultimaLinha >= 2) {
    sheetVeiculos.getRange(2, 1, ultimaLinha - 1, sheetVeiculos.getLastColumn()).clearContent();
  }

  PropertiesService.getDocumentProperties().setProperty('SEQ_VEICULO', '0');
  invalidarCacheDashboard_();
  ss.toast('Base de veículos zerada. Iniciando migração...', 'Zerar e remigrar', 5);

  return migrarBaseOriginal();
}

/**
 * Importa o número do Contrato (coluna "O" das abas BDADOS2024/2025/2026)
 * para o campo Contrato de cada veículo já cadastrado em Veiculos, casando
 * por Chassi. Só preenche esse único campo — não mexe em mais nada (nem
 * cria veículo novo, nem apaga). Linhas de origem sem Contrato preenchido,
 * ou cujo chassi não é encontrado em Veiculos, são ignoradas.
 */
function importarContratoDaOrigem() {
  exigirPerfilAdmin_();
  var ss = getSpreadsheet_();
  var sheetVeiculos = getOrCreateSheet_(SHEET_VEICULOS, CABECALHO_VEICULOS);
  var logSheet = getOrCreateSheet_(SHEET_IMPORT_LOG, CABECALHO_IMPORT_LOG);
  garantirColunasVeiculos_();

  var perfil = getPerfilUsuarioAtual_();
  var agora = new Date();

  var idxChassiV = colunaParaIndice_('Chassi');
  var idxContratoV = colunaParaIndice_('Contrato');
  var idxAtualizacao = colunaParaIndice_('UltimaAtualizacao');
  var idxAtualizadoPor = colunaParaIndice_('AtualizadoPor');

  // Trava a coluna Contrato como texto puro ANTES de gravar — números de
  // contrato como "07/2017" ou "8/2025" parecem data pro autoparser do
  // Sheets, que os converte sozinho se a coluna não estiver travada (foi
  // assim que a corrupção que corrigirContratosCorrompidos_ conserta
  // aconteceu da primeira vez).
  sheetVeiculos.getRange(2, idxContratoV + 1, sheetVeiculos.getMaxRows() - 1, 1).setNumberFormat('@');

  var ultimaLinha = sheetVeiculos.getLastRow();
  var dadosVeiculos = ultimaLinha >= 2
    ? sheetVeiculos.getRange(2, 1, ultimaLinha - 1, CABECALHO_VEICULOS.length).getValues()
    : [];

  var chassiParaIndice = {};
  dadosVeiculos.forEach(function (linhaV, indice) {
    var chassiV = normalizarChassi_(linhaV[idxChassiV]);
    if (chassiV) chassiParaIndice[chassiV] = indice;
  });

  var preenchidos = 0, semChassiCorrespondente = 0;

  ABAS_ORIGEM_MIGRACAO.forEach(function (nomeAba) {
    var aba = ss.getSheetByName(nomeAba);
    if (!aba) return;
    var valores = aba.getDataRange().getValues();

    for (var i = 1; i < valores.length; i++) {
      var linha = valores[i];
      if (linhaVazia_(linha)) continue;

      var contrato = normalizarTexto_(linha[COL_ORIGEM.CONTRATO]);
      if (!contrato) continue;

      var chassi = normalizarChassi_(linha[COL_ORIGEM.CHASSI]);
      if (!chassi) continue;

      var indiceExistente = chassiParaIndice[chassi];
      if (indiceExistente === undefined) {
        semChassiCorrespondente++;
        continue;
      }

      dadosVeiculos[indiceExistente][idxContratoV] = contrato;
      dadosVeiculos[indiceExistente][idxAtualizacao] = agora;
      dadosVeiculos[indiceExistente][idxAtualizadoPor] = perfil.email + ' (importação de Contrato)';
      preenchidos++;
    }
  });

  if (dadosVeiculos.length) {
    sheetVeiculos.getRange(2, 1, dadosVeiculos.length, CABECALHO_VEICULOS.length).setValues(dadosVeiculos);
  }

  logSheet.getRange(logSheet.getLastRow() + 1, 1, 1, CABECALHO_IMPORT_LOG.length).setValues([[
    agora, 'IMPORTAR_CONTRATO', '-', 'INFO',
    'Contratos preenchidos: ' + preenchidos + ' | Linhas de origem com contrato mas sem chassi correspondente em Veiculos: ' + semChassiCorrespondente,
    '', ''
  ]]);

  invalidarCacheDashboard_();

  var mensagem = 'Contratos preenchidos: ' + preenchidos +
    (semChassiCorrespondente ? '. ' + semChassiCorrespondente + ' linha(s) com contrato não encontraram o chassi em Veiculos (veja "' + SHEET_IMPORT_LOG + '").' : '.');
  ss.toast(mensagem, 'Importar Contrato', 10);
  return { preenchidos: preenchidos, semChassiCorrespondente: semChassiCorrespondente, mensagem: mensagem };
}

/**
 * Repara veículos cujo Contrato foi corrompido pelo autoparser de data do
 * Google Sheets: números de contrato no formato "MM/AAAA" (ex.: "07/2017")
 * foram digitados numa aba de origem sem a coluna travada como texto, o
 * Sheets sozinho interpretou como data, e importarContratoDaOrigem acabou
 * copiando esse valor já corrompido pra Veiculos — virando um texto longo
 * tipo "Sat Jul 01 2017 00:00:00 GMT-0300 (Horário Padrão de Brasília)".
 *
 * Detecta os dois formatos que a corrupção pode assumir (um objeto Date de
 * verdade na célula, ou o texto gerado por Date.toString()), reconstrói o
 * "MM/AAAA" original a partir do mês/ano da própria data corrompida — sem
 * precisar re-consultar a aba de origem, que pode estar com o mesmo
 * problema — e trava a coluna como texto antes de gravar, pra não
 * corromper de novo. Rode manualmente pelo menu "Base de Veículos" depois
 * de implantar esta versão.
 */
function corrigirContratosCorrompidos_() {
  exigirPerfilAdmin_();
  var sheet = getOrCreateSheet_(SHEET_VEICULOS, CABECALHO_VEICULOS);
  var idxContrato = colunaParaIndice_('Contrato');
  var idxChassi = colunaParaIndice_('Chassi');
  var idxPlaca = colunaParaIndice_('Placa');
  var idxAtualizacao = colunaParaIndice_('UltimaAtualizacao');
  var idxAtualizadoPor = colunaParaIndice_('AtualizadoPor');
  var ultimaLinha = sheet.getLastRow();
  if (ultimaLinha < 2) {
    return { corrigidos: 0, mensagem: 'Nenhum veículo cadastrado.' };
  }

  var dados = sheet.getRange(2, 1, ultimaLinha - 1, CABECALHO_VEICULOS.length).getValues();
  var padraoDateToString = /^[A-Za-z]{3} [A-Za-z]{3} \d{2} \d{4} \d{2}:\d{2}:\d{2} GMT[+-]\d{4}/;
  var perfil = getPerfilUsuarioAtual_();
  var agora = new Date();
  var corrigidos = [];

  dados.forEach(function (linha) {
    var valor = linha[idxContrato];
    var data = null;
    if (Object.prototype.toString.call(valor) === '[object Date]' && !isNaN(valor.getTime())) {
      data = valor;
    } else if (typeof valor === 'string' && padraoDateToString.test(valor.trim())) {
      var tentativa = new Date(valor);
      if (!isNaN(tentativa.getTime())) data = tentativa;
    }
    if (!data) return;

    var mes = data.getMonth() + 1;
    var novoValor = (mes < 10 ? '0' + mes : String(mes)) + '/' + data.getFullYear();
    corrigidos.push({ chassi: linha[idxChassi], placa: linha[idxPlaca], de: String(valor), para: novoValor });
    linha[idxContrato] = novoValor;
    linha[idxAtualizacao] = agora;
    linha[idxAtualizadoPor] = perfil.email + ' (correção de Contrato corrompido)';
  });

  if (!corrigidos.length) {
    return { corrigidos: 0, mensagem: 'Nenhum Contrato corrompido encontrado — nada pra corrigir.' };
  }

  // Trava a coluna como texto ANTES de gravar, senão o Sheets corrompe de
  // novo os valores "MM/AAAA" que estamos prestes a escrever.
  sheet.getRange(2, idxContrato + 1, sheet.getMaxRows() - 1, 1).setNumberFormat('@');
  sheet.getRange(2, 1, dados.length, CABECALHO_VEICULOS.length).setValues(dados);

  registrarLog_('CORRIGIR_CONTRATOS', '-', 'Contratos corrigidos: ' + corrigidos.length + ' — ' + JSON.stringify(corrigidos));
  invalidarCacheDashboard_();

  var mensagem = corrigidos.length + ' contrato(s) corrompido(s) corrigido(s) com sucesso.';
  SpreadsheetApp.getActiveSpreadsheet().toast(mensagem, 'Corrigir Contratos', 10);
  return { corrigidos: corrigidos.length, detalhes: corrigidos, mensagem: mensagem };
}

/**
 * Mapa chassi -> valor (R$) apurado a partir de uma planilha de controle de
 * contratos/legado (fora do Google Sheets — não é uma das abas BDADOS),
 * cruzado uma única vez com os chassis já cadastrados em Veiculos. Usado só
 * por importarValorLegado — se a base mudar de novo, gere um mapa novo e
 * substitua esta constante.
 */
var MAPA_VALOR_LEGADO_POR_CHASSI_ = {"3N1AB8AE0TY200350": 168082.82, "3N1AB8AE0TY200395": 168082.82, "3N1AB8AE2TY200379": 168082.82, "3N1AB8AE3TY200388": 168082.82, "3N1AB8AE0TY200722": 168082.82, "3N1AB8AE5TY200540": 168082.82, "93XSYKL1TSCR90430": 270774.0, "93XSYKL1TSCR90439": 270774.0, "93XSYKL1TSCR90446": 270774.0, "93XSYKL1TSCR90456": 270774.0, "8AP359AFTSU409718": 115435.99, "8AP359AFTSU419063": 115435.99, "8AP359AFTSU427813": 115435.99, "8AP359AFTSU430921": 115435.99, "8AP359AFTSU430965": 115435.99, "8AP359AFTSU428722": 115435.99, "8AP359AFTSU433328": 115435.99, "8AP359AFTSU401710": 115435.99, "8AP359AFTSU414242": 115435.99, "8AP359AFWRU373458": 115435.99, "8AP359AFWRU379204": 115435.99, "93XSYKL1TSCR91164": 251671.0, "9BRBC3F31S8336434": 127800.0, "9BRBC3F33S8336533": 127800.0, "9BRBC3F38R8297335": 127800.0, "9BRBC3F39R8296887": 127800.0, "9BRBC3F30R8296194": 127800.0, "9BRBC3F31R8298956": 127800.0, "9BRBC3F35R8298720": 127800.0, "9BRBC3F3XR8298681": 127800.0, "9BRBC3F32R8296147": 127800.0, "9BRBC3F34R8295856": 127800.0, "9BRBC3F35R8295381": 127800.0, "9BRBC3F36R8296216": 127800.0, "9BRBC3F31R8298732": 127800.0, "9BRBC3F39R8297828": 127800.0, "93XTYKL1TSCR80124": 313406.0, "93XTYKL1TSCR80126": 313406.0, "93XTYKL1TSCR80128": 313406.0, "93XTYKL1TSCR80131": 313406.0, "93XPYKL1TSCR79982": 313402.0, "93XPYKL1TSCR79990": 313402.0, "93XPYKL1TSCR80099": 313402.0, "93XPYKL1TSCR80102": 313402.0, "93XSYKL1TSCR80039": 310926.0, "93XTYKL1TSCR80248": 313406.0, "93XTYKL1TSCR80299": 313406.0, "93XTYKL1TSCR80320": 313406.0, "93XTYKL1TSCR80328": 313406.0, "93XPYKL1TSCR79622": 313402.0, "8AP359AFXRU339385": 115435.99, "8AP359AFXRU341515": 115435.99, "8AP359AFXRU347951": 115435.99, "8AP359AFXRU360390": 115435.99, "93XTYKL1TRCP77558": 313406.0, "93XTYKL1TRCP77587": 313406.0, "93XTYKL1TRCP77875": 313406.0, "93XTYKL1TRCP77902": 313406.0, "93XTYKL1TRCP77997": 313406.0, "93XTYKL1TRCP78007": 313406.0, "9BM951104NB279946": 413195.0, "93XSYKL1TNCM44827": 177200.0, "93YF62S07TJ449028": 344772.73, "93YF62S08TJ449023": 344772.73, "93XSYKL1TSCS93051": 318282.34, "93XSYKL1TSCS93052": 318282.34, "93XSYKL1TSCS93053": 318282.34, "93XSYKL1TSCS93037": 318282.34, "93XSYKL1TSCS93038": 318282.34, "9BG156FK0TC429281": 305861.89, "91JPWC601S1000703": 9798.0, "9535E6TB4TR003695": 1420000.0, "93XSYKL1TSCR90625": 270774.0, "8AP359AFTSU431101": 115435.99, "8AP359AFTSU431103": 115435.99, "8AP359AFTSU406393": 115435.99, "8AP359AFTSU423778": 115435.99, "8AP359AFTSU433070": 115435.99, "8AP359AFTSU433395": 115435.99, "8AP359AFTSU435929": 115435.99, "8AP359AFTSU435982": 115435.99, "93XSYKL1TSCR85951": 270774.0, "93XSYKL1TSCR86812": 270774.0, "93XSYKL1TSCR86817": 270774.0, "9BRBC3F36R8298595": 127600.0, "9BRBC3F37R8297584": 127600.0, "9BRBC3F38R8297044": 127600.0, "9BRBC3F3XR8298177": 127400.0, "93XTYKL1TSCR80858": 313406.0, "93XTYKL1TSCR80862": 313406.0, "93XTYKL1TSCR80865": 313406.0, "9BRBC3F30R8267732": 127600.0, "9BRBC3F30R8269108": 127600.0, "9BRBC3F33R8269006": 127600.0, "9BRBC3F35R8269234": 127600.0, "9BRBC3F36R8270201": 127600.0, "9BRBC3F37R8270188": 127600.0, "93XTYKL1TSCR79650": 313406.0, "93XTYKL1TRCP77449": 313406.0, "93XTYKL1TRCP77736": 313406.0, "93XTYKL1TRCP77801": 313406.0, "93XTYKL1TRCP77877": 313406.0, "93XTYKL1TRCP77924": 313406.0, "93Y5SRJSXPJ312338": 92150.0, "93Y5SRJSXPJ312353": 92150.0, "3N1AB8AE3TY200911": 168082.82, "3N1AB8AE6TY200949": 168082.82, "93XSYKL1TSCR90517": 270774.0, "93XSYKL1TSCR90527": 270774.0, "93XSYKL1TSCR90535": 270774.0, "8AP359AFTSU431089": 115435.99, "8AP359AFTSU432620": 115435.99, "8AP359AFTSU433567": 115435.99, "8AP359AFTSU434368": 115435.99, "8AP359AFTSU434373": 115435.99, "8AP359AFTSU435219": 115435.99, "8AP359AFTSU435997": 115435.99, "8AP359AFTSU427906": 115435.99, "9321FHMJ2DD658688": 53449.0, "9321FHMJ6DD658709": 53449.0, "93XSYKL1TSCR91153": 263934.95, "93XSYKL1TSCR91201": 263934.95, "9BRBC3F34R8297638": 127800.0, "8AFAR23L2JJ057509": 145584.0, "8AFAR23L8JJ039452": 145584.0, "9BRBC3F34R8269936": 127600.0, "9BRBC3F3XR8271111": 127600.0, "9BRBC3F31R8271658": 127600.0, "9BRBC3F3XR8273084": 127600.0, "93XTYKL1TSCR80216": 313406.0, "93XTYKL1TSCR80333": 313406.0, "93XPYKL1TSCR79705": 313402.0, "93XPYKL1TSCR79709": 313402.0, "93XSYKL1TSCR80041": 310926.0, "93XSYKL1TSCR80044": 310926.0, "93XTYKL1TSCR80047": 310406.0, "93XTYKL1TSCR80049": 310406.0, "93XTYKL1TSCR80051": 310406.0, "93XTYKL1TSCR80053": 310406.0, "93XTYKL1TSCR80056": 310406.0, "93XTYKL1TSCR80059": 310406.0, "93XTYKL1TSCR80061": 310406.0, "93XTYKL1TSCR80063": 310406.0, "93XTYKL1TSCR80065": 310406.0, "93XTYKL1TSCR80068": 310406.0, "93XTYKL1TSCR80165": 313406.0, "93XTYKL1TSCR80172": 313406.0, "93XTYKL1TSCR80199": 313406.0, "93XTYKL1TSCR80202": 313406.0, "93XTYKL1TSCR80209": 313406.0, "93XTYKL1TSCR80211": 313406.0, "93XTYKL1TSCR80219": 313406.0, "93XTYKL1TSCR80253": 313406.0, "93XTYKL1TSCR80277": 313406.0, "93XTYKL1TSCR80297": 313406.0, "93XTYKL1TSCR80301": 313406.0, "93XTYKL1TSCR80306": 313406.0, "93XTYKL1TSCR80323": 313406.0, "93XTYKL1TSCR80326": 313406.0, "93XTYKL1TSCR79595": 313406.0, "93XTYKL1TSCR79597": 313406.0, "93XTYKL1TSCR79599": 313406.0, "93XTYKL1TRCP77459": 313406.0, "93XTYKL1TRCP77790": 313406.0, "93XTYKL1TRCP77825": 313406.0, "93XTYKL1TRCP77864": 313406.0, "93XTYKL1TRCP77949": 313406.0, "93XTYKL1TRCP78020": 313406.0, "9BRBC3F31R8268338": 127600.0, "9BRBC3F33R8269619": 127600.0, "9BRBC3F35R8269718": 127600.0, "9BRBC3F36R8268710": 127600.0, "9BRBC3F37R8268957": 127600.0, "9BRBC3F39R8268331": 127600.0, "9BM951104NB278918": 413195.0, "9BRBC3F30R8267360": 127600.0, "9BRBC3F30R8267469": 127600.0, "9BRBC3F31R8267450": 127600.0, "9BRBC3F32R8267392": 127600.0, "9BRBC3F32R8267649": 127600.0, "9BRBC3F33R8267725": 127600.0, "9BRBC3F34R8267619": 127600.0, "9BRBC3F37R8269316": 127600.0, "9BRBC3F39R8267437": 127600.0, "93XSYKL1TNCM44777": 177200.0, "93XSYKL1TNCM39965": 186000.0, "93XSYKL1TNCM41902": 186000.0, "3N1AB8AE6TY200384": 172000.0, "3N1AB8AE0TY200381": 172000.0, "3N1AB8AE1TY200342": 172000.0, "3N1AB8AE1TY200406": 172000.0, "3N1AB8AE5TY200943": 168082.82, "3N1AB8AE7TY201009": 168082.82, "3N1AB8AEXTY200937": 168082.82, "3N1AB8AEXTY201148": 168082.82, "3N1AB8AE5TY200683": 172000.0, "3N1AB8AE5TY200716": 172000.0, "93XSYKL1TSCS93104": 263934.95, "3N1AB8AE9SY258214": 168082.82, "3N1AB8AE1TY200471": 168082.82, "3N1AB8AE3TY200584": 168082.82, "3N1AB8AE4TY200531": 168082.82, "9BG156FK0TC404697": 305861.89, "9BG156FK0TC405139": 305861.89, "8AP359AFTSU426698": 115435.99, "9BRBC3F31S8324431": 127600.0, "9BRBC3F33S8325564": 127600.0, "9BRBC3F35S8325307": 127600.0, "9BRBC3F36S8325977": 127600.0, "9BRBC3F37S8323333": 127600.0, "8AP359AFTSU425306": 115435.99, "8AP359AFTSU426742": 115435.99, "8AP359AFTSU430903": 115435.99, "8AP359AFTSU430918": 115435.99, "8AP359AFTSU430964": 115435.99, "8AP359AFTSU431703": 115435.99, "93XSYKL1TSCR90471": 270774.0, "93XSYKL1TSCR90495": 270774.0, "93XSYKL1TSCR90502": 270774.0, "93XSYKL1TSCR90510": 270774.0, "8AP359AFTSU418812": 115435.99, "8AP359AFTSU427717": 115435.99, "93XSYKL1TSCR91159": 251671.0, "9BRBC3F30R8277080": 127400.0, "9BRBC3F33R8297260": 127800.0, "93XTYKL1TSCR80170": 313406.0, "93XTYKL1TSCR80174": 313406.0, "93XTYKL1TSCR80177": 313406.0, "93XTYKL1TSCR80204": 313406.0, "93XTYKL1TSCR80214": 313406.0, "93XPYKL1TSCR79624": 313402.0, "93XTYKL1TSCR79601": 313406.0, "93XTYKL1TSCR79603": 313406.0, "93XTYKL1TSCR79606": 313406.0, "9BRBC3F36R8296961": 127800.0, "93XTYKL1TRCP77513": 313406.0, "93XTYKL1TRCP77597": 313406.0, "93XTYKL1TRCP77639": 313406.0, "93XTYKL1TRCP77680": 313406.0, "93XTYKL1TRCP77872": 313406.0, "9BM951104NB298928": 413195.0, "93XSYKL1TNCM39997": 177200.0, "8AGBB69S0NR116649": 114700.0, "8AGBB69S0NR116987": 114700.0, "9BG148FK0NC453330": 215943.0, "9BRBC3F30P8239264": 127800.0, "9BRBC3F37R8251267": 127800.0, "93XSYKL1TSCS93054": 318282.34, "93XSYKL1TSCS93055": 318282.34, "93XSYKL1TSCS93056": 318282.34, "93XSYKL1TSCS93057": 318282.34, "93XSYKL1TSCS93058": 318282.34, "93XSYKL1TSCS93059": 318282.34, "93XSYKL1TSCS93060": 318282.34, "93XSYKL1TSCS93061": 318282.34, "93XSYKL1TSCS93062": 318282.34, "93XSYKL1TSCS93063": 318282.34, "93XSYKL1TSCS93064": 318282.34, "93XSYKL1TSCS93065": 318282.34, "93XSYKL1TSCS93066": 318282.34, "93XSYKL1TSCS93067": 318282.34, "93XSYKL1TSCS93068": 318282.34, "93XSYKL1TSCS93069": 318282.34, "93XSYKL1TSCS93070": 318282.34, "9BG156FK0TC429756": 289017.0, "93XSYKL1TSCS93028": 318282.34, "93XSYKL1TSCS93029": 318282.34, "93XSYKL1TSCS93030": 318282.34, "93XSYKL1TSCS93032": 318282.34, "93XSYKL1TSCS93033": 318282.34, "93XSYKL1TSCS93034": 318282.34, "93XSYKL1TSCS93035": 318282.34, "93XSYKL1TSCS93049": 318282.34, "93XSYKL1TSCS93050": 318282.34, "91JPWC601S1000712": 9798.0, "93XSYKL1TSCS93048": 318282.34, "93XSYKL1TSCS93042": 318282.34, "93XSYKL1TSCS93039": 318282.34, "93XSYKL1TSCS93040": 318282.34, "93XSYKL1TSCS93047": 318282.34, "93XSYKL1TSCS93046": 318282.34, "93XSYKL1TSCS93041": 318282.34, "93XSYKL1TSCS93044": 318282.34, "93XSYKL1TSCS93045": 318282.34, "93XSYKL1TSCS93043": 318282.34, "93XDLLC2TTCS06145": 318226.54, "9535E6TB0TR025550": 1420000.0, "93XSYKL1TSCR90927": 239116.65, "93XSYKL1TSCR90938": 239116.65, "93XSYKL1TSCR90981": 239116.65, "93XSYKL1TSCR91023": 239116.65, "93XSYKL1TSCR91103": 239116.65, "93XSYKL1TSCR90975": 239116.65, "93XSYKL1TSCR91135": 239116.65, "9BM951104SB397886": 605782.26, "9BM951104SB412619": 605782.26, "9BM951104SB412805": 605782.26, "9BM951104SB412815": 605782.26, "93XSYKL1TSCR91008": 283968.84, "93XSYKL1TSCR91028": 283968.84, "93XSYKL1TSCS93235": 283968.84, "93XSYKL1TSCS93236": 283968.84, "93XSYKL1TSCS93237": 283968.84, "93XSYKL1TSCS93238": 283968.84, "93XSYKL1TSCS93239": 283968.84, "93XSYKL1TSCS93240": 283968.84, "93XSYKL1TSCS93241": 283968.84, "93XSYKL1TSCS93143": 283968.84, "93XSYKL1TSCS93100": 263934.95, "93XSYKL1TSCS93102": 263934.95, "9BG156FK0TC405135": 305861.89, "9BG156FK0TC405136": 305861.89, "8AP359AFTSU433337": 115435.99, "8AP359AFTSU417059": 115435.99, "8AP359AFTSU426693": 115435.99, "8AP359AFTSU430905": 115435.99, "8AP359AFTSU430909": 115435.99, "8AP359AFTSU430920": 115435.99, "8AP359AFTSU431054": 115435.99, "8AP359AFTSU418064": 115435.99, "8AP359AFTSU423209": 115435.99, "8AP359AFTSU426624": 115435.99, "8AP359AFTSU426910": 115435.99, "8AP359AFTSU427130": 115435.99, "8AP359AFTSU427681": 115435.99, "8AP359AFWRU372735": 115435.99, "8AP359AFWRU390195": 115435.99, "8AP359AFWRU373184": 115435.99, "93XSYKL1TSCR87434": 270774.0, "93XSYKL1TSCR88372": 254933.0, "93XSYKL1TSCR88384": 254933.0, "91JPWC601S1000711": 9798.0, "9BRBC3F31R8296723": 127600.0, "9BRBC3F34R8297719": 127600.0, "9BRBC3F39R8297926": 127600.0, "9BRBC3F32R8277761": 127600.0, "9BRBC3F37R8277772": 127600.0, "9BRBC3F35R8297969": 127600.0, "9BRBC3F37R8297620": 127600.0, "9BRBC3F39R8297649": 127600.0, "9BRBC3F3XR8297367": 127600.0, "9BRBC3F30S8315008": 127600.0, "9BRBC3F32S8314197": 127600.0, "9BRBC3F34S8313892": 127600.0, "9BRBC3F34S8314170": 127600.0, "9BRBC3F35S8314999": 127600.0, "9BRBC3F36S8314915": 127600.0, "9BRBC3F37S8314986": 127600.0, "9BRBC3F39S8315007": 127600.0, "9BRBC3F3XS8314190": 127600.0, "9BRBC3F3XS8314397": 127600.0, "9BRBC3F34S8305176": 127600.0, "9BRBC3F35S8307387": 127600.0, "9BRBC3F35S8307471": 127600.0, "9BRBC3F36S8306958": 127600.0, "9BRBC3F38S8306377": 127600.0, "9BRBC3F39S8304914": 127600.0, "9BRBC3F39S8306923": 127600.0, "9BRBC3F3XS8305893": 127600.0, "9BRBC3F35S8314713": 127600.0, "9BRBC3F36S8314509": 127600.0, "9BRBC3F30R8273000": 127600.0, "9BRBC3F31R8273328": 127600.0, "9BRBC3F34R8271699": 127600.0, "9BRBC3F31R8298584": 127600.0, "9BRBC3F34R8298997": 127600.0, "9BG156FK0RC417942": 348600.0, "9BG156FK0RC419563": 348600.0, "9BG156FK0RC419673": 348600.0, "9BG156FK0RC419679": 348600.0, "9BG156FK0RC419685": 348600.0, "9BG156FK0RC419697": 348600.0, "9BG156FK0RC419703": 348600.0, "9BG156FK0RC419709": 348600.0, "9BG156FK0RC419715": 348600.0, "9BG156FK0RC419722": 348600.0, "9BG156FK0RC419729": 348600.0, "9BG156FK0RC419730": 348600.0, "9BG156FK0RC419735": 348600.0, "9BG156FK0RC419736": 348600.0, "9BG156FK0RC419741": 348600.0, "9BG156FK0RC419742": 348600.0, "9BG156FK0RC419747": 348600.0, "9BG156FK0RC419821": 348600.0, "9BG156FK0RC419839": 348600.0, "9BG156FK0RC419851": 348600.0, "9BG156FK0RC420399": 348600.0, "9BG156FK0RC420405": 348600.0, "9BG156FK0RC420411": 348600.0, "9BG156FK0RC420417": 348600.0, "9BG156FK0RC420428": 348600.0, "9BG156FK0RC420435": 348600.0, "9BG156FK0RC419568": 348600.0, "9BG156FK0RC419691": 348600.0, "9BG156FK0RC419716": 348600.0, "9BG156FK0RC419723": 348600.0, "9BG156FK0RC419827": 348600.0, "9BG156FK0RC419833": 348600.0, "9BG156FK0RC419845": 348600.0, "9BG156FK0RC419857": 348600.0, "9BG156FK0RC420381": 348600.0, "9BG156FK0RC420387": 348600.0, "9BG156FK0RC420393": 348600.0, "9BG156FK0RC420422": 348600.0, "9BG156FK0RC420429": 348600.0, "9BG156FK0RC420440": 348600.0, "9BRBC3F30R8272610": 127600.0, "9BRBC3F35R8271176": 127600.0, "9BRBC3F38R8273276": 127600.0, "9BRBC3F32R8277422": 127600.0, "9BRBC3F33R8277154": 127600.0, "9BRBC3F35R8277009": 127600.0, "9BRBC3F30R8271411": 127600.0, "9BRBC3F32R8272947": 127600.0, "9BRBC3F33R8272083": 127600.0, "9BRBC3F37R8272510": 127600.0, "9BRBC3F32R8271720": 127600.0, "9BRBC3F39R8271424": 127600.0, "9BRBC3F3XR8271190": 127600.0, "9BRBC3F39R8292936": 127600.0, "93XTYKL1TSCR80764": 313406.0, "93XTYKL1TSCR80766": 313406.0, "93XTYKL1TSCR80769": 313406.0, "93XTYKL1TSCR80775": 313406.0, "93XTYKL1TSCR80778": 313406.0, "93XTYKL1TSCR80801": 313406.0, "93XTYKL1TSCR80804": 313406.0, "93XTYKL1TSCR80807": 313406.0, "93XTYKL1TSCR80825": 313406.0, "93XTYKL1TSCR80830": 313406.0, "93XTYKL1TSCR80848": 313406.0, "93XTYKL1TSCR80852": 313406.0, "93XTYKL1TSCR80855": 313406.0, "9BRBC3F30R8269996": 127600.0, "9BRBC3F37R8270563": 127600.0, "9BRBC3F30R8272185": 127600.0, "9BRBC3F34R8272237": 127600.0, "9BRBC3F39R8271438": 127600.0, "93XPYKL1TSCR79724": 313402.0, "9BRBC3F33R8270544": 127600.0, "9BRBC3F35R8270772": 127600.0, "9BRBC3F36R8270229": 127600.0, "9BRBC3F3XR8270444": 127600.0, "93XTYKL1TSCR79653": 313406.0, "93XTYKL1TRCP78025": 313406.0, "9BRBC3F30R8271652": 127600.0, "9BRBC3F32R8268400": 127600.0, "9BRBC3F34R8268639": 127600.0, "9BRBC3F35R8268830": 127600.0, "9BRBC3F35R8269282": 127600.0, "9BRBC3F37R8269929": 127600.0, "9BRBC3F39R8267924": 127600.0, "93XTYKL1TRCP78087": 313406.0, "93XTYKL1TRCP78027": 313406.0, "93XTYKL1TRCP77608": 313406.0, "93XTYKL1TRCP77827": 313406.0, "93XTYKL1TRCP77828": 313406.0, "93XTYKL1TRCP77859": 313406.0, "93XTYKL1TRCP77889": 313406.0, "93XTYKL1TRCP77980": 313406.0, "93XTYKL1TRCP78000": 313406.0, "93XTYKL1TRCP78064": 313406.0, "9BRBC3F37R8271888": 127600.0, "9BRBC3F3XR8268547": 127600.0, "9BRBC3F3XR8272002": 127600.0, "93XDLLC2TVCT12961": 318382.34, "93XDLLC2TVCT13200": 239116.65, "93XDLLC2TVCT13205": 239116.65, "9321FHMJ2DD658674": 53449.0, "9321FHMJ8DD656444": 53449.0, "9BG148FK0NC453882": 215943.0, "9BG148FK0NC454020": 215943.0, "93XTYKL1TRCP77425": 313406.0, "93XTYKL1TRCP77455": 313406.0, "93XTYKL1TRCP77485": 313406.0, "93XTYKL1TRCP77502": 313406.0, "93XTYKL1TRCP77528": 313406.0, "93XTYKL1TRCP77541": 313406.0, "93XTYKL1TRCP77550": 313406.0, "93XTYKL1TRCP77554": 313406.0, "93XTYKL1TRCP77561": 313406.0, "93XTYKL1TRCP77569": 313406.0, "93XTYKL1TRCP77576": 313406.0, "93XTYKL1TRCP77580": 313406.0, "93XTYKL1TRCP77582": 313406.0, "93XTYKL1TRCP77593": 313406.0, "93XTYKL1TRCP77615": 313406.0, "93XTYKL1TRCP77628": 313406.0, "93XTYKL1TRCP77632": 313406.0, "93XTYKL1TRCP77652": 313406.0, "93XTYKL1TRCP77684": 313406.0, "93XTYKL1TRCP77686": 313406.0, "93XTYKL1TRCP77695": 313406.0, "93XTYKL1TRCP77723": 313406.0, "93XTYKL1TRCP77725": 313406.0, "93XTYKL1TRCP77727": 313406.0, "93XTYKL1TRCP77734": 313406.0, "93XTYKL1TRCP77738": 313406.0, "93XTYKL1TRCP77753": 313406.0, "93XTYKL1TRCP77777": 313406.0, "93XTYKL1TRCP77779": 313406.0, "93XTYKL1TRCP77784": 313406.0, "93XTYKL1TRCP77795": 313406.0, "93XTYKL1TRCP77803": 313406.0, "93XTYKL1TRCP77813": 313406.0, "93XTYKL1TRCP77818": 313406.0, "93XTYKL1TRCP77820": 313406.0, "93XTYKL1TRCP77821": 313406.0, "93XTYKL1TRCP77837": 313406.0, "93XTYKL1TRCP77838": 313406.0, "93XTYKL1TRCP77843": 313406.0, "93XTYKL1TRCP77862": 313406.0, "93XTYKL1TRCP77870": 313406.0, "93XTYKL1TRCP77874": 313406.0, "93XTYKL1TRCP77879": 313406.0, "93XTYKL1TRCP77882": 313406.0, "93XTYKL1TRCP77884": 313406.0, "93XTYKL1TRCP77885": 313406.0, "93XTYKL1TRCP77887": 313406.0, "93XTYKL1TRCP77894": 313406.0, "93XTYKL1TRCP77900": 313406.0, "93XTYKL1TRCP77912": 313406.0, "93XTYKL1TRCP77914": 313406.0, "93XTYKL1TRCP77915": 313406.0, "93XTYKL1TRCP77920": 313406.0, "93XTYKL1TRCP77922": 313406.0, "93XTYKL1TRCP77925": 313406.0, "93XTYKL1TRCP77929": 313406.0, "93XTYKL1TRCP77930": 313406.0, "93XTYKL1TRCP77934": 313406.0, "93XTYKL1TRCP77939": 313406.0, "93XTYKL1TRCP77942": 313406.0, "93XTYKL1TRCP77944": 313406.0, "93XTYKL1TRCP77950": 313406.0, "93XTYKL1TRCP77955": 313406.0, "93XTYKL1TRCP77957": 313406.0, "93XTYKL1TRCP77960": 313406.0, "93XTYKL1TRCP77962": 313406.0, "93XTYKL1TRCP77965": 313406.0, "93XTYKL1TRCP77967": 313406.0, "93XTYKL1TRCP77969": 313406.0, "93XTYKL1TRCP77970": 313406.0, "93XTYKL1TRCP77974": 313406.0, "93XTYKL1TRCP77975": 313406.0, "93XTYKL1TRCP77987": 313406.0, "93XTYKL1TRCP78002": 313406.0, "93XTYKL1TRCP78004": 313406.0, "93XTYKL1TRCP78005": 313406.0, "93XTYKL1TRCP78009": 313406.0, "93XTYKL1TRCP78015": 313406.0, "93XTYKL1TRCP78017": 313406.0, "93XTYKL1TRCP78019": 313406.0, "93XTYKL1TRCP78022": 313406.0, "93XTYKL1TRCP78024": 313406.0, "93XTYKL1TRCP78032": 313406.0, "93XTYKL1TRCP78034": 313406.0, "93XTYKL1TRCP78035": 313406.0, "93XTYKL1TRCP78037": 313406.0, "93XTYKL1TRCP78039": 313406.0, "93XTYKL1TRCP78045": 313406.0, "93XTYKL1TRCP78052": 313406.0, "93XTYKL1TRCP78054": 313406.0, "93XTYKL1TRCP78055": 313406.0, "93XTYKL1TRCP78065": 313406.0, "93XTYKL1TRCP78067": 313406.0, "93XTYKL1TRCP78069": 313406.0, "93XTYKL1TRCP78070": 313406.0, "93XTYKL1TRCP78072": 313406.0, "93XTYKL1TRCP78075": 313406.0, "93XTYKL1TRCP78080": 313406.0, "93XTYKL1TRCP78082": 313406.0, "93XTYKL1TRCP77623": 313406.0, "9BG148FK0NC454015": 215943.0, "9BG148FK0NC453773": 196950.0, "9BG148FK0NC453860": 196950.0, "9BG148FK0NC453967": 196950.0, "9BG148FK0NC453987": 196950.0, "9BG148FK0NC453313": 215943.0, "9BG148FK0NC453568": 215943.0, "9BG148FK0NC453716": 215943.0, "9BG148FK0NC453739": 215943.0, "9BG148FK0NC453740": 215943.0, "9BG148FK0NC453775": 215943.0, "9BG148FK0NC453874": 215943.0, "9BG148FK0NC453886": 215943.0, "9BG148FK0NC453901": 215943.0, "9BG148FK0NC453923": 215943.0, "9BG148FK0NC453932": 215943.0, "9BG148FK0NC453962": 215943.0, "9BG148FK0NC453995": 215943.0, "9BG148FK0NC454001": 215943.0, "9BG148FK0NC454005": 215943.0, "9BG148FK0NC454007": 215943.0, "9BG148FK0NC454011": 215943.0, "9BG148FK0NC453953": 215943.0, "8AGBB69S0NR116913": 114700.0, "8AGBB69S0NR113146": 114700.0, "8AGBB69S0NR116925": 114700.0, "8AGBB69S0NR116928": 114700.0, "8AGBB69S0NR117136": 114700.0, "9BGTW69W05B206024": 46450.0, "9BGTW69W05B236268": 46450.0, "9BGTW69W05B242537": 46450.0, "93XSYKL1TSCR90417": 239116.65, "93XSYKL1TSCR90821": 239116.65, "93XSYKL1TSCR91536": 239116.65, "93XSYKL1TSCR90870": 239116.65, "9BRKC3F39S8349254": 129459.36, "3N1AB8AE1TY200504": 168082.82, "3N1AB8AEXTY200601": 165151.14, "93XSYKL1TSCS93152": 283884.09, "93XSYKL1TSCS93180": 283884.09, "93XSYKL1TSCS93181": 283884.09, "93XSYKL1TSCS93182": 283884.09, "93XSYKL1TSCS93184": 283884.09, "93XSYKL1TSCS93185": 283884.09, "93XSYKL1TSCS93186": 283884.09, "93XSYKL1TSCS93187": 283884.09, "93XSYKL1TSCS93190": 283884.09, "93XSYKL1TSCS93192": 283884.09, "93XSYKL1TSCS93193": 283884.09, "93XSYKL1TSCS93194": 283884.09, "93XSYKL1TSCS93197": 283884.09, "3N1AB8AE8SY258012": 168082.82, "93XSYKL1TSCS93112": 283968.84, "93XSYKL1TSCS93150": 283968.84, "93XSYKL1TSCS93151": 283968.84, "93XSYKL1TSCS93153": 283968.84, "93XSYKL1TSCS93178": 283968.84, "93XSYKL1TSCS93179": 283968.84, "93XSYKL1TSCS93183": 283968.84, "93XSYKL1TSCS93188": 283968.84, "93XSYKL1TSCS93189": 283968.84, "93XSYKL1TSCS93191": 283968.84, "93XSYKL1TSCS93195": 283968.84, "93XSYKL1TSCS93196": 283968.84, "93XSYKL1TSCR90543": 228256.0, "93XSYKL1TSCR90395": 228256.0, "9321FHMJ7DD655480": 53449.0, "9321FHMJ9DD658719": 53449.0, "93XSYKL1TSCR90594": 270774.0, "93XSYKL1TSCR90612": 270774.0, "8AP359AFTSU408028": 115435.99, "8AP359AFTSU426395": 115435.99, "8AP359AFTSU426722": 115435.99, "8AP359AFTSU427223": 115435.99, "8AP359AFTSU431085": 115435.99, "8AP359AFTSU431697": 115435.99, "8AP359AFTSU431759": 115435.99, "8AP359AFTSU415135": 115435.99, "8AP359AFTSU424820": 115435.99, "8AP359AFTSU425973": 115435.99, "8AP359AFTSU426900": 115435.99, "9BRBC3F33R8297601": 127600.0, "9BRBC3F34R8297073": 127600.0, "9BRBC3F33R8294195": 127600.0, "9BRBC3F33R8272990": 127600.0, "9BRBC3F35R8273316": 127600.0, "9BRBC3F34R8271136": 127600.0, "9BRBC3F39R8271150": 127600.0, "93XTYKL1TSCR80884": 313406.0, "93XTYKL1TSCR80887": 313406.0, "93XTYKL1TSCR80890": 313406.0, "93XTYKL1TSCR80895": 313406.0, "93XTYKL1TSCR80898": 313406.0, "93XTYKL1TSCR80901": 313406.0, "93XTYKL1TSCR80904": 313406.0, "93XTYKL1TSCR80907": 313406.0, "93XTYKL1TSCR80910": 313406.0, "93XPYKL1TSCR79711": 313402.0, "93XPYKL1TSCR79718": 313402.0, "93XTYKL1TSCR79617": 313406.0, "93XTYKL1TSCR79620": 313406.0, "9BRBC3F37R8272281": 127600.0, "9BRBC3F39R8272637": 127600.0, "9BRBC3F30R8271618": 127600.0, "9BRBC3F32R8270129": 127600.0, "9BRBC3F36R8273275": 127600.0, "9BRBC3F38R8270233": 127600.0, "93XTYKL1TSCR79610": 313406.0, "93XTYKL1TSCR79612": 313406.0, "93XTYKL1TSCR79615": 313406.0, "9BRBC3F30R8269982": 127600.0, "9BRBC3F31R8270266": 127600.0, "9BRBC3F32R8269336": 127600.0, "9BRBC3F33R8269815": 127600.0, "9BRBC3F37R8268036": 127600.0, "9BRBC3F37R8268148": 127600.0, "9BRBC3F37R8268196": 127600.0, "9BRBC3F37R8268344": 127600.0, "9BRBC3F3XR8268385": 127600.0, "9BRBC3F35R8268116": 127600.0, "9BRBC3F35R8269296": 127600.0, "9BRBC3F35R8269704": 127600.0, "9BRBC3F36R8267931": 127600.0, "93XTYKL1TRCP77419": 313406.0, "93XTYKL1TRCP77437": 313406.0, "93XTYKL1TRCP77556": 313406.0, "93XTYKL1TRCP77760": 313406.0, "93XTYKL1TRCP78047": 313406.0, "93XTYKL1TRCP78050": 313406.0, "9BRBC3F34R8268690": 127600.0, "9BRBC3F39R8269950": 127600.0, "9BRBC3F3XR8268418": 127600.0, "9BRBC3F31R8268372": 127600.0, "9BRBC3F37R8268716": 127600.0, "9BRBC3F34R8267779": 127600.0, "9BRBC3F34R8269872": 127600.0, "9BRBC3F36R8269601": 127600.0, "9BRBC3F39R8270192": 127600.0, "8AFAR23L0JJ034567": 145584.0, "8AFAR23L1JJ065729": 145584.0, "8AFAR23L9JJ039430": 145584.0, "8AFAR23L9JJ064893": 145584.0, "93XDLLC2TVCT14130": 267355.91, "93YF62S07TJ449014": 344772.73, "93XDLLC2TVCT13253": 283968.84, "9BM951104TB435180": 466527.28, "9BM951104TB443026": 466527.28, "9BM951104TB443029": 466527.28, "9BM951104TB434375": 466527.28, "9BM951104TB444294": 466527.28, "9BM951104TB442155": 466527.28, "91JPWC601S1000710": 9798.0, "9535E6TB6TR025908": 1420000.0, "91JPWC601S1000704": 9798.0, "91JPWC601S1000705": 9798.0, "91JPWC601S1000706": 9798.0, "9BG156FK0TC404910": 305861.89, "9BG156FK0TC404913": 305861.89, "9BG156FK0TC404915": 305861.89, "9BRKC3F31S8349393": 129459.36, "93XSYKL1TSCR90405": 270774.0, "93XSYKL1TSCR90410": 270774.0, "93XSYKL1TSCR90415": 270774.0, "8AP359AFTSU432167": 115435.99, "8AP359AFTSU436019": 115435.99, "8AP359AFTSU436517": 115435.99, "8AP359AFTSU436545": 115435.99, "8AP359AFTSU436585": 115435.99, "8AP359AFTSU436609": 115435.99, "8AP359AFTSU436029": 115435.99, "93XSYKL1TSCR91180": 251671.0, "93XSYKL1TSCR91207": 251671.0, "9BRBC3F30S8316790": 127400.0, "93XPYKL1TSCR79766": 313402.0, "9BRBC3F32R8267456": 127600.0, "9BRBC3F33R8268003": 127600.0, "9BRBC3F34R8268365": 127600.0, "9BRBC3F36R8268450": 127600.0, "9BRBC3F37R8268618": 127600.0, "9BRBC3F39R8268684": 127600.0, "9BRBC3F3XR8271450": 127600.0, "93Y5SRJSXPJ312377": 92150.0, "9BG148FK0NC448656": 183600.0, "9BG148FK0NC449428": 196950.0, "9BG148FK0NC452589": 196950.0, "9BG148FK0NC452593": 196950.0, "9BG148FK0NC452596": 196950.0, "9BG148FK0NC452599": 196950.0, "93XSYKL1TSCS93272": 283884.09, "93XSYKL1TSCS93271": 283884.09, "93XSYKL1TSCS93269": 283884.09, "93XSYKL1TSCS93270": 283884.09, "93XSYKL1TSCR91246": 239060.36, "93XSYKL1TSCR91362": 239060.36, "93XSYKL1TSCR91120": 239060.36, "93XSYKL1TSCR91092": 239060.36, "93XSYKL1TSCR90788": 239060.36, "93XSYKL1TSCR90893": 239060.36, "9BRKC3F30S8357159": 129459.36, "9BRKC3F31S8350270": 129459.36, "9BRKC3F31S8356862": 129459.36, "9BRKC3F31S8357123": 129459.36, "9BRKC3F32S8349757": 129459.36, "9BRKC3F32S8350679": 129459.36, "9BRKC3F33S8356958": 129459.36, "9BRKC3F33S8357155": 129459.36, "9BRKC3F33S8357298": 129459.36, "9BRKC3F34S8350196": 129459.36, "9BRKC3F34S8357102": 129459.36, "9BRKC3F34S8357388": 129459.36, "9BRKC3F35S8350398": 129459.36, "9BRKC3F35S8356833": 129459.36, "9BRKC3F35S8357352": 129459.36, "9BRKC3F36S8357067": 129459.36, "9BRKC3F37S8356848": 129459.36, "9BRKC3F37S8356932": 129459.36, "9BRKC3F37S8356980": 129459.36, "9BRKC3F37S8357014": 129459.36, "9BRKC3F37S8357207": 129459.36, "9BRKC3F38S8357233": 129459.36, "9BRKC3F3XS8349408": 129459.36, "9BRKC3F3XS8350297": 129459.36, "93XSYKL1TSCR86128": 303826.0, "93XSYKL1TSCR86129": 303826.0, "93XSYKL1TSCR86130": 303826.0, "93XSYKL1TSCS93140": 283968.84, "93XSYKL1TSCS93144": 283968.84, "93XSYKL1TSCS93145": 283968.84, "93XSYKL1TSCS93146": 283968.84, "93XSYKL1TSCS93147": 283968.84, "93XSYKL1TSCS93124": 263934.95, "93XSYKL1TSCS93125": 263934.95, "3N1AB8AE9TY200704": 172000.0, "3N1AB8AEXTY200730": 172000.0, "3N1AB8AE5TY200358": 163800.0, "93XSYKL1TSCS92433": 270774.0, "93XSYKL1TSCS92435": 270774.0, "93XSYKL1TSCS92436": 270774.0, "93XSYKL1TSCS92437": 270774.0, "93XSYKL1TSCS92438": 270774.0, "93XSYKL1TSCS92439": 270774.0, "93XSYKL1TSCS92440": 270774.0, "93XSYKL1TSCS92441": 270774.0, "93XSYKL1TSCS92442": 270774.0, "93XSYKL1TSCS92443": 270774.0, "93XSYKL1TSCS92444": 270774.0, "93XSYKL1TSCS92445": 270774.0, "93XSYKL1TSCS92446": 270774.0, "93XSYKL1TSCS92447": 270774.0, "93XSYKL1TSCS92448": 270774.0, "93XSYKL1TSCS92449": 270774.0, "93XSYKL1TSCS92450": 270774.0, "9BRKC3F30S8342600": 129459.36, "9BRKC3F32S8342503": 129459.36, "9BRKC3F33S8342736": 129459.36, "9BRKC3F35S8342446": 129459.36, "9BRKC3F36S8330158": 129459.36, "9BRKC3F36S8330435": 129459.36, "9BRKC3F38S8342571": 129459.36, "9BRKC3F38S8342697": 129459.36, "9BRKC3F39S8330798": 129459.36, "9BRKC3F39S8331398": 129459.36, "9BRKC3F39S8342529": 129459.36, "9BRKC3F38S8345003": 129459.36, "8AP359AFTSU432153": 115435.99, "8AP359AFTSU432159": 115435.99, "8AP359AFTSU433387": 115435.99, "8AP359AFTSU433573": 115435.99, "8AP359AFTSU435212": 115435.99, "8AP359AFTSU435584": 115435.99, "8AP359AFTSU425342": 115435.99, "9BG156FK0SC417107": 291649.77, "93XSYKL1TSCR88472": 228255.95, "9BG156FK0SC406941": 348600.0, "9BG156FK0SC406948": 348600.0, "9BG156FK0SC407085": 348600.0, "9BG156FK0SC407088": 348600.0, "9BG156FK0SC407136": 348600.0, "9BG156FK0SC407230": 348600.0, "9BG156FK0SC407234": 348600.0, "9BG156FK0SC407376": 348600.0, "9BG156FK0SC407379": 348600.0, "9BG156FK0SC407899": 348600.0, "9BG156FK0SC407915": 348600.0, "9BG156FK0SC408011": 348600.0, "9BG156FK0SC408064": 348600.0, "9BG156FK0SC408083": 348600.0, "9BG156FK0SC408174": 348600.0, "9BG156FK0SC408230": 348600.0, "9BG156FK0SC408252": 348600.0, "9BG156FK0SC408395": 348600.0, "9BG156FK0SC408417": 348600.0, "9BG156FK0SC408587": 348600.0, "9BG156FK0SC408716": 348600.0, "9BG156FK0SC408862": 348600.0, "9BG156FK0SC408864": 348600.0, "9BG156FK0SC408962": 348600.0, "9BG156FK0SC409119": 348600.0, "9BG156FK0SC411886": 348600.0, "9BG156FK0SC412183": 348600.0, "9BG156FK0SC412232": 348600.0, "9BG156FK0SC412325": 348600.0, "9BG156FK0SC412335": 348600.0, "9BG156FK0SC407426": 348600.0, "9BG156FK0SC421665": 348600.0, "93XSYKL1TSCR85352": 228255.95, "9BRBC3F3XS8309569": 127400.0, "9BRBC3F32R8277503": 127600.0, "9BRBC3F34R8276269": 127600.0, "9BRBC3F37R8273303": 127600.0, "9BRBC3F39R8270791": 127600.0, "9BG156FK0RC430284": 348600.0, "8AP359AFXRU351586": 115435.99, "8AP359AFXRU354568": 115435.99, "8AP359AFXRU359767": 115435.99, "8AP359AFXRU357920": 115435.99, "8AP359AFXRU357935": 115435.99, "8AP359AFXRU357952": 115435.99, "8AP359AFXRU360377": 115435.99, "93XTYKL1TSCR81436": 313406.0, "93XSYKL1TSCR80550": 310926.0, "93XSYKL1TSCR80574": 310926.0, "93XPYKL1TSCR79752": 313402.0, "9BRBC3F33R8295640": 127400.0, "9BRBC3F33R8272889": 127600.0, "9BRBC3F35R8270853": 127600.0, "9BRBC3F3XR8271416": 127600.0, "9BRBC3F3XR8271867": 127600.0, "93XSYKL1TSCR80558": 310926.0, "9BRBC3F30R8269917": 127600.0, "9BRBC3F36R8270697": 127600.0, "93XTYKL1TSCR79420": 313406.0, "93XTYKL1TSCR79422": 313406.0, "93XPYKL1TSCR79748": 313402.0, "8AP359AFXRU360362": 115435.99, "8AP359AFXRU358001": 115435.99, "93XTYKL1TRCP77413": 313406.0, "93XTYKL1TRCP77535": 313406.0, "93XTYKL1TRCP77656": 313406.0, "93XTYKL1TRCP77730": 313406.0, "93XTYKL1TRCP77764": 313406.0, "93XTYKL1TRCP78040": 313406.0, "9BRBC3F31R8267643": 127600.0, "9BRBC3F35R8268987": 127600.0, "9BRBC3F3XR8269679": 127600.0, "93XTYKL1TRCP77857": 313406.0, "93XTYKL1TRCP77927": 313406.0, "9BRBC3F33R8268325": 127600.0, "9BRBC3F36R8267864": 127600.0, "9BRBC3F38R8269020": 127600.0, "9BRBC3F36R8268299": 127600.0, "9BRBC3F38R8267798": 127600.0, "9BRBC3F38R8269633": 127600.0, "9BRBC3F33R8255168": 127400.0, "9BRBC3F34R8255180": 127400.0, "9BRBC3F35R8254913": 127400.0, "9BRBC3F37R8259644": 127400.0, "9BRBC3F39R8264148": 127400.0, "9BRBC3F3XR8255071": 127400.0, "9BRBC3F3XR8259184": 127400.0, "93Y5SRJSXPJ312376": 92150.0, "93XDLLC2TVCT13681": 267355.91, "93XDLLC2TVCT13714": 267355.91, "93XDLLC2TVCT13728": 267355.91, "93XDLLC2TVCT14512": 267355.91, "93XDLLC2TVCT13686": 267355.91, "93XDLLC2TVCT13689": 267355.91, "93XDLLC2TVCT13700": 267355.91, "93XDLLC2TVCT13709": 267355.91, "93XDLLC2TVCT13737": 267355.91, "93XDLLC2TVCT14506": 267355.91, "93XDLLC2TVCT14509": 267355.91, "93XDLLC2TVCT14515": 267355.91, "93XDLLC2TVCT14518": 267355.91, "93XDLLC2TTCS06212": 267355.91, "9535E6TB7TR031720": 1420000.0, "9535E6TB1TR034807": 1420000.0, "8AFAR23L8JJ039418": 145584.0, "8AFAR23L8JJ042478": 145584.0, "9BRKC3F39S8349397": 129459.36, "9535E6TB0TR025595": 1420000.0, "93XSYKL1TSCR90442": 239116.65, "93XSYKL1TSCS93141": 283884.09, "3N1AB8AE6TY201017": 168082.82, "3N1AB8AE6TY201065": 168082.82, "3N1AB8AE0TY200428": 168082.82, "3N1AB8AE1TY200499": 168082.82, "93XSYKL1TSCR90701": 270774.0, "93XSYKL1TSCR90709": 270774.0, "93XSYKL1TSCR90716": 270774.0, "93XSYKL1TSCR90728": 270774.0, "93XSYKL1TSCR90744": 270774.0, "8AP359AFTSU416844": 115435.99, "8AP359AFTSU421629": 115435.99, "8AP359AFTSU421885": 115435.99, "8AP359AFTSU422280": 115435.99, "8AP359AFTSU422347": 115435.99, "8AP359AFTSU422561": 115435.99, "8AP359AFTSU422908": 115435.99, "8AP359AFTSU414074": 115435.99, "8AP359AFTSU424717": 115435.99, "8AP359AFWRU373534": 115435.99, "8AP359AFWRU373543": 115435.99, "9321FHMJ2DD653149": 53449.0, "9321FHMJ9DD653147": 53449.0, "9BRBC3F37S8316611": 127400.0, "9BRBC3F39S8316531": 127400.0, "93XSYKL1TSCR80031": 310926.0, "93XSYKL1TSCR80033": 310926.0, "93XSYKL1TSCR80036": 310926.0, "93XTYKL1TSCR79924": 313406.0, "93XTYKL1TSCR79944": 313406.0, "93XTYKL1TSCR79681": 313406.0, "8AP359AFXRU344742": 115435.99, "8AP359AFXRU350940": 115435.99, "8AP359AFXRU350961": 115435.99, "8AP359AFXRU351598": 115435.99, "8AP359AFXRU344075": 115435.99, "8AP359AFXRU344087": 115435.99, "9BRBC3F30R8271084": 127600.0, "9BG148FK0NC453855": 215943.0, "9BRBC3F33R8267563": 127600.0, "9BRBC3F34R8267765": 127600.0, "9BRBC3F35R8270173": 127600.0, "9BM951104NB280224": 413195.0, "9BRBC3F31R8269764": 127600.0, "9BRBC3F32R8268378": 127600.0, "9BRBC3F33R8267692": 127600.0, "9BRBC3F36R8269646": 127600.0, "9BRBC3F38R8268952": 127600.0, "9BRBC3F39R8268703": 127600.0, "93XTYKL1TRCP77604": 313406.0, "93XTYKL1TRCP77769": 313406.0, "93XTYKL1TRCP77806": 313406.0, "93XTYKL1TRCP77909": 313406.0, "93XTYKL1TRCP77932": 313406.0, "9BRBC3F30R8268279": 127600.0, "9BRBC3F31R8267786": 127600.0, "9BRBC3F31R8269263": 127600.0, "9BRBC3F31R8270168": 127600.0, "9BRBC3F32R8270213": 127600.0, "9BRBC3F33R8268017": 127600.0, "9BRBC3F33R8268406": 127600.0, "9BRBC3F34R8269323": 127600.0, "9BRBC3F37R8269851": 127600.0, "9BRBC3F38R8269227": 127600.0, "9BRBC3F39R8268913": 127600.0, "9BRBC3F3XR8269911": 127600.0, "9BRBC3F3XR8269956": 127600.0, "8AGBB69S0NR117001": 114700.0, "9BG156FK0TC430320": 289017.0, "9BG156FK0TC429755": 289017.0, "93XDLLC2TTCS11415": 318226.54, "8BCND5GVUKG523062": 77100.0, "8BCND5GVUKG523254": 77100.0, "8BCND5GVUKG523836": 77100.0, "8BCND5GVUKG523501": 77100.0, "8BCND5GVULG501826": 77100.0, "3N1AB8AEXTY200615": 172000.0, "3N1AB8AE0TY201174": 168082.82, "3N1AB8AE1TY201247": 168082.82, "3N1AB8AEXTY201246": 168082.82, "3N1AB8AE0SY258926": 168082.82, "93XSYKL1TSCS93130": 263934.95, "93XSYKL1TSCR90640": 270774.0, "93XSYKL1TSCR91172": 251671.0, "9BRBC3F31S8326213": 127600.0, "9BRBC3F37S8351990": 127600.0, "9BRBC3F38S8325589": 127600.0, "9BRBC3F38S8325866": 127600.0, "9BRBC3F38S8352114": 127600.0, "9BRBC3F38S8352162": 127600.0, "9BRBC3F3XS8352034": 127600.0, "8AP359AFWRU371727": 115435.99, "8AP359AFWRU373369": 115435.99, "8AP359AFWRU373494": 115435.99, "8AP359AFWRU373525": 115435.99, "8AP359AFWRU371760": 115435.99, "8AP359AFTSU412053": 115435.99, "8AP359AFTSU414062": 115435.99, "8AP359AFTSU414113": 115435.99, "8AP359AFTSU417897": 115435.99, "8AP359AFTSU418645": 115435.99, "8AP359AFTSU418740": 115435.99, "8AP359AFTSU423153": 115435.99, "93XSYKL1TSCR87005": 270774.0, "93XSYKL1TSCR87015": 270774.0, "93XSYKL1TSCR87018": 270774.0, "93XSYKL1TSCR87027": 270774.0, "93XSYKL1TSCR87035": 270774.0, "93XSYKL1TSCR87045": 270774.0, "93XSYKL1TSCR87054": 270774.0, "93XSYKL1TSCR87066": 270774.0, "93XSYKL1TSCR87069": 270774.0, "93XSYKL1TSCR87080": 270774.0, "93XSYKL1TSCR87091": 270774.0, "93XSYKL1TSCR87099": 270774.0, "93XSYKL1TSCR87109": 270774.0, "93XSYKL1TSCR87115": 270774.0, "93XSYKL1TSCR87123": 270774.0, "93XSYKL1TSCR87134": 270774.0, "93XSYKL1TSCR87144": 270774.0, "93XSYKL1TSCR87150": 270774.0, "93XSYKL1TSCR87160": 270774.0, "93XSYKL1TSCR87185": 270774.0, "93XSYKL1TSCR88540": 228255.95, "9BRBC3F31S8326504": 127600.0, "9BRBC3F34R8298420": 127600.0, "93XSYKL1TSCR85856": 228255.95, "93XSYKL1TSCR85842": 228255.95, "9BRBC3F36R8296491": 127600.0, "9BRBC3F39R8298459": 127600.0, "9BRBC3F31R8299010": 127600.0, "93XTYKL1TSCR80913": 313406.0, "93XTYKL1TSCR80919": 313406.0, "93XTYKL1TSCR80927": 313406.0, "93XTYKL1TSCR80948": 313406.0, "93XTYKL1TSCR80954": 313406.0, "93XTYKL1TSCR81071": 313406.0, "93XTYKL1TSCR81074": 313406.0, "93XPYKL1TSCR79631": 313402.0, "93XPYKL1TSCR79722": 313402.0, "93XTYKL1TSCR79657": 313406.0, "93XTYKL1TSCR79655": 313406.0, "9BRBC3F33R8267711": 127600.0, "9BRBC3F36R8268030": 127600.0, "93XTYKL1TRCP77490": 313406.0, "93XTYKL1TRCP77600": 313406.0, "9BRBC3F33R8268972": 127600.0, "9BRBC3F33R8269085": 127600.0, "9BRBC3F36R8267752": 127600.0, "9BRBC3F3XR8269567": 127600.0, "9BRBC3F30R8269612": 127600.0, "9BRBC3F30R8270209": 127600.0, "9BRBC3F33R8269877": 127600.0, "9BRBC3F36R8269890": 127600.0, "9BRBC3F32R8269787": 127600.0, "9BRBC3F35R8268598": 127600.0, "9BRBC3F35R8268844": 127600.0, "9BRBC3F39R8269625": 127600.0, "9BRBC3F3XR8267740": 127600.0, "9BRBC3F34R8267684": 127600.0, "9BRBC3F35R8269363": 127600.0, "9BRBC3F32R8269188": 127600.0, "9BRBC3F33R8267658": 127600.0, "9BRBC3F33R8269779": 127600.0, "9BRBC3F30R8271604": 127600.0, "9BRBC3F34R8267412": 127600.0, "9BRBC3F37R8268070": 127600.0, "9BRBC3F38R8268837": 127600.0, "9BRBC3F39R8268992": 127600.0, "9BRBC3F3XR8269214": 127600.0, "9BM951104NB295561": 413195.0, "93XTYKL1TRCP77404": 313406.0, "93XTYKL1TRCP77407": 313406.0, "93XTYKL1TRCP77519": 313406.0, "93XTYKL1TRCP77543": 313406.0, "93XTYKL1TRCP77565": 313406.0, "93XTYKL1TRCP77574": 313406.0, "93XTYKL1TRCP77606": 313406.0, "93XTYKL1TRCP77619": 313406.0, "93XTYKL1TRCP77643": 313406.0, "93XTYKL1TRCP77654": 313406.0, "93XTYKL1TRCP77704": 313406.0, "93XTYKL1TRCP77717": 313406.0, "93XTYKL1TRCP77732": 313406.0, "93XTYKL1TRCP77782": 313406.0, "93Y5SRJSXPJ312331": 92150.0, "93Y5SRJSXPJ312292": 92150.0, "93Y5SRJSXPJ312380": 92150.0, "93Y5SRJSXPJ312430": 92150.0, "93Y5SRJSXPJ312285": 92150.0, "93Y5SRJSXPJ312290": 92150.0, "93Y5SRJSXPJ312330": 92150.0, "93Y5SRJSXPJ312379": 92150.0, "93Y5SRJSXPJ312390": 92150.0, "93Y5SRJSXPJ312431": 92150.0, "8AGBB69S0NR116936": 114700.0, "8AGBB69S0NR116937": 114700.0, "8AGBB69S0NR116945": 114700.0, "8AGBB69S0NR117009": 114700.0, "93Y5SRJSXPJ312378": 92150.0, "93Y5SRJSXPJ312381": 92150.0, "93XDLLC2TVCT13217": 239116.65, "93XDLLC2TVCT14774": 267355.91, "93XDLLC2TVCT14776": 267355.91, "93XDLLC2TVCT14778": 267355.91, "93XDLLC2TVCT14780": 267355.91, "93XDLLC2TVCT14782": 267355.91, "93XDLLC2TVCT14784": 267355.91, "93XDLLC2TVCT14786": 267355.91, "93XDLLC2TVCT14788": 267355.91, "93XDLLC2TVCT14790": 267355.91, "93XDLLC2TVCT14792": 267355.91, "93XDLLC2TVCT14794": 267355.91, "93XDLLC2TVCT14796": 267355.91, "93XDLLC2TVCT14807": 267355.91, "93XDLLC2TVCT14809": 267355.91, "9535E6TB4VR001612": 1420000.0, "93XSYKL1TSCS93025": 318226.54, "93XDLLC2TVCT12903": 283968.84, "93XSYKL1TSCS93019": 318226.54, "93XSYKL1TSCS93014": 318226.54, "93XSYKL1TSCS93015": 318226.54, "93XSYKL1TSCS93016": 318226.54, "93XSYKL1TSCS93017": 318226.54, "93XSYKL1TSCS93018": 318226.54, "93XSYKL1TSCS93020": 318226.54, "93XSYKL1TSCS93021": 318226.54, "93XSYKL1TSCS93022": 318226.54, "93XSYKL1TSCS93023": 318226.54, "93XSYKL1TSCS93024": 318226.54, "93XSYKL1TSCS93026": 318226.54, "93XSYKL1TSCS93027": 318226.54, "9535E6TB8TR031757": 1420000.0, "93XSYKL1TSCR90805": 239060.36, "93XSYKL1TSCR90853": 267355.91, "3N1AB8AE9TY200573": 172000.0, "9BG156FK0TC404911": 305861.89, "3N1AB8AE2TY200804": 168082.82, "3N1AB8AE5TY201168": 168082.82, "3N1AB8AE9TY201139": 168082.82, "3N1AB8AEXTY201005": 168082.82, "3N1AB8AE2TY200429": 168082.82, "9BG156FK0TC405138": 305861.89, "3N1AB8AE4TY200352": 168082.82, "3N1AB8AE6TY200370": 168082.82, "9535E6TB6TR025567": 1420000.0, "93XSYKL1TSCR88527": 244900.0, "9BRKC3F32S8349354": 129459.36, "93XSYKL1TSCS92431": 270774.0, "93XSYKL1TSCS92432": 270774.0, "8AP359AFWRU380520": 115435.99, "8AP359AFWRU373516": 115435.99, "8AP359AFTSU403698": 115435.99, "8AP359AFTSU421642": 115435.99, "8AP359AFTSU411639": 115435.99, "8AP359AFTSU416288": 115435.99, "8AP359AFWRU373880": 115435.99, "8AP359AFTSU414188": 115435.99, "8AP359AFTSU416918": 115435.99, "8AP359AFTSU416920": 115435.99, "8AP359AFTSU417027": 115435.99, "8AP359AFTSU417207": 115435.99, "8AP359AFTSU428865": 115435.99, "8AP359AFTSU430212": 115435.99, "8AP359AFTSU431714": 115435.99, "8AP359AFTSU432870": 115435.99, "8AP359AFTSU433312": 115435.99, "8AP359AFTSU401992": 115435.99, "8AP359AFTSU402004": 115435.99, "8AP359AFTSU408072": 115435.99, "8AP359AFTSU409174": 115435.99, "8AP359AFTSU410351": 115435.99, "8AP359AFTSU411563": 115435.99, "8AP359AFTSU411595": 115435.99, "8AP359AFTSU413784": 115435.99, "8AP359AFTSU416265": 115435.99, "8AP359AFTSU416290": 115435.99, "8AP359AFWRU370637": 115435.99, "8AP359AFWRU378191": 115435.99, "9BRBC3F34S8314699": 127400.0, "9BRBC3F31S8309959": 127400.0, "9BRBC3F32S8314796": 127400.0, "9BRBC3F39R8297344": 127400.0, "93XSYKL1TSCR85874": 228255.95, "93XSYKL1TSCR85891": 228255.95, "9BRBC3F32S8315026": 127400.0, "9BRBC3F33S8310031": 127400.0, "9BRBC3F37S8314793": 127400.0, "9BRBC3F37S8314874": 127400.0, "9BRBC3F38S8314849": 127400.0, "9BRBC3F39R8297070": 127400.0, "9BRBC3F39S8314990": 127400.0, "9BRBC3F3XR8291407": 127400.0, "9BRBC3F35S8308555": 127400.0, "9BRBC3F35S8309575": 127400.0, "9BRBC3F38S8309893": 127400.0, "9BRBC3F3XS8309958": 127400.0, "9BRBC3F30R8267424": 127400.0, "9BRBC3F30R8278309": 127400.0, "9BRBC3F31R8270509": 127400.0, "9BRBC3F31R8276813": 127400.0, "9BRBC3F31R8276925": 127400.0, "9BRBC3F34R8294724": 127400.0, "9BRBC3F35R8294358": 127400.0, "9BRBC3F38R8268143": 127600.0, "9BRBC3F39R8272931": 127600.0, "8AP359AFXRU360393": 115435.99, "8AP359AFXRU360639": 115435.99, "93XSYKL1TSCR80019": 310926.0, "93XSYKL1TSCR80022": 310926.0, "93XSYKL1TSCR80024": 310926.0, "93XSYKL1TSCR80027": 310926.0, "93XSYKL1TSCR80029": 310926.0, "93XTYKL1TSCR79932": 313406.0, "93XTYKL1TSCR79935": 313406.0, "93XTYKL1TSCR79490": 313406.0, "93XTYKL1TSCR79516": 313406.0, "93XTYKL1TSCR79522": 313406.0, "8AP359AFXRU357869": 115435.99, "8AP359AFXRU357872": 115435.99, "8AP359AFXRU359955": 115435.99, "93XTYKL1TRCP77476": 313406.0, "93XTYKL1TRCP77799": 313406.0, "93XTYKL1TRCP77832": 313406.0, "93XTYKL1TRCP77935": 313406.0, "9BRBC3F32R8268946": 127600.0, "9BRBC3F36R8267671": 127600.0, "9BRBC3F3XR8267494": 127600.0, "93XTYKL1TRCP77410": 313406.0, "93XTYKL1TRCP77480": 313406.0, "93XTYKL1TRCP77984": 313406.0, "93XTYKL1TRCP77985": 313406.0, "9BRBC3F32R8271734": 127600.0, "9BRBC3F38R8268871": 127600.0, "9BRBC3F32R8272043": 127600.0, "9BRBC3F35R8267502": 127600.0, "9BRBC3F35R8267824": 127600.0, "9BRBC3F35R8268763": 127600.0, "9BRBC3F35R8271145": 127600.0, "9BRBC3F36R8271753": 127600.0, "9BRBC3F38R8272029": 127600.0, "9BRBC3F3XR8269309": 127600.0, "9BRBC3F32R8268090": 127600.0, "9BRBC3F33R8268678": 127600.0, "9BRBC3F36R8268643": 127600.0, "9BRBC3F38R8267476": 127600.0, "93XDLLC2TVCT12862": 283968.84, "93XDLLC2TVCT12854": 283968.84, "93XDLLC2TVCT12899": 283968.84, "93XDLLC2TVCT12846": 283968.84, "93XDLLC2TVCT12838": 283968.84, "93XDLLC2TVCT16549": 283968.84, "93XDLLC2TVCT16553": 283968.84, "93XDLLC2TVCT16557": 283968.84, "93XDLLC2TVCT16634": 283968.84, "93XDLLC2TVCT16643": 283968.84, "93XDLLC2TVCT16758": 283968.84, "93XDLLC2TVCT16764": 283968.84, "93XDLLC2TVCT16767": 283968.84, "93XDLLC2TVCT16773": 283968.84, "93XDLLC2TVCT16776": 283968.84, "93XDLLC2TVCT16778": 283968.84, "93XDLLC2TVCT16805": 283968.84, "93XDLLC2TVCT16807": 283968.84, "93XDLLC2TVCT16809": 283968.84, "93XDLLC2TVCT16811": 283968.84, "93XDLLC2TVCT16813": 283968.84, "93XDLLC2TVCT16815": 283968.84, "93XDLLC2TVCT16817": 283968.84, "93XDLLC2TVCT16819": 283968.84, "93XDLLC2TVCT16882": 283968.84, "93XDLLC2TVCT16890": 283968.84, "93XDLLC2TVCT16914": 283968.84, "93XDLLC2TVCT16561": 283968.84, "93XDLLC2TVCT16638": 283968.84, "93XDLLC2TVCT16649": 283968.84, "93XDLLC2TVCT16700": 283968.84, "93XDLLC2TVCT16761": 283968.84, "93XDLLC2TVCT16770": 283968.84, "93XDLLC2TVCT16878": 283968.84, "93XDLLC2TVCT16880": 283968.84, "93XDLLC2TVCT16886": 283968.84, "93XDLLC2TVCT16888": 283968.84, "93XDLLC2TVCT16912": 283968.84, "93XDLLC2TVCT16916": 283968.84, "93XDLLC2TVCT16918": 283968.84, "93XDLLC2TVCT16920": 283968.84, "93XDLLC2TVCT16922": 283968.84, "93XDLLC2TVCT16924": 283968.84, "93XDLLC2TVCT16926": 283968.84, "93XDLLC2TVCT16969": 283968.84, "93XDLLC2TVCT16971": 283968.84, "93XDLLC2TVCT17030": 283968.84, "93XDLLC2TVCT17032": 283968.84, "93XDLLC2TVCT17066": 283968.84, "93XDLLC2TVCT17070": 283968.84, "9535E6TB7VR001409": 1420000.0, "93XDLLC2TVCT14611": 267355.91, "93XDLLC2TVCT14615": 267355.91, "93XDLLC2TVCT14632": 267355.91, "93XDLLC2TVCT14634": 267355.91, "93XDLLC2TVCT14636": 267355.91, "93XDLLC2TVCT14638": 267355.91, "93XDLLC2TVCT14640": 267355.91, "93XDLLC2TVCT14642": 267355.91, "93XDLLC2TVCT14644": 267355.91, "93XDLLC2TVCT14646": 267355.91, "93XDLLC2TVCT14648": 267355.91, "93XDLLC2TVCT14650": 267355.91, "93XDLLC2TVCT14652": 267355.91, "93XDLLC2TVCT14703": 267355.91, "93XDLLC2TVCT14654": 267355.91, "93XSYKL1TSCR89018": 239060.36, "93XSYKL1TSCR89042": 239060.36, "93XSYKL1TSCR89619": 239060.36, "93XSYKL1TSCR91131": 239060.36, "93XSYKL1TSCR91331": 239060.36, "93XSYKL1TSCR91422": 239060.36, "3N1AB8AE8SY259967": 168082.82, "3N1AB8AE3TY200505": 168082.82, "8AP359AFWRU370626": 115435.99, "8AP359AFWRU372988": 115435.99, "8AP359AFWRU373585": 115435.99, "8AP359AFWRU373799": 115435.99, "8AP359AFWRU376990": 115435.99, "8AP359AFWRU378566": 115435.99, "8AP359AFTSU426911": 115435.99, "8AP359AFTSU431692": 115435.99, "8AP359AFTSU433314": 115435.99, "8AP359AFWRU372750": 115435.99, "8AP359AFWRU390024": 115435.99, "93XSYKL1TSCR90790": 270774.0, "93XSYKL1TSCR90801": 270774.0, "93XSYKL1TSCR90807": 270774.0, "93XSYKL1TSCR90813": 270774.0, "8AP359AFTSU418744": 115435.99, "93XSYKL1TSCR91144": 263934.95, "93XSYKL1TSCR86176": 254933.0, "93XSYKL1TSCR90862": 254933.0, "93XSYKL1TSCR90867": 254933.0, "93XSYKL1TSCR90874": 254933.0, "93XSYKL1TSCR90891": 254933.0, "93XSYKL1TSCR90895": 254933.0, "93XSYKL1TSCR90899": 254933.0, "93XSYKL1TSCR90904": 254933.0, "93XSYKL1TSCR90909": 254933.0, "93XSYKL1TSCR90916": 254933.0, "93XSYKL1TSCR90923": 254933.0, "93XSYKL1TSCR90930": 254933.0, "93XSYKL1TSCR90936": 254933.0, "93XSYKL1TSCR90942": 254933.0, "93XSYKL1TSCR90948": 254933.0, "93XSYKL1TSCR90956": 254933.0, "93XSYKL1TSCR90964": 254933.0, "9BRBC3F32R8298075": 127400.0, "9BRBC3F35R8298166": 127400.0, "93XSYKL1TSCR86827": 290500.0, "93XSYKL1TSCR86836": 290500.0, "93XSYKL1TSCR86846": 290500.0, "93XSYKL1TSCR86854": 290500.0, "93XSYKL1TSCR86863": 290500.0, "93XSYKL1TSCR86867": 290500.0, "93XSYKL1TSCR86876": 290500.0, "93XSYKL1TSCR86887": 290500.0, "93XSYKL1TSCR86898": 290500.0, "93XSYKL1TSCR86906": 290500.0, "93XSYKL1TSCR86913": 290500.0, "93XSYKL1TSCR86924": 290500.0, "93XSYKL1TSCR86932": 290500.0, "93XSYKL1TSCR86941": 290500.0, "93XSYKL1TSCR86949": 290500.0, "93XSYKL1TSCR86957": 290500.0, "93XSYKL1TSCR86967": 290500.0, "93XSYKL1TSCR86975": 290500.0, "93XSYKL1TSCR86983": 290500.0, "93XSYKL1TSCR86994": 290500.0, "93XSYKL1TSCR87546": 290500.0, "93XSYKL1TSCR87566": 290500.0, "93XSYKL1TSCR87579": 290500.0, "93XSYKL1TSCR87592": 290500.0, "93XSYKL1TSCR87605": 290500.0, "93XSYKL1TSCR87618": 290500.0, "93XSYKL1TSCR87631": 290500.0, "93XSYKL1TSCR87644": 290500.0, "93XSYKL1TSCR87657": 290500.0, "93XSYKL1TSCR87670": 290500.0, "93XSYKL1TSCR87683": 290500.0, "93XSYKL1TSCR87696": 290500.0, "93XSYKL1TSCR87708": 290500.0, "93XSYKL1TSCR87721": 290500.0, "93XSYKL1TSCR87735": 290500.0, "93XSYKL1TSCR87749": 290500.0, "93XSYKL1TSCR87761": 290500.0, "93XSYKL1TSCR87774": 290500.0, "93XSYKL1TSCR87788": 290500.0, "93XSYKL1TSCR87801": 290500.0, "93XSYKL1TSCR87892": 290500.0, "93XSYKL1TSCR87907": 290500.0, "93XSYKL1TSCR87921": 290500.0, "93XSYKL1TSCR87935": 290500.0, "93XSYKL1TSCR87948": 290500.0, "93XSYKL1TSCR87957": 290500.0, "93XSYKL1TSCR87970": 290500.0, "93XSYKL1TSCR87982": 290500.0, "93XSYKL1TSCR87995": 290500.0, "93XSYKL1TSCR88007": 290500.0, "93XSYKL1TSCR88021": 290500.0, "93XSYKL1TSCR88035": 290500.0, "93XSYKL1TSCR88048": 290500.0, "93XSYKL1TSCR88061": 290500.0, "93XSYKL1TSCR88072": 290500.0, "93XSYKL1TSCR88084": 290500.0, "93XSYKL1TSCR88097": 290500.0, "93XSYKL1TSCR88110": 290500.0, "93XSYKL1TSCR88123": 290500.0, "93XSYKL1TSCR88132": 290500.0, "9BRBC3F33S8316783": 127400.0, "9BRBC3F37S8316690": 127400.0, "9BRBC3F38R8276632": 127600.0, "9BRBC3F39R8276283": 127600.0, "93XTYKL1TSCR79930": 313406.0, "93XPYKL1TSCR79772": 313402.0, "9BRBC3F33R8271726": 127600.0, "9BRBC3F34R8270522": 127600.0, "9BRBC3F34R8270780": 127600.0, "9BRBC3F39R8270757": 127600.0, "93XTYKL1TSCR79947": 313406.0, "93XTYKL1TSCR79671": 313406.0, "93XTYKL1TSCR79673": 313406.0, "93XTYKL1TSCR79679": 313406.0, "8AP359AFXRU343302": 115435.99, "8AP359AFXRU343408": 115435.99, "9BM951104NB279883": 413195.0, "9BM951104NB281123": 413195.0, "9BM951104NB298628": 413195.0, "93XTYKL1TRCP77463": 313406.0, "93XTYKL1TRCP77660": 313406.0, "93XTYKL1TRCP77808": 313406.0, "93XTYKL1TRCP77842": 313406.0, "93XTYKL1TRCP77917": 313406.0, "93XTYKL1TRCP77964": 313406.0, "9BRBC3F33R8255512": 127400.0, "9BRBC3F33R8259883": 127400.0, "9BRBC3F36R8255150": 127400.0, "9BRBC3F38R8255408": 127400.0, "9BRBC3F39R8259239": 127400.0, "9BRBC3F39R8259662": 127400.0, "9BRBC3F3XR8259895": 127400.0, "9BG148FK0NC453751": 215943.0, "9BG148FK0NC453969": 215943.0, "9BG148FK0NC453971": 215943.0, "9BG148FK0NC454033": 215943.0, "9BRBY3BE1P4034228": 195000.0, "8AGBB69S0NR117127": 114700.0, "93XSYKL1TSCS93123": 263934.95, "8AP359AFTSU430968": 115435.99, "93XSYKL1TSCR90751": 270774.0, "93XSYKL1TSCR90757": 270774.0, "93XSYKL1TSCR90763": 270774.0, "93XSYKL1TSCR90774": 270774.0, "8AP359AFTSU418714": 115435.99, "8AP359AFTSU430970": 115435.99, "8AP359AFTSU431087": 115435.99, "8AP359AFTSU416947": 115435.99, "8AP359AFTSU418363": 115435.99, "8AP359AFTSU418619": 115435.99, "8AP359AFTSU418710": 115435.99, "8AP359AFTSU418847": 115435.99, "8AP359AFTSU418884": 115435.99, "93XSYKL1TSCR91186": 270000.0, "9BRBC3F31R8278433": 127400.0, "9BRBC3F36S8316499": 127400.0, "9BRBC3F37S8316947": 127400.0, "9BRBC3F33R8271760": 127600.0, "9BRBC3F34R8271962": 127600.0, "9BRBC3F31R8272678": 127600.0, "9BRBC3F32R8272351": 127600.0, "9BRBC3F38R8273049": 127600.0, "93XPYKL1TSCR79770": 313402.0, "93XTYKL1TSCR79920": 313406.0, "93XTYKL1TSCR79927": 313406.0, "8AP359AFXRU341379": 115435.99, "9BM951104NB280643": 413195.0, "9BM951104NB280779": 413195.0, "93XTYKL1TRCP77422": 313406.0, "93XTYKL1TRCP77714": 313406.0, "93XTYKL1TRCP77771": 313406.0, "93XTYKL1TRCP77773": 313406.0, "93XTYKL1TRCP77811": 313406.0, "93XTYKL1TRCP77830": 313406.0, "9BRBC3F34R8259827": 127400.0, "9BRBC3F34R8260024": 127400.0, "9BRBC3F35R8255334": 127400.0, "9BRBC3F35R8264194": 127400.0, "9BRBC3F35R8264292": 127400.0, "9BRBC3F36R8264138": 127400.0, "9BRBC3F36R8264253": 127400.0, "9BRBC3F37R8255464": 127400.0, "9BG156YK0NC451989": 233750.0, "3N1AB8AE2TY200849": 168082.82, "3N1AB8AE5TY200893": 168082.82, "3N1AB8AE8TY200905": 168082.82, "3N1AB8AEXTY200906": 168082.82, "3N1AB8AE0SY258358": 168082.82, "3N1AB8AE2SY258412": 168082.82, "3N1AB8AE1TY200454": 168082.82, "3N1AB8AE2TY200575": 168082.82, "8AP359AFTSU430853": 115435.99, "8AP359AFTSU431096": 115435.99, "8AP359AFTSU431708": 115435.99, "8AP359AFTSU432241": 115435.99, "8AP359AFTSU433621": 115435.99, "8AP359AFTSU435968": 115435.99, "8AP359AFTSU435972": 115435.99, "8AP359AFTSU418582": 115435.99, "8AP359AFTSU432214": 115435.99, "8AP359AFTSU435995": 115435.99, "8AP359AFTSU436072": 115435.99, "93XSYKL1TSCR90551": 270774.0, "93XSYKL1TSCR90561": 270774.0, "93XSYKL1TSCR90568": 270774.0, "93XSYKL1TSCR91151": 251671.0, "93XSYKL1TSCR91193": 251671.0, "9BRBC3F30R8297605": 127800.0, "9BRBC3F30R8297930": 127800.0, "9BRBC3F35R8297311": 127800.0, "93XTYKL1TSCR80236": 313406.0, "93XTYKL1TSCR80240": 313406.0, "93XTYKL1TSCR80251": 313406.0, "93XTYKL1TSCR80255": 313406.0, "93XTYKL1TSCR80282": 313406.0, "93XPYKL1TSCR79626": 313402.0, "93XPYKL1TSCR79720": 313402.0, "9BRBC3F37R8270787": 127600.0, "9BRBC3F38R8271222": 127600.0, "9BRBC3F30R8269724": 127600.0, "9BRBC3F32R8269305": 127600.0, "9BRBC3F33R8269488": 127600.0, "9BRBC3F33R8269586": 127600.0, "9BRBC3F37R8269607": 127600.0, "9BRBC3F39R8268135": 127600.0, "9BRBC3F3XR8267379": 127600.0, "9BRBC3F30R8268024": 127600.0, "9BRBC3F30R8268671": 127600.0, "9BRBC3F30R8268735": 127600.0, "93XTYKL1TRCP77469": 313406.0, "93XTYKL1TRCP77591": 313406.0, "93XTYKL1TRCP77897": 313406.0, "93XTYKL1TRCP77940": 313406.0, "93XTYKL1TRCP78030": 313406.0, "93XTYKL1TRCP78062": 313406.0, "9BM951104NB280807": 413195.0, "93XSYKL1TNCM44768": 117200.0, "93Y5SRJSXPJ312385": 92150.0, "8AFAR23L1JJ054259": 137500.0, "8AFAR23L2JJ042475": 137500.0, "8AFAR23L3JJ042503": 137500.0, "93XLNKB8TGCF21376": 119000.0, "93XLNKB8TGCF21379": 119000.0, "93XLNKB8TGCF21447": 119000.0, "9BM951501SB430040": 1697800.0, "93XSYKL1TSCS93273": 283884.09, "93XSYKL1TSCS93274": 283884.09, "93XSYKL1TSCS93275": 283884.09, "93XSYKL1TSCS93276": 283884.09, "93XSYKL1TSCR88996": 239060.36, "93XSYKL1TSCR91368": 239060.36, "93XSYKL1TSCR91526": 239060.36, "93XSYKL1TSCR91538": 239060.36, "91JPWC601S1000701": 9798.0, "91JPWC601S1000702": 9798.0, "3N1AB8AE2TY200706": 172000.0, "3N1AB8AE2TY200737": 172000.0, "3N1AB8AE6SY259045": 168082.82, "9BM951501SB420031": 1697800.0, "93XSYKL1TSCS93106": 263934.95, "93XSYKL1TSCS93108": 263934.95, "8AP359AFWRU373390": 115435.99, "8AP359AFWRU373455": 115435.99, "8AP359AFWRU373562": 115435.99, "8AP359AFWRU373589": 115435.99, "8AP359AFWRU373937": 115435.99, "8AP359AFWRU378581": 115435.99, "8AP359AFTSU415126": 115435.99, "8AP359AFTSU435932": 115435.99, "9BRBC3F38R8298713": 127600.0, "9BRBC3F34S8309986": 127600.0, "93XTYKL1TSCR80959": 313406.0, "93XTYKL1TSCR80962": 313406.0, "93XTYKL1TSCR80968": 313406.0, "93XTYKL1TSCR80971": 313406.0, "93XTYKL1TSCR80977": 313406.0, "93XTYKL1TSCR80981": 313406.0, "93XTYKL1TSCR80984": 313406.0, "93XTYKL1TSCR81010": 313406.0, "93XTYKL1TSCR81022": 313406.0, "93XTYKL1TSCR81027": 313406.0, "93XTYKL1TSCR81080": 313406.0, "93XPYKL1TSCR79639": 313402.0, "9BRBC3F31R8271949": 127600.0, "9BRBC3F36R8270912": 127600.0, "93XTYKL1TRCP77431": 313406.0, "93XTYKL1TRCP77452": 313406.0, "93XTYKL1TRCP77524": 313406.0, "93XTYKL1TRCP77758": 313406.0, "93XTYKL1TRCP77995": 313406.0, "9BRBC3F30R8268573": 127600.0, "9BRBC3F34R8268463": 127600.0, "9BRBC3F36R8267444": 127600.0, "9BRBC3F37R8268392": 127600.0, "9BRBC3F39R8267759": 127600.0, "9BRBC3F3XR8268063": 127600.0, "8AFAR23L0JJ062403": 145584.0, "8AFAR23L2JJ064914": 145584.0, "8AFAR23L3JJ061911": 145584.0, "8AFAR23L6JJ064947": 145584.0, "93XSYKL1TSCS93265": 283884.09, "93XSYKL1TSCS93263": 283884.09, "93XSYKL1TSCS93266": 283884.09, "93XSYKL1TSCS93267": 283884.09, "93XSYKL1TSCS93277": 283884.09, "93XSYKL1TSCS93279": 283884.09, "93XSYKL1TSCS93280": 283884.09, "3N1AB8AE9TY200766": 172000.0, "3N1AB8AEXTY200694": 172000.0, "3N1AB8AE0TY200624": 168082.82, "3N1AB8AE2TY200527": 168082.82, "3N1AB8AE0TY200770": 168082.82, "3N1AB8AE1TY200633": 168082.82, "93XSYKL1TSCR90950": 239060.36, "3N1AB8AE6TY200546": 168082.82, "3N1AB8AE7TY200605": 168082.82, "3N1AB8AE2TY200690": 172000.0, "3N1AB8AE6TY200692": 172000.0, "3N1AB8AE8TY200631": 172000.0, "3N1AB8AEXTY200596": 172000.0, "93XSYKL1TSCS92451": 270774.0, "93XSYKL1TSCS92452": 270774.0, "93XSYKL1TSCR90619": 270774.0, "93XSYKL1TSCR90634": 270774.0, "3N1AB8AE6TY200675": 172000.0, "3N1AB8AEXTY200646": 172000.0, "3N1AB8AE2SY257521": 168082.82, "8AP359AFTSU411804": 115435.99, "8AP359AFTSU414067": 115435.99, "8AP359AFTSU418671": 115435.99, "8AP359AFTSU418758": 115435.99, "8AP359AFTSU422175": 115435.99, "8AP359AFTSU422427": 115435.99, "8AP359AFTSU422578": 115435.99, "8AP359AFTSU418297": 115435.99, "8AP359AFTSU426301": 115435.99, "8AP359AFTSU427008": 115435.99, "8AP359AFTSU427518": 115435.99, "8AP359AFTSU427565": 115435.99, "8AP359AFWRU374906": 115435.99, "8AP359AFTSU418853": 115435.99, "8AP359AFTSU432645": 115435.99, "8AP359AFTSU435199": 115435.99, "8AP359AFTSU435267": 115435.99, "8AP359AFTSU435990": 115435.99, "8AP359AFTSU436009": 115435.99, "93XSYKL1TSCR91168": 251671.0, "9321FHMJ6DD655468": 53449.0, "9321FHMJ9DD655500": 53449.0, "8AFAR23LXJJ039405": 145584.0, "9BRBC3F32R8296729": 127600.0, "9BRBC3F35R8296661": 127600.0, "9BRBC3F35R8298068": 127600.0, "9BRBC3F37R8297956": 127600.0, "9BRBC3F32R8298657": 127600.0, "9BRBC3F33R8297839": 127600.0, "9BRBC3F32R8272401": 127600.0, "9BRBC3F35R8273039": 127600.0, "9BRBC3F36R8272921": 127600.0, "9BRBC3F37R8272572": 127600.0, "9BRBC3F34R8272920": 127600.0, "9BRBC3F38R8271026": 127600.0, "9BRBC3F3XR8272985": 127600.0, "9BRBC3F32R8297217": 127600.0, "9BRBC3F39R8295349": 127600.0, "9BRBC3F3XR8296655": 127600.0, "93XPYKL1TSCR79641": 313406.0, "93XTYKL1TSCR81000": 313406.0, "93XTYKL1TSCR81013": 313406.0, "93XTYKL1TSCR81016": 313406.0, "93XTYKL1TSCR81019": 313406.0, "93XTYKL1TSCR81051": 313406.0, "93XTYKL1TSCR81062": 313406.0, "93XTYKL1TSCR81054": 313402.0, "9BRBC3F30R8270873": 127600.0, "9BRBC3F36R8270246": 127600.0, "9BRBC3F37R8270501": 127600.0, "9BRBC3F3XR8270380": 127600.0, "9BRBC3F34R8272299": 127600.0, "9BRBC3F35R8269573": 127600.0, "9BRBC3F38R8271611": 127600.0, "9BRBC3F38R8272306": 127600.0, "9BRBC3F36R8296667": 127600.0, "9BRBC3F32R8293832": 127600.0, "9BRBC3F37R8293888": 127600.0, "9BRBC3F37R8294121": 127600.0, "9BRBC3F3XR8293898": 127600.0, "9BRBC3F3XR8294470": 127600.0, "93XPYKL1TSCR79746": 313402.0, "93XTYKL1TRCP77994": 313406.0, "9BRBC3F30R8268931": 127600.0, "9BRBC3F32R8269417": 127600.0, "9BRBC3F33R8267773": 127600.0, "9BRBC3F34R8267698": 127600.0, "9BRBC3F34R8267877": 127600.0, "9BRBC3F37R8267419": 127600.0, "9BRBC3F3XR8270122": 127600.0, "9BRBC3F3XR8271982": 127600.0, "93XTYKL1TRCP77747": 313406.0, "93XTYKL1TRCP77567": 313406.0, "9BRBC3F32R8270180": 127600.0, "9BRBC3F37R8270482": 127600.0, "93XTYKL1TRCP77671": 313406.0, "93XTYKL1TRCP77710": 313406.0, "93XTYKL1TRCP77982": 313406.0, "9BRBC3F30R8270260": 127600.0, "9BRBC3F33R8269149": 127600.0, "9BRBC3F35R8270254": 127600.0, "9BRBC3F36R8267718": 127600.0, "9BRBC3F39R8269012": 127600.0, "9BRBC3F39R8270239": 127600.0, "93XTYKL1TRCP77990": 313406.0, "93XTYKL1TRCP77745": 313406.0, "93XTYKL1TRCP77952": 313406.0, "93XTYKL1TRCP78042": 313406.0, "3N1AB8AE3TY200603": 172000.0, "3N1AB8AE5TY200649": 172000.0, "3N1AB8AE7TY200751": 172000.0, "93XTYKL1TRCP77434": 313406.0, "93XTYKL1TRCP77446": 313406.0, "93XTYKL1TRCP77500": 313406.0, "93XTYKL1TRCP77699": 313406.0, "93XTYKL1TRCP77719": 313406.0, "93XTYKL1TRCP77840": 313406.0, "93XTYKL1TRCP77904": 313406.0, "93XTYKL1TRCP78029": 313406.0, "9BRBC3F37R8269896": 127600.0, "9BRBC3F39R8269026": 127600.0, "9BRBY3BE3P4034165": 195000.0, "8AGBB69S0NR116796": 114700.0, "8AGBB69S0NR117175": 114700.0, "9BG148FK0FC407047": 196950.0, "8AFAR23L2JJ057512": 145584.0, "8AFAR23L8JJ061919": 145584.0, "9A9GA01CPMBFB9452": 89900.0, "9BG148FK0NC452558": 196950.0, "8AFAR23L1JJ047098": 138461.0, "8AFAR23L1JJ050910": 138461.0, "8AFAR23L1JJ054312": 138461.0, "8AFAR23L3JJ047104": 138461.0, "8AFAR23L6JJ045105": 138461.0, "9535E6TB8VR001418": 1420000.0, "93XDLLC2TVCT14831": 267355.91, "93XDLLC2TVCT14833": 267355.91, "93XDLLC2TVCT14837": 267355.91, "93XDLLC2TVCT14839": 267355.91, "93XDLLC2TVCT14841": 267355.91, "93XDLLC2TVCT14843": 267355.91, "93XDLLC2TVCT14846": 267355.91, "93XDLLC2TVCT14852": 267355.91, "93XDLLC2TVCT14855": 267355.91, "93XDLLC2TVCT14858": 267355.91, "93XDLLC2TVCT14835": 267355.91, "93XDLLC2TVCT14849": 267355.91, "93XDLLC2TVCT14861": 267355.91, "93XDLLC2TVCT14864": 267355.91, "9535E6TB0TR034698": 1420000.0, "9535E6TB1TR025508": 1420000.0, "9535E6TB5TR025849": 1420000.0, "93XSYKL1TSCS93110": 263934.95, "93XSYKL1TSCR90645": 270774.0, "93XSYKL1TSCR90682": 270774.0, "8AP359AFWRU373569": 115435.99, "8AP359AFTSU430877": 115435.99, "8AP359AFTSU432156": 115435.99, "8AP359AFTSU432508": 115435.99, "8AP359AFTSU418752": 115435.99, "8AP359AFTSU432661": 115435.99, "8AP359AFTSU433252": 115435.99, "8AP359AFTSU433593": 115435.99, "8AP359AFTSU434365": 115435.99, "93XSYKL1TSCR91161": 251671.0, "9BRBC3F34S8336833": 127600.0, "9BRBC3F36S8309830": 127600.0, "9BRBC3F34R8293234": 127600.0, "9BRBC3F38R8291972": 127600.0, "93XTYKL1TSCR81004": 313406.0, "93XTYKL1TSCR81007": 313406.0, "93XTYKL1TSCR81059": 313406.0, "93XTYKL1TSCR81068": 313406.0, "93XTYKL1TSCR81083": 313406.0, "93XTYKL1TSCR81168": 313406.0, "93XTYKL1TSCR81174": 313406.0, "93XPYKL1TSCR79643": 313402.0, "93XTYKL1TRCP77992": 313406.0, "93XTYKL1TRCP78059": 313406.0, "9BRBC3F30R8268217": 127600.0, "9BRBC3F31R8269201": 127600.0, "9BRBC3F32R8268624": 127600.0, "9BRBC3F38R8268613": 127600.0, "9BRBC3F36R8268965": 127600.0, "9BRBC3F39R8269639": 127600.0, "93XTYKL1TRCP77693": 313406.0, "93XTYKL1TRCP77706": 313406.0, "93XTYKL1TRCP77835": 313406.0, "93XTYKL1TRCP77850": 313406.0, "93XTYKL1TRCP78077": 313406.0, "9BG156FK0TC429979": 289017.0, "93XSYKL1TSCS93264": 283884.09, "3N1AB8AEXTY201070": 168082.82, "8AP359AFVSU452838": 115435.99, "3N1AB8AE4TY200349": 168082.82, "93XSYKL1TSCR86120": 303826.0, "93XSYKL1TSCS93126": 263934.95, "93XSYKL1TSCS93127": 263934.95, "93XSYKL1TSCR86121": 303826.0, "93XSYKL1TSCR86122": 303826.0, "93XSYKL1TSCR86123": 303826.0, "3N1AB8AEXSY236173": 160272.73, "8AP359AFTSU414105": 115435.99, "8AP359AFTSU416836": 115435.99, "8AP359AFTSU416852": 115435.99, "8AP359AFTSU416962": 115435.99, "8AP359AFTSU421648": 115435.99, "8AP359AFTSU422705": 115435.99, "8AP359AFTSU427514": 115435.99, "8AP359AFTSU431019": 115435.99, "8AP359AFTSU397881": 115435.99, "8AP359AFTSU403950": 115435.99, "8AP359AFTSU415099": 115435.99, "8AP359AFWRU372711": 115435.99, "8AP359AFWRU386820": 115435.99, "8AP359AFWRU390013": 115435.99, "8AP359AFWRU390076": 115435.99, "8AP359AFWRU371745": 115435.99, "9BRKC3F31S8344842": 129459.36, "9BRKC3F34S8331504": 129459.36, "9BRKC3F35S8330250": 129459.36, "9BRKC3F36S8345405": 129459.36, "9BRKC3F39S8329599": 129459.36, "9BRKC3F3XS8331829": 129459.36, "9BRKC3F3XS8332933": 129459.36, "93XSYKL1TSCR88508": 228255.95, "93XSYKL1TSCR87494": 270774.0, "93XSYKL1TSCR87533": 270774.0, "93XSYKL1TSCR88395": 254933.0, "9BG156FK0SC406439": 348600.0, "9BG156FK0SC408561": 348600.0, "9BG156FK0SC406818": 348600.0, "93XSYKL1TSCR87458": 270774.0, "93XSYKL1TSCR87446": 270774.0, "93XSYKL1TSCR87169": 270774.0, "93XSYKL1TSCR87175": 270774.0, "9BRBC3F33R8273296": 127600.0, "9BRBC3F34R8276319": 127600.0, "9BRBC3F38R8276551": 127600.0, "9BRBC3F39R8276428": 127600.0, "9BRBC3F32S8316354": 127600.0, "93XSYKL1TSCR88500": 228255.95, "93XSYKL1TSCR88521": 228255.95, "9BRBC3F32R8296472": 127600.0, "9BRBC3F33R8294746": 127600.0, "9BRBC3F33R8295802": 127600.0, "9BRBC3F38R8295522": 127600.0, "9BRBC3F34R8272741": 127600.0, "9BRBC3F38R8272435": 127600.0, "9BRBC3F38R8272841": 127600.0, "9BRBC3F3XR8272906": 127600.0, "9BRBC3F38R8294435": 127600.0, "9BRBC3F38R8294774": 127600.0, "9BRBC3F30R8271215": 127600.0, "9BRBC3F32R8272625": 127600.0, "9BRBC3F34R8270827": 127600.0, "9BRBC3F36R8271090": 127600.0, "9BRBC3F30R8273062": 127600.0, "9BRBC3F34R8272786": 127600.0, "9BRBC3F37R8273107": 127600.0, "9BRBC3F3XR8272288": 127600.0, "93XSYKL1TSCR80012": 310926.0, "93XSYKL1TSCR80014": 310926.0, "93XSYKL1TSCR80016": 310926.0, "9BRBC3F30R8271375": 127600.0, "9BRBC3F37R8270806": 127600.0, "9BRBC3F39R8270919": 127600.0, "9BRBC3F31R8270476": 127600.0, "9BRBC3F31R8272292": 127600.0, "9BRBC3F39R8269799": 127600.0, "9BRBC3F39R8270886": 127600.0, "93XTYKL1TSCR79556": 313406.0, "93XTYKL1TSCR79562": 313406.0, "93XTYKL1TSCR79577": 313406.0, "93XTYKL1TSCR79528": 313406.0, "93XTYKL1TSCR79554": 313406.0, "93XTYKL1TSCR79687": 313406.0, "93XTYKL1TSCR79689": 313406.0, "93XTYKL1TSCR79691": 313406.0, "93XTYKL1TRCP78350": 313406.0, "93XSYKL1TSCR88407": 254933.0, "93XTYKL1TSCR79549": 313406.0, "93XTYKL1TSCR79552": 313406.0, "93XTYKL1TSCR79564": 313406.0, "93XTYKL1TSCR79547": 313406.0, "93XTYKL1TSCR79567": 313406.0, "93XTYKL1TSCR79569": 313406.0, "93XTYKL1TSCR79571": 313406.0, "93XTYKL1TSCR79685": 313406.0, "93XTYKL1TRCP77647": 313406.0, "93XTYKL1TRCP77504": 313406.0, "93XTYKL1TRCP77626": 313406.0, "93XTYKL1TRCP77645": 313406.0, "93XTYKL1TRCP77669": 313406.0, "93XTYKL1TRCP77860": 313406.0, "93XTYKL1TRCP77945": 313406.0, "93XTYKL1TRCP78012": 313406.0, "93XTYKL1TSCR80156": 313406.0, "93XTYKL1TSCR80158": 313406.0, "8AP359AFXRU344145": 115435.99, "8AP359AFXRU346843": 115435.99, "8AP359AFXRU347925": 115435.99, "9BRBC3F31R8269943": 127600.0, "9BRBC3F32R8268056": 127600.0, "9BRBC3F35R8268083": 127600.0, "9BRBC3F35R8268665": 127600.0, "9BRBC3F38R8270135": 127600.0, "9BRBC3F39R8269480": 127600.0, "9BG148FK0NC453316": 215943.0, "9BG148FK0NC453765": 215943.0, "9BG148FK0NC453866": 215943.0, "9BG148FK0NC453906": 215943.0, "9BG148FK0NC453928": 215943.0, "9BG148FK0NC453930": 215943.0, "9BG148FK0NC453955": 215943.0, "9BG148FK0NC453991": 215943.0, "9BM951104NB279143": 413195.0, "9BM951104NB279344": 413195.0, "93YF62S09TJ331787": 549790.0, "93XSYKL1TSCS93246": 283968.84, "93XSYKL1TSCS93247": 283968.84, "93XSYKL1TSCS93248": 283968.84, "93XSYKL1TSCR90793": 239060.36, "93XSYKL1TSCR90810": 239060.36, "93XSYKL1TSCR90811": 239060.36, "93XSYKL1TSCR90820": 239060.36, "93XSYKL1TSCR91480": 239116.65, "93XSYKL1TSCR91485": 239116.65, "93XSYKL1TSCR90419": 239060.36, "3N1AB8AE2SY260600": 168082.82, "3N1AB8AE3SY260265": 168082.82, "91JPWC601S1000700": 9798.0, "3N1AB8AE7TY200569": 169069.57, "9BG156FK0TC404917": 305861.89, "9BG156FK0TC404918": 305861.89, "3N1AB8AE9TY200461": 168082.82, "9BRKC3F31S8358983": 129459.36, "9BRKC3F33S8358967": 129459.36, "93XSYKL1TRCP77901": 244900.0, "93XSYKL1TSCR86131": 303826.0, "93XSYKL1TSCR86132": 303826.0, "93XSYKL1TSCR86133": 303826.0, "8AP359AFTSU433121": 115435.99, "8AP359AFTSU433195": 115435.99, "8AP359AFTSU433563": 115435.99, "8AP359AFTSU433611": 115435.99, "8AP359AFTSU433800": 115435.99, "8AP359AFTSU426882": 115435.99, "8AP359AFTSU433821": 115435.99, "8AP359AFTSU433870": 115435.99, "8AP359AFTSU415235": 115435.99, "8AP359AFTSU435960": 115435.99, "8AP359AFTSU436087": 115435.99, "8AP359AFTSU436523": 115435.99, "8AP359AFWRU371797": 115435.99, "9BRKC3F30S8338630": 129459.36, "9BM951102SB402146": 466527.58, "9BRBC3F32S8351976": 127600.0, "9BRBC3F32S8352271": 127600.0, "9BRBC3F32S8352285": 127600.0, "9BRBC3F34S8352207": 127600.0, "9BRBC3F34S8352210": 127600.0, "9BRBC3F35S8352197": 127600.0, "9BRBC3F38S8352145": 127600.0, "9BRBC3F3XS8352213": 127600.0, "8AP359AFTSU401966": 115435.99, "8AP359AFTSU403195": 115435.99, "9321FHMJ4DD658658": 53449.0, "9321FHMJ8DD658677": 53449.0, "93PB40N31FC056098": 224000.0, "93XSYKL1TSCR88485": 228255.95, "93XSYKL1TSCR88495": 228255.95, "93XSYKL1TSCR88504": 228255.95, "93XSYKL1TSCR88516": 228255.95, "93XSYKL1TSCR88416": 254933.0, "93XSYKL1TSCR88424": 254933.0, "9BRBC3F3XR8276325": 127600.0, "9BRBC3F3XR8276387": 127600.0, "9BRBC3F35R8271792": 127600.0, "9BRBC3F39R8271343": 127600.0, "9BRBC3F31S8316300": 127400.0, "9BRBC3F35S8316185": 127400.0, "9BRBC3F37S8315779": 127400.0, "9BRBC3F3XS8317011": 127400.0, "9BRBC3F32R8271104": 127600.0, "9BRBC3F33R8270334": 127600.0, "9BRBC3F39R8271598": 127600.0, "9BRBC3F35R8271503": 127600.0, "9BRBC3F36R8272109": 127600.0, "93XTYKL1TSCR79937": 313406.0, "9BRBC3F38R8294645": 127400.0, "9BRBC3F36R8273244": 127600.0, "9BRBC3F38R8271740": 127600.0, "9BRBC3F38R8272340": 127600.0, "9BRBC3F39R8270810": 127600.0, "9BRBC3F30R8294171": 127400.0, "9BRBC3F31R8290517": 127400.0, "9BRBC3F33R8289949": 127400.0, "9BRBC3F33R8268096": 127600.0, "9BRBC3F35R8272618": 127600.0, "9BRBC3F39R8272363": 127600.0, "9BRBC3F32R8271071": 127600.0, "9BRBC3F33R8272553": 127600.0, "9BRBC3F33R8272665": 127600.0, "9BRBC3F38R8273309": 127600.0, "93XPYKL1TSCR79750": 313402.0, "9BRBC3F32R8294690": 127400.0, "9BRBC3F33R8294147": 127400.0, "9BRBC3F34R8294447": 127400.0, "9BRBC3F34R8294464": 127400.0, "8AP359AFXRU359917": 115435.99, "8AP359AFXRU359922": 115435.99, "8AP359AFXRU359925": 115435.99, "8AP359AFXRU359934": 115435.99, "8AP359AFXRU359952": 115435.99, "8AP359AFXRU360331": 115435.99, "9BRBC3F31R8271773": 127600.0, "9BRBC3F36R8271395": 127600.0, "9BRBC3F39R8272685": 127600.0, "9BRBC3F39R8272962": 127600.0, "9BRBC3F3XR8272212": 127600.0, "9BRBC3F3XR8272968": 127600.0, "9BRBC3F30R8270355": 127600.0, "9BRBC3F31R8271157": 127600.0, "9BRBC3F34R8270570": 127600.0, "9BRBC3F35R8270609": 127600.0, "9BRBC3F37R8270515": 127600.0, "9BRBC3F39R8271097": 127600.0, "8AP359AFXRU354129": 115435.99, "8AP359AFXRU355274": 115435.99, "8AP359AFXRU355882": 115435.99, "9BRBC3F32R8271006": 127600.0, "9BRBC3F34R8272223": 127600.0, "9BRBC3F36R8273292": 127600.0, "9BRBC3F39R8272606": 127600.0, "93XTYKL1TSCR79939": 313406.0, "93XTYKL1TSCR79941": 313406.0, "93XTYKL1TSCR79496": 313406.0, "8AP359AFXRU359847": 115435.99, "8AP359AFXRU359865": 115435.99, "8AP359AFXRU359868": 115435.99, "93XTYKL1TSCR79439": 313406.0, "93XTYKL1TSCR79502": 313406.0, "8AP359AFXRU357995": 115435.99, "8AP359AFXRU350420": 115435.99, "8AP359AFXRU350601": 115435.99, "8AP359AFXRU345621": 115435.99, "9BRBC3F31R8270817": 127600.0, "8AP359AFXRU359871": 115435.99, "8AP359AFXRU343423": 115435.99, "8AP359AFXRU346830": 115435.99, "8AP359AFXRU350068": 115435.99, "8AP359AFXRU350441": 115435.99, "93XSYKL1TRCP77852": 313406.0, "9BRBC3F30R8270839": 127600.0, "9BRBC3F34R8269290": 127600.0, "9BRBC3F35R8270576": 127600.0, "9BRBC3F36R8269825": 127600.0, "9BRBC3F38R8267431": 127600.0, "9BRBC3F38R8268272": 127600.0, "93XTYKL1TRCP77880": 313406.0, "8AP359AFXRU344772": 115435.99, "8AP359AFXRU350539": 115435.99, "8AP359AFXRU351640": 115435.99, "93XTYKL1TRCP77667": 313406.0, "8AP359AFXRU350411": 115435.99, "8AP359AFXRU350444": 115435.99, "8AP359AFXRU344638": 115435.99, "8AP359AFXRU344674": 115435.99, "8AP359AFXRU350536": 115435.99, "8AP359AFXRU350598": 115435.99, "93XSYKL1TRCP77833": 310926.0, "9BRBC3F32R8268784": 127600.0, "9BRBC3F38R8268529": 127600.0, "93XTYKL1TRCP77509": 313406.0, "93XTYKL1TRCP77701": 313406.0, "93XTYKL1TRCP77855": 313406.0, "93XTYKL1TRCP77947": 313406.0, "93XTYKL1TRCP77816": 313406.0, "93XTYKL1TRCP77847": 313406.0, "93XTYKL1TRCP77890": 313406.0, "93XTYKL1TRCP78057": 313406.0, "9BG148FK0NC444416": 203318.64, "3N1AB8AE6TY201048": 168082.82, "3N1AB8AE8TY201018": 168082.82, "3N1AB8AE8TY201052": 168082.82, "3N1AB8AE8TY201147": 168082.82, "3N1AB8AE0SY259493": 168082.82, "3N1AB8AE9SY259914": 168082.82, "3N1AB8AE0TY200493": 168082.82, "3N1AB8AE3TY200472": 168082.82, "3N1AB8AE5TY200490": 168082.82, "9BG156FK0TC404699": 305861.89, "9BG156FK0TC404914": 305861.89, "8AP359AFTSU413770": 115435.99, "8AP359AFTSU426740": 115435.99, "8AP359AFTSU433231": 115435.99, "8AP359AFTSU433835": 115435.99, "8AP359AFVTU454016": 115435.99, "8AP359AFWRU372782": 115435.99, "8AP359AFWRU372785": 115435.99, "8AP359AFTSU427522": 115435.99, "8AP359AFTSU436513": 115435.99, "9321FHMJ4DD655467": 53449.0, "9321FHMJ9DD653150": 53449.0, "9BRBC3F38S8326533": 127600.0, "9BRBC3F30S8324744": 127600.0, "9BRBC3F32S8324051": 127600.0, "9BRBC3F33S8324558": 127600.0, "9BRBC3F38S8326239": 127600.0, "9BRBC3F39S8325018": 127600.0, "9BRBC3F3XS8325075": 127600.0, "9BRBC3F35S8310077": 127600.0, "9BRBC3F31R8294888": 127600.0, "9BRBC3F39R8290619": 127600.0, "9BRBC3F39R8290944": 127600.0, "93XTYKL1TSCR81137": 313406.0, "93XTYKL1TSCR81153": 313406.0, "93XTYKL1TSCR81156": 313406.0, "93XTYKL1TSCR81164": 313406.0, "93XPYKL1TSCR79645": 313402.0, "93XPYKL1TSCR79648": 313402.0, "93XTYKL1TSCR80616": 313406.0, "93XTYKL1TSCR80619": 313406.0, "93XTYKL1TSCR80622": 313406.0, "93XTYKL1TSCR80625": 313406.0, "93XTYKL1TSCR80628": 313406.0, "93XTYKL1TSCR80631": 313406.0, "93XTYKL1TSCR80634": 313406.0, "93XTYKL1TSCR80660": 313406.0, "93XTYKL1TSCR80663": 313406.0, "93XTYKL1TSCR80666": 313406.0, "93XTYKL1TSCR80669": 313406.0, "93XTYKL1TSCR80672": 313406.0, "93XTYKL1TSCR80692": 313406.0, "93XTYKL1TSCR80695": 313406.0, "93XTYKL1TSCR80723": 313406.0, "93XTYKL1TSCR80727": 313406.0, "93XTYKL1TSCR80730": 313406.0, "93XTYKL1TSCR80733": 313406.0, "93XTYKL1TSCR80781": 313406.0, "93XTYKL1TSCR80787": 313406.0, "93XTYKL1TSCR80790": 313406.0, "93XTYKL1TSCR80793": 313406.0, "93XTYKL1TSCR80836": 313406.0, "93XTYKL1TSCR80839": 313406.0, "93XTYKL1TSCR80842": 313406.0, "93XTYKL1TSCR80845": 313406.0, "93XTYKL1TSCR80868": 313406.0, "93XTYKL1TSCR80872": 313406.0, "93XTYKL1TSCR80875": 313406.0, "93XTYKL1TSCR80878": 313406.0, "93XTYKL1TSCR80933": 313406.0, "93XTYKL1TSCR80939": 313406.0, "93XTYKL1TSCR80942": 313406.0, "93XTYKL1TSCR80945": 313406.0, "93XTYKL1TSCR80987": 313406.0, "93XTYKL1TSCR80990": 313406.0, "93XTYKL1TSCR80994": 313406.0, "93XTYKL1TSCR80997": 313406.0, "93XTYKL1TSCR81033": 313406.0, "93XTYKL1TSCR81036": 313406.0, "93XTYKL1TSCR81042": 313406.0, "93XTYKL1TSCR81045": 313406.0, "93XTYKL1TSCR81086": 313406.0, "93XTYKL1TSCR81091": 313406.0, "93XTYKL1TSCR81094": 313406.0, "93XTYKL1TSCR81097": 313406.0, "93XTYKL1TSCR81143": 313406.0, "93XTYKL1TSCR81147": 313406.0, "93XTYKL1TSCR81184": 313406.0, "93XTYKL1TSCR81187": 313406.0, "93XTYKL1TSCR81190": 313406.0, "93XTYKL1TSCR81193": 313406.0, "93XTYKL1TSCR81216": 313406.0, "93XTYKL1TSCR81222": 313406.0, "93XTYKL1TSCR81229": 313406.0, "93XTYKL1TSCR81235": 313406.0, "93XTYKL1TSCR81242": 313406.0, "93XTYKL1TSCR81266": 313406.0, "93XTYKL1TSCR81273": 313406.0, "93XTYKL1TSCR81279": 313406.0, "93XTYKL1TSCR81287": 313406.0, "93XTYKL1TSCR81318": 313406.0, "93XTYKL1TSCR81321": 313406.0, "93XTYKL1TSCR81324": 313406.0, "93XTYKL1TSCR81327": 313406.0, "93XTYKL1TSCR81379": 313406.0, "93XTYKL1TSCR81386": 313406.0, "93XTYKL1TSCR81389": 313406.0, "93XTYKL1TSCR81392": 313406.0, "93XTYKL1TSCR81398": 313406.0, "93XTYKL1TSCR81419": 313406.0, "93XTYKL1TSCR81423": 313406.0, "93XTYKL1TSCR81426": 313406.0, "93XTYKL1TSCR81429": 313406.0, "93XTYKL1TSCR81432": 313406.0, "93XTYKL1TSCR79659": 313406.0, "93XTYKL1TSCR79667": 313406.0, "9BRBC3F30R8270629": 127600.0, "9BRBC3F30R8271196": 127600.0, "9BRBC3F38R8270880": 127600.0, "93XTYKL1TRCP78706": 313406.0, "93XTYKL1TRCP78710": 313406.0, "93XTYKL1TRCP78712": 313406.0, "93XTYKL1TRCP78715": 313406.0, "93XTYKL1TRCP78717": 313406.0, "93XTYKL1TRCP78721": 313406.0, "93XTYKL1TRCP78730": 313406.0, "93XTYKL1TRCP78732": 313406.0, "93XTYKL1TRCP78738": 313406.0, "93XTYKL1TRCP78740": 313406.0, "93XTYKL1TRCP78747": 313406.0, "93XTYKL1TRCP78751": 313406.0, "93XTYKL1TRCP78755": 313406.0, "93XTYKL1TRCP78757": 313406.0, "93XTYKL1TRCP78759": 313406.0, "93XTYKL1TRCP78761": 313406.0, "93XTYKL1TRCP78768": 313406.0, "93XTYKL1TRCP78774": 313406.0, "93XTYKL1TRCP78778": 313406.0, "93XTYKL1TRCP78789": 313406.0, "93XTYKL1TRCP78791": 313406.0, "93XTYKL1TRCP78793": 313406.0, "93XTYKL1TRCP78795": 313406.0, "9BG148FK0NC453878": 215943.0, "9BG148FK0NC453891": 215943.0, "9BG148FK0NC453911": 215943.0, "9BG148FK0NC453981": 215943.0, "9BG148FK0NC454024": 215943.0, "93XTYKL1TRCP77515": 313406.0, "93XTYKL1TRCP77532": 313406.0, "93XTYKL1TRCP77673": 313406.0, "93XTYKL1TRCP77756": 313406.0, "93XTYKL1TRCP78014": 313406.0, "9BRBC3F30R8267858": 127600.0, "9BRBC3F31R8268050": 127600.0, "9BRBC3F31R8269330": 127600.0, "9BRBC3F33R8271936": 127600.0, "9BRBC3F34R8268043": 127600.0, "9BRBC3F37R8267386": 127600.0, "9BRBC3F38R8272077": 127600.0, "9BRBC3F3XR8269925": 127600.0, "3N1AB8AE0TY200879": 168082.82, "3N1AB8AE2TY200799": 168082.82, "3N1AB8AE2TY200821": 168082.82, "3N1AB8AE5TY200876": 168082.82, "93XSYKL1TSCR90579": 270774.0, "93XSYKL1TSCR90586": 270774.0, "8AP359AFTSU403397": 115435.99, "8AP359AFTSU410819": 115435.99, "8AP359AFTSU418575": 115435.99, "8AP359AFTSU418738": 115435.99, "8AP359AFTSU418808": 115435.99, "8AP359AFTSU418903": 115435.99, "8AP359AFTSU426960": 115435.99, "8AP359AFWRU371824": 115435.99, "9BG148FK0NC406593": 195000.0, "9BG148FK0NC406650": 195000.0, "9BRBC3F34R8297624": 127800.0, "9BRBC3F32R8298447": 127800.0, "93XTYKL1TSCR80294": 313406.0, "93XTYKL1TSCR80303": 313406.0, "93XTYKL1TRCP77496": 313406.0, "93XTYKL1TRCP77637": 313406.0, "93XTYKL1TRCP77775": 313406.0, "93XTYKL1TRCP77865": 313406.0, "93XTYKL1TRCP78060": 313406.0, "9BRBC3F36R8268979": 127600.0, "9BRBC3F38R8267705": 127600.0, "9BRBC3F38R8269275": 127600.0, "9BRBC3F39R8269267": 127600.0, "9BRBC3F3XR8269553": 127600.0, "93XPYKL1TRCP76491": 313402.0, "93XPYKL1TRCP76802": 313402.0, "93XPYKL1TRCP76815": 313402.0, "93XPYKL1TRCP76824": 313402.0, "93XPYKL1TRCP76881": 313402.0, "93XPYKL1TRCP76929": 313402.0, "93XPYKL1TRCP76951": 313402.0, "93XPYKL1TRCP76977": 313402.0, "93XPYKL1TRCP77008": 313402.0, "93XPYKL1TRCP77065": 313402.0, "9BG156YK0NC451960": 233750.0, "9BG148FK0NC453761": 215943.0, "9BG148FK0NC453997": 215943.0, "9BG148FK0NC449712": 196950.0, "9BG148FK0NC449717": 196950.0, "9BG148FK0NC449719": 196950.0, "9BG148FK0NC449728": 196950.0, "9BG148FK0NC449734": 196950.0, "93Y5SRJSXPJ312433": 92150.0, "8AGBB69S0NR116785": 114700.0, "8AGBB69S0NR116828": 114700.0, "8AGBB69S0NR116845": 114700.0, "8AGBB69S0NR116970": 114700.0, "8AGBB69S0NR117007": 114700.0, "8AGBB69S0NR117022": 114700.0, "8AGBB69S0NR117038": 114700.0, "93Y5SRJSXPJ312343": 92150.0, "93Y5SRJSXPJ312383": 92150.0, "93Y5SRJSXPJ312422": 92150.0, "8AFAR23L0JJ037744": 145584.0, "8AFAR23L6JJ041524": 145584.0, "93XSYKL1TSCS93142": 283884.09, "93XSYKL1TSCS93003": 318226.54, "93XSYKL1TSCS93001": 318226.54, "93XSYKL1TSCS93000": 318226.54, "93XSYKL1TSCS93005": 318226.54, "93XSYKL1TSCS93004": 318226.54, "93XSYKL1TSCS93010": 318226.54, "93XSYKL1TSCS93009": 318226.54, "93XSYKL1TSCS93008": 318226.54, "93XSYKL1TSCS93013": 318226.54, "93XSYKL1TSCS93012": 318226.54, "93XSYKL1TSCS93011": 318226.54, "93XSYKL1TSCS93292": 283884.09, "3N1AB8AEXTY200758": 172000.0, "93XSYKL1TSCS93230": 283968.84, "3N1AB8AE1TY201300": 168082.82, "3N1AB8AE2TY200785": 168082.82, "93XSYKL1TSCS93234": 283968.84, "93XSYKL1TSCS93244": 283968.84, "3N1AB8AE5TY201266": 168082.82, "3N1AB8AE6TY201308": 168082.82, "8AP359AFTSU427136": 115435.99, "3N1AB8AE1TY200566": 168082.82, "3N1AB8AE2TY200513": 168082.82, "8AP359AFTSU426872": 115435.99, "8AP359AFTSU426924": 115435.99, "8AP359AFTSU426958": 115435.99, "8AP359AFTSU427492": 115435.99, "8AP359AFTSU427535": 115435.99, "8AP359AFWRU372581": 115435.99, "93XSYKL1TSCR90420": 270774.0, "8AP359AFWRU380543": 115435.99, "93XSYKL1TSCR91147": 251671.0, "93XSYKL1TSCR91214": 251671.0, "9BRBC3F37R8297018": 127800.0, "9BRBC3F32R8296858": 127800.0, "9BRBC3F36R8297821": 127800.0, "93XTYKL1TSCR80331": 313406.0, "9BM951104NB280619": 413195.0, "93XTYKL1TRCP77658": 313406.0, "93XTYKL1TRCP77697": 313406.0, "93XTYKL1TRCP77749": 313406.0, "93XTYKL1TRCP77867": 313406.0, "93XTYKL1TRCP77899": 313406.0, "93XTYKL1TRCP77919": 313406.0, "9BRBC3F35R8267404": 127600.0, "9BRBC3F35R8269394": 127600.0, "9BRBC3F37R8269073": 127600.0, "9BRBC3F3XR8267463": 127600.0, "9BRBC3F3XR8268919": 127600.0, "93PB40N31FC056122": 224000.0, "8AFAR23L4JJ041487": 145584.0, "8AFAR23L7JJ034274": 145584.0, "8AFAR23L6JJ039434": 145584.0, "8BCND5GVUKG523063": 75998.0, "8BCND5GVULG500843": 75998.0, "8BCND5GVULG500847": 75998.0, "8BCND5GVULG500850": 75998.0, "8BCND5GVULG501317": 75998.0, "8BCND5GVULG501338": 75998.0, "91JPWC601T1000704": 9798.0, "3N1AB8AE9SY260433": 168082.82, "93XSYKL1TSCS93128": 263934.95, "93XSYKL1TSCS93129": 263934.95, "93XSYKL1TSCS92357": 273500.0, "9321FHMJ1DD656446": 53449.0, "9321FHMJ9DD655416": 53449.0, "8AP359AFTSU418716": 115435.99, "8AP359AFTSU432152": 115435.99, "8AP359AFTSU432920": 115435.99, "8AP359AFTSU433306": 115435.99, "9BG156FK0SC405875": 340287.64, "9BG156FK0SC421628": 340287.64, "9BG156FK0SC429117": 340287.64, "9BG156FK0SC429144": 340287.64, "9BG156FK0SC429146": 340287.64, "9BG156FK0SC429147": 340287.64, "9BG156FK0SC429148": 340287.64, "9BG156FK0SC429150": 340287.64, "9BG156FK0SC429176": 340287.64, "9BG156FK0SC429204": 340287.64, "9BG156FK0SC429232": 340287.64, "9BG156FK0SC429257": 340287.64, "9BG156FK0SC429259": 340287.64, "9BG156FK0SC429300": 340287.64, "9BG156FK0SC429329": 340287.64, "9BG156FK0SC429370": 340287.64, "9BG156FK0SC429398": 340287.64, "9BG156FK0SC432027": 340287.64, "9BG156FK0SC432028": 340287.64, "9BG156FK0SC432033": 340287.64, "9BG156FK0SC432035": 340287.64, "9BG156FK0SC432206": 340287.64, "9BG156FK0SC432207": 340287.64, "9BG156FK0SC432208": 340287.64, "9BG156FK0SC432210": 340287.64, "9BG156FK0SC432961": 340287.64, "9BG156FK0SC432962": 340287.64, "9BG156FK0SC432963": 340287.64, "9BG156FK0SC432964": 340287.64, "9BG156FK0SC432965": 340287.64, "9BG156FK0SC432966": 340287.64, "9BG156FK0SC432970": 340287.64, "9BG156FK0SC433000": 340287.64, "9BG156FK0SC433055": 340287.64, "9BG156FK0SC433077": 340287.64, "9BG156FK0SC433095": 340287.64, "9BG156FK0SC433100": 340287.64, "8AP359AFTSU432155": 115435.99, "8AP359AFTSU432541": 115435.99, "8AP359AFTSU432878": 115435.99, "8AP359AFTSU433112": 115435.99, "8AP359AFTSU433210": 115435.99, "8AP359AFTSU433568": 115435.99, "9BM951102SB401320": 466527.58, "93XSYKL1TSCR88479": 228255.95, "9BG156FK0RC428052": 348600.0, "9BG156FK0RC428053": 348600.0, "9BG156FK0RC428070": 348600.0, "9BG156FK0RC428074": 348600.0, "9BG156FK0RC428170": 348600.0, "9BG156FK0RC428171": 348600.0, "9BG156FK0RC432875": 348600.0, "9BRBC3F30S8316756": 127600.0, "9BRBC3F35S8316994": 127600.0, "9BRBC3F30S8306101": 127600.0, "9BRBC3F32S8307508": 127600.0, "9BRBC3F33S8305508": 127600.0, "9BRBC3F34R8296098": 127600.0, "9BRBC3F34R8298708": 127600.0, "9BRBC3F32R8298691": 127600.0, "9BRBC3F30R8270162": 127600.0, "9BRBC3F35R8270724": 127600.0, "9BRBC3F38R8270488": 127600.0, "93XTYKL1TSCR80160": 313406.0, "93XTYKL1TSCR80162": 313406.0, "93XPYKL1TSCR79787": 313402.0, "93XTYKL1TSCR79573": 313406.0, "93XTYKL1TSCR79575": 313406.0, "9BRBC3F31R8270154": 127600.0, "9BRBC3F31R8270557": 127600.0, "9BRBC3F32R8269904": 127600.0, "9BRBC3F32R8270468": 127600.0, "9BRBC3F33R8270530": 127600.0, "9BRBC3F35R8270691": 127600.0, "9BRBC3F36R8270148": 127600.0, "9BRBC3F36R8270456": 127600.0, "9BRBC3F39R8271164": 127600.0, "9BRBC3F3XR8270797": 127600.0, "9BRBC3F3XR8272632": 127600.0, "93XTYKL1TRCP77610": 313406.0, "93XTYKL1TRCP77428": 313406.0, "9BRBC3F30R8267990": 127600.0, "9BRBC3F38R8267977": 127600.0, "9BRBC3F38R8268076": 127600.0, "9BRBC3F39R8268183": 127600.0, "9BG148FK0NC453559": 215943.0, "9BG148FK0NC453783": 215943.0, "9BG148FK0NC453795": 215943.0, "9BG148FK0NC453894": 215943.0, "9BG148FK0NC453947": 215943.0, "93XTYKL1TRCP77416": 313406.0, "93XTYKL1TRCP77443": 313406.0, "93XTYKL1TRCP77682": 313406.0, "93XTYKL1TRCP77869": 313406.0, "93XTYKL1TRCP77972": 313406.0, "93XTYKL1TRCP77977": 313406.0, "9BM951104TB434374": 477400.0, "93XSYKL1TSCS93006": 318226.54, "93XSYKL1TSCR90786": 239060.36, "93XSYKL1TSCS93148": 283968.84, "93XSYKL1TSCR90858": 267355.91, "93XSYKL1TSCR91137": 267355.91, "93XSYKL1TSCR90914": 239060.36, "93XSYKL1TSCR90512": 239060.36, "93XSYKL1TSCR90884": 239060.36, "93XSYKL1TSCS93232": 283968.84, "93XSYKL1TSCS93233": 283968.84, "93XSYKL1TSCS93242": 283968.84, "93XSYKL1TSCS93243": 283968.84, "93XSYKL1TSCS93249": 283968.84, "3N1AB8AE3SY261738": 168082.82, "3N1AB8AEXSY261638": 168082.82, "9BRKC3F34S8354040": 129459.36, "93XSYKL1TSCS93245": 283968.84, "3N1AB8AE8TY200466": 168082.82, "3N1AB8AEXTY200338": 168082.82, "9BRKC3F31S8350883": 129459.36, "9BRKC3F32S8355672": 129459.36, "9BRKC3F34S8354944": 129459.36, "9BG156FK0SC433170": 340287.64, "9BRKC3F30S8349451": 129459.36, "9BRKC3F38S8358723": 129459.36, "9BRKC3F38S8359922": 129459.36, "9BRKC3F39S8357466": 129459.36, "93XSYKL1TSCR86125": 303826.0, "93XSYKL1TSCR86124": 326000.0, "93XSYKL1TSCR86126": 326000.0, "3N1AB8AE4SY232152": 157477.27, "93XSYKL1TSCR87422": 270774.0, "8AP359AFWRU373597": 115435.99, "8AP359AFTSU403775": 115435.99, "8AP359AFTSU404357": 115435.99, "8AP359AFTSU410390": 115435.99, "8AP359AFTSU422307": 115435.99, "8AP359AFTSU422440": 115435.99, "8AP359AFTSU432611": 115435.99, "8AP359AFTSU433908": 115435.99, "9BG156FK0SC417032": 291649.77, "9BG156FK0SC417037": 291649.77, "9BG156FK0SC417041": 291649.77, "8AP359AFWRU390034": 115435.99, "8AP359AFTSU418052": 115435.99, "8AP359AFWRU390069": 115435.99, "9BRKC3F31S8333887": 129459.36, "9BRKC3F33S8333681": 129459.36, "9BRKC3F34S8332412": 129459.36, "9BRKC3F39S8332308": 129459.36, "9BRKC3F39S8333328": 129459.36, "93XSYKL1TSCR88550": 228255.95, "93XSYKL1TSCR88554": 228255.95, "93XSYKL1TSCR88432": 254933.0, "93XSYKL1TSCR88441": 254933.0, "93XSYKL1TSCR88453": 254933.0, "93XSYKL1TSCR90818": 254933.0, "93XSYKL1TSCR90827": 254933.0, "93XSYKL1TSCR90832": 254933.0, "93XSYKL1TSCR90837": 254933.0, "93XSYKL1TSCR90843": 254933.0, "93XSYKL1TSCR90849": 254933.0, "93XSYKL1TSCR90855": 254933.0, "9BRBC3F34S8316887": 127600.0, "93XSYKL1TSCR87470": 270774.0, "93XSYKL1TSCR82660": 254933.0, "9BG156FK0SC406428": 348600.0, "9BG156FK0SC406990": 348600.0, "9BG156FK0SC408885": 348600.0, "9BG156FK0SC408954": 348600.0, "9BG156FK0SC412327": 348600.0, "9BG156FK0SC412090": 348600.0, "9BRBC3F31S8316927": 127600.0, "9BRBC3F30R8296549": 127600.0, "9BRBC3F34R8298188": 127600.0, "9BRBC3F34S8315545": 127600.0, "9BRKC3F31S8338622": 129459.36, "9BRBC3F30R8294168": 127600.0, "9BRBC3F39R8294220": 127600.0, "9BRBC3F3XR8293979": 127600.0, "9BRBC3F30R8294333": 127600.0, "9BRBC3F35R8294098": 127600.0, "9BRBC3F36R8293543": 127600.0, "9BRBC3F36R8294191": 127600.0, "9BRBC3F38R8293852": 127600.0, "9BRBC3F30R8292940": 127600.0, "9BRBC3F33R8293533": 127600.0, "9BRBC3F34R8292939": 127600.0, "9BRBC3F34R8293122": 127600.0, "9BRBC3F34R8293508": 127600.0, "9BRBC3F35R8293579": 127600.0, "9BRBC3F37R8293518": 127600.0, "9BRBC3F37R8293602": 127600.0, "9BRBC3F37R8293678": 127600.0, "9BRBC3F38R8293043": 127600.0, "9BRBC3F3XR8293108": 127600.0, "9BRBC3F32R8271183": 127600.0, "9BRBC3F39R8269883": 127600.0, "9BRKC3F35S8338395": 129459.36, "93XTYKL1TRCP78381": 313406.0, "93XTYKL1TRCP78383": 313406.0, "8AP359AFXRU349402": 115435.99, "8AP359AFXRU351601": 115435.99, "8AP359AFXRU355281": 115435.99, "8AP359AFXRU357886": 115435.99, "93XTYKL1TRCP78356": 313406.0, "93XTYKL1TRCP78358": 313406.0, "93XTYKL1TRCP78360": 313406.0, "93XTYKL1TRCP78372": 313406.0, "93XTYKL1TRCP78376": 313406.0, "93XTYKL1TRCP78388": 313406.0, "93XSYKL1TRCP77810": 310926.0, "8AP359AFXRU357117": 115435.99, "8AP359AFXRU357169": 115435.99, "8AP359AFXRU359471": 115435.99, "8AP359AFXRU361559": 115435.99, "8AP359AFXRU363232": 115435.99, "8AP359AFXRU363662": 115435.99, "8AP359AFXRU363666": 115435.99, "8AP359AFXRU363668": 115435.99, "8AP359AFXRU363670": 115435.99, "8AP359AFXRU363694": 115435.99, "8AP359AFXRU366360": 115435.99, "93XPYKL1TRCP78685": 313402.0, "93XPYKL1TRCP78689": 313402.0, "93XPYKL1TRCP78693": 313402.0, "93XPYKL1TRCP78702": 313402.0, "93XPYKL1TRCP78749": 313402.0, "8AP359AFXRU349465": 115435.99, "8AP359AFXRU356378": 115435.99, "8AP359AFXRU357182": 115435.99, "8AP359AFXRU359508": 115435.99, "8AP359AFXRU359771": 115435.99, "8AP359AFXRU361079": 115435.99, "8AP359AFXRU361493": 115435.99, "8AP359AFXRU361680": 115435.99, "93XTYKL1TRCP77634": 313406.0, "93XTYKL1TRCP77712": 313406.0, "93XTYKL1TRCP77895": 313406.0, "93XTYKL1TRCP77910": 313406.0, "93XTYKL1TRCP77989": 313406.0, "93XTYKL1TRCP78044": 313406.0, "9BG148FK0NC453942": 215943.0, "9BM951104NB280356": 413195.0, "93XSYKL1TSCS93007": 318226.54, "93XDLLC2TVCT13067": 283968.84, "93XDLLC2TVCT12978": 283968.84, "93XDLLC2TVCT12973": 283968.84, "93XDLLC2TVCT14052": 267355.91, "93XDLLC2TVCT14058": 267355.91, "93XDLLC2TVCT14031": 267355.91, "93XDLLC2TVCT14046": 267355.91, "3N1AB8AE4SY259710": 168082.82, "3N1AB8AE8SY259726": 168082.82, "3N1AB8AE7TY200460": 168082.82, "93XSYKL1TSCS93122": 263934.95, "8AP359AFTSU406439": 115435.99, "93XSYKL1TSCR90687": 270774.0, "93XSYKL1TSCR90692": 270774.0, "8AP359AFTSU418768": 115435.99, "8AP359AFTSU418845": 115435.99, "8AP359AFTSU418879": 115435.99, "8AP359AFTSU418881": 115435.99, "8AP359AFTSU418897": 115435.99, "8AP359AFTSU418899": 115435.99, "8AP359AFTSU408193": 115435.99, "8AP359AFTSU422389": 115435.99, "8AP359AFTSU427623": 115435.99, "8AP359AFTSU436510": 115435.99, "8AP359AFTSU416568": 115435.99, "9BRBC3F30S8317017": 127600.0, "9BRBC3F3XS8316523": 127600.0, "9BRBC3F38S8316732": 127600.0, "9BRBC3F3XS8316506": 127600.0, "9BRBC3F31R8298147": 127600.0, "9BRBC3F34R8297347": 127600.0, "9BRBC3F30R8294087": 127600.0, "9BRBC3F33R8294035": 127600.0, "9BRBC3F37R8294720": 127600.0, "9BRBC3F39R8290913": 127600.0, "9BRBC3F30R8272204": 127600.0, "9BRBC3F33R8269135": 127600.0, "93XTYKL1TSCR81100": 313406.0, "93XTYKL1TSCR81103": 313406.0, "93XTYKL1TSCR81106": 313406.0, "93XTYKL1TSCR81109": 313406.0, "93XTYKL1TSCR81113": 313406.0, "93XTYKL1TSCR81116": 313406.0, "93XTYKL1TSCR81124": 313406.0, "93XTYKL1TSCR81127": 313406.0, "93XTYKL1TSCR81134": 313406.0, "93XTYKL1TSCR79669": 313406.0, "9BRBC3F32R8268011": 127600.0, "9BRBC3F33R8271841": 127600.0, "9BRBC3F34R8271928": 127600.0, "9BRBC3F36R8271431": 127600.0, "9BRBC3F38R8268580": 127600.0, "9BRBC3F3XR8268659": 127600.0, "93XTYKL1TRCP77401": 313406.0, "93XTYKL1TRCP77621": 313406.0, "93XTYKL1TRCP77721": 313406.0, "93XTYKL1TRCP77762": 313406.0, "93XTYKL1TRCP77823": 313406.0, "93Y5SRJSXPJ312342": 92150.0, "93Y5SRJSXPJ312346": 92150.0, "93YF62S04TJ448953": 344772.73, "9BG156FK0TC429041": 289017.0, "9BG156FK0TC429155": 289017.0, "9BG156FK0TC429758": 289017.0, "9BG156FK0TC417113": 289017.0, "9BG156FK0TC429760": 289017.0, "9BG156FK0TC429043": 289017.0, "9BG156FK0TC430262": 289017.0, "9BG156FK0TC429763": 289017.0, "9BG156FK0TC417109": 289017.0, "9BG156FK0TC430375": 289017.0, "9BG156FK0TC430218": 289017.0, "9BG156FK0TC429757": 289017.0, "9BG156FK0TC417111": 289017.0, "9BG156FK0TC429182": 289017.0, "9BM951104SB412868": 619900.0, "93XSYKL1TSCR91529": 239116.65, "93XSYKL1TSCS93231": 283968.84, "3N1AB8AEXTY200517": 172000.0, "9BG156FK0SC432024": 305861.89, "9BG156FK0SC436696": 305861.89, "9BG156FK0TC404701": 305861.89, "9BG156FK0TC404912": 305861.89, "9BG156FK0TC404916": 305861.89, "9BG156FK0TC405137": 305861.89, "3N1AB8AEXTY200565": 160069.57, "9BRKC3F37S8349270": 129459.36, "9BRKC3F39S8349335": 129459.36, "9BRKC3F39S8349111": 129459.36, "9BRKC3F38S8348791": 129459.36, "9BRKC3F39S8349237": 129459.36, "9BRKC3F37S8357420": 129459.36, "9BRKC3F34S8350487": 129459.36, "9BRKC3F39S8350405": 129459.36, "9BRKC3F37S8350595": 129459.36, "9BRKC3F33S8350531": 129459.36, "9BRKC3F36S8358476": 129459.36, "9BRKC3F30S8358604": 129459.36, "9BRKC3F34S8355494": 129459.36, "9BRKC3F3XS8351272": 129459.36, "9BRKC3F39S8350940": 129459.36, "9BRKC3F33S8356703": 129459.36, "9BRKC3F35S8355939": 129459.36, "9BRKC3F30S8356951": 129459.36, "9BRKC3F30S8356822": 129459.36, "9BRKC3F37S8349348": 129459.36, "93XSYKL1TSCR90400": 228256.0, "93XSYKL1TSCR86134": 303826.0, "93XSYKL1TSCR86135": 303826.0, "93XSYKL1TSCR86136": 303826.0, "93XSYKL1TSCR86127": 326000.0, "9BM951104SB412821": 605782.26, "8AP359AFWRU386802": 115435.99, "8AP359AFTSU432228": 115435.99, "8AP359AFTSU432606": 115435.99, "8AP359AFTSU432887": 115435.99, "8AP359AFTSU433093": 115435.99, "8AP359AFTSU433216": 115435.99, "3N1AB8AEXSY236643": 160272.73, "8AP359AFTSU433844": 115435.99, "9BRBC3F35S8352135": 127600.0, "9BRBC3F36S8352046": 127600.0, "9BRBC3F37S8352069": 127600.0, "9BRBC3F37S8352170": 127600.0, "9BRBC3F37S8352296": 127600.0, "9BRBC3F3XS8351966": 127600.0, "9BRBC3F3XS8352146": 127600.0, "3N1AB8AEXSY237727": 160272.73, "3N1AB8AE0SY234819": 157477.27, "3N1AB8AEXSY237131": 160272.73, "93XSYKL1TSCR86119": 303826.0, "9BRKC3F31S8345165": 129459.36, "9BRBC3F33S8324771": 127600.0, "9BRBC3F38S8325091": 127600.0, "9BRBC3F38S8325267": 127600.0, "8AP359AFTSU418702": 115435.99, "8AP359AFTSU427661": 115435.99, "8AP359AFTSU428281": 115435.99, "8AP359AFWRU380525": 115435.99, "9BRBC3F35S8352023": 127600.0, "8AP359AFTSU435935": 115435.99, "8AP359AFTSU436074": 115435.99, "8AP359AFWRU371815": 115435.99, "8AP359AFWRU373251": 115435.99, "8AP359AFWRU373814": 115435.99, "9BRKC3F3XS8352566": 129459.36, "8AP359AFTSU425442": 115435.99, "8AP359AFTSU426401": 115435.99, "8AP359AFTSU426909": 115435.99, "8AP359AFTSU427799": 115435.99, "8AP359AFTSU427922": 115435.99, "8AP359AFTSU428075": 115435.99, "8AP359AFTSU399309": 115435.99, "8AP359AFTSU409271": 115435.99, "8AP359AFTSU409467": 115435.99, "8AP359AFTSU416294": 115435.99, "8AP359AFTSU426404": 115435.99, "8AP359AFTSU426626": 115435.99, "8AP359AFTSU426898": 115435.99, "8AP359AFTSU427046": 115435.99, "8AP359AFTSU427049": 115435.99, "8AP359AFTSU427065": 115435.99, "8AP359AFTSU427132": 115435.99, "8AP359AFTSU427144": 115435.99, "8AP359AFTSU427214": 115435.99, "8AP359AFTSU427629": 115435.99, "8AP359AFTSU427733": 115435.99, "8AP359AFTSU427908": 115435.99, "8AP359AFTSU428010": 115435.99, "8AP359AFTSU428594": 115435.99, "8AP359AFTSU428623": 115435.99, "8AP359AFTSU428716": 115435.99, "8AP359AFTSU428737": 115435.99, "8AP359AFTSU429046": 115435.99, "8AP359AFTSU430244": 115435.99, "8AP359AFTSU430895": 115435.99, "8AP359AFTSU431845": 115435.99, "93XSYKL1TSCR87520": 270774.0, "9BRKC3F30S8338417": 129459.36, "9BRKC3F30S8338546": 129459.36, "9BRKC3F3XS8338540": 129459.36, "9BRBC3F30S8323643": 127600.0, "9BRBC3F38S8324250": 127600.0, "9BRBC3F3XS8325853": 127600.0, "8AP359AFWRU371503": 115435.99, "8AP359AFWRU373178": 115435.99, "9BRKC3F32S8331081": 129459.36, "9BRKC3F33S8333616": 129459.36, "9BRKC3F34S8332734": 129459.36, "9BRKC3F36S8334002": 129459.36, "9BRKC3F37S8333246": 129459.36, "9BRKC3F38S8330551": 129459.36, "9BRKC3F3XS8332138": 129459.36, "8AP359AFTSU413404": 115435.99, "8AP359AFTSU415183": 115435.99, "8AP359AFTSU418341": 115435.99, "8AP359AFTSU410726": 115435.99, "8AP359AFTSU414190": 115435.99, "8AP359AFTSU401962": 115435.99, "8AP359AFTSU418307": 115435.99, "9BRKC3F36S8344884": 129459.36, "8AP359AFTSU418696": 115435.99, "8AP359AFWRU389986": 115435.99, "8AP359AFWRU390021": 115435.99, "9BRKC3F37S8345218": 129459.36, "93XSYKL1TSCR88544": 228255.95, "93XSYKL1TSCR87507": 270774.0, "9BG156FK0SC408720": 348600.0, "9BG156FK0SC411799": 348600.0, "9BG156FK0SC412230": 348600.0, "9BRBC3F36S8315157": 127400.0, "9BRBC3F37S8315135": 127400.0, "93XSYKL1TSCR88558": 228255.95, "9BG156FK0SC408920": 348600.0, "9BG156FK0SC407281": 348600.0, "9BG156FK0SC408341": 348600.0, "9BG156FK0SC412295": 348600.0, "9BRBC3F31S8323473": 127600.0, "9BRBC3F33S8323622": 127600.0, "9BRBC3F34S8325640": 127600.0, "9BRBC3F37S8325339": 127600.0, "9BRBC3F39S8326007": 127600.0, "9BRBC3F30S8313887": 127400.0, "9BRBC3F32S8314202": 127400.0, "9BRBC3F3XS8313136": 127400.0, "9BRBC3F3XS8314643": 127400.0, "9BRBC3F30R8291156": 127400.0, "9BRBC3F30R8291786": 127400.0, "9BRBC3F30S8317857": 127400.0, "9BRBC3F31R8289612": 127400.0, "9BRBC3F31R8291442": 127400.0, "9BRBC3F32R8289747": 127400.0, "9BRBC3F33R8291068": 127400.0, "9BRBC3F34S8309857": 127400.0, "9BRBC3F35R8289757": 127400.0, "9BRBC3F35R8290312": 127400.0, "9BRBC3F35R8293128": 127400.0, "9BRBC3F36S8315613": 127400.0, "9BRBC3F36S8316616": 127400.0, "9BRBC3F37R8289968": 127400.0, "9BRBC3F37S8309741": 127400.0, "9BRBC3F37S8315541": 127400.0, "9BRBC3F37S8316592": 127400.0, "9BRBC3F38R8290577": 127400.0, "9BRBC3F38R8293575": 127400.0, "9BRBC3F38S8310106": 127400.0, "9BRBC3F38S8317492": 127400.0, "9BRBC3F39R8289275": 127400.0, "9BRBC3F39S8309059": 127400.0, "9BRBC3F39S8316156": 127400.0, "9BRBC3F3XR8290175": 127400.0, "9BRBC3F3XR8293478": 127400.0, "9BRBC3F3XS8315758": 127400.0, "9BRBC3F3XS8316943": 127400.0, "9BRBC3F3XS8316974": 127400.0, "9BG156FK0RC418605": 348600.0, "9BG156FK0RC418725": 348600.0, "9BG156FK0RC418798": 348600.0, "9BRBC3F31R8276889": 127400.0, "9BRBC3F31R8277458": 127400.0, "9BRBC3F31R8277945": 127400.0, "9BRBC3F31R8272017": 127400.0, "9BRBC3F32R8272267": 127400.0, "9BRBC3F33R8270964": 127400.0, "9BRBC3F39R8272332": 127400.0, "9BRBC3F3XR8272324": 127400.0, "9BRBC3F34R8273307": 127600.0, "9BRBC3F36R8271624": 127600.0, "9BRBC3F37R8272037": 127600.0, "9BRBC3F33R8271693": 127400.0, "9BRBC3F35R8273252": 127400.0, "9BRBC3F36R8272160": 127400.0, "9BRBC3F36R8273308": 127400.0, "9BRBC3F38R8271673": 127400.0, "9BRBC3F32R8270549": 127400.0, "9BRBC3F33R8270866": 127400.0, "9BRBC3F35R8270285": 127400.0, "9BRBC3F35R8270495": 127400.0, "9BRBC3F37R8270952": 127400.0, "9BRBC3F38R8270846": 127400.0, "9BRBC3F3XR8270220": 127400.0, "9BRBC3F30R8293876": 127400.0, "9BRBC3F3XR8294176": 127400.0, "8AP359AFWRU372696": 115435.99, "9BRBC3F30R8271747": 127600.0, "9BRBC3F33R8272651": 127600.0, "9BRBC3F35R8272022": 127600.0, "9BRBC3F3XR8271349": 127600.0, "9BRBC3F30R8272672": 127400.0, "9BRBC3F3XR8272565": 127400.0, "9BRBC3F38R8272645": 127400.0, "9BRBC3F38R8272659": 127400.0, "9BRBC3F31R8272972": 127600.0, "9BRBC3F32R8272740": 127600.0, "9BRBC3F35R8271713": 127600.0, "9BRBC3F36R8272255": 127600.0, "9BRBC3F38R8272693": 127600.0, "9BRBC3F38R8273018": 127600.0, "9BRBC3F30R8294767": 127400.0, "9BRBC3F34R8294416": 127400.0, "9BRBC3F38R8294483": 127400.0, "9BRBC3F30R8277340": 127400.0, "9BRBC3F30R8277645": 127400.0, "9BRBC3F32R8277694": 127400.0, "9BRBC3F37R8294491": 127400.0, "93XTYKL1TSCR79949": 313406.0, "9BRBC3F31R8272597": 127600.0, "9BRBC3F35R8271131": 127600.0, "9BRBC3F37R8271874": 127600.0, "9BRBC3F38R8272063": 127600.0, "9BRBC3F39R8270340": 127600.0, "9BRBC3F3XR8270833": 127600.0, "8AP359AFXRU357903": 115435.99, "8AP359AFXRU357929": 115435.99, "8AP359AFXRU357931": 115435.99, "8AP359AFXRU359620": 115435.99, "8AP359AFXRU359841": 115435.99, "8AP359AFXRU359874": 115435.99, "8AP359AFXRU359877": 115435.99, "8AP359AFXRU359880": 115435.99, "8AP359AFXRU359909": 115435.99, "8AP359AFXRU360325": 115435.99, "8AP359AFXRU360799": 115435.99, "9BRBC3F32R8290347": 127400.0, "9BRBC3F32R8290896": 127400.0, "93XTYKL1TSCR79504": 313406.0, "93XTYKL1TSCR79518": 313406.0, "93XTYKL1TSCR79520": 313406.0, "9BRBC3F31R8267903": 127600.0, "9BRBC3F31R8268999": 127600.0, "9BRBC3F32R8269207": 127600.0, "9BRBC3F33R8268177": 127600.0, "9BRBC3F35R8268696": 127600.0, "9BRBC3F35R8272070": 127600.0, "9BRBC3F36R8268495": 127600.0, "9BRBC3F38R8268353": 127600.0, "9BRBC3F39R8267745": 127600.0, "9BRBC3F39R8271827": 127600.0, "93XTYKL1TRCP77786": 313406.0, "93XTYKL1TRCP78049": 313406.0, "93XTYKL1TSCR79475": 313406.0, "9BRBC3F34R8270536": 127600.0, "9BRBC3F35R8271078": 127600.0, "9BRBC3F36R8270859": 127600.0, "9BRBC3F36R8271767": 127600.0, "9BRBC3F38R8271785": 127600.0, "9BRBC3F38R8273262": 127600.0, "93XTYKL1TSCR79465": 313406.0, "93XTYKL1TSCR79498": 313406.0, "93XTYKL1TSCR79424": 313406.0, "93XTYKL1TSCR79478": 313406.0, "93XTYKL1TSCR79483": 313406.0, "93XTYKL1TSCR79488": 313406.0, "93XTYKL1TSCR79427": 313406.0, "93XTYKL1TSCR79430": 313406.0, "93XTYKL1TSCR79432": 313406.0, "93XTYKL1TSCR79441": 313406.0, "93XTYKL1TSCR79444": 313406.0, "93XTYKL1TSCR79446": 313406.0, "93XTYKL1TSCR79449": 313406.0, "93XTYKL1TSCR79452": 313406.0, "93XTYKL1TSCR79457": 313406.0, "93XTYKL1TSCR79470": 313406.0, "93XTYKL1TSCR79494": 313406.0, "93XTYKL1TSCR79510": 313406.0, "93XTYKL1TSCR79512": 313406.0, "93XTYKL1TSCR79524": 313406.0, "93XTYKL1TSCR79480": 313406.0, "93XTYKL1TSCR79506": 313406.0, "93XTYKL1TSCR79435": 313406.0, "93XTYKL1TSCR79486": 313406.0, "93XTYKL1TSCR79500": 313406.0, "93XTYKL1TSCR79508": 313406.0, "93XTYKL1TSCR79492": 313406.0, "93XTYKL1TSCR79473": 313406.0, "93XTYKL1TSCR79514": 313406.0, "93XTYKL1TRCP77708": 313406.0, "93XSYKL1TSCR88491": 228255.95, "93XTYKL1TRCP77937": 313406.0, "93XTYKL1TRCP77539": 313406.0, "93XTYKL1TRCP77545": 313406.0, "93XTYKL1TRCP77688": 313406.0, "93XTYKL1TRCP77766": 313406.0, "93XTYKL1TRCP77792": 313406.0, "93XTYKL1TRCP77805": 313406.0, "93XTYKL1TRCP77815": 313406.0, "93XTYKL1TRCP77892": 313406.0, "9BRBC3F35P8240510": 127800.0, "9BRBY3BE2P4033928": 195000.0, "9BRBY3BE4P4034031": 195000.0, "9BRBC3F31P8240200": 127800.0, "9BRBC3F32P8239671": 127800.0, "9BRBC3F33P8238495": 127800.0, "9BRBC3F35P8238451": 127800.0, "9BRBC3F35P8238739": 127800.0, "9BRBC3F37P8238581": 127800.0, "9BRBC3F37P8238905": 127800.0, "9BRBC3F37P8240153": 127800.0, "9BRBC3F39P8239019": 127800.0, "9BRBC3F3XP8237828": 127800.0, "8AGBB69S0NR116775": 114700.0, "8AGBB69S0NR116978": 114700.0, "8AGBB69S0NR117209": 114700.0, "8AGBB69S0NR117248": 114700.0, "93Y5SRJSXPJ312382": 92150.0, "93XTYKL1TSCR79455": 313406.0, "93XTYKL1TSCR79459": 313406.0, "93XTYKL1TSCR79462": 313406.0, "93XTYKL1TSCR79467": 313406.0, "9BG148FK0NC421515": 203318.64, "9BG148FK0NC421819": 203318.64, "9BG148FK0NC425842": 203318.64, "9BG148FK0NC426784": 203318.64, "9BG148FK0NC427300": 203318.64, "9BG148FK0NC429027": 203318.64, "9BG148FK0NC429147": 203318.64, "9BG148FK0NC429679": 203318.64, "9BG148FK0NC429690": 203318.64, "9BG148FK0NC429696": 203318.64, "9BG148FK0NC429713": 203318.64, "9BG148FK0NC429717": 203318.64, "9BG148FK0NC430135": 203318.64, "9BG148FK0NC430153": 203318.64, "9BG148FK0NC430175": 203318.64, "9BG148FK0NC430189": 203318.64, "9BG148FK0NC430191": 203318.64, "9BG148FK0NC430265": 203318.64, "9BG148FK0NC430270": 203318.64, "9BG148FK0NC430287": 203318.64, "9BG148FK0NC430298": 203318.64, "9BG148FK0NC430305": 203318.64, "9BG148FK0NC430306": 203318.64, "9BG148FK0NC431416": 203318.64, "9BG148FK0NC431573": 203318.64, "9BG148FK0NC431582": 203318.64, "9BG148FK0NC431610": 203318.64, "9BG148FK0NC431665": 203318.64, "9BG148FK0NC431674": 203318.64, "9BG148FK0NC431807": 203318.64, "9BG148FK0NC431864": 203318.64, "9BG148FK0NC432729": 203318.64, "9BG148FK0NC432735": 203318.64, "9BG148FK0NC432739": 203318.64, "9BG148FK0NC432938": 203318.64, "9BG148FK0NC432966": 203318.64, "9BG148FK0NC432983": 203318.64, "9BG148FK0NC432997": 203318.64, "9BG148FK0NC433012": 203318.64, "9BG148FK0NC433018": 203318.64, "9BG148FK0NC433529": 203318.64, "9BG148FK0NC433841": 203318.64, "93XSYKL1TSCR91387": 239116.65, "93XSYKL1TSCR91516": 239116.65, "3N1AB8AE4TY200593": 169000.0, "3N1AB8AE8SY258592": 168082.82, "3N1AB8AE9SY258536": 168082.82, "93XSYKL1TSCR90422": 270774.0, "93XSYKL1TSCR81698": 326000.0, "93XSYKL1TSCR83550": 326000.0, "93XSYKL1TSCR83551": 326000.0, "93XSYKL1TSCR83552": 326000.0, "93XSYKL1TSCR83553": 326000.0, "8AP359AFTSU432165": 115435.99, "8AP359AFTSU432212": 115435.99, "8AP359AFTSU433557": 115435.99, "8AP359AFTSU433565": 115435.99, "8AP359AFTSU433571": 115435.99, "8AP359AFTSU433828": 115435.99, "8AP359AFTSU433878": 115435.99, "8AP359AFTSU435858": 115435.99, "8AP359AFWRU372702": 115435.99, "8AP359AFWRU373580": 115435.99, "8AP359AFWRU390019": 115435.99, "8AP359AFWRU390036": 115435.99, "93XSYKL1TSCR91175": 251671.0, "93XSYKL1TSCR91178": 251671.0, "9BM958078MB237414": 942000.0, "93XSYKL1TSCR85340": 228255.95, "93XSYKL1TSCR85363": 228255.95, "9BRBC3F39R8296677": 127800.0, "93XTYKL1TSCR80260": 313406.0, "93XTYKL1TSCR80316": 313406.0, "93XPYKL1TSCR79715": 313402.0, "93XTYKL1TSCR80168": 313406.0, "93XTYKL1TSCR80197": 313406.0, "93XTYKL1TSCR80206": 313406.0, "93XTYKL1TSCR80245": 313406.0, "93XTYKL1TSCR80257": 313406.0, "9BRBC3F36R8271171": 127600.0, "9BRBC3F37R8273284": 127600.0, "93XSYKL1TRCP79048": 310926.0, "93XSYKL1TRCP79052": 310926.0, "93XSYKL1TRCP79056": 310926.0, "93XSYKL1TRCP79069": 310926.0, "93XSYKL1TRCP79073": 310926.0, "93XSYKL1TRCP79077": 310926.0, "93XSYKL1TRCP79080": 310926.0, "93XSYKL1TRCP79083": 310926.0, "93XSYKL1TRCP79086": 310926.0, "93XSYKL1TRCP79089": 310926.0, "93XSYKL1TRCP79092": 310926.0, "93XSYKL1TRCP79095": 310926.0, "93XSYKL1TRCP79098": 310926.0, "93XSYKL1TRCP79101": 310926.0, "93XSYKL1TRCP79104": 310926.0, "93XSYKL1TRCP79107": 310926.0, "93XSYKL1TRCP79110": 310926.0, "93XSYKL1TRCP79113": 310926.0, "93XSYKL1TRCP79116": 310926.0, "93XSYKL1TRCP79119": 310926.0, "93XSYKL1TRCP79122": 310926.0, "93XSYKL1TRCP79125": 310926.0, "93XSYKL1TRCP79127": 310926.0, "93XSYKL1TRCP79130": 310926.0, "93XSYKL1TRCP79133": 310926.0, "93XSYKL1TRCP79135": 310926.0, "93XSYKL1TRCP79138": 310926.0, "93XSYKL1TRCP79141": 310926.0, "93XSYKL1TRCP79143": 310926.0, "93XSYKL1TRCP79146": 310926.0, "93XSYKL1TRCP79149": 310926.0, "93XSYKL1TRCP79152": 310926.0, "93XSYKL1TRCP79155": 310926.0, "93XSYKL1TRCP79158": 310926.0, "93XSYKL1TRCP79161": 310926.0, "93XSYKL1TRCP79164": 310926.0, "93XSYKL1TRCP79167": 310926.0, "93XSYKL1TRCP79170": 310926.0, "93XSYKL1TRCP79173": 310926.0, "93XSYKL1TRCP79176": 310926.0, "93XSYKL1TRCP79179": 310926.0, "93XSYKL1TRCP79182": 310926.0, "93XSYKL1TRCP79185": 310926.0, "93XSYKL1TRCP79188": 310926.0, "93XSYKL1TRCP79191": 310926.0, "93XSYKL1TRCP79194": 310926.0, "93XSYKL1TRCP79197": 310926.0, "93XSYKL1TRCP79200": 310926.0, "93XSYKL1TRCP79203": 310926.0, "93XSYKL1TRCP79206": 310926.0, "93XSYKL1TRCP79209": 310926.0, "93XSYKL1TRCP79212": 310926.0, "93XSYKL1TRCP79215": 310926.0, "93XSYKL1TRCP79218": 310926.0, "93XSYKL1TRCP79221": 310926.0, "93XSYKL1TRCP79224": 310926.0, "93XSYKL1TRCP79227": 310926.0, "93XSYKL1TRCP79230": 310926.0, "93XSYKL1TRCP79233": 310926.0, "93XSYKL1TRCP79236": 310926.0, "93XSYKL1TRCP79239": 310926.0, "93XSYKL1TRCP79242": 310926.0, "93XSYKL1TRCP79245": 310926.0, "93XSYKL1TRCP79248": 310926.0, "9BRBC3F30R8268816": 127600.0, "9BRBC3F31R8271921": 127600.0, "9BRBC3F38R8268482": 127600.0, "9BRBC3F39R8268359": 127600.0, "93XTYKL1TRCP77526": 313406.0, "93XTYKL1TRCP77662": 313406.0, "93XTYKL1TRCP77675": 313406.0, "93XTYKL1TRCP77751": 313406.0, "93XTYKL1TRCP77788": 313406.0, "93XTYKL1TRCP77907": 313406.0, "9BG148FK0NC453918": 215943.0, "9BM951104NB280288": 413195.0, "9BG148FK0NC453326": 215943.0, "9BG148FK0NC453787": 215943.0, "9BG148FK0NC453938": 215943.0, "9BG156YK0NC452903": 233750.0, "9BG148FK0NC449618": 196950.0, "8AGBB69S0NR116526": 114700.0, "8AGBB69S0NR117030": 114700.0, "8AGBB69S0NR117178": 114700.0, "9BM958074FB004668": 441983.0, "9BM958074FB013117": 441983.0};

/**
 * Preenche o campo Valor de cada veículo já cadastrado em Veiculos, casando
 * por Chassi com o mapa MAPA_VALOR_LEGADO_POR_CHASSI_ (apurado a partir de
 * uma planilha de controle de contratos externa). Só preenche quando o
 * Valor atual está vazio/zero — nunca sobrescreve um valor já informado
 * manualmente. Não cria veículo novo, não apaga nada.
 */
function importarValorLegado() {
  exigirPerfilAdmin_();
  var sheetVeiculos = getOrCreateSheet_(SHEET_VEICULOS, CABECALHO_VEICULOS);
  var logSheet = getOrCreateSheet_(SHEET_IMPORT_LOG, CABECALHO_IMPORT_LOG);
  garantirColunasVeiculos_();

  var perfil = getPerfilUsuarioAtual_();
  var agora = new Date();

  var idxChassiV = colunaParaIndice_('Chassi');
  var idxValorV = colunaParaIndice_('ValorVeiculo');
  var idxAtualizacao = colunaParaIndice_('UltimaAtualizacao');
  var idxAtualizadoPor = colunaParaIndice_('AtualizadoPor');

  var ultimaLinha = sheetVeiculos.getLastRow();
  var dadosVeiculos = ultimaLinha >= 2
    ? sheetVeiculos.getRange(2, 1, ultimaLinha - 1, CABECALHO_VEICULOS.length).getValues()
    : [];

  var preenchidos = 0, jaTinhaValor = 0, semCorrespondencia = 0;

  dadosVeiculos.forEach(function (linhaV) {
    var chassi = normalizarChassi_(linhaV[idxChassiV]);
    if (!chassi) return;
    var valorLegado = MAPA_VALOR_LEGADO_POR_CHASSI_[chassi];
    if (valorLegado === undefined) { semCorrespondencia++; return; }

    var valorAtual = Number(linhaV[idxValorV]) || 0;
    if (valorAtual > 0) { jaTinhaValor++; return; }

    linhaV[idxValorV] = valorLegado;
    linhaV[idxAtualizacao] = agora;
    linhaV[idxAtualizadoPor] = perfil.email + ' (importação de Valor — base legado)';
    preenchidos++;
  });

  if (dadosVeiculos.length) {
    sheetVeiculos.getRange(2, 1, dadosVeiculos.length, CABECALHO_VEICULOS.length).setValues(dadosVeiculos);
  }

  logSheet.getRange(logSheet.getLastRow() + 1, 1, 1, CABECALHO_IMPORT_LOG.length).setValues([[
    agora, 'IMPORTAR_VALOR', '-', 'INFO',
    'Valores preenchidos: ' + preenchidos + ' | Já tinham valor informado (não sobrescrito): ' + jaTinhaValor +
    ' | Chassi sem correspondência na base legado: ' + semCorrespondencia,
    '', ''
  ]]);

  invalidarCacheDashboard_();

  var mensagem = 'Valores preenchidos: ' + preenchidos + '. Já tinham valor: ' + jaTinhaValor +
    '. Sem correspondência: ' + semCorrespondencia + '. Veja detalhes em "' + SHEET_IMPORT_LOG + '".';
  getSpreadsheet_().toast(mensagem, 'Importar Valor', 10);
  return { preenchidos: preenchidos, jaTinhaValor: jaTinhaValor, semCorrespondencia: semCorrespondencia, mensagem: mensagem };
}

function carregarChassisExistentes_(sheet) {
  var mapa = {};
  if (sheet.getLastRow() < 2) return mapa;
  var chassiCol = colunaParaIndice_('Chassi') + 1;
  var valores = sheet.getRange(2, chassiCol, sheet.getLastRow() - 1, 1).getValues();
  valores.forEach(function (linha) {
    if (linha[0]) mapa[normalizarChassi_(linha[0])] = true;
  });
  return mapa;
}

// Identifica quais linhas das abas de origem (aba + número da linha) já
// foram migradas antes, lendo o padrão 'Migrado de "aba", linha N.' gravado
// em Observacoes por processarLinhaOrigem_. Sem isso, rodar a migração mais
// de uma vez faz cada linha antiga colidir com o próprio chassi que ela
// mesma gerou na vez anterior — e como esse tipo de colisão é tratado como
// "chassi repetido no lote original" (ver o bloco de chassisExistentes
// abaixo), a linha seria reimportada como um veículo "novo" (com sufixo
// -DUP) em vez de ser reconhecida como já migrada, duplicando a base
// inteira a cada nova execução.
var REGEX_ORIGEM_OBSERVACOES = /^Migrado de "(.+)", linha (\d+)\.$/;

function carregarOrigensExistentes_(sheet) {
  var mapa = {};
  if (sheet.getLastRow() < 2) return mapa;
  var obsCol = colunaParaIndice_('Observacoes') + 1;
  var valores = sheet.getRange(2, obsCol, sheet.getLastRow() - 1, 1).getValues();
  valores.forEach(function (linha) {
    var match = REGEX_ORIGEM_OBSERVACOES.exec(String(linha[0] || ''));
    if (match) mapa[match[1] + '|' + match[2]] = true;
  });
  return mapa;
}

function processarLinhaOrigem_(linha, aba, numLinha, chassisExistentes, origensExistentes, agora, usuario, modoTolerante) {
  if (origensExistentes[aba + '|' + numLinha]) {
    return {
      status: 'DUPLICADO',
      log: [agora, aba, numLinha, 'AVISO', 'Esta linha já havia sido migrada em uma execução anterior — ignorada para não duplicar.', '', '']
    };
  }

  var chassi = normalizarChassi_(linha[COL_ORIGEM.CHASSI]);
  var placaOriginal = normalizarPlaca_(linha[COL_ORIGEM.PLACA]);
  var avisos = [];

  if ((!chassi || !placaOriginal) && !modoTolerante) {
    return {
      status: 'INVALIDO',
      log: [agora, aba, numLinha, 'ERRO',
        'Chassi ou placa ausente — linha ignorada (rode a migração de novo e responda "Sim" à pergunta sobre registros incompletos para importar mesmo assim).',
        chassi, placaOriginal]
    };
  }
  // Comum em processos antigos que só informaram a quantidade total de
  // veículos doados, com um único chassi/placa representando o lote inteiro:
  // em vez de perder a linha, usa um identificador temporário e importa
  // mesmo assim — a revisão fica registrada no ImportacaoLog.
  if (!chassi) {
    chassi = 'HIST-' + aba + '-L' + numLinha;
    avisos.push('Chassi ausente no original — usado identificador temporário "' + chassi + '". Revise e informe o chassi real de cada veículo, se possível.');
  }
  if (!placaOriginal) {
    placaOriginal = 'HIST-L' + numLinha;
    avisos.push('Placa ausente no original — usado identificador temporário "' + placaOriginal + '". Revise e informe a placa real, se possível.');
  }
  if (!validarChassi_(chassi)) {
    if (!modoTolerante) {
      return {
        status: 'INVALIDO',
        log: [agora, aba, numLinha, 'ERRO',
          'Chassi fora do padrão VIN (17 caracteres) — linha ignorada (rode a migração de novo e responda "Sim" à pergunta sobre registros incompletos para importar mesmo assim).',
          chassi, placaOriginal]
      };
    }
    avisos.push('Chassi fora do padrão VIN de 17 caracteres: "' + chassi + '" — importado mesmo assim, revise se possível.');
  }
  if (chassisExistentes[chassi]) {
    if (!modoTolerante) {
      return {
        status: 'DUPLICADO',
        chassi: chassi,
        log: [agora, aba, numLinha, 'AVISO', 'Chassi já existente na base — linha ignorada.', chassi, placaOriginal]
      };
    }
    // Comum em processos antigos: um único chassi foi usado pra representar
    // vários veículos diferentes do mesmo lote. Em vez de descartar (o que
    // sub-contaria o total real de doações), gera um identificador próprio
    // pra não colidir, mas mantém como uma doação separada na contagem.
    var chassiOriginal = chassi;
    var sufixo = 2;
    while (chassisExistentes[chassiOriginal + '-DUP' + sufixo]) sufixo++;
    chassi = chassiOriginal + '-DUP' + sufixo;
    avisos.push('Chassi original "' + chassiOriginal + '" repetido em mais de um veículo deste lote antigo — usado o identificador "' + chassi + '" só para diferenciar no sistema; contado como doação separada.');
  }

  var uf = normalizarUF_(linha[COL_ORIGEM.UF]);
  if (!uf) {
    uf = UF_NAO_INFORMADA;
    avisos.push('UF ausente no original — usado marcador "' + UF_NAO_INFORMADA + '" (não informada). Revise e informe a UF real, se possível.');
  } else if (UFS_VALIDAS.indexOf(uf) === -1 && CODIGOS_ORGAO_FEDERAL.indexOf(uf) === -1) {
    return {
      status: 'INVALIDO',
      log: [agora, aba, numLinha, 'ERRO', 'UF desconhecida: "' + linha[COL_ORIGEM.UF] + '" — linha ignorada.', chassi, placaOriginal]
    };
  } else if (CODIGOS_ORGAO_FEDERAL.indexOf(uf) !== -1) {
    avisos.push('UF é código de órgão federal (' + uf + '), não uma UF real.');
  }

  var ente = normalizarTexto_(linha[COL_ORIGEM.ENTE]);
  if (ENTES_VALIDOS.indexOf(ente) === -1) {
    return {
      status: 'INVALIDO',
      log: [agora, aba, numLinha, 'ERRO', 'Ente desconhecido: "' + linha[COL_ORIGEM.ENTE] + '" — linha ignorada.', chassi, placaOriginal]
    };
  }

  var mes = normalizarTexto_(linha[COL_ORIGEM.MES]).toUpperCase();
  mes = MESES_ALIAS[mes] || mes;
  if (MESES_VALIDOS.indexOf(mes) === -1) {
    return {
      status: 'INVALIDO',
      log: [agora, aba, numLinha, 'ERRO', 'Mês desconhecido: "' + linha[COL_ORIGEM.MES] + '" — linha ignorada.', chassi, placaOriginal]
    };
  }

  var renavam = normalizarTexto_(linha[COL_ORIGEM.RENAVAM]).replace(/\D/g, '');
  if (!validarRenavam_(renavam)) {
    avisos.push('Renavam com formato incomum: "' + linha[COL_ORIGEM.RENAVAM] + '".');
  }

  if (!validarPlaca_(placaOriginal)) {
    avisos.push('Placa fora do padrão Mercosul/antigo: "' + placaOriginal + '".');
  }

  var transferido = normalizarTransferido_(linha[COL_ORIGEM.TRANSFERIDO]);
  if (!transferido) {
    avisos.push('Status "Transferido" ausente/ilegível ("' + linha[COL_ORIGEM.TRANSFERIDO] + '") — definido como NÃO por padrão.');
    transferido = 'NÃO';
  }

  // O Termo de Doação na origem costuma trazer o Número SEI embutido entre
  // parênteses (ex.: "165/2023 (24860169)") — separa aqui pra TermoDoacao e
  // NumeroSei ficarem em campos distintos desde a migração, sem precisar
  // rodar corrigirNumeroSeiDoTermo depois pra corrigir isso retroativamente.
  var separadoSei = separarNumeroSeiDoTermo_(linha[COL_ORIGEM.TERMO]);

  var registro = {
    DataCadastro: agora,
    Ano: parseInt(linha[COL_ORIGEM.ANO], 10) || linha[COL_ORIGEM.ANO],
    Mes: mes,
    UF: uf,
    Ente: ente,
    Donataria: normalizarTexto_(linha[COL_ORIGEM.DONATARIA]),
    TermoDoacao: separadoSei.termo,
    NumeroSei: separadoSei.numeroSei || '',
    Descricao: normalizarTexto_(linha[COL_ORIGEM.DESCRICAO]),
    Marca: normalizarMarca_(linha[COL_ORIGEM.MARCA]),
    Chassi: chassi,
    Renavam: renavam,
    Placa: placaOriginal,
    Transferido: transferido,
    DataTransferencia: transferido === 'SIM' ? agora : '',
    Observacoes: 'Migrado de "' + aba + '", linha ' + numLinha + '.',
    CadastradoPor: usuario + ' (migração)',
    UltimaAtualizacao: agora,
    AtualizadoPor: usuario + ' (migração)'
  };

  var linhaFinal = CABECALHO_VEICULOS.map(function (campo) { return registro[campo] !== undefined ? registro[campo] : ''; });

  return {
    status: 'OK',
    chassi: chassi,
    linha: linhaFinal,
    log: avisos.length ? [agora, aba, numLinha, 'AVISO', avisos.join(' '), chassi, placaOriginal] : null
  };
}
