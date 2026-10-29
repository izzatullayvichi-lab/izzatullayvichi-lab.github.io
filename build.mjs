// Zero-dependency static site builder: node build.mjs  ->  dist/
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'src';
const OUT = 'dist';
const LANGS = ['uz', 'ru', 'en'];
const LANG_LABEL = { uz: 'UZ', ru: 'RU', en: 'EN' };

const read = (p) => readFileSync(p, 'utf8');
const json = (p) => JSON.parse(read(p));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const site = json(join(SRC, 'data/site.json'));
const siteUrl = (process.env.SITE_URL ?? site.siteUrl ?? '').replace(/\/$/, '');
const publications = json(join(SRC, 'data/publications.json'));
const awards = json(join(SRC, 'data/awards.json'));
const hasOg = existsSync(join(SRC, 'assets/og.png'));

/* ---------- ornament (eight-pointed star, "khatam") ---------- */
const sq = (r, a0) =>
  [0, 1, 2, 3]
    .map((i) => {
      const a = ((a0 + i * 90) * Math.PI) / 180;
      return `${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`;
    })
    .join(' ');
const star = (r, rot = 0) =>
  `<polygon pathLength="1" points="${sq(r, rot)}"/><polygon pathLength="1" points="${sq(r, rot + 45)}"/>`;

const heroOrnament = `
<svg class="orn" viewBox="-120 -120 240 240" aria-hidden="true" focusable="false">
  <g class="orn-a">
    <circle pathLength="1" r="114"/>
    ${star(104)}
    ${star(78, 22.5)}
  </g>
  <g class="orn-b">
    <circle pathLength="1" r="56"/>
    ${star(52)}
    ${star(30, 22.5)}
  </g>
</svg>`;

const patternSvg = `
<svg class="pattern" aria-hidden="true" focusable="false" width="100%" height="100%">
  <defs>
    <pattern id="khatam" width="64" height="64" patternUnits="userSpaceOnUse">
      <g transform="translate(32 32)" fill="none" stroke="currentColor" stroke-width=".6">
        ${star(15).replace(/ pathLength="1"/g, '')}
        <circle r="3"/>
      </g>
      <g fill="none" stroke="currentColor" stroke-width=".6">
        <circle cx="0" cy="0" r="2"/><circle cx="64" cy="0" r="2"/><circle cx="0" cy="64" r="2"/><circle cx="64" cy="64" r="2"/>
      </g>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#khatam)"/>
</svg>`;

const icon = {
  arrow: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>',
  telegram: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M21 4 3 11l5.5 2L19 7l-8 8v4l3-3 4 3z"/></svg>',
  phone: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none"/></svg>',
  sun: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"/></svg>',
};

