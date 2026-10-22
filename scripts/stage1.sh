#!/usr/bin/env bash

set -e

# stage1 -- js/ts code

# ts format

./scripts/run-in.sh std.ts format.sh
./scripts/run-in.sh http.ts format.sh
./scripts/run-in.sh cli.ts format.sh
./scripts/run-in.sh windbell.ts format.sh
./scripts/run-in.sh fs.ts format.sh
./scripts/run-in.sh fs-api.ts format.sh
./scripts/run-in.sh sh.ts format.sh
./scripts/run-in.sh lock.ts format.sh
./scripts/run-in.sh windbell-cli.ts format.sh
./scripts/run-in.sh windbell-api.ts format.sh
./scripts/run-in.sh windbell-web.vue format.sh
./scripts/run-in.sh museum.vue format.sh
./scripts/run-in.sh museum-web.vue format.sh
./scripts/run-in.sh xieyuheng-web.vue format.sh

# ts check

./scripts/run-in.sh std.ts check.sh
./scripts/run-in.sh http.ts check.sh
./scripts/run-in.sh cli.ts check.sh
./scripts/run-in.sh windbell.ts check.sh
./scripts/run-in.sh fs.ts check.sh
./scripts/run-in.sh fs-api.ts check.sh
./scripts/run-in.sh sh.ts check.sh
./scripts/run-in.sh lock.ts check.sh
./scripts/run-in.sh windbell-cli.ts check.sh
./scripts/run-in.sh windbell-api.ts check.sh
./scripts/run-in.sh windbell-web.vue check.sh
./scripts/run-in.sh museum.vue check.sh
./scripts/run-in.sh museum-web.vue check.sh
./scripts/run-in.sh xieyuheng-web.vue check.sh

# ts test

./scripts/run-in.sh std.ts clean.sh test.sh
./scripts/run-in.sh fs.ts test.sh
./scripts/run-in.sh fs-api.ts test.sh
./scripts/run-in.sh sh.ts test.sh
./scripts/run-in.sh lock.ts test.sh
./scripts/run-in.sh http.ts test.sh
./scripts/run-in.sh cli.ts clean.sh test.sh
./scripts/run-in.sh windbell.ts clean.sh test.sh
./scripts/run-in.sh windbell-cli.ts clean.sh test.sh
./scripts/run-in.sh windbell-api.ts clean.sh test.sh

# frontend build

./scripts/run-in.sh windbell-web.vue clean.sh build.sh
./scripts/run-in.sh museum-web.vue clean.sh build.sh
./scripts/run-in.sh xieyuheng-web.vue clean.sh build.sh
