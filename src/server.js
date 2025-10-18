import app from './app.js'

const PORT = process.env.PORT || 3001
const HOST = process.env.HOST || 'localhost'

app.listen(PORT, () => {
  if (process.env.PORT) {
    console.log(`Servidor corriendo en puerto ${PORT}`)
  } else {
    console.log(`Servidor corriendo en http://${HOST}:${PORT}`)
  }
})
