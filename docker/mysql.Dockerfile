FROM mysql:8.0

# Copy initialization script
COPY init-db.sql /docker-entrypoint-initdb.d/init.sql

# Ensure it is readable by the mysql user (uid 999)
RUN chmod 644 /docker-entrypoint-initdb.d/init.sql
