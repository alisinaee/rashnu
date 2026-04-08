# itsMajid-dev/torobot

- Source: https://github.com/itsMajid-dev/torobot
- Local folder: `research/repos/torobot`
- Type: `sdk`
- Language: `Python`

This repo aims to be a broad Torob client with search, seller details, suggestions, similar products, and export helpers.

## Evidence

- README advertises search, seller contact extraction, and multiple export formats.
- `torob.py` builds requests against `https://api.torob.com/v4/base-product/search/` and several follow-up URLs.
- Import failed in two ways:
  - Direct module import failed with `ImportError: attempted relative import with no known parent package`
  - Package import failed with `ModuleNotFoundError: No module named 'parse_web'`
- In the user's no-VPN recheck, PyPI downloads also timed out while preparing dependencies, so local installability is additionally unreliable.
- Live API access itself still works from the environment, so the failure is inside the package, not the network.

## Result

- Install Status: `failed`
- Run Status: `failed`
- Useful For Chrome MVP: `medium`
- Reuse Decision: `reference`

## Notes

- The feature surface is interesting, especially seller/contact helpers.
- The current package state is broken, and the README already warns that Torob API policy changes may have broken the library.
- The no-VPN run confirms Torob reachability but does not rescue the package itself; `parse_web` is still a real code issue.
