#!/usr/bin/env python3
"""Local recheck runner for the Torob/Digikala repo benchmark.

Run this script on the target machine *without VPN* to get a reproducible
terminal report plus saved logs under `research/artifacts`.
"""

import argparse
import json
import os
import shlex
import shutil
import socket
import subprocess
import sys
import textwrap
import time
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple


ROOT = Path(__file__).resolve().parents[1]
REPOS_DIR = ROOT / "research" / "repos"
ARTIFACTS_DIR = ROOT / "research" / "artifacts"

VALID_INSTALL = {
    "not_checked",
    "docs_only",
    "installed",
    "blocked_tooling",
    "blocked_credentials",
    "failed",
}

VALID_RUN = {"not_run", "smoke_pass", "partial_pass", "blocked", "failed"}

NETWORK_TARGETS = [
    ("torob-home", "https://torob.com/"),
    (
        "torob-search-api",
        "https://api.torob.com/v4/base-product/search/?page=0&sort=popularity&size=1&query=test&q=test&source=next_desktop",
    ),
    ("digikala-home", "https://www.digikala.com/"),
    ("digikala-search-api", "https://api.digikala.com/v1/search/?q=test&page=1"),
    ("pypi-simple", "https://pypi.org/simple/setuptools/"),
    ("pythonhosted", "https://files.pythonhosted.org/"),
]


def now_stamp() -> str:
    return datetime.now().strftime("%Y%m%d-%H%M%S")


def run_cmd(
    cmd: List[str],
    cwd: Optional[Path] = None,
    timeout: int = 300,
    env: Optional[Dict[str, str]] = None,
) -> Tuple[int, str]:
    merged_env = os.environ.copy()
    if env:
        merged_env.update(env)
    proc = subprocess.run(
        cmd,
        cwd=str(cwd) if cwd else None,
        env=merged_env,
        capture_output=True,
        text=True,
        timeout=timeout,
    )
    output = (proc.stdout or "") + (proc.stderr or "")
    return proc.returncode, output


def run_cmd_safe(
    cmd: List[str],
    cwd: Optional[Path] = None,
    timeout: int = 300,
    env: Optional[Dict[str, str]] = None,
) -> Tuple[int, str]:
    try:
        return run_cmd(cmd, cwd=cwd, timeout=timeout, env=env)
    except subprocess.TimeoutExpired as exc:
        return 124, f"timeout after {timeout}s: {' '.join(shlex.quote(part) for part in cmd)}"


def tool_exists(name: str) -> bool:
    return shutil.which(name) is not None


def short(text: str, limit: int = 180) -> str:
    text = " ".join(text.strip().split())
    if len(text) <= limit:
        return text
    return text[: limit - 3] + "..."


def slugify(repo: str) -> str:
    return repo.replace("/", "__")


def python_version_tuple() -> Tuple[int, int, int]:
    return sys.version_info[:3]


def create_venv(base_dir: Path, name: str) -> Tuple[Path, Path]:
    venv_dir = base_dir / "venvs" / name
    python_bin = venv_dir / "bin" / "python"
    if not python_bin.exists():
        code, output = run_cmd(
            [sys.executable, "-m", "venv", "--system-site-packages", str(venv_dir)],
            timeout=180,
        )
        if code != 0:
            raise RuntimeError(output)
    pip_bin = venv_dir / "bin" / "pip"
    return python_bin, pip_bin


def can_import_with_python(python_bin: str, module: str) -> bool:
    code, _ = run_cmd([python_bin, "-c", f"import {module}"], timeout=30)
    return code == 0


def pip_failure_reason(output: str) -> str:
    lower = output.lower()
    if "files.pythonhosted.org" in lower or "pypi.org" in lower or "read timed out" in lower or "connect timeout" in lower:
        return "dependency download from PyPI failed"
    if "no matching distribution found" in lower or "could not find a version that satisfies the requirement" in lower:
        return "dependency not available for this interpreter/platform"
    return "dependency install failed"


def write_log(base_dir: Path, name: str, content: str) -> Path:
    path = base_dir / f"{name}.log"
    path.write_text(content, encoding="utf-8")
    return path


def make_result(
    repo: str,
    install_status: str,
    run_status: str,
    summary: str,
    details: List[str],
    log_path: Optional[Path] = None,
) -> Dict[str, object]:
    if install_status not in VALID_INSTALL:
        raise ValueError(f"invalid install_status: {install_status}")
    if run_status not in VALID_RUN:
        raise ValueError(f"invalid run_status: {run_status}")
    return {
        "repo": repo,
        "install_status": install_status,
        "run_status": run_status,
        "summary": summary,
        "details": details,
        "log_path": str(log_path) if log_path else None,
    }


