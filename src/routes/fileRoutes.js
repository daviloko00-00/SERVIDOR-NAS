import express from 'express';
import * as fileController from '../controllers/fileController.js';
import auth from '../middlewares/auth.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();
/*
CONFIGURAÇÃO SEGURA DO MULTER
*/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'src/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s/g, "_");
    cb(null, uniqueName);
  }
});
/*
LIMITES DE SEGURANÇA
*/
const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 200 // 200MB
  }
});

/*
ROTAS
*/
router.post('/upload', auth, upload.single('file'), fileController.uploadFile);
router.get('/', auth, fileController.listFiles);
router.get('/download/:id', auth, fileController.downloadFile);
router.delete('/:id', auth, fileController.deleteFile);
export default router;