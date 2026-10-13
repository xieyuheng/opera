#!/usr/bin/env pwsh
#Requires -Version 7.3

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

Set-Location (Join-Path $PSScriptRoot '..')

# stage1 -- js/ts code

# ts format

./scripts/run-in.ps1 std.js format
./scripts/run-in.ps1 http.js format
./scripts/run-in.ps1 cli.js format
./scripts/run-in.ps1 semiosis.js format
./scripts/run-in.ps1 fs.js format
./scripts/run-in.ps1 fs-api.js format
./scripts/run-in.ps1 sh.js format
./scripts/run-in.ps1 lock.js format
./scripts/run-in.ps1 windbell-cli.js format
./scripts/run-in.ps1 windbell-api.js format
./scripts/run-in.ps1 windbell-web.js format

# ts check

./scripts/run-in.ps1 std.js check
./scripts/run-in.ps1 http.js check
./scripts/run-in.ps1 cli.js check
./scripts/run-in.ps1 semiosis.js check
./scripts/run-in.ps1 fs.js check
./scripts/run-in.ps1 fs-api.js check
./scripts/run-in.ps1 sh.js check
./scripts/run-in.ps1 lock.js check
./scripts/run-in.ps1 windbell-cli.js check
./scripts/run-in.ps1 windbell-api.js check
./scripts/run-in.ps1 windbell-web.js check

# ts test

./scripts/run-in.ps1 std.js clean test
./scripts/run-in.ps1 fs.js test
./scripts/run-in.ps1 fs-api.js test
./scripts/run-in.ps1 sh.js test
./scripts/run-in.ps1 lock.js test
./scripts/run-in.ps1 http.js test
./scripts/run-in.ps1 cli.js clean test
./scripts/run-in.ps1 semiosis.js clean test
./scripts/run-in.ps1 windbell-cli.js clean test
./scripts/run-in.ps1 windbell-api.js clean test

# frontend build

./scripts/run-in.ps1 windbell-web.js clean build
