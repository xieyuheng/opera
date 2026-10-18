#!/bin/sh
#
# windbell installer (POSIX)
#
# This script may be downloaded and saved anywhere. It does not assume
# that it is run from inside the windbell source tree.
#
# Usage:
#   sh install.sh
#   sh install.sh --no-build
#
# Environment overrides:
#   WINDBELL_HOME          default: $HOME/.windbell
#   WINDBELL_REPO          default: https://github.com/xieyuheng/windbell.git
#   WINDBELL_REPO_FALLBACK default: https://git.sr.ht/~xieyuheng/windbell
#   WINDBELL_VERSION       default: master
#   WINDBELL_NODE_VERSION  default: v24.21.0
#   WINDBELL_PNPM_VERSION  default: 12.9.1
#   WINDBELL_NODE_MIRROR   default: https://nodejs.org/dist
#   WINDBELL_USER_AGENT    default: a browser-like UA

set -eu

WINDBELL_HOME="${WINDBELL_HOME:-$HOME/.windbell}"
WINDBELL_REPO="${WINDBELL_REPO:-https://github.com/xieyuheng/windbell.git}"
WINDBELL_REPO_FALLBACK="${WINDBELL_REPO_FALLBACK:-https://git.sr.ht/~xieyuheng/windbell}"
WINDBELL_VERSION="${WINDBELL_VERSION:-master}"
WINDBELL_NODE_VERSION="${WINDBELL_NODE_VERSION:-v24.21.0}"
WINDBELL_PNPM_VERSION="${WINDBELL_PNPM_VERSION:-12.9.1}"
DO_BUILD=1

# Node download settings.
#
# Some networks block nodejs.org; we therefore set a browser-like
# User-Agent and fall back to several mirrors unless the user has
# explicitly chosen a mirror.
if [ "${WINDBELL_NODE_MIRROR+x}" = "x" ]; then
  WINDBELL_NODE_MIRROR_IS_SET=1
else
  WINDBELL_NODE_MIRROR_IS_SET=0
fi

WINDBELL_NODE_MIRROR="${WINDBELL_NODE_MIRROR:-https://nodejs.org/dist}"
WINDBELL_USER_AGENT="${WINDBELL_USER_AGENT:-Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36}"
WINDBELL_CONNECT_TIMEOUT="${WINDBELL_CONNECT_TIMEOUT:-15}"
WINDBELL_DOWNLOAD_TIMEOUT="${WINDBELL_DOWNLOAD_TIMEOUT:-600}"
WINDBELL_DOWNLOAD_RETRIES="${WINDBELL_DOWNLOAD_RETRIES:-3}"

usage() {
  cat <<'USAGE'
windbell installer (POSIX)

Usage:
  sh install.sh [options]

Options:
  --home DIR            install root (default: $HOME/.windbell)
  --repo URL            git repository URL
  --version REF         git branch or tag (default: master)
  --node-version VER    Node version, e.g. v24.21.0
  --pnpm-version VER    pnpm version, e.g. 12.9.1
  --no-build            install dependencies only; skip all builds
  -h, --help            show this help
USAGE
}

log() {
  printf '==> %s\n' "$*"
}

warn() {
  printf 'warning: %s\n' "$*" >&2
}

die() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

have_cmd() {
  command -v "$1" >/dev/null 2>&1
}

need_cmd() {
  have_cmd "$1" || die "required command not found: $1"
}

detect_platform() {
  _os="$(uname -s)"
  _arch="$(uname -m)"

  case "$_os" in
    Linux)  _os=linux ;;
    Darwin) _os=darwin ;;
    *)
      die "unsupported OS for this installer: $_os
Windows users should use the PowerShell installer instead."
      ;;
  esac

  case "$_arch" in
    x86_64|amd64) _arch=x64 ;;
    arm64|aarch64) _arch=arm64 ;;
    *)
      die "unsupported architecture: $_arch"
      ;;
  esac

  printf '%s-%s' "$_os" "$_arch"
}

download() {
  _url="$1"
  _out="$2"

  curl -fsSL \
    --connect-timeout "$WINDBELL_CONNECT_TIMEOUT" \
    --max-time "$WINDBELL_DOWNLOAD_TIMEOUT" \
    --retry "$WINDBELL_DOWNLOAD_RETRIES" \
    --retry-delay 2 \
    --retry-connrefused \
    -A "$WINDBELL_USER_AGENT" \
    "$_url" -o "$_out"
}

