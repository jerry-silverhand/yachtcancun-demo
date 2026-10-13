// Yachtcancun — Demo Marz Studios
// Sin CMS: lee los JSON semilla de /data y los textos de /i18n.

const LANG = location.pathname.startsWith('/en') ? 'en' : 'es';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const getJSON = (url) => fetch(url).then((r) => r.json());
const store = {
  get(area, k) { try { return window[area].getItem(k); } catch { return null; } },
  set(area, k, v) { try { window[area].setItem(k, v); } catch { /* sin almacenamiento */ } },
};

const TIPOS = [
  { key: 'motor', i18n: 'type_motor', url: '/yates/motor' },
  { key: 'velero', i18n: 'type_velero', url: '/yates/veleros' },
  { key: 'catamaran_vela', i18n: 'type_catamaran_vela', url: '/catamaranes/vela' },
  { key: 'catamaran_motor', i18n: 'type_catamaran_motor', url: '/catamaranes/motor' },
  { key: 'electrico_hibrido', i18n: 'type_electrico', url: '/yates/electricos' },
  { key: 'suite_flotante', i18n: 'type_suite', url: '/suites/flotantes' },
  { key: 'anfibio', i18n: 'type_anfibio', url: '/yates/anfibios' },
];

const ICONS = {
  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.7 15.1V8.9l5.8 3.1-5.8 3.1Z"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.5 1.6-1.5h1.7V4.4a22 22 0 0 0-2.5-.1c-2.4 0-4.1 1.5-4.1 4.2v2.3H7.5V14h2.7v8h3.3Z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.4 2H3.6A1.6 1.6 0 0 0 2 3.6v16.8A1.6 1.6 0 0 0 3.6 22h16.8a1.6 1.6 0 0 0 1.6-1.6V3.6A1.6 1.6 0 0 0 20.4 2ZM8 19H5V9.5h3V19ZM6.5 8.2a1.7 1.7 0 1 1 0-3.5 1.7 1.7 0 0 1 0 3.5ZM19 19h-3v-4.6c0-1.1 0-2.5-1.5-2.5S12.8 13 12.8 14.3V19h-3V9.5h2.8v1.3h.1a3.1 3.1 0 0 1 2.8-1.5c3 0 3.5 2 3.5 4.5V19Z"/></svg>',
};

let T = {};
const t = (k) => T[k] ?? k;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// ---------- Formato (reglas de visualización, sección 4.1) ----------
const SYMBOL = { USD: '$', EUR: '€', MXN: '$' };
const num = (n) => new Intl.NumberFormat('en-US').format(n);
const money = (v, cur) => `${SYMBOL[cur] || ''} ${num(v)} ${cur}`;
function priceHTML(y) {
  if (!y.precio || y.precio <= 0) return `<span class="price"><b>${t('price_ask')}</b></span>`;
  const was = y.en_oferta && y.precio_original ? `<s>${money(y.precio_original, y.moneda)}</s>` : '';
  return `<span class="price">${was}<b>${money(y.precio, y.moneda)}</b></span>`;
}
const length = (ft) => (ft ? `${ft} ft · ${(ft * 0.3048).toFixed(1)} m` : '');
function badges(y) {
  const b = [];
  if (y.en_oferta) b.push('oferta');
  if (y.condicion === 'nuevo') b.push('nuevo');
  if (y.estado === 'proximamente') b.push('proximamente');
  if (y.estado === 'vendido') b.push('vendido');
  if (y.modalidad === 'fraccional') b.push('fraccional');
  return b.length ? `<span class="badges">${b.map((k) => `<span class="badge badge--${k}">${t('badge_' + k)}</span>`).join('')}</span>` : '';
}
const yachtURL = (y) => `/yate/${y.id}/${encodeURIComponent(y.slug).replace(/%28/g, '(').replace(/%29/g, ')')}`;
const place = (y) => [y.ubicacion_detalle, y.ubicacion_pais].filter(Boolean).join(', ');
const pad = (i) => String(i + 1).padStart(2, '0');

// ---------- i18n ----------
function applyI18n(root = document) {
  document.documentElement.lang = LANG;
  $$('[data-i18n]', root).forEach((el) => { el.textContent = t(el.dataset.i18n); });
  $$('[data-i18n-attr]', root).forEach((el) => {
    const [attr, key] = el.dataset.i18nAttr.split(':');
    el.setAttribute(attr, t(key));
  });
  $$('.lang__opt').forEach((a) => a.classList.toggle('is-active', a.dataset.lang === LANG));
  // El cambio de idioma conserva la página equivalente (/ruta <-> /en/ruta)
  const base = location.pathname.replace(/^\/en(?=\/|$)/, '') || '/';
  const hrefFor = (lang) => (lang === 'en' ? '/en' + (base === '/' ? '/' : base) : base) + location.hash;
  $$('.lang__opt').forEach((a) => { a.href = hrefFor(a.dataset.lang); });
  $$('[data-lang-switch]').forEach((a) => { a.href = hrefFor(LANG === 'en' ? 'es' : 'en'); });
}
// En /en/ todas las rutas internas viven bajo /en (estructura i18n preparada)
function localizeLinks() {
  if (LANG !== 'en') return;
  $$('a[href^="/"]').forEach((a) => {
    const h = a.getAttribute('href');
    if (a.dataset.lang || a.hasAttribute('data-lang-switch') || h.startsWith('/assets') || h.startsWith('/en')) return;
    a.setAttribute('href', '/en' + h);
  });
  const form = $('.qs__form');
  if (form) form.action = '/en/yates';
}

