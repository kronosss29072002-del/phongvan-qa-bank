#!/usr/bin/env python3
"""Tests for check_budget.js Stop hook (real-transcript counting)."""
import json
import os
import subprocess
import sys
import tempfile
import unittest


SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CHECK_SCRIPT = os.path.join(SCRIPT_DIR, "check_budget.js")


def make_transcript(tmpdir, usage_specs):
    """Write a transcript jsonl with per-line usage specs.

    usage_specs: list of dicts of usage fields (e.g. {"input_tokens": 5000}).
    """
    path = os.path.join(tmpdir, "transcript.jsonl")
    with open(path, "w") as f:
        for spec in usage_specs:
            f.write(json.dumps({"type": "assistant", "message": {"usage": spec}}))
            f.write("\n")
    return path


def write_budget(tmpdir, budget):
    os.makedirs(os.path.join(tmpdir, ".claude"), exist_ok=True)
    with open(os.path.join(tmpdir, ".claude", "deep-budget.json"), "w") as f:
        json.dump(budget, f)


def run_hook(transcript_path, cwd):
    hook_input = {
        "hook_event_name": "Stop",
        "session_id": "test",
        "cwd": cwd,
        "transcript_path": transcript_path,
        "stop_hook_active": False,
    }
    result = subprocess.run(
        ["node", CHECK_SCRIPT],
        input=json.dumps(hook_input),
        capture_output=True,
        text=True,
        cwd=cwd,
    )
    return result.returncode, result.stdout.strip(), result.stderr.strip()


class TestTranscriptCounting(unittest.TestCase):
    def test_block_when_under_budget(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            write_budget(tmpdir, {"targetTokens": 1000000, "usedGuess": 0, "usedReal": 0})
            trans = make_transcript(tmpdir, [
                {"input_tokens": 50000, "output_tokens": 20000, "cache_creation_input_tokens": 0},
                {"input_tokens": 30000, "output_tokens": 10000, "cache_creation_input_tokens": 0},
            ])
            rc, stdout, _ = run_hook(trans, tmpdir)
            self.assertEqual(rc, 2)
            out = json.loads(stdout)
            self.assertEqual(out["decision"], "block")
            # 110k used / 1M target
            self.assertIn("110,000", out["reason"])

    def test_allow_when_tolerance_reached(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            write_budget(tmpdir, {"targetTokens": 1000000, "usedGuess": 0, "usedReal": 0})
            trans = make_transcript(tmpdir, [
                {"input_tokens": 400000, "output_tokens": 200000, "cache_creation_input_tokens": 100000},
                {"input_tokens": 150000, "output_tokens": 100000, "cache_creation_input_tokens": 0},
            ])
            rc, _, _ = run_hook(trans, tmpdir)
            # 950k used, remaining 50k <= 100k tolerance -> allow
            self.assertEqual(rc, 0)

    def test_allow_over_budget(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            write_budget(tmpdir, {"targetTokens": 100000, "usedGuess": 0, "usedReal": 0})
            trans = make_transcript(tmpdir, [
                {"input_tokens": 60000, "output_tokens": 50000, "cache_creation_input_tokens": 0},
            ])
            rc, _, _ = run_hook(trans, tmpdir)
            self.assertEqual(rc, 0)

    def test_fallback_to_guess_without_transcript(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            write_budget(tmpdir, {"targetTokens": 1000000, "usedGuess": 300000, "usedReal": 0})
            rc, stdout, _ = run_hook(None, tmpdir)
            self.assertEqual(rc, 2)
            out = json.loads(stdout)
            self.assertIn("estimate", out["reason"])

    def test_no_budget_file_allows(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            rc, _, _ = run_hook(None, tmpdir)
            self.assertEqual(rc, 0)

    def test_stop_hook_active_allows(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            write_budget(tmpdir, {"targetTokens": 1000000, "usedGuess": 0, "usedReal": 0})
            trans = make_transcript(tmpdir, [{"input_tokens": 1000, "output_tokens": 500}])
            hook_input = {
                "hook_event_name": "Stop",
                "session_id": "test",
                "cwd": tmpdir,
                "transcript_path": trans,
                "stop_hook_active": True,
            }
            result = subprocess.run(
                ["node", CHECK_SCRIPT], input=json.dumps(hook_input),
                capture_output=True, text=True, cwd=tmpdir)
            self.assertEqual(result.returncode, 0)

    def test_updates_usedReal_in_file(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            write_budget(tmpdir, {"targetTokens": 1000000, "usedGuess": 0, "usedReal": 0})
            trans = make_transcript(tmpdir, [{"input_tokens": 5000, "output_tokens": 5000}])
            run_hook(trans, tmpdir)
            with open(os.path.join(tmpdir, ".claude", "deep-budget.json")) as f:
                budget = json.load(f)
            self.assertEqual(budget["usedReal"], 10000)


if __name__ == "__main__":
    unittest.main()