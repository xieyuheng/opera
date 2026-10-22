#!/usr/bin/env pwsh
#Requires -Version 7.3

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

Set-Location (Join-Path $PSScriptRoot '..')

$operaHome = Join-Path ([IO.Path]::GetTempPath()) ([IO.Path]::GetRandomFileName())
New-Item -ItemType Directory -Path $operaHome | Out-Null
$env:OPERA_HOME = $operaHome

try {
  $snapshotDir = 'snapshot/win32'
  New-Item -ItemType Directory -Force -Path $snapshotDir | Out-Null

  $conversation = @(
    '--provider', 'mock'
    '--model', 'conversation-pwsh'
    '--prompts', 'mock/prompts/conversation.md'
  )
  $conversationOut = Join-Path $snapshotDir 'conversation.out'
  node src/main.ts batch @conversation > $conversationOut

  $toolErrors = @(
    '--provider', 'mock'
    '--model', 'tool-errors-pwsh'
    '--prompts', 'mock/prompts/tool-errors.md'
  )
  $toolErrorsOut = Join-Path $snapshotDir 'tool-errors.out'
  node src/main.ts batch @toolErrors > $toolErrorsOut

  $truncateOutput = @(
    '--provider', 'mock'
    '--model', 'truncate-output-pwsh'
    '--prompts', 'mock/prompts/truncate-output.md'
    '--max-output-chars', '4'
  )
  $truncateOutputOut = Join-Path $snapshotDir 'truncate-output.out'
  node src/main.ts batch @truncateOutput > $truncateOutputOut
} finally {
  Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $operaHome
}
