import knex from "knex";
import Axios from "axios";

const conn = knex({
  client: "pg",
  version: "7.2",
  connection:
    process.env.DATABASE_URL || `postgres://dev:dev@postgres:5432/pokemons`
});

async function createTable() {
  let tablePokemon = await conn.schema.hasTable("pokemons");
  if (tablePokemon) {
    await conn.schema.dropTable("pokemons");
  }
  await conn.schema.createTable("pokemons", table => {
    table.increments("id");
    table.string("name");
    table.integer("height");
    table.integer("weight");
    table.integer("base_experience");
    table.json("sprites");
    table.integer("region");
  });
  console.log("created");
}

async function main() {
  await createTable();

  const limit = 20; //251
  let rep = await Axios.get(
    `https://pokeapi.co/api/v2/pokemon/?offset=0&limit=${limit}`
  );

  let pokemonList = rep.data.results;
  for (let i = 0; i < pokemonList.length; i++) {
    console.log(`fetching: ${pokemonList[i].name}`);
    let repUnique = await Axios.get(pokemonList[i].url);
    // libération de mémoire :x
    delete repUnique.data.game_indices;
    delete repUnique.data.moves;
    delete repUnique.data.abilities;
    let obj = {
      name: repUnique.data.name,
      height: repUnique.data.height,
      weight: repUnique.data.weight,
      base_experience: repUnique.data.base_experience,
      region: null,
      sprites: repUnique.data.sprites
    };
    await conn("pokemons").insert(obj);
  }
}

main();
