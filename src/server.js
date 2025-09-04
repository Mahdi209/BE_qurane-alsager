const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./config/swagger.json');
const router = require('./routes/index.router');
const connectDB = require('./config/database');
const cookieParser = require('cookie-parser');
const { initSocket } = require('./socket');
const http = require('http');
const path = require('node:path');

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 6001;

// All middleware and routes go on the EXPRESS APP (not server)
const ROOT = path.resolve(__dirname, '../public');
app.locals.FILES_DIR = path.join(ROOT, 'files');

app.use(express.static('public'));
app.use('/files', express.static(app.locals.FILES_DIR));
app.use(
  cors({
    origin: 'https://192.168.15.146:3000/',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(express.json());
app.use(morgan('dev'));
app.use(cookieParser());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, { explorer: true }));

connectDB().then((r) => console.log('Database connected successfully'));

initSocket(server);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to my Express server 🚀' });
});

app.use('/api', router);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Listen on the HTTP SERVER (not the Express app)
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`API documentation available at http://localhost:${PORT}/api-docs`);
  console.log(`API documentation available at http://198.244.227.48:${PORT}/api-docs`);
  console.log(`Swagger JSON available at http://198.244.227.48:${PORT}/swagger.json`);
});
