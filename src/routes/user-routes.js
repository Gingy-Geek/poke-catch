// src/routes/user.routes.js
import { Router } from "express";
import { registerNewUser, searchPok, catchPokemon, getAllUsers, changeAvatar, getPodium, getUser, resetRolls, ping,} from "../controllers/user-controller.js";

import fs from "fs";
import path from "path";

const router = Router();
const dbPath = path.resolve("src/db/db.json");

router.get("/all", getAllUsers); 
router.get("/podium", getPodium);
router.get("/ping", ping); 
router.post("/:id/resetRolls", resetRolls)

// POST /api/users
router.post("/", registerNewUser);

router.get("/:id", getUser)

router.post("/searchPok", searchPok);
router.post("/catchPokemon", catchPokemon);
router.post("/changeAvatar", changeAvatar);




export default router;
