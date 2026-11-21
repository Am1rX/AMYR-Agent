"""Open Cloudflare login in Chrome, verify the target account, and deploy Hermes.

Run from anywhere: python scripts/deploy_pdf_fix.py
Use --local-only to run checks without Cloudflare login or deployment.
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import queue
import re
import shutil
import subprocess
import sys
import threading
import time
import tomllib


ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "wrangler.toml"
ANSI = re.compile(r"\x1b\[[0-9;]*m")
OAUTH_URL = re.compile(r"https://dash\.cloudflare\.com/oauth2/auth[^\s]+")


def command_path(name: str) -> str:
    local = ROOT / "node_modules" / ".bin" / (name + (".cmd" if os.name == "nt" else ""))
    found = local if local.is_file() else shutil.which(name)
    if not found:
        raise RuntimeError(f"{name} is unavailable. Install the project dependencies first: npm install")
    return str(found)


def run(cmd: list[str], label: str, *, capture: bool = False) -> str:
    print(f"\n==> {label}", flush=True)
    env = {**os.environ, "WRANGLER_SEND_METRICS": "false", "NO_COLOR": "1", "CI": "1"}
    result = subprocess.run(
        cmd, cwd=ROOT, env=env, text=True, encoding="utf-8", errors="replace",
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.STDOUT if capture else None,
        check=False,
    )
    if result.returncode:
        if capture and result.stdout:
            print(result.stdout[-3000:])
        raise RuntimeError(f"{label} failed (exit {result.returncode})")
    return result.stdout or ""


def expected_database_id() -> str:
    with CONFIG.open("rb") as file:
        config = tomllib.load(file)
    databases = config.get("d1_databases", [])
    if len(databases) != 1 or not databases[0].get("database_id"):
        raise RuntimeError("Expected one D1 database ID in wrangler.toml")
    return str(databases[0]["database_id"])


def target_account_is_active(wrangler: str) -> bool:
    try:
        print("\n==> Checking the Cloudflare account", flush=True)
        result = subprocess.run(
            [wrangler, "d1", "list", "--json"], cwd=ROOT,
            env={**os.environ, "WRANGLER_SEND_METRICS": "false", "NO_COLOR": "1", "CI": "1"},
            text=True, encoding="utf-8", errors="replace",
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, check=False,
        )
        if result.returncode:
            return False
        output = result.stdout
        start = output.find("[")
        if start < 0:
            return False
        databases, _ = json.JSONDecoder().raw_decode(output[start:])
        if not isinstance(databases, list):
            return False
        return any(isinstance(db, dict) and db.get("uuid", db.get("id")) == expected_database_id()
                   for db in databases)
    except (RuntimeError, ValueError, KeyError):
        return False


def chrome_path() -> str:
    candidates = [
        shutil.which("chrome.exe"),
        os.environ.get("PROGRAMFILES", "") + r"\Google\Chrome\Application\chrome.exe",
        os.environ.get("PROGRAMFILES(X86)", "") + r"\Google\Chrome\Application\chrome.exe",
        os.environ.get("LOCALAPPDATA", "") + r"\Google\Chrome\Application\chrome.exe",
    ]
    for item in candidates:
        if item and Path(item).is_file():
            return item
    raise RuntimeError("Chrome was not found. Install Chrome or open the OAuth link manually.")


def login_in_chrome(wrangler: str) -> None:
    chrome = chrome_path()
    lines: queue.Queue[str] = queue.Queue()
    env = {**os.environ, "WRANGLER_SEND_METRICS": "false", "NO_COLOR": "1", "CI": "1"}
    process = subprocess.Popen(
        [wrangler, "login", "--browser=false"], cwd=ROOT, env=env,
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        text=True, encoding="utf-8", errors="replace", bufsize=1,
    )

    def read_output() -> None:
        assert process.stdout is not None
        for line in process.stdout:
            lines.put(ANSI.sub("", line))

    threading.Thread(target=read_output, daemon=True).start()
    deadline = time.monotonic() + 180
    opened = False
    try:
        while time.monotonic() < deadline:
            try:
                line = lines.get(timeout=0.5)
            except queue.Empty:
                if process.poll() is not None:
                    break
                continue
            match = OAUTH_URL.search(line)
            if match and not opened:
                url = match.group(0).rstrip("\x1b")
                if os.name == "nt":
                    os.startfile(chrome, arguments=f'--new-window "{url}"', cwd=str(ROOT), show_cmd=1)
                else:
                    subprocess.Popen([chrome, "--new-window", url], cwd=ROOT)
                opened = True
                print("Chrome launch requested. Choose the bot's Cloudflare account and approve Wrangler.", flush=True)
                print(f"If no window appears, paste this link into Chrome within 3 minutes:\n{url}", flush=True)
            elif "Successfully logged in" in line or "You are logged in" in line:
                print("Cloudflare login completed.", flush=True)
            elif "ERROR" in line or "Timed out" in line:
                print(line.strip(), flush=True)
            if process.poll() is not None and lines.empty():
                break
        if process.poll() is None:
            process.terminate()
            raise RuntimeError("Cloudflare login timed out. Run this script again and approve it in Chrome.")
        if process.returncode != 0:
            raise RuntimeError("Cloudflare login did not complete. Run this script again.")
        if not opened:
            raise RuntimeError("Wrangler did not provide an OAuth URL to open in Chrome.")
    finally:
        if process.poll() is None:
            process.terminate()


def local_checks(wrangler: str) -> None:
    run([command_path("tsc"), "--noEmit"], "TypeScript check")
    run([
        command_path("node"), "--experimental-loader", "./tests/ts-resolve.mjs",
        "--test", "--test-name-pattern", "adding a photo|photo added to an old PDF|pdf: a revised document",
        "tests/engines.test.mjs",
    ], "PDF revision tests")
    run([
        command_path("node"), "--experimental-loader", "./tests/ts-resolve.mjs",
        "--test", "tests/voiceReplyPolicy.test.mjs",
    ], "Voice reply policy tests")
    run([wrangler, "deploy", "--dry-run", "--outdir=.wrangler/dry"], "Wrangler build check")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--local-only", action="store_true", help="Run checks only; do not log in or deploy")
    args = parser.parse_args()
    try:
        wrangler = command_path("wrangler")
        local_checks(wrangler)
        if args.local_only:
            print("\nLocal checks passed. Nothing was deployed.")
            return 0
        if not target_account_is_active(wrangler):
            login_in_chrome(wrangler)
        if not target_account_is_active(wrangler):
            raise RuntimeError("Wrong Cloudflare account: the D1 database in wrangler.toml is not visible. Deployment stopped.")
        print("\nTarget Cloudflare account verified against the configured D1 database.", flush=True)
        run([wrangler, "deploy"], "Deploying the Worker")
        print("\nWorker deployed. Test the requested behavior in Telegram.")
        return 0
    except RuntimeError as error:
        print(f"\nERROR: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
