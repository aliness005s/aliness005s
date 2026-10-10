# Relatório funcional — AdoceUp

**Data da varredura:** 06/10/2026  
**Escopo:** leitura das telas, dos módulos JavaScript, da configuração PWA/offline e do README; verificação de carregamento e navegação das cinco telas principais no navegador desktop.

## 1. Visão geral

AdoceUp é uma aplicação web responsiva para apoiar uma confeitaria artesanal em quatro tarefas relacionadas: cadastrar insumos, calcular o custo e o preço de produtos, montar orçamentos para clientes e fazer um fechamento manual de vendas por período. Também permite manter os dados do negócio, salvar/restaurar backups e gerar PDFs.

A aplicação é estática, executada no navegador. Não há servidor de aplicação, conta de usuário, banco remoto ou sincronização entre dispositivos identificados no código. O perfil, os insumos, os produtos e os orçamentos ficam no armazenamento local do navegador.

## 2. Inicialização e perfil

### Primeiro acesso

O onboarding solicita:

- Nome da confeitaria, obrigatório e limitado a 30 caracteres.
- WhatsApp e chave Pix, opcionais.
- Meta mensal e horas disponíveis por mês, ambos obrigatórios.
- Logo da confeitaria, opcional.

Enquanto a meta e as horas são informadas, o app apresenta uma estimativa do valor da hora. Ao concluir, salva o perfil, marca o onboarding como concluído e abre a home. Logo enviada é redimensionada para até 350 px e armazenada como imagem JPEG em data URL.

### Perfil após a configuração

O cartão de perfil da home mostra o nome e a logo; sem logo, usa a primeira letra do nome. Um botão expande o cartão e alterna as frases rotativas pelos indicadores de valor/hora, meta mensal e disponibilidade. As frases mudam a cada 4,5 segundos quando o cartão não está expandido. O painel expansível também mostra uma observação calculada e permite editar nome, WhatsApp, Pix, meta, horas e logo, ou remover a logo.

O valor-hora usado nos cálculos é `meta mensal ÷ horas por mês`. Meta e horas precisam ser maiores que zero.

## 3. Home e navegação

A home reúne:

- Cartão de perfil e frases de apresentação.
- Ação principal para iniciar a precificação de um produto.
- Atalhos para iniciar orçamento e abrir o fechamento de vendas.
- Área para baixar e recuperar um arquivo de backup JSON.
- Catálogo dos seis produtos mais recentes, com rolagem horizontal quando necessário. Cada cartão abre a edição do produto; o controle de avanço fica indisponível quando não há mais conteúdo para mostrar.

A navegação oferece cinco destinos: Início, Insumos, Produtos, Orçamentos e Vendas. O botão flutuante abre ações rápidas para perfil, backup, recuperação, novo produto, novo insumo e novo orçamento. Fluxos de precificação e orçamento têm botão Voltar e confirmação antes de abandonar alterações não salvas.

Em telas estreitas, a navegação fica fixa na parte inferior. A partir de 900 px, passa para uma sidebar; a área de conteúdo se adapta à largura disponível. O projeto também inclui estados vazios, modais, confirmações, mensagens toast, suporte a foco de teclado e respeito à preferência de movimento reduzido.

## 4. Insumos

A tela Insumos apresenta uma lista pesquisável por nome, permite cadastrar, editar e excluir registros e tem estado vazio com ação para cadastrar o primeiro item. Nomes duplicados são bloqueados após normalização de espaços e letras maiúsculas/minúsculas; exclusões pedem confirmação.

O cadastro do catálogo guarda somente o nome do insumo. Quantidade comprada, unidade, preço da embalagem, quantidade usada e custo calculado são informados no contexto de cada receita. Assim, um mesmo insumo pode ter custos diferentes em receitas diferentes. Não há saldo ou controle de estoque.

