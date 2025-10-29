import fetch from "node-fetch";

const BIN_ID = "69017195d0ea881f40c3bfff"; // tu ID real
const API_KEY = "$2a$10$dsvyJU9Q0j85NG.XG8IU9eZnd5AhJfW7AgblGSfbDs.4WjW5D7jGi";    // tu API Key de JSONBin

const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// Leer tu JSON remoto
export async function readUsers() {
  const res = await fetch(`${BASE_URL}/latest`, {
    headers: { "X-Master-Key": API_KEY },
  });

  if (!res.ok) throw new Error(`Error al leer JSONBin: ${res.status}`);

  const data = await res.json();
  return data.record.users;
}

// Guardar (actualizar) tu JSON remoto
export async function saveUsers(users) {
  const newData = {users};
    console.log("PUTT 1",{users})
    console.log("PUTT 2",newData)

  const res = await fetch(BASE_URL, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key": API_KEY,
    },
    body: JSON.stringify(newData, null, 2),
  });

  if (!res.ok) throw new Error(`Error al guardar JSONBin: ${res.status} ${res.error}`);

  const data = await res.json();
  return data;
}