/* ---------- page ---------- */
function page(lang) {
  const t = json(join(SRC, `content/${lang}.json`));
  const base = lang === 'uz' ? '' : '../';
  const href = (l) => (l === 'uz' ? base || './' : `${base}${l}/`);
  const abs = (l) => `${siteUrl}${l === 'uz' ? '/' : `/${l}/`}`;
  const [first, ...rest] = t.name.split(' ');
  const last = rest.join(' ');

  const show = {
    publications: publications.length > 0,
    awards: awards.length > 0,
    blog: Boolean(site.instagram),
  };
  const navItems = [
    ['about', true],
    ['focus', true],
    ['education', true],
    ['publications', show.publications],
    ['awards', show.awards],
    ['blog', show.blog],
    ['contact', true],
  ].filter(([, on]) => on);

  const list = (items) =>
    items
      .map((it) => {
        const title = it.title?.[lang] ?? it.title;
        const meta = it.meta?.[lang] ?? it.meta ?? '';
        const open = it.url
          ? `<a class="row-link" href="${esc(it.url)}" target="_blank" rel="noopener">${esc(t.publications.open)} ${icon.arrow}</a>`
          : '';
        return `<li class="row reveal"><span class="row-year">${esc(it.year ?? '')}</span><div class="row-body"><h3>${esc(title)}</h3><p>${esc(meta)}</p></div>${open}</li>`;
      })
      .join('');

  const contacts = [
    ['telegram', t.contact.telegram, `@${site.telegram}`, `https://t.me/${site.telegram}`],
    ['phone', t.contact.phone, site.phoneDisplay, `tel:${site.phone}`],
    ['mail', t.contact.email, site.email, `mailto:${site.email}`],
    site.instagram ? ['instagram', t.contact.instagram, site.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@').replace(/\/$/, ''), site.instagram] : null,
  ].filter(Boolean);

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: t.name,
    jobTitle: lang === 'uz' ? 'Pedagog, huquqshunos' : lang === 'ru' ? 'Педагог, юрист' : 'Educator, legal scholar',
    email: `mailto:${site.email}`,
    ...(siteUrl && { url: abs(lang) }),
    alumniOf: [
      { '@type': 'CollegeOrUniversity', name: 'Tashkent State University of Law' },
      { '@type': 'CollegeOrUniversity', name: 'Mirzo Ulugbek National University of Uzbekistan' },
    ],
    sameAs: [`https://t.me/${site.telegram}`, ...(site.instagram ? [site.instagram] : [])],
  };

  const head = `<!doctype html>
<html lang="${lang}" data-theme-pref>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(t.meta.title)}</title>
<meta name="description" content="${esc(t.meta.description)}">
<meta name="theme-color" content="#08130f">
<meta name="color-scheme" content="light dark">
<link rel="icon" href="${base}assets/favicon.svg" type="image/svg+xml">
<link rel="manifest" href="${base}manifest.webmanifest">
${siteUrl ? `<link rel="canonical" href="${abs(lang)}">` : ''}
${siteUrl ? LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${abs(l)}">`).join('\n') + `\n<link rel="alternate" hreflang="x-default" href="${abs('uz')}">` : ''}
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(t.meta.title)}">
<meta property="og:description" content="${esc(t.meta.description)}">
<meta property="og:locale" content="${t.locale}">
${siteUrl ? `<meta property="og:url" content="${abs(lang)}">` : ''}
${siteUrl && hasOg ? `<meta property="og:image" content="${siteUrl}/assets/og.png">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta name="twitter:card" content="summary_large_image">` : '<meta name="twitter:card" content="summary">'}
<link rel="preload" href="${base}assets/fonts/cormorant-normal-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${base}assets/fonts/manrope-normal-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${base}assets/style.css">
<script>try{var s=localStorage.getItem('theme');if(s==='light'||s==='dark')document.documentElement.dataset.theme=s}catch(e){}</script>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>`;

  const header = `
<a class="skip" href="#main">${esc(t.ui.skip)}</a>
<header class="header is-top" id="header">
  <div class="wrap header-in">
    <a class="brand" href="#top" aria-label="${esc(t.name)}">
      <svg viewBox="-120 -120 240 240" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="7">${star(104).replace(/ pathLength="1"/g, '')}</g></svg>
      <span>${esc(t.initials)}</span>
    </a>
    <nav class="nav" id="nav" aria-label="Main">
      ${navItems.map(([k]) => `<a href="#${k}">${esc(t.nav[k])}</a>`).join('')}
    </nav>
    <div class="tools">
      <div class="langs" role="group" aria-label="${esc(t.ui.language)}">
        ${LANGS.map((l) => `<a href="${href(l)}" hreflang="${l}" data-lang="${l}"${l === lang ? ' aria-current="true"' : ''}>${LANG_LABEL[l]}</a>`).join('')}
      </div>
      <button class="icon-btn" id="theme" type="button" aria-label="${esc(t.ui.theme)}"><span class="i-sun">${icon.sun}</span><span class="i-moon">${icon.moon}</span></button>
      <button class="icon-btn burger" id="burger" type="button" aria-label="${esc(t.ui.menu)}" aria-expanded="false" aria-controls="nav"><span></span><span></span></button>
    </div>
  </div>
