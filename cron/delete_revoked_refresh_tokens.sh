#!/bin/sh

# a simple script that runs an sql command in the running postgres container to delete any row in refresh_tokens where revoked_at is not null
# and store the result in /tmp/delete_revoked_refresh_tokens.log
# invocation frequency defined in /etc/crontab

cd /home/user/reporacoon
echo "[$(date)] $(docker compose exec postgres psql -U root -d reporacoondb -c 'DELETE from refresh_tokens WHERE revoked_at IS NOT NULL;')" > /tmp/delete_revoked_refresh_tokens.log
