#!/usr/bin/env pwsh
#Requires -Version 7.3

$ErrorActionPreference = 'Stop'

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

node "$root/packages/windbell-cli.ts/src/main.ts" @args
exit $LASTEXITCODE
