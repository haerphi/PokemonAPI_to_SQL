import knex from "knex";
import Axios from "axios";

const conn = knex({
  client: "pg",
  version: "7.2",
  connection:
    process.env.DATABASE_URL || `postgres://dev:dev@postgres:5432/pokemons`
});

function tabjsonNameToTab(json) {
  let tempTAb = [];
  for (let i = 0; i < json.length; i++) {
    tempTAb.push(json[i].name);
  }
  return tempTAb;
}

async function createTable() {
  //création de la table pokemons
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

  //Création de la table type
  let tableTypes = await conn.schema.hasTable("types");
  if (tableTypes) {
    await conn.schema.dropTable("types");
  }
  await conn.schema.createTable("types", table => {
    table.increments("id");
    table.string("name");
    table.specificType("double_damage_from", "VARCHAR[]");
    table.specificType("double_damage_to", "VARCHAR[]");
    table.specificType("half_damage_from", "VARCHAR[]");
    table.specificType("half_damage_to", "VARCHAR[]");
    table.specificType("no_damage_from", "VARCHAR[]");
    table.specificType("no_damage_to", "VARCHAR[]");
  });

  //Création de la table pokemon_x_type
  let tablePokemon_x_Types = await conn.schema.hasTable("pokemon_x_type");
  if (tablePokemon_x_Types) {
    await conn.schema.dropTable("pokemon_x_type");
  }
  await conn.schema.createTable("pokemon_x_type", table => {
    table.integer("idPokemon");
    table.integer("idType");
  });

  //Création de la table region

  let tableRegions = await conn.schema.hasTable("regions");
  if (tableRegions) {
    await conn.schema.dropTable("regions");
  }
  await conn.schema.createTable("regions", table => {
    table.increments("id");
    table.string("name");
  });

  console.log("created");
}

async function insertRegions() {
  await conn("regions").insert({ name: "kanto" });
  await conn("regions").insert({ name: "johto" });
}

async function insertTypes() {
  let rep = await Axios.get(`https://pokeapi.co/api/v2/type/`);
  let typeList = rep.data.results;

  for (let i = 0; i < typeList.length; i++) {
    let repUnique = await Axios.get(typeList[i].url);

    let obj = {
      name: repUnique.data.name,
      double_damage_from: tabjsonNameToTab(
        repUnique.data.damage_relations.double_damage_from
      ),
      double_damage_to: tabjsonNameToTab(
        repUnique.data.damage_relations.double_damage_to
      ),
      half_damage_from: tabjsonNameToTab(
        repUnique.data.damage_relations.half_damage_from
      ),
      half_damage_to: tabjsonNameToTab(
        repUnique.data.damage_relations.half_damage_to
      ),
      no_damage_from: tabjsonNameToTab(
        repUnique.data.damage_relations.no_damage_from
      ),
      no_damage_to: tabjsonNameToTab(
        repUnique.data.damage_relations.no_damage_to
      )
    };
    await conn("types").insert(obj);
  }
}

async function linkPokemonType(pokemon) {
  console.log(pokemon.name);
  for (let i = 0; i < pokemon.types.length; i++) {
    //select l'id du type
    let rep = await conn("types").where({ name: pokemon.types[i].type.name });
    console.log({ idPokemon: pokemon.id, idType: rep[0].id });
    await conn("pokemon_x_type").insert({
      idPokemon: pokemon.id,
      idType: rep[0].id
    });
  }
}

async function insertPokemon() {
  const limit = 9; //251
  let rep = await Axios.get(
    `https://pokeapi.co/api/v2/pokemon/?offset=0&limit=${limit}`
  );

  let pokemonList = rep.data.results;
  for (let i = 0; i < pokemonList.length; i++) {
    let region = "";
    if (i < 151) {
      region = "kanto";
    } else {
      region = "johto";
    }

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
      sprites: repUnique.data.sprites,
      region: (await conn("regions").where({ name: region }))[0].id
    };
    await conn("pokemons").insert(obj);
    linkPokemonType(repUnique.data);
  }
}

async function main() {
  await createTable();

  await insertRegions();

  await insertTypes();

  await insertPokemon();
}

main();
