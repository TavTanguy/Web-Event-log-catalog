from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse
import importDataset
import json
import sys

config = json.load(open("./configs/devConfig.json" if len(sys.argv) < 2 else sys.argv[1]))
HOST = config["python-server"]["host"]
PORT = config["python-server"]["port"]

class SimpleHTTPRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'Hello, world!')

    def do_POST(self):
        if self.path != "/importDataset":
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'Route not found')
            return 
        content_length = int(self.headers['Content-Length'])
        body = self.rfile.read(content_length)
        body = urllib.parse.parse_qs(body.decode('utf-8'))
        link_global = None
        if "link_global" in body:
            link_global = body["linkGlobal"][0]

        print(config["uploadFile"]["path"] + body["path"][0])
        res = importDataset(config, config["uploadFile"]["path"] + body["path"][0], body["name"][0], link_global)
        print(str(res))
        self.send_response(200)
        self.end_headers()
        self.wfile.write(json.dumps(res).encode('utf-8'))

server = HTTPServer((HOST, PORT), SimpleHTTPRequestHandler)
print("Server started http://%s:%s" % (HOST, PORT))
server.serve_forever()
server.server_close()