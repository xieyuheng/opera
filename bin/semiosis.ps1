#!/usr/bin/env pwsh
#Requires -Version 7.3

$ErrorActionPreference = 'Stop'

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

node --stack-size=65536 "$root/packages/semiosis.ts/src/main.ts" @args
exit $LASTEXITCODE
