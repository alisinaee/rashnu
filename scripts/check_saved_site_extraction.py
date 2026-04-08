#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SAVED = ROOT / "saved_sites"


def normalize_ws(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def find(pattern: str, text: str) -> str:
    match = re.search(pattern, text, re.S)
    return normalize_ws(match.group(1)) if match else ""


def report_file(path: Path) -> None:
    text = path.read_text(encoding="utf-8", errors="ignore")
    title = ""
    current_price = ""
    original_price = ""
    discount = ""

    if "دیجی_کالا" in path.name:
        title = find(r"<h1[^>]*>(.*?)</h1>", text)
        current_price = find(r'data-testid="price-final"[^>]*>(.*?)</span>', text) or find(
            r'data-testid="price-no-discount"[^>]*>(.*?)</(?:span|div)>', text
        )
        original_price = find(r'data-testid="price-no-discount"[^>]*>(.*?)</(?:span|div)>', text)
        discount = find(r'data-testid="price-discount-percent"[^>]*>(.*?)</span>', text)
    elif "ترب" in path.name:
        title = find(r"<h1[^>]*>(.*?)</h1>", text)
        current_price = find(r"خرید از .*?([۰-۹0-9][۰-۹0-9٬,\.]+(?:\s*تومان)?)", text)
    else:
        title = find(r"<title>(.*?)</title>", text)

    print(f"\nFILE: {path.name}")
    print(f"  title: {title or '-'}")
    print(f"  current_price: {current_price or '-'}")
    print(f"  original_price: {original_price or '-'}")
    print(f"  discount: {discount or '-'}")


def main() -> int:
    for path in sorted(SAVED.glob("*.html")):
      report_file(path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
