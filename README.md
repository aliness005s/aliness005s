# AdoceUp — projeto separado

O projeto original estava concentrado em um único HTML. Ele foi separado sem mudar a lógica da aplicação:

- `index.html` — estrutura HTML e telas
- `css/styles.css` — estilos, variáveis, responsividade e animações
- `js/state.js` — estado, dados padrão e ícones
- `js/utils.js` — utilitários, formatação, modais e toast
- `js/navigation.js` — navegação entre telas e FAB
- `js/profile.js` — onboarding e perfil
- `js/ingredients.js` — cadastro/edição de ingredientes
- `js/products.js` — produtos e edição rápida
- `js/precificacao.js` — fluxo de precificação
- `js/orcamentos.js` — fluxo de orçamentos
- `js/fechamento.js` — fechamento e geração de PDF
- `js/app.js` — inicialização

## Como executar

Abra `index.html` em um navegador moderno. Para evitar limitações de `file://` em alguns navegadores, é recomendado usar um servidor local simples.

Exemplo com VS Code + Live Server ou, se tiver Python instalado. No PowerShell, partindo da pasta pai do projeto:

```bash
cd preco-doce-separado
python -m http.server 8000
```

Depois acesse `http://localhost:8000/index.html`.

Se aparecer uma página errada, provavelmente já existe outro servidor usando a porta `8000`. Feche esse servidor ou use outra porta:

```bash
python -m http.server 8001
```

Nesse caso, abra `http://localhost:8001/index.html`.

As bibliotecas de PDF e captura de tela ficam em `vendor/`, e as fontes ficam em `fonts/`, para que o app continue funcionando sem internet depois do primeiro carregamento pelo servidor.

## PWA e uso offline

O app inclui `manifest.json`, `sw.js`, ícones locais e uma página de fallback offline. Para o service worker funcionar, abra o projeto por `https://` ou por `http://localhost` (abrir diretamente via `file://` não permite o registro do service worker).

Ao publicar em uma subpasta, mantenha os arquivos juntos e ajuste `start_url` e `scope` no manifesto conforme o caminho público.