def probe_network(output_dir: Path) -> List[Dict[str, object]]:
    results = []
    for name, url in NETWORK_TARGETS:
        host = url.split("/")[2]
        detail_lines: List[str] = []
        try:
            addresses = sorted({item[4][0] for item in socket.getaddrinfo(host, 443, proto=socket.IPPROTO_TCP)})
            detail_lines.append(f"dns={','.join(addresses[:4])}")
        except socket.gaierror as exc:
            detail_lines.append(f"dns_error={exc}")

        if tool_exists("curl"):
            cmd = [
                "curl",
                "-sS",
                "-L",
                "-o",
                "/dev/null",
                "-w",
                "http_code=%{http_code} remote_ip=%{remote_ip} total=%{time_total}",
                url,
            ]
            code, output = run_cmd_safe(cmd, timeout=45)
            status = "ok" if code == 0 else "error"
            detail_lines.append(short(output))
        else:
            status = "skipped"
            detail_lines.append("curl not found")

        results.append({"name": name, "url": url, "status": status, "details": detail_lines})

    network_log = output_dir / "network.json"
    network_log.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    return results


def repo_torob_integration(output_dir: Path) -> Dict[str, object]:
    repo = "hamidrezafarzin/Torob-Integration"
    log_name = slugify(repo)
    details: List[str] = []
    chunks: List[str] = []
    try:
        direct_script = textwrap.dedent(
            """
            import sys
            sys.path.insert(0, 'research/repos/Torob-Integration/src')
            from torob_integration.api import Torob
            api = Torob()
            search = api.search('گوشی a55')
            print({
                'search_count': len(search['results']),
                'first_name': search['results'][0]['name1'],
                'has_prk': 'prk' in search['results'][0],
                'has_search_id': 'search_id' in search['results'][0],
            })
            item = search['results'][1]
            details = api.details(item['prk'], item['search_id'])
            print({
                'detail_name': item['name1'],
                'shop_text': details.get('shop_text'),
                'offer_count': len(details['products_info']['result']),
            })
            """
        )
        if can_import_with_python(sys.executable, "requests"):
            code, output = run_cmd([sys.executable, "-c", direct_script], cwd=ROOT, timeout=120)
            chunks.append("$ python3 -c <torob_integration direct smoke test>\n" + output)
            log_path = write_log(output_dir, log_name, "\n\n".join(chunks))
            if code == 0:
                details.append("direct import smoke test passed without pip install")
                return make_result(repo, "installed", "smoke_pass", "search and details calls succeeded", details, log_path)

        py_bin, pip_bin = create_venv(output_dir, "torob-integration")
        code, output = run_cmd(
            [str(pip_bin), "install", "-q", "--no-build-isolation", "-e", str(REPOS_DIR / "Torob-Integration")],
            timeout=240,
        )
        chunks.append("$ pip install -q --no-build-isolation -e research/repos/Torob-Integration\n" + output)
        if code != 0:
            log_path = write_log(output_dir, log_name, "\n\n".join(chunks))
            return make_result(repo, "failed", "failed", pip_failure_reason(output), details, log_path)

        code, output = run_cmd([str(py_bin), "-c", direct_script], cwd=ROOT, timeout=120)
        chunks.append("$ python -c <torob_integration smoke test>\n" + output)
        if code == 0:
            details.append("search/details smoke test passed")
            log_path = write_log(output_dir, log_name, "\n\n".join(chunks))
            return make_result(repo, "installed", "smoke_pass", "search and details calls succeeded", details, log_path)

        log_path = write_log(output_dir, log_name, "\n\n".join(chunks))
        return make_result(repo, "installed", "failed", "installed but smoke test failed", details, log_path)
    except Exception as exc:
        chunks.append(f"runner_error={exc}")
        log_path = write_log(output_dir, log_name, "\n\n".join(chunks))
        return make_result(repo, "failed", "failed", f"runner exception: {exc}", details, log_path)


