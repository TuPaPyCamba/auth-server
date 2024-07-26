import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import "colors";
import { PORT, MONGODB_URI, SECRET } from "./config.js";
import User from "./models/user.js";

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
    })
);

// Ruta para registrar un nuevo usuario
server.post("/register", async (req, res) => {
    const { username, password } = req.body;

    try {
        Validation.username(username);
        Validation.password(password);

        const userExistence = await User.findOne({ username });
        if (userExistence) {
            const errorMessage = "username already exists";
            console.log(
                `SERVER:`.green +
                ` Error when trying to create a new User, with the following data \n Username: ${username} \n Password: ***** \n ` +
                `ESTATUS: (400) `.red +
                `${errorMessage} \n`
            );
            return res.status(400).send({ error: "username already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({ username, password: hashedPassword });
        await user.save();
        res.status(201).send({ message: "Usuario creado", userId: user._id });
        console.log(
            `SERVER:`.green +
            ` New user created \n ID: ${user._id} \n Username: ${username} \n HashedPassword: ${hashedPassword} \n`
        );
    } catch (error) {
        res
            .status(400)
            .send({ error: "Error al crear el usuario", details: error.message });
        console.log(
            `SERVER:`.green +
            ` Error when trying to create a new User, with the following data \n Username: ${username} \n Password: ***** \n ` +
            `ESTATUS: (400) `.red +
            `${error.message} \n`
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
}

// Inicialización del Servidor
server.listen(PORT, () => {
    console.log(
        `SERVER: `.green +
        `Authentication services running correctly on the following port \n \n service route:  ` +
        `http://localhost:${PORT} \n`.blue
    );
});
