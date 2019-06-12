# Failed inferMigrationSteps
## RPC Input
```json
{"id":1,"jsonrpc":"2.0","method":"inferMigrationSteps","params":{"projectInfo":"","dataModel":"datasource database {\n  provider = \"sqlite\"\n  url = \"file:migration_engine.db\"\n}\n\ngenerator photon {\n  provider = \"typescript\"\n  output = \"node_modules/@generated/photon\"\n}\n\nmodel User {\n  id Int @id\n  email String? @unique # Meetup doesn't provide email. We need to provide user another way to do this\n  meetup_id String @unique # Using this to find uniques since email is not available\n  groups Entity[]\n  access_token String?\n  refresh_token String?\n}\n\nenum Provider {\n  MEETUP\n}\n\nmodel Entity {\n  id Int @id\n  meetup_id String\n}","migrationId":"20190612192749-init","assumeToBeApplied":[]}}
```

## Stack Trace
```bash
[migration-engine/connectors/sql-migration-connector/src/sql_migration_persistence.rs:33] m.make::<barrel::backend::Sqlite>() = "CREATE TABLE IF NOT EXISTS \"migration_engine\".\"_Migration\" (\"revision\" INTEGER NOT NULL PRIMARY KEY, \"name\" TEXT NOT NULL, \"datamodel\" TEXT NOT NULL, \"status\" TEXT NOT NULL, \"applied\" INTEGER NOT NULL, \"rolled_back\" INTEGER NOT NULL, \"datamodel_steps\" TEXT NOT NULL, \"database_migration\" TEXT NOT NULL, \"errors\" TEXT NOT NULL, \"started_at\" DATE NOT NULL, \"finished_at\" DATE);"
[/var/root/.cargo/git/checkouts/prisma-query-a8c45647247f5d6d/8ea8214/src/connector/sqlite.rs:70] visitor::Sqlite::build(q) = (
    "SELECT `_Migration`.* FROM `_Migration` WHERE `status` = ? ORDER BY `revision` DESC",
    [
        Text(
            "Success"
        )
    ]
)
[libs/datamodel/src/ast/parser/mod.rs:384] positives = [
    datamodel
]

```
