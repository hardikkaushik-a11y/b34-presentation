#!/usr/bin/env python3
"""Serve the live web/ directory publicly, with the private paths refused.

serve.py is fine on localhost. Exposed through a tunnel it is not: a plain static
server hands out everything under the directory, and build/backup/ holds the
unscrubbed project.js with the client's real name and phone number. That file is
gitignored precisely so it never goes public, and a tunnel would have undone that.

Serving the live tree rather than a copy is deliberate - edits appear immediately,
which is the point of hosting it this way.

  python3 serve_public.py [PORT]
"""
import re, sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

# Anything matching these never leaves the machine.
DENY = re.compile(r"""
    (^|/) build(/|$)        # pipeline, backups, panoramas, extracted .skp material
  | (^|/) \.git(/|$)
  | (^|/) \.claude(/|$)
  | (^|/) \.                # any dotfile
  | \.bak\d*$
  | \.glb\.js$              # 46 MB of base64 twins, only needed for file://
  | serve(_public)?\.py$
""", re.X)


class Handler(SimpleHTTPRequestHandler):
    def _blocked(self):
        return bool(DENY.search(self.path.split("?", 1)[0].lstrip("/")))

    def do_GET(self):
        if self._blocked():
            self.send_error(404, "Not found")
            return
        super().do_GET()

    def do_HEAD(self):
        if self._blocked():
            self.send_error(404, "Not found")
            return
        super().do_HEAD()

    def end_headers(self):
        # live edits should show up on reload, not from cache
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("X-Robots-Tag", "noindex, nofollow")
        super().end_headers()

    def log_message(self, *a):
        pass


port = int(sys.argv[1]) if len(sys.argv) > 1 else 8747
print(f"serving live web/ on :{port}, private paths refused", flush=True)
ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
