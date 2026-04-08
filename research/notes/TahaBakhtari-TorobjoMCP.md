# TahaBakhtari/TorobjoMCP

- Source: https://github.com/TahaBakhtari/TorobjoMCP
- Local folder: `research/repos/TorobjoMCP`
- Type: `mcp_server`
- Language: `Python`

This repo combines a Torob search tool with an unrelated Instagram caption extractor behind an MCP server interface.

## Evidence

- `torob_mcp_server.py` implements `search_torob(query, max_items)` by paging through `https://api.torob.com/v4/base-product/search/`.
- The Torob logic is simple and reusable, but the repo has no dependency lockfile and the runtime imports `from mcp.server.fastmcp import FastMCP`.
- Smoke tests failed in two different ways:
  - in one environment: `pip install mcp ...` -> `No matching distribution found for mcp`
  - in the user's no-VPN recheck: dependency download from PyPI timed out before the repo could be tested further

## Result

- Install Status: `failed`
- Run Status: `failed`
- Useful For Chrome MVP: `low`
- Reuse Decision: `reference`

## Notes

- The Torob pagination pattern is useful as a reference.
- The Instagram extraction path is out of scope for the planned Chrome comparison product.
- Between the ambiguous package naming and the PyPI download problems, this is not a safe base to adopt.
