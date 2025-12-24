#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common-functions.sh"

usage() {
    cat <<EOF
Usage: $(basename "$0") <snapshot-date>

Downloads and extracts the uploads archive from a GitHub release to the Railway backend service.

Arguments:
    snapshot-date    The date of the snapshot in YYYY-MM-DD format (e.g., 2025-12-23)

Prerequisites:
    - Railway CLI installed and authenticated (railway login)
    - GitHub CLI installed and authenticated (gh auth login)
    - A temporary GitHub release 'temp-upload' containing the uploads archive

Example:
    $(basename "$0") 2025-12-23

This script will:
    1. SSH into the Railway backend service
    2. Download draco-uploads-<date>.tar.gz from the GitHub release
    3. Clear the existing /app/uploads directory
    4. Extract the archive to /app/uploads
EOF
    exit 1
}

if [ $# -ne 1 ]; then
    print_error "Missing required argument: snapshot-date"
    usage
fi

SNAPSHOT_DATE="$1"

if ! [[ "$SNAPSHOT_DATE" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
    print_error "Invalid date format. Expected YYYY-MM-DD, got: $SNAPSHOT_DATE"
    exit 1
fi

GITHUB_ORG="rwalker123"
GITHUB_REPO="draco"
ARCHIVE_NAME="draco-uploads-${SNAPSHOT_DATE}.tar.gz"
RELEASE_URL="https://github.com/${GITHUB_ORG}/${GITHUB_REPO}/releases/download/temp-upload/${ARCHIVE_NAME}"

print_header "Railway Uploads Migration"
print_status "Snapshot date: $SNAPSHOT_DATE"
print_status "Archive URL: $RELEASE_URL"

print_status "Connecting to Railway backend service..."

railway ssh --service draco-backend -- /bin/sh -c "
cat >/tmp/download.js <<'EOF_JS'
import fs from 'node:fs';
import https from 'node:https';
import { URL } from 'node:url';

const startUrl = '${RELEASE_URL}';
const dest = '/app/uploads/draco-uploads.tar.gz';

function download(from) {
  console.log('Starting download: ' + from);
  https.get(from, (res) => {
    if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
      const next = new URL(res.headers.location, from).toString();
      console.log('Redirecting to: ' + next);
      res.resume();
      download(next);
      return;
    }

    if (res.statusCode !== 200) {
      console.error('Download failed with status: ' + res.statusCode);
      res.resume();
      process.exit(1);
    }

    const out = fs.createWriteStream(dest);
    let downloaded = 0;
    let lastReport = 0;

    res.on('data', (chunk) => {
      downloaded += chunk.length;
      if (downloaded - lastReport >= 5 * 1024 * 1024) {
        const mb = (downloaded / (1024 * 1024)).toFixed(1);
        console.log('... downloaded ' + mb + ' MB');
        lastReport = downloaded;
      }
    });

    res.pipe(out);

    out.on('finish', () => {
      out.close(() => {
        const total = (downloaded / (1024 * 1024)).toFixed(2);
        console.log('Download complete. Saved ' + total + ' MB to ' + dest);
      });
    });
  }).on('error', (err) => {
    console.error('Request error:', err);
    process.exit(1);
  });
}

download(startUrl);
EOF_JS

echo 'Clearing existing uploads...'
rm -rf /app/uploads/* 2>/dev/null || true

echo 'Downloading archive...'
node /tmp/download.js && rm /tmp/download.js

echo 'Extracting archive...'
tar -xzf /app/uploads/draco-uploads.tar.gz -C /app/uploads && rm /app/uploads/draco-uploads.tar.gz

echo 'Verifying uploads directory...'
find /app/uploads -maxdepth 2 -type d -print

echo 'Done!'
"

print_success "Uploads migration complete!"
