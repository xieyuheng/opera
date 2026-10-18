#!/usr/bin/env pwsh
#Requires -Version 7.3
#
# windbell installer (Windows)
#
# This script may be downloaded and saved anywhere. It does not assume
# that it is run from inside the windbell source tree.
#
# Usage:
#   pwsh -File install.ps1
#   pwsh -File install.ps1 --no-build
#
# Environment overrides:
#   WINDBELL_HOME          default: $HOME\.windbell
#   WINDBELL_REPO          default: https://github.com/xieyuheng/windbell.git
#   WINDBELL_REPO_FALLBACK default: https://git.sr.ht/~xieyuheng/windbell
#   WINDBELL_VERSION       default: master
#   WINDBELL_NODE_VERSION  default: v24.21.0
#   WINDBELL_PNPM_VERSION  default: 12.9.1
#   WINDBELL_NODE_MIRROR   default: https://nodejs.org/dist
#   WINDBELL_USER_AGENT    default: a browser-like UA
#
# NOTE: native commands are allowed to fail here (downloads fall back to
# mirrors, git fetch falls back to other remotes). We therefore keep
# $PSNativeCommandUseErrorActionPreference at its default $false and check
# $LASTEXITCODE explicitly where it matters.

$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------
# helpers

function Get-EnvOr {
  param([string]$Name, [string]$Default)
  $value = [Environment]::GetEnvironmentVariable($Name)
  if ([string]::IsNullOrEmpty($value)) { return $Default }
  return $value
}

function Write-Log {
  param([string]$Message)
  Write-Host "==> $Message"
}

function Write-Warn {
  param([string]$Message)
  [Console]::Error.WriteLine("warning: $Message")
}

function Write-Die {
  param([string]$Message)
  [Console]::Error.WriteLine("error: $Message")
  exit 1
}

