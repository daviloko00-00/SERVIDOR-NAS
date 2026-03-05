import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';


// Rotas (precisaremos ajustar os arquivos de rota também)
import authRoutes from './routes/authRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import adminRoutes from "./routes/adminRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.set('io', io);
app.use(express.json());
app.use(express.static('public'));

app.use('/auth', authRoutes);
app.use('/files', fileRoutes);
app.use('/admin', adminRoutes);

io.on('connection', (socket) => {
  console.log({
    "message": "Novo dispositivo conectado",
    'socket.id': socket.id,
    'ip': socket.request.connection.remoteAddress,
    
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 NAS Cloud em http://0.0.0.0:${PORT}`);
});