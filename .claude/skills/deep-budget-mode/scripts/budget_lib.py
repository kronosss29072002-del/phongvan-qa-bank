"""Shared helpers for deep-budget-mode scripts.

- parse_tokens: parse '10 tỷ', '500k', '1.5M', '2000000' -> int
- transcript usage counting (real, not guessed)
- budget file load/save/status helpers
"""
import json
import os

BUDGET_PATH = os.path.join(".claude", "deep-budget.json")

# Vietnamese + English magnitudes, longest-first for suffix matching
_MAGNITUDES = [
    ("trillion", 1e12),
    ("billion", 1e9),
    ("tỷ", 1e9),
    ("tỉ", 1e9),
    ("million", 1e6),
    ("triệu", 1e6),
    ("thousand", 1e3),
    ("nghìn", 1e3),
    ("ngàn", 1e3),
]

_SI_SUFFIX = [("k", 1e3), ("m", 1e6), ("b", 1e9), ("t", 1e12)]


def _num_prefix(s):
    """Parse a pure numeric prefix; None if not numeric."""
    try:
        return float(s)
    except ValueError:
        return None


def parse_tokens(raw):
    """Parse a token budget string into an integer.

    Examples: '10 tỷ' -> 10_000_000_000, '500k' -> 500_000,
    '1.5M' -> 1_500_000, '2 triệu' -> 2_000_000, '1000000' -> 1_000_000.
    Returns int, or None if unparseable.
    """
    if raw is None:
        return None
    s = str(raw).strip().lower().replace(",", "").replace(" ", "")
    if not s:
        return None
    for word, mag in _MAGNITUDES:
        if s.endswith(word):
            num = _num_prefix(s[: -len(word)])
            if num is not None:
                return int(num * mag)
    for suffix, mag in _SI_SUFFIX:
        if s.endswith(suffix):
            num = _num_prefix(s[: -len(suffix)])
            if num is not None:
                return int(num * mag)
    num = _num_prefix(s)
    if num is not None and num == int(num) and num >= 0:
        return int(num)
    return None


def count_transcript_tokens(transcript_path, include_cache_read=False):
    """Sum real API usage from a Claude Code transcript JSONL.

    Counts input_tokens + output_tokens + cache_creation_input_tokens
    (the actual model-compute tokens). cache_read_input_tokens is only
    included when include_cache_read=True (cheap context replay — usually
    excluded so idle replay does not count as 'work').

    Returns (used_compute, counted_entries): (int, int) independent of the
    cache_read option. Returns (0, 0) if path missing/unreadable/empty-handed.
    """
    if not transcript_path or not os.path.isfile(transcript_path):
        return 0, 0
    used = 0
    counted = 0
    try:
        with open(transcript_path, "r", encoding="utf-8", errors="replace") as f:
            for line in f:
                if not line.strip():
                    continue
                try:
                    entry = json.loads(line)
                except (ValueError, TypeError):
                    continue
                usage = None
                if isinstance(entry, dict):
                    msg = entry.get("message")
                    if isinstance(msg, dict) and isinstance(msg.get("usage"), dict):
                        usage = msg["usage"]
                    elif isinstance(entry.get("usage"), dict):
                        usage = entry["usage"]
                if not usage:
                    continue
                tokens = (
                    int(usage.get("input_tokens") or 0)
                    + int(usage.get("output_tokens") or 0)
                    + int(usage.get("cache_creation_input_tokens") or 0)
                )
                if include_cache_read:
                    tokens += int(usage.get("cache_read_input_tokens") or 0)
                if tokens > 0:
                    used += tokens
                    counted += 1
    except (OSError, IOError, UnicodeDecodeError):
        return 0, 0
    return used, counted


def load_budget():
    """Load .claude/deep-budget.json; return dict or None."""
    if not os.path.isfile(BUDGET_PATH):
        return None
    try:
        with open(BUDGET_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


def save_budget(budget):
    with open(BUDGET_PATH, "w", encoding="utf-8") as f:
        json.dump(budget, f, indent=2)


def fresh_budget(target_tokens, session_id="unknown", started_at=None):
    if started_at is None:
        started_at = ""
    return {
        "targetTokens": target_tokens,
        "usedReal": 0,
        "usedGuess": 0,
        "completed": False,
        "phases": {},
        "completedTasks": [],
        "sessionId": session_id,
        "startedAt": started_at,
        "lastUpdated": started_at,
    }


def fmt(n):
    return f"{int(n):,}"


def status_line(budget, used=None):
    """Human-readable status; used=None -> inferred (real preferred)."""
    if used is None:
        used = budget.get("usedReal") or budget.get("usedGuess") or 0
    target = budget.get("targetTokens", 0)
    pct = (used / target * 100) if target else 0
    remaining = max(0, target - used)
    return (
        f"target={fmt(target)} used={fmt(used)} ({pct:.1f}%) "
        f"remaining={fmt(remaining)}"
    )