function Test-Cmd {
  param([string]$Name)
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Assert-Cmd {
  param([string]$Name)
  if (-not (Test-Cmd $Name)) { Write-Die "required command not found: $Name" }
}

function Get-NodeMirrors {
  $list = @($script:NodeMirror)
  if (-not $script:NodeMirrorIsSet) {
    $list += 'https://npmmirror.com/mirrors/node'
    $list += 'https://mirrors.tuna.tsinghua.edu.cn/nodejs-release'
  }
  return $list
}

function Get-GitRepos {
  $list = @($script:WindbellRepo)
  if ($script:WindbellRepoFallback -and $script:WindbellRepoFallback -ne $script:WindbellRepo) {
    $list += $script:WindbellRepoFallback
  }
  return $list
}

# ---------------------------------------------------------------------------
# configuration (environment first, --options override later)

$script:WindbellHome         = Get-EnvOr 'WINDBELL_HOME'          (Join-Path $HOME '.windbell')
$script:WindbellRepo         = Get-EnvOr 'WINDBELL_REPO'          'https://github.com/xieyuheng/windbell.git'
$script:WindbellRepoFallback = Get-EnvOr 'WINDBELL_REPO_FALLBACK' 'https://git.sr.ht/~xieyuheng/windbell'
$script:WindbellVersion      = Get-EnvOr 'WINDBELL_VERSION'       'master'
$script:NodeVersion          = Get-EnvOr 'WINDBELL_NODE_VERSION'  'v24.21.0'
$script:PnpmVersion          = Get-EnvOr 'WINDBELL_PNPM_VERSION'  '12.9.1'
$script:DoBuild              = $true

$script:NodeMirrorIsSet   = -not [string]::IsNullOrEmpty([Environment]::GetEnvironmentVariable('WINDBELL_NODE_MIRROR'))
$script:NodeMirror        = Get-EnvOr 'WINDBELL_NODE_MIRROR' 'https://nodejs.org/dist'
$script:UserAgent         = Get-EnvOr 'WINDBELL_USER_AGENT' 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
$script:ConnectTimeout    = Get-EnvOr 'WINDBELL_CONNECT_TIMEOUT' '15'
$script:DownloadTimeout   = Get-EnvOr 'WINDBELL_DOWNLOAD_TIMEOUT' '600'
$script:DownloadRetries   = Get-EnvOr 'WINDBELL_DOWNLOAD_RETRIES' '3'

# ---------------------------------------------------------------------------
# platform / download / checksum

function Get-Platform {
  $arch = switch -Regex ([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString()) {
    'X64'   { 'x64';   break }
    'Arm64' { 'arm64'; break }
    default { Write-Die "unsupported architecture: $([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture)" }
  }
  return "win-$arch"
}

function Get-Download {
  param([string]$Url, [string]$Out)

  if (Test-Cmd 'curl.exe') {
    & curl.exe -fsSL `
      --connect-timeout $script:ConnectTimeout `
      --max-time $script:DownloadTimeout `
      --retry $script:DownloadRetries `
      --retry-delay 2 `
      --retry-connrefused `
      -A $script:UserAgent `
      $Url -o $Out
    return ($LASTEXITCODE -eq 0)
  }

  try {
    Invoke-WebRequest -Uri $Url -OutFile $Out `
      -UserAgent $script:UserAgent `
      -TimeoutSec ([int]$script:DownloadTimeout)
    return $true
  } catch {
    return $false
  }
}

function Get-Sha256 {
  param([string]$Path)
  return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Assert-NodeArchive {
  param([string]$Archive, [string]$Name, [string]$Shasums)

  $expected = ''
  foreach ($line in [IO.File]::ReadAllLines($Shasums)) {
    $parts = $line -split '\s+'
    if ($parts.Count -ge 2 -and $parts[1] -eq $Name) { $expected = $parts[0]; break }
  }

  if ([string]::IsNullOrEmpty($expected)) {
    Write-Warn "checksum for $Name not found; skipping checksum verification"
    return
  }

  $actual = Get-Sha256 $Archive
  if ($expected.ToLowerInvariant() -ne $actual) { Write-Die "checksum mismatch for $Name" }
}

function Expand-NodeArchive {
  param([string]$Archive, [string]$Dest)
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  [IO.Compression.ZipFile]::ExtractToDirectory($Archive, $Dest)
}

function Install-Node {
  param([string]$Platform)

  $nodeDir  = Join-Path $script:LibDir "node/$Platform"
  $nodeHome = Join-Path $nodeDir $script:NodeVersion
  $script:NodeHome = $nodeHome

  if (Test-Path (Join-Path $nodeHome 'node.exe')) {
    Set-Content -LiteralPath (Join-Path $nodeDir 'current') -Value $script:NodeVersion
    Write-Log "Node $script:NodeVersion already installed"
    return
  }

  $downloadDir = Join-Path $script:TmpDir 'download'
  New-Item -ItemType Directory -Force -Path $nodeDir, $downloadDir | Out-Null

  $name    = "node-$script:NodeVersion-$Platform.zip"
  $archive = Join-Path $downloadDir $name
  $shasums = Join-Path $downloadDir 'SHASUMS256.txt'
  $ok      = $false

  foreach ($mirror in Get-NodeMirrors) {
    Write-Log "downloading Node $script:NodeVersion from $mirror"

    if (-not (Get-Download "$mirror/$script:NodeVersion/$name" $archive)) {
      Write-Warn "download failed: $mirror/$script:NodeVersion/$name"
      continue
    }

    if (Get-Download "$mirror/$script:NodeVersion/SHASUMS256.txt" $shasums) {
      Assert-NodeArchive $archive $name $shasums
    } else {
      Write-Warn 'could not download SHASUMS256.txt; skipping checksum verification'
    }

    $ok = $true
    break
  }

  if (-not $ok) {
    Write-Die "failed to download Node $script:NodeVersion for $Platform from all mirrors"
  }

  $extracted = Join-Path $nodeDir "node-$script:NodeVersion-$Platform"

  # ZipFile::ExtractToDirectory refuses to overwrite, so clear any leftovers
  # from a previous (possibly partial) install first.
  Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $extracted, $nodeHome

  Write-Log "extracting Node $script:NodeVersion"
  Expand-NodeArchive $archive $nodeDir

  if (-not (Test-Path $extracted)) {
    Write-Die "unexpected Node archive layout: $extracted not found"
  }

  Move-Item -LiteralPath $extracted -Destination $nodeHome
  Set-Content -LiteralPath (Join-Path $nodeDir 'current') -Value $script:NodeVersion
}
# ---------------------------------------------------------------------------
# source tree

function Install-Source {
  $src = $script:SrcDir

  if (Test-Path (Join-Path $src '.git')) {
    $dirty = & git -C $src status --porcelain 2>$null
    if ($dirty) {
      Write-Warn "source tree has local changes; skipping update: $src"
      return
    }

    Write-Log "updating windbell source to $script:WindbellVersion"

    & git -C $src fetch --tags origin 2>$null

    if ($LASTEXITCODE -eq 0) {
      & git -C $src checkout $script:WindbellVersion 2>$null
      if ($LASTEXITCODE -ne 0) { Write-Die "cannot checkout $script:WindbellVersion in $src" }
      & git -C $src pull --ff-only origin $script:WindbellVersion 2>$null
      return
    }

    Write-Warn 'failed to fetch from origin; trying fallback repositories'

    $fetched = $false
    foreach ($repo in Get-GitRepos) {
      Write-Log "fetching $script:WindbellVersion from $repo"

      & git -C $src fetch --tags $repo 2>$null
      if ($LASTEXITCODE -ne 0) {
        Write-Warn "fetch failed: $repo"
        continue
      }

      & git -C $src checkout $script:WindbellVersion 2>$null
      if ($LASTEXITCODE -ne 0) {
        Write-Warn "cannot checkout $script:WindbellVersion after fetching from $repo"
        continue
      }

      & git -C $src pull --ff-only $repo $script:WindbellVersion 2>$null
      $fetched = $true
      break
    }

    if (-not $fetched) { Write-Die 'failed to update windbell source from all repositories' }
    return
  }

  if ((Test-Path $src) -and (Get-ChildItem -Force -Path $src | Select-Object -First 1)) {
    Write-Die "$src exists and is not a git repository"
  }

  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $src) | Out-Null

  $cloned = $false
  foreach ($repo in Get-GitRepos) {
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $src
    Write-Log "cloning windbell source into $src from $repo"

    & git clone --branch $script:WindbellVersion $repo $src 2>$null
    if ($LASTEXITCODE -eq 0) { $cloned = $true; break }

    Write-Warn "git clone failed: $repo"
  }

  if (-not $cloned) { Write-Die 'failed to clone windbell source from all repositories' }
}

# ---------------------------------------------------------------------------
# pnpm

function Install-Pnpm {
  $script:PnpmDir = Join-Path $script:LibDir "pnpm/$script:PnpmVersion"
  $script:PnpmBin = Join-Path $script:PnpmDir 'node_modules\.bin\pnpm.cmd'

  New-Item -ItemType Directory -Force -Path $script:PnpmDir,
    (Join-Path $script:LibDir 'pnpm\store'),
    (Join-Path $script:LibDir 'npm\global'),
    (Join-Path $script:TmpDir 'npm') | Out-Null

  if (-not (Test-Path $script:PnpmBin)) {
    Write-Log "installing pnpm $script:PnpmVersion with local npm"

    $manifest = @"
{
  "private": true,
  "dependencies": {
    "pnpm": "$script:PnpmVersion"
  }
}
"@
    [IO.File]::WriteAllText((Join-Path $script:PnpmDir 'package.json'), $manifest)

    Push-Location $script:PnpmDir
    try {
      $env:PATH = "$script:NodeHome;$env:PATH"
      $env:npm_config_cache = Join-Path $script:TmpDir 'npm'
      $env:npm_config_prefix = Join-Path $script:LibDir 'npm\global'

      & (Join-Path $script:NodeHome 'npm.cmd') install --no-audit --no-fund --loglevel=error
      if ($LASTEXITCODE -ne 0) { Write-Die "npm install failed in $script:PnpmDir" }
    } finally {
      Pop-Location
    }
  } else {
    Write-Log "pnpm $script:PnpmVersion already installed"
  }

  Set-Content -LiteralPath (Join-Path $script:LibDir 'pnpm\current') -Value $script:PnpmVersion
}

function Set-WindbellEnv {
  $env:PATH                     = "$script:NodeHome;$env:PATH"
  $env:XDG_CACHE_HOME           = $script:TmpDir
  $env:npm_config_cache         = Join-Path $script:TmpDir 'npm'
  $env:npm_config_store_dir     = Join-Path $script:LibDir 'pnpm\store'
}

function Invoke-PnpmInstall {
  Write-Log 'installing workspace dependencies with pnpm'

  Push-Location $script:SrcDir
  try {
    Set-WindbellEnv
    & $script:PnpmBin install --frozen-lockfile --store-dir (Join-Path $script:LibDir 'pnpm\store')
    if ($LASTEXITCODE -ne 0) { Write-Die 'pnpm install failed' }
  } finally {
    Pop-Location
  }
}

# ---------------------------------------------------------------------------
# build / package

function Invoke-RunIn {
  param([string]$Package, [string[]]$Tasks)

  Push-Location $script:SrcDir
  try {
    Set-WindbellEnv
    & (Join-Path $script:SrcDir 'scripts\run-in.ps1') $Package @Tasks
    if ($LASTEXITCODE -ne 0) { Write-Die "task failed: $Package $($Tasks -join ' ')" }
  } finally {
    Pop-Location
  }
}

function Build-Web {
  Write-Log 'building windbell-web'
  Invoke-RunIn 'windbell-web.js' @('clean', 'build')
}

function Invoke-BuildProject {
  if (-not $script:DoBuild) {
    Write-Log 'skipping build'
    return
  }

  Build-Web
}
# ---------------------------------------------------------------------------
# shims

function Write-Shims {
  New-Item -ItemType Directory -Force -Path $script:BinDir, $script:LibexecDir | Out-Null

  $ascii = [Text.Encoding]::ASCII
  $init = @(
    '@echo off'
    'rem windbell runtime init (Windows cmd)'
    'rem'
    'rem Sourced (via call) by the windbell bin shims. It resolves'
    'rem WINDBELL_HOME and the platform, then reads NODE_HOME and'
    'rem PNPM_HOME from the "current" version files.'
    'rem'
    'rem This file must NOT use setlocal: the caller needs the variables.'
    ''
    'if "%WINDBELL_HOME%"=="" set "WINDBELL_HOME=%~dp0.."'
    ('set "WINDBELL_PLATFORM=' + $script:WindbellPlatform + '"')
    'set "NODE_CURRENT=%WINDBELL_HOME%\lib\node\%WINDBELL_PLATFORM%\current"'
    'set "PNPM_CURRENT=%WINDBELL_HOME%\lib\pnpm\current"'
    ''
    'if not exist "%NODE_CURRENT%" ('
    '  >&2 echo windbell: Node is not installed for platform %WINDBELL_PLATFORM%'
    '  >&2 echo windbell: run %WINDBELL_HOME%\src\windbell\installers\install.ps1 first'
    '  exit /b 1'
    ')'
    ''
    'if not exist "%PNPM_CURRENT%" ('
    '  >&2 echo windbell: pnpm is not installed'
    '  exit /b 1'
    ')'
    ''
    'set "NODE_VERSION="'
    'set /p NODE_VERSION=<"%NODE_CURRENT%"'
    'set "NODE_HOME=%WINDBELL_HOME%\lib\node\%WINDBELL_PLATFORM%\%NODE_VERSION%"'
    ''
    'set "PNPM_VERSION="'
    'set /p PNPM_VERSION=<"%PNPM_CURRENT%"'
    'set "PNPM_HOME=%WINDBELL_HOME%\lib\pnpm\%PNPM_VERSION%"'
    ''
    'exit /b 0'
  )

  [IO.File]::WriteAllText(
    (Join-Path $script:LibexecDir 'windbell-init.cmd'),
    (($init -join "`r`n") + "`r`n"),
    $ascii
  )

  $shims = [ordered]@{}

  $preamble = @(
    '@echo off'
    'setlocal'
    'set "WINDBELL_BIN_DIR=%~dp0"'
    'set "WINDBELL_INIT=%WINDBELL_BIN_DIR%..\libexec\windbell-init.cmd"'
    'if not exist "%WINDBELL_INIT%" set "WINDBELL_INIT=%USERPROFILE%\.windbell\libexec\windbell-init.cmd"'
    'if not exist "%WINDBELL_INIT%" ('
    '  >&2 echo windbell: cannot find windbell-init.cmd'
    '  exit /b 1'
    ')'
    'call "%WINDBELL_INIT%"'
    'if errorlevel 1 exit /b 1'
  )

  $shims['semiosis.cmd'] = $preamble + @(
    'set "PATH=%NODE_HOME%;%PATH%"'
    'set "NODE_COMPILE_CACHE=%WINDBELL_HOME%\tmp\node"'
    'if "%WINDBELL_DATABASE%"=="" set "WINDBELL_DATABASE=%WINDBELL_HOME%\database"'
    '"%NODE_HOME%\node.exe" --stack-size=65536 "%WINDBELL_HOME%\src\windbell\packages\semiosis.js\src\main.ts" %*'
    'exit /b %ERRORLEVEL%'
  )

  $shims['windbell.cmd'] = $preamble + @(
    'set "PATH=%NODE_HOME%;%PATH%"'
    'set "NODE_COMPILE_CACHE=%WINDBELL_HOME%\tmp\node"'
    'if "%WINDBELL_DATABASE%"=="" set "WINDBELL_DATABASE=%WINDBELL_HOME%\database"'
    '"%NODE_HOME%\node.exe" "%WINDBELL_HOME%\src\windbell\packages\windbell-cli.js\src\main.ts" %*'
    'exit /b %ERRORLEVEL%'
  )

  foreach ($name in $shims.Keys) {
    $text = ($shims[$name] -join "`r`n") + "`r`n"
    [IO.File]::WriteAllText((Join-Path $script:BinDir $name), $text, $ascii)
  }
}

# ---------------------------------------------------------------------------
# database / final message / usage

function Initialize-Database {
  New-Item -ItemType Directory -Force -Path $script:DbDir | Out-Null

  $gitignore = Join-Path $script:DbDir '.gitignore'
  if (-not (Test-Path $gitignore)) {
    [IO.File]::WriteAllText($gitignore, ".secrets/`n")
  }

  if (-not (Test-Path (Join-Path $script:DbDir '.git'))) {
    & git -C $script:DbDir init -q 2>$null
  }
}

function Write-FinalMessage {
  Write-Host ''
  Write-Log 'windbell installed'
  Write-Host "  home:     $script:WindbellHome"
  Write-Host "  node:     $(Join-Path $script:NodeHome 'node.exe')"
  Write-Host "  pnpm:     $script:PnpmBin"
  Write-Host "  source:   $script:SrcDir"
  Write-Host "  database: $script:DbDir"

  Write-Host ''
  Write-Host 'Add this directory to your PATH if you want windbell commands available:'
  Write-Host ''
  Write-Host "  $script:BinDir"
  Write-Host ''
  Write-Host 'This directory contains only windbell commands; Node, npm, and pnpm are not exposed.'
  Write-Host ''
}

function Write-Usage {
  @(
    'windbell installer (Windows)'
    ''
    'Usage:'
    '  pwsh -File install.ps1 [options]'
    ''
    'Options:'
    '  --home DIR            install root (default: $HOME\.windbell)'
    '  --repo URL            git repository URL'
    '  --version REF         git branch or tag (default: master)'
    '  --node-version VER    Node version, e.g. v24.21.0'
    '  --pnpm-version VER    pnpm version, e.g. 12.9.1'
    '  --no-build            install dependencies only; skip all builds'
    '  -h, --help            show this help'
  ) | ForEach-Object { Write-Host $_ }
}

# ---------------------------------------------------------------------------
# main

function Main {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)

  $i = 0
  while ($i -lt $Arguments.Count) {
    $arg = $Arguments[$i]

    if ($arg -eq '--home') {
      $i++; if ($i -ge $Arguments.Count) { Write-Die '--home requires an argument' }
      $script:WindbellHome = $Arguments[$i]; $i++
    } elseif ($arg -eq '--repo') {
      $i++; if ($i -ge $Arguments.Count) { Write-Die '--repo requires an argument' }
      $script:WindbellRepo = $Arguments[$i]; $i++
    } elseif ($arg -eq '--version') {
      $i++; if ($i -ge $Arguments.Count) { Write-Die '--version requires an argument' }
      $script:WindbellVersion = $Arguments[$i]; $i++
    } elseif ($arg -eq '--node-version') {
      $i++; if ($i -ge $Arguments.Count) { Write-Die '--node-version requires an argument' }
      $script:NodeVersion = $Arguments[$i]; $i++
    } elseif ($arg -eq '--pnpm-version') {
      $i++; if ($i -ge $Arguments.Count) { Write-Die '--pnpm-version requires an argument' }
      $script:PnpmVersion = $Arguments[$i]; $i++
    } elseif ($arg -eq '--no-build') {
      $script:DoBuild = $false; $i++
    } elseif ($arg -eq '-h' -or $arg -eq '--help') {
      Write-Usage; exit 0
    } else {
      Write-Usage; Write-Die "unknown option: $arg"
    }
  }

  $script:SrcDir = Join-Path $script:WindbellHome 'src\windbell'
  $script:LibDir = Join-Path $script:WindbellHome 'lib'
  $script:LibexecDir = Join-Path $script:WindbellHome 'libexec'
  $script:BinDir = Join-Path $script:WindbellHome 'bin'
  $script:TmpDir = Join-Path $script:WindbellHome 'tmp'
  $script:DbDir  = Join-Path $script:WindbellHome 'database'

  Assert-Cmd 'git'

  if ($script:NodeVersion -notlike 'v*') { $script:NodeVersion = "v$script:NodeVersion" }

  New-Item -ItemType Directory -Force -Path $script:LibDir, $script:LibexecDir, $script:BinDir,
    (Join-Path $script:TmpDir 'download'), (Join-Path $script:TmpDir 'npm'),
    (Join-Path $script:TmpDir 'node'), (Join-Path $script:TmpDir 'pnpm'),
    (Join-Path $script:LibDir 'node'), (Join-Path $script:LibDir 'pnpm'),
    (Join-Path $script:LibDir 'pnpm\store'), (Join-Path $script:LibDir 'npm'),
    (Join-Path $script:LibDir 'npm\global') | Out-Null

  $script:WindbellPlatform = Get-Platform

  Install-Node $script:WindbellPlatform
  Install-Source
  Install-Pnpm
  Invoke-PnpmInstall
  Write-Shims
  Initialize-Database
  Invoke-BuildProject
  Write-FinalMessage
}

Main @args
