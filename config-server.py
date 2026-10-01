import http.server
import socketserver
import os

PORT = 8765
CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'config', 'blocker-config.json')

class ConfigHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Permitir peticiones a /config o /blocker-config.json
        if self.path in ['/config', '/blocker-config.json', '/config/blocker-config.json']:
            if os.path.exists(CONFIG_PATH):
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                with open(CONFIG_PATH, 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self.send_error(404, "File not found: blocker-config.json no existe en /config")
        else:
            self.send_error(404, "Endpoint no valido")

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), ConfigHandler) as httpd:
        print(f"Servidor activo y escuchando en http://localhost:{PORT}/config")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor detenido.")