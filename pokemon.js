const MAX_POKEMON = 151;
const listWrapper = document.querySelector(".list-wrapper");
const searchInput = document.querySelector("#search-input");
const numberFilter = document.querySelector("#number");
const nameFilter = document.querySelector("#name");
const featureFilter = document.querySelector("#feature");
const genderFilter = document.querySelector("#gender");
const notFoundMessage = document.querySelector("#not-found-message");

let allPokemons = [];
let genderData = {};

async function fetchAllPokemon() {
  const response = await fetch(
    `https://pokeapi.co/api/v2/pokemon?limit=${MAX_POKEMON}`
  );
  const data = await response.json();

  const detailedPokemonPromises = data.results.map(async (pokemon) => {
    const pokemonDetails = await fetch(pokemon.url).then((res) => res.json());
    const pokemonSpecies = await fetch(pokemonDetails.species.url).then((res) =>
      res.json()
    );
    return {
      ...pokemon,
      details: pokemonDetails,
      species: pokemonSpecies,
    };
  });

  allPokemons = await Promise.all(detailedPokemonPromises);
  await fetchGenderData();
  console.log(allPokemons);
  displayPokemons(allPokemons);
}

async function fetchGenderData() {
  const genders = await Promise.all([
    fetch("https://pokeapi.co/api/v2/gender/1/").then((res) => res.json()), // Female
    fetch("https://pokeapi.co/api/v2/gender/2/").then((res) => res.json()), // Male
    fetch("https://pokeapi.co/api/v2/gender/3/").then((res) => res.json()), // Genderless
  ]);

  genderData = {
    female: new Set(
      genders[0].pokemon_species_details.map(
        (detail) => detail.pokemon_species.name
      )
    ),
    male: new Set(
      genders[1].pokemon_species_details.map(
        (detail) => detail.pokemon_species.name
      )
    ),
    genderless: new Set(
      genders[2].pokemon_species_details.map(
        (detail) => detail.pokemon_species.name
      )
    ),
  };
}

fetchAllPokemon();

function displayPokemons(pokemonList) {
  listWrapper.innerHTML = "";
  pokemonList.forEach((pokemon) => {
    const pokemonID = pokemon.details.id;
    const listItem = document.createElement("div");
    listItem.className = "list-item";
    listItem.innerHTML = `
      <div class="number-wrap">
        <p class="caption-fonts">#${pokemonID}</p>
      </div>
      <div class="img-wrap">
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/${pokemonID}.svg" alt="${pokemon.name}"/>
      </div>
      <div class="name-wrap">
        <p class="body3-fonts">${pokemon.name}</p>
      </div>
    `;

    listItem.addEventListener("click", async () => {
      const success = await fetchPokemonDataBeforeRedirect(pokemonID);
      if (success) {
        window.location.href = `./detail.html?id=${pokemonID}`;
      }
    });

    listWrapper.appendChild(listItem);
  });
}

async function fetchPokemonDataBeforeRedirect(id) {
  try {
    const [pokemon, pokemonSpecies] = await Promise.all([
      fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then((res) =>
        res.json()
      ),
      fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`).then((res) =>
        res.json()
      ),
    ]);
    // Perform any necessary operations with the fetched data
    return true;
  } catch (error) {
    console.error("Failed to fetch Pokemon data before redirect", error);
    return false;
  }
}

function handleSearch() {
  const searchTerm = searchInput.value.toLowerCase();
  let filteredPokemons;
  if (numberFilter.checked) {
    filteredPokemons = allPokemons.filter((pokemon) => {
      const pokemonID = pokemon.details.id.toString();
      return pokemonID.startsWith(searchTerm);
    });
  } else if (nameFilter.checked) {
    filteredPokemons = allPokemons.filter((pokemon) => {
      return pokemon.name.toLowerCase().startsWith(searchTerm);
    });
  } else if (featureFilter.checked) {
    filteredPokemons = allPokemons.filter((pokemon) => {
      return pokemon.details.types.some((typeInfo) => {
        return typeInfo.type.name.toLowerCase().startsWith(searchTerm);
      });
    });
  } else if (genderFilter.checked) {
    // alert("Category of Gender:  1)male  2) female 3)Genderless");
    filteredPokemons = allPokemons.filter((pokemon) => {
      const genderTerm = searchTerm.toLowerCase();
      const speciesName = pokemon.species.name;
      if (genderTerm === "male") {
        return genderData.male.has(speciesName);
      } else if (genderTerm === "female") {
        return genderData.female.has(speciesName);
      } else if (genderTerm === "genderless") {
        return genderData.genderless.has(speciesName);
      }
      return false;
    });
  } else {
    filteredPokemons = allPokemons;
  }
  displayPokemons(filteredPokemons);
  if (filteredPokemons.length === 0) {
    notFoundMessage.style.display = "block";
  } else {
    notFoundMessage.style.display = "none";
  }
}

searchInput.addEventListener("keyup", handleSearch);

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    handleSearch();
  }
});

const closeButton = document.querySelector(".search-close-icon");
closeButton.addEventListener("click", clearSearch);

function clearSearch() {
  searchInput.value = "";
  displayPokemons(allPokemons);
  notFoundMessage.style.display = "none";
}
genderFilter.addEventListener("change", () => {
  if (genderFilter.checked) {
    alert("Category of Gender:  1)male  2) female 3)Genderless");
  }
});