// ---------- Renderers ----------
function render(data) {
  const { listings, marcas, brokers, eventos, sitio, modelos } = data;
  const slot = (name) => $$(`[data-render="${name}"]`);
  const brokerById = Object.fromEntries(brokers.map((b) => [b.id, b]));
  const marcasMenu = marcas.filter((m) => m.visible_en_menu).sort((a, b) => a.orden - b.orden);

  // Redes
  slot('social').forEach((el) => {
    el.innerHTML = Object.entries(sitio.redes).map(([k, url]) =>
      `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="${k}">${ICONS[k]}</a>`).join('');
  });

  // Menú
  // Buscador rápido
  slot('qs-types').forEach((el) => {
    el.innerHTML = `<option value="">${t('qs_any')}</option>` + TIPOS.map((x) => `<option value="${x.key}">${t(x.i18n)}</option>`).join('');
  });

  // Destacados
  const feat = listings.filter((y) => y.destacado && y.estado !== 'vendido').slice(0, 6);
  slot('feat-media').forEach((el) => {
    el.innerHTML = feat.map((y, i) => `
      <figure data-i="${i}" class="${i === 0 ? 'is-active' : ''}">
        <img src="${y.imagen}" alt="${esc(y.titulo)}" ${i ? 'loading="lazy"' : ''}>
        <figcaption>${pad(i)} / ${pad(feat.length - 1)} — ${esc(place(y))}</figcaption>
      </figure>`).join('');
  });
  slot('feat-list').forEach((el) => {
    el.innerHTML = feat.map((y, i) => `
      <li class="yrow" data-i="${i}">
        <a href="${yachtURL(y)}">
          <span class="yrow__thumb"><img src="${y.imagen}" alt="" loading="lazy"></span>
          <span class="yrow__num">${pad(i)}</span>
          <span class="yrow__name">${esc(y.titulo)}${y.anio ? `<small>${y.anio}</small>` : ''}</span>
          <span class="yrow__price">${priceHTML(y)}</span>
          ${place(y) ? `<span class="yrow__meta yrow__loc">${esc(place(y))}</span>` : ''}
          ${y.eslora_ft ? `<span class="yrow__meta yrow__dims">${esc(length(y.eslora_ft))}${badges(y)}</span>` : ''}
        </a>
      </li>`).join('');
  });

  // Marcas
  slot('brands-bg').forEach((el) => {
    el.innerHTML = marcasMenu.map((m) => `<img src="${m.imagen_portada}" alt="" data-id="${m.id}" loading="lazy">`).join('');
  });
  slot('brands-list').forEach((el) => {
    el.innerHTML = marcasMenu.map((m, i) => `
      <li data-reveal style="--rd:${i * 70}ms">
        <a href="/marca/${m.id}/${m.slug}" data-id="${m.id}">
          <span class="brand__num">${pad(i)}</span>
          <span class="brand__name">${esc(m.nombre)}</span>
          <img class="brand__logo" src="${m.logo}" alt="" loading="lazy">
          <span class="brand__go">${t('brands_view')} →</span>
        </a>
      </li>`).join('');
  });

  // Promociones
  const promos = listings.filter((y) => y.en_oferta && y.estado !== 'vendido').slice(0, 8);
  slot('promo-rail').forEach((el) => {
    el.innerHTML = promos.map((y) => `
      <li>
        <a class="card" href="${yachtURL(y)}" draggable="false">
          <span class="card__img"><img src="${y.imagen}" alt="${esc(y.titulo)}" loading="lazy" draggable="false">${badges(y)}</span>
          <span class="card__name">${esc(y.titulo)}${y.anio ? `<small>${y.anio}</small>` : ''}</span>
          <span class="card__row">${priceHTML(y)}<span class="card__meta">${esc([y.eslora_ft ? y.eslora_ft + ' ft' : '', y.ubicacion_pais].filter(Boolean).join(' · '))}</span></span>
        </a>
      </li>`).join('');
  });

  // Credenciales
  slot('metrics').forEach((el) => {
    el.innerHTML = sitio.metricas.map((m, i) => `
      <li data-reveal style="--rd:${i * 90}ms">
        <span class="cred__val">${esc(m.valor)}${m.clave === 'metric_range' ? '<small>ft</small>' : ''}</span>
        <span class="cred__lbl">${t(m.clave)}</span>
      </li>`).join('');
  });

  // Vender mi barco: métricas de alcance (editables en data/sitio.json)
  slot('sell-metrics').forEach((el) => {
    el.innerHTML = (sitio.metricas_venta || []).map((m, i) => `
      <li data-reveal style="--rd:${(i % 3) * 90}ms">
        <span class="cred__val">${esc(m.valor)}</span>
        <span class="cred__lbl">${t(m.clave)}</span>
      </li>`).join('');
  });
  // Tipos de embarcación para formularios
  slot('type-options').forEach((el) => {
    el.innerHTML = `<option value="">${t('f_choose')}</option>` + TIPOS.map((x) => `<option value="${x.key}">${t(x.i18n)}</option>`).join('');
  });
  // Vendidos recientemente (estado = vendido)
  slot('sold-rail').forEach((el) => {
    el.innerHTML = listings.filter((y) => y.estado === 'vendido').map((y) => `
      <li>
        <a class="card" href="${yachtURL(y)}" draggable="false">
          <span class="card__img"><img src="${y.imagen}" alt="${esc(y.titulo)}" loading="lazy" draggable="false">${badges(y)}</span>
          <span class="card__name">${esc(y.titulo)}${y.anio ? `<small>${y.anio}</small>` : ''}</span>
          <span class="card__meta">${esc([y.eslora_ft ? y.eslora_ft + ' ft' : '', y.ubicacion_pais].filter(Boolean).join(' · '))}</span>
        </a>
      </li>`).join('');
  });

  // Comprar / nuevos: tarjetas de marca
  slot('brand-cards').forEach((el) => {
    el.innerHTML = marcasMenu.map((m, i) => {
      const n = modelos.filter((x) => x.marca === m.id).length;
      return `
      <li data-reveal style="--rd:${(i % 3) * 90}ms">
        <a class="bcard" href="/marca/${m.id}/${m.slug}">
          <span class="bcard__img"><img src="${m.imagen_portada}" alt="" loading="lazy"><img class="bcard__logo" src="${m.logo}" alt="${esc(m.nombre)}" loading="lazy"></span>
          <span class="bcard__row"><span class="bcard__name">${esc(m.nombre)}</span>${n ? `<span class="bcard__count">${n} ${t('buy_models')}</span>` : ''}</span>
          <span class="bcard__desc">${esc(m.descripcion?.[LANG] || '')}</span>
          <span class="bcard__go">${t('buy_view_brand')} →</span>
        </a>
      </li>`;
    }).join('');
  });

  // Página de marca: /marca/{id}/{slug}
  const brandId = +(location.pathname.match(/\/marca\/(\d+)/) || [])[1];
  const marca = marcas.find((m) => m.id === brandId);
  if (marca && $('[data-page="marca"]')) {
    const mods = modelos.filter((x) => x.marca === marca.id);
    document.title = `${marca.nombre} — Yachtcancun`;
    const set = (k, fn) => $$(`[data-brand="${k}"]`).forEach(fn);
    set('hero', (img) => { img.src = marca.imagen_hero || marca.imagen_portada; });
    set('logo', (img) => { img.src = marca.logo; img.alt = marca.nombre; });
    set('lema', (el) => { el.textContent = marca.lema?.[LANG] || marca.nombre; });
    set('descripcion', (el) => { el.textContent = marca.descripcion?.[LANG] || ''; });
    set('id', (el) => { el.value = marca.id; });
    slot('brand-lines').forEach((el) => {
      const lineas = (marca.lineas || []).slice().sort((a, b) => a.orden - b.orden);
      el.innerHTML = lineas.length ? lineas.map((l, i) => {
        const ms = mods.filter((x) => x.linea === l.slug);
        return `
        <div class="bline">
          <header class="bline__head" data-reveal>
            <span class="bline__num">${pad(i)}</span>
            <h3 class="bline__name">${esc(l.nombre)}</h3>
            <p class="bline__sub">${esc(l.subtitulo?.[LANG] || '')}</p>
          </header>
          <ul class="bline__grid">${ms.map((x, j) => `
            <li data-reveal style="--rd:${j * 90}ms">
              <a class="card" href="${yachtURL(x)}">
                <span class="card__img"><img src="${x.imagen}" alt="${esc(x.nombre)}" loading="lazy"></span>
                <span class="card__row"><span class="card__name">${esc(x.nombre)}</span><span class="card__meta">${t('brand_view_model')} →</span></span>
              </a>
            </li>`).join('')}
          </ul>
        </div>`;
      }).join('') : `<p class="section-text">${t('brand_coming')}</p>`;
    });
    slot('model-options').forEach((el) => {
      el.innerHTML = `<option value="">${t('f_choose')}</option>` + mods.map((x) => `<option value="${x.id}">${esc(x.nombre)}</option>`).join('');
      if (!mods.length) el.closest('.field').hidden = true;
    });
    const vid = (marca.video_url || '').match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
    slot('brand-video').forEach((el) => {
      if (!vid) return;
      el.hidden = false;
      el.innerHTML = `
        <p class="eyebrow">${t('brand_video')}</p>
        <button type="button" class="bvideo__frame" data-yt-lite="${vid[1]}" aria-label="${t('brand_play')}">
          <img src="${mods[0]?.imagen || marca.imagen_portada}" alt="" loading="lazy">
          <span class="bvideo__play" aria-hidden="true">▶</span>
        </button>`;
    });
    const units = listings.filter((y) => y.marca === marca.id && y.estado !== 'vendido');
    slot('brand-units-section').forEach((el) => { el.hidden = !units.length; });
    slot('brand-units').forEach((el) => {
      el.innerHTML = units.map((y) => `
        <li>
          <a class="card" href="${yachtURL(y)}" draggable="false">
            <span class="card__img"><img src="${y.imagen}" alt="${esc(y.titulo)}" loading="lazy" draggable="false">${badges(y)}</span>
            <span class="card__name">${esc(y.titulo)}${y.anio ? `<small>${y.anio}</small>` : ''}</span>
            <span class="card__row">${priceHTML(y)}<span class="card__meta">${esc([y.eslora_ft ? y.eslora_ft + ' ft' : '', y.ubicacion_pais].filter(Boolean).join(' · '))}</span></span>
          </a>
        </li>`).join('');
    });
    const b = brokerById[marca.broker_embajador];
    slot('brand-broker').forEach((el) => {
      if (!b) { el.remove(); return; }
      el.innerHTML = `
        <img src="${b.foto}" alt="${esc(b.nombre)}" loading="lazy">
        <div>
          <p class="bbroker__k">${t('brand_ambassador')}</p>
          <p class="bbroker__name">${esc(b.nombre)}</p>
          <p class="bbroker__role">${esc(b.rol)}</p>
          <p class="bbroker__links"><a href="#" data-wa="general">WhatsApp</a> · <a href="mailto:${esc(sitio.email_demo)}">${t('f_email')}</a></p>
        </div>`;
    });
  }

  // Equipo (solo brokers vendedores)
  slot('team').forEach((el) => {
    el.innerHTML = brokers.filter((b) => b.es_vendedor).sort((a, b) => a.orden - b.orden).slice(0, 5).map((b, i) => `
      <li data-reveal style="--rd:${i * 80}ms">
        <a class="tcard" href="/broker/${b.id}/${encodeURIComponent(b.slug)}">
          <span class="tcard__img"><img src="${b.foto}" alt="${esc(b.nombre)}" loading="lazy"></span>
          <span class="tcard__name">${esc(b.nombre)}</span>
          <span class="tcard__role">${esc(b.rol)}</span>
        </a>
      </li>`).join('');
  });

  // Evento activo (badge + sección + pop-up una vez por sesión)
  const ev = eventos.find((e) => e.activo);
  if (ev) {
    const fmt = (d) => new Date(d + 'T12:00:00').toLocaleDateString(LANG === 'en' ? 'en-US' : 'es-MX', { day: 'numeric', month: 'long' });
    const when = `${fmt(ev.fechas.inicio)} – ${fmt(ev.fechas.fin)} ${ev.fechas.fin.slice(0, 4)} · ${ev.lugar}`;
    const url = `/eventos/${ev.slug}`;
    slot('event').forEach((sec) => {
      sec.hidden = false;
      sec.innerHTML = `
      <div class="event__img" data-reveal><img src="${ev.banner}" alt="${esc(ev.nombre)}" loading="lazy"></div>
      <div class="event__body" data-reveal style="--rd:120ms">
        <p class="eyebrow">${t('event_eyebrow')}</p>
        <h2 class="event__title">${esc(ev.nombre)}</h2>
        <p class="event__when">${esc(when)}</p>
        <p>${t('event_text')}</p>
        <a class="btn" href="${url}"><span>${t('event_cta')}</span></a>
      </div>`;
    });
    if (!store.get('sessionStorage', 'yc_event_seen')) {
      const pop = slot('event-pop')[0];
      pop.innerHTML = `
        <div class="event-pop__box" role="dialog" aria-modal="true" aria-label="${esc(ev.nombre)}">
          <button class="event-pop__close" type="button" aria-label="${t('event_popup_close')}">×</button>
          <img src="${ev.banner}" alt="">
          <div class="event-pop__body">
            <p class="event__when">${esc(when)}</p>
            <p style="color:var(--paper-80)">${t('event_text')}</p>
            <a class="btn btn--solid" href="${url}"><span>${t('event_cta')}</span></a>
          </div>
        </div>`;
      const close = () => { pop.hidden = true; store.set('sessionStorage', 'yc_event_seen', '1'); };
      pop.addEventListener('click', (e) => { if (e.target === pop || e.target.closest('.event-pop__close')) close(); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pop.hidden) close(); });
      setTimeout(() => { if (!document.body.classList.contains('menu-open')) pop.hidden = false; }, 9000);
    }
  }

  // Contacto
  const tel = (n) => n.replace(/[^\d+]/g, '');
  slot('cx-cards').forEach((el) => {
    el.innerHTML = `
      <li data-reveal>
        <h3 class="cx-card__k">${t('cx_c_phone')}</h3>
        <p class="cx-card__t"><a href="tel:${tel(sitio.telefono_mx)}">${esc(sitio.telefono_mx)}</a></p>
        <p class="cx-card__p">${t('cx_c_phone_sub')} <a href="tel:${tel(sitio.telefono_usa)}">${esc(sitio.telefono_usa)}</a></p>
      </li>
      <li data-reveal style="--rd:80ms">
        <h3 class="cx-card__k">${t('cx_c_email')}</h3>
        <p class="cx-card__t"><a href="mailto:${esc(sitio.email_demo)}">${t('cx_c_email_t')}</a></p>
        <p class="cx-card__p">${t('cx_c_email_p')}</p>
      </li>
      <li data-reveal style="--rd:160ms">
        <h3 class="cx-card__k">${t('cx_c_wa')}</h3>
        <p class="cx-card__t"><a href="#" data-wa="general">${t('cx_c_wa_t')}</a></p>
        <p class="cx-card__p">${t('cx_c_wa_p')}</p>
      </li>
      <li data-reveal style="--rd:240ms">
        <h3 class="cx-card__k">${t('cx_c_visit')}</h3>
        <p class="cx-card__t">${t('cx_c_visit_t')}</p>
        <p class="cx-card__p">${t('cx_c_visit_p')}</p>
        <ul class="cx-card__links">
          <li><a href="${esc(sitio.maps_url)}" target="_blank" rel="noopener">${t('cx_c_maps')}</a></li>
          <li><a href="#cx-form">${t('cx_c_book')}</a></li>
        </ul>
      </li>`;
  });
  // Cinta infinita de logos (se duplica la lista para el bucle)
  slot('cx-marquee').forEach((el) => {
    const logos = [...marcasMenu.map((m) => ({ src: m.logo, alt: m.nombre })), { src: '/assets/img/brand/iyba.png', alt: 'IYBA' }];
    const ul = (hidden) => `<ul${hidden ? ' aria-hidden="true"' : ''}>${logos.concat(logos).map((l) => `<li><img src="${l.src}" alt="${hidden ? '' : esc(l.alt)}" loading="lazy"></li>`).join('')}</ul>`;
    el.innerHTML = ul(false) + ul(true);
  });
  slot('map').forEach((el) => { el.src = sitio.maps_embed; });
  slot('foot-types').forEach((el) => {
    el.innerHTML = TIPOS.map((x) => `<li><a href="${x.url}">${t(x.i18n)}</a></li>`).join('');
  });
  slot('foot-brands').forEach((el) => {
    el.innerHTML = marcasMenu.map((m) => `<li><a href="/marca/${m.id}/${m.slug}">${esc(m.nombre)}</a></li>`).join('');
  });
  slot('foot-event').forEach((el) => {
    if (ev) el.innerHTML = `<a href="/eventos/${ev.slug}">${esc(ev.nombre_corto)}</a>`;
    else el.remove();
  });
  slot('foot-contact').forEach((el) => {
    el.innerHTML = `
      <dl>
        <dt>${t('sf_mx')}</dt><dd><a href="tel:${tel(sitio.telefono_mx)}">${esc(sitio.telefono_mx)}</a></dd>
        <dt>${t('sf_usa')}</dt><dd><a href="tel:${tel(sitio.telefono_usa)}">${esc(sitio.telefono_usa)}</a></dd>
        <dt>${t('sf_wa')}</dt><dd><a href="#" data-wa="general">${t('sf_wa_t')}</a></dd>
        <dt>${t('sf_visit')}</dt><dd class="sf-addr"><a href="${esc(sitio.maps_url)}" target="_blank" rel="noopener">${esc(sitio.direccion)}</a></dd>
      </dl>`;
  });

  // WhatsApp: comportamiento real, pero a número de demo (requerimiento 0.5)
  $$('[data-wa]').forEach((a) => {
    a.href = `https://wa.me/${sitio.whatsapp_demo}?text=${encodeURIComponent(t('wa_msg_general'))}`;
    a.target = '_blank';
    a.rel = 'noopener';
  });
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
}

