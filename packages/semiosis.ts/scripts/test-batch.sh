#!/usr/bin/env bash

set -e

database_dir="$(mktemp -d)"
export WINDBELL_HOME="$database_dir"
trap 'rm -rf "$database_dir"' EXIT

snapshot_dir="snapshot/linux"
mkdir -p "$snapshot_dir"

node src/main.ts batch \
  --provider mock \
  --model conversation \
  --prompts mock/prompts/conversation.md \
  > "$snapshot_dir/conversation.out"

node src/main.ts batch \
  --provider mock \
  --model tool-errors \
  --prompts mock/prompts/tool-errors.md \
  > "$snapshot_dir/tool-errors.out"

node src/main.ts batch \
  --provider mock \
  --model truncate-output \
  --prompts mock/prompts/truncate-output.md \
  --max-output-chars 4 \
  > "$snapshot_dir/truncate-output.out"
