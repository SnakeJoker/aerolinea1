const express = require("express");
const mysql = require("mysql");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

// Configuración de la base de datos
const dbConfig = {
	host: "db4free.net",
	user: "root06",
	password: "12345678",
	database: "bank_4",
	port: 3306,
};

// Crear un pool de conexiones en lugar de una conexión única
const pool = mysql.createPool(dbConfig);

// Middleware para manejar la conexión a la base de datos
app.use((req, res, next) => {
	req.mysql = pool;
	next();
});

// Configuración de CORS
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept"
	);
	res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
	next();
});

// Middleware para servir archivos estáticos
app.use("/public", express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

const createFlightsTable = `
    CREATE TABLE IF NOT EXISTS vuelos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        numero_vuelo VARCHAR(50),
        origen VARCHAR(100),
        destino VARCHAR(100),
        hora_salida DATETIME,
        hora_llegada DATETIME,
        escalas TEXT
    )
`;

// Cambia pool.query por pool.getConnection
pool.getConnection((err, connection) => {
	if (err) {
		console.error("Error al obtener conexión de la base de datos:", err);
	} else {
		connection.query(createFlightsTable, (err, results) => {
			connection.release(); // Siempre liberar la conexión después de su uso

			if (err) {
				console.error("Error al crear la tabla de vuelos:", err);
			} else {
				console.log("Tabla de vuelos creada exitosamente o ya existe.");
			}
		});
	}
});

// Crear la tabla de usuarios si no existe
const createUsersTable = `
    CREATE TABLE IF NOT EXISTS user_fligth (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE,
        password VARCHAR(255)
    )
`;

pool.query(createUsersTable, (err, results) => {
	if (err) {
		console.error("Error al crear la tabla de usuarios:", err);
	} else {
		console.log("Tabla de usuarios creada exitosamente o ya existe.");
	}
});

// Rutas
app.get("/buscarVuelo", (req, res) => {
    const numeroVuelo = req.query.numero_vuelo;

    const sql = "SELECT * FROM vuelos WHERE numero_vuelo = ?";
    
    // Realizar la consulta a la base de datos
    pool.query(sql, [numeroVuelo], (err, results) => {
        if (err) {
            console.error("Error al buscar vuelo en la base de datos:", err);
            res.status(500).send("Error al buscar vuelo en la base de datos.");
        } else {
            if (results.length > 0) {
                // Encontró vuelos con el número especificado
                res.json(results[0]);
            } else {
                // No se encontraron vuelos con el número especificado
                res.status(404).send("Vuelo no encontrado en la base de datos.");
            }
        }
    });
});

app.post("/login", (req, res) => {
	const { username, password } = req.body;

	const query = "SELECT * FROM user_fligth WHERE username = ? AND password = ?";
	const values = [username, password];

	req.mysql.query(query, values, (err, results) => {
		if (err) {
			console.error("Error al iniciar sesión:", err);
			res.status(500).send("Error al iniciar sesión.");
		} else {
			if (results.length > 0) {
				// Usuario autenticado con éxito
				res.send("Inicio de sesión exitoso.");
			} else {
				res.status(401).send("Nombre de usuario o contraseña incorrectos.");
			}
		}
	});
});

app.post("/register", (req, res) => {
	console.log("Recibida solicitud de registro:", req.body);

	const { username, password } = req.body;

	const insertUserQuery =
		"INSERT INTO user_fligth (username, password) VALUES (?, ?)";
	const values = [username, password];

	req.mysql.query(insertUserQuery, values, (err, results) => {
		if (err) {
			console.error("Error al registrar usuario:", err);
			res.status(500).send("Error al registrar usuario.");
		} else {
			console.log("Usuario registrado exitosamente.");
			res.send("Registro exitoso. Ahora puedes iniciar sesión.");
		}
	});
});

app.post("/add_flight", (req, res) => {
	const {
		flightNumber,
		origin,
		destination,
		departureTime,
		arrivalTime,
		layovers,
	} = req.body;

	const addFlightQuery =
		"INSERT INTO vuelos (numero_vuelo, origen, destino, hora_salida, hora_llegada, escalas) VALUES (?, ?, ?, ?, ?, ?)";

	const values = [
		flightNumber,
		origin,
		destination,
		departureTime,
		arrivalTime,
		layovers,
	];

	req.mysql.query(addFlightQuery, values, (err, results) => {
		if (err) {
			console.error("Error al añadir vuelo en la base de datos:", err);
			res.status(500).send("Error al añadir vuelo en la base de datos.");
		} else {
			console.log("Vuelo añadido exitosamente.");
			res.send("Vuelo añadido exitosamente.");
		}
	});
});

app.get("/search-flight", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "search_result.html"));
});

app.post("/search-flight", (req, res) => {
	const { flightNumber } = req.body;

	const query = "SELECT * FROM vuelos WHERE numero_vuelo = ?";
	const values = [flightNumber];

	req.mysql.query(query, values, (err, results) => {
		if (err) {
			console.error("Error al buscar vuelo en la base de datos:", err);
			res.status(500).send("Error al buscar vuelo en la base de datos.");
		} else {
			if (results.length > 0) {
				// Encontró vuelos con el número especificado
				res.json(results);
			} else {
				// No se encontraron vuelos con el número especificado
				res.status(404).send("Vuelo no encontrado en la base de datos.");
			}
		}
	});
});

app.get("/get-flights", (req, res) => {
	const query = "SELECT * FROM vuelos";

	req.mysql.query(query, (err, results) => {
		if (err) {
			console.error("Error al obtener información de vuelos:", err);
			res.status(500).send("Error al obtener información de vuelos.");
		} else {
			res.json(results);
		}
	});
});

// Iniciar el servidor
app.listen(port, () => {
	console.log(`Servidor escuchando en http://localhost:${port}`);
});