// ---------- Menú hamburguesa ----------
// Letras que "ruedan" al pasar el cursor (técnica de la referencia: cada letra
// lleva una copia en text-shadow arriba y se desplaza hacia abajo con desfase).
function splitRoll(root = document) {
  $$('[data-roll]', root).forEach((el) => {
    if (el.dataset.rolled) return;
    const txt = el.textContent;
    el.dataset.rolled = '1';
    el.setAttribute('aria-label', txt);
    el.innerHTML = [...txt].map((c, i) => `<span aria-hidden="true" style="--i:${i}">${c === ' ' ? '&nbsp;' : esc(c)}</span>`).join('');
  });
}

// CTAs: letras + borde con destello giratorio (<i>), que corre solo en pantalla
function initButtons() {
  $$('.btn').forEach((btn) => {
    const label = btn.querySelector(':scope > span');
    if (!label || btn.querySelector(':scope > i')) return;
    label.setAttribute('data-roll', '');
    btn.insertAdjacentHTML('beforeend', '<i aria-hidden="true"></i>');
  });
  splitRoll();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.target.style.setProperty('--play-state', e.isIntersecting ? 'running' : 'paused'));
  });
  $$('.btn').forEach((b) => io.observe(b));
}

function initMenu() {
  const body = document.body;
  const burger = $('.burger');
  const menu = $('#site-menu');
  const label = $('.burger__label');
  const shape = $('.menu__shape svg', menu);

  const open = (state) => {
    body.classList.toggle('menu-open', state);
    burger.setAttribute('aria-expanded', state);
    menu.setAttribute('aria-hidden', !state);
    menu.inert = !state;
    label.textContent = t(state ? 'nav_close' : 'nav_menu');
    if (state) setTimeout(() => $('.menu__big', menu)?.focus({ preventScroll: true }), 350);
    else burger.focus({ preventScroll: true });
  };
  menu.inert = true;
  burger.addEventListener('click', () => open(!body.classList.contains('menu-open')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && body.classList.contains('menu-open')) open(false); });

  // Parallax suave de la figura de fondo con el cursor
  if (shape && matchMedia('(hover: hover)').matches) {
    menu.addEventListener('pointermove', (e) => {
      const x = (e.clientX / innerWidth - 0.5) * -40;
      const y = (e.clientY / innerHeight - 0.5) * -40;
      shape.style.transform = `translate(${x}px, ${y}px)`;
    });
  }
}