No fluxo de receita, as unidades disponíveis são g, kg, ml, L e un. kg é convertido para g e L para ml; unidades são tratadas como itens inteiros. A tela calcula o custo proporcional da quantidade usada com base na quantidade e no preço da embalagem. O último preço/quantidade usados para aquele insumo pode ser sugerido numa utilização posterior. Um botão “?” ao lado da quantidade comprada e da quantidade usada abre exemplos de conversão de medidas.

## 5. Produtos e catálogo

A tela Produtos permite pesquisar por nome ou descrição e exibe nome, descrição, ícone, quantidade de insumos, rendimento, tempo, método de preço, preço sugerido/final por unidade e custo unitário. O estado vazio oferece início direto da precificação.

Ações disponíveis por produto:

- Duplicar: cria uma cópia com nome único, acrescentando “(cópia)” e, se necessário, um número; em seguida abre a edição da cópia.
- Editar: permite atualizar ícone, nome, descrição, insumos, rendimento, tempo, custo de embalagem, outros custos e método/preço.
- Excluir: pede confirmação e remove o produto do catálogo.

Nome é obrigatório e não pode duplicar outro nome do catálogo. Para salvar a edição, rendimento deve ser inteiro maior ou igual a 1, tempo deve ser maior que zero e a receita precisa ter pelo menos um insumo. Custos extras não podem ser negativos pelo fluxo de criação.

## 6. Precificação de produto

O assistente de criação tem quatro etapas:

1. **Produto:** seleção de um entre dez ícones, nome obrigatório e descrição opcional.
2. **Insumos:** seleção de registros do catálogo; inclusão de insumos novos sem sair do fluxo; para cada ingrediente, informa-se quantidade/unidade da embalagem e preço pago, depois quantidade utilizada na receita. O custo de cada ingrediente e o total de insumos são atualizados.
3. **Custos e produção:** rendimento em unidades, tempo de trabalho em horas e custos extras da receita. A tela informa o valor-hora do perfil. Na edição rápida do catálogo, embalagem e outros custos têm campos separados.
4. **Preço e resultado:** escolha entre acréscimo sobre o custo ou preço personalizado. O acréscimo tem opções de 30%, 50%, 100% e valor próprio de 0% a 500%. O resultado mostra preço unitário, custo e lucro unitários, valor de venda e lucro da receita, além de composição detalhada expansível. Prejuízo gera aviso.

### Cálculos

- Custo dos insumos = soma da quantidade usada multiplicada pelo custo por unidade-base de cada ingrediente.
- Mão de obra = tempo da receita multiplicado pelo valor-hora do perfil.
- Custo total da receita = insumos + mão de obra + embalagem + outros custos.
- Custo unitário = custo total dividido pelo rendimento.
- Preço por acréscimo = custo unitário multiplicado por `1 + acréscimo/100`.
- No modo personalizado, o preço informado substitui a sugestão; lucro unitário é preço menos custo unitário e margem real é calculada sobre o preço de venda.

O produto salvo registra os ingredientes e seus custos da receita, tempo, rendimento, custos, método, preço e custo total. O valor do insumo não é uma tabela global vinculada ao catálogo: o custo usado permanece específico daquela receita.

O assistente exige preço personalizado maior que zero antes de salvar; quando o campo está vazio ou inválido, marca o campo, mostra erro e permanece na etapa de resultado. A edição rápida do produto também valida o preço personalizado. Os textos explicam que os custos informados para os insumos são próprios daquela receita, e que outro produto pode usar outro custo para o mesmo insumo. Rendimento, acréscimo e margem recebem explicações curtas junto aos respectivos campos/resultados.

## 7. Orçamentos

A tela Orçamentos lista propostas salvas com cliente, data, número de itens e total. Quando vazia, oferece iniciar uma proposta. Cada registro permite duplicar, editar, abrir envio pelo WhatsApp, gerar PDF ou excluir com confirmação.

O assistente tem cinco etapas:

1. **Produtos:** adiciona produtos do catálogo e informa quantidades inteiras. O app mostra subtotal, rendimento, número de receitas necessárias e eventual sobra. Adicionar novamente um produto já presente soma sua quantidade. Cada linha pode ser incrementada, decrementada (mínimo 1) ou removida.
2. **Cliente:** nome obrigatório e WhatsApp opcional.
3. **Data:** data de entrega obrigatória.
4. **Entrega e desconto:** retirada ou entrega; taxa configurável no modo entrega; desconto percentual entre 0 e 100 aplicado aos produtos, não à taxa de entrega.
5. **Revisão e pagamento:** escolhe 50% de sinal + 50% na entrega, 100% antecipado ou pagamento na entrega; revisa os itens, descrições, totais e modalidade.

O total é subtotal dos produtos menos desconto mais taxa de entrega, quando o modo escolhido é entrega. A prévia interna calcula o número de receitas por produto arredondando para cima e escala a quantidade dos ingredientes. Essa área e o resumo interno de custo/lucro não são incluídos na mensagem nem no PDF destinado à cliente.

As descrições por item podem ser editadas na revisão e formatadas como tópicos. A proposta mostra subtotal, desconto, modalidade/taxa, total e condição de pagamento; inclui a chave Pix do perfil quando cadastrada.

Ao chegar à etapa de revisão, a proposta é salva automaticamente; também há ação explícita para salvar. Mudanças de condição de pagamento e edição das descrições salvam novamente. Editar uma proposta reabre o assistente para revisão dos dados.

### Compartilhamento

O envio constrói uma mensagem de texto com confeitaria, cliente, data, itens, quantidades, descrições, subtotais, desconto, entrega, total, condição e Pix, e abre `api.whatsapp.com` em nova aba. Se houver telefone do cliente, ele é incluído no link com código de país 55; sem telefone, o WhatsApp abre sem destinatário definido. O usuário ainda precisa concluir o envio no WhatsApp.

## 8. Fechamento de vendas

A tela Vendas é uma calculadora manual de fechamento. Os períodos disponíveis são Hoje, Semana, Mês e Personalizado; o personalizado aceita uma identificação textual de até 60 caracteres. A seleção identifica o resumo, mas não filtra vendas por data: a usuária informa os itens que deseja somar.

Itens podem ser incluídos de duas formas:

- Pelo catálogo: seleciona um produto e a quantidade; preço e custo unitários vêm do produto. Repetir o mesmo produto soma quantidades.
- Manualmente: informa nome, quantidade inteira, preço de venda e custo estimado opcional, que começa em zero.

Cada item pode ter quantidade ajustada (mínimo 1) ou ser removido. O resumo atualiza total vendido, custos totais e lucro líquido real (`vendido − custos`), com nome do perfil, período e data/hora atual. A ação de gerar PDF exige ao menos um item. O PDF contém tabela de itens e valores, custo total, total vendido e lucro líquido ou prejuízo.

**Persistência:** os itens e o período do fechamento ficam em estado de execução na página; não são adicionados ao backup nem salvos no armazenamento local. Recarregar a página reinicia esse fechamento.

## 9. PDFs

O orçamento e o fechamento podem ser exportados em PDF A4 retrato. Os documentos têm identidade visual própria, tabelas, valores e identificação da confeitaria; usam a logo do perfil quando disponível e uma inicial como alternativa. O PDF do orçamento inclui contato, cliente, data, itens, desconto, entrega, total, condição de pagamento e Pix quando cadastrado. O PDF de vendas inclui os itens, custo unitário, preço unitário, total vendido e resultado.

A geração usa html2canvas para rasterizar o conteúdo e jsPDF para criar e baixar o arquivo. O código aguarda imagens e fontes, tenta uma segunda rasterização sem imagens de fundo em caso de falha e divide conteúdo longo em páginas. A biblioteca `html2pdf.bundle.min.js` está presente em `vendor/`, mas o fluxo observado usa html2canvas e jsPDF diretamente.

## 10. Armazenamento e backup

A chave de armazenamento é `preco_doce_v3` no `localStorage`. O estado persistido contém perfil, insumos, produtos, orçamentos e marcador de onboarding concluído. Dados ficam associados ao navegador e à origem; limpar dados do site ou trocar de navegador/dispositivo não transfere os registros.

