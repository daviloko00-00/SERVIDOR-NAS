const express = require('express');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

// Configuração de Armazenamento NAS
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join('./src/uploads', String(req.user.id));
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const sanitizedName = path.basename(file.originalname).replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, Date.now() + '-' + sanitizedName);
  }
});

const upload = multer({ storage });
const auth = require('./middlewares/auth');

// --- ROTAS ---

// Registro de Usuário
app.post('/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password || password.length < 6) {
      return res.status(400).json({ error: "Username e password (mín 6 caracteres) são obrigatórios" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { username, password: hashedPassword } });
    res.json({ message: "Usuário criado!", id: user.id });
  } catch (e) {
    res.status(400).json({ error: "Usuário já existe ou erro ao criar" });
  }
});

// Login
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
  res.json({ token });
});

// Upload de Arquivo
app.post('/files/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }
    const filePath = path.join(req.file.destination, req.file.filename);
    const fileData = await prisma.file.create({
      data: {
        name: req.file.originalname,
        path: filePath,
        size: req.file.size,
        mimeType: req.file.mimetype,
        userId: req.user.id
      }
    });
    
    // Notifica via Socket que um novo arquivo subiu
    if (req.io) req.io.emit('fileUpdate', { action: 'upload', file: fileData.name });
    res.json(fileData);
  } catch (e) {
    res.status(500).json({ error: "Erro ao fazer upload do arquivo" });
  }
});

// Listar Arquivos
app.get('/files', auth, async (req, res) => {
  const files = await prisma.file.findMany({ where: { userId: req.user.id } });
  res.json(files);
});

// Deletar Arquivo
app.delete('/files/:id', auth, async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    if (isNaN(fileId)) {
      return res.status(400).json({ error: "ID de arquivo inválido" });
    }
    const file = await prisma.file.findFirst({ where: { id: fileId, userId: req.user.id } });
    if (!file) return res.status(404).json({ error: "Arquivo não encontrado" });
    
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path); // Remove do disco
    }
    await prisma.file.delete({ where: { id: file.id } });
    
    if (req.io) req.io.emit('fileUpdate', { action: 'delete', file: file.name });
    res.json({ message: "Removido com sucesso" });
  } catch (e) {
    res.status(500).json({ error: "Erro ao deletar arquivo" });
  }
});

module.exports = app;