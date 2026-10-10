function renderOrcamentos() {
  const el = $('#listaOrcamentos');
  const orcamentos = Array.isArray(state.orcamentos) ? state.orcamentos : [];
  if (orcamentos.length) {
    el.innerHTML = `
        <div class="flow-sub" style="margin-bottom:12px;">Seus orçamentos ficam guardados aqui para você consultar, enviar ou gerar o PDF depois.</div>
        <div class="saved-orders-list">
          ${orcamentos.map(o => {
      const total = calcOrcObj(o).total;
      const data = o.data ? formatDateBR(o.data) : 'Data a combinar';
      return `
              <div class="item saved-order">
                <span class="item-ic v2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 12h6M9 16h6"/>
                  </svg>
                </span>
                <div class="item-body">
                  <div class="name">${esc(o.cliente || 'Cliente')}</div>
                  <div class="meta">${data} · ${o.itens.length} item${o.itens.length === 1 ? '' : 's'}</div>
                </div>
                <div class="item-price">
                  ${brlFmt(total)}
                  <small>valor total</small>
                </div>
                <div class="saved-order-actions item-actions">
                  <button class="icon-mini" onclick="duplicarOrcamento('${o.id}')" aria-label="Duplicar" title="Duplicar orçamento">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>
                    </svg>
                  </button>
                  <button class="icon-mini" onclick="editarOrcamento('${o.id}')" aria-label="Editar" title="Editar orçamento">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                    </svg>
                  </button>
                  <button class="icon-mini" onclick="compartilharOrcamento('${o.id}')" aria-label="Enviar pelo WhatsApp" title="Enviar pelo WhatsApp">
                    <span style="font-size:13px;line-height:1;">↗</span>
                  </button>
                  <button class="icon-mini" onclick="gerarPDFOrcamento('${o.id}')" aria-label="Gerar PDF" title="Gerar PDF">
                    <span style="font-size:11px;font-weight:800;line-height:1;">PDF</span>
                  </button>
                  <button class="icon-mini danger" onclick="excluirOrcamento('${o.id}')" aria-label="Excluir" title="Excluir orçamento">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    </svg>
                  </button>
                </div>
              </div>
            `;
    }).join('')}
        </div>
        <button class="btn btn-primary" onclick="startOrcamento()" style="margin-top:12px;">Gerar novo orçamento</button>
      `;
    return;
  }
  el.innerHTML = `
      <div class="empty">
        <div class="ill">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 5h16v14H4z"/><path d="M4 9h16M8 13h4"/></svg>
        </div>
        <div class="etitle">Gere e envie na hora 💌</div>
        <div class="etext">Depois de finalizar, seus orçamentos ficam guardados aqui para consultar ou enviar quando precisar.</div>
        <button class="btn btn-primary" onclick="startOrcamento()">Gerar orçamento</button>
      </div>`;
}

function compartilharOrcamento(id) {
  let o = id ? state.orcamentos.find(x => x.id === id) : orcFlow;
  if (!o || !o.itens || !o.itens.length) {
    toast('Nenhum item para compartilhar');
    return;
  }

  const c = calcOrcObj(o);
  const perfil = state.perfil;
  const cliente = o.cliente || 'Cliente';
  const dataFmt = o.data ? formatDateBR(o.data) : 'A combinar';
  const entregaLabel = o.modalidade === 'entrega' ? (c.entrega > 0 ? brlFmt(c.entrega) : 'Gratuito') : 'Retirada no local';
  const pagLabel = o.pagamento === 'sinal' ? '50% de sinal + 50% na entrega' : o.pagamento === 'antecipado' ? '100% antecipado' : 'Pagamento na entrega';

  let msg = `*${perfil.nome || 'Minha Confeitaria'}*\n`;
  msg += `-----------------------------------\n`;
  msg += `*Cliente:* ${cliente}\n`;
  msg += `*Data de entrega:* ${dataFmt}\n\n`;
  msg += `*ITENS DO ORÇAMENTO:*\n`;

  o.itens.forEach(it => {
    msg += `• *${it.nome}*\n`;
    if (it.descricao) msg += `  ${it.descricao}\n`;
    msg += `  ${it.qtd} un x ${brlFmt(it.precoUnit)}/un = *${brlFmt(it.qtd * it.precoUnit)}*\n`;
  });

  msg += `-----------------------------------\n`;
  msg += `Subtotal: ${brlFmt(c.sub)}\n`;
  if (c.desconto > 0) msg += `Desconto (${formatarPercentual(o.desconto)}%): -${brlFmt(c.desconto)}\n`;
  msg += `Entrega: ${entregaLabel}\n`;
  msg += `*VALOR TOTAL: ${brlFmt(c.total)}*\n`;
  msg += `-----------------------------------\n`;
  msg += `*Forma de pagamento:* ${pagLabel}\n`;
  if (perfil.pix) msg += `*Chave Pix:* ${perfil.pix}\n`;
  const encodedMsg = encodeURIComponent(msg);
  const zapPhone = (o.zap || '').replace(/\D/g, '');
  const url = zapPhone ? `https://api.whatsapp.com/send?phone=55${zapPhone}&text=${encodedMsg}` : `https://api.whatsapp.com/send?text=${encodedMsg}`;

  window.open(url, '_blank');
  toast('Abrindo WhatsApp...');
}