sha256_of() {
  _file="$1"

  if have_cmd sha256sum; then
    sha256sum "$_file" | awk '{print $1}'
  elif have_cmd shasum; then
    shasum -a 256 "$_file" | awk '{print $1}'
  else
    return 1
  fi
}

verify_node_archive() {
  _archive="$1"
  _name="$2"
  _shasums="$3"

  _expected="$(grep "$_name" "$_shasums" | awk '{print $1}' | head -n 1)"
  if [ -z "$_expected" ]; then
    warn "checksum for $_name not found; skipping checksum verification"
    return 0
  fi

  if ! _actual="$(sha256_of "$_archive")"; then
    warn "no sha256sum/shasum available; skipping checksum verification"
    return 0
  fi

  if [ "$_expected" != "$_actual" ]; then
    die "checksum mismatch for $_name"
  fi
}

node_mirrors() {
  printf '%s\n' "$WINDBELL_NODE_MIRROR"

  if [ "$WINDBELL_NODE_MIRROR_IS_SET" != "1" ]; then
    printf '%s\n' "https://npmmirror.com/mirrors/node"
    printf '%s\n' "https://mirrors.tuna.tsinghua.edu.cn/nodejs-release"
  fi
}

node_archive_exts() {
  if have_cmd xz; then
    printf '%s\n' "tar.xz"
  fi
  printf '%s\n' "tar.gz"
}

extract_node_archive() {
  _archive="$1"
  _dest="$2"

  case "$_archive" in
    *.tar.xz) tar -xJf "$_archive" -C "$_dest" ;;
    *.tar.gz) tar -xzf "$_archive" -C "$_dest" ;;
    *) die "unsupported archive type: $_archive" ;;
  esac
}

install_node() {
  _platform="$1"
  _node_dir="$LIB_DIR/node/$_platform"
  _node_home="$_node_dir/$WINDBELL_NODE_VERSION"

  NODE_HOME="$_node_home"

  if [ -x "$_node_home/bin/node" ]; then
    printf '%s\n' "$WINDBELL_NODE_VERSION" > "$_node_dir/current"
    log "Node $WINDBELL_NODE_VERSION already installed"
    return 0
  fi

  mkdir -p "$_node_dir" "$TMP_DIR/download"

  _shasums="$TMP_DIR/download/SHASUMS256.txt"
  _archive=""
  _name=""
  _downloaded=0

  for _mirror in $(node_mirrors); do
    for _ext in $(node_archive_exts); do
      _name="node-$WINDBELL_NODE_VERSION-$_platform.$_ext"
      _archive="$TMP_DIR/download/$_name"

      log "downloading Node $WINDBELL_NODE_VERSION ($_ext) from $_mirror"

      if download "$_mirror/$WINDBELL_NODE_VERSION/$_name" "$_archive"; then
        if download "$_mirror/$WINDBELL_NODE_VERSION/SHASUMS256.txt" "$_shasums"; then
          verify_node_archive "$_archive" "$_name" "$_shasums"
        else
          warn "could not download SHASUMS256.txt; skipping checksum verification"
        fi

        _downloaded=1
        break
      fi

      warn "download failed: $_mirror/$WINDBELL_NODE_VERSION/$_name"
    done

    if [ "$_downloaded" = "1" ]; then
      break
    fi
  done

  if [ "$_downloaded" != "1" ]; then
    die "failed to download Node $WINDBELL_NODE_VERSION for $_platform from all mirrors"
  fi

  log "extracting Node $WINDBELL_NODE_VERSION"
  extract_node_archive "$_archive" "$_node_dir"

  _extracted="$_node_dir/node-$WINDBELL_NODE_VERSION-$_platform"
  if [ ! -d "$_extracted" ]; then
    die "unexpected Node archive layout: $_extracted not found"
  fi

  rm -rf "$_node_home"
  mv "$_extracted" "$_node_home"
  printf '%s\n' "$WINDBELL_NODE_VERSION" > "$_node_dir/current"
}

