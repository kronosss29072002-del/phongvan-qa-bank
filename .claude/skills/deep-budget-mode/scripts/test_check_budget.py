#!/usr/bin/env python3
"""Tests for init_budget.py and update_budget.py (new budget shape)."""
import json
import os
import subprocess
import sys
import tempfile
import unittest


SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))


def run(script_name, *args, cwd):
    return subprocess.run(
        [sys.executable, os.path.join(SCRIPT_DIR, script_name), *args],
        capture_output=True,
        text=True,
        cwd=cwd,
    )


class TestInitBudget(unittest.TestCase):
    def test_creates_budget_file(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            result = run("init_budget.py", "1000000", cwd=tmpdir)
            self.assertEqual(result.returncode, 0, result.stderr)
            path = os.path.join(tmpdir, ".claude", "deep-budget.json")
            self.assertTrue(os.path.exists(path))
            with open(path) as f:
                budget = json.load(f)
            self.assertEqual(budget["targetTokens"], 1000000)
            self.assertEqual(budget["usedReal"], 0)
            self.assertEqual(budget["usedGuess"], 0)
            self.assertEqual(budget["completedTasks"], [])

    def test_natural_language_budget(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            result = run("init_budget.py", "10 tỷ", cwd=tmpdir)
            self.assertEqual(result.returncode, 0, result.stderr)
            with open(os.path.join(tmpdir, ".claude", "deep-budget.json")) as f:
                budget = json.load(f)
            self.assertEqual(budget["targetTokens"], 10000000000)

    def test_missing_args_fails(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            result = run("init_budget.py", cwd=tmpdir)
            self.assertNotEqual(result.returncode, 0)

    def test_invalid_budget_fails(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            for bad in ["abc", "-100"]:
                result = run("init_budget.py", bad, cwd=tmpdir)
                self.assertNotEqual(result.returncode, 0, f"should reject {bad}")


class TestUpdateBudget(unittest.TestCase):
    def _init(self, tmpdir, target="1000000"):
        result = run("init_budget.py", target, cwd=tmpdir)
        self.assertEqual(result.returncode, 0, result.stderr)

    def _budget(self, tmpdir):
        with open(os.path.join(tmpdir, ".claude", "deep-budget.json")) as f:
            return json.load(f)

    def test_updates_guess_and_tasks(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            self._init(tmpdir)
            result = run("update_budget.py", "50000", "recon backend", cwd=tmpdir)
            self.assertEqual(result.returncode, 0, result.stderr)
            budget = self._budget(tmpdir)
            self.assertEqual(budget["usedGuess"], 50000)
            self.assertEqual(budget["completedTasks"], ["recon backend"])

    def test_multiple_phases(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            self._init(tmpdir)
            for guess, desc in [("20000", "research"), ("30000", "design")]:
                run("update_budget.py", guess, desc, cwd=tmpdir)
            budget = self._budget(tmpdir)
            self.assertEqual(budget["usedGuess"], 50000)
            self.assertEqual(budget["completedTasks"], ["research", "design"])

    def test_without_init_fails(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            result = run("update_budget.py", "10000", cwd=tmpdir)
            self.assertNotEqual(result.returncode, 0)

    def test_status_output(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            self._init(tmpdir, target="1000000")
            result = run("update_budget.py", "500000", "halfway", cwd=tmpdir)
            self.assertIn("50.0%", result.stdout)
            self.assertIn("[phase-recorded]", result.stdout)


if __name__ == "__main__":
    unittest.main()