async function gerarPDFOrcamento(id) {
  let o = id ? state.orcamentos.find(x => x.id === id) : orcFlow;
  if (!o || !o.itens || !o.itens.length) {
    toast('Nenhum item para gerar PDF');
    return;
  }
  if (id) closeModal();

  const c = calcOrcObj(o);
  const perfil = state.perfil;
  const entregaLabel = o.modalidade === 'entrega'
    ? (c.entrega > 0 ? brlFmt(c.entrega) : 'Gratuito')
    : 'Retirada no local';
  const pagLabel = o.pagamento === 'sinal' ? '50% de sinal + 50% na entrega'
    : o.pagamento === 'antecipado' ? '100% antecipado'
      : 'Pagamento no ato da entrega';

  const dataFmt = o.data ? formatDateBR(o.data) : 'A combinar';
  const hoje = new Date();
  const dataGeracao = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;

  // ── Logo ──
  const logoHtml = perfil.logo
    ? `<img src="${perfil.logo}" style="width:66px;height:66px;border-radius:16px;object-fit:cover;display:block;box-shadow:0 4px 14px rgba(62,36,24,.14);" crossorigin="anonymous">`
    : `<div style="width:66px;height:66px;border-radius:16px;background:linear-gradient(140deg,#D89A3E,#A06E20);display:flex;align-items:center;justify-content:center;color:#fff;font-family:'Outfit',sans-serif;font-size:26px;font-weight:800;box-shadow:0 4px 14px rgba(160,110,32,.28);">${esc((perfil.nome || 'B')[0].toUpperCase())}</div>`;

  const contatoHtml = perfil.zap
    ? `<div style="margin-top:6px;font-size:12px;font-weight:600;color:#8B5E44;letter-spacing:.01em;">${esc(perfil.zap)}</div>`
    : `<div style="margin-top:6px;font-size:12px;font-weight:600;color:#8B5E44;letter-spacing:.01em;">Confeitaria Artesanal</div>`;

  const clienteZapHtml = o.zap
    ? `<div style="margin-top:5px;font-size:11.5px;font-weight:600;color:#8B5E44;">${esc(o.zap)}</div>`
    : '';

  // ── Linhas de itens ──
  const rows = o.itens.map((it, i) => `
    <tr>
      <td style="padding:16px 0;border-bottom:1px solid #F5E8DC;font-weight:700;color:#3E2418;font-size:13.5px;line-height:1.35;">
        ${esc(it.nome)}
        ${it.descricao ? `<div style="margin-top:5px;font-size:11.5px;line-height:1.45;font-weight:500;color:#8B5E72;overflow-wrap:anywhere;">${esc(it.descricao)}</div>` : ''}
      </td>
      <td style="padding:16px 0;border-bottom:1px solid #F5E8DC;text-align:center;color:#7A5B67;font-weight:600;font-size:13px;">
        ${it.qtd}
      </td>
      <td style="padding:16px 0;border-bottom:1px solid #F5E8DC;text-align:right;color:#7A5B67;font-weight:600;font-size:13px;">
        ${brlFmt(it.precoUnit)}
      </td>
      <td style="padding:16px 0;border-bottom:1px solid #F5E8DC;text-align:right;font-weight:800;color:#3E2418;font-size:13.5px;">
        ${brlFmt(it.qtd * it.precoUnit)}
      </td>
    </tr>
  `).join('');

  const descontoHtml = c.desconto > 0 ? `
    <div style="display:flex;justify-content:space-between;padding:7px 0;font-size:12.5px;font-weight:600;color:#7A5B67;">
      <span>Desconto (${formatarPercentual(o.desconto)}%)</span>
      <strong style="color:#3E9B77;">− ${brlFmt(c.desconto)}</strong>
    </div>
  ` : '';

  const entregaLinhaHtml = `
    <div style="display:flex;justify-content:space-between;padding:7px 0;font-size:12.5px;font-weight:600;color:#7A5B67;">
      <span>Entrega</span>
      <strong style="color:#3E2418;">${entregaLabel}</strong>
    </div>
  `;

  const pixHtml = perfil.pix ? `
    <tr>
      <td style="padding:3px 0;color:#7A5B67;font-weight:600;width:90px;vertical-align:top;">Chave Pix</td>
      <td style="padding:3px 0;color:#3E2418;font-weight:700;word-break:break-all;">${esc(perfil.pix)}</td>
    </tr>
  ` : '';

  const html = `
    <div style="font-family:'Outfit','Nunito',-apple-system,sans-serif;color:#422033;background:#FFFAFC;width:100%;max-width:680px;box-sizing:border-box;line-height:1.4;overflow:hidden;overflow-wrap:anywhere;">
      <!-- Barra superior gradiente -->
      <div style="height:7px;background:linear-gradient(90deg,#B61758 0%,#EE3F78 42%,#FF8A5B 76%,#F6B93B 100%);"></div>

      <!-- Cabeçalho do aplicativo -->
      <div style="padding:12px 46px 10px;background:linear-gradient(180deg,#FFFDFD 0%,#FFF6F7 100%);border-bottom:1px solid #F5C8D8;">
        <table style="width:100%;max-width:100%;border-collapse:collapse;table-layout:fixed;">
          <tr>
            <td style="vertical-align:middle;">
              <img src="${ADOCEUP_WORDMARK_B64}" alt="AdoceUp" style="height:42px;width:auto;display:block;object-fit:contain;">
            </td>
            <td style="text-align:right;vertical-align:middle;width:120px;">
              <div style="font-size:10.5px;font-weight:700;color:#9B6A74;letter-spacing:.04em;">by <span style="color:#632C46;font-weight:800;">Alyntics</span></div>
            </td>
          </tr>
        </table>
      </div>

      <div style="padding:38px 46px 28px;border-bottom:1px solid #F5C8D8;background:linear-gradient(135deg,#FFF0F5 0%,#FFF8F2 58%,#FFFDFB 100%);">
        <table style="width:100%;max-width:100%;border-collapse:collapse;table-layout:fixed;">
          <tr>
            <td style="vertical-align:middle;padding-right:20px;">
              <table style="width:100%;max-width:100%;border-collapse:collapse;table-layout:fixed;">
                <tr>
                  <td style="vertical-align:middle;padding-right:16px;width:78px;">${logoHtml}</td>
                  <td style="vertical-align:middle;">
                    <div style="font-size:9.5px;font-weight:800;letter-spacing:.24em;color:#C32262;text-transform:uppercase;margin-bottom:6px;"></div>
                    <div style="font-size:27px;font-weight:800;letter-spacing:-.025em;color:#422033;line-height:1.08;">${esc(perfil.nome || 'Minha Confeitaria')}</div>
                    ${contatoHtml}
                  </td>
                </tr>
              </table>
            </td>
            <td style="text-align:right;vertical-align:top;width:150px;">
              <div style="display:inline-block;padding:8px 15px;background:linear-gradient(135deg,#B61758,#EE3F78);color:#fff;font-size:9.5px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;border-radius:100px;box-shadow:0 5px 12px rgba(182,23,88,.22);">Orçamento</div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Meta (cliente + data) -->
      <div style="padding:28px 46px 0;">
        <table style="width:100%;max-width:100%;border-collapse:collapse;table-layout:fixed;">
          <tr>
            <td style="vertical-align:top;padding-right:24px;">
              <div style="font-size:9.5px;font-weight:800;letter-spacing:.2em;color:#A68B95;text-transform:uppercase;margin-bottom:7px;">Preparado para</div>
              <div style="font-size:18px;font-weight:800;color:#3E2418;letter-spacing:-.015em;line-height:1.2;">${esc(o.cliente || 'Cliente')}</div>
              ${clienteZapHtml}
            </td>
            <td style="vertical-align:top;text-align:right;width:240px;">
              <div style="font-size:9.5px;font-weight:800;letter-spacing:.2em;color:#A68B95;text-transform:uppercase;margin-bottom:7px;">Data de entrega</div>
              <div style="font-size:18px;font-weight:800;color:#3E2418;letter-spacing:-.015em;line-height:1.2;">${dataFmt}</div>
              <div style="font-size:11px;font-weight:600;color:#8B5E44;margin-top:5px;text-transform:capitalize;">${o.modalidade === 'entrega' ? 'Entrega' : 'Retirada no local'}</div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Divisor -->
      <div style="padding:26px 46px 0;">
        <div style="height:2px;background:linear-gradient(90deg,transparent 0%,#F5A4C0 15%,#F6B93B 50%,#F5A4C0 85%,transparent 100%);"></div>
      </div>

      <!-- Tabela de itens -->
      <div style="padding:22px 46px 0;">
        <div style="font-size:10px;font-weight:800;letter-spacing:.22em;color:#C32262;text-transform:uppercase;margin-bottom:8px;">Itens Selecionados</div>
        <table style="width:100%;max-width:100%;border-collapse:collapse;table-layout:fixed;">
          <thead>
            <tr>
              <th style="padding:0 0 12px;text-align:left;font-size:9.5px;font-weight:800;letter-spacing:.16em;color:#A33B67;text-transform:uppercase;border-bottom:2px solid #F5A4C0;">Descrição</th>
              <th style="padding:0 0 12px;text-align:center;font-size:9.5px;font-weight:800;letter-spacing:.16em;color:#A33B67;text-transform:uppercase;border-bottom:2px solid #F5A4C0;width:60px;">Qtd</th>
              <th style="padding:0 0 12px;text-align:right;font-size:9.5px;font-weight:800;letter-spacing:.16em;color:#A33B67;text-transform:uppercase;border-bottom:2px solid #F5A4C0;width:110px;">Unitário</th>
              <th style="padding:0 0 12px;text-align:right;font-size:9.5px;font-weight:800;letter-spacing:.16em;color:#A33B67;text-transform:uppercase;border-bottom:2px solid #F5A4C0;width:120px;">Total item</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>

      <!-- Totais -->
      <div style="padding:26px 46px 0;">
        <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
          <tr>
            <td></td>
            <td style="width:320px;vertical-align:top;">
              ${descontoHtml}
              ${entregaLinhaHtml}
              <div style="border-top:2px solid #3E2418;margin-top:10px;padding-top:16px;display:flex;justify-content:space-between;align-items:baseline;">
                <span style="font-size:11px;font-weight:800;letter-spacing:.22em;color:#8B5E44;text-transform:uppercase;">Total</span>
                <span style="font-family:'Outfit',sans-serif;font-size:27px;font-weight:800;color:#B8265A;letter-spacing:-.03em;line-height:1;">${brlFmt(c.total)}</span>
              </div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Pagamento -->
      <div style="padding:34px 46px 24px;">
        <div style="padding:20px 24px;background:linear-gradient(135deg,#FFF0F5 0%,#FFF8EC 100%);border:1px solid #F5B8CC;border-radius:14px;box-shadow:0 8px 18px rgba(182,23,88,.07);">
          <div style="font-size:9.5px;font-weight:800;letter-spacing:.22em;color:#C32262;text-transform:uppercase;margin-bottom:12px;">Informações de Pagamento</div>
          <table style="width:100%;max-width:100%;border-collapse:collapse;font-size:12.5px;table-layout:fixed;">
            <tr>
              <td style="padding:3px 0;color:#7A5B67;font-weight:600;width:90px;vertical-align:top;">Condição</td>
              <td style="padding:3px 0;color:#3E2418;font-weight:700;">${pagLabel}</td>
            </tr>
            ${pixHtml}
          </table>
        </div>
      </div>

      <!-- Rodapé -->
      <!-- Barra inferior gradiente -->
      <div style="height:7px;background:linear-gradient(90deg,#F6B93B 0%,#FF8A5B 28%,#EE3F78 65%,#B61758 100%);"></div>
    </div>
  `;

  toast('📄 Gerando PDF...');
  const filename = `Orcamento_${(o.cliente || 'Cliente').replace(/\s+/g, '_')}_${dataGeracao.replace(/\//g, '-')}.pdf`;
  await renderPDFDoc(html, filename);
}

