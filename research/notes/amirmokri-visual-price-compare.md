# amirmokri/visual-price-compare

- Source: https://github.com/amirmokri/visual-price-compare
- Local folder: `research/repos/visual-price-compare`
- Type: `other`
- Language: `Python`

This is a large Django app for image-based price comparison across Digikala and Torob.

## Evidence

- README describes a stack with Django, DRF, MySQL, Redis, Celery, FAISS, OpenCLIP, Playwright, and Docker.
- README prerequisites require `Docker & Docker Compose`, `Python 3.11+`, and `MySQL 8.0+`.
- `requirements.txt` includes heavy dependencies like `mysqlclient`, `playwright`, `torch`, `torchvision`, and `faiss-cpu`.
- Local environment lacks Docker and is on Python 3.9.6.

## Result

- Install Status: `blocked_tooling`
- Run Status: `blocked`
- Useful For Chrome MVP: `medium`
- Reuse Decision: `reference`

## Notes

- Strong source of architecture ideas for multi-source comparison, scraping, and ranking.
- Too heavy to reuse directly for a first Chrome extension MVP.