def repo_torobjomcp(output_dir: Path) -> Dict[str, object]:
    repo = "TahaBakhtari/TorobjoMCP"
    log_name = slugify(repo)
    details: List[str] = []
    chunks: List[str] = []
    try:
        py_bin, pip_bin = create_venv(output_dir, "torobjomcp")
        install_cmd = [
            str(pip_bin),
            "install",
            "-q",
            "requests",
            "python-dotenv",
            "selenium",
            "webdriver-manager",
            "mcp",
            "fastmcp",
        ]
        code, output = run_cmd(install_cmd, timeout=240)
        chunks.append("$ " + " ".join(shlex.quote(part) for part in install_cmd) + "\n" + output)
        if code != 0:
            details.append("dependency install failed")
            log_path = write_log(output_dir, log_name, "\n\n".join(chunks))
            return make_result(repo, "failed", "failed", pip_failure_reason(output), details, log_path)

        script = textwrap.dedent(
            """
            import asyncio
            import sys
            sys.path.insert(0, 'research/repos/TorobjoMCP')
            from torob_mcp_server import search_torob
            result = asyncio.run(search_torob('گوشی a55', 3))
            print(result[:1])
            """
        )
        code, output = run_cmd([str(py_bin), "-c", script], cwd=ROOT, timeout=120)
        chunks.append("$ python -c <torobjomcp smoke test>\n" + output)
        log_path = write_log(output_dir, log_name, "\n\n".join(chunks))
        if code == 0:
            return make_result(repo, "installed", "smoke_pass", "dependency install and Torob search passed", details, log_path)
        return make_result(repo, "installed", "failed", "dependencies installed but smoke test failed", details, log_path)
    except Exception as exc:
        chunks.append(f"runner_error={exc}")
        log_path = write_log(output_dir, log_name, "\n\n".join(chunks))
        return make_result(repo, "failed", "failed", f"runner exception: {exc}", details, log_path)


def repo_torobot_sdk(output_dir: Path) -> Dict[str, object]:
    repo = "itsMajid-dev/torobot"
    log_name = slugify(repo)
    details: List[str] = []
    chunks: List[str] = []
    try:
        direct_script = textwrap.dedent(
            """
            import sys
            sys.path.insert(0, 'research/repos')
            import torobot
            print('import_ok')
            s = torobot.Search('گوشی a55', number=5, unknown=True)
            print({'count': len(s), 'min_price': s.min_price})
            """
        )
        if (
            can_import_with_python(sys.executable, "pandas")
            and can_import_with_python(sys.executable, "bs4")
            and can_import_with_python(sys.executable, "requests")
        ):
            code, output = run_cmd([sys.executable, "-c", direct_script], cwd=ROOT, timeout=120)
            chunks.append("$ python3 -c <torobot sdk direct smoke test>\n" + output)
            log_path = write_log(output_dir, log_name, "\n\n".join(chunks))
            if code == 0:
                details.append("direct import smoke test passed without pip install")
                return make_result(repo, "installed", "smoke_pass", "package import and search passed", details, log_path)

        py_bin, pip_bin = create_venv(output_dir, "itsmajid-torobot")
        install_cmd = [str(pip_bin), "install", "-q", "pandas", "beautifulsoup4", "requests"]
        code, output = run_cmd(install_cmd, timeout=240)
        chunks.append("$ " + " ".join(shlex.quote(part) for part in install_cmd) + "\n" + output)
        if code != 0:
            log_path = write_log(output_dir, log_name, "\n\n".join(chunks))
            reason = pip_failure_reason(output)
            status = "blocked_tooling" if "interpreter/platform" in reason else "failed"
            run_status = "blocked" if status == "blocked_tooling" else "failed"
            return make_result(repo, status, run_status, reason, details, log_path)

        code, output = run_cmd([str(py_bin), "-c", direct_script], cwd=ROOT, timeout=120)
        chunks.append("$ python -c <torobot sdk smoke test>\n" + output)
        log_path = write_log(output_dir, log_name, "\n\n".join(chunks))
        if code == 0:
            return make_result(repo, "installed", "smoke_pass", "package import and search passed", details, log_path)
        return make_result(repo, "failed", "failed", "package import or search failed", details, log_path)
    except Exception as exc:
        chunks.append(f"runner_error={exc}")
        log_path = write_log(output_dir, log_name, "\n\n".join(chunks))
        return make_result(repo, "failed", "failed", f"runner exception: {exc}", details, log_path)