/* ═══════════════════════════════════════════════════
   PERIOD CLOSING & FINANCIAL SUMMARY
   ═══════════════════════════════════════════════════ */
function setFechPeriodo(el) {
  $$('#s-fechamento .seg').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  const isCustom = el.dataset.period === 'Personalizado';
  const customField = $('#fechCustomPeriod');
  const customInput = $('#fechPeriodoInput');
  if (customField) customField.style.display = isCustom ? 'block' : 'none';
  if (isCustom) {
    fechState.periodo = fechState.periodoCustom || 'Personalizado';
    if (customInput) {
      customInput.value = fechState.periodoCustom;
      setTimeout(() => customInput.focus(), 80);
    }
  } else {
    fechState.periodo = el.dataset.period;
  }
  renderFechamento();
}

function atualizarFechPeriodo(valor) {
  fechState.periodoCustom = valor.trim();
  fechState.periodo = fechState.periodoCustom || 'Personalizado';
  renderFechReceipt();
}

function renderFechamento() {
  const el = $('#fechItens');
  if (!fechState.itens.length) {
    el.innerHTML = `<div class="empty" style="padding:16px 10px;"><div class="etext">Nenhum item vendido adicionado ainda.</div></div>`;
  } else {
    el.innerHTML = fechState.itens.map((it, idx) => `
      <div class="item" style="flex-wrap:wrap;">
        <span class="item-ic v2">${iconSvg(it.icon, 18)}</span>
        <div class="item-body">
          <div class="name">${esc(it.nome)}</div>
          <div class="meta">${it.qtd} un × ${brlFmt(it.preco)} • Custo un. ${brlFmt(it.custo)}</div>
        </div>
        <div class="item-price">${brlFmt(it.qtd * it.preco)}</div>

        <div style="width:100%;display:flex;gap:6px;margin-top:8px;align-items:center;">
          <button class="icon-mini" onclick="fechQtd(${idx}, -1)" aria-label="Diminuir">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14"/></svg>
          </button>
          <span style="font-family:'Outfit';font-size:13px;font-weight:800;padding:0 8px;color:var(--rose-400);">${it.qtd}</span>
          <button class="icon-mini" onclick="fechQtd(${idx}, 1)" aria-label="Aumentar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          </button>
          <button class="icon-mini danger" onclick="fechRemover(${idx})" aria-label="Remover">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>
      </div>
    `).join('');
  }
  renderFechReceipt();
}

