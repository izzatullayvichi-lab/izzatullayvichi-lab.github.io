# In'omjon Qo'chqorov — portfolio

Kichik, tez, bog'liqliksiz (zero-dependency) statik sayt. uz / ru / en.

## Ishga tushirish
```bash
node build.mjs          # dist/ papkasini yaratadi
npx serve dist          # lokal ko'rish
```
Domen bo'lsa: `SITE_URL=https://domen.uz node build.mjs` (canonical, hreflang, sitemap, OG avtomatik qo'shiladi).

## Mazmunni o'zgartirish
| Nima | Qayerda |
|---|---|
| Matnlar (3 til) | `src/content/{uz,ru,en}.json` |
| Aloqa, Instagram havolasi | `src/data/site.json` (`instagram` to'ldirilsa «Blog» bo'limi chiqadi) |
| Ilmiy ishlar | `src/data/publications.json` (bo'sh bo'lsa bo'lim yashirin) |
| Mukofotlar | `src/data/awards.json` (bo'sh bo'lsa bo'lim yashirin) |
| Rasm | `src/assets/portrait.{webp,jpg}` |

Yozuv formati (`publications.json` / `awards.json`):
```json
[{ "year": "2025", "title": {"uz":"…","ru":"…","en":"…"}, "meta": {"uz":"Jurnal, hammuallif","ru":"…","en":"…"}, "url": "https://…" }]
```

## Deploy
Build buyrug'i: `node build.mjs`, chiqish papkasi: `dist`.
Cloudflare Pages / Netlify / Vercel / GitHub Pages (`.github/workflows/pages.yml`) bilan ishlaydi.
