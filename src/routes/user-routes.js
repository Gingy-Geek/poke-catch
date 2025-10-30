// src/routes/user.routes.js
import { Router } from "express";
import { registerNewUser, searchPok, catchPokemon, getAllUsers, changeAvatar, getPodium, getUser, resetRolls, ping,} from "../controllers/user-controller.js";

const router = Router();

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
