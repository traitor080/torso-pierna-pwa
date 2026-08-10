# Torso / Pierna — PWA

App de registro de entrenamiento **Torso / Pierna A/B** convertida en PWA instalable, optimizada para móvil (Google Pixel 8a).

## ✨ Qué hay

- **Estilo profesional** — dark refinado, tipografía más generosa, micro-animaciones, tap targets ≥ 44px
- **Bottom navigation** — estilo app nativa, alcance del pulgar en vertical
- **PWA instalable** — icono en pantalla, splash, abre standalone (sin barra de Chrome)
- **Funciona offline** — service worker cachea todo
- **Safe areas** — respeta notch y barra de gestos del Pixel 8a
- **Mismas features** que v4: PRs, 1RM, doble progresión, heatmap, comparador, backup/import, timer

## 🚀 Deploy en 1 minuto

### Opción A: GitHub Pages (gratis, recomendado)

1. Crea un repo en GitHub: `torso-pierna-pwa` (público)
2. Sube **todo el contenido** de esta carpeta a la raíz del repo
3. En el repo: **Settings → Pages → Build and deployment**
   - Source: `Deploy from a branch`
   - Branch: `main` · `/ (root)` → **Save**
4. Espera 1 min → URL: `https://TuUsuario.github.io/torso-pierna-pwa/`

### Opción B: Netlify Drop (sin cuenta)

1. Abre https://app.netlify.com/drop
2. Arrastra la carpeta `registro-gym-pwa` a la página
3. Te da URL al instante: `https://random-name.netlify.app`

### Opción C: Vercel / Cloudflare Pages

Mismo concepto: arrastra la carpeta, obtienes URL HTTPS.

## 📱 Instalar en Pixel 8a

1. Abre la URL en **Chrome** (no en otra app)
2. Espera 2 segundos → aparece un banner **"📲 Instalar app"** arriba
3. Pulsa **Instalar** (o desde menú ⋮ → "Instalar app" / "Add to Home screen")
4. El icono aparece junto a tus apps
5. Ábrelo desde el icono → arranca en modo standalone (sin barra de Chrome)

## 📂 Estructura

```
registro-gym-pwa/
├── index.html              # App completa (HTML + CSS + JS monolítico)
├── manifest.webmanifest    # PWA manifest
├── sw.js                   # Service worker (offline cache)
├── icon-192.png            # Icono 192×192
├── icon-512.png            # Icono 512×512
├── icon-maskable-512.png   # Icono safe-zone Android
├── icon.svg                # Fuente vectorial
└── README.md               # Este archivo
```

## 🛠️ Personalización

- **Colores**: edita las variables `--bg`, `--torsoA`, etc. en el `:root` del `<style>` en `index.html`
- **Rutinas**: edita el objeto `ROUTINES` en el `<script>` de `index.html`
- **Sesiones históricas**: edita el array `HISTORICAL_SESSIONS` (solo se cargan la primera vez, después se leen de localStorage)

## 🔄 Backup / Restore

La app tiene botones en **Historial**:
- **💾 Descargar backup** → genera JSON con todo (sesiones, drafts, PRs)
- **📥 Importar backup** → selecciona JSON y restaura

Esos backups funcionan idéntico en v4 (desktop) y en PWA (móvil).

## ⚠️ Notas

- **Service Worker** solo se registra en HTTPS o localhost. Por eso necesitas hosting.
- **iOS Safari**: puedes añadir a inicio pero iOS tiene limitaciones de PWA (no hay install prompt propio, el SW tiene comportamiento reducido). El target es Android Chrome.
- Si actualizas `index.html`, los usuarios deben recargar dos veces (la primera activa el SW nuevo, la segunda sirve desde caché).
- Si algo falla, sube versión: cambia `CACHE = 'tp-pwa-v1'` a `v2` en `sw.js` para invalidar cachés viejos.

## 🐛 Troubleshooting

**El banner "Instalar app" no aparece**
- Necesitas HTTPS (no `file://`)
- Chrome puede tardar hasta 30s en evaluar los criterios
- Si ya está instalada, no aparece
- Prueba menú ⋮ → "Instalar app" manualmente

**El service worker no se registra**
- Abre DevTools → Application → Service Workers
- Si está en rojo, mira la consola
- HTTPS requerido

**No se ve el bottom nav**
- Solo aparece en pantallas ≤ 768px de ancho
- En escritorio usa las tabs de arriba (intencional)