def repo_torobot_telegram(output_dir: Path) -> Dict[str, object]:
    repo = "AmirAref/Torobot"
    log_name = slugify(repo)
    details: List[str] = []
    chunks: List[str] = []
    if python_version_tuple() < (3, 10, 0):
        details.append("current interpreter is below the repo requirement of Python 3.10")
        log_path = write_log(output_dir, log_name, f"python_version={platform_string()}\n")
        return make_result(repo, "blocked_tooling", "blocked", "requires Python >= 3.10", details, log_path)

    try:
        direct_script = textwrap.dedent(
            """
            import sys
            sys.path.insert(0, 'research/repos/Torobot-telegram')
            from Torob.api import get_torob_cards
            cards = get_torob_cards('گوشی a55', count=3)
            print({'count': len(cards), 'first_name': cards[0].name1})
            """
        )
        if can_import_with_python(sys.executable, "requests") and can_import_with_python(sys.executable, "pydantic"):
            code, output = run_cmd([sys.executable, "-c", direct_script], cwd=ROOT, timeout=120)
            chunks.append("$ python3 -c <telegram helper direct smoke test>\n" + output)
            log_path = write_log(output_dir, log_name, "\n\n".join(chunks))
            if code == 0:
                details.append("direct helper smoke test passed without pip install")
                return make_result(repo, "installed", "smoke_pass", "Torob helper import and search passed", details, log_path)

        py_bin, pip_bin = create_venv(output_dir, "torobot-telegram")
        install_cmd = [str(pip_bin), "install", "-q", "requests", "pydantic>=2.8.2"]
        code, output = run_cmd(install_cmd, timeout=240)
        chunks.append("$ " + " ".join(shlex.quote(part) for part in install_cmd) + "\n" + output)
        if code != 0:
            log_path = write_log(output_dir, log_name, "\n\n".join(chunks))
            return make_result(repo, "failed", "failed", pip_failure_reason(output), details, log_path)

        code, output = run_cmd([str(py_bin), "-c", direct_script], cwd=ROOT, timeout=120)
        chunks.append("$ python -c <telegram helper smoke test>\n" + output)
        log_path = write_log(output_dir, log_name, "\n\n".join(chunks))
        if code == 0:
            return make_result(repo, "installed", "smoke_pass", "Torob helper import and search passed", details, log_path)
        return make_result(repo, "installed", "failed", "support helper import or search failed", details, log_path)
    except Exception as exc:
        chunks.append(f"runner_error={exc}")
        log_path = write_log(output_dir, log_name, "\n\n".join(chunks))
        return make_result(repo, "failed", "failed", f"runner exception: {exc}", details, log_path)


def repo_scraper_php(output_dir: Path) -> Dict[str, object]:
    repo = "xmrrabbitx/scraper"
    log_name = slugify(repo)
    details = []
    missing = [tool for tool in ("php", "composer") if not tool_exists(tool)]
    if missing:
        details.append("missing tools: " + ", ".join(missing))
        log_path = write_log(output_dir, log_name, "missing_tools=" + ",".join(missing) + "\n")
        return make_result(repo, "blocked_tooling", "blocked", "PHP/Composer are required", details, log_path)
    log_path = write_log(output_dir, log_name, "php and composer found; deep test not implemented in this runner\n")
    return make_result(repo, "not_checked", "not_run", "tooling exists but repo-specific deep test was not implemented", details, log_path)


def repo_torob_sync(output_dir: Path) -> Dict[str, object]:
    repo = "torob/Torob-Sync"
    log_name = slugify(repo)
    docs = [
        REPOS_DIR / "Torob-Sync" / "product_api_v3.md",
        REPOS_DIR / "Torob-Sync" / "torob_api_token_guide.md",
        REPOS_DIR / "Torob-Sync" / "product_webhook.md",
    ]
    found = [path.name for path in docs if path.exists()]
    log_path = write_log(output_dir, log_name, "docs_found=" + ",".join(found) + "\n")
    return make_result(repo, "docs_only", "not_run", "official docs repo detected", [f"docs found: {', '.join(found)}"], log_path)


def repo_visual_price_compare(output_dir: Path) -> Dict[str, object]:
    repo = "amirmokri/visual-price-compare"
    log_name = slugify(repo)
    missing = []
    if python_version_tuple() < (3, 11, 0):
        missing.append("Python>=3.11")
    for tool in ("docker",):
        if not tool_exists(tool):
            missing.append(tool)
    details = ["README requires Docker, MySQL, Redis, and Python 3.11+"] if missing else []
    log_path = write_log(output_dir, log_name, "missing_prereqs=" + ",".join(missing) + "\n")
    if missing:
        return make_result(repo, "blocked_tooling", "blocked", "heavy stack prerequisites are missing", details, log_path)
    return make_result(repo, "not_checked", "not_run", "prereqs present but deep smoke test intentionally skipped", details, log_path)


