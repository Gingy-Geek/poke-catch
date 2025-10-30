import { MongoClient, ServerApiVersion} from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
const DB_NAME = process.env.DB_NAME || "pokeapp";
const COLLECTION = process.env.COLLECTION || "users";

let db;

export async function getCollection() {
  if (!db) {
    await client.connect();
    db = client.db(DB_NAME);
  }
  return db.collection(COLLECTION);
}


// 🔹 Leer todos los usuarios
export async function readAllUsers() {
  try {
    const collection = await getCollection();
    const users = await collection.find().toArray();
    return users;
  } catch (err) {
    console.error("❌ Error al leer usuarios:", err);
    throw err;
  }
}

// 🔹 Leer un usuario por uid
export async function readUser(uid) {
  try {
    const collection = await getCollection();
    const user = await collection.findOne({ uid });
    return user; // null si no existe
  } catch (err) {
    console.error("❌ Error al leer usuario:", err);
    throw err;
  }
}

// 🔹 Actualizar o crear un usuario (upsert)
export async function updateUser(user) {
  try {
    if (!user?.uid) throw new Error("El usuario debe tener un uid");

    const collection = await getCollection();

    const filter = { uid: user.uid };
    const update = { $set: user };

    const result = await collection.updateOne(filter, update, { upsert: true });

    if (result.upsertedCount > 0) {
      console.log("✅ Usuario insertado:", result.upsertedId);
    } else if (result.modifiedCount > 0) {
      console.log("✅ Usuario actualizado:", user.uid);
    } else {
      console.log("ℹ️ Usuario sin cambios:", user.uid);
    }

    return result;
  } catch (err) {
    console.error("❌ Error al actualizar usuario:", err);
    throw err;
  }
} 