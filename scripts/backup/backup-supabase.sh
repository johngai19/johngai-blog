#!/usr/bin/env bash
# ============================================================
# Supabase Data Backup Script
# Usage: ./backup-supabase.sh
# Backs up all table data via REST API (no DB password needed)
# Stores to: ./backups/supabase/YYYY-MM-DD/
# ============================================================
set -euo pipefail

SUPABASE_URL="https://lxunzzzdnokdqhipbmdf.supabase.co"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-$(grep SUPABASE_SERVICE_ROLE_KEY "$(dirname "$0")/../../.env.local" 2>/dev/null | cut -d= -f2-)}"

if [ -z "$SERVICE_ROLE_KEY" ]; then
  echo "ERROR: SUPABASE_SERVICE_ROLE_KEY not set"
  exit 1
fi

DATE=$(date +%Y-%m-%d)
BACKUP_DIR="$(dirname "$0")/../../backups/supabase/$DATE"
mkdir -p "$BACKUP_DIR"

echo "=== Supabase Backup: $DATE ==="
echo "Target: $BACKUP_DIR"
echo ""

# Tables to back up
TABLES=("articles" "email_subscribers" "profiles" "subscriptions")

for TABLE in "${TABLES[@]}"; do
  echo -n "Backing up $TABLE... "
  RESPONSE=$(curl -s \
    "$SUPABASE_URL/rest/v1/$TABLE?select=*" \
    -H "apikey: $SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H "Accept: application/json")

  COUNT=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d) if isinstance(d,list) else 'error')" 2>/dev/null)
  echo "$RESPONSE" > "$BACKUP_DIR/${TABLE}.json"
  echo "✓ $COUNT rows"
done

# Backup schema (table structure via SQL query)
echo -n "Backing up schema... "
SUPA_TOKEN="${SUPABASE_ACCESS_TOKEN:-}"
if [ -n "$SUPA_TOKEN" ]; then
  curl -s -X POST "https://api.supabase.com/v1/projects/lxunzzzdnokdqhipbmdf/database/query" \
    -H "Authorization: Bearer $SUPA_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"query": "SELECT table_name, column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = '\''public'\'' ORDER BY table_name, ordinal_position"}' \
    > "$BACKUP_DIR/schema.json" 2>/dev/null
  echo "✓"
fi

# Backup Vercel env var keys (NOT values - just document what exists)
echo -n "Documenting Vercel env vars... "
VERCEL_TOKEN="${VERCEL_TOKEN:-$(grep VERCEL_TOKEN "$(dirname "$0")/../../../../Documents/repos/nanoclaw/data/env/env" 2>/dev/null | cut -d= -f2-)}"
if [ -n "$VERCEL_TOKEN" ]; then
  curl -s "https://api.vercel.com/v10/projects/prj_OL8H3aX3dxnVaqqY024RkiW2S8wq/env" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    | python3 -c "
import sys,json
d=json.load(sys.stdin)
envs=d.get('envs',[])
# Save only key names + targets, NOT values
safe=[{'key':e['key'],'target':e.get('target'),'type':e.get('type')} for e in envs]
print(json.dumps(safe,indent=2))
" > "$BACKUP_DIR/vercel-env-keys.json" 2>/dev/null
  echo "✓"
fi

# Create summary
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
cat > "$BACKUP_DIR/SUMMARY.md" << EOF
# Backup Summary: $DATE

Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
Total size: $TOTAL_SIZE

## Files
EOF

for FILE in "$BACKUP_DIR"/*.json; do
  FILENAME=$(basename "$FILE")
  SIZE=$(wc -c < "$FILE")
  echo "- $FILENAME ($SIZE bytes)" >> "$BACKUP_DIR/SUMMARY.md"
done

echo ""
echo "=== Backup complete ==="
echo "Location: $BACKUP_DIR"
echo "Size: $TOTAL_SIZE"
echo ""
echo "To restore articles to Supabase:"
echo "  cat $BACKUP_DIR/articles.json | python3 scripts/backup/restore-table.py articles"
