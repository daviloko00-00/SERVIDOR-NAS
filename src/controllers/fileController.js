import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const uploadFile = async (req, res) => {
  try {
    const fileData = await prisma.file.create({
      data: {
        name: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimeType: req.file.mimetype,
        userId: req.user.id
      }
    });
    
    // Notifica via socket
    req.app.get('io').emit('fileUpdate', { action: 'upload', file: fileData.name });
    res.status(201).json(fileData);
  } catch (error) {
    res.status(500).json({ error: "Erro no upload" });
  }
};

export const listFiles = async (req, res) => {
  try {
    const files = await prisma.file.findMany({ where: { userId: req.user.id } });
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar arquivos" });
  }
};

export const downloadFile = async (req, res) => {
  const { id } = req.params;
  
  try {
    const file = await prisma.file.findFirst({
      where: { id: parseInt(id), userId: req.user.id }
    });

    if (!file) return res.status(404).json({ error: "Arquivo não encontrado" });

    // Envia o arquivo com o nome original para o navegador
    res.download(path.resolve(file.path), file.name);
  } catch (error) {
    res.status(500).json({ error: "Erro ao baixar arquivo" });
  }
};