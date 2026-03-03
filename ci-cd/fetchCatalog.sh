#!/bin/bash

set -euo pipefail

readonly REQUIRED_FILES="tmnames.txt,mpns.txt,manufacturers.txt,protocols.txt,tm-catalog.toc.json"


show_help() {
	cat <<EOF

Usage: $(basename "$0") <url> <destination>

Run this command with a  repository URL to fetch required files from the catalog repository.

Flags:
  -h|--help   Show this help message
  
Example:
  ./$(basename "$0") https://gitlab.com/catalog-example.git public
  ./$(basename "$0") https://github.com/wot-oss/example-catalog.git main/public	
EOF
	exit 0
}
fail() {
    echo "ERROR: $1"
    exit "${2:-1}"
}

check_dependencies() {
    command -v git >/dev/null 2>&1 || fail "Missing dependency: git."
}

download_catalog() {
    local clone_url="$1"
    local target_dir="$2"

    echo ""
    echo "INFO: Start downloading from: $clone_url"
    echo ""

    [[ -n "$target_dir" ]] || fail "Destination folder cannot be empty."
    [[ "$target_dir" != "/" ]] || fail "Destination folder '/' is not allowed."

    if [ -e "$target_dir" ]; then
        rm -rf "$target_dir"
    fi

    git clone --depth 1 "$clone_url" "$target_dir"

    rm -rf "${target_dir}/.git"
    rm -rf "${target_dir}/.gitignore"
    rm -rf "${target_dir}/.github"
    rm -rf "${target_dir}/README.md"

    echo ""
    echo "INFO: Catalog downloaded to: $target_dir"
    echo ""
}

validate_required_files() {
	local target_dir="${1}"
	local missing=0
	local required_files
	local file
	local candidate_path

	echo ""
	echo "INFO: Start required files validation"
	echo ""

	if [ ! -d "${target_dir}/.tmc" ]; then
		echo "ERROR: Required folder .tmc/ not found"
		exit 1
	fi

	required_files="${REQUIRED_FILES//,/ }"

	for file in $required_files; do
		file="$(echo "$file" | xargs)"
		[ -z "$file" ] && continue

		if [[ "$file" == */* ]]; then
			candidate_path="$file"
		else
			candidate_path=".tmc/$file"
		fi

		if [ ! -f "${target_dir}/${candidate_path}" ]; then
			echo "ERROR: Required file not found: $candidate_path"
			missing=1
		fi
	done

	if [ "$missing" -ne 0 ]; then
		exit 1
	fi

	echo "INFO: Required files validation passed."
}

validate_inputs() {
    local input_url="$1"
    local destination="$2"

    if [ -z "$input_url" ]; then
        fail "Missing repository URL argument."
    fi

    if [ -z "$destination" ]; then
        fail "Missing destination folder argument."
    fi

    if ! [[ "$input_url" =~ ^https?:// ]]; then
        fail "URL must start with http:// or https://"
    fi

    if ! echo "$input_url" | grep -qE '^https?://(www\.)?(github\.com|gitlab\.com)/'; then
        fail "URL must be from github.com or gitlab.com"
    fi
}

if [ $# -eq 0 ]; then
	show_help
fi

case "${1:-}" in
--help | -h)
    show_help
    ;;
*)
    if [ $# -ne 2 ]; then
        show_help
    fi

    CATALOG_CLONE_URL="$1"
    DESTINATION_DIR="$2"

    check_dependencies
    validate_inputs "$CATALOG_CLONE_URL" "$DESTINATION_DIR"
    download_catalog "$CATALOG_CLONE_URL" "$DESTINATION_DIR"
    validate_required_files "$DESTINATION_DIR"
    ;;
esac
