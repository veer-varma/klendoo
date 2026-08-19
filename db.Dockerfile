# Klendoo's own private Postgres — bootstraps its credentials from the
# already-provisioned DATABASE_URL secret instead of a second, separately
# managed password. See scripts/pg-entrypoint-from-database-url.sh.
FROM postgres:16-alpine
COPY scripts/pg-entrypoint-from-database-url.sh /usr/local/bin/pg-entrypoint-from-database-url.sh
RUN chmod +x /usr/local/bin/pg-entrypoint-from-database-url.sh
ENTRYPOINT ["/usr/local/bin/pg-entrypoint-from-database-url.sh"]
