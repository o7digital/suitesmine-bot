#!/usr/bin/env python3
"""Create one isolated OpenAI vector store per client from knowledge/<client>/ files."""
import argparse
import json
import os
from pathlib import Path

from openai import OpenAI


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("client_code")
    parser.add_argument("--directory", default="knowledge")
    args = parser.parse_args()
    directory = Path(args.directory) / args.client_code
    files = [path for path in directory.rglob("*") if path.is_file()]
    if not files:
        raise SystemExit(f"No knowledge files found in {directory}")
    if not os.environ.get("OPENAI_API_KEY"):
        raise SystemExit("OPENAI_API_KEY is required")

    client = OpenAI()
    store = client.vector_stores.create(name=f"olivia-{args.client_code}")
    for path in files:
        with path.open("rb") as handle:
            uploaded = client.files.create(file=handle, purpose="assistants")
        client.vector_stores.files.create(vector_store_id=store.id, file_id=uploaded.id)
    print(json.dumps({args.client_code: store.id}))


if __name__ == "__main__":
    main()
