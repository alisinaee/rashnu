# AmirAref/Torobot

- Source: https://github.com/AmirAref/Torobot
- Local folder: `research/repos/Torobot-telegram`
- Type: `telegram_bot`
- Language: `Python`

This repo is a Telegram inline bot, but its internal Torob API model is relatively clean and is the most reusable part.

## Evidence

- `Torob/api.py` defines a `Card` Pydantic model and `get_torob_cards(query, count)` against `https://api.torob.com/v4/base-product/search/`.
- `bot.py` requires Telegram bot credentials for the actual bot runtime.
- `pyproject.toml` explicitly requires `python >= 3.10`.
- In the user's no-VPN recheck, the repo could not be validated because dependency downloads from PyPI timed out.
- Earlier testing showed the helper code expects a newer Python runtime and modern dependencies.

## Result

- Install Status: `failed`
- Run Status: `failed`
- Useful For Chrome MVP: `medium`
- Reuse Decision: `reference`

## Notes

- The Torob card mapping is compact and worth referencing.
- The bot shell is not useful for the extension MVP.
- This repo and `itsMajid-dev/torobot` also collide by folder name on a case-insensitive filesystem, so they need distinct local clone names.
- The current failure signal is environment-heavy, so this should be treated as an unvalidated reference rather than proven-broken application code.
