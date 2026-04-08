# jamshidi799/digi-bot

- Source: https://github.com/jamshidi799/digi-bot
- Local folder: `research/repos/digi-bot`
- Type: `telegram_bot`
- Language: `Go`

This repo is a Telegram-based price monitoring bot for Digikala and Torob.

## Evidence

- README says it notifies users when prices change for Digikala and Torob products.
- The repo contains two Go modules under `digi-bot/` and `search/`.
- Local environment does not have Go installed.

## Result

- Install Status: `blocked_tooling`
- Run Status: `blocked`
- Useful For Chrome MVP: `low`
- Reuse Decision: `discard`

## Notes

- This is useful conceptually for monitoring flows, not for an in-page comparison extension.
- The missing Go toolchain is a blocker, but even with it this repo is not close to the planned product shape.
