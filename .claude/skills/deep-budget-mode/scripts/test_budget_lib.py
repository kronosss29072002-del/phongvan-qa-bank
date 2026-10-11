#!/usr/bin/env python3
"""Tests for budget_lib.py."""
import json
import os
import tempfile
import unittest

from budget_lib import (count_transcript_tokens, fmt, fresh_budget,
                        load_budget, parse_tokens, save_budget, status_line)


class TestParseTokens(unittest.TestCase):
    def test_plain_number(self):
        self.assertEqual(parse_tokens("1000000"), 1000000)

    def test_si_suffixes(self):
        self.assertEqual(parse_tokens("500k"), 500000)
        self.assertEqual(parse_tokens("1.5M"), 1500000)
        self.assertEqual(parse_tokens("10B"), 10000000000)

    def test_vietnamese_words(self):
        self.assertEqual(parse_tokens("10 tỷ"), 10000000000)
        self.assertEqual(parse_tokens("2 triệu"), 2000000)
        self.assertEqual(parse_tokens("5 nghìn"), 5000)

    def test_english_words(self):
        self.assertEqual(parse_tokens("1.5 billion"), 1500000000)
        self.assertEqual(parse_tokens("500 thousand"), 500000)

    def test_commas_and_bare(self):
        self.assertEqual(parse_tokens("1,000,000"), 1000000)
        self.assertEqual(parse_tokens("1"), 1)

    def test_invalid(self):
        for bad in ["abc", "", " ", "tỷ", "10 tỷ 5", None, "-100"]:
            self.assertIsNone(parse_tokens(bad), f"should reject {bad!r}")

    def test_case_insensitive(self):
        self.assertEqual(parse_tokens("10B"), 10000000000)
        self.assertEqual(parse_tokens("10b"), 10000000000)


class TestCountTranscriptTokens(unittest.TestCase):
    def _write_transcript(self, lines):
        with tempfile.NamedTemporaryFile("w", suffix=".jsonl", delete=False) as f:
            for line in lines:
                f.write(json.dumps(line) + "\n")
            return f.name

    def test_counts_usage(self):
        path = self._write_transcript([
            {"type": "assistant", "message": {"usage": {"input_tokens": 100, "output_tokens": 50, "cache_creation_input_tokens": 20, "cache_read_input_tokens": 500}}},
            {"type": "user", "message": {"usage": {"input_tokens": 30, "output_tokens": 10}}},
            {"type": "summary", "message": {"text": "no usage"}},
        ])
        used, counted = count_transcript_tokens(path)
        self.assertEqual(used, 100 + 50 + 20 + 30 + 10)
        self.assertEqual(counted, 2)

    def test_include_cache_read(self):
        path = self._write_transcript([
            {"message": {"usage": {"input_tokens": 10, "output_tokens": 10, "cache_creation_input_tokens": 10, "cache_read_input_tokens": 100}}},
        ])
        used_excl, _ = count_transcript_tokens(path, include_cache_read=False)
        used_incl, _ = count_transcript_tokens(path, include_cache_read=True)
        self.assertEqual(used_excl, 30)
        self.assertEqual(used_incl, 130)

    def test_missing_file(self):
        used, counted = count_transcript_tokens("/nonexistent/path/jsonl")
        self.assertEqual((used, counted), (0, 0))

    def test_corrupt_lines_skipped(self):
        with tempfile.NamedTemporaryFile("w", suffix=".jsonl", delete=False) as f:
            f.write("{not json}\n")
            f.write(json.dumps({"message": {"usage": {"output_tokens": 5}}}) + "\n")
            path = f.name
        used, counted = count_transcript_tokens(path)
        self.assertEqual(used, 5)
        self.assertEqual(counted, 1)

    def test_none_path(self):
        used, counted = count_transcript_tokens(None)
        self.assertEqual((used, counted), (0, 0))


class TestBudgetFile(unittest.TestCase):
    def test_roundtrip(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            old = os.getcwd()
            os.chdir(tmpdir)
            try:
                os.makedirs(".claude", exist_ok=True)
                save_budget(fresh_budget(1000000))
                loaded = load_budget()
                self.assertEqual(loaded["targetTokens"], 1000000)
                self.assertEqual(loaded["usedReal"], 0)
            finally:
                os.chdir(old)

    def test_load_missing(self):
        # Must run in a temp dir — the real project may have .claude/deep-budget.json
        with tempfile.TemporaryDirectory() as tmpdir:
            old = os.getcwd()
            os.chdir(tmpdir)
            try:
                self.assertIsNone(load_budget())
            finally:
                os.chdir(old)

    def test_status_line(self):
        b = fresh_budget(1000000)
        b["usedReal"] = 250000
        line = status_line(b)
        self.assertIn("1,000,000", line)
        self.assertIn("25.0%", line)

    def test_fmt(self):
        self.assertEqual(fmt(1234567), "1,234,567")


if __name__ == "__main__":
    unittest.main()