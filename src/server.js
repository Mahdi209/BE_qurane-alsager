// const express = require("express");
// const morgan = require("morgan");
// const helmet = require("helmet");
// const cors = require("cors");
// const swaggerUi = require("swagger-ui-express");
// const swaggerDocument = require("./config/swagger.json");
// const router = require("./routes/index.router");
// const connectDB = require("./config/database");
// const fs = require("fs");
// const https = require("https");
// const cookieParser = require('cookie-parser');
// require("dotenv").config();
//
// const app = express();
// const PORT = process.env.PORT || 3000;
//
// app.use(express.static('public'));
//
// app.use(helmet({
//     crossOriginOpenerPolicy: false,
//     originAgentCluster: false,
//     crossOriginEmbedderPolicy: false,
// }));
// app.use(cors({ origin: '*' }));
//
// app.use(express.json());
// app.use(morgan("dev"));
// app.use(cookieParser());
// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, { explorer: true }));
//
// connectDB().then(r => console.log("Database connected successfully"));
//
// app.get("/", (req, res) => {
//     res.json({ message: "Welcome to my Express server 🚀" });
// });
//
// app.use('/api', router);
//
// app.use((err, req, res, next) => {
//     console.error(err.stack);
//     res.status(500).json({ error: "Something went wrong!" });
// });
//
// // const privateKey = fs.readFileSync("./key.pem", "utf8");
// // const certificate = fs.readFileSync("./cert.pem", "utf8");
// // const credentials = { key: privateKey, cert: certificate };
// //
// // https.createServer(credentials, app).listen(PORT, () => {
// //     console.log(`🚀 Secure Server running on https://localhost:${PORT}`);
// //     console.log(`📖 API documentation available at https://localhost:${PORT}/api-docs`);
// //     console.log(`📖 API documentation available at https://192.168.15.146:${PORT}/api-docs`);
// // });
// //
// //
//
// app.listen(PORT, () => {
//     console.log(`🚀 Server running on http://localhost:${PORT}`);
//     console.log(`📖 API documentation available at http://localhost:${PORT}/api-docs`);
//
// })
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./config/swagger.json");
const router = require("./routes/index.router");
const connectDB = require("./config/database");
const cookieParser = require('cookie-parser');
const { initSocket } = require("./socket");
const http = require("http");

require("dotenv").config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 6001;

// All middleware and routes go on the EXPRESS APP (not server)
app.use(express.static('public'));
app.use(cors({
    origin: 'https://192.168.15.146:3000/',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, { explorer: true }));

connectDB().then(r => console.log("Database connected successfully"));

initSocket(server)

app.get("/", (req, res) => {
    res.json({ message: "Welcome to my Express server 🚀" });
});

app.use('/api', router);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
});

// Listen on the HTTP SERVER (not the Express app)
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`API documentation available at http://localhost:${PORT}/api-docs`);
    console.log(`API documentation available at http://198.244.227.48:${PORT}/api-docs`);
    console.log(`Swagger JSON available at http://198.244.227.48:${PORT}/swagger.json`);
});