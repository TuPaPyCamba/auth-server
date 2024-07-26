import express from 'express'
import bodyParser from 'body-parser'
import session from 'express-session'
import mongoose from 'mongoose'

import 'colors'
import { PORT, MONGODB_URI, SECRET } from './config'
import User from './models/user'

const server = express()


// Conexion a la BD MongoDB Atlas
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log(``))
    .catch(err => console.log(``, err))

server.use(bodyParser.json())
server.use(bodyParser.urlencoded({ extended: true}))

// Configuración de sesión
server.use(session({
    secret: SECRET,
    resave: false,
    saveUninitialized: true,
}));

// Ruta para registrar un nuevo usuario
server.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = new User({ username, password });
        await user.save();
        res.status(201).send({ message: 'Usuario creado', userId: user._id }); // Devuelve el _id del usuario
    } catch (error) {
        res.status(400).send({ error: 'Error al crear el usuario', details: error.message });
    }
})

// Inicializacion del Servidor 
server.listen(PORT, () => {

    console.log(`SERVER: `.green + `operating correctly on the following port \n \n service rute:  ` + `http://localhost:${PORT} \n`.blue)
})