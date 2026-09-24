#!/usr/bin/env bash
set -e

HOST="${DB_HOST:-localhost}"
PORT="${DB_PORT:-5433}"
USER="${DB_USER:-med222}"
export PGPASSWORD="${DB_PASS:-733434243}"
DB_NAME="${DB_NAME:-royaa_db}"

EXISTS=$(psql -h "$HOST" -p "$PORT" -U "$USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")

if [ "$EXISTS" != "1" ]; then
  psql -h "$HOST" -p "$PORT" -U "$USER" -d postgres -c "CREATE DATABASE $DB_NAME"
  echo "Created database $DB_NAME"
else
  echo "Database $DB_NAME already exists"
fi

psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DB_NAME" -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DB_NAME" -c 'CREATE EXTENSION IF NOT EXISTS pgcrypto;'
echo "Extensions ready"