O backup exporta o estado completo como JSON com nome baseado em data/hora, versão do formato e instante de criação. A importação aceita arquivo `.json` de até 10 MB e valida nome do app, versão, estrutura básica e tipos de campos. Antes de carregar, pede confirmação; carregar substitui todos os dados atuais pelos do arquivo. Arquivos inválidos ou ilegíveis geram mensagem de erro. Logo é incluída no estado serializado.

Um lembrete aparece a cada 30 dias para baixar um arquivo JSON; a contagem reinicia após exportação ou lembrete. O lembrete não cria um arquivo automaticamente: a usuária escolhe quando baixar e onde guardar o backup.

## 11. Funcionamento offline e instalação

O projeto inclui manifesto PWA, ícones, service worker, cache de recursos e página de fallback offline. O service worker usa cache versionado, remove caches antigos na ativação, tenta buscar páginas de navegação pela rede e usa a cópia em cache quando a rede falha. Recursos GET da mesma origem são guardados no cache após uma resposta bem-sucedida. O app também solicita persistência de armazenamento quando o navegador oferece essa API e exibe mensagens ao ficar online/offline.

O service worker requer `https://` ou `http://localhost`; abrir `index.html` diretamente por `file://` não permite seu registro. A página offline avisa que a aplicação fica disponível após o cache terminar de carregar. O README recomenda servir a pasta localmente e documenta alternativa de porta caso 8000 já esteja ocupada.

## 12. Interface, acessibilidade e recursos técnicos

- Conteúdo e mensagens em português do Brasil, com máscaras de telefone e moeda e formatação de valores em real.
- Layout responsivo: navegação inferior em telas menores e sidebar em desktop; telas secundárias e assistentes ajustam largura e colunas conforme o viewport.
- Fontes locais Outfit e Nunito; animações de transição e detalhes visuais, com regra para reduzir movimento quando solicitada pelo sistema.
- Botões têm rótulos ou nomes acessíveis em ações por ícone, além de estilos de foco visível; áreas expansíveis atualizam `aria-expanded`.
- Modais próprios substituem `alert`/`confirm` do navegador; há confirmação para ações destrutivas e toasts de feedback.
- Ajuda de medidas abre por botão “?” junto aos campos de embalagem/uso; termos de preço e produção têm microtextos ou explicações nativas de contexto.
- Exportação de backup usa APIs do navegador; PDFs e compartilhamento abrem/baixam recursos localmente ou em uma aba externa.

## 13. Limites funcionais observados

- Não há login, usuários múltiplos, sincronização em nuvem, API, integração com gateway de pagamento nem envio automático de mensagens.
- Não há estoque, baixa de insumos, compras, contas a pagar/receber ou histórico financeiro persistente.
- O fechamento não recupera vendas passadas nem calcula períodos por datas; é uma soma manual e temporária.
- Preços e custos usados em cada receita ficam registrados no produto; atualizar ou excluir o cadastro nominal de um insumo não funciona como atualização global de custos das receitas existentes.
- No compartilhamento do orçamento, o WhatsApp é aberto com texto pronto, mas o envio depende da confirmação da usuária.
- O backup é manual: o lembrete periódico orienta a exportação, mas o navegador só baixa o arquivo após a usuária acionar Salvar.

## 14. Verificação realizada

Foi feita leitura dos arquivos de interface, estado, navegação, perfil, insumos, produtos, precificação, orçamentos, fechamento, utilitários, backup, inicialização, manifesto e service worker. No navegador, as cinco telas principais foram abertas após recarregar o app sem exceções de JavaScript ou erros no console. Também foi testado que preço personalizado vazio bloqueia o salvamento e que o guia de medidas abre pelo botão “?” em viewport móvel. A área de backup foi conferida em desktop e celular.

Esta é uma descrição baseada no código e numa verificação de navegação, não uma certificação exaustiva de todos os fluxos, navegadores, permissões de instalação PWA ou geração de arquivos PDF.