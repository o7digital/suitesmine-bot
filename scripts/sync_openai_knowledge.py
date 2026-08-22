#!/usr/bin/env python3
"""Atomically refresh isolated OpenAI vector stores from knowledge/<client>/ files."""
import argparse
import json
import os
import tempfile
from pathlib import Path

from openai import OpenAI

STATE_FILE = Path("knowledge/vector_stores.json")
IGNORED_NAMES = {".DS_Store", "Thumbs.db", "desktop.ini", "vector_stores.json"}
IGNORED_SUFFIXES = {".tmp", ".temp", ".swp", ".swo", ".part"}


def log(stage: str, client_code: str, message: str) -> None:
    print(f"{stage} [{client_code}] {message}")


def load_state(state_file: Path = STATE_FILE) -> dict[str, str]:
    if not state_file.exists():
        return {}
    state = json.loads(state_file.read_text(encoding="utf-8"))
    if not isinstance(state, dict) or not all(
        isinstance(key, str) and isinstance(value, str) for key, value in state.items()
    ):
        raise ValueError(f"Invalid vector store mapping in {state_file}")
    return state


def save_state_atomic(state: dict[str, str], state_file: Path = STATE_FILE) -> None:
    state_file.parent.mkdir(parents=True, exist_ok=True)
    file_descriptor, temporary_name = tempfile.mkstemp(
        dir=state_file.parent,
        prefix=f".{state_file.name}.",
        suffix=".tmp",
    )
    try:
        with os.fdopen(file_descriptor, "w", encoding="utf-8") as handle:
            json.dump(state, handle, indent=2, sort_keys=True)
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary_name, state_file)
    except Exception:
        try:
            os.unlink(temporary_name)
        except FileNotFoundError:
            pass
        raise


def approved_files(client_directory: Path, state_file: Path = STATE_FILE) -> list[Path]:
    if not client_directory.is_dir():
        raise FileNotFoundError(f"Client knowledge directory does not exist: {client_directory}")

    state_path = state_file.resolve()
    files = []
    for path in client_directory.rglob("*"):
        if not path.is_file() or path.resolve() == state_path:
            continue
        relative_parts = path.relative_to(client_directory).parts
        if any(part.startswith(".") for part in relative_parts):
            continue
        if path.name in IGNORED_NAMES or path.name.endswith("~") or path.suffix.lower() in IGNORED_SUFFIXES:
            continue
        files.append(path)
    return sorted(files, key=lambda path: path.relative_to(client_directory).as_posix())


def validate_indexing(batch, store) -> None:
    batch_status = getattr(batch, "status", None)
    file_counts = getattr(batch, "file_counts", None)
    failed_count = getattr(file_counts, "failed", 0)
    if batch_status != "completed" or failed_count:
        raise RuntimeError(
            f"Indexing did not complete successfully (status={batch_status}, failed={failed_count})"
        )
    store_status = getattr(store, "status", None)
    if store_status != "completed":
        raise RuntimeError(f"Vector store is not usable (status={store_status})")


def delete_store_best_effort(client: OpenAI, store_id: str, client_code: str, *, warning: bool) -> bool:
    try:
        client.vector_stores.delete(store_id)
        return True
    except Exception as error:
        prefix = "warning: " if warning else ""
        log("CLEANUP", client_code, f"{prefix}could not delete store {store_id} ({type(error).__name__})")
        return False


def sync_client(
    client: OpenAI | None,
    client_code: str,
    directory: Path,
    state: dict[str, str],
    *,
    state_file: Path = STATE_FILE,
    dry_run: bool = False,
    keep_old: bool = False,
) -> None:
    client_directory = directory / client_code
    try:
        files = approved_files(client_directory, state_file)
        if not files:
            raise ValueError(f"No approved knowledge files found in {client_directory}")
    except Exception as error:
        log("FAILED", client_code, f"knowledge validation failed ({type(error).__name__})")
        raise

    old_store_id = state.get(client_code)
    log("PREPARING", client_code, f"{len(files)} approved file(s)")
    if dry_run:
        log("VALIDATING", client_code, "dry-run complete; no API calls or state changes")
        return
    if client is None:
        raise ValueError("OpenAI client is required unless --dry-run is used")

    new_store_id: str | None = None
    switched = False
    try:
        store = client.vector_stores.create(name=f"olivia-{client_code}")
        new_store_id = store.id
        log("UPLOADING", client_code, f"uploading {len(files)} file(s) to {new_store_id}")
        handles = []
        try:
            for path in files:
                handles.append(path.open("rb"))
            batch = client.vector_stores.file_batches.upload_and_poll(
                vector_store_id=new_store_id,
                files=handles,
            )
        finally:
            for handle in handles:
                handle.close()

        log("VALIDATING", client_code, f"validating {new_store_id}")
        refreshed_store = client.vector_stores.retrieve(new_store_id)
        validate_indexing(batch, refreshed_store)

        updated_state = {**state, client_code: new_store_id}
        save_state_atomic(updated_state, state_file)
        state.clear()
        state.update(updated_state)
        switched = True
        log("SWITCHED", client_code, f"active store is now {new_store_id}")
    except Exception as error:
        log("FAILED", client_code, f"synchronization failed ({type(error).__name__})")
        if new_store_id and not switched:
            delete_store_best_effort(client, new_store_id, client_code, warning=False)
        raise

    if old_store_id and old_store_id != new_store_id:
        if keep_old:
            log("CLEANUP", client_code, f"keeping previous store {old_store_id}")
        else:
            delete_store_best_effort(client, old_store_id, client_code, warning=True)
    else:
        log("CLEANUP", client_code, "no previous store to delete")


def sync_clients(
    client: OpenAI | None,
    client_codes: list[str],
    directory: Path,
    state: dict[str, str],
    *,
    state_file: Path = STATE_FILE,
    dry_run: bool = False,
    keep_old: bool = False,
) -> None:
    for client_code in client_codes:
        sync_client(
            client,
            client_code,
            directory,
            state,
            state_file=state_file,
            dry_run=dry_run,
            keep_old=keep_old,
        )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("client_code", nargs="?")
    parser.add_argument("--all", action="store_true", help="sync every client folder")
    parser.add_argument("--directory", default="knowledge")
    parser.add_argument("--state-file", default=str(STATE_FILE))
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--keep-old", action="store_true")
    args = parser.parse_args()
    if not args.all and not args.client_code:
        raise SystemExit("Provide a client_code or use --all")
    if args.all and args.client_code:
        raise SystemExit("Do not combine client_code with --all")
    if not args.dry_run and not os.environ.get("OPENAI_API_KEY"):
        raise SystemExit("OPENAI_API_KEY is required")

    directory = Path(args.directory)
    state_file = Path(args.state_file)
    if not directory.is_dir():
        raise SystemExit(f"Knowledge directory does not exist: {directory}")
    state = load_state(state_file)
    client = None if args.dry_run else OpenAI()
    client_codes = (
        sorted(path.name for path in directory.iterdir() if path.is_dir() and not path.name.startswith("."))
        if args.all
        else [args.client_code]
    )
    if not client_codes:
        raise SystemExit(f"No client folders found under {directory}")

    try:
        sync_clients(
            client,
            client_codes,
            directory,
            state,
            state_file=state_file,
            dry_run=args.dry_run,
            keep_old=args.keep_old,
        )
    except Exception as error:
        raise SystemExit(1) from error

    print(json.dumps(state, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()