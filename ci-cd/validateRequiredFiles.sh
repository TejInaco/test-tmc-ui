#!/bin/bash

readonly required_files="tmnames.txt,mpns.txt,manufacturers.txt,protocols.txt,tm-catalog.toc.json"

show_help() {
  cat <<EOF
    Usage: $(basename "$0") <catalog_directory>
    Run this command with the path to the catalog directory to validate that all required files are present.
    Flags:
    -h|--help   Show this help message
    Example:
        ./$(basename "$0") public
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

validate_required_files() {
  local target_dir="$1"
  local missing=0
  local file
  local candidate_path

  log_info "Start required files validation"

  if [ ! -d "${target_dir}/.tmc" ]; then
    log_error "Required folder .tmc/ not found"
    exit 1
  fi

  for file in ${required_files//,/ }; do
    file="$(echo "$file" | xargs)"
    [ -z "$file" ] && continue

    if [[ "$file" == */* ]]; then
      candidate_path="$file"
    else
      candidate_path=".tmc/$file"
    fi

    if [ ! -f "${target_dir}/${candidate_path}" ]; then
      log_error "Required file not found: $candidate_path"
      missing=1
    fi
  done

  if [ "$missing" -ne 0 ]; then
    exit 1
  fi

  log_info "Required files validation passed."
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
  validate_required_files "$1"
  ;;
esac
