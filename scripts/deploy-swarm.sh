#!/usr/bin/env bash
# Build the example app and upload it to Swarm as a website collection.
#
# Usage:
#   BEE_API=https://your-bee-node POSTAGE_BATCH=<batchID> ./scripts/deploy-swarm.sh
#
# Prints the resulting bzz reference (the content hash) on success.
set -euo pipefail

BEE_API="${BEE_API:-http://localhost:1633}"
POSTAGE_BATCH="${POSTAGE_BATCH:?Set POSTAGE_BATCH to a usable postage stamp batch ID}"

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

echo "› building static example…"
npm run build:example >/dev/null

echo "› packing example-dist…"
tar -C example-dist -cf /tmp/swarm-connect-site.tar .

echo "› uploading to $BEE_API…"
resp="$(curl -sf -m 300 -X POST "$BEE_API/bzz?name=swarm-connect-demo" \
  -H "Content-Type: application/x-tar" \
  -H "Swarm-Collection: true" \
  -H "Swarm-Index-Document: index.html" \
  -H "Swarm-Error-Document: index.html" \
  -H "Swarm-Postage-Batch-Id: $POSTAGE_BATCH" \
  --data-binary @/tmp/swarm-connect-site.tar)"

hash="$(printf '%s' "$resp" | grep -oE '[0-9a-f]{64}' | head -1)"
[ -n "$hash" ] || { echo "upload failed: $resp" >&2; exit 1; }

echo
echo "deployed: bzz://$hash"
echo "  gateway: https://$hash.bzz.link/"
echo "  node:    $BEE_API/bzz/$hash/"