git_repos() {
  printf '%s\n' "$WINDBELL_REPO"

  if [ -n "${WINDBELL_REPO_FALLBACK:-}" ] && [ "$WINDBELL_REPO_FALLBACK" != "$WINDBELL_REPO" ]; then
    printf '%s\n' "$WINDBELL_REPO_FALLBACK"
  fi
}

install_source() {
  if [ -d "$SRC_DIR/.git" ]; then
    if [ -n "$(git -C "$SRC_DIR" status --porcelain 2>/dev/null || true)" ]; then
      warn "source tree has local changes; skipping update: $SRC_DIR"
      return 0
    fi

    log "updating windbell source to $WINDBELL_VERSION"

    if git -C "$SRC_DIR" fetch --tags origin; then
      if ! git -C "$SRC_DIR" checkout "$WINDBELL_VERSION" >/dev/null 2>&1; then
        die "cannot checkout $WINDBELL_VERSION in $SRC_DIR"
      fi
      git -C "$SRC_DIR" pull --ff-only origin "$WINDBELL_VERSION" >/dev/null 2>&1 || true
      return 0
    fi

    warn "failed to fetch from origin; trying fallback repositories"

    _fetched=0
    for _repo in $(git_repos); do
      log "fetching $WINDBELL_VERSION from $_repo"

      if git -C "$SRC_DIR" fetch --tags "$_repo"; then
        if ! git -C "$SRC_DIR" checkout "$WINDBELL_VERSION" >/dev/null 2>&1; then
          warn "cannot checkout $WINDBELL_VERSION after fetching from $_repo"
          continue
        fi

        git -C "$SRC_DIR" pull --ff-only "$_repo" "$WINDBELL_VERSION" >/dev/null 2>&1 || true
        _fetched=1
        break
      fi

      warn "fetch failed: $_repo"
    done

    if [ "$_fetched" != "1" ]; then
      die "failed to update windbell source from all repositories"
    fi

    return 0
  fi

  if [ -e "$SRC_DIR" ] && [ -n "$(ls -A "$SRC_DIR" 2>/dev/null || true)" ]; then
    die "$SRC_DIR exists and is not a git repository"
  fi

  mkdir -p "$WINDBELL_HOME/src"

  _cloned=0
  for _repo in $(git_repos); do
    rm -rf "$SRC_DIR"
    log "cloning windbell source into $SRC_DIR from $_repo"

    if git clone --branch "$WINDBELL_VERSION" "$_repo" "$SRC_DIR"; then
      _cloned=1
      break
    fi

    warn "git clone failed: $_repo"
  done

  if [ "$_cloned" != "1" ]; then
    die "failed to clone windbell source from all repositories"
  fi
}

install_pnpm() {
  PNPM_DIR="$LIB_DIR/pnpm/$WINDBELL_PNPM_VERSION"
  PNPM_BIN="$PNPM_DIR/node_modules/.bin/pnpm"

  mkdir -p "$PNPM_DIR" "$LIB_DIR/pnpm/store" "$LIB_DIR/npm/global"
  mkdir -p "$TMP_DIR/npm"

  if [ ! -x "$PNPM_BIN" ]; then
    log "installing pnpm $WINDBELL_PNPM_VERSION with local npm"

    cat > "$PNPM_DIR/package.json" <<EOF
{
  "private": true,
  "dependencies": {
    "pnpm": "$WINDBELL_PNPM_VERSION"
  }
}
EOF

    (
      cd "$PNPM_DIR"
      PATH="$NODE_HOME/bin:$PATH" \
      npm_config_cache="$TMP_DIR/npm" \
      npm_config_prefix="$LIB_DIR/npm/global" \
      "$NODE_HOME/bin/npm" install --no-audit --no-fund --loglevel=error
    )
  else
    log "pnpm $WINDBELL_PNPM_VERSION already installed"
  fi

  printf '%s\n' "$WINDBELL_PNPM_VERSION" > "$LIB_DIR/pnpm/current"
}

run_pnpm_install() {
  log "installing workspace dependencies with pnpm"

  (
    cd "$SRC_DIR"
    PATH="$NODE_HOME/bin:$PATH" \
    XDG_CACHE_HOME="$TMP_DIR" \
    npm_config_cache="$TMP_DIR/npm" \
    npm_config_store_dir="$LIB_DIR/pnpm/store" \
    "$PNPM_BIN" install --frozen-lockfile --store-dir "$LIB_DIR/pnpm/store"
  )
}