function fechQtd(idx, d) {
  const it = fechState.itens[idx];
  if (!it) return;
  const nv = it.qtd + d;
  if (nv < 1) { toast('Quantidade mínima é 1'); return; }
  if (nv > INPUT_LIMITS.quantity || !isFiniteRange(nv * it.preco, 0, INPUT_LIMITS.money)
    || !isFiniteRange(nv * it.custo, 0, INPUT_LIMITS.money)) {
    toast('A quantidade ou o total excede o limite permitido');
    return;
  }
  const vendidoOutros = fechState.itens.reduce((total, item, itemIdx) => total + (itemIdx === idx ? 0 : item.qtd * item.preco), 0);
  const custosOutros = fechState.itens.reduce((total, item, itemIdx) => total + (itemIdx === idx ? 0 : item.qtd * item.custo), 0);
  if (!isFiniteRange(vendidoOutros + nv * it.preco, 0, INPUT_LIMITS.money)
    || !isFiniteRange(custosOutros + nv * it.custo, 0, INPUT_LIMITS.money)) {
    toast('O total do fechamento excede o limite permitido');
    return;
  }
  it.qtd = nv;
  renderFechamento();
}

function fechRemover(idx) {
  const it = fechState.itens[idx];
  if (!it) return;
  confirmar('Remover item?', `"${it.nome}" sairá do fechamento.`, () => {
    fechState.itens.splice(idx, 1);
    renderFechamento();
  }, { perigo: true, okLabel: 'Remover' });
}