// ---------- Video de YouTube de fondo (slide "Comprar nuevo") ----------
// Sin audio, sin controles, en bucle. Se muestra solo cuando ya está
// reproduciendo, para que nunca se vea la interfaz de YouTube.
const heroVideo = {
  player: null, ready: false, wanted: true, wrap: null,
  init() {
    const el = $('[data-yt]');
    if (!el) return;
    const id = el.dataset.yt;
    this.wrap = el.closest('.yt-bg');
    window.onYouTubeIframeAPIReady = () => {
      this.player = new YT.Player(el, {
        host: 'https://www.youtube-nocookie.com',
        videoId: id,
        playerVars: { autoplay: 1, mute: 1, controls: 0, loop: 1, playlist: id, playsinline: 1, rel: 0, modestbranding: 1, disablekb: 1, fs: 0, iv_load_policy: 3, cc_load_policy: 0 },
        events: {
          onReady: (e) => { this.ready = true; e.target.mute(); e.target.setPlaybackQuality?.('hd1080'); if (this.wanted) e.target.playVideo(); },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) {
              // Se espera a que YouTube oculte su capa de controles antes de mostrar el video
              clearTimeout(this.t);
              this.t = setTimeout(() => this.wrap.classList.add('is-playing'), 3000);
            }
            if (e.data === YT.PlayerState.ENDED) e.target.seekTo(0);
          },
        },
      });
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  },
  // Solo se pausa cuando el hero sale de pantalla; al cambiar de slide sigue corriendo
  toggle(on) {
    if (this.wanted === on) return;
    this.wanted = on;
    if (!this.ready) return;
    if (on) this.player.playVideo();
    else { clearTimeout(this.t); this.wrap.classList.remove('is-playing'); this.player.pauseVideo(); }
  },
};

// ---------- Hero ----------
function initHero() {
  const hero = $('#hero');
  if (!hero) return;
  heroVideo.init();
  const slides = $$('.hero__slide', hero);
  const tabs = $$('.hero__tabs button', hero);
  const DURATION = 7000;
  hero.style.setProperty('--slide-ms', DURATION + 'ms');
  let cur = 0;
  let timer;
  const go = (n) => {
    if (n === cur) return;
    const prev = slides[cur];
    prev.classList.add('is-leaving');
    prev.classList.remove('is-active');
    setTimeout(() => prev.classList.remove('is-leaving'), 1250);
    cur = (n + slides.length) % slides.length;
    slides[cur].classList.add('is-active');
    tabs.forEach((b, i) => {
      b.classList.toggle('is-active', i === cur);
      b.classList.toggle('is-done', i < cur);
      b.setAttribute('aria-selected', i === cur);
      const bar = $('.hero__bar i', b); bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '';
    });
    schedule();
  };
  const schedule = () => { clearTimeout(timer); timer = setTimeout(() => go(cur + 1), DURATION); };
  tabs.forEach((b) => b.addEventListener('click', () => go(+b.dataset.go)));
  // Swipe en móvil
  let x0 = null;
  hero.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  hero.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1));
    x0 = null;
  });
  // Pausa fuera de pantalla
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { hero.classList.remove('is-paused'); schedule(); heroVideo.toggle(true); } else { hero.classList.add('is-paused'); clearTimeout(timer); heroVideo.toggle(false); }
  }).observe(hero);
}

// ---------- Manifiesto: líneas que se "llenan" con el scroll ----------
function initIntroLines() {
  const el = $('[data-lines]');
  if (!el) return;
  const build = () => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w) => `<span class="w">${esc(w)} </span>`).join('');
    const lines = [];
    let top = null;
    $$('.w', el).forEach((w) => {
      if (w.offsetTop !== top) { lines.push([]); top = w.offsetTop; }
      lines[lines.length - 1].push(w.textContent);
    });
    el.innerHTML = lines.map((l) => `<span class="line">${esc(l.join(''))}</span>`).join('');
    el.setAttribute('aria-label', words.join(' '));
  };
  build();
  document.fonts?.ready.then(() => { el.textContent = el.getAttribute('aria-label'); build(); tick(); });
  let w = innerWidth;
  addEventListener('resize', () => { if (innerWidth !== w) { w = innerWidth; el.textContent = el.getAttribute('aria-label'); build(); } });
  const tick = () => {
    const r = el.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35)));
    const ls = $$('.line', el);
    ls.forEach((l, i) => {
      const lp = Math.min(1, Math.max(0, p * ls.length - i));
      l.style.backgroundPosition = `${100 - lp * 100}% 0`;
    });
  };
  addEventListener('scroll', tick, { passive: true });
  tick();
}

// ---------- Destacados: imagen sticky sincronizada con la lista ----------
function initFeatured() {
  const figs = $$('.feat__media figure');
  const rows = $$('.yrow');
  if (!figs.length) return;
  let active = 0;
  const set = (i) => {
    if (i === active) return;
    figs.forEach((f, j) => { f.classList.toggle('was-active', j === active); f.classList.toggle('is-active', j === i); });
    rows.forEach((r, j) => r.classList.toggle('is-active', j === i));
    active = i;
  };
  rows[0]?.classList.add('is-active');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) set(+e.target.dataset.i); });
  }, { rootMargin: '-45% 0px -45% 0px' });
  rows.forEach((r) => { io.observe(r); r.addEventListener('mouseenter', () => set(+r.dataset.i)); });
}

// ---------- Marcas: fondo por hover ----------
function initBrands() {
  const bgs = $$('.brands__bg img');
  $$('.brands__list a').forEach((a) => {
    a.addEventListener('mouseenter', () => bgs.forEach((b) => b.classList.toggle('is-active', b.dataset.id === a.dataset.id)));
  });
  $('.brands__list')?.addEventListener('mouseleave', () => bgs.forEach((b) => b.classList.remove('is-active')));
}

// ---------- Carril de promociones ----------
function initRail() {
  $$('.rail').forEach((rail) => {
    const sec = rail.closest('section');
    $$('[data-rail]', sec).forEach((b) => b.addEventListener('click', () => {
      const card = rail.firstElementChild;
      rail.scrollBy({ left: (+b.dataset.rail) * (card ? card.offsetWidth + 20 : 400), behavior: 'smooth' });
    }));
    let down = false; let x = 0; let sl = 0; let moved = false;
    rail.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; moved = false; x = e.clientX; sl = rail.scrollLeft; });
    addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - x;
      if (Math.abs(dx) > 5) { moved = true; rail.classList.add('is-drag'); }
      rail.scrollLeft = sl - dx;
    });
    addEventListener('pointerup', () => { down = false; rail.classList.remove('is-drag'); });
    rail.addEventListener('click', (e) => { if (moved) { e.preventDefault(); moved = false; } }, true);
  });
}

