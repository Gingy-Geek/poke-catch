import { Router } from 'express'
import { getRandomPokemon} from '../controllers/pokemon-controller.js'

const router = Router()

router.get('/random', getRandomPokemon)

export default router
