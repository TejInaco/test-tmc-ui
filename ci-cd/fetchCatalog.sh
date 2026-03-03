#!/bin/bash

set -euo pipefail

readonly REQUIRED_FILES="tmnames.txt,mpns.txt,manufacturers.txt,protocols.txt,tm-catalog.toc.json"
readonly PUBLIC_CATALOG_DIR="public"

show_help() {
	cat <<EOF

Usage: $(basename "$0") <url>

Run this command with a  repository URL to fetch required files from the catalog repository.

Flags:
  -h|--help   Show this help message
  
Example:
  ./$(basename "$0") https://gitlab.com/catalog-example.git
  ./$(basename "$0") https://github.com/wot-oss/example-catalog.git


EOF
	exit 0
}

download_catalog_to_public() {
	local target_dir="${1:-$PUBLIC_CATALOG_DIR}"
	local tmp_dir
	local clone_dir

	echo ""
	echo "INFO: Start downloading from: $CATALOG_CLONE_URL"
	echo ""

	tmp_dir="$(mktemp -d)"
	clone_dir="${tmp_dir}/catalog-repo"

	git clone --depth 1 "$CATALOG_CLONE_URL" "$clone_dir"
	rm -rf "${clone_dir}/.git"

	mkdir -p "$target_dir"
	cp -a "${clone_dir}/." "$target_dir/"

	rm -rf "$tmp_dir"
	echo ""
	echo "INFO: Catalog downloaded to: $target_dir"
	echo ""
}

validate_required_files() {
	local target_dir="${1:-$PUBLIC_CATALOG_DIR}"
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

validation() {
	local input_url="${1:-}"

	if [ -z "$input_url" ]; then
		echo " "
		echo "ERROR: Missing repository URL argument."
		echo " "
		exit 1
	fi

	if ! [[ "$input_url" =~ ^https?:// ]]; then
		echo " "
		echo "ERROR: URL must start with http:// or https://"
		echo " "
		exit 1
	fi

	if ! echo "$input_url" | grep -qE '^https?://(www\.)?(github\.com|gitlab\.com)/'; then
		echo " "
		echo "ERROR: URL must be from github.com or gitlab.com"
		echo " "
		exit 1
	fi
}

if [ $# -eq 0 ]; then
	show_help
fi

case "$1" in
--help | -h)
	show_help
	;;
*)
	validation "$1"
	CATALOG_CLONE_URL="$1"
	download_catalog_to_public "$PUBLIC_CATALOG_DIR"
	validate_required_files "$PUBLIC_CATALOG_DIR"
	;;
esac