// ---------- Buscador (/yates, /yates/usados, /promociones, categorías) ----------
// Filtros combinables reflejados en la URL (requerimiento 7.2). Los vendidos se
// excluyen por defecto. Los precios se comparan en USD con tipos de cambio de demo.
function initSearch({ listings, marcas, sitio }) {
  const page = $('[data-page="buscador"]');
  if (!page) return;
  const form = $('#filters');
  const PAGE = 24;
  const rates = sitio.tipos_cambio_demo || { USD: 1 };
  const base = location.pathname.replace(/^\/en(?=\/|$)/, '').replace(/\/$/, '') || '/';
  const cat = TIPOS.find((x) => x.url === base);
  const variant = base === '/yates/usados' ? 'used' : base === '/promociones' ? 'promo' : cat ? 'cat' : 'all';
  const preset = { condicion: variant === 'used' ? 'usado' : '', tipo: cat ? [cat.key] : [], oferta: variant === 'promo' };
  const brandName = (y) => (typeof y.marca === 'number' ? marcas.find((m) => m.id === y.marca)?.nombre : y.marca) || '';
  const toUSD = (v, cur) => v * (rates[cur] || 1);
  let shown = PAGE;

  // Encabezado de la variante
  const head = {
    title: cat ? t(cat.i18n) : t(`s_v_${variant}_title`),
    intro: t(`s_v_${variant}_intro`),
  };
  Object.entries(head).forEach(([k, v]) => $$(`[data-search="${k}"]`).forEach((el) => { el.textContent = v; }));
  document.title = `${head.title} — Yachtcancun`;

  // Opciones de filtros a partir del inventario
  const chip = (type, name, value, label) => `<label class="chip"><input type="${type}" name="${name}" value="${esc(value)}"><span>${esc(label)}</span></label>`;
  $('[data-render="f-condicion"]').innerHTML = [['', t('s_cond_all')], ['nuevo', t('s_cond_new')], ['usado', t('s_cond_used')]].map(([v, l]) => chip('radio', 'condicion', v, l)).join('');
  $('[data-render="f-tipo"]').innerHTML = TIPOS.map((x) => chip('checkbox', 'tipo', x.key, t(x.i18n))).join('');
  const brands = [...new Set(listings.map(brandName).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  $('[data-render="f-marca"]').innerHTML = brands.map((b) => chip('checkbox', 'marca', b, b)).join('');
  const paises = [...new Set(listings.map((y) => y.ubicacion_pais).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  $('[data-render="f-pais"]').innerHTML = `<option value="">${t('qs_any')}</option>` + paises.map((p) => `<option value="${esc(p)}">${esc(p)}</option>`).join('');

  // Estado inicial: preset de la variante + parámetros de la URL (incluye los del buscador rápido del home)
  const q = new URLSearchParams(location.search);
  const range = (v) => (v || '').split('-');
  const state = {
    condicion: q.get('condicion') ?? preset.condicion,
    tipo: q.get('tipo') ? q.get('tipo').split(',') : preset.tipo,
    marca: q.get('marca') ? q.get('marca').split(',') : [],
    unidad: q.get('unidad') || 'ft',
    eslora_min: q.get('eslora_min') || range(q.get('eslora'))[0] || '',
    eslora_max: q.get('eslora_max') || range(q.get('eslora'))[1] || '',
    moneda: q.get('moneda') || 'USD',
    precio_min: q.get('precio_min') || range(q.get('precio'))[0] || '',
    precio_max: q.get('precio_max') || range(q.get('precio'))[1] || '',
    anio_min: q.get('anio_min') || '', anio_max: q.get('anio_max') || '',
    pais: q.get('pais') || '', modalidad: q.get('modalidad') || '',
    oferta: q.has('oferta') ? q.get('oferta') === '1' : preset.oferta,
    vendidos: q.get('vendidos') === '1',
    orden: q.get('orden') || 'recientes',
  };
  if (state.eslora_min === '0') state.eslora_min = '';
  if (state.precio_min === '0') state.precio_min = '';
  const write = (st) => {
    $$('[name=condicion]', form).forEach((r) => { r.checked = r.value === st.condicion; });
    $$('[name=tipo]', form).forEach((c) => { c.checked = st.tipo.includes(c.value); });
    $$('[name=marca]', form).forEach((c) => { c.checked = st.marca.includes(c.value); });
    $$('[name=unidad]', form).forEach((r) => { r.checked = r.value === st.unidad; });
    ['eslora_min', 'eslora_max', 'precio_min', 'precio_max', 'anio_min', 'anio_max', 'pais', 'modalidad', 'moneda'].forEach((k) => { form.elements[k].value = st[k]; });
    form.elements.oferta.checked = st.oferta;
    form.elements.vendidos.checked = st.vendidos;
    $('[name=orden]').value = st.orden;
  };
  const read = () => {
    const fd = new FormData(form);
    return {
      condicion: fd.get('condicion') ?? '', tipo: fd.getAll('tipo'), marca: fd.getAll('marca'),
      unidad: fd.get('unidad') || 'ft',
      eslora_min: fd.get('eslora_min').trim(), eslora_max: fd.get('eslora_max').trim(),
      moneda: fd.get('moneda'), precio_min: fd.get('precio_min').replace(/[^\d.]/g, ''), precio_max: fd.get('precio_max').replace(/[^\d.]/g, ''),
      anio_min: fd.get('anio_min').trim(), anio_max: fd.get('anio_max').trim(),
      pais: fd.get('pais'), modalidad: fd.get('modalidad'),
      oferta: fd.get('oferta') === '1', vendidos: fd.get('vendidos') === '1',
      orden: $('[name=orden]').value,
    };
  };
  write(state);

  const filter = (st) => {
    const num = (v) => (v === '' || v == null ? null : +v);
    const ftOf = (v) => (v == null ? null : st.unidad === 'm' ? v / 0.3048 : v);
    const eMin = ftOf(num(st.eslora_min)); const eMax = ftOf(num(st.eslora_max));
    const pMin = num(st.precio_min); const pMax = num(st.precio_max);
    const out = listings.filter((y) => {
      if (!st.vendidos && y.estado === 'vendido') return false;
      if (st.condicion && y.condicion !== st.condicion) return false;
      if (st.tipo.length && !y.tipo.some((x) => st.tipo.includes(x))) return false;
      if (st.marca.length && !st.marca.includes(brandName(y))) return false;
      if (eMin != null && !(y.eslora_ft >= eMin)) return false;
      if (eMax != null && !(y.eslora_ft <= eMax)) return false;
      if (pMin != null || pMax != null) {
        if (!y.precio) return false;
        const usd = toUSD(y.precio, y.moneda);
        if (pMin != null && usd < toUSD(pMin, st.moneda)) return false;
        if (pMax != null && usd > toUSD(pMax, st.moneda)) return false;
      }
      if (num(st.anio_min) != null && !(y.anio >= num(st.anio_min))) return false;
      if (num(st.anio_max) != null && !(y.anio <= num(st.anio_max))) return false;
      if (st.pais && y.ubicacion_pais !== st.pais) return false;
      if (st.modalidad && y.modalidad !== st.modalidad) return false;
      if (st.oferta && !y.en_oferta) return false;
      return true;
    });
    const usd = (y) => (y.precio ? toUSD(y.precio, y.moneda) : null);
    const by = {
      recientes: (a, b) => b.id - a.id,
      precio_asc: (a, b) => (usd(a) ?? Infinity) - (usd(b) ?? Infinity),
      precio_desc: (a, b) => (usd(b) ?? -1) - (usd(a) ?? -1),
      eslora: (a, b) => (b.eslora_ft || 0) - (a.eslora_ft || 0),
      anio: (a, b) => (b.anio || 0) - (a.anio || 0),
    };
    // Vendidos al final cuando se incluyen
    return out.sort((a, b) => (a.estado === 'vendido') - (b.estado === 'vendido') || (by[st.orden] || by.recientes)(a, b));
  };

  const priceIn = (y, cur) => {
    if (y.estado === 'vendido') return `<span class="price"><b>${t('badge_vendido')}</b></span>`;
    if (!y.precio || y.moneda === cur) return priceHTML(y);
    const conv = Math.round(y.precio * (rates[y.moneda] || 1) / (rates[cur] || 1));
    return `<span class="price" title="${t('s_approx')} · ${money(y.precio, y.moneda)}"><b>≈ ${money(conv, cur)}</b></span>`;
  };
  const card = (y, cur) => `
    <li>
      <a class="card scard" href="${yachtURL(y)}">
        <span class="card__img"><img src="${y.imagen}" alt="${esc(y.titulo)}" loading="lazy">${badges(y)}</span>
        <span class="card__name">${esc(y.titulo)}${y.anio ? `<small>${y.anio}</small>` : ''}</span>
        ${place(y) ? `<span class="scard__loc">${esc(place(y))}</span>` : ''}
        ${y.eslora_ft ? `<span class="scard__dims">${esc(length(y.eslora_ft))}</span>` : ''}
        <span class="scard__price">${priceIn(y, cur)}</span>
      </a>
    </li>`;

  const defaults = { condicion: preset.condicion, tipo: preset.tipo, marca: [], unidad: 'ft', moneda: 'USD', oferta: preset.oferta, vendidos: false, orden: 'recientes' };
  const activeCount = (st) => ['tipo', 'marca'].reduce((n, k) => n + (String(st[k]) !== String(defaults[k]) ? 1 : 0), 0)
    + ['eslora_min', 'eslora_max', 'precio_min', 'precio_max', 'anio_min', 'anio_max', 'pais', 'modalidad'].filter((k) => st[k]).length
    + (st.condicion !== defaults.condicion ? 1 : 0) + (st.oferta !== defaults.oferta ? 1 : 0) + (st.vendidos ? 1 : 0);
  const syncURL = (st) => {
    const p = new URLSearchParams();
    if (st.condicion !== defaults.condicion) p.set('condicion', st.condicion);
    if (String(st.tipo) !== String(defaults.tipo)) p.set('tipo', st.tipo.join(','));
    if (st.marca.length) p.set('marca', st.marca.join(','));
    ['eslora_min', 'eslora_max', 'precio_min', 'precio_max', 'anio_min', 'anio_max', 'pais', 'modalidad'].forEach((k) => { if (st[k]) p.set(k, st[k]); });
    if (st.unidad !== 'ft' && (st.eslora_min || st.eslora_max)) p.set('unidad', st.unidad);
    if (st.moneda !== 'USD') p.set('moneda', st.moneda);
    if (st.oferta !== defaults.oferta) p.set('oferta', st.oferta ? '1' : '0');
    if (st.vendidos) p.set('vendidos', '1');
    if (st.orden !== 'recientes') p.set('orden', st.orden);
    const qs = p.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs.replace(/%2C/g, ',') : ''));
  };

  const draw = () => {
    const st = read();
    const res = filter(st);
    const grid = $('[data-render="r-grid"]');
    grid.innerHTML = res.slice(0, shown).map((y) => card(y, st.moneda)).join('');
    $('[data-render="r-count"]').textContent = res.length === 1 ? t('s_result_one') : t('s_results').replace('{n}', res.length);
    $('[data-render="f-apply"]').textContent = t('s_apply').replace('{n}', res.length);
    const n = activeCount(st);
    $('[data-render="r-active"]').textContent = n ? ` · ${n}` : '';
    $('[data-render="r-empty"]').hidden = res.length > 0;
    $('[data-render="r-more"]').innerHTML = res.length > shown ? `<button type="button" class="btn" data-more><span>${t('s_more')}</span></button>` : '';
    $('[data-render="r-more"] [data-more]')?.addEventListener('click', () => { shown += PAGE; draw(); });
    initButtons();
    localizeLinks();
    syncURL(st);
  };

  let tmr;
  form.addEventListener('input', (e) => { shown = PAGE; clearTimeout(tmr); tmr = setTimeout(draw, e.target.matches('input[inputmode]') ? 250 : 0); });
  form.addEventListener('submit', (e) => e.preventDefault());
  $('[name=orden]').addEventListener('change', draw);
  $$('[data-filters-reset]').forEach((b) => b.addEventListener('click', () => { write({ ...state, ...defaults, marca: [], eslora_min: '', eslora_max: '', precio_min: '', precio_max: '', anio_min: '', anio_max: '', pais: '', modalidad: '' }); shown = PAGE; draw(); }));
  // Panel de filtros en móvil
  $$('[data-filters-open]').forEach((b) => b.addEventListener('click', () => document.body.classList.add('filters-open')));
  $$('[data-filters-close]').forEach((b) => b.addEventListener('click', () => document.body.classList.remove('filters-open')));
  draw();
}

// ---------- Ficha de yate /yate/{id}/{slug} (requerimiento 7.3; modelos nuevos 7.5) ----------
function initFicha({ listings, marcas, brokers, modelos, sitio }) {
  const page = $('[data-page="ficha"]');
  if (!page) return;
  const id = +(location.pathname.match(/\/yate\/(\d+)/) || [])[1];
  const y = listings.find((x) => x.id === id);
  const model = !y && modelos.find((x) => x.id === id);
  const set = (name, html) => $$(`[data-render="${name}"]`).forEach((el) => { el.innerHTML = html; });
  if (!y && !model) {
    set('y-head', `<h1 class="yhead__title">${t('y_not_found')}</h1><a class="btn" href="/yates/usados"><span>${t('buy_used_cta')}</span></a>`);
    return;
  }
  const item = y || model;
  const marca = typeof item.marca === 'number' ? marcas.find((m) => m.id === item.marca) : null;
  const brandName = marca ? marca.nombre : item.marca;
  const name = y ? y.titulo : model.nombre;
  const tipo = y ? TIPOS.find((x) => x.key === y.tipo[0]) : null;
  const sold = y && y.estado === 'vendido';
  const url = location.origin + location.pathname;
  document.title = `${name}${y?.anio ? ` (${y.anio})` : ''} — Yachtcancun`;

  // Migas de pan
  const crumbs = [['/', t('y_home')], ['/yates', t('y_yachts')]];
  if (model) crumbs.push(['/yates/nuevos', t('y_new')], [`/marca/${marca.id}/${marca.slug}`, marca.nombre]);
  else {
    crumbs.push(y.condicion === 'nuevo' ? ['/yates/nuevos', t('y_new')] : ['/yates/usados', t('y_used')]);
    if (tipo) crumbs.push([tipo.url, t(tipo.i18n)]);
  }
  set('y-crumbs', `<ol>${crumbs.map(([h, l]) => `<li><a href="${h}">${esc(l)}</a></li>`).join('')}<li aria-current="page">${esc(name)}</li></ol>`);

  // Galería: mosaico + visor con pestañas
  const ext = model ? [model.imagen] : (y.galeria_exteriores?.length ? y.galeria_exteriores : [y.imagen]);
  const tabs = [['ext', t('y_tab_ext'), ext], ['int', t('y_tab_int'), y?.galeria_interiores || []], ['lay', t('y_tab_layout'), y?.galeria_layout || []]].filter((x) => x[2].length);
  const total = tabs.reduce((n, x) => n + x[2].length, 0);
  // Portada en alta resolución salvo que sea foto de astillero (entonces, foto real de la unidad)
  const cover = model ? model.imagen : (y.imagen_origen === 'astillero' ? ext[0] : y.imagen);
  const tiles = [{ src: cover, tab: 'ext', i: 0 }];
  tabs.forEach(([k, , list]) => list.forEach((src, i) => { if (tiles.length < 5 && src !== cover && !(k === 'ext' && i === 0 && y?.imagen_origen === 'astillero')) tiles.push({ src, tab: k, i }); }));
  set('y-gallery', `
    <div class="ygal__mosaic" data-count="${tiles.length}">
      ${tiles.map((x, n) => `<button type="button" class="ygal__tile" data-open="${x.tab}:${x.i}" aria-label="${esc(name)} ${n + 1}"><img src="${x.src}" alt="" ${n ? 'loading="lazy"' : ''}></button>`).join('')}
    </div>
    <div class="ygal__bar">
      <div class="ygal__tabs">${tabs.map(([k, l, list]) => `<button type="button" data-open="${k}:0">${esc(l)} <span>${list.length}</span></button>`).join('')}</div>
      ${total > 1 ? `<button type="button" class="ygal__all" data-open="ext:0">${t('y_all_photos').replace('{n}', total)}</button>` : ''}
    </div>`);

  const lb = $('[data-render="y-lightbox"]');
  let cur = { tab: 'ext', i: 0 };
  const listOf = (k) => (tabs.find((x) => x[0] === k) || tabs[0])[2];
  const drawLB = () => {
    const list = listOf(cur.tab);
    cur.i = (cur.i + list.length) % list.length;
    lb.innerHTML = `
      <div class="lb__top">
        <div class="lb__tabs" role="tablist">${tabs.map(([k, l, li]) => `<button type="button" role="tab" aria-selected="${k === cur.tab}" data-tab="${k}">${esc(l)} <span>${li.length}</span></button>`).join('')}</div>
        <p class="lb__count">${cur.i + 1} / ${list.length}</p>
        <button type="button" class="lb__close" data-lb-close aria-label="${t('y_close')}">×</button>
      </div>
      <div class="lb__stage">
        <button type="button" class="lb__nav lb__nav--prev" data-step="-1" aria-label="${t('y_prev')}">←</button>
        <img class="lb__img" src="${list[cur.i]}" alt="${esc(name)} — ${cur.i + 1}">
        <button type="button" class="lb__nav lb__nav--next" data-step="1" aria-label="${t('y_next')}">→</button>
      </div>
      <div class="lb__thumbs">${list.map((src, i) => `<button type="button" class="${i === cur.i ? 'is-active' : ''}" data-go-i="${i}"><img src="${src}" alt="" loading="lazy"></button>`).join('')}</div>`;
    $('.lb__thumbs .is-active', lb)?.scrollIntoView({ block: 'nearest', inline: 'center' });
  };
  const openLB = (tab, i) => { cur = { tab, i }; lb.hidden = false; document.body.classList.add('lb-open'); drawLB(); $('.lb__close', lb).focus(); };
  const closeLB = () => { lb.hidden = true; document.body.classList.remove('lb-open'); };
  page.addEventListener('click', (e) => { const b = e.target.closest('[data-open]'); if (b) { const [k, i] = b.dataset.open.split(':'); openLB(k, +i); } });
  lb.addEventListener('click', (e) => {
    if (e.target.closest('[data-lb-close]') || e.target === lb) return closeLB();
    const st = e.target.closest('[data-step]'); if (st) { cur.i += +st.dataset.step; return drawLB(); }
    const tb = e.target.closest('[data-tab]'); if (tb) { cur = { tab: tb.dataset.tab, i: 0 }; return drawLB(); }
    const g = e.target.closest('[data-go-i]'); if (g) { cur.i = +g.dataset.goI; drawLB(); }
  });
  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLB();
    if (e.key === 'ArrowRight') { cur.i++; drawLB(); }
    if (e.key === 'ArrowLeft') { cur.i--; drawLB(); }
  });
  let x0 = null;
  lb.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) { cur.i += dx < 0 ? 1 : -1; drawLB(); } x0 = null; });

  // Encabezado
  const meta = [brandName, tipo ? t(tipo.i18n) : model ? marca.lineas?.find((l) => l.slug === model.linea)?.nombre : ''].filter(Boolean).join(' · ');
  set('y-head', `
    <p class="eyebrow">${esc(meta)}</p>
    <h1 class="yhead__title">${esc(name)}${y?.anio ? `<small>${y.anio}</small>` : ''}</h1>
    ${y ? badges(y) : ''}
    ${y && place(y) ? `<p class="yhead__loc">${esc(place(y))}</p>` : ''}
    ${y?.nota_estado ? `<p class="yhead__note">${esc(y.nota_estado)}</p>` : ''}
    ${model ? `<p class="yhead__note">${t('y_model_note')}</p>` : ''}`);

  // Precio + CTAs (WhatsApp con el nombre del yate y la URL, a número de demo)
  const waURL = `https://wa.me/${sitio.whatsapp_demo}?text=${encodeURIComponent(t('y_wa_msg').replace('{name}', name).replace('{url}', url))}`;
  const priceBlock = sold ? `<span class="price"><b>${t('badge_vendido')}</b></span>` : model ? `<span class="price"><b>${t('price_ask')}</b></span>` : priceHTML(y);
  set('y-price', `
    <div class="yprice">${priceBlock}</div>
    <div class="yctas">
      ${sold
        ? `<a class="btn btn--solid" href="/yates/usados${tipo ? `?tipo=${tipo.key}` : ''}"><span>${t('y_similar_cta')}</span></a>`
        : `<a class="btn btn--solid" href="#contacto-yate" data-visit><span>${t('y_visit')}</span></a>`}
      <div class="yctas__links">
        <a class="tbtn" href="${waURL}" target="_blank" rel="noopener">${t('y_wa')}</a>
        ${sold || model ? '' : `<button type="button" class="tbtn" data-brochure>${t('y_brochure')}</button>`}
      </div>
    </div>`);
  // El botón flotante de WhatsApp también abre el chat con el mensaje del yate
  $$('.wa-float').forEach((a) => { a.href = waURL; });

  // Datos clave en una fila
  const key = model
    ? [[t('sp_marca'), brandName], [t('sp_linea'), marca.lineas?.find((l) => l.slug === model.linea)?.nombre]]
    : [[t('y_k_length'), length(y.eslora_ft)], [t('y_k_year'), y.anio ? `${y.anio}${y.anio_refit ? ` / ${y.anio_refit}` : ''}` : ''],
       [t('y_k_cabins'), y.camarotes], [t('y_k_engines'), y.motores], [t('y_k_speed'), y.velocidad || (y.velocidad_max_kn ? `${y.velocidad_max_kn} kn` : '')]];
  set('y-key', `<ul>${key.filter(([, v]) => v).map(([k, v]) => `<li><span>${esc(k)}</span><b>${esc(v)}</b></li>`).join('')}</ul>`);

  // Descripción + equipamiento
  const desc = (y?.descripcion?.es || []);
  const eq = (y?.equipamiento?.es || []);
  const isHead = (l) => l.length < 40 && l === l.toUpperCase() && /[A-ZÁÉÍÓÚ]/.test(l);
  set('y-desc', desc.length || eq.length || model ? `
    <h2 class="ydetail__h">${t('y_desc')}</h2>
    ${model ? `<p>${esc(marca.descripcion?.[LANG] || '')}</p>` : desc.map((p) => `<p>${esc(p)}</p>`).join('')}
    ${eq.length ? `<h3 class="ydetail__h3">${t('y_equipment')}</h3><ul class="yeq">${eq.map((l) => isHead(l) ? `</ul><p class="yeq__h">${esc(l)}</p><ul class="yeq">` : `<li>${esc(l)}</li>`).join('')}</ul>` : ''}` : '');

  // Especificaciones completas (sin campos vacíos ni "N/A")
  if (y) {
    const gal = (v) => (v ? `${num(v)} gal` : '');
    const ftm = (v) => (v ? `${v} ft · ${(v * 0.3048).toFixed(1)} m` : '');
    const rows = [
      ['sp_eslora', ftm(y.eslora_ft)], ['sp_manga', ftm(y.manga_ft)], ['sp_calado', ftm(y.calado_ft)],
      ['sp_anio', y.anio], ['sp_refit', y.anio_refit], ['sp_motores', y.motores],
      ['sp_horas', y.horas_motor && !/hrs/i.test(y.motores || '') ? `${num(y.horas_motor)} h` : ''],
      ['sp_combustible', gal(y.combustible_gal)], ['sp_agua', gal(y.agua_gal)],
      ['sp_camarotes', y.camarotes], ['sp_banos', y.banos], ['sp_pasajeros', y.capacidad_pasajeros ? `${y.capacidad_pasajeros} pax` : ''],
      ['sp_velocidad', y.velocidad || (y.velocidad_max_kn ? `${y.velocidad_max_kn} kn` : '')], ['sp_desplazamiento', y.desplazamiento],
      ['sp_ubicacion', place(y)], ['sp_tipo', tipo ? t(tipo.i18n) : ''], ['sp_marca', brandName],
    ].filter(([, v]) => v && String(v).trim().toUpperCase() !== 'N/A');
    set('y-specs', `<h2 class="ydetail__h">${t('y_specs')}</h2><dl class="yspecs">${rows.map(([k, v]) => `<div><dt>${t(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`);
  }

  // Video
  const vid = (y?.video_url || '').match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
  $$('[data-render="brand-video"]').forEach((el) => {
    if (!vid) return;
    el.hidden = false;
    el.innerHTML = `<p class="eyebrow">${t('brand_video')}</p>
      <button type="button" class="bvideo__frame" data-yt-lite="${vid[1]}" aria-label="${t('brand_play')}"><img src="${cover}" alt="" loading="lazy"><span class="bvideo__play" aria-hidden="true">▶</span></button>`;
  });

  // Broker asignado (el lead se asigna a ese broker) + compartir
  const b = brokers.find((x) => x.id === (y ? y.broker : marca?.broker_embajador));
  set('y-broker', b ? `
    <img src="${b.foto}" alt="${esc(b.nombre)}" loading="lazy">
    <div>
      <p class="bbroker__k">${t(y ? 'y_broker_k' : 'brand_ambassador')}</p>
      <p class="bbroker__name">${esc(b.nombre)}</p>
      <p class="bbroker__role">${esc(b.rol)}</p>
      <p class="bbroker__links"><a href="${waURL}" target="_blank" rel="noopener">WhatsApp</a> · <a href="mailto:${esc(sitio.email_demo)}">${t('f_email')}</a></p>
    </div>` : '');
  $$('[data-render="y-broker"]').forEach((el) => { if (!b) el.remove(); });
  set('y-share', `
    <p class="yshare__k">${t('y_share')}</p>
    <a href="https://wa.me/?text=${encodeURIComponent(`${name} — ${url}`)}" target="_blank" rel="noopener">WhatsApp</a>
    <button type="button" data-copy>${t('y_copy')}</button>`);
  $('[data-copy]')?.addEventListener('click', async (e) => {
    try { await navigator.clipboard.writeText(url); } catch { /* sin portapapeles */ }
    e.currentTarget.textContent = t('y_copied');
  });
  $$('[data-render="y-id"]').forEach((el) => { el.value = id; });
  $$('form[data-lead="yate"]').forEach((f) => {
    if (b) f.insertAdjacentHTML('afterbegin', `<input type="hidden" name="broker_asignado" value="${b.id}">`);
  });
  $$('[data-render="y-msg"]').forEach((el) => { el.value = t('y_msg_default').replace('{name}', name); });
  $$('[data-visit]').forEach((a) => a.addEventListener('click', () => { const r = $('input[name=motivo][value=visita]'); if (r) r.checked = true; }));

  // Modal de brochure
  const modal = $('[data-render="y-brochure"]');
  if (modal) {
    const close = () => { modal.hidden = true; document.body.classList.remove('lb-open'); };
    $$('[data-brochure]').forEach((btn) => btn.addEventListener('click', () => { modal.hidden = false; document.body.classList.add('lb-open'); $('input[name=nombre]', modal)?.focus(); }));
    modal.addEventListener('click', (e) => { if (e.target === modal || e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });
  }

  // Similares (mismo tipo y eslora parecida) u otros modelos de la línea
  let sim = [];
  if (y) {
    sim = listings.filter((x) => x.id !== y.id && x.estado !== 'vendido')
      .map((x) => ({ x, score: Math.abs((x.eslora_ft || 0) - (y.eslora_ft || 0)) + (x.tipo.some((k) => y.tipo.includes(k)) ? 0 : 60) + (x.condicion === y.condicion ? 0 : 30) }))
      .sort((a, b2) => a.score - b2.score).slice(0, 3).map((o) => o.x);
    set('y-similar-title', t('y_similar'));
    set('y-similar', sim.map((x) => `
      <li><a class="card scard" href="${yachtURL(x)}">
        <span class="card__img"><img src="${x.imagen}" alt="${esc(x.titulo)}" loading="lazy">${badges(x)}</span>
        <span class="card__name">${esc(x.titulo)}${x.anio ? `<small>${x.anio}</small>` : ''}</span>
        ${place(x) ? `<span class="scard__loc">${esc(place(x))}</span>` : ''}
        ${x.eslora_ft ? `<span class="scard__dims">${esc(length(x.eslora_ft))}</span>` : ''}
        <span class="scard__price">${priceHTML(x)}</span>
      </a></li>`).join(''));
  } else {
    sim = modelos.filter((x) => x.marca === model.marca && x.id !== model.id && x.linea === model.linea);
    if (!sim.length) sim = modelos.filter((x) => x.marca === model.marca && x.id !== model.id).slice(0, 3);
    set('y-similar-title', t('y_other_models'));
    set('y-similar', sim.map((x) => `
      <li><a class="card" href="${yachtURL(x)}">
        <span class="card__img"><img src="${x.imagen}" alt="${esc(x.nombre)}" loading="lazy"></span>
        <span class="card__row"><span class="card__name">${esc(x.nombre)}</span><span class="card__meta">${t('brand_view_model')} →</span></span>
      </a></li>`).join(''));
  }
  $$('[data-render="y-similar-section"]').forEach((el) => { el.hidden = !sim.length; });
  localizeLinks();
}

// ---------- Video bajo demanda: solo carga YouTube al dar play ----------
function initLiteVideo() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-yt-lite]');
    if (!btn) return;
    const frame = document.createElement('iframe');
    frame.src = `https://www.youtube-nocookie.com/embed/${btn.dataset.ytLite}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
    frame.title = btn.getAttribute('aria-label') || 'Video';
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    btn.replaceWith(Object.assign(document.createElement('div'), { className: 'bvideo__frame' }));
    $('.bvideo .bvideo__frame').appendChild(frame);
  });
}

// ---------- Header: se oculta al bajar, se vuelve sólido tras el hero ----------
function initHeader() {
  const h = $('#header');
  let last = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    h.classList.toggle('is-solid', y > innerHeight * 0.8);
    h.classList.toggle('is-hidden', y > last && y > innerHeight * 0.8 && !document.body.classList.contains('menu-open'));
    last = y;
  }, { passive: true });
  $('[data-top]')?.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
}