function renderFechReceipt() {
  const vendido = fechState.itens.reduce((a, i) => a + i.qtd * i.preco, 0);
  const custos = fechState.itens.reduce((a, i) => a + i.qtd * i.custo, 0);
  const lucro = vendido - custos;
  const parts = brlSplit(lucro);
  const now = new Date();
  const fechamentoStamp = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} • ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const periodoLabel = fechState.periodo || 'Hoje';

  $('#fechReceipt').innerHTML = `
    <div class="receipt-logo">
      ${state.perfil.logo
      ? `<img src="${state.perfil.logo}" alt="logo">`
      : `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 3v3M8 6h8l-1 4H9L8 6Z"/><path d="M6 10h12l-1.2 9.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 10Z"/></svg>`}
    </div>
    <h3>${esc(state.perfil.nome || 'Minha Confeitaria')}</h3>
    <div class="r-period">Resumo de vendas — ${esc(periodoLabel)} • ${esc(fechamentoStamp)}</div>

    <div class="r-total">${parts.int}<small>${parts.dec}</small></div>
    <div class="r-sub">Lucro Líquido Real</div>

    <div class="r-divider"></div>

    <div class="r-grid">
      <div class="r-stat">
        <div class="lbl">Total Vendido</div>
        <div class="val">${brlFmt(vendido)}</div>
      </div>
      <div class="r-stat">
        <div class="lbl">Custos Totais</div>
        <div class="val">${brlFmt(custos)}</div>
      </div>
    </div>

  `;
}

function abrirAddFechItem() {
  const prods = state.produtos;
  const list = prods.length
    ? prods.map(p => {
      const itemExistente = fechState.itens.find(item => item.produtoId === p.id);
      return `
        <button class="item item-btn" onclick="escolherProdFech('${p.id}')">
          <span class="item-ic">${iconSvg(p.icon, 18)}</span>
          <div class="item-body">
            <div class="name">${esc(p.nome)}</div>
            <div class="meta">${brlFmt(p.preco)}/un • Custo un. ${brlFmt((p.custoTotal || 0) / (p.rendimento || 1))}${itemExistente ? ` • ${itemExistente.qtd} un no fechamento` : ''}</div>
          </div>
        </button>
      `;
    }).join('')
    : '';

  openModal(`
    <div class="modal-handle"></div>
    <h3>Adicionar Item Vendido</h3>
    <p class="sub">Escolha do catálogo ou digite manualmente. Ao adicionar um produto que já está na lista, as quantidades serão somadas.</p>

    ${prods.length ? `<div style="max-height:40dvh;overflow-y:auto;margin-bottom:12px;">${list}</div>` : ''}

    <button class="btn btn-ghost" onclick="abrirFormItemManual()" style="margin-bottom:8px;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
      Digitar produto manual
    </button>
    <button class="btn btn-soft" onclick="closeModal()">Cancelar</button>
  `);
}

function escolherProdFech(id) {
  const p = state.produtos.find(x => x.id === id);
  if (!p) return;
  closeModal();
  setTimeout(() => {
    openModal(`
      <div class="modal-handle"></div>
      <h3>Quantas unidades vendeu?</h3>
      <p class="sub"><strong>${esc(p.nome)}</strong> por ${brlFmt(p.preco)}/un • custo ${brlFmt((p.custoTotal || 0) / (p.rendimento || 1))}/un</p>

      <div class="field">
        <label>Quantidade</label>
        <div class="stepper" style="margin-bottom:10px;">
          <button onclick="stepQtdProd(-1)">−</button>
          <input type="number" id="qtdProd" min="1" max="${INPUT_LIMITS.quantity}" step="1" value="1" inputmode="numeric">
          <button onclick="stepQtdProd(1)">+</button>
        </div>
      </div>

      <div class="btn-row">
        <button class="btn btn-soft" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="confirmarAddFech('${p.id}')">Adicionar</button>
      </div>
    `);
  }, 180);
}

function confirmarAddFech(id) {
  const p = state.produtos.find(x => x.id === id);
  if (!p) return;
  const v = numInput($('#qtdProd').value);
  if (!isFiniteRange(v, 1, INPUT_LIMITS.quantity) || !Number.isSafeInteger(v)) { toast('Quantidade deve ser um número inteiro de 1 a 1.000.000'); return; }
  const itemExistente = fechState.itens.find(item => item.produtoId === id);
  const quantidadeFinal = (itemExistente ? itemExistente.qtd : 0) + v;
  const custoUnitario = (p.custoTotal || 0) / (p.rendimento || 1);
  const vendidoAtual = fechState.itens.reduce((total, item) => total + item.qtd * item.preco, 0);
  const custosAtuais = fechState.itens.reduce((total, item) => total + item.qtd * item.custo, 0);
  if (quantidadeFinal > INPUT_LIMITS.quantity
    || !isFiniteRange(v * p.preco, 0, INPUT_LIMITS.money)
    || !isFiniteRange(v * custoUnitario, 0, INPUT_LIMITS.money)
    || !isFiniteRange(vendidoAtual + v * p.preco, 0, INPUT_LIMITS.money)
    || !isFiniteRange(custosAtuais + v * custoUnitario, 0, INPUT_LIMITS.money)) {
    toast('O fechamento excederia o limite permitido. Reduza a quantidade.');
    return;
  }

  closeModal();
  setTimeout(() => {
    if (itemExistente) {
      itemExistente.qtd += v;
    } else {
      fechState.itens.push({ produtoId: p.id, nome: p.nome, icon: p.icon, qtd: v, preco: p.preco, custo: custoUnitario });
    }
    renderFechamento();
    toast(itemExistente ? '✅ Quantidade atualizada no fechamento' : '✅ Item adicionado ao fechamento');
  }, 180);
}

function abrirFormItemManual() {
  closeModal();
  setTimeout(() => {
    openModal(`
      <div class="modal-handle"></div>
      <h3>Item Vendido Manual</h3>
      <p class="sub">Digite os dados da venda.</p>

      <div class="field">
        <label>Nome do produto <span class="req">*</span></label>
        <div class="input-wrap"><input type="text" id="miNome" maxlength="${INPUT_LIMITS.name}" placeholder="Ex: Torta de Limão 500g"></div>
        <div class="error">Informe o nome</div>
      </div>

      <div class="row-2">
        <div class="field">
          <label>Quantidade <span class="req">*</span></label>
          <div class="input-wrap"><input type="number" id="miQtd" value="1" min="1" max="${INPUT_LIMITS.quantity}" step="1" inputmode="numeric"></div>
          <div class="error">Valor inválido</div>
        </div>
        <div class="field">
          <label>Preço de venda <span class="req">*</span></label>
          <div class="input-wrap"><span class="pre">R$</span><input type="number" id="miPreco" min="0.01" max="${INPUT_LIMITS.money}" step="0.01" inputmode="decimal" placeholder="0,00"></div>
          <div class="error">Valor inválido</div>
        </div>
      </div>

      <div class="field">
        <label>Custo estimado (opcional)</label>
        <div class="input-wrap"><span class="pre">R$</span><input type="number" id="miCusto" value="0" min="0" max="${INPUT_LIMITS.money}" step="0.01" inputmode="decimal"></div>
      </div>

      <div class="btn-row">
        <button class="btn btn-soft" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="salvarItemManual()">Adicionar</button>
      </div>
    `);
  }, 180);
}

function salvarItemManual() {
  const nome = $('#miNome').value.trim();
  const qtd = numInput($('#miQtd').value);
  const preco = numInput($('#miPreco').value);
  const custoText = $('#miCusto').value.trim();
  const custoInput = numInput(custoText);
  const custo = custoText ? custoInput : 0;

  const nF = $('#miNome').closest('.field');
  const qF = $('#miQtd').closest('.field');
  const pF = $('#miPreco').closest('.field');
  [nF, qF, pF].forEach(f => f.classList.remove('invalid'));

  if (!nome || nome.length > INPUT_LIMITS.name) { nF.classList.add('invalid'); toast('Informe um nome de até 100 caracteres'); return; }
  if (!isFiniteRange(qtd, 1, INPUT_LIMITS.quantity) || !Number.isSafeInteger(qtd)) { qF.classList.add('invalid'); toast('Quantidade deve ser um número inteiro de 1 a 1.000.000'); return; }
  if (!isFiniteRange(preco, 0.01, INPUT_LIMITS.money)) { pF.classList.add('invalid'); toast('Preço inválido ou acima de R$ 1.000.000.000'); return; }
  if (!isFiniteRange(custo, 0, INPUT_LIMITS.money)) { toast('O custo deve estar entre R$ 0 e R$ 1.000.000.000'); return; }
  if (!isFiniteRange(qtd * preco, 0, INPUT_LIMITS.money) || !isFiniteRange(qtd * custo, 0, INPUT_LIMITS.money)) {
    toast('O valor total da venda ou do custo excede o limite permitido');
    return;
  }
  const vendidoAtual = fechState.itens.reduce((total, item) => total + item.qtd * item.preco, 0);
  const custosAtuais = fechState.itens.reduce((total, item) => total + item.qtd * item.custo, 0);
  if (!isFiniteRange(vendidoAtual + qtd * preco, 0, INPUT_LIMITS.money)
    || !isFiniteRange(custosAtuais + qtd * custo, 0, INPUT_LIMITS.money)) {
    toast('O total do fechamento excede o limite permitido');
    return;
  }

  closeModal();
  setTimeout(() => {
    fechState.itens.push({ nome, icon: 'bolo', qtd, preco, custo });
    renderFechamento();
    toast('✅ Item adicionado');
  }, 180);
}

async function gerarPDFFechamento() {
  if (!fechState.itens.length) {
    toast('Adicione itens vendidos antes de gerar o PDF');
    return;
  }

  const vendido = fechState.itens.reduce((a, i) => a + i.qtd * i.preco, 0);
  const custos = fechState.itens.reduce((a, i) => a + i.qtd * i.custo, 0);
  const lucro = vendido - custos;
  const now = new Date();
  const fechamentoStamp = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} • ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const container = $('#pdfPrintContainer');
  const lucroColor = lucro >= 0 ? '#3E9B77' : '#C32262';
  const lucroLabel = lucro >= 0 ? 'Lucro Líquido' : 'Prejuízo';

  container.innerHTML = `
    <div style="font-family:'Outfit','Nunito',-apple-system,sans-serif;color:#422033;background:#FFFAFC;width:100%;max-width:680px;box-sizing:border-box;line-height:1.4;overflow:hidden;overflow-wrap:anywhere;">
      <div style="height:7px;background:linear-gradient(90deg,#B61758 0%,#EE3F78 42%,#FF8A5B 76%,#F6B93B 100%);"></div>

      <div style="padding:12px 46px 10px;background:linear-gradient(180deg,#FFFDFD 0%,#FFF6F7 100%);border-bottom:1px solid #F5C8D8;">
        <table style="width:100%;max-width:100%;border-collapse:collapse;table-layout:fixed;">
          <tr>
            <td style="vertical-align:middle;">
              <img src="${ADOCEUP_WORDMARK_B64}" alt="AdoceUp" style="height:42px;width:auto;display:block;object-fit:contain;">
            </td>
            <td style="text-align:right;vertical-align:middle;width:120px;">
              <div style="font-size:10.5px;font-weight:700;color:#9B6A74;letter-spacing:.04em;">by <span style="color:#632C46;font-weight:800;">Alyntics</span></div>
            </td>
          </tr>
        </table>
      </div>

      <div style="padding:38px 46px 28px;border-bottom:1px solid #F5C8D8;background:linear-gradient(135deg,#FFF0F5 0%,#FFF8F2 58%,#FFFDFB 100%);">
        <table style="width:100%;max-width:100%;border-collapse:collapse;table-layout:fixed;">
          <tr>
            <td style="vertical-align:middle;padding-right:20px;">
              <table style="width:100%;max-width:100%;border-collapse:collapse;table-layout:fixed;">
                <tr>
                  <td style="vertical-align:middle;padding-right:16px;width:78px;">
                    ${state.perfil.logo
      ? `<img src="${state.perfil.logo}" style="width:66px;height:66px;border-radius:16px;object-fit:cover;display:block;box-shadow:0 4px 14px rgba(62,36,24,.14);" crossorigin="anonymous">`
      : `<div style="width:66px;height:66px;border-radius:16px;background:linear-gradient(140deg,#D89A3E,#A06E20);display:flex;align-items:center;justify-content:center;color:#fff;font-family:'Outfit',sans-serif;font-size:26px;font-weight:800;box-shadow:0 4px 14px rgba(160,110,32,.28);">${esc((state.perfil.nome || 'B')[0].toUpperCase())}</div>`}
                  </td>
                  <td style="vertical-align:middle;">
                    <div style="font-size:9.5px;font-weight:800;letter-spacing:.24em;color:#C32262;text-transform:uppercase;margin-bottom:6px;"></div>
                    <div style="font-size:27px;font-weight:800;letter-spacing:-.025em;color:#422033;line-height:1.08;">${esc(state.perfil.nome || 'Minha Confeitaria')}</div>
                    <div style="margin-top:6px;font-size:12px;font-weight:600;color:#8B5E44;letter-spacing:.01em;">${esc(state.perfil.zap ? state.perfil.zap : 'Confeitaria Artesanal')}</div>
                  </td>
                </tr>
              </table>
            </td>
            <td style="text-align:right;vertical-align:top;width:170px;">
              <div style="display:inline-block;padding:8px 15px;background:linear-gradient(135deg,#B61758,#EE3F78);color:#fff;font-size:9.5px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;border-radius:100px;box-shadow:0 5px 12px rgba(182,23,88,.22);">Resumo de vendas</div>
              <div style="margin-top:10px;font-size:10.5px;font-weight:700;color:#8B5E44;letter-spacing:.02em;line-height:1.5;">${esc(fechState.periodo)}<br>${esc(fechamentoStamp)}</div>
            </td>
          </tr>
        </table>
      </div>

      <div style="padding:26px 46px 0;">
        <div style="height:2px;background:linear-gradient(90deg,transparent 0%,#F5A4C0 15%,#F6B93B 50%,#F5A4C0 85%,transparent 100%);"></div>
      </div>

      <div style="padding:22px 46px 0;">
        <div style="font-size:10px;font-weight:800;letter-spacing:.22em;color:#C32262;text-transform:uppercase;margin-bottom:8px;">Itens Vendidos</div>
        <table style="width:100%;max-width:100%;border-collapse:collapse;table-layout:fixed;">
          <thead>
            <tr>
              <th style="padding:0 0 12px;text-align:left;font-size:9.5px;font-weight:800;letter-spacing:.16em;color:#A33B67;text-transform:uppercase;border-bottom:2px solid #F5A4C0;">Produto</th>
              <th style="padding:0 0 12px;text-align:center;font-size:9.5px;font-weight:800;letter-spacing:.16em;color:#A33B67;text-transform:uppercase;border-bottom:2px solid #F5A4C0;width:60px;">Qtd</th>
              <th style="padding:0 0 12px;text-align:right;font-size:9.5px;font-weight:800;letter-spacing:.16em;color:#A33B67;text-transform:uppercase;border-bottom:2px solid #F5A4C0;width:110px;">Valor un.</th>
              <th style="padding:0 0 12px;text-align:right;font-size:9.5px;font-weight:800;letter-spacing:.16em;color:#A33B67;text-transform:uppercase;border-bottom:2px solid #F5A4C0;width:110px;">Custo un.</th>
              <th style="padding:0 0 12px;text-align:right;font-size:9.5px;font-weight:800;letter-spacing:.16em;color:#A33B67;text-transform:uppercase;border-bottom:2px solid #F5A4C0;width:120px;">Total item</th>
            </tr>
          </thead>
          <tbody>
            ${fechState.itens.map((it, i) => `
              <tr>
                <td style="padding:16px 0;border-bottom:1px solid #F5E8DC;font-weight:700;color:#3E2418;font-size:13.5px;line-height:1.35;">${esc(it.nome)}</td>
                <td style="padding:16px 0;border-bottom:1px solid #F5E8DC;text-align:center;color:#7A5B67;font-weight:600;font-size:13px;">${it.qtd}</td>
                <td style="padding:16px 0;border-bottom:1px solid #F5E8DC;text-align:right;color:#7A5B67;font-weight:600;font-size:13px;">${brlFmt(it.preco)}</td>
                <td style="padding:16px 0;border-bottom:1px solid #F5E8DC;text-align:right;color:#7A5B67;font-weight:600;font-size:13px;">${brlFmt(it.custo)}</td>
                <td style="padding:16px 0;border-bottom:1px solid #F5E8DC;text-align:right;font-weight:800;color:#3E2418;font-size:13.5px;">${brlFmt(it.qtd * it.preco)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div style="padding:26px 46px 0;">
        <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
          <tr>
            <td></td>
            <td style="width:320px;vertical-align:top;">
              <div style="display:flex;justify-content:space-between;padding:7px 0;font-size:12.5px;font-weight:600;color:#7A5B67;">
                <span>Total vendido</span>
                <strong style="color:#3E2418;">${brlFmt(vendido)}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;padding:7px 0;font-size:12.5px;font-weight:600;color:#7A5B67;">
                <span>Custos totais</span>
                <strong style="color:#C32262;">- ${brlFmt(custos)}</strong>
              </div>
              <div style="border-top:2px solid #F5A4C0;margin-top:10px;padding-top:16px;display:flex;justify-content:space-between;align-items:baseline;">
                <span style="font-size:11px;font-weight:800;letter-spacing:.22em;color:#8B5E44;text-transform:uppercase;">${lucroLabel}</span>
                <span style="font-family:'Outfit',sans-serif;font-size:27px;font-weight:800;color:${lucroColor};letter-spacing:-.03em;line-height:1;">${brlFmt(lucro)}</span>
              </div>
            </td>
          </tr>
        </table>
      </div>

      <div style="padding:34px 46px 24px;">
        <div style="font-size:12px;font-weight:700;color:#8B5E44;letter-spacing:.04em;line-height:1.6; text-align:center;">Cada venda é um passo rumo ao próximo grande resultado: continue entregando qualidade e acolhimento com amor.</div>
      </div>

      <div style="height:7px;background:linear-gradient(90deg,#F6B93B 0%,#FF8A5B 28%,#EE3F78 65%,#B61758 100%);"></div>
    </div>
  `;

  toast('📄 Gerando PDF...');
  const filename = `Resumo_de_vendas_${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}.pdf`;
  await renderPDFDoc(container.innerHTML, filename);
}