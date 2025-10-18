export const legendaries = [144, 145, 146, 150, 151];
export const rares = [
  3, 6, 9, 25, 26, 65, 68, 76, 94, 95, 103, 106, 107,
  112, 113, 115, 122, 123, 124, 125, 126, 127, 128,
  130, 131, 132, 133, 134, 135, 136, 137, 138, 139,
  140, 141, 142, 143, 147, 148, 149
];

const allPokemon = Array.from({ length: 151 }, (_, i) => i + 1);
export const commons = allPokemon.filter(
  id => !rares.includes(id) && !legendaries.includes(id)
);
