import knex from "knex";

const conn = knex({
  client: "pg",
  version: "7.2",
  connection:
    process.env.DATABASE_URL || `postgres://dev:dev@postgres:5432/pokemons`
});

conn.schema
  .hasTable("pokemon")
  .then(rep => {
    console.log("y ? n? ", rep);
    conn.close();
  })
  .catch(err => {
    console.log("Data base pokemons doesn't exist");
  });