build_web() {
  log "building windbell-web"
  (
    cd "$SRC_DIR"
    PATH="$NODE_HOME/bin:$PATH" \
    XDG_CACHE_HOME="$TMP_DIR" \
    npm_config_cache="$TMP_DIR/npm" \
    sh ./scripts/run-in.sh windbell-web.js clean.sh build.sh
  )
}

build_project() {
  if [ "$DO_BUILD" != "1" ]; then
    log "skipping build"
    return 0
  fi

  build_web
}

write_shims() {
  mkdir -p "$BIN_DIR" "$LIBEXEC_DIR"

  cat > "$LIBEXEC_DIR/windbell-init.sh" <<'SH'
# windbell runtime init (POSIX sh)
#
# Sourced by windbell's bin shims. It resolves WINDBELL_HOME,
# detects the platform, and computes NODE_HOME and PNPM_HOME from
# the "current" version files.

if [ -z "${WINDBELL_HOME:-}" ]; then
  WINDBELL_HOME="$(CDPATH= cd "$WINDBELL_BIN_DIR/.." && pwd)"
fi

case "$(uname -s)" in
  Linux)  _windbell_os=linux ;;
  Darwin) _windbell_os=darwin ;;
  *)
    printf 'windbell: unsupported OS: %s\n' "$(uname -s)" >&2
    exit 1
    ;;
esac

case "$(uname -m)" in
  x86_64|amd64) _windbell_arch=x64 ;;
  arm64|aarch64) _windbell_arch=arm64 ;;
  *)
    printf 'windbell: unsupported architecture: %s\n' "$(uname -m)" >&2
    exit 1
    ;;
esac

WINDBELL_PLATFORM="$_windbell_os-$_windbell_arch"
NODE_CURRENT="$WINDBELL_HOME/lib/node/$WINDBELL_PLATFORM/current"
PNPM_CURRENT="$WINDBELL_HOME/lib/pnpm/current"

if [ ! -f "$NODE_CURRENT" ]; then
  printf 'windbell: Node is not installed for platform %s\n' "$WINDBELL_PLATFORM" >&2
  printf 'windbell: run %s/src/windbell/installers/install.sh first\n' "$WINDBELL_HOME" >&2
  exit 1
fi

if [ ! -f "$PNPM_CURRENT" ]; then
  printf 'windbell: pnpm is not installed\n' >&2
  exit 1
fi

NODE_VERSION="$(cat "$NODE_CURRENT")"
NODE_HOME="$WINDBELL_HOME/lib/node/$WINDBELL_PLATFORM/$NODE_VERSION"
PNPM_VERSION="$(cat "$PNPM_CURRENT")"
PNPM_HOME="$WINDBELL_HOME/lib/pnpm/$PNPM_VERSION"

export WINDBELL_HOME
export WINDBELL_PLATFORM
export NODE_VERSION
export NODE_HOME
export PNPM_VERSION
export PNPM_HOME
SH

  cat > "$BIN_DIR/semiosis" <<'SH'
#!/bin/sh
set -eu
_windbell_bin_dir="$(CDPATH= cd "$(dirname "$0")" && pwd)"
if [ ! -f "$_windbell_bin_dir/../libexec/windbell-init.sh" ]; then
  _windbell_bin_dir="$HOME/.windbell/bin"
fi
WINDBELL_BIN_DIR="$_windbell_bin_dir"
. "$WINDBELL_BIN_DIR/../libexec/windbell-init.sh"
export PATH="$NODE_HOME/bin:$PATH"
export NODE_COMPILE_CACHE="$WINDBELL_HOME/tmp/node"
export WINDBELL_DATABASE="${WINDBELL_DATABASE:-$WINDBELL_HOME/database}"
exec "$NODE_HOME/bin/node" --stack-size=65536 "$WINDBELL_HOME/src/windbell/packages/semiosis.js/src/main.ts" "$@"
SH

  cat > "$BIN_DIR/windbell" <<'SH'
#!/bin/sh
set -eu
_windbell_bin_dir="$(CDPATH= cd "$(dirname "$0")" && pwd)"
if [ ! -f "$_windbell_bin_dir/../libexec/windbell-init.sh" ]; then
  _windbell_bin_dir="$HOME/.windbell/bin"
