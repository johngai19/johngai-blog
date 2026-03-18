#!/usr/bin/env python3
"""
Restore a Supabase table from a JSON backup.
Usage: cat backup.json | python3 restore-table.py <table_name>
       python3 restore-table.py articles < backups/supabase/2026-03-18/articles.json
"""
import sys
import json
import urllib.request
import urllib.parse
import os

TABLE = sys.argv[1] if len(sys.argv) > 1 else None
if not TABLE:
    print("Usage: python3 restore-table.py <table_name>")
    sys.exit(1)

SUPABASE_URL = "https://lxunzzzdnokdqhipbmdf.supabase.co"
SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
if not SERVICE_ROLE_KEY:
    # Try reading from .env.local
    try:
        with open(os.path.join(os.path.dirname(__file__), "../../.env.local")) as f:
            for line in f:
                if line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                    SERVICE_ROLE_KEY = line.strip().split("=", 1)[1]
                    break
    except FileNotFoundError:
        pass

if not SERVICE_ROLE_KEY:
    print("ERROR: SUPABASE_SERVICE_ROLE_KEY not found")
    sys.exit(1)

data = json.load(sys.stdin)
if not isinstance(data, list):
    print(f"ERROR: Expected JSON array, got {type(data)}")
    sys.exit(1)

print(f"Restoring {len(data)} rows to {TABLE}...")

# Upsert in batches of 100
BATCH_SIZE = 100
success = 0

for i in range(0, len(data), BATCH_SIZE):
    batch = data[i:i + BATCH_SIZE]
    body = json.dumps(batch).encode()

    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{TABLE}",
        data=body,
        headers={
            "apikey": SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates",  # upsert
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req) as resp:
            success += len(batch)
            print(f"  Batch {i//BATCH_SIZE + 1}: {len(batch)} rows ✓")
    except urllib.error.HTTPError as e:
        print(f"  Batch {i//BATCH_SIZE + 1} ERROR: {e.code} {e.read().decode()[:200]}")

print(f"\nDone: {success}/{len(data)} rows restored to {TABLE}")
