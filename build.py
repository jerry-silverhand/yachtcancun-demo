#!/usr/bin/env python3
"""Genera la versión estática de la demo en dist/ (para GitHub Pages u otro hosting).

Hace lo mismo que serve.py pero por adelantado:
- Resuelve los includes (<!--#include virtual="/partials/x.html" -->).
- Crea una carpeta con index.html para cada ruta dinámica: fichas de yate y modelo,
  páginas de marca y variantes del buscador.
- Duplica todo bajo /en/ (el idioma se resuelve en el navegador).
- Si existe un archivo CNAME en la raíz del proyecto, lo copia para el dominio propio.

Uso:  python3 build.py
"""
import json, os, re, shutil

ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, "dist")
INCLUDE = re.compile(r'<!--#include virtual="([^"]+)" -->')
STATIC = ["assets", "data", "i18n", "robots.txt"]
SEARCH_PATHS = [
    "/yates", "/yates/usados", "/promociones", "/yates/motor", "/yates/veleros",
    "/catamaranes/vela", "/catamaranes/motor", "/yates/electricos", "/suites/flotantes", "/yates/anfibios",
]


def read(rel):
    with open(os.path.join(ROOT, rel.lstrip("/")), encoding="utf-8") as f:
        return f.read()


def render(rel):
    return INCLUDE.sub(lambda m: read(m.group(1)), read(rel))


def write(route, html):
    """Escribe la página en la ruta y su espejo en /en/."""
    for prefix in ("", "/en"):
        path = (prefix + route).strip("/")
        out = os.path.join(DIST, path, "index.html") if path else os.path.join(DIST, "index.html")
        os.makedirs(os.path.dirname(out), exist_ok=True)
        with open(out, "w", encoding="utf-8") as f:
            f.write(html)


def main():
    shutil.rmtree(DIST, ignore_errors=True)
    os.makedirs(DIST)
    for item in STATIC:
        src = os.path.join(ROOT, item)
        dst = os.path.join(DIST, item)
        shutil.copytree(src, dst) if os.path.isdir(src) else shutil.copy2(src, dst)

    pages = 0
    # Páginas fijas
    for route, tpl in [("/", "index.html"), ("/vendemibarco", "vendemibarco/index.html"), ("/yates/nuevos", "yates/nuevos/index.html")]:
        write(route, render(tpl)); pages += 2

    # Buscador y sus variantes
    buscador = render("buscador/plantilla.html")
    for route in SEARCH_PATHS:
        write(route, buscador); pages += 2

    # Fichas: yates del inventario y modelos nuevos
    ficha = render("ficha/plantilla.html")
    items = json.loads(read("data/listings.json")) + json.loads(read("data/modelos.json"))
    for x in items:
        write(f"/yate/{x['id']}/{x['slug']}", ficha); pages += 2

    # Páginas de marca
    marca = render("marca/plantilla.html")
    for m in json.loads(read("data/marcas.json")):
        write(f"/marca/{m['id']}/{m['slug']}", marca); pages += 2

    # 404 ("en construcción") y archivos para GitHub Pages
    with open(os.path.join(DIST, "404.html"), "w", encoding="utf-8") as f:
        f.write(read("404.html"))
    open(os.path.join(DIST, ".nojekyll"), "w").close()
    if os.path.exists(os.path.join(ROOT, "CNAME")):
        shutil.copy2(os.path.join(ROOT, "CNAME"), os.path.join(DIST, "CNAME"))

    print(f"dist/ lista: {pages} páginas (ES + EN)")


if __name__ == "__main__":
    main()
