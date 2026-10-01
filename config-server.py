import http.server
import socketserver
import os

PORT = 8765
DIRECTORY = os.path.join(os.path.dirname(__file__), 'config')

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Permite peticiones CORS desde la extensión
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
        print(f"Servidor de configuración activo en http://localhost:{PORT}")
        httpd.serve_forever()