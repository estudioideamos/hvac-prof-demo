#!/bin/sh
# Private daily website snapshot. This does not back up mailboxes or replace host backups.
set -eu
umask 077
base=/home3/hvacprofcom
backups=$base/.hvac-operations/backups
test "$(id -un)" = hvacprofcom
test -d "$base/public_html"
mkdir -p "$backups"
test ! -L "$backups"
test "$(realpath "$backups")" = "$base/.hvac-operations/backups"
exec 9>"$backups/.lock"
flock -n 9 || exit 0
archive="$backups/site-$(date +%F).tar.gz"
temporary="$archive.tmp"
trap 'rm -f -- "$temporary"' EXIT HUP INT TERM
tar -czf "$temporary" -C "$base" public_html
gzip -t "$temporary"
tar -tzf "$temporary" >/dev/null
mv "$temporary" "$archive"
chmod 600 "$archive"
# Keep eight daily snapshots; only files created by this script are eligible.
find "$backups" -maxdepth 1 -type f -name 'site-????-??-??.tar.gz' -mtime +7 -delete
