# Appends each POST body as one line to the file given as argv[1].
# Exits by itself after argv[2] seconds (if given), so a collector never
# outlives its run even when the calling script is interrupted.
import signal, sys
from http.server import BaseHTTPRequestHandler, HTTPServer
OUT = sys.argv[1]
if len(sys.argv) > 2:
    # Exit 0 from the handler: SIGALRM's default action would make the
    # shell print "Alarm clock" as if the run had failed.
    signal.signal(signal.SIGALRM, lambda *_: sys.exit(0))
    signal.alarm(int(sys.argv[2]))
class H(BaseHTTPRequestHandler):
    def do_POST(self):
        body = self.rfile.read(int(self.headers.get("Content-Length", 0))).decode()
        with open(OUT, "a") as f:
            f.write(body + "\n")
        self.send_response(204); self.end_headers()
    def log_message(self, *a): pass
HTTPServer(("127.0.0.1", 8765), H).serve_forever()
