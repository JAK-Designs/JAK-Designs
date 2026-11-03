(() => {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const WHATSAPP_NUMBER = '919486162549';
  const root = document.body;

  // Navigation and mobile menu
  const header = $('#siteHeader');
  const menuButton = $('.menu-toggle');
  const nav = $('#mainNav');
  function closeMenu() {
    if (!menuButton || !nav) return;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    nav.classList.remove('open');
  }
  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!open));
      menuButton.setAttribute('aria-label', open ? 'Open navigation' : 'Close navigation');
      nav.classList.toggle('open', !open);
    });
    $$('a', nav).forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
    window.addEventListener('resize', () => { if (window.innerWidth > 780) closeMenu(); });
  }
  function updateHeader() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 12);
  }
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  // Shared helpers
  function openWhatsApp(message) {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }
  function downloadCanvas(canvas, filename) {
    canvas.toBlob(blob => {
      if (!blob) {
        window.alert('Could not create the preview file in this browser. Please try again.');
        return;
      }
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1200);
    }, 'image/png');
  }
  function roundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }
  function wrapCanvasText(ctx, text, maxWidth) {
    const words = String(text || '').split(/\s+/);
    const lines = [];
    let line = '';
    words.forEach(word => {
      const test = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(test).width > maxWidth) {
        lines.push(line);
        line = word;
      } else line = test;
    });
    if (line) lines.push(line);
    return lines;
  }

  // Activity tabs
  const tabs = $$('.activity-tab');
  const panels = $$('.activity-panel');
  function activateTab(name, focus = false) {
    tabs.forEach(tab => {
      const active = tab.dataset.tab === name;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focus) tab.focus();
    });
    panels.forEach(panel => {
      const active = panel.id === `panel-${name}`;
      panel.hidden = !active;
      panel.classList.toggle('active', active);
    });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(tab.dataset.tab));
    tab.addEventListener('keydown', event => {
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      activateTab(tabs[next].dataset.tab, true);
    });
  });

  // Set enquiry product then open playground
  function chooseEnquiryProduct(product) {
    const select = $('#enquiry-product');
    if (select) {
      const option = [...select.options].find(item => item.value === product || item.textContent === product);
      if (option) select.value = option.value;
      updateEnquirySummary();
    }
    activateTab('enquiry');
  }
  $$('[data-enquiry-product]').forEach(link => {
    link.addEventListener('click', () => chooseEnquiryProduct(link.dataset.enquiryProduct));
  });

  // Visiting card creator
  const cardInputs = {
    name: $('#card-name'), role: $('#card-role'), phone: $('#card-phone'), extra: $('#card-extra')
  };
  const cardPreview = $('#visiting-card');
  const cardState = { bg: '#173f35', accent: '#d8ed77', side: 'front' };
  const cardText = {
    name: $('#vc-name'), role: $('#vc-role'), phone: $('#vc-phone'), extra: $('#vc-extra')
  };
  function updateCardPreview() {
    if (!cardPreview) return;
    if (cardState.side === 'front') {
      cardText.name.textContent = cardInputs.name.value.trim() || 'Your Name';
      cardText.role.textContent = cardInputs.role.value.trim() || 'Your Designation';
      cardText.phone.textContent = cardInputs.phone.value.trim() || 'Phone number';
      cardText.extra.textContent = cardInputs.extra.value.trim() || 'Email / Website';
    }
    cardPreview.style.background = cardState.bg;
    cardPreview.style.setProperty('--card-accent', cardState.accent);
  }
  Object.values(cardInputs).forEach(input => input.addEventListener('input', updateCardPreview));
  $$('#card-swatches .swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      cardState.bg = swatch.dataset.bg;
      cardState.accent = swatch.dataset.accent;
      $$('#card-swatches .swatch').forEach(item => item.classList.toggle('selected', item === swatch));
      updateCardPreview();
    });
  });
  $('#card-flip').addEventListener('click', () => {
    cardState.side = cardState.side === 'front' ? 'back' : 'front';
    const button = $('#card-flip');
    const label = $('#card-side-label');
    if (cardState.side === 'back') {
      cardPreview.innerHTML = `<div class="vc-brand">JAK<span> / </span>DESIGNS</div><div class="vc-back-message">Ideas into print.<br><small>Design · Create · Deliver</small></div><div class="vc-footer"><span>Thoothukudi, Tamil Nadu</span><span>JAK</span></div>`;
      $('.vc-back-message', cardPreview).style.cssText = 'font:500 24px "Plus Jakarta Sans",Inter,sans-serif;line-height:1.3;position:relative;z-index:1';
      button.textContent = 'View front ↻';
      label.textContent = 'BACK / 02';
    } else {
      cardPreview.innerHTML = `<div class="vc-brand">JAK<span> / </span>CREATIVE STUDIO</div><div><div class="vc-name" id="vc-name"></div><div class="vc-role" id="vc-role"></div></div><div class="vc-footer"><span id="vc-phone"></span><span id="vc-extra"></span></div>`;
      cardText.name = $('#vc-name'); cardText.role = $('#vc-role'); cardText.phone = $('#vc-phone'); cardText.extra = $('#vc-extra');
      button.textContent = 'View back ↻';
      label.textContent = 'FRONT / 01';
      updateCardPreview();
    }
    cardPreview.style.background = cardState.bg;
    cardPreview.style.setProperty('--card-accent', cardState.accent);
  });
  $('#card-download').addEventListener('click', async () => {
    await document.fonts.load('600 44px "Plus Jakarta Sans"');
    await document.fonts.load('500 28px Inter');
    await document.fonts.load('500 28px "Plus Jakarta Sans"');
    const canvas = document.createElement('canvas');
    canvas.width = 1050; canvas.height = 600;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = cardState.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ffffff55'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(960, 570, 220, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#ffffff20'; ctx.beginPath(); ctx.arc(960, 570, 270, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = cardState.accent; ctx.font = '500 32px Inter'; ctx.fillText('JAK / CREATIVE STUDIO', 75, 95);
    if (cardState.side === 'front') {
      ctx.fillStyle = '#ffffff'; ctx.font = '600 44px \"Plus Jakarta Sans\", \"Noto Sans Tamil\", Inter, sans-serif';
      const nameLines = wrapCanvasText(ctx, cardInputs.name.value.trim() || 'Your Name', 880);
      nameLines.slice(0, 2).forEach((line, i) => ctx.fillText(line, 75, 300 + i * 62));
      ctx.fillStyle = '#ffffffbf'; ctx.font = '500 28px Inter'; ctx.fillText(cardInputs.role.value.trim() || 'Your Designation', 75, 390);
      ctx.fillStyle = '#ffffff'; ctx.font = '600 23px Inter';
      ctx.fillText(cardInputs.phone.value.trim() || 'Phone number', 75, 520);
      ctx.textAlign = 'right'; ctx.fillText(cardInputs.extra.value.trim() || 'Email / Website', 975, 520); ctx.textAlign = 'left';
    } else {
      ctx.fillStyle = '#ffffff'; ctx.font = '600 40px \"Plus Jakarta Sans\", \"Noto Sans Tamil\", Inter, sans-serif'; ctx.fillText('Ideas into print.', 75, 290);
      ctx.font = '500 28px Inter'; ctx.fillText('Design · Create · Deliver', 75, 355);
      ctx.font = '500 22px Inter'; ctx.fillText('Thoothukudi, Tamil Nadu', 75, 520);
    }
    downloadCanvas(canvas, 'JAK-visiting-card-preview.png');
  });
  updateCardPreview();

  // Banner preview and download
  const bannerState = { bg: '#173f35', fg: '#f6f5ec', format: 'landscape' };
  function updateBanner() {
    const preview = $('#banner-preview');
    preview.style.background = bannerState.bg;
    preview.style.color = bannerState.fg;
    $('#banner-preview-title').textContent = $('#banner-title').value.trim() || 'YOUR HEADLINE';
    $('#banner-preview-subtitle').textContent = $('#banner-subtitle').value.trim() || 'Add your supporting message';
    const format = $('#banner-format').value;
    bannerState.format = format;
    preview.classList.toggle('banner-square', format === 'square');
    $('#banner-ratio-label').textContent = format === 'square' ? '4 × 4 FT' : format === 'wide' ? '8 × 4 FT' : '6 × 3 FT';
  }
  ['#banner-title', '#banner-subtitle', '#banner-format'].forEach(selector => $(selector).addEventListener('input', updateBanner));
  $$('#banner-swatches .swatch').forEach(swatch => swatch.addEventListener('click', () => {
    bannerState.bg = swatch.dataset.bg; bannerState.fg = swatch.dataset.fg;
    $$('#banner-swatches .swatch').forEach(item => item.classList.toggle('selected', item === swatch)); updateBanner();
  }));
  $('#banner-download').addEventListener('click', async () => {
    await document.fonts.load('500 58px Sora');
    await document.fonts.load('400 28px Inter');
    const canvas = document.createElement('canvas');
    canvas.width = bannerState.format === 'square' ? 1200 : bannerState.format === 'wide' ? 1800 : 1500;
    canvas.height = bannerState.format === 'square' ? 1200 : bannerState.format === 'wide' ? 900 : 750;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bannerState.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ffffff55'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(canvas.width * .9, canvas.height * .13, canvas.height * .31, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = bannerState.fg; ctx.font = '500 34px Inter'; ctx.fillText('JAK DESIGNS  ✳', 70, 85);
    const headline = $('#banner-title').value.trim() || 'YOUR HEADLINE';
    let fontSize = Math.min(canvas.width * .055, 68);
    ctx.font = `500 ${fontSize}px Sora, \"Noto Sans Tamil\", Inter, sans-serif`;
    let lines = wrapCanvasText(ctx, headline, canvas.width - 140);
    if (lines.length > 3) { fontSize *= .8; ctx.font = `500 ${fontSize}px Sora, \"Noto Sans Tamil\", Inter, sans-serif`; lines = wrapCanvasText(ctx, headline, canvas.width - 140); }
    const yStart = canvas.height * .48 - ((lines.length - 1) * fontSize * .54);
    lines.slice(0, 3).forEach((line, i) => ctx.fillText(line, 70, yStart + i * fontSize * 1.08));
    ctx.font = `${Math.max(22, fontSize * .25)}px Inter`;
    ctx.fillText($('#banner-subtitle').value.trim() || 'Your supporting message', 72, canvas.height - 95);
    ctx.font = '500 19px Inter'; ctx.fillText('MAKE YOUR MARK / THOOTHUKUDI', 72, canvas.height - 42);
    downloadCanvas(canvas, 'JAK-banner-preview.png');
  });
  $('#banner-to-enquiry').addEventListener('click', () => {
    chooseEnquiryProduct('Flex Banners');
    $('#enquiry-size').value = $('#banner-format').value === 'square' ? '4 × 4 ft' : $('#banner-format').value === 'wide' ? '8 × 4 ft' : '6 × 3 ft';
    updateEnquirySummary();
    $('#playground').scrollIntoView({ behavior: 'smooth' });
  });
  updateBanner();

  // Sticker maker
  const stickerState = { bg: '#d8ed77', fg: '#173f35' };
  function updateSticker() {
    const preview = $('#sticker-preview');
    preview.textContent = $('#sticker-text').value.trim() || 'YOUR TEXT';
    preview.style.background = stickerState.bg;
    preview.style.color = stickerState.fg;
    preview.classList.remove('square', 'pill');
    preview.classList.add($('#sticker-shape').value);
  }
  $('#sticker-text').addEventListener('input', updateSticker);
  $('#sticker-shape').addEventListener('change', updateSticker);
  $$('#sticker-swatches .swatch').forEach(swatch => swatch.addEventListener('click', () => {
    stickerState.bg = swatch.dataset.bg; stickerState.fg = swatch.dataset.fg;
    $$('#sticker-swatches .swatch').forEach(item => item.classList.toggle('selected', item === swatch)); updateSticker();
  }));
  $('#sticker-download').addEventListener('click', async () => {
    await document.fonts.load('500 62px Sora');
    const shape = $('#sticker-shape').value;
    const canvas = document.createElement('canvas');
    canvas.width = shape === 'pill' ? 1200 : 900; canvas.height = 900;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f4f0f6'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const x = shape === 'pill' ? 90 : 100; const y = shape === 'pill' ? 245 : 100;
    const width = shape === 'pill' ? 1020 : 700; const height = shape === 'pill' ? 410 : 700;
    ctx.fillStyle = stickerState.bg;
    if (shape === 'round') { ctx.beginPath(); ctx.arc(canvas.width / 2, canvas.height / 2, 350, 0, Math.PI * 2); ctx.fill(); }
    else { roundedRect(ctx, x, y, width, height, shape === 'pill' ? 95 : 45); ctx.fill(); }
    const text = $('#sticker-text').value.trim() || 'YOUR TEXT';
    let size = shape === 'pill' ? 64 : 60;
    ctx.font = `500 ${size}px Sora, \"Noto Sans Tamil\", Inter, sans-serif`;
    let lines = wrapCanvasText(ctx, text, width - 100);
    if (lines.length > 3) { size *= .75; ctx.font = `500 ${size}px Sora, \"Noto Sans Tamil\", Inter, sans-serif`; lines = wrapCanvasText(ctx, text, width - 100); }
    ctx.fillStyle = stickerState.fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lineHeight = size * 1.12; const middleY = canvas.height / 2;
    lines.slice(0, 3).forEach((line, i) => ctx.fillText(line, canvas.width / 2, middleY + (i - (Math.min(lines.length, 3) - 1) / 2) * lineHeight, width - 80));
    downloadCanvas(canvas, 'JAK-sticker-preview.png');
  });
  $('#sticker-to-enquiry').addEventListener('click', () => {
    chooseEnquiryProduct('Stickers & Labels');
    $('#enquiry-notes').value = `Sticker text: ${$('#sticker-text').value}. Shape: ${$('#sticker-shape').value}.`;
    updateEnquirySummary(); $('#playground').scrollIntoView({ behavior: 'smooth' });
  });
  updateSticker();

  // Print size reference guide
  const sizeData = {
    paper: [
      { value: 'A4', name: 'A4', mm: [210, 297], desc: 'A practical size for documents, certificates and flyers.' },
      { value: 'A3', name: 'A3', mm: [297, 420], desc: 'A larger sheet for posters, menus and display artwork.' },
      { value: 'A5', name: 'A5', mm: [148, 210], desc: 'A compact size for leaflets, handouts and small brochures.' },
      { value: 'A6', name: 'A6', mm: [105, 148], desc: 'A small format for postcards, inserts and promotional cards.' }
    ],
    card: [
      { value: 'standard', name: 'Standard visiting card', mm: [89, 51], desc: 'A common compact business-card reference. Confirm the printer’s final trim and bleed setup.' },
      { value: 'square', name: 'Square visiting card', mm: [65, 65], desc: 'A distinctive square-format card. Ask the studio about available stocks and finishing.' }
    ],
    banner: [
      { value: '6x3', name: 'Flex banner · 6 × 3 ft', mm: [1829, 914], desc: 'A common landscape banner reference. Actual visible size can vary with eyelets and finishing.' },
      { value: '8x4', name: 'Flex banner · 8 × 4 ft', mm: [2438, 1219], desc: 'A larger landscape promotional banner reference.' },
      { value: '10x5', name: 'Flex banner · 10 × 5 ft', mm: [3048, 1524], desc: 'For larger promotional displays. Confirm viewing distance and output resolution.' }
    ],
    photo: [
      { value: '4x6', name: 'Photo print · 4 × 6 in', mm: [102, 152], desc: 'A familiar small photo print format.' },
      { value: '5x7', name: 'Photo print · 5 × 7 in', mm: [127, 178], desc: 'A medium photo print suitable for frames and albums.' },
      { value: '8x10', name: 'Photo print · 8 × 10 in', mm: [203, 254], desc: 'A larger photo print format for display and framing.' }
    ]
  };
  const categorySelect = $('#size-category'); const optionSelect = $('#size-option');
  function renderSizeOptions() {
    const items = sizeData[categorySelect.value];
    optionSelect.innerHTML = '';
    items.forEach(item => { const option = document.createElement('option'); option.value = item.value; option.textContent = item.name; optionSelect.appendChild(option); });
    updateSizeResult();
  }
  function updateSizeResult() {
    const item = sizeData[categorySelect.value].find(entry => entry.value === optionSelect.value) || sizeData[categorySelect.value][0];
    const [w, h] = item.mm;
    const pxW = Math.round(w / 25.4 * 300); const pxH = Math.round(h / 25.4 * 300);
    $('#size-name').textContent = item.name;
    $('#size-mm').textContent = `${w} × ${h} mm`;
    $('#size-px').textContent = `${pxW.toLocaleString('en-IN')} × ${pxH.toLocaleString('en-IN')} px`;
    $('#size-description').textContent = item.desc;
    const paperShape = $('#size-shape');
    const ratio = w / h;
    paperShape.style.width = ratio >= 1 ? '112px' : `${Math.max(56, 112 * ratio)}px`;
    paperShape.style.height = ratio >= 1 ? `${Math.max(54, 105 / ratio)}px` : '118px';
    paperShape.querySelector('span').textContent = categorySelect.value === 'paper' ? item.value : categorySelect.value === 'card' ? 'CARD' : categorySelect.value === 'banner' ? 'FLEX' : 'PHOTO';
  }
  categorySelect.addEventListener('change', renderSizeOptions);
  optionSelect.addEventListener('change', updateSizeResult);
  $('#size-to-enquiry').addEventListener('click', () => {
    const item = sizeData[categorySelect.value].find(entry => entry.value === optionSelect.value);
    const productMap = { paper: 'Other Printing Work', card: 'Visiting Cards', banner: 'Flex Banners', photo: 'Other Printing Work' };
    chooseEnquiryProduct(productMap[categorySelect.value]);
    $('#enquiry-size').value = `${item.name} (${item.mm[0]} × ${item.mm[1]} mm)`;
    updateEnquirySummary(); $('#playground').scrollIntoView({ behavior: 'smooth' });
  });
  renderSizeOptions();

  // Quick enquiry builder
  const enquiryFields = ['#enquiry-name', '#enquiry-product', '#enquiry-qty', '#enquiry-size', '#enquiry-finish', '#enquiry-notes'];
  function updateEnquirySummary() {
    $('#summary-product').textContent = $('#enquiry-product').value;
    $('#summary-qty').textContent = $('#enquiry-qty').value.trim() || 'Not specified';
    $('#summary-size').textContent = $('#enquiry-size').value.trim() || 'Not specified';
    $('#summary-finish').textContent = $('#enquiry-finish').value;
  }
  enquiryFields.forEach(selector => $(selector).addEventListener('input', updateEnquirySummary));
  $('#build-enquiry').addEventListener('click', () => {
    const name = $('#enquiry-name').value.trim() || 'Not provided';
    const product = $('#enquiry-product').value;
    const qty = $('#enquiry-qty').value.trim() || 'Not specified';
    const size = $('#enquiry-size').value.trim() || 'Not specified';
    const finish = $('#enquiry-finish').value;
    const notes = $('#enquiry-notes').value.trim() || 'No additional details';
    const message = `Hello JAK DESIGNS! I would like a quote.\nName: ${name}\nProduct: ${product}\nQuantity: ${qty}\nSize: ${size}\nFinish / material: ${finish}\nAdditional details: ${notes}`;
    $('#enquiry-status').textContent = 'Your WhatsApp enquiry is ready. A new tab will open so you can review and send it.';
    openWhatsApp(message);
  });
  updateEnquirySummary();

  // Home hero: interactive animal and bird colouring studio with a full hue wheel.
  const colouringRoot = $('#hero-color-tools');
  const colouringSvg = $('#hero-coloring-svg');
  if (colouringRoot && colouringSvg) {
    const animals = {
      lion: {
        label: 'LION',
        svg: `
          <!-- Side leaves and little flowers -->
          <path data-region="left-leaf-top" aria-label="Left upper leaf" d="M31 151 C8 120 22 91 63 98 C62 126 51 145 31 151 Z"/>
          <path data-region="left-leaf-bottom" aria-label="Left lower leaf" d="M28 253 C4 226 17 198 59 203 C61 229 46 246 28 253 Z"/>
          <path data-region="right-leaf-top" aria-label="Right upper leaf" d="M376 151 C399 120 385 91 344 98 C345 126 356 145 376 151 Z"/>
          <path data-region="right-leaf-bottom" aria-label="Right lower leaf" d="M392 253 C416 226 403 198 361 203 C359 229 374 246 392 253 Z"/>
          <path d="M25 280 Q42 221 52 145 M395 280 Q378 221 368 145" fill="none" stroke="#173f35" stroke-width="3"/>
          <path d="M43 133 Q52 123 59 108 M40 230 Q49 224 57 210 M377 133 Q368 123 361 108 M380 230 Q371 224 363 210" fill="none" stroke="#173f35" stroke-width="2"/>
          <path transform="translate(30 30)" data-region="flower-left" aria-label="Left flower" d="M43 65 C31 49 47 38 56 51 C63 34 82 43 73 59 C92 58 91 78 74 80 C81 97 61 102 55 84 C40 98 26 81 42 72 Z"/>
          <circle transform="translate(30 30)" data-region="flower-left-centre" aria-label="Left flower centre" cx="58" cy="69" r="8"/>
          <!-- Tail -->
          <path data-region="tail" aria-label="Lion tail" d="M131 209 C102 207 91 188 91 158 C90 136 76 128 61 135 C47 141 42 129 49 118 C59 102 83 108 95 122 C112 143 111 176 151 181 Z"/>
          <path data-region="tail-tuft" aria-label="Lion tail tuft" d="M50 119 C31 99 23 112 31 127 C12 127 13 145 32 147 C20 164 39 174 51 157 C68 166 78 149 62 138 C78 125 68 108 50 119 Z"/>
          <!-- Four full legs -->
          <path data-region="rear-far-leg" aria-label="Back far leg" d="M145 235 C133 256 132 288 134 322 L132 345 Q145 356 164 346 L172 316 L178 260 Z"/>
          <path data-region="rear-near-leg" aria-label="Back near leg" d="M177 242 C169 270 174 306 178 333 L174 352 Q190 362 208 350 L214 328 L211 251 Z"/>
          <path data-region="front-far-leg" aria-label="Front far leg" d="M268 237 L266 319 L261 348 Q274 359 294 348 L300 321 L300 246 Z"/>
          <path data-region="front-near-leg" aria-label="Front near leg" d="M300 233 C309 262 309 295 307 325 L312 350 Q329 359 345 346 L340 315 L337 244 Z"/>
          <!-- Paws -->
          <path data-region="rear-far-paw" aria-label="Back far paw" d="M132 337 Q146 330 164 340 L169 352 Q160 363 133 357 Z"/>
          <path data-region="rear-near-paw" aria-label="Back near paw" d="M175 343 Q191 336 209 345 L213 357 Q201 367 176 360 Z"/>
          <path data-region="front-far-paw" aria-label="Front far paw" d="M261 339 Q278 331 296 340 L302 354 Q289 365 261 358 Z"/>
          <path data-region="front-near-paw" aria-label="Front near paw" d="M309 340 Q326 333 343 340 L350 353 Q339 366 313 359 Z"/>
          <!-- Body and mane -->
          <path data-region="body" aria-label="Lion body" d="M112 190 C128 158 167 151 214 157 C263 161 296 186 305 220 C310 251 283 277 240 280 L157 270 C118 262 97 231 112 190 Z"/>
          <path data-region="mane" aria-label="Lion mane" d="M254 71 C274 64 290 79 294 98 C315 101 327 120 317 139 C333 156 326 178 311 187 C312 210 293 224 273 219 C259 239 235 239 222 223 C198 231 180 215 184 194 C163 181 164 158 181 145 C173 124 185 105 207 102 C214 81 235 69 254 71 Z"/>
          <circle data-region="ear" aria-label="Lion ear" cx="211" cy="103" r="22"/>
          <circle data-region="inner-ear" aria-label="Lion inner ear" cx="211" cy="103" r="11"/>
          <path data-region="face" aria-label="Lion face" d="M225 108 C250 89 282 106 285 137 C288 167 269 188 247 190 C222 189 205 168 208 140 C209 126 215 115 225 108 Z"/>
          <ellipse data-region="muzzle-left" aria-label="Left muzzle" cx="235" cy="166" rx="20" ry="16"/>
          <ellipse data-region="muzzle-right" aria-label="Right muzzle" cx="264" cy="166" rx="20" ry="16"/>
          <path data-region="nose" aria-label="Lion nose" d="M241 151 Q250 144 259 151 L250 163 Z"/>
          <path d="M250 163 Q249 174 239 178 M250 163 Q251 174 261 178" fill="none" stroke="#173f35" stroke-width="3.5"/>
          <ellipse cx="229" cy="135" rx="4.5" ry="6" fill="#173f35"/><ellipse cx="272" cy="135" rx="4.5" ry="6" fill="#173f35"/>
          <path d="M222 121 Q230 116 238 121 M264 121 Q272 116 280 121" fill="none" stroke="#173f35" stroke-width="3"/>
          <path d="M222 159 L204 153 M222 169 L201 171 M279 159 L297 153 M278 169 L299 171" fill="none" stroke="#173f35" stroke-width="2.2"/>
          <path d="M153 362 H355" fill="none" stroke="#173f35" stroke-width="3"/>
        `
      },
      elephant: {
        label: 'ELEPHANT',
        svg: `
          <path data-region="leaf-left-top" aria-label="Left upper leaf" d="M33 126 C10 93 27 69 66 82 C65 105 51 121 33 126 Z"/>
          <path data-region="leaf-left-bottom" aria-label="Left lower leaf" d="M35 265 C5 243 14 213 56 216 C62 240 51 258 35 265 Z"/>
          <path data-region="leaf-right-top" aria-label="Right upper leaf" d="M383 126 C406 93 389 69 350 82 C351 105 365 121 383 126 Z"/>
          <path data-region="leaf-right-bottom" aria-label="Right lower leaf" d="M385 265 C415 243 406 213 364 216 C358 240 369 258 385 265 Z"/>
          <path d="M30 290 Q38 221 53 128 M390 290 Q382 221 367 128" fill="none" stroke="#173f35" stroke-width="3"/>
          <path d="M40 111 Q52 101 63 94 M38 248 Q49 239 59 228 M380 111 Q368 101 357 94 M382 248 Q371 239 361 228" fill="none" stroke="#173f35" stroke-width="2"/>
          <!-- Tail -->
          <path data-region="tail" aria-label="Elephant tail" d="M320 202 Q354 205 354 240 L353 272 Q362 286 373 278 Q381 267 374 254" fill="none" stroke="#173f35" stroke-width="7" stroke-linecap="round"/>
          <path data-region="tail-tuft" aria-label="Elephant tail tuft" d="M365 272 Q383 258 390 276 Q395 293 377 300 Q360 300 365 272 Z"/>
          <!-- Four sturdy legs -->
          <path data-region="back-far-leg" aria-label="Back far leg" d="M159 244 L158 329 Q160 350 179 350 L196 346 L198 249 Z"/>
          <path data-region="back-near-leg" aria-label="Back near leg" d="M194 244 L195 337 Q197 356 217 356 L234 348 L230 244 Z"/>
          <path data-region="front-far-leg" aria-label="Front far leg" d="M268 236 L265 329 Q267 349 286 350 L301 345 L304 238 Z"/>
          <path data-region="front-near-leg" aria-label="Front near leg" d="M303 233 L307 336 Q308 356 329 355 L344 345 L337 228 Z"/>
          <path data-region="back-far-foot" aria-label="Back far foot" d="M158 338 Q177 332 196 342 L198 355 Q184 365 160 358 Z"/>
          <path data-region="back-near-foot" aria-label="Back near foot" d="M195 344 Q215 337 234 344 L238 358 Q224 368 198 362 Z"/>
          <path data-region="front-far-foot" aria-label="Front far foot" d="M265 338 Q283 333 301 340 L305 354 Q291 365 267 359 Z"/>
          <path data-region="front-near-foot" aria-label="Front near foot" d="M307 343 Q326 337 344 342 L349 356 Q334 368 310 362 Z"/>
          <!-- Body, ear, head and trunk -->
          <path data-region="body" aria-label="Elephant body" d="M112 166 C123 127 163 111 221 119 C279 126 315 163 316 208 C316 251 280 273 220 269 C155 266 111 238 112 166 Z"/>
          <path data-region="ear" aria-label="Elephant ear" d="M143 143 C105 91 61 111 67 175 C70 221 107 239 150 204 Z"/>
          <path data-region="inner-ear" aria-label="Elephant inner ear" d="M126 151 C103 123 84 135 88 171 C91 195 111 210 133 194 Z"/>
          <path data-region="head" aria-label="Elephant head" d="M119 139 C137 105 182 99 211 125 C236 148 239 188 218 214 C198 238 161 239 137 217 C112 194 104 164 119 139 Z"/>
          <path data-region="trunk" aria-label="Elephant trunk" d="M181 188 C207 187 220 204 214 225 C210 241 197 252 198 273 C199 291 217 298 230 286 C241 276 239 259 234 247 C258 267 255 299 231 316 C204 334 172 314 174 282 C175 259 190 244 191 224 C191 211 185 206 171 205 Z"/>
          <path data-region="tusk" aria-label="Elephant tusk" d="M125 183 C102 188 104 221 123 229 C141 234 147 210 137 194 Z"/>
          <circle cx="185" cy="153" r="5.5" fill="#173f35"/>
          <path d="M146 132 Q164 120 181 130 M73 176 Q93 186 112 179" fill="none" stroke="#173f35" stroke-width="3"/>
          <path d="M165 357 H350" fill="none" stroke="#173f35" stroke-width="3"/>
        `
      },
      butterfly: {
        label: 'BUTTERFLY',
        svg: `
          <!-- Leafy flowering stems -->
          <path data-region="left-leaf-1" aria-label="Left leaf one" d="M43 237 C13 218 18 188 59 188 C64 212 57 229 43 237 Z"/>
          <path data-region="left-leaf-2" aria-label="Left leaf two" d="M42 300 C9 292 6 261 43 250 C58 270 55 289 42 300 Z"/>
          <path data-region="right-leaf-1" aria-label="Right leaf one" d="M377 237 C407 218 402 188 361 188 C356 212 363 229 377 237 Z"/>
          <path data-region="right-leaf-2" aria-label="Right leaf two" d="M378 300 C411 292 414 261 377 250 C362 270 365 289 378 300 Z"/>
          <path d="M39 326 Q44 273 52 232 M381 326 Q376 273 368 232" fill="none" stroke="#173f35" stroke-width="3"/>
          <path d="M42 220 Q52 211 60 199 M42 279 Q51 271 57 260 M378 220 Q368 211 360 199 M378 279 Q369 271 363 260" fill="none" stroke="#173f35" stroke-width="2"/>
          <path data-region="flower-left" aria-label="Left flower" d="M62 118 C46 98 63 82 76 100 C89 80 107 97 91 115 C111 124 99 145 81 134 C71 155 49 143 62 126 Z"/>
          <circle data-region="flower-left-centre" aria-label="Left flower centre" cx="78" cy="119" r="9"/>
          <path data-region="flower-right" aria-label="Right flower" d="M340 118 C324 98 341 82 354 100 C367 80 385 97 369 115 C389 124 377 145 359 134 C349 155 327 143 340 126 Z"/>
          <circle data-region="flower-right-centre" aria-label="Right flower centre" cx="356" cy="119" r="9"/>
          <!-- Four large, clearly separated wings -->
          <path data-region="upper-left-wing" aria-label="Upper left wing" d="M190 185 C153 124 103 61 55 73 C20 82 33 145 72 181 C104 207 151 210 190 205 Z"/>
          <path data-region="lower-left-wing" aria-label="Lower left wing" d="M186 206 C134 195 79 203 69 247 C58 294 111 327 157 294 C179 278 190 240 194 215 Z"/>
          <path data-region="upper-right-wing" aria-label="Upper right wing" d="M210 185 C247 124 297 61 345 73 C380 82 367 145 328 181 C296 207 249 210 210 205 Z"/>
          <path data-region="lower-right-wing" aria-label="Lower right wing" d="M214 206 C266 195 321 203 331 247 C342 294 289 327 243 294 C221 278 210 240 206 215 Z"/>
          <!-- Wing spots -->
          <circle data-region="left-upper-spot" aria-label="Left upper wing spot" cx="104" cy="137" r="20"/>
          <circle data-region="right-upper-spot" aria-label="Right upper wing spot" cx="296" cy="137" r="20"/>
          <circle data-region="left-lower-spot" aria-label="Left lower wing spot" cx="125" cy="254" r="15"/>
          <circle data-region="right-lower-spot" aria-label="Right lower wing spot" cx="275" cy="254" r="15"/>
          <!-- Central body and visible six legs -->
          <ellipse data-region="butterfly-body" aria-label="Butterfly body" cx="200" cy="213" rx="13" ry="66"/>
          <circle data-region="butterfly-head" aria-label="Butterfly head" cx="200" cy="137" r="18"/>
          <path d="M193 121 Q164 73 144 82 M207 121 Q236 73 256 82" fill="none" stroke="#173f35" stroke-width="3.5" stroke-linecap="round"/>
          <path d="M191 244 Q174 260 166 291 M195 249 Q185 270 184 299 M199 250 L198 305 M201 250 L202 305 M205 249 Q215 270 216 299 M209 244 Q226 260 234 291" fill="none" stroke="#173f35" stroke-width="3" stroke-linecap="round"/>
          <path d="M166 291 L159 298 M184 299 L178 306 M198 305 L192 311 M202 305 L208 311 M216 299 L222 306 M234 291 L241 298" fill="none" stroke="#173f35" stroke-width="2.5" stroke-linecap="round"/>
        `
      },
      parrot: {
        label: 'PARROT',
        svg: `
          <!-- Tropical leaves behind the bird -->
          <path data-region="left-leaf" aria-label="Left tropical leaf" d="M35 198 C7 164 23 126 72 135 C74 163 59 185 35 198 Z"/>
          <path data-region="left-lower-leaf" aria-label="Left lower leaf" d="M44 277 C10 260 14 230 57 222 C72 245 64 266 44 277 Z"/>
          <path data-region="right-leaf" aria-label="Right tropical leaf" d="M382 188 C412 156 397 121 354 132 C350 160 363 179 382 188 Z"/>
          <path data-region="right-lower-leaf" aria-label="Right lower leaf" d="M377 280 C410 258 404 229 362 222 C348 246 357 267 377 280 Z"/>
          <path d="M35 300 Q43 238 59 193 M385 300 Q377 238 361 190" fill="none" stroke="#173f35" stroke-width="3"/>
          <path d="M38 178 Q50 166 66 153 M42 259 Q54 250 65 239 M382 168 Q370 158 354 148 M378 258 Q366 249 355 238" fill="none" stroke="#173f35" stroke-width="2"/>
          <!-- Tail feathers -->
          <path data-region="tail-feather-left" aria-label="Left tail feather" d="M173 232 C125 263 101 315 116 354 C157 341 184 293 193 243 Z"/>
          <path data-region="tail-feather-middle" aria-label="Middle tail feather" d="M190 234 C162 291 170 343 199 365 C225 326 218 278 205 235 Z"/>
          <path data-region="tail-feather-right" aria-label="Right tail feather" d="M204 227 C224 278 257 313 291 311 C289 270 251 231 216 210 Z"/>
          <!-- Legs and feet gripping branch -->
          <path d="M182 258 L176 316 M219 254 L228 316" fill="none" stroke="#173f35" stroke-width="7" stroke-linecap="round"/>
          <path data-region="left-foot" aria-label="Parrot left foot" d="M176 309 C159 303 151 316 164 325 L183 326 M176 316 L163 337 M176 316 L189 334"/>
          <path data-region="right-foot" aria-label="Parrot right foot" d="M228 309 C245 302 254 315 241 325 L221 326 M228 316 L241 337 M228 316 L215 334"/>
          <path data-region="branch" aria-label="Perch branch" d="M86 337 Q180 326 323 338 L328 350 Q199 344 89 353 Z"/>
          <path data-region="branch-leaf-left" aria-label="Leaf on perch left" d="M107 335 Q79 304 54 314 Q67 340 107 343 Z"/>
          <path data-region="branch-leaf-right" aria-label="Leaf on perch right" d="M302 337 Q318 305 349 311 Q343 339 302 345 Z"/>
          <!-- Body and wing -->
          <path data-region="body" aria-label="Parrot body" d="M153 146 C158 104 198 84 231 104 C270 127 279 185 254 232 C235 267 191 279 163 251 C137 226 137 180 153 146 Z"/>
          <path data-region="wing" aria-label="Parrot wing" d="M158 176 C182 138 230 137 247 175 C259 207 229 238 190 241 C164 232 145 204 158 176 Z"/>
          <path d="M169 195 Q198 167 232 185 M169 212 Q202 190 237 207 M177 228 Q205 211 226 224" fill="none" stroke="#173f35" stroke-width="2.5"/>
          <!-- Head, crest and beak -->
          <path data-region="head" aria-label="Parrot head" d="M164 112 C164 72 197 52 229 65 C254 75 266 106 253 135 C242 159 212 169 188 154 C171 144 163 129 164 112 Z"/>
          <path data-region="crest-one" aria-label="Parrot crest feather one" d="M178 75 C154 35 169 23 190 66 Z"/>
          <path data-region="crest-two" aria-label="Parrot crest feather two" d="M192 68 C184 25 209 16 208 66 Z"/>
          <path data-region="crest-three" aria-label="Parrot crest feather three" d="M205 68 C214 31 239 39 219 78 Z"/>
          <path data-region="upper-beak" aria-label="Parrot upper beak" d="M246 111 C285 88 313 104 300 132 C290 154 266 157 245 139 Z"/>
          <path data-region="lower-beak" aria-label="Parrot lower beak" d="M247 137 Q277 151 286 170 Q259 173 243 147 Z"/>
          <path data-region="eye-ring" aria-label="Parrot eye ring" d="M221 94 C235 83 249 96 246 109 C243 124 225 125 217 112 Z"/>
          <circle cx="234" cy="105" r="5.5" fill="#173f35"/><circle cx="236" cy="103" r="2" fill="#fff"/>
        `
      },
      peacock: {
        label: 'PEACOCK',
        svg: `
          <!-- Garden foliage -->
          <path data-region="left-leaf-one" aria-label="Left leaf one" d="M36 219 C7 190 18 160 59 162 C65 186 54 207 36 219 Z"/>
          <path data-region="left-leaf-two" aria-label="Left leaf two" d="M40 290 C6 278 8 245 49 238 C67 259 59 279 40 290 Z"/>
          <path data-region="right-leaf-one" aria-label="Right leaf one" d="M384 219 C413 190 402 160 361 162 C355 186 366 207 384 219 Z"/>
          <path data-region="right-leaf-two" aria-label="Right leaf two" d="M380 290 C414 278 412 245 371 238 C353 259 361 279 380 290 Z"/>
          <path d="M35 314 Q42 258 57 215 M385 314 Q378 258 363 215" fill="none" stroke="#173f35" stroke-width="3"/>
          <path d="M39 200 Q50 190 65 180 M41 276 Q52 266 63 253 M381 200 Q370 190 355 180 M379 276 Q368 266 357 253" fill="none" stroke="#173f35" stroke-width="2"/>
          <!-- Large fan of individual tail feathers -->
          <path data-region="fan-feather-1" aria-label="Peacock tail feather one" d="M198 235 C119 207 58 160 67 104 C111 107 174 160 212 223 Z"/>
          <path data-region="fan-feather-2" aria-label="Peacock tail feather two" d="M199 225 C145 157 117 91 148 47 C185 76 208 153 218 222 Z"/>
          <path data-region="fan-feather-3" aria-label="Peacock tail feather three" d="M211 220 C188 139 190 72 233 40 C261 82 246 159 226 226 Z"/>
          <path data-region="fan-feather-4" aria-label="Peacock tail feather four" d="M220 225 C231 146 270 90 319 91 C324 142 274 199 230 237 Z"/>
          <path data-region="fan-feather-5" aria-label="Peacock tail feather five" d="M227 238 C270 182 326 159 359 183 C345 230 287 258 235 253 Z"/>
          <path data-region="fan-feather-6" aria-label="Peacock tail feather six" d="M230 251 C288 222 346 228 361 266 C328 297 272 287 231 265 Z"/>
          <!-- Feather eyespots, each separately colourable -->
          <ellipse data-region="eyespot-1" aria-label="Tail feather eye one" cx="92" cy="131" rx="15" ry="22"/>
          <ellipse data-region="eyespot-2" aria-label="Tail feather eye two" cx="161" cy="89" rx="15" ry="22"/>
          <ellipse data-region="eyespot-3" aria-label="Tail feather eye three" cx="225" cy="77" rx="15" ry="22"/>
          <ellipse data-region="eyespot-4" aria-label="Tail feather eye four" cx="300" cy="120" rx="15" ry="22"/>
          <ellipse data-region="eyespot-5" aria-label="Tail feather eye five" cx="333" cy="204" rx="15" ry="22"/>
          <ellipse data-region="eyespot-6" aria-label="Tail feather eye six" cx="329" cy="259" rx="15" ry="19"/>
          <ellipse data-region="eyespot-inner-1" aria-label="Inner tail eye one" cx="92" cy="131" rx="6" ry="11"/>
          <ellipse data-region="eyespot-inner-2" aria-label="Inner tail eye two" cx="161" cy="89" rx="6" ry="11"/>
          <ellipse data-region="eyespot-inner-3" aria-label="Inner tail eye three" cx="225" cy="77" rx="6" ry="11"/>
          <ellipse data-region="eyespot-inner-4" aria-label="Inner tail eye four" cx="300" cy="120" rx="6" ry="11"/>
          <ellipse data-region="eyespot-inner-5" aria-label="Inner tail eye five" cx="333" cy="204" rx="6" ry="11"/>
          <ellipse data-region="eyespot-inner-6" aria-label="Inner tail eye six" cx="329" cy="259" rx="6" ry="10"/>
          <!-- Full body and clearly visible legs -->
          <path data-region="body" aria-label="Peacock body" d="M184 255 C173 228 180 203 205 195 C235 186 255 207 254 243 C252 278 233 301 211 300 C190 298 177 279 184 255 Z"/>
          <path data-region="neck" aria-label="Peacock neck" d="M196 210 C177 180 177 147 194 123 C208 103 233 110 240 132 C250 163 233 192 246 211 L230 232 L203 232 Z"/>
          <path data-region="wing" aria-label="Peacock wing" d="M189 245 C195 218 224 213 242 237 C250 254 235 273 214 274 C195 271 185 260 189 245 Z"/>
          <circle data-region="head" aria-label="Peacock head" cx="223" cy="111" r="24"/>
          <path data-region="crest-one" aria-label="Peacock crest one" d="M213 89 Q195 52 190 39 Q211 46 220 88 Z"/>
          <path data-region="crest-two" aria-label="Peacock crest two" d="M222 87 Q221 45 234 30 Q244 56 230 90 Z"/>
          <path data-region="crest-three" aria-label="Peacock crest three" d="M232 91 Q258 58 271 63 Q260 86 239 100 Z"/>
          <path data-region="beak" aria-label="Peacock beak" d="M244 111 L265 119 L245 128 Z"/>
          <circle cx="230" cy="106" r="4.5" fill="#173f35"/>
          <path d="M204 299 L200 345 M231 298 L239 345" fill="none" stroke="#173f35" stroke-width="5" stroke-linecap="round"/>
          <path data-region="left-foot" aria-label="Peacock left foot" d="M200 340 L185 353 L202 350 L211 361 M200 340 L204 358"/>
          <path data-region="right-foot" aria-label="Peacock right foot" d="M239 340 L226 354 L242 350 L252 361 M239 340 L243 358"/>
          <path d="M160 369 H275" fill="none" stroke="#173f35" stroke-width="3"/>
        `
      },
      tiger: {
        label: 'TIGER',
        svg: `
          <!-- Forest leaves around the animal -->
          <path data-region="left-leaf-top" aria-label="Left upper leaf" d="M34 144 C6 111 22 83 66 91 C68 119 52 138 34 144 Z"/>
          <path data-region="left-leaf-bottom" aria-label="Left lower leaf" d="M35 279 C6 257 15 226 57 229 C63 253 52 271 35 279 Z"/>
          <path data-region="right-leaf-top" aria-label="Right upper leaf" d="M385 144 C413 111 397 83 353 91 C351 119 367 138 385 144 Z"/>
          <path data-region="right-leaf-bottom" aria-label="Right lower leaf" d="M384 279 C413 257 404 226 362 229 C356 253 367 271 384 279 Z"/>
          <path d="M33 306 Q43 224 61 142 M387 306 Q377 224 359 142" fill="none" stroke="#173f35" stroke-width="3"/>
          <path d="M38 126 Q52 113 69 103 M36 264 Q49 253 62 240 M382 126 Q368 113 351 103 M384 264 Q371 253 358 240" fill="none" stroke="#173f35" stroke-width="2"/>
          <!-- Curved tail -->
          <path data-region="tail" aria-label="Tiger tail" d="M116 208 C82 217 71 192 83 161 C96 127 80 112 61 126 C45 138 29 121 42 106 C61 83 96 101 106 127 C122 169 96 184 138 184 Z"/>
          <path data-region="tail-tip" aria-label="Tiger tail tip" d="M41 109 Q25 92 36 79 Q49 70 56 88 Q72 73 79 88 Q79 106 56 119 Z"/>
          <!-- Four clear legs, two pairs separated -->
          <path data-region="back-far-leg" aria-label="Back far leg" d="M132 231 C127 258 128 288 127 327 L124 348 Q139 359 157 348 L164 328 L167 245 Z"/>
          <path data-region="back-near-leg" aria-label="Back near leg" d="M169 240 L169 325 L166 350 Q184 363 202 351 L204 323 L204 244 Z"/>
          <path data-region="front-far-leg" aria-label="Front far leg" d="M260 230 L257 326 L253 348 Q270 361 287 349 L292 325 L295 230 Z"/>
          <path data-region="front-near-leg" aria-label="Front near leg" d="M292 224 C302 255 301 291 300 325 L304 350 Q321 361 339 348 L335 319 L332 225 Z"/>
          <path data-region="back-far-paw" aria-label="Back far paw" d="M124 340 Q143 332 160 341 L163 355 Q148 365 126 359 Z"/>
          <path data-region="back-near-paw" aria-label="Back near paw" d="M166 342 Q184 334 202 343 L205 357 Q191 366 168 361 Z"/>
          <path data-region="front-far-paw" aria-label="Front far paw" d="M253 340 Q271 333 290 341 L295 355 Q281 366 256 360 Z"/>
          <path data-region="front-near-paw" aria-label="Front near paw" d="M303 341 Q321 334 339 342 L344 356 Q329 366 306 361 Z"/>
          <!-- Long torso -->
          <path data-region="body" aria-label="Tiger body" d="M103 171 C131 143 177 145 217 152 C264 158 296 184 302 216 C308 251 281 273 236 274 L151 268 C112 260 87 220 103 171 Z"/>
          <!-- Head and ears -->
          <path data-region="left-ear" aria-label="Tiger left ear" d="M279 116 Q268 74 310 82 L324 125 Z"/>
          <path data-region="right-ear" aria-label="Tiger right ear" d="M328 124 L344 82 Q384 75 373 117 L354 137 Z"/>
          <path data-region="left-inner-ear" aria-label="Tiger left inner ear" d="M290 111 Q285 91 307 96 L314 119 Z"/>
          <path data-region="right-inner-ear" aria-label="Tiger right inner ear" d="M344 119 L352 96 Q373 91 366 111 Z"/>
          <path data-region="head" aria-label="Tiger head" d="M280 119 C305 93 352 99 369 132 C388 166 368 202 335 211 C305 220 278 195 274 164 C272 146 274 131 280 119 Z"/>
          <ellipse data-region="muzzle-left" aria-label="Tiger left muzzle" cx="319" cy="184" rx="22" ry="19"/>
          <ellipse data-region="muzzle-right" aria-label="Tiger right muzzle" cx="350" cy="184" rx="22" ry="19"/>
          <path data-region="nose" aria-label="Tiger nose" d="M326 165 Q336 157 346 165 L336 179 Z"/>
          <circle cx="310" cy="145" r="5" fill="#173f35"/><circle cx="356" cy="145" r="5" fill="#173f35"/>
          <!-- Tiger stripes: outline details remain visible after colouring -->
          <path d="M119 174 Q137 186 145 207 M151 153 Q162 176 158 194 M186 153 Q178 178 190 199 M222 158 Q211 184 225 204 M254 173 Q238 196 253 218 M285 132 Q300 143 300 157 M328 111 Q321 130 326 145 M359 119 Q346 137 350 151 M281 182 Q298 192 305 204" fill="none" stroke="#173f35" stroke-width="5" stroke-linecap="round"/>
          <path d="M336 179 Q335 194 324 198 M336 179 Q338 194 350 198" fill="none" stroke="#173f35" stroke-width="3.5"/>
          <path d="M105 365 H352" fill="none" stroke="#173f35" stroke-width="3"/>
        `
      }
    };

    const wheel = $('#animal-colour-wheel');
    const chip = $('#animal-colour-chip');
    const hexLabel = $('#animal-colour-hex');
    const lightnessSlider = $('#animal-colour-lightness');
    const customPicker = $('#animal-custom-colour');
    const status = $('#animal-colour-status');
    const artNote = $('#animal-art-note');
    const undoButton = $('#animal-colour-undo');
    const history = [];
    const savedColours = {};
    let selectedAnimal = 'lion';
    let activeHue = 74;
    let activeSaturation = 72;
    let activeLightness = 65;
    let activeColour = '#d8ed77';

    function hslToHex(h, s, l) {
      s /= 100; l /= 100;
      const k = n => (n + h / 30) % 12;
      const a = s * Math.min(l, 1 - l);
      const f = n => {
        const color = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return Math.round(255 * color).toString(16).padStart(2, '0');
      };
      return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
    }

    function updateActiveColour(hex, fromCustom = false) {
      activeColour = hex.toUpperCase();
      chip.style.background = activeColour;
      hexLabel.textContent = activeColour;
      customPicker.value = activeColour.toLowerCase();
      wheel.style.setProperty('--selected-colour', activeColour);
      if (fromCustom) {
        const rgb = activeColour.match(/[A-Fa-f0-9]{2}/g).map(part => parseInt(part, 16) / 255);
        const max = Math.max(...rgb), min = Math.min(...rgb), delta = max - min;
        let h = 0, s = max === 0 ? 0 : delta / max;
        if (delta) {
          if (max === rgb[0]) h = 60 * (((rgb[1] - rgb[2]) / delta) % 6);
          else if (max === rgb[1]) h = 60 * ((rgb[2] - rgb[0]) / delta + 2);
          else h = 60 * ((rgb[0] - rgb[1]) / delta + 4);
        }
        activeHue = (h + 360) % 360;
        activeSaturation = s * 100;
      }
      if (status) status.textContent = `Selected ${activeColour}. Tap a part of the ${animals[selectedAnimal].label.toLowerCase()} to colour it.`;
    }

    function renderAnimal(name) {
      if (selectedAnimal && colouringSvg.querySelector('[data-region]')) {
        const oldState = {};
        colouringSvg.querySelectorAll('[data-region]').forEach(region => { oldState[region.dataset.region] = region.getAttribute('fill') || '#fffdf4'; });
        savedColours[selectedAnimal] = oldState;
      }
      selectedAnimal = name;
      history.length = 0;
      const item = animals[name];
      colouringSvg.innerHTML = `<g fill="#fffdf4" stroke="#173f35" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round">${item.svg}</g>`;
      colouringSvg.querySelectorAll('[data-region]').forEach(region => {
        region.setAttribute('fill', '#fffdf4');
        region.setAttribute('tabindex', '0');
        region.setAttribute('role', 'button');
        region.setAttribute('aria-label', `Colour ${region.getAttribute('aria-label') || region.dataset.region}`);
        region.style.cursor = 'pointer';
        region.style.transition = 'fill .12s ease';
      });
      if (savedColours[name]) {
        colouringSvg.querySelectorAll('[data-region]').forEach(region => {
          if (savedColours[name][region.dataset.region]) region.setAttribute('fill', savedColours[name][region.dataset.region]);
        });
      }
      $$('.animal-pick').forEach(button => {
        const active = button.dataset.animal === name;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      if (artNote) artNote.textContent = `ANIMAL COLOURING / ${item.label}`;
      if (status) status.textContent = `Colour the ${item.label.toLowerCase()}! Choose a shade from the wheel and tap each section.`;
      if (undoButton) undoButton.disabled = true;
    }

    function colourRegion(region) {
      if (!region || !colouringSvg.contains(region)) return;
      const previous = region.getAttribute('fill') || '#fffdf4';
      history.push({ region, previous, next: activeColour });
      region.setAttribute('fill', activeColour);
      if (status) status.textContent = `${region.getAttribute('aria-label').replace(/^Colour /, '')} coloured ${activeColour}. Keep going!`;
      if (undoButton) undoButton.disabled = false;
      const state = savedColours[selectedAnimal] || (savedColours[selectedAnimal] = {});
      state[region.dataset.region] = activeColour;
    }

    colouringSvg.addEventListener('click', event => colourRegion(event.target.closest('[data-region]')));
    colouringSvg.addEventListener('keydown', event => {
      if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-region]')) {
        event.preventDefault(); colourRegion(event.target);
      }
    });
    $$('.animal-pick').forEach(button => button.addEventListener('click', () => renderAnimal(button.dataset.animal)));

    function selectHueFromPointer(event) {
      const rect = wheel.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      activeHue = (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360;
      updateActiveColour(hslToHex(activeHue, activeSaturation, activeLightness));
    }
    wheel.addEventListener('click', selectHueFromPointer);
    wheel.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowUp') { event.preventDefault(); activeHue = (activeHue + 8) % 360; updateActiveColour(hslToHex(activeHue, activeSaturation, activeLightness)); }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') { event.preventDefault(); activeHue = (activeHue + 352) % 360; updateActiveColour(hslToHex(activeHue, activeSaturation, activeLightness)); }
    });
    lightnessSlider.addEventListener('input', () => {
      activeLightness = Number(lightnessSlider.value);
      updateActiveColour(hslToHex(activeHue, activeSaturation, activeLightness));
    });
    customPicker.addEventListener('input', () => updateActiveColour(customPicker.value, true));

    undoButton.addEventListener('click', () => {
      const last = history.pop();
      if (!last) return;
      last.region.setAttribute('fill', last.previous);
      const state = savedColours[selectedAnimal] || (savedColours[selectedAnimal] = {});
      state[last.region.dataset.region] = last.previous;
      undoButton.disabled = history.length === 0;
      if (status) status.textContent = 'Last colour change undone.';
    });

    $('#animal-colour-reset').addEventListener('click', () => {
      colouringSvg.querySelectorAll('[data-region]').forEach(region => region.setAttribute('fill', '#fffdf4'));
      history.length = 0;
      savedColours[selectedAnimal] = {};
      undoButton.disabled = true;
      if (status) status.textContent = `${animals[selectedAnimal].label} reset. Pick new colours!`;
    });

    $('#animal-colour-save').addEventListener('click', () => {
      const svgCopy = colouringSvg.cloneNode(true);
      svgCopy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svgCopy.setAttribute('width', '1000');
      svgCopy.setAttribute('height', '1000');
      svgCopy.querySelectorAll('[data-region]').forEach(region => { region.removeAttribute('tabindex'); region.removeAttribute('role'); region.removeAttribute('aria-label'); });
      const serializer = new XMLSerializer();
      const svgText = serializer.serializeToString(svgCopy);
      const image = new Image();
      const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1200; canvas.height = 1200;
        const context = canvas.getContext('2d');
        context.fillStyle = '#fffdf4'; context.fillRect(0, 0, 1200, 1200);
        context.drawImage(image, 75, 45, 1050, 1050);
        context.fillStyle = '#173f35'; context.textAlign = 'center';
        context.font = '600 24px Inter, Arial, sans-serif';
        context.fillText(`JAK DESIGNS · ${animals[selectedAnimal].label} COLOURING`, 600, 1165);
        URL.revokeObjectURL(svgUrl);
        downloadCanvas(canvas, `JAK-${selectedAnimal}-colouring.png`);
        if (status) status.textContent = 'Your coloured picture has been downloaded as a PNG.';
      };
      image.onerror = () => {
        URL.revokeObjectURL(svgUrl);
        if (status) status.textContent = 'Could not create the picture file. Please try again.';
      };
      image.src = svgUrl;
    });

    renderAnimal('lion');
    updateActiveColour(activeColour);
  }


  // Reveal selected sections as they enter view
  const revealItems = $$('.service-row, .service, .step, .contact-card');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealItems.forEach(item => item.classList.add('reveal'));
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); currentObserver.unobserve(entry.target); }
      });
    }, { threshold: 0.12 });
    revealItems.forEach(item => observer.observe(item));
  }
})();
