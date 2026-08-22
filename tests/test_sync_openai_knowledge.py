import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from scripts import sync_openai_knowledge as sync


class FakeFileBatches:
    def __init__(self, owner):
        self.owner = owner

    def upload_and_poll(self, *, vector_store_id, files):
        self.owner.events.append(("upload", vector_store_id, [Path(handle.name).name for handle in files]))
        if self.owner.upload_error:
            raise RuntimeError("upload failed")
        return SimpleNamespace(
            status=self.owner.batch_status,
            file_counts=SimpleNamespace(failed=self.owner.failed_files),
        )


class FakeVectorStores:
    def __init__(self):
        self.events = []
        self.created = 0
        self.upload_error = False
        self.batch_status = "completed"
        self.failed_files = 0
        self.store_status = "completed"
        self.cleanup_error_ids = set()
        self.file_batches = FakeFileBatches(self)

    def create(self, *, name):
        self.created += 1
        store_id = f"vs_new_{self.created}"
        self.events.append(("create", store_id, name))
        return SimpleNamespace(id=store_id)

    def retrieve(self, store_id):
        self.events.append(("retrieve", store_id))
        return SimpleNamespace(id=store_id, status=self.store_status)

    def delete(self, store_id):
        self.events.append(("delete", store_id))
        if store_id in self.cleanup_error_ids:
            raise RuntimeError("cleanup failed")


class FakeOpenAI:
    def __init__(self):
        self.vector_stores = FakeVectorStores()


