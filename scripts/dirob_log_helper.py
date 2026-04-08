#!/usr/bin/env python3
from __future__ import annotations

import json
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
ARTIFACT_DIR = ROOT / "research" / "artifacts" / "dirob"
LOG_PATH = ARTIFACT_DIR / "dirob-live-log.ndjson"
STATE_PATH = ARTIFACT_DIR / "dirob-state.json"
HOST = "127.0.0.1"
PORT = 45173


def ensure_paths() -> None:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    LOG_PATH.touch(exist_ok=True)
    if not STATE_PATH.exists():
        STATE_PATH.write_text("{}", encoding="utf-8")


def append_logs(entries: list[dict[str, Any]]) -> None:
    ensure_paths()
    with LOG_PATH.open("a", encoding="utf-8") as handle:
        for entry in entries:
            handle.write(json.dumps(entry, ensure_ascii=False) + "\n")


def write_state(payload: dict[str, Any]) -> None:
    ensure_paths()
    STATE_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )


class Handler(BaseHTTPRequestHandler):
    server_version = "DirobLogHelper/1.0"

    def log_message(self, _format: str, *_args: Any) -> None:
        return

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.end_headers()

    def do_GET(self) -> None:
        if self.path != "/health":
            self.respond(HTTPStatus.NOT_FOUND, {"ok": False, "error": "not_found"})
            return

        ensure_paths()
        self.respond(
            HTTPStatus.OK,
            {
                "ok": True,
                "artifact_dir": str(ARTIFACT_DIR),
                "log_path": str(LOG_PATH),
                "state_path": str(STATE_PATH),
            },
        )

    def do_POST(self) -> None:
        content_length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(content_length) if content_length > 0 else b"{}"
        try:
            payload = json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            self.respond(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "invalid_json"})
            return

        if self.path == "/append-log":
            entries = payload.get("entries")
            if not isinstance(entries, list):
                self.respond(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "entries_required"})
                return
            append_logs([entry for entry in entries if isinstance(entry, dict)])
            self.respond(HTTPStatus.OK, {"ok": True, "written": len(entries)})
            return

        if self.path == "/write-state":
            if not isinstance(payload, dict):
                self.respond(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "object_required"})
                return
            write_state(payload)
            self.respond(HTTPStatus.OK, {"ok": True})
            return

        self.respond(HTTPStatus.NOT_FOUND, {"ok": False, "error": "not_found"})

    def respond(self, status: HTTPStatus, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)


def main() -> int:
    ensure_paths()
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Dirob log helper listening on http://{HOST}:{PORT}")
    print(f"Log file: {LOG_PATH}")
    print(f"State file: {STATE_PATH}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