fi
WINDBELL_BIN_DIR="$_windbell_bin_dir"
. "$WINDBELL_BIN_DIR/../libexec/windbell-init.sh"
export PATH="$NODE_HOME/bin:$PATH"
export NODE_COMPILE_CACHE="$WINDBELL_HOME/tmp/node"
export WINDBELL_DATABASE="${WINDBELL_DATABASE:-$WINDBELL_HOME/database}"
exec "$NODE_HOME/bin/node" "$WINDBELL_HOME/src/windbell/packages/windbell-cli.js/src/main.ts" "$@"
SH

  chmod +x "$BIN_DIR/semiosis" "$BIN_DIR/windbell"
}

init_database() {
  mkdir -p "$DB_DIR"

  if [ ! -f "$DB_DIR/.gitignore" ]; then
    printf '.secrets/\n' > "$DB_DIR/.gitignore"
  fi

  if [ ! -d "$DB_DIR/.git" ]; then
    git -C "$DB_DIR" init -q
  fi
}

final_message() {
  printf '\n'
  log "windbell installed"
  printf '  home:     %s\n' "$WINDBELL_HOME"
  printf '  node:     %s\n' "$NODE_HOME/bin/node"
  printf '  pnpm:     %s\n' "$PNPM_BIN"
  printf '  source:   %s\n' "$SRC_DIR"
  printf '  database: %s\n' "$DB_DIR"
  printf '\n'
  printf 'Add this to your shell profile if you want windbell commands in PATH:\n'
  printf '\n'
  printf '  export PATH="%s/bin:$PATH"\n' "$WINDBELL_HOME"
  printf '\n'
  printf 'This directory contains only windbell commands; Node, npm, and pnpm are not exposed.\n'
  printf '\n'
}

parse_args() {
  while [ $# -gt 0 ]; do
    case "$1" in
      --home)
        [ $# -ge 2 ] || die "--home requires an argument"
        WINDBELL_HOME="$2"
        shift 2
        ;;
      --repo)
        [ $# -ge 2 ] || die "--repo requires an argument"
        WINDBELL_REPO="$2"
        shift 2
        ;;
      --version)
        [ $# -ge 2 ] || die "--version requires an argument"
        WINDBELL_VERSION="$2"
        shift 2
        ;;
      --node-version)
        [ $# -ge 2 ] || die "--node-version requires an argument"
        WINDBELL_NODE_VERSION="$2"
        shift 2
        ;;
      --pnpm-version)
        [ $# -ge 2 ] || die "--pnpm-version requires an argument"
        WINDBELL_PNPM_VERSION="$2"
        shift 2
        ;;
      --no-build)
        DO_BUILD=0
        shift
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        usage >&2
        die "unknown option: $1"
        ;;
    esac
  done
}

main() {
  parse_args "$@"

  SRC_DIR="$WINDBELL_HOME/src/windbell"
  LIB_DIR="$WINDBELL_HOME/lib"
  LIBEXEC_DIR="$WINDBELL_HOME/libexec"
  BIN_DIR="$WINDBELL_HOME/bin"
  TMP_DIR="$WINDBELL_HOME/tmp"
  DB_DIR="$WINDBELL_HOME/database"

  need_cmd uname
  need_cmd tar
  need_cmd git

  need_cmd curl

  case "$WINDBELL_NODE_VERSION" in
    v*) ;;
    *) WINDBELL_NODE_VERSION="v$WINDBELL_NODE_VERSION" ;;
  esac

  mkdir -p "$LIB_DIR" "$LIBEXEC_DIR" "$BIN_DIR" "$TMP_DIR/download" "$TMP_DIR/npm" \
    "$TMP_DIR/node" "$TMP_DIR/pnpm" \
    "$LIB_DIR/node" "$LIB_DIR/pnpm" "$LIB_DIR/pnpm/store" "$LIB_DIR/npm" "$LIB_DIR/npm/global"

  WINDBELL_PLATFORM="$(detect_platform)"

  install_node "$WINDBELL_PLATFORM"
  install_source
  install_pnpm
  run_pnpm_install
  write_shims
  init_database
  build_project
  final_message
}

main "$@"
