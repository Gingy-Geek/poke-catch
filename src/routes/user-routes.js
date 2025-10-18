// src/routes/user.routes.js
import { Router } from "express";
import { searchPok, catchPokemon, getAllUsers, ping } from "../controllers/user-controller.js";

import fs from "fs";
import path from "path";

const router = Router();
const dbPath = path.resolve("src/db/db.json");

router.get("/all", getAllUsers); 
router.get("/ping", ping); 
// POST /api/users
router.post("/", (req, res) => {
  const { uid, displayName } = req.body;

  if (!uid) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  const data = JSON.parse(fs.readFileSync(dbPath, "utf8") || '{"users": []}');
 console.log(uid);
 
  let user = data.users.find((u) => u.uid === uid);

  // Si no existe, lo creamos
  if (!user) {
    user = {
      uid,
      displayName: displayName,
      pokedex: {},
      masterBalls: 2,
      dailyCatches: 5,

    };

    data.users.push(user);
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  }

  res.json(user);
});

router.get("/:id", (req, res) => {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ error: "Falta el id del usuario" });
  }
  
  const data = JSON.parse(fs.readFileSync(dbPath, "utf8") || '{"users": []}');
  
  let user = data.users.find((u) => u.uid == id);
  console.log(user);

  res.json(user || null);
});

router.post("/searchPok", searchPok);
router.post("/catchPokemon", catchPokemon);




export default router;
