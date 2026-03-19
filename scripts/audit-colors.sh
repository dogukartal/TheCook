#!/usr/bin/env bash
# audit-colors.sh
# Static analysis script that detects hardcoded hex color values in component files.
# Used as the measuring tool for Phase 14 color token sweep.
#
# Exit 0 = no violations found
# Exit 1 = violations found (expected before sweep plans 02/03 complete)
#
# Excluded:
#   - constants/theme.ts     (token source of truth)
#   - constants/palette.ts   (intentional decorative palettes)
#   - node_modules/          (third-party code)
#   - __tests__/             (test files)
#   - *.test.ts / *.test.tsx (test files)
#   - Lines with // palette-exempt or // theme-exempt comments
#   - Import statements (lines starting with import)

set -euo pipefail

SEARCH_DIR="${1:-TheCook}"

# Find all .ts and .tsx files, excluding exempt paths
violations=$(
  find "$SEARCH_DIR" \
    -type f \( -name "*.ts" -o -name "*.tsx" \) \
    ! -path "*/node_modules/*" \
    ! -path "*/__tests__/*" \
    ! -name "*.test.ts" \
    ! -name "*.test.tsx" \
    ! -path "*/constants/theme.ts" \
    ! -path "*/constants/palette.ts" \
    -print0 \
  | xargs -0 grep -nE "'#[0-9a-fA-F]{3,8}'|\"#[0-9a-fA-F]{3,8}\"" \
  | grep -v 'palette-exempt' \
  | grep -v 'theme-exempt' \
  | grep -v '^[^:]*:[0-9]*:import ' \
  || true
)

if [ -z "$violations" ]; then
  echo "No hardcoded hex color violations found."
  echo "Total violations: 0"
  exit 0
fi

echo "=== Hardcoded Hex Color Violations ==="
echo ""
echo "$violations"
echo ""

count=$(echo "$violations" | wc -l | tr -d ' ')
echo "=== Summary ==="
echo "Total violations: $count"
exit 1
