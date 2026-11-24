#!/usr/bin/env bash
# Seed Agent Document policy trees into the Dochub public library.
# Does not delete data/documents/. Run on the Mac that hosts Dochub, as a curator.
#
# Public write allowlist (keep in sync):
#   Dochub:  DOCHUB_PUBLIC_CURATORS=id1,id2
#   Agent:   KNOWLEDGE_PUBLIC_CURATORS=id1,id2
#            or config knowledge.publicCurators / dochub.publicCurators
#            (admins in adminUserIds may also write public folders)
#
# Usage:
#   DOCUMENT_FILES_ROOT=/path/to/data/documents \
#   DOCHUB_DIR=/path/to/document-qmd \
#   ./scripts/seed-public-knowledge.sh [--index]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DOCS="${DOCUMENT_FILES_ROOT:-$ROOT/data/documents}"
DOCHUB_DIR="${DOCHUB_DIR:-/workspace/documents}"
INDEX_FLAG="${1:-}"

if [[ ! -d "$DOCS" ]]; then
  echo "Document source not found: $DOCS" >&2
  exit 1
fi
if [[ ! -f "$DOCHUB_DIR/src/dochub/__main__.py" ]]; then
  echo "Dochub checkout not found: $DOCHUB_DIR" >&2
  exit 1
fi

# id:dirName pairs from DOCUMENT_SLOTS. sfc is seeded but hidden from FILES/@.
SLOTS=(
  spr:spr
  csr:csr
  acqn:acqn
  department-it-security:department-it-security
  g3:g3
  rm-manual:rm-manual
  s17:s17
  sfc:sfc
  training-and-development-guide:training-and-development-guide
  training-guide:training-guide
)

cd "$DOCHUB_DIR"
for entry in "${SLOTS[@]}"; do
  folder="${entry%%:*}"
  dir="${entry##*:}"
  src="$DOCS/$dir"
  if [[ ! -d "$src" ]]; then
    echo "skip $folder (missing $src)"
    continue
  fi
  extra=()
  if [[ "$folder" == "sfc" ]]; then
    extra+=(--hidden)
  fi
  if [[ "$INDEX_FLAG" == "--index" ]]; then
    extra+=(--index)
  fi
  echo "seed public/$folder from $src"
  PYTHONPATH=src python3 -m dochub seed-public --from "$src" --folder "$folder" "${extra[@]}"
done