def repo_extension_reference(output_dir: Path) -> Dict[str, object]:
    repo = "amiralibg/Digikala-Torob-Price-Finder"
    log_name = slugify(repo)
    manifest = REPOS_DIR / "Digikala-Torob-Price-Finder" / "chrome" / "manifest.json"
    data = json.loads(manifest.read_text(encoding="utf-8"))
    details = [
        f"manifest_version={data.get('manifest_version')}",
        f"host_permissions={len(data.get('host_permissions', []))}",
        f"background={data.get('background', {}).get('service_worker')}",
    ]
    log_path = write_log(output_dir, log_name, json.dumps(data, ensure_ascii=False, indent=2))
    return make_result(repo, "docs_only", "not_run", "static extension inspection completed", details, log_path)


def repo_digi_bot(output_dir: Path) -> Dict[str, object]:
    repo = "jamshidi799/digi-bot"
    log_name = slugify(repo)
    details = []
    if not tool_exists("go"):
        details.append("missing tool: go")
        log_path = write_log(output_dir, log_name, "missing_tools=go\n")
        return make_result(repo, "blocked_tooling", "blocked", "Go toolchain is required", details, log_path)
    log_path = write_log(output_dir, log_name, "go found; deep build not implemented in this runner\n")
    return make_result(repo, "not_checked", "not_run", "Go exists but deep smoke test was not implemented", details, log_path)


def repo_mrp_price_scout(output_dir: Path) -> Dict[str, object]:
    repo = "ahmadsalamifar/mrp_price_scout"
    log_name = slugify(repo)
    details = ["repo is an Odoo 19 Enterprise module"]
    log_path = write_log(output_dir, log_name, "requires_odoo=19-enterprise\n")
    return make_result(repo, "blocked_tooling", "blocked", "Odoo runtime is required", details, log_path)


def repo_torob_scraper_pro(output_dir: Path) -> Dict[str, object]:
    repo = "imanbahmani/TorobScraperPro"
    log_name = slugify(repo)
    missing = []
    xray_path = os.environ.get("XRAY_BIN", "/opt/torob-crawler/xray/xray")
    if not Path(xray_path).exists():
        missing.append(f"XRAY_BIN:{xray_path}")
    curl_impersonate = Path("/usr/local/bin/curl_chrome116")
    if not curl_impersonate.exists():
        missing.append("curl_chrome116")
    subscriptions = REPOS_DIR / "TorobScraperPro" / "subscriptions.txt"
    if not subscriptions.read_text(encoding="utf-8").strip():
        missing.append("subscriptions.txt content")
    details = ["proxy-based crawler; expects xray and subscription feeds"]
    log_path = write_log(output_dir, log_name, "missing_prereqs=" + ",".join(missing) + "\n")
    if missing:
        return make_result(repo, "blocked_tooling", "blocked", "proxy crawler prerequisites are missing", details, log_path)
    return make_result(repo, "not_checked", "not_run", "prereqs present but deep crawl intentionally skipped", details, log_path)


def repo_ai_shopping_assistant(output_dir: Path) -> Dict[str, object]:
    repo = "moein72002/AI_Shopping_Assistant"
    log_name = slugify(repo)
    missing_tooling = []
    missing_creds = []
    if python_version_tuple() < (3, 11, 0):
        missing_tooling.append("Python>=3.11")
    if not os.environ.get("OPENAI_API_KEY"):
        missing_creds.append("OPENAI_API_KEY")
    if not os.environ.get("TOROB_PROXY_URL"):
        missing_creds.append("TOROB_PROXY_URL")
    details = ["repo expects datasets and LLM proxy credentials"]
    datasets_dir = Path(os.environ.get("DATASETS_DIR", "/datasets"))
    if not (datasets_dir / "torob.db").exists():
        missing_creds.append(f"{datasets_dir}/torob.db")
    log_path = write_log(
        output_dir,
        log_name,
        "missing_tooling=" + ",".join(missing_tooling) + "\nmissing_creds=" + ",".join(missing_creds) + "\n",
    )
    if missing_tooling:
        return make_result(repo, "blocked_tooling", "blocked", "Python/runtime prerequisites are missing", details, log_path)
    if missing_creds:
        return make_result(repo, "blocked_credentials", "blocked", "credentials or datasets are missing", details, log_path)
    return make_result(repo, "not_checked", "not_run", "prereqs present but deep backend run intentionally skipped", details, log_path)


