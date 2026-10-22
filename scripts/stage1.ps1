#!/usr/bin/env pwsh
#Requires -Version 7.3

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

Set-Location (Join-Path $PSScriptRoot '..')

# stage1 -- js/ts code

# ts format

./scripts/run-in.ps1 std.ts format
./scripts/run-in.ps1 http.ts format
./scripts/run-in.ps1 cli.ts format
./scripts/run-in.ps1 windbell.ts format
./scripts/run-in.ps1 fs.ts format
./scripts/run-in.ps1 fs-api.ts format
./scripts/run-in.ps1 sh.ts format
./scripts/run-in.ps1 lock.ts format
./scripts/run-in.ps1 windbell-cli.ts format
./scripts/run-in.ps1 windbell-api.ts format
./scripts/run-in.ps1 windbell-web.vue format

# ts check

./scripts/run-in.ps1 std.ts check
./scripts/run-in.ps1 http.ts check
./scripts/run-in.ps1 cli.ts check
./scripts/run-in.ps1 windbell.ts check
./scripts/run-in.ps1 fs.ts check
./scripts/run-in.ps1 fs-api.ts check
./scripts/run-in.ps1 sh.ts check
./scripts/run-in.ps1 lock.ts check
./scripts/run-in.ps1 windbell-cli.ts check
./scripts/run-in.ps1 windbell-api.ts check
./scripts/run-in.ps1 windbell-web.vue check

# ts test

./scripts/run-in.ps1 std.ts clean test
./scripts/run-in.ps1 fs.ts test
./scripts/run-in.ps1 fs-api.ts test
./scripts/run-in.ps1 sh.ts test
./scripts/run-in.ps1 lock.ts test
./scripts/run-in.ps1 http.ts test
./scripts/run-in.ps1 cli.ts clean test
./scripts/run-in.ps1 windbell.ts clean test
./scripts/run-in.ps1 windbell-cli.ts clean test
./scripts/run-in.ps1 windbell-api.ts clean test

# frontend build

./scripts/run-in.ps1 windbell-web.vue clean build
