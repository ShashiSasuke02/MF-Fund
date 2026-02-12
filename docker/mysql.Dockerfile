FROM mysql:8.0

# Copy initialization script with correct permissions
COPY --chmod=644 init-db.sql /docker-entrypoint-initdb.d/init.sql
