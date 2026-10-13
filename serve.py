#!/usr/bin/env python3
"""Servidor local de la demo.

- Sirve el sitio estático desde esta carpeta.
- /en/... usa los mismos archivos (el idioma se resuelve en el navegador).
- Rutas que aún no existen en la demo muestran 404.html.
- El buscador (/yates, /yates/usados, /promociones y categorías) usa buscador/plantilla.html.
- /yate/{id}/{slug} usa ficha/plantilla.html (yates del inventario y modelos nuevos).
- /marca/{id}/{slug} usa la plantilla marca/plantilla.html (la llena main.js).
- Resuelve includes estilo SSI (<!--#include virtual="/partials/x.html" -->)
  para compartir encabezado, menú y footer entre páginas.
Uso:  python3 serve.py [puerto]
"""
import http.server, os, re, sys
from urllib.parse import urlsplit, unquote

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080


SEARCH_PATHS = {
    "/yates", "/yates/usados", "/promociones", "/yates/motor", "/yates/veleros",
    "/catamaranes/vela", "/catamaranes/motor", "/yates/electricos", "/suites/flotantes", "/yates/anfibios",
}
INCLUDE = re.compile(r'<!--#include virtual="([^"]+)" -->')


def _read(path):
    with open(os.path.join(ROOT, path.lstrip("/")), encoding="utf-8") as f:
        return f.read()


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def end_headers(self):
        self.send_header("X-Robots-Tag", "noindex, nofollow")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def _resolve(self):
        path = unquote(urlsplit(self.path).path)
        if path == "/en" or path.startswith("/en/"):
            path = path[3:] or "/"
        local = os.path.normpath(os.path.join(ROOT, path.lstrip("/")))
        if not local.startswith(ROOT):
            return None
        if path.rstrip("/") in SEARCH_PATHS:
            return os.path.join(ROOT, "buscador", "plantilla.html")
        if re.fullmatch(r"/yate/\d+/[^/]+/?", path):
            return os.path.join(ROOT, "ficha", "plantilla.html")
        if re.fullmatch(r"/marca/\d+/[^/]+/?", path) and not os.path.isdir(local):
            return os.path.join(ROOT, "marca", "plantilla.html")
        if os.path.isdir(local):
            local = os.path.join(local, "index.html")
        elif not os.path.exists(local) and os.path.exists(local + ".html"):
            local += ".html"
        return local if os.path.isfile(local) else None

    def do_GET(self):
        local = self._resolve()
        if local is None:
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            with open(os.path.join(ROOT, "404.html"), "rb") as f:
                self.wfile.write(f.read())
            return
        if local.endswith(".html"):
            with open(local, encoding="utf-8") as f:
                html = INCLUDE.sub(lambda m: _read(m.group(1)), f.read())
            body = html.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        self.path = "/" + os.path.relpath(local, ROOT)
        super().do_GET()


if __name__ == "__main__":
    http.server.ThreadingHTTPServer.allow_reuse_address = True
    with http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler) as httpd:
        print(f"Demo Yachtcancun en http://localhost:{PORT}")
        httpd.serve_forever()