// ---------- Reveal on scroll ----------
function initReveal() {
  $$('.section-head, .intro__aside, .owners__body, .cred > .eyebrow, .cred__foot, .cx-form__intro, .cx-steps__title').forEach((el) => el.setAttribute('data-reveal', ''));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -10% 0px' });
  $$('[data-reveal]').forEach((el) => io.observe(el));
}

// ---------- Formularios (demo: nunca contactan a brokers reales) ----------
function initForms() {
  $$('form[data-lead]').forEach((form) => {
    // Campos que dependen del interés (comprar / vender / servicios / otro)
    const sync = () => {
      const v = $('[name=interes]:checked', form)?.value;
      $$('[data-show]', form).forEach((f) => { f.hidden = !f.dataset.show.split(' ').includes(v); });
    };
    $$('[name=interes]', form).forEach((r) => r.addEventListener('change', sync));
    sync();

    // Zona de carga: muestra el nombre del archivo y acepta arrastrar y soltar
    const drop = $('.drop', form);
    const file = $('input[type=file]', form);
    if (drop && file) {
      const label = $('i', drop);
      file.addEventListener('change', () => {
        const n = file.files.length;
        label.textContent = n > 1 ? `${n} ${t('f_files')}` : file.files[0]?.name || t('f_drop');
        drop.classList.toggle('has-file', n > 0);
      });
      ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('is-over'); }));
      ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, () => drop.classList.remove('is-over')));
      drop.addEventListener('drop', (e) => { e.preventDefault(); if (e.dataTransfer.files.length) { file.files = e.dataTransfer.files; file.dispatchEvent(new Event('change')); } });
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      $$('.field__err, .check__err', form).forEach((n) => n.remove());
      $$('.has-error', form).forEach((n) => n.classList.remove('has-error'));
      let ok = true;
      const fail = (input, msg, cls = 'field__err') => {
        ok = false;
        const wrap = input.closest('.field, .check');
        wrap.classList.add('has-error');
        wrap.insertAdjacentHTML('beforeend', `<span class="${cls}">${msg}</span>`);
      };
      $$('[required]', form).forEach((inp) => {
        if (inp.closest('[hidden]')) return;
        if (inp.type === 'checkbox') { if (!inp.checked) fail(inp, t('f_error_privacy'), 'check__err'); return; }
        if (!inp.value.trim()) fail(inp, t('f_error_required'));
        else if (inp.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value)) fail(inp, t('f_error_email'));
      });
      const bad = [...(file?.files || [])].some((f) => !/^image\/(jpeg|png)$/.test(f.type) || f.size > 10 * 1024 * 1024);
      if (bad && !file.closest('[hidden]')) fail(file, t('f_error_file'));
      if (!ok) { $('.has-error input, .has-error select, .has-error textarea', form)?.focus(); return; }
      if (form.empresa?.value) return; // honeypot anti-spam

      const datos = {};
      new FormData(form).forEach((v, k) => {
        if (k === 'empresa') return;
        const fs = form.elements[k]?.closest?.('[hidden]');
        if (fs) return;
        const val = v instanceof File ? (v.name ? { nombre: v.name, bytes: v.size } : null) : v;
        if (v instanceof File && form.elements[k]?.multiple) { if (val) (datos[k] ||= []).push(val); }
        else datos[k] = val;
      });
      const params = new URLSearchParams(location.search);
      const lead = {
        tipo: form.dataset.lead,
        datos,
        idioma: LANG,
        pagina_origen: location.pathname,
        utm: Object.fromEntries([...params].filter(([k]) => k.startsWith('utm_'))),
        fecha: new Date().toISOString(),
      };
      // Log local de la demo; en producción se enruta según la sección 8.
      const log = JSON.parse(store.get('localStorage', 'yc_demo_leads') || '[]');
      log.push(lead);
      store.set('localStorage', 'yc_demo_leads', JSON.stringify(log));
      console.info('[demo] lead registrado', lead);
      [...form.children].forEach((n) => { if (!n.classList.contains('form__ok')) n.hidden = true; });
      const okMsg = $('.form__ok', form);
      okMsg.hidden = false;
      okMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
}

