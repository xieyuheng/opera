#!/usr/bin/env bash

set -e

# stage1 -- js/ts code

# ts format

./scripts/run-in.sh std.js format.sh
./scripts/run-in.sh http.js format.sh
./scripts/run-in.sh cli.js format.sh
./scripts/run-in.sh semiosis.js format.sh
./scripts/run-in.sh fs.js format.sh
./scripts/run-in.sh fs-api.js format.sh
./scripts/run-in.sh semiosis-api.js format.sh
./scripts/run-in.sh windbell-cli.js format.sh
./scripts/run-in.sh windbell-api.js format.sh
./scripts/run-in.sh windbell-web.js format.sh

# ts check

./scripts/run-in.sh std.js check.sh
./scripts/run-in.sh http.js check.sh
./scripts/run-in.sh cli.js check.sh
./scripts/run-in.sh semiosis.js check.sh
./scripts/run-in.sh fs.js check.sh
./scripts/run-in.sh fs-api.js check.sh
./scripts/run-in.sh semiosis-api.js check.sh
./scripts/run-in.sh windbell-cli.js check.sh
./scripts/run-in.sh windbell-api.js check.sh
./scripts/run-in.sh windbell-web.js check.sh

# ts test

./scripts/run-in.sh std.js clean.sh test.sh
./scripts/run-in.sh http.js test.sh
./scripts/run-in.sh cli.js clean.sh test.sh
./scripts/run-in.sh semiosis.js clean.sh test.sh
./scripts/run-in.sh fs-api.js clean.sh test.sh
./scripts/run-in.sh semiosis-api.js clean.sh test.sh
./scripts/run-in.sh windbell-cli.js clean.sh test.sh
./scripts/run-in.sh windbell-api.js clean.sh test.sh

# frontend build

./scripts/run-in.sh windbell-web.js clean.sh build.sh