</header>`;

  const hero = `
<section class="hero" id="top">
  ${patternSvg}
  <div class="hero-glow" aria-hidden="true"></div>
  <div class="wrap hero-in">
    <div class="hero-text">
      <p class="eyebrow rise" style="--d:.15s"><span class="dash"></span>${esc(t.hero.eyebrow)}</p>
      <h1 class="name">
        <span class="line"><span class="rise" style="--d:.3s">${esc(first)}</span></span>
        <span class="line"><span class="rise" style="--d:.45s"><em>${esc(last)}</em></span></span>
      </h1>
      <p class="role rise" style="--d:.65s">${esc(t.hero.role)}</p>
      <p class="tagline rise" style="--d:.8s">${esc(t.hero.tagline)}</p>
      <div class="cta rise" style="--d:.95s">
        <a class="btn btn-gold" href="#contact">${esc(t.hero.ctaContact)} ${icon.arrow}</a>
        <a class="btn btn-ghost" href="#about">${esc(t.hero.ctaAbout)}</a>
      </div>
    </div>
    <div class="hero-visual">
      ${heroOrnament}
      <figure class="arch rise" style="--d:.4s">
        <picture>
          <source srcset="${base}assets/portrait.webp" type="image/webp">
          <img src="${base}assets/portrait.jpg" width="900" height="1160" alt="${esc(t.a11y.photo)}" fetchpriority="high">
        </picture>
      </figure>
    </div>
  </div>
  <a class="scroll" href="#about" aria-label="${esc(t.hero.scroll)}"><span>${esc(t.hero.scroll)}</span><i></i></a>
</section>`;

  const sectionHead = (k, extra = '') =>
    `<header class="sec-head reveal"><p class="kicker"><span class="dash"></span>${esc(t[k].kicker)}</p><h2>${esc(t[k].title)}</h2>${extra}</header>`;

  const about = `
<section class="sec" id="about">
  <div class="wrap about">
    ${sectionHead('about')}
    <div class="about-body reveal">
      <p class="lead">${esc(t.about.p1)}</p>
      <p>${esc(t.about.p2)}</p>
    </div>
  </div>
</section>`;

  const focus = `
<section class="sec sec-alt" id="focus">
  <div class="wrap">
    ${sectionHead('focus')}
    <ul class="cards">
      ${t.focus.items.map((it, i) => `<li class="card reveal" style="--i:${i}"><span class="num">0${i + 1}</span><h3>${esc(it.t)}</h3><p>${esc(it.d)}</p></li>`).join('')}
    </ul>
  </div>
</section>`;

  const education = `
<section class="sec" id="education">
  <div class="wrap">
    ${sectionHead('education')}
    <ol class="timeline">
      ${t.education.items.map((it) => `<li class="tl reveal"><span class="tl-year">${esc(it.year)}</span><div><p class="tl-degree">${esc(it.degree)}</p><h3>${esc(it.school)}</h3><p>${esc(it.field)}</p></div></li>`).join('')}
    </ol>
  </div>
</section>`;

  const pubs = show.publications
    ? `<section class="sec sec-alt" id="publications"><div class="wrap">${sectionHead('publications')}<ul class="rows">${list(publications)}</ul></div></section>`
    : '';
  const awd = show.awards
    ? `<section class="sec" id="awards"><div class="wrap">${sectionHead('awards')}<ul class="rows">${list(awards)}</ul></div></section>`
    : '';

  const blog = show.blog
    ? `<section class="sec sec-dark" id="blog"><div class="wrap blog reveal"><img class="blog-ava" src="${base}assets/instagram.webp" width="180" height="180" alt="Instagram" loading="lazy"><div class="blog-main">${sectionHead('blog')}<p class="blog-text">${esc(t.blog.text)}</p></div><a class="btn btn-gold" href="${esc(site.instagram)}" target="_blank" rel="noopener">${esc(t.blog.cta)} ${icon.arrow}</a></div></section>`
    : '';

  const contact = `
