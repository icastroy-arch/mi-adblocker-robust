from http.server import HTTPServer, BaseHTTPRequestHandler
import json, threading, datetime

ad_reports = []

class ReportHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/report-ad':
            length = int(self.headers.get('Content-Length', 0))
            data = json.loads(self.rfile.read(length))
            ad_reports.append(data)
            print(f"🚨 [{datetime.datetime.now():%H:%M:%S}] "
                  f"Reporte desde navegador: {data['adType']} "
                  f"en {data.get('videoId') or data['url']}")
            # TODO: aquí puedes agregar el selector detectado a blocker-config.json
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'{"ok": true}')
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, *args):  # silenciar logs por defecto
        pass

def start_report_server(port=8791):
    server = HTTPServer(('127.0.0.1', port), ReportHandler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    print(f"📡 Servidor de reportes en http://localhost:{port}/report-ad")