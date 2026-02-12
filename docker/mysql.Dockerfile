FROM mariadb:10.11

# Copy initialization script with correct permissions
COPY --chmod=644 init-db.sql /docker-entrypoint-initdb.d/init.sql