// ---------- Arranque ----------
async function boot() {
  const started = performance.now();
  const seen = store.get('sessionStorage', 'yc_loader_seen');
  try {
    const [i18n, listings, marcas, brokers, eventos, sitio, modelos] = await Promise.all([
      getJSON(`/i18n/${LANG}.json`),
      getJSON('/data/listings.json'),
      getJSON('/data/marcas.json'),
      getJSON('/data/brokers.json'),
      getJSON('/data/eventos.json'),
      getJSON('/data/sitio.json'),
      getJSON('/data/modelos.json'),
    ]);
    T = i18n;
    applyI18n();
    render({ listings, marcas, brokers, eventos, sitio, modelos });
    applyI18n();
    localizeLinks();
    initSearch({ listings, marcas, sitio });
    initFicha({ listings, marcas, brokers, modelos, sitio });
  } catch (err) {
    console.error('No se pudieron cargar los datos de la demo', err);
  }
  initButtons();
  initMenu();
  initHero();
  initIntroLines();
  initFeatured();
  initBrands();
  initRail();
  initHeader();
  initReveal();
  initForms();
  initLiteVideo();

  const minTime = seen ? 200 : 1700;
  setTimeout(() => {
    document.body.classList.remove('is-loading');
    store.set('sessionStorage', 'yc_loader_seen', '1');
  }, Math.max(0, minTime - (performance.now() - started)));
}
boot();
