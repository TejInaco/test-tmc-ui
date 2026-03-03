#!/bin/bash

set -euo pipefail

TEMP_DIR=""

show_help() {
    cat <<EOF

Usage: $(basename "$0") <url>

Download a public repository from GitHub or GitLab into the current directory.

Supported hosts:
  - github.com
  - gitlab.com

Flags:
  -h|--help   Show this help message

Examples:
  ./$(basename "$0") https://github.com/wot-oss/tmc-ui.git
  ./$(basename "$0") https://gitlab.com/group/project.git
EOF
    exit 0
}

log_info() {
    echo "[INFO] $*"
}

log_warn() {
    echo "[WARN] $*" >&2
}

log_error() {
    echo "[ERROR] $*" >&2
}

cleanup() {
    if [[ -n "${TEMP_DIR}" && -d "${TEMP_DIR}" ]]; then
        rm -rf "${TEMP_DIR}"
    fi
}

fail() {
    log_error "$1"
    exit "${2:-1}"
}

check_dependencies() {
    command -v git >/dev/null 2>&1 || fail "Missing dependency: git."
}

normalize_url() {
    local input_url="$1"
    local normalized="${input_url%/}" # remove trailing slash
    normalized="${normalized%.git}"   # remove trailing .git
    echo "${normalized}"
}

# Globals populated by parse_repository_url:
# REPO_HOST, REPO_OWNER, REPO_NAME, REPO_CLONE_URL
parse_repository_url() {
    local input_url="$1"
    local normalized
    normalized="$(normalize_url "${input_url}")"

    REPO_HOST=""
    REPO_OWNER=""
    REPO_NAME=""
    REPO_CLONE_URL="${input_url%/}"

    # HTTPS format: https://host/owner/repo
    if [[ "${normalized}" =~ ^https://([^/]+)/([^/]+)/([^/]+)$ ]]; then
        REPO_HOST="${BASH_REMATCH[1]}"
        REPO_OWNER="${BASH_REMATCH[2]}"
        REPO_NAME="${BASH_REMATCH[3]}"
    # SSH format: git@host:owner/repo
    elif [[ "${normalized}" =~ ^git@([^:]+):([^/]+)/([^/]+)$ ]]; then
        REPO_HOST="${BASH_REMATCH[1]}"
        REPO_OWNER="${BASH_REMATCH[2]}"
        REPO_NAME="${BASH_REMATCH[3]}"
    else
        fail "Invalid repository URL format: '${input_url}'"
    fi

    REPO_HOST="${REPO_HOST#www.}"

    [[ -n "${REPO_OWNER}" ]] || fail "Invalid repository owner in URL: '${input_url}'"
    [[ -n "${REPO_NAME}" ]] || fail "Invalid repository name in URL: '${input_url}'"
    [[ "${REPO_NAME}" != *" "* ]] || fail "Repository name cannot contain spaces."
}

prepare_destination() {
    local destination="$1"

    if [[ -e "${destination}" ]]; then
        if [[ -d "${destination}" ]]; then
            if [[ -n "$(ls -A "${destination}")" ]]; then
                fail "Destination directory '${destination}' already exists and is not empty."
            fi
            rmdir "${destination}"
        else
            fail "Destination path '${destination}' exists and is not a directory."
        fi
    fi
}

clone_repository() {
    local provider="$1"
    local clone_url="$2"
    local destination="$3"

    prepare_destination "${destination}"

    TEMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/fetchUi.XXXXXX")"
    trap cleanup EXIT INT TERM

    log_info "Provider detected: ${provider}"
    log_info "Cloning repository (depth=1)..."
    git clone --depth 1 "${clone_url}" "${TEMP_DIR}/${destination}" >/dev/null 2>&1 || fail "Failed to clone repository: ${clone_url}"

    mv "${TEMP_DIR}/${destination}" "./${destination}"
    log_info "Repository downloaded to: ./${destination}"
}

download_github() {
    local clone_url="$1"
    local repo_name="$2"
    clone_repository "github" "${clone_url}" "${repo_name}"
}

download_gitlab() {
    local clone_url="$1"
    local repo_name="$2"
    clone_repository "gitlab" "${clone_url}" "${repo_name}"
}

download_repository() {
    local input_url="$1"

    check_dependencies
    parse_repository_url "${input_url}"

    case "${REPO_HOST}" in
    github.com)
        download_github "${REPO_CLONE_URL}" "${REPO_NAME}"
        ;;
    gitlab.com)
        download_gitlab "${REPO_CLONE_URL}" "${REPO_NAME}"
        ;;
    *)
        fail "Unsupported host '${REPO_HOST}'. Only github.com and gitlab.com are supported."
        ;;
    esac

    log_info "Done."
}

if [[ $# -eq 0 ]]; then
    show_help
fi

if [[ $# -ne 1 ]]; then
    log_error "Invalid arguments."
    show_help
fi

case "$1" in
--help | -h)
    show_help
    ;;
*)
    download_repository "$1"
    ;;
esac