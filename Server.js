import express from "express";
import handlebars from "express-handlebars";
import fetch from "node-fetch";
import mongoose from "mongoose";
import { Server as HttpServer } from "http";
import { Server as IOServer } from "socket.io";
import prodRoutes from "./routes/ProductRoutes.js";
import mensRoutes from "./routes/MensajesRoutes.js";
import frontRoutes from "./routes/FrontRoutes.js";

(async () => {
  try {
    await mongoose.connect("mongodb://localhost/ecommerce", {
      useNewUrlParser: true,
    	useUnifiedTopology: true,
    	useCreateIndex: true,
			useFindAndModify: false
    });
    console.log("Base de datos conectada");
		// Una vez conectado me conecto al socket porque este levanta al iniciar datos de la base
		connectSocket();
  } catch (err) {
    console.log(err.message);
  }
})();

const PORT = 8080;
const app = express();

const httpServer = new HttpServer(app);
const io = new IOServer(httpServer);

app.use(express.static("public"));


// Funcion que carga los productos y emite el llamado a "listProducts"
async function getProducts() {
	try {
		const response = await fetch("http://localhost:8080/api/productos");
		io.sockets.emit("listProducts", await response.json());
	} catch (err) {
		console.log(err);
	}
};

// Funcion que devuelve el listado de mensajes
async function getMensajes() {
	try {
		const response = await fetch("http://localhost:8080/api/mensajes");
		io.sockets.emit("listMensajes", await response.json());
	} catch (err) {
		console.log(err);
	}
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/", frontRoutes);
app.use("/api/productos", prodRoutes);
app.use("/api/mensajes", mensRoutes);

app.engine("hbs", handlebars({
    extname: "hbs",
    defaultLayout: "layout.hbs"
  })
);

app.set("views", "./views");
app.set("view engine", "hbs");


function connectSocket() {
	io.on("connection", (socket) => {
		console.log("Nuevo cliente conectado!");
		getProducts();
		getMensajes();

		/* Escucho los mensajes enviado por el cliente y se los propago a todos */
		socket.on("postProduct", () => {
			getProducts();
		}).on("updateProduct", () => {
			getProducts();
		}).on("deleteProduct", () => {
			getProducts();
		}).on("postMensaje", data => {
			getMensajes();
		}).on('disconnect', () => {
			console.log('Usuario desconectado')
		});
	});
}

// Conexion a server con callback avisando de conexion exitosa
httpServer.listen(PORT, () => { console.log(`Ya me conecte al puerto ${PORT}.`); })
.on("error", (error) => console.log("Hubo un error inicializando el servidor.") );