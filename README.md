# Migrating the database schema
If we need to apply changes to the database schema, you can make a migration script in `./migrations` (script must be idempotent, for instance using `create if not exists`). The scripts should be named `{index}_{migration-name}.sql` where index is the index of the script (previous index +1) and name is a name of the migration in snake case. When you start the system, the migrator service will run each migration against the database, which is why they must be idempotent.

#### Reset the database
To reset the database, losing all data and the schema(s), run `docker compose down -v` while the system is running. This will delete the Docker volume used by the database, causing all data to be lost. To shut down the system normally, use `docker compose down`.

# Starting the system
Run `docker compose up` in the root directory of the project.
