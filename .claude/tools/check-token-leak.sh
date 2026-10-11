#!/usr/bin/env bash
# check-token-leak.sh — quét secret rò rỉ trong working tree / staged files (phase-1 của tuyến trufflehog)
#
# Lý do (xem .claude/rules/claude_dev_integrations.md mục "trufflehog"):
#   - Repo có credential thật trên máy (Postgres dev=prod, cloudflared tunnel, token cache, .env)
#     chỉ bảo vệ bằng gitignore — một 'git add -f' hoặc add sai scope là rò rỉ công khai.
#   - Zero dependency (grep + git), chạy local lúc commit, KHÔNG gọi mạng, không lưu token.
#
# Usage:
#   .claude/tools/check-token-leak.sh            # quét toàn bộ working tree (git ls-files + untracked)
#   .claude/tools/check-token-leak.sh --staged   # chỉ quét staged (gọi từ git:cm flow trước khi commit)
#   exit 0 = sạch | exit 1 = có pattern khả nghi (chỉ cảnh báo, không chặn)
#
# Đừng thêm pattern mới mù — cùng wordlist giữa hook/CI/doc: mọi bổ sung phải sync 3 nơi.

set -u

MODE="${1:-all}"

# Hash pattern chính — rất ít false positive (đủ entropy, prefix rõ ràng)
# LƯU Ý: thân key thật thường chứa '-' nên char class phải có '-' (bài học từ positive control:
#   'sk-[A-Za-z0-9]{20,}' KHÔNG khớp 'sk-ant-api03-...' vì 'ant' chỉ 3 ký tự rồi gặp gạch nối).
PATTERNS=(
  'sk-ant-[A-Za-z0-9_-]{20,}'        # Anthropic (sk-ant-api03-…)
  'sk-(proj-)?[A-Za-z0-9_-]{32,}'    # OpenAI (sk-… / sk-proj-…)
  'gh[pousr]_[A-Za-z0-9]{36,}'
  'github_pat_[A-Za-z0-9_]{20,}'
  'xox[baprs]-[A-Za-z0-9-]{10,}'
  'AKIA[0-9A-Z]{16}'
  '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----'
  'AIza[0-9A-Za-z_-]{35}'
  'glpat-[A-Za-z0-9_-]{20,}'
  'Bearer [A-Za-z0-9._-]{20,}'
)

# Default-view helper: lấy mẫu hiển thị an toàn (giấu khối giữa token)
mask() { sed -E 's/([A-Za-z0-9_-]{6})[A-Za-z0-9._\/+-]{8,}/\1***/g'; }

scan_file() {
  # $1 = path tương đối | stdin = nội dung
  local f="$1" line_no
  local -i hits=0
  while IFS= read -r line_no; do
    # grep -nE trả "N:line" — tách số dòng N trước khi dùng làm sed address
    local n="${line_no%%:*}"
    local sample
    sample="$(sed -n "${n}p" | mask | cut -c1-100)"
    printf '  [%s:%s] %s\n' "$f" "$n" "$sample"
    hits+=1
  done < <(grep -nE "$(IFS='|'; echo "${PATTERNS[*]}")" 2>/dev/null)
  return "$hits"
}

declare -a FILES=()
if [ "$MODE" = "--staged" ]; then
  mapfile -t FILES < <(git diff --cached --name-only --diff-filter=ACM)
else
  # tracked + untracked (loại mẫu placeholder/giả lập TOKEN|EXAMPLE|YOUR_|xxx|test).
  # Bỏ hẳn các thư mục corpus generated (translations/.fake-vi 23k+ files) — content
  # thật, quét để lâu vô ích. Thêm dir vào excludeGenerated nếu có corpus mới.
  excludeGenerated='/(translations/|\.fake-vi/)'
  mapfile -t FILES < <(
    { git ls-files; git ls-files --others --exclude-standard; } 2>/dev/null \
      | sort -u | grep -vE "(^|/)(\.env\.example|\.mcp\.json\.example|README|CLAUDE\.md|.*\.test\..*|.*-spec\..*)$" \
      | grep -vE "$excludeGenerated" \
      | grep -vE '\.(lock|pdf|png|jpg|jpeg|svg|gif|woff2?|ttf|eot|map)$'
  )
fi

# Bỏ qua các file nhạy cảm pattern placeholder (không phải token thật)
PLACEHOLDER_RE='(TOKEN|KEY|SECRET|PASSWORD|YOUR_|EXAMPLE|xxx|XXXX|DEMO|dummy|test-key|\.env\.example)'

total=0
for f in "${FILES[@]}"; do
  [ -f "$f" ] || continue
  # Bỏ qua binary (null-byte) — tránh warning và false positive.
  # Dùng grep -I (built-in binary detection): pattern $'\x00' và PCRE \x00 đều
  # không đáng tin trên ugrep (pattern bị cắt tại NUL → khớp nhầm). -I trả
  # exit 0 = text → scan; exit 1 = binary → skip.
  if ! LC_ALL=C grep -qI '.' "$f" 2>/dev/null; then
    continue
  fi
  # Phần nội dung khớp token thật (không phải placeholder).
  # Redirect stderr: binary đã skip ở trên, nhưng ugrep vẫn cảnh báo "null byte
  # ignored" khi đọc — làm nhiễu output.
  content="$(cat "$f" 2>/dev/null)"
  if grep -qE "$(IFS='|'; echo "${PATTERNS[*]}")" <<<"$content" 2>/dev/null; then
    # nếu toàn bộ dòng khớp là placeholder → bỏ qua
    if grep -qE "$PLACEHOLDER_RE" <<<"$content" && ! grep -qvE "$PLACEHOLDER_RE" <<<"$content"; then
      continue
    fi
    echo "== $f"
    while IFS= read -r line_no; do
      # grep -nE trả "N:line" — tách số dòng N trước khi dùng làm sed address
      n="${line_no%%:*}"
      sample="$(sed -n "${n}p" "$f" | mask | cut -c1-100)"
      printf '  [%s:%s] %s\n' "$f" "$n" "$sample"
      total=$((total+1))
    done < <(grep -nE "$(IFS='|'; echo "${PATTERNS[*]}")" <<<"$content")
  fi
done

if [ "$total" -gt 0 ]; then
  echo "check-token-leak: $total dòng khả nghi (chỉ cảnh báo — verify thủ công trước khi push). Xem .claude/rules/claude_dev_integrations.md"
  exit 1
fi
echo "check-token-leak: sạch (mode=$MODE)"
exit 0