def platform_string() -> str:
    return f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"


REPO_TESTS = {
    "hamidrezafarzin/Torob-Integration": repo_torob_integration,
    "TahaBakhtari/TorobjoMCP": repo_torobjomcp,
    "itsMajid-dev/torobot": repo_torobot_sdk,
    "AmirAref/Torobot": repo_torobot_telegram,
    "xmrrabbitx/scraper": repo_scraper_php,
    "torob/Torob-Sync": repo_torob_sync,
    "amirmokri/visual-price-compare": repo_visual_price_compare,
    "amiralibg/Digikala-Torob-Price-Finder": repo_extension_reference,
    "jamshidi799/digi-bot": repo_digi_bot,
    "ahmadsalamifar/mrp_price_scout": repo_mrp_price_scout,
    "imanbahmani/TorobScraperPro": repo_torob_scraper_pro,
    "moein72002/AI_Shopping_Assistant": repo_ai_shopping_assistant,
}


def print_network(results: List[Dict[str, object]]) -> None:
    print("\n== Network Probes ==")
    for item in results:
        print(f"- {item['name']}: {item['status']} | {item['url']}")
        for detail in item["details"]:
            print(f"  {detail}")


def print_repo_results(results: List[Dict[str, object]]) -> None:
    print("\n== Repo Checks ==")
    for item in results:
        print(
            f"- {item['repo']}: install={item['install_status']} "
            f"run={item['run_status']} | {item['summary']}"
        )
        for detail in item["details"]:
            print(f"  {detail}")
        if item["log_path"]:
            print(f"  log={item['log_path']}")


def print_summary(network_results: List[Dict[str, object]], repo_results: List[Dict[str, object]], output_dir: Path) -> None:
    install_counter = Counter(item["install_status"] for item in repo_results)
    run_counter = Counter(item["run_status"] for item in repo_results)
    network_counter = Counter(item["status"] for item in network_results)
    print("\n== Summary ==")
    print(f"- output_dir: {output_dir}")
    print(f"- network: {dict(network_counter)}")
    print(f"- install_status: {dict(install_counter)}")
    print(f"- run_status: {dict(run_counter)}")
    print("\nShare these files after your run:")
    print(f"- {output_dir / 'summary.json'}")
    print(f"- {output_dir / 'network.json'}")
    print(f"- {output_dir}/*.log")


def main() -> int:
    parser = argparse.ArgumentParser(description="Re-run the Torob/Digikala repo benchmark locally without VPN.")
    parser.add_argument("--repo", action="append", help="Run only a specific repo full name. Repeatable.")
    parser.add_argument("--skip-network", action="store_true", help="Skip external network probes.")
    parser.add_argument("--list", action="store_true", help="List available repo ids and exit.")
    args = parser.parse_args()

    if args.list:
        for repo_name in REPO_TESTS:
            print(repo_name)
        return 0

    selected = args.repo or list(REPO_TESTS.keys())
    unknown = [repo for repo in selected if repo not in REPO_TESTS]
    if unknown:
        print("Unknown repo ids:")
        for repo in unknown:
            print(f"- {repo}")
        return 2

    run_dir = ARTIFACTS_DIR / f"no-vpn-recheck-{now_stamp()}"
    run_dir.mkdir(parents=True, exist_ok=True)
    (run_dir / "venvs").mkdir(parents=True, exist_ok=True)

    print("Torob/Digikala local recheck runner")
    print(f"- root: {ROOT}")
    print(f"- python: {platform_string()}")
    print(f"- output_dir: {run_dir}")
    print(f"- selected_repos: {len(selected)}")

    network_results: List[Dict[str, object]] = []
    if not args.skip_network:
        network_results = probe_network(run_dir)
        print_network(network_results)

    repo_results = []
    for repo in selected:
        print(f"\n>> Running {repo}")
        start = time.time()
        result = REPO_TESTS[repo](run_dir)
        result["duration_sec"] = round(time.time() - start, 2)
        repo_results.append(result)
        print(
            f"   {repo}: install={result['install_status']} "
            f"run={result['run_status']} duration={result['duration_sec']}s"
        )

    summary = {
        "root": str(ROOT),
        "python": platform_string(),
        "timestamp": datetime.now().isoformat(),
        "network_results": network_results,
        "repo_results": repo_results,
    }
    summary_path = run_dir / "summary.json"
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")

    print_repo_results(repo_results)
    print_summary(network_results, repo_results, run_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
