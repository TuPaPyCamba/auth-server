import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import "colors";
import { PORT, MONGODB_URI, SECRET, SENDGRID_API_KEY } from "./config.js";
import User from "./models/user.js";
import MongoStore from "connect-mongo";
import sgMail from '@sendgrid/mail'
import crypto from 'crypto'

const server = express();

// Conexión a la BD MongoDB Atlas
mongoose
    .connect(MONGODB_URI)
    .then(() =>
        console.log(
            "SERVER:".green +
            ` Successful connection to ` +
            `MONGOOSE`.yellow +
            ` database \n`
        )
    )
    .catch((err) => console.error("Error de conexión:", err));

server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));

// Configuración de sesión
server.use(
    session({
        secret: SECRET,
        resave: false,
        saveUninitialized: true,
        store: MongoStore.create({
            mongoUrl: MONGODB_URI,
            collectionName: 'sessions',
        }),
        cookie: {
            maxAge: 180 * 60 * 1000
        }
    })
);

// Configuracion de SendGrid
sgMail.setApiKey(SENDGRID_API_KEY)

// Ruta para registrar un nuevo usuario
server.post("/register", async (req, res) => {
    const { username, password, email } = req.body;

    try {
        Validation.username(username);
        Validation.password(password);
        Validation.email(email)

        const emailExistence = await User.findOne({ email })
        if (emailExistence) {
            const errorMessage = "email address in use";
            console.log(
                `SERVER:`.green +
                ` Error when trying to create a new User, with the following data \n Username: ${username} \n Email: ${email} \n Password: ***** \n ` +
                `ESTATUS: (400) `.red +
                `${errorMessage} \n`
            );
            return res.status(400).send({ error: "email address in use" });
        }

        const userExistence = await User.findOne({ username });
        if (userExistence) {
            const errorMessage = "username already exists";
            console.log(
                `SERVER:`.green +
                ` Error when trying to create a new User, with the following data \n Username: ${username} \n Email: ${email} \n Password: ***** \n ` +
                `ESTATUS: (400) `.red +
                `${errorMessage} \n`
            );
            return res.status(400).send({ error: "username already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex')

        const mailOptions = {
            to: email,
            from: 'fercambafcm@gmail.com',
            subject: 'Por favor verifica tu email haciendo clic en el siguiente enlace:',
            text: `Por favor verifica tu email haciendo clic en el siguiente enlace:\n\n http://localhost:${PORT}/verify-email/${verificationToken}\n\n`,
            html: `<p>Por favor verifica tu email haciendo clic en el siguiente enlace:</p><a href="http://localhost:${PORT}/verify-email/${verificationToken}">Verificar Email</a>`
        }

        await sgMail.send(mailOptions)

        const user = new User({ username, password: hashedPassword, email, verificationToken });
        await user.save();
        res.status(201).send({ message: "Usuario creado", userId: user._id });
        console.log(
            `SERVER:`.green +
            ` New user created \n ID: ${user._id} \n Username: ${username} \n Email: ${email} \n HashedPassword: ${hashedPassword} \n`
        );

    } catch (error) {
        res
            .status(400)
            .send({ error: "Error al crear el usuario", details: error.message });
        console.log(
            `SERVER:`.green +
            ` Error when trying to create a new User, with the following data \n Username: ${username} \n Email: ${email} \n Password: ***** \n ` +
            `ESTATUS: (400) `.red +
            `${error} \n`
        );
    }
});

// Ruta para iniciar sesión
server.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        Validation.username(username);
        Validation.password(password);

        const user = await User.findOne({ username });
        if (!user) {
            const errorMessage = "username does not exist";
            console.log(
                `SERVER:`.green +
                ` Error when trying to login into an acount, with the following data \n Username: ${username} \n Password: ***** \n ` +
                `ESTATUS: (401)`.red +
                ` ${errorMessage} \n`
            );
            return res.status(400).send({ error: errorMessage });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            const errorMessage = "password is invalid";
            console.log(
                `SERVER:`.green +
                ` Error when trying to login into an acount, with the following data \n Username: ${username} \n Password: ***** \n ` +
                `ESTATUS: (401)`.red +
                ` ${errorMessage} \n`
            );
            return res.status(400).send({ error: errorMessage });
        }

        res.send({ message: "Inicio de sesión exitoso", userId: user._id });
        console.log(
            `SERVER:`.green +
            ` A new session has been started, the session started is \n Username: ${username} \n`
        );
    } catch (error) {
        res
            .status(500)
            .send({ error: "Error en el servidor", details: error.message });
        console.log(
            `SERVER:`.green +
            ` Error when trying to login into an account, with the following data \n Username: ${username} \n Password: ***** \n ` +
            `ESTATUS: (401)`.red +
            ` ${error.message} \n`
        );
    }
});

// Ruta para cerrar sesion  
server.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.log(
                `SERVER:`.green +
                ` Error when trying to log out, with the following data \n Username: ${username} \n Password: ***** \n ` +
                `ESTATUS: (500)`.red +
                ` Error trying to log out\n`
            );
            return res.status(500).send({ error: 'Error trying to log out', details: err.message })
        }
        res.send({ message: 'Sesion cerrada con exito' })
        console.log(`SERVER:`.green +
            `session closed. \n `)
    })
})

// Ruta de validacion de correos
server.get('/verify-email/:token', async (req, res) => {
    const { token } = req.params;

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
        return res.status(400).send({ message: 'Invalid token' });
    }

    if (user.isVerified) {
        return res.status(400).send({ message: 'Email already verified' });
    }

    user.isVerified = true;
    await user.save();

    res.send({ message: 'Email verified successfully!' });
});

// Inicialización del Servidor
server.listen(PORT, () => {
    console.log(
        `SERVER: `.green +
        `Authentication services running correctly on the following port \n \n service route:  ` +
        `http://localhost:${PORT} \n`.blue
    );
});

// Validación de campos
class Validation {
    static username(username) {
        if (typeof username !== "string")
            throw new Error("username must be a string");
        if (username.length < 5)
            throw new Error("username must be at least 5 characters long");
    }

    static password(password) {
        if (typeof password !== "string")
            throw new Error("password must be a string");
        if (password.length < 8)
            throw new Error("password must be at least 8 characters long");
    }

    static email(email) {
        if (typeof email !== "string")
            throw new Error("email must be a string");
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email))
            throw new Error("email is not valid")
    }
}