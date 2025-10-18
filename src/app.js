import express from 'express'
import cors from 'cors'
import pokemonRoutes from './routes/pokemon-routes.js'
import userRoutes from './routes/user-routes.js' 

const app = express()

app.use(cors())
app.use(express.json())

// Rutas
app.use('/api/pokemon', pokemonRoutes)
app.use('/api/users', userRoutes) 

export default app