<section class="sec sec-dark contact" id="contact">
  ${patternSvg}
  <div class="wrap">
    ${sectionHead('contact', `<p class="contact-text">${esc(t.contact.text)}</p>`)}
    <ul class="links">
      ${contacts.map(([ic, label, value, url]) => `<li class="reveal"><a class="link" href="${esc(url)}"${url.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}><span class="link-ic">${icon[ic]}</span><span class="link-l">${esc(label)}</span><span class="link-v">${esc(value)}</span><span class="link-a">${icon.arrow}</span></a></li>`).join('')}
    </ul>
  </div>
</section>`;

  const footer = `
<footer class="footer">
  <div class="wrap footer-in">
    <p>© <span id="year">${new Date().getFullYear()}</span> ${esc(t.name)}. ${esc(t.ui.rights)}</p>
    <a href="#top">${esc(t.ui.top)} ↑</a>
  </div>
</footer>`;

  const redirect = lang === 'uz'
    ? `<script>try{if(!localStorage.getItem('lang')){var n=(navigator.language||'').slice(0,2);if(n==='ru'||n==='en')location.replace(n+'/')}}catch(e){}</script>`
    : '';

  return `${head}
<body>
${redirect}
${header}
<main id="main">
${hero}${about}${focus}${education}${pubs}${awd}${blog}${contact}
</main>
${footer}
<script src="${base}assets/main.js" defer></script>
</body>
</html>
`;
}

/* ---------- build ---------- */
rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'assets'), { recursive: true });

for (const lang of LANGS) {
  const dir = lang === 'uz' ? OUT : join(OUT, lang);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), page(lang));
}

// assets
cpSync(join(SRC, 'assets'), join(OUT, 'assets'), { recursive: true });
rmSync(join(OUT, 'assets/fonts/fonts.css'), { force: true });
writeFileSync(join(OUT, 'assets/style.css'), read(join(SRC, 'assets/fonts/fonts.css')) + read(join(SRC, 'styles.css')));
cpSync(join(SRC, 'main.js'), join(OUT, 'assets/main.js'));

// 404 (Cloudflare / Netlify / GitHub Pages)
writeFileSync(join(OUT, '404.html'), page('uz').replace(/(href|src)="(?!https?:|#|mailto:|tel:|\.\/|\/)/g, '$1="/').replace('<title>', '<meta name="robots" content="noindex"><title>'));

writeFileSync(join(OUT, 'manifest.webmanifest'), JSON.stringify({
  name: "In'omjon Qo'chqorov", short_name: 'IQ', start_url: './', display: 'standalone',
  background_color: '#08130f', theme_color: '#08130f',
  icons: [{ src: 'assets/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
}));
writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n${siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml\n` : ''}`);
if (siteUrl) {
  const urls = LANGS.map((l) => {
    const loc = `${siteUrl}${l === 'uz' ? '/' : `/${l}/`}`;
    const alts = LANGS.map((a) => `<xhtml:link rel="alternate" hreflang="${a}" href="${siteUrl}${a === 'uz' ? '/' : `/${a}/`}"/>`).join('');
    return `<url><loc>${loc}</loc>${alts}</url>`;
  }).join('');
  writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`);
}
writeFileSync(join(OUT, '.nojekyll'), '');
writeFileSync(join(OUT, '_headers'), `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Permissions-Policy: camera=(), microphone=(), geolocation=()
/assets/*
  Cache-Control: public, max-age=31536000, immutable
`);
console.log(`Built ${LANGS.length} pages -> ${OUT}/ ${siteUrl ? `(SITE_URL=${siteUrl})` : '(no SITE_URL: canonical/sitemap skipped)'}`);
