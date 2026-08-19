#!/usr/bin/env python3
"""Create/refresh one isolated OpenAI vector store per client from knowledge/<client>/ files.

Usage:
  python scripts/sync_openai_knowledge.py <client_code>   # sync a single client
  python scripts/sync_openai_knowledge.py --all           # sync every knowledge/<client>/ folder

Store ids are persisted in knowledge/vector_stores.json (merged across runs) and the full
mapping is printed so it can be pasted into OPENAI_VECTOR_STORES_JSON.
"""
import argparse
import json
import os
from pathlib import Path

from openai import OpenAI

STATE_FILE = Path("knowledge/vector_stores.json")


def load_state() -> dict[str, str]:
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {}


def save_state(state: dict[str, str]) -> None:
    STATE_FILE.write_text(json.dumps(state, indent=2, sort_keys=True) + "\n")


def sync_client(client: OpenAI, client_code: str, directory: Path, state: dict[str, str]) -> None:
    client_directory = directory / client_code
    files = [path for path in client_directory.rglob("*") if path.is_file()]
    if not files:
        print(f"skip {client_code}: no files in {client_directory}")
        return

    old_store_id = state.get(client_code)
    if old_store_id:
        try:
            client.vector_stores.delete(old_store_id)
        except Exception as error:  # pragma: no cover - best-effort cleanup
            print(f"warning: could not delete previous store {old_store_id} for {client_code}: {error}")

    store = client.vector_stores.create(name=f"olivia-{client_code}")
    for path in files:
        with path.open("rb") as handle:
            uploaded = client.files.create(file=handle, purpose="assistants")
        client.vector_stores.files.create(vector_store_id=store.id, file_id=uploaded.id)
    state[client_code] = store.id
    print(f"synced {client_code}: {len(files)} file(s) -> {store.id}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("client_code", nargs="?")
    parser.add_argument("--all", action="store_true", help="sync every folder under --directory")
    parser.add_argument("--directory", default="knowledge")
    args = parser.parse_args()
    if not args.all and not args.client_code:
        raise SystemExit("Provide a client_code or use --all")
    if not os.environ.get("OPENAI_API_KEY"):
        raise SystemExit("OPENAI_API_KEY is required")

    directory = Path(args.directory)
    client = OpenAI()
    state = load_state()

    if args.all:
        client_codes = sorted(p.name for p in directory.iterdir() if p.is_dir())
        if not client_codes:
            raise SystemExit(f"No client folders found under {directory}")
        for client_code in client_codes:
            sync_client(client, client_code, directory, state)
    else:
        sync_client(client, args.client_code, directory, state)

    save_state(state)
    print(json.dumps(state, indent=2))


if __name__ == "__main__":
    main()
