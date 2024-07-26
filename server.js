import express from 'express'
import bodyParser from 'body-parser'
import session from 'express-session'
import mongoose from 'mongoose'

import 'colors'
import { PORT, MONGODB_URI, SECRET } from './config.js'
import User from './models/user.js'

const server = express()


// Conexion a la BD MongoDB Atlas
mongoose.connect(MONGODB_URI)
    .then(() => console.log('SERVER:'.green + `Successful connection to `+`MONGOOSE`.yellow +` database`))
    .catch(err => console.error('Error de conexión:', err));

server.use(bodyParser.json())
server.use(bodyParser.urlencoded({ extended: true }))

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
        Validation.username(username)
        Validation.password(password)

        const userExistence = await User.findOne({ username });
        if (userExistence) return res.status(400).send({ error: 'username already exists' })

        const user = new User({ username, password })
        await user.save();
        res.status(201).send({ message: 'Usuario creado', userId: user._id })
        console.log(`SERVER:`.green + ` New user created \n ID: ${id} \n Username: ${username} \n Password: ${hasedPassword} \n`)
    } catch (error) {
        res.status(400).send({ error: 'Error al crear el usuario', details: error.message });
        console.log(
            `SERVER:`.green + ` Error when trying to create a new User, with the following data \n Username: ${username} \n Password: ***** \n ` + `ESTATUS: (400) `.red + `${error.message} \n`
        )
    }
});

server.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {

        Validation.username(username)
        Validation.password(password)

        const user = await User.findOne({ username });
        if (!user) return res.status(400).send({ error: 'username does not exist' })

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).send({ error: 'password is invalid' })

        // Aquí puedes manejar la creación de una sesión si es necesario
        res.send({ message: 'Inicio de sesión exitoso', userId: user._id });
    } catch (error) {
        res.status(500).send({ error: 'Error en el servidor', details: error.message })
        console.log(
            `SERVER:`.green + ` Error when trying to login into an acount, with the following data \n Username: ${username} \n Password: ***** \n ` + `ESTATUS: (401)`.red + ` ${error.message} \n`
        );
    }
});

// Inicializacion del Servidor 
server.listen(PORT, () => {

    console.log(`SERVER: `.green + `Authentication services running correctly on the following port \n \n service rute:  ` + `http://localhost:${PORT} \n`.blue)
})

class Validation {
    static username(username) {
        if (typeof username !== 'string') throw new Error('username must be a string')
        if (username.length < 5) throw new Error('username must be at least 5 characters long')
    }

    static password(password) {
        if (typeof password !== 'string') throw new Error('password must be a string')
        if (password.length < 8) throw new Error('password must be at least 8 characters long')
    }
}