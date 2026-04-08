# moein72002/AI_Shopping_Assistant

- Source: https://github.com/moein72002/AI_Shopping_Assistant
- Local folder: `research/repos/AI_Shopping_Assistant`
- Type: `other`
- Language: `Python`

This is a hackathon-style Torob assistant backend with BM25, SQL, image search, and LLM routing.

## Evidence

- README requires `Python 3.11+`.
- README also requires `OPENAI_API_KEY`, `TOROB_PROXY_URL`, and optionally Kaggle credentials plus dataset files under `/datasets`.
- `requirements.txt` is very heavy and includes Torch, FAISS, FastAPI, Streamlit, and many pinned packages.
- The repo is Torob-only and does not target Digikala page extraction or browser injection.

## Result

- Install Status: `blocked_tooling`
- Run Status: `blocked`
- Useful For Chrome MVP: `low`
- Reuse Decision: `discard`

## Notes

- The BM25 and comparison ideas may be useful later if the project grows into a richer backend.
- It is not a practical first-pass dependency for the extension MVP.