class AtomicVectorStoreSyncTests(unittest.TestCase):
    def setUp(self):
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary_directory.name)
        self.knowledge = self.root / "knowledge"
        self.state_file = self.knowledge / "vector_stores.json"
        self.make_client("vialterna", ["z-last.md", "a-first.md"])
        self.initial_state = {"vialterna": "vs_old_vialterna", "zevicapital": "vs_old_zevi"}
        self.write_state(self.initial_state)

    def tearDown(self):
        self.temporary_directory.cleanup()

    def make_client(self, client_code, filenames):
        directory = self.knowledge / client_code
        directory.mkdir(parents=True, exist_ok=True)
        for filename in filenames:
            path = directory / filename
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(f"approved knowledge for {client_code}", encoding="utf-8")

    def write_state(self, state):
        self.state_file.parent.mkdir(parents=True, exist_ok=True)
        self.state_file.write_text(json.dumps(state), encoding="utf-8")

    def persisted_state(self):
        return json.loads(self.state_file.read_text(encoding="utf-8"))

    def test_successful_switch_persists_before_old_store_cleanup(self):
        client = FakeOpenAI()
        state = dict(self.initial_state)
        original_save = sync.save_state_atomic

        def recording_save(updated_state, state_file):
            client.vector_stores.events.append(("save", updated_state["vialterna"]))
            original_save(updated_state, state_file)

        with patch.object(sync, "save_state_atomic", side_effect=recording_save):
            sync.sync_client(client, "vialterna", self.knowledge, state, state_file=self.state_file)

        self.assertEqual(self.persisted_state(), {
            "vialterna": "vs_new_1",
            "zevicapital": "vs_old_zevi",
        })
        self.assertEqual(client.vector_stores.events[1], ("upload", "vs_new_1", ["a-first.md", "z-last.md"]))
        self.assertLess(
            client.vector_stores.events.index(("save", "vs_new_1")),
            client.vector_stores.events.index(("delete", "vs_old_vialterna")),
        )

    def test_upload_failure_preserves_old_mapping_and_store(self):
        client = FakeOpenAI()
        client.vector_stores.upload_error = True
        state = dict(self.initial_state)

        with self.assertRaisesRegex(RuntimeError, "upload failed"):
            sync.sync_client(client, "vialterna", self.knowledge, state, state_file=self.state_file)

        self.assertEqual(state, self.initial_state)
        self.assertEqual(self.persisted_state(), self.initial_state)
        self.assertIn(("delete", "vs_new_1"), client.vector_stores.events)
        self.assertNotIn(("delete", "vs_old_vialterna"), client.vector_stores.events)

    def test_indexing_failure_preserves_old_mapping_and_store(self):
        client = FakeOpenAI()
        client.vector_stores.batch_status = "failed"
        client.vector_stores.failed_files = 1

        with self.assertRaisesRegex(RuntimeError, "Indexing did not complete"):
            sync.sync_client(
                client,
                "vialterna",
                self.knowledge,
                dict(self.initial_state),
                state_file=self.state_file,
            )

        self.assertEqual(self.persisted_state(), self.initial_state)
        self.assertNotIn(("delete", "vs_old_vialterna"), client.vector_stores.events)

    def test_state_write_failure_preserves_old_mapping_and_store(self):
        client = FakeOpenAI()
        state = dict(self.initial_state)

        with patch.object(sync, "save_state_atomic", side_effect=OSError("disk full")):
            with self.assertRaisesRegex(OSError, "disk full"):
                sync.sync_client(client, "vialterna", self.knowledge, state, state_file=self.state_file)

        self.assertEqual(state, self.initial_state)
        self.assertEqual(self.persisted_state(), self.initial_state)
        self.assertIn(("delete", "vs_new_1"), client.vector_stores.events)
        self.assertNotIn(("delete", "vs_old_vialterna"), client.vector_stores.events)

    def test_cleanup_failure_keeps_successful_new_mapping(self):
        client = FakeOpenAI()
        client.vector_stores.cleanup_error_ids.add("vs_old_vialterna")
        state = dict(self.initial_state)

        sync.sync_client(client, "vialterna", self.knowledge, state, state_file=self.state_file)

        self.assertEqual(state["vialterna"], "vs_new_1")
        self.assertEqual(self.persisted_state()["vialterna"], "vs_new_1")

    def test_dry_run_makes_no_api_or_state_changes(self):
        state = dict(self.initial_state)

        sync.sync_client(None, "vialterna", self.knowledge, state, state_file=self.state_file, dry_run=True)

        self.assertEqual(state, self.initial_state)
        self.assertEqual(self.persisted_state(), self.initial_state)

    def test_keep_old_switches_mapping_without_deleting_old_store(self):
        client = FakeOpenAI()
        state = dict(self.initial_state)

        sync.sync_client(
            client,
            "vialterna",
            self.knowledge,
            state,
            state_file=self.state_file,
            keep_old=True,
        )

        self.assertEqual(state["vialterna"], "vs_new_1")
        self.assertNotIn(("delete", "vs_old_vialterna"), client.vector_stores.events)

    def test_all_clients_switch_independently_and_preserve_other_mappings(self):
        self.make_client("zevicapital", ["overview.md"])
        client = FakeOpenAI()
        state = dict(self.initial_state)

        sync.sync_clients(
            client,
            sorted(("vialterna", "zevicapital")),
            self.knowledge,
            state,
            state_file=self.state_file,
            keep_old=True,
        )

        self.assertEqual(state, {"vialterna": "vs_new_1", "zevicapital": "vs_new_2"})
        self.assertEqual(self.persisted_state(), state)

    def test_file_selection_ignores_hidden_temporary_and_system_files(self):
        client_directory = self.knowledge / "vialterna"
        (client_directory / ".hidden.md").write_text("hidden", encoding="utf-8")
        (client_directory / "draft.tmp").write_text("temporary", encoding="utf-8")
        (client_directory / ".DS_Store").write_text("system", encoding="utf-8")
        (client_directory / "notes.md~").write_text("backup", encoding="utf-8")
        (client_directory / "vector_stores.json").write_text("{}", encoding="utf-8")

        selected = [path.name for path in sync.approved_files(client_directory, self.state_file)]

        self.assertEqual(selected, ["a-first.md", "z-last.md"])

    def test_missing_or_empty_client_directory_is_rejected(self):
        with self.assertRaises(FileNotFoundError):
            sync.sync_client(None, "missing", self.knowledge, {}, state_file=self.state_file, dry_run=True)
        (self.knowledge / "empty").mkdir()
        with self.assertRaises(ValueError):
            sync.sync_client(None, "empty", self.knowledge, {}, state_file=self.state_file, dry_run=True)


if __name__ == "__main__":
    unittest.main()