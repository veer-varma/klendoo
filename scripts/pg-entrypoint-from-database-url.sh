#!/bin/sh
# Bootstraps POSTGRES_USER/POSTGRES_PASSWORD/POSTGRES_DB by parsing
# $DATABASE_URL, rather than needing a second, separately-secreted
# POSTGRES_PASSWORD that would have to be kept in sync with it by hand.
#
# Manus's Klendoo Environment Discovery (2026-08-19) already generated
# DATABASE_URL as "postgresql://<user>:<password>@db:5432/klendoo" and
# stored it as the one GitHub Actions secret — this reads that same value
# rather than asking for the credentials a second time in a different form.
# Only affects first-time initialization (the official postgres image only
# consults these vars when its data directory is empty); harmless to run
# on every container start after that.
set -eu

url="${DATABASE_URL:?DATABASE_URL is required}"
rest="${url#postgresql://}"
creds="${rest%%@*}"
hostpart="${rest#*@}"
dbpart="${hostpart#*/}"

export POSTGRES_USER="${creds%%:*}"
export POSTGRES_PASSWORD="${creds#*:}"
export POSTGRES_DB="${dbpart%%\?*}"

exec docker-entrypoint.sh postgres
