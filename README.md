# Yachtcancun — Demo (Marz Studios)

Sitio de muestra para presentar el rediseño de yachtcancun.com. **No es el sitio oficial.**
Va con `noindex`, `robots.txt` con `Disallow: /` y sin píxeles de terceros.

## Correr en local

```bash
python3 serve.py 8080
```

Abrir http://localhost:8080 (español) o http://localhost:8080/en/ (inglés).
Las rutas que aún no existen en la demo muestran `404.html` ("en construcción").

## Publicar (Cloudflare Pages)

```bash
python3 build.py      # genera dist/ (no se sube al repo)
```

En Cloudflare (Workers & Pages) conectado al repositorio privado: build command `python3 build.py`, deploy command `npx wrangler deploy`.
`wrangler.jsonc` indica que solo se publica `dist/`.

## Estructura

```
index.html            Home
vendemibarco/         Vender mi barco (/vendemibarco)
yates/nuevos/         Comprar: elegir nuevos o usados + marcas representadas
marca/plantilla.html  Página de marca; el servidor la usa para /marca/{id}/{slug}
buscador/plantilla.html  Buscador para /yates, /yates/usados, /promociones y categorías
ficha/plantilla.html  Ficha de yate o modelo nuevo para /yate/{id}/{slug}
assets/docs/          PDF de ejemplo que entrega el modal de brochure
partials/             Encabezado + menú y footer compartidos (includes SSI)
assets/css/main.css   Estilos (tokens en :root)
assets/js/main.js     i18n, render de datos, menú, hero, scroll, formularios
data/*.json           Datos semilla con el modelo de la sección 4 del requerimiento (modelos.json = catálogo de nuevos)
i18n/es.json, en.json Textos por idioma
assets/img            Imágenes guardadas en el proyecto (sitio actual + sitios oficiales de las marcas)
build.py              Genera la versión estática en dist/ para publicar
serve.py              Servidor local: resuelve los includes y sirve /en/ con los mismos archivos
```

## Reglas de la demo que ya se cumplen

- Las URLs replican los patrones de producción: `/yate/{id}/{slug}`, `/marca/{id}/{slug}`, `/broker/{id}/{slug}` y las 7 categorías, con los IDs y slugs reales.
- WhatsApp y formularios no contactan a los brokers reales. El número de demo está en `data/sitio.json` (`whatsapp_demo`).
- Los leads se guardan en `localStorage` (`yc_demo_leads`) con `pagina_origen`, `idioma` y UTM.
- El evento (`data/eventos.json`, `activo: true`) controla la sección, el badge y el pop-up (una vez por sesión).

## Imágenes

- Los listings con `"imagen_origen": "astillero"` usan fotos oficiales del modelo (Astondoa, Mangusta, Arcadia, Iguana, YOT), no de la unidad en venta. En producción conviene sustituirlas por fotos reales de cada unidad.
- Los fondos de las 6 marcas vienen de los sitios oficiales de cada una.
- El video del primer slide del hero es el YouTube oficial de Yachtcancun (`mkhn9YOYhuA`), embebido sin audio vía youtube-nocookie.

- Las galerías de cada yate (`assets/img/yates/{id}/`) son las fotos reales de la unidad tomadas del sitio actual (~900 px). Para producción conviene pedir los originales.
- Las descripciones de los yates solo existen en español en el sitio actual; la versión `/en/` las muestra en español.

## Pendiente del cliente

- Métricas de alcance actualizadas (`data/sitio.json` → `metricas`, `metricas_venta`).
- Líneas y modelos de las marcas distintas de Iguana (hoy solo Iguana está completa en `data/marcas.json` y `data/modelos.json`).
