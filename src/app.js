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
    const userDir = `./src/uploads/${req.user.id}`;
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });
const auth = require('./middlewares/auth');

// --- ROTAS ---

// Registro de Usuário
app.post('/auth/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({ data: { username, password: hashedPassword } });
    res.json({ message: "Usuário criado!", id: user.id });
  } catch (e) { res.status(400).json({ error: "Usuário já existe" }); }
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
  const fileData = await prisma.file.create({
    data: {
      name: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimeType: req.file.mimetype,
      userId: req.user.id
    }
  });
  
  // Notifica via Socket que um novo arquivo subiu
  req.io.emit('fileUpdate', { action: 'upload', file: fileData.name });
  res.json(fileData);
});

// Listar Arquivos
app.get('/files', auth, async (req, res) => {
  const files = await prisma.file.findMany({ where: { userId: req.user.id } });
  res.json(files);
});

// Deletar Arquivo
app.delete('/files/:id', auth, async (req, res) => {
  const file = await prisma.file.findFirst({ where: { id: parseInt(req.params.id), userId: req.user.id } });
  if (!file) return res.status(404).json({ error: "Arquivo não encontrado" });
  
  fs.unlinkSync(file.path); // Remove do disco
  await prisma.file.delete({ where: { id: file.id } });
  
  req.io.emit('fileUpdate', { action: 'delete', file: file.name });
  res.json({ message: "Removido com sucesso" });
});

module.exports = app;