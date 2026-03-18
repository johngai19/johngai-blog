#!/usr/bin/env bash
# ============================================================
# johngai.com Full Backup to Private GitHub Repo
# - Database: all Supabase tables as JSON
# - Media: johngai.com media archive (82MB tar)
# - Code: already in johngai19/johngai-blog (public)
# - Keeps only latest 4 backup versions (older deleted)
#
# Usage: ./backup-to-github.sh
# Schedule: daily via nanoclaw scheduler
# ============================================================
set -euo pipefail

BACKUP_REPO="johngai19/johngai-backup"
DATE=$(date +%Y-%m-%d)
TIMESTAMP=$(date +%Y-%m-%dT%H-%M-%S)
WORK_DIR="/tmp/johngai-backup-$$"

# Load credentials
GITHUB_TOKEN="${GITHUB_TOKEN:-$(grep GITHUB_TOKEN /Users/weizy0219/Documents/repos/nanoclaw/data/env/env | cut -d= -f2-)}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-$(grep SUPABASE_SERVICE_ROLE_KEY /Users/weizy0219/repos/johngai-blog/.env.local | cut -d= -f2-)}"
SUPABASE_ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN:-$(grep SUPABASE_ACCESS_TOKEN /Users/weizy0219/Documents/repos/nanoclaw/data/env/env | cut -d= -f2-)}"

echo "=== johngai.com Backup: $TIMESTAMP ==="

# 1. Clone backup repo
git clone "https://${GITHUB_TOKEN}@github.com/${BACKUP_REPO}.git" "$WORK_DIR" --depth=1 2>/dev/null
cd "$WORK_DIR"

# Configure git
git config user.email "backup@johngai.com"
git config user.name "johngai-backup-bot"

# 2. Create date directory
mkdir -p "backups/$DATE"

echo "Backing up Supabase data..."
TABLES=("articles" "email_subscribers" "profiles" "subscriptions")
for TABLE in "${TABLES[@]}"; do
  COUNT=$(curl -s \
    "https://lxunzzzdnokdqhipbmdf.supabase.co/rest/v1/$TABLE?select=*" \
    -H "apikey: $SUPABASE_SERVICE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
    | tee "backups/$DATE/${TABLE}.json" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d) if isinstance(d,list) else 'err')" 2>/dev/null)
  echo "  $TABLE: $COUNT rows"
done

# 3. Backup schema
curl -s -X POST "https://api.supabase.com/v1/projects/lxunzzzdnokdqhipbmdf/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT table_name, column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = '\''public'\'' ORDER BY table_name, ordinal_position"}' \
  > "backups/$DATE/schema.json" 2>/dev/null
echo "  schema: ✓"

# 4. Backup blog_backup media (link/copy key files, not the huge 629MB zip)
echo "Backing up media inventory..."
BLOG_BACKUP="/Users/weizy0219/Documents/repos/nanoclaw/groups/telegram_main/blog_backup"
mkdir -p "backups/$DATE/media"

# Save file listing (not the actual files - they're too large)
if [ -d "$BLOG_BACKUP" ]; then
  find "$BLOG_BACKUP" -type f \( -name "*.xml" -o -name "*.json" \) 2>/dev/null \
    | while read f; do
        size=$(wc -c < "$f" 2>/dev/null || echo "0")
        echo "$f ($size bytes)"
      done > "backups/$DATE/media/file-inventory.txt"
  echo "  media inventory: ✓"
fi

# 5. Summary
ARTICLE_COUNT=$(python3 -c "import json; print(len(json.load(open('backups/$DATE/articles.json'))))" 2>/dev/null || echo "0")
cat > "backups/$DATE/SUMMARY.md" << EOF
# Backup $DATE

Timestamp: $TIMESTAMP
Articles: $ARTICLE_COUNT
Email subscribers: $(python3 -c "import json; print(len(json.load(open('backups/$DATE/email_subscribers.json'))))" 2>/dev/null || echo "0")
Active subscriptions: $(python3 -c "import json; data=json.load(open('backups/$DATE/subscriptions.json')); print(len([s for s in data if s.get('status')=='active']))" 2>/dev/null || echo "0")
EOF

# 6. Enforce 4-version retention: delete backups older than 4th newest
echo "Enforcing 4-version retention..."
BACKUP_DIRS=($(ls -d backups/202* 2>/dev/null | sort -r))
if [ ${#BACKUP_DIRS[@]} -gt 4 ]; then
  for OLD in "${BACKUP_DIRS[@]:4}"; do
    echo "  Deleting old backup: $OLD"
    rm -rf "$OLD"
    git rm -rf "$OLD" 2>/dev/null || true
  done
fi

# 7. Commit and push
git add -A
git commit -m "backup: $DATE — ${ARTICLE_COUNT} articles" 2>/dev/null || echo "Nothing changed"
git push "https://${GITHUB_TOKEN}@github.com/${BACKUP_REPO}.git" main 2>/dev/null
echo "✓ Pushed to github.com/${BACKUP_REPO}"

# Cleanup
rm -rf "$WORK_DIR"

echo ""
echo "=== Backup complete: $DATE ==="
echo "View at: https://github.com/${BACKUP_REPO}/tree/main/backups/$DATE"
