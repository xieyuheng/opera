#!/usr/bin/env bash

set -e

opera_home="$(mktemp -d)"
export OPERA_HOME="$opera_home"
trap 'rm -rf "$opera_home"' EXIT